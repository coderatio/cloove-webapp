"use client"

import { useEffect, useCallback, useState } from "react"
import { useEditor, EditorContent } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import Placeholder from "@tiptap/extension-placeholder"
import TurndownService from "turndown"
import { cn } from "@/app/lib/utils"
import { Bold, Italic, List, ListOrdered, Sparkles, Loader2 } from "lucide-react"
import { Popover, PopoverTrigger, PopoverContent } from "@/app/components/ui/popover"
import { Textarea } from "@/app/components/ui/textarea"
import { Button } from "@/app/components/ui/button"

const turndown = new TurndownService({
  headingStyle: "atx",
  bulletListMarker: "-",
})

function htmlToMarkdown(html: string): string {
  if (!html || html === "<p></p>") return ""
  return turndown.turndown(html).trim()
}

function markdownToHtml(md: string): string {
  if (!md) return ""
  return md
    .split("\n\n")
    .map((block) => {
      if (block.startsWith("- ") || block.startsWith("* ")) {
        const items = block
          .split("\n")
          .map((line) => `<li>${line.replace(/^[-*]\s/, "")}</li>`)
          .join("")
        return `<ul>${items}</ul>`
      }
      if (/^\d+\.\s/.test(block)) {
        const items = block
          .split("\n")
          .map((line) => `<li>${line.replace(/^\d+\.\s/, "")}</li>`)
          .join("")
        return `<ol>${items}</ol>`
      }
      return `<p>${block.replace(/\n/g, "<br>")}</p>`
    })
    .join("")
}

interface MarkdownEditorProps {
  value: string
  onChange: (markdown: string) => void
  onGenerateAI?: (prompt: string, currentValue: string) => Promise<string>
  placeholder?: string
  className?: string
  minHeight?: string
}

export function MarkdownEditor({
  value,
  onChange,
  onGenerateAI,
  placeholder = "Start writing...",
  className,
  minHeight = "120px",
}: MarkdownEditorProps) {
  const handleUpdate = useCallback(
    ({ editor }: { editor: any }) => {
      onChange(htmlToMarkdown(editor.getHTML()))
    },
    [onChange]
  )

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: false,
        codeBlock: false,
        blockquote: false,
        horizontalRule: false,
      }),
      Placeholder.configure({ placeholder }),
    ],
    content: markdownToHtml(value),
    onUpdate: handleUpdate,
    editorProps: {
      attributes: {
        class: `outline-none prose prose-sm max-w-none dark:prose-invert prose-p:text-brand-deep/80 dark:prose-p:text-brand-cream/80 prose-strong:text-brand-deep dark:prose-strong:text-brand-cream prose-ul:text-brand-deep/80 dark:prose-ul:text-brand-cream/80 prose-ol:text-brand-deep/80 dark:prose-ol:text-brand-cream/80 prose-li:my-0.5`,
        style: `min-height: ${minHeight}`,
      },
    },
  })

  useEffect(() => {
    if (!editor) return
    const currentMd = htmlToMarkdown(editor.getHTML())
    if (currentMd !== value) {
      editor.commands.setContent(markdownToHtml(value))
    }
  }, [editor, value])

  if (!editor) return null

  return (
    <div
      className={cn(
        "rounded-xl border border-brand-deep/10 dark:border-white/10 bg-white/50 dark:bg-white/5 overflow-hidden transition-all duration-200 focus-within:border-brand-green/30 dark:focus-within:border-brand-gold/30 focus-within:ring-1 focus-within:ring-brand-green/20 dark:focus-within:ring-brand-gold/20",
        className
      )}
    >
      <div className="flex items-center gap-0.5 px-2 py-1.5 border-b border-brand-deep/10 dark:border-white/10">
        <ToolbarButton
          active={editor.isActive("bold")}
          onClick={() => editor.chain().focus().toggleBold().run()}
          title="Bold"
        >
          <Bold className="w-3.5 h-3.5" />
        </ToolbarButton>
        <ToolbarButton
          active={editor.isActive("italic")}
          onClick={() => editor.chain().focus().toggleItalic().run()}
          title="Italic"
        >
          <Italic className="w-3.5 h-3.5" />
        </ToolbarButton>
        <span className="w-px h-4 bg-brand-deep/10 dark:bg-white/10 mx-1" />
        <ToolbarButton
          active={editor.isActive("bulletList")}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          title="Bullet list"
        >
          <List className="w-3.5 h-3.5" />
        </ToolbarButton>
        <ToolbarButton
          active={editor.isActive("orderedList")}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          title="Numbered list"
        >
          <ListOrdered className="w-3.5 h-3.5" />
        </ToolbarButton>
        <div className="ml-auto flex items-center gap-1">
          <span className="w-px h-4 bg-brand-deep/10 dark:bg-white/10 mx-1" />
          <AIPopover editor={editor} currentValue={value} onGenerateAI={onGenerateAI} />
        </div>
      </div>
      <div className="px-3 py-2 text-sm">
        <EditorContent editor={editor} />
      </div>
    </div>
  )
}

function ToolbarButton({
  active,
  onClick,
  title,
  children,
}: {
  active: boolean
  onClick: () => void
  title: string
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={cn(
        "p-1.5 rounded-lg transition-colors",
        active
          ? "bg-brand-deep/10 dark:bg-white/10 text-brand-deep dark:text-brand-cream"
          : "text-brand-accent/40 dark:text-white/30 hover:text-brand-deep dark:hover:text-white hover:bg-brand-deep/5 dark:hover:bg-white/5"
      )}
    >
      {children}
    </button>
  )
}

function AIPopover({
  editor,
  currentValue,
  onGenerateAI,
}: {
  editor: any
  currentValue: string
  onGenerateAI?: (prompt: string, currentValue: string) => Promise<string>
}) {
  const [prompt, setPrompt] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedText, setGeneratedText] = useState("")
  const [error, setError] = useState("")
  const [open, setOpen] = useState(false)
  
  const handleGenerate = async () => {
    if (!prompt.trim()) return
    setIsGenerating(true)
    setError("")
    try {
      if (!onGenerateAI) {
        throw new Error("AI generation is not configured for this field.")
      }
      const text = await onGenerateAI(prompt.trim(), currentValue)
      setGeneratedText(text)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate content")
    } finally {
      setIsGenerating(false)
    }
  }

  const handleReplace = () => {
    if (!generatedText) return
    editor.chain().setContent(generatedText).focus('end').run()
    setGeneratedText("")
    setPrompt("")
    setOpen(false)
  }

  const handleAppend = () => {
    if (!generatedText) return
    editor.chain().focus('end').insertContent(generatedText).focus('end').run()
    setGeneratedText("")
    setPrompt("")
    setOpen(false)
  }

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen)
    if (!newOpen) {
      setGeneratedText("")
      setPrompt("")
      setError("")
    }
  }

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          title="Generate with AI"
          className={cn(
            "h-8 px-3 rounded-lg flex items-center gap-1.5",
            "text-brand-accent/40 dark:text-white/30 hover:text-brand-green dark:hover:text-brand-gold hover:bg-brand-green/5 dark:hover:bg-brand-gold/5",
            open && "bg-brand-green/10 text-brand-green dark:bg-brand-gold/10 dark:text-brand-gold"
          )}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span className="text-xs font-medium">AI</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-80 p-0 overflow-hidden shadow-xl" 
        align="end" 
        sideOffset={8}
        onInteractOutside={(e) => e.preventDefault()}
        onCloseAutoFocus={(e) => e.preventDefault()}
      >
        <div className="bg-gradient-to-br from-brand-green/5 to-transparent dark:from-brand-gold/5 p-4 border-b border-brand-deep/5 dark:border-white/5">
          <div className="flex items-center gap-2 mb-3">
             <div className="w-6 h-6 rounded-full bg-brand-green/10 dark:bg-brand-gold/10 flex items-center justify-center">
               <Sparkles className="w-3.5 h-3.5 text-brand-green dark:text-brand-gold" />
             </div>
             <span className="font-semibold text-sm text-brand-deep dark:text-brand-cream">AI Assistant</span>
          </div>
          
          {!generatedText ? (
            <>
              <Textarea 
                value={prompt}
                onChange={e => setPrompt(e.target.value)}
                onFocus={(e) => {
                  const length = e.currentTarget.value.length
                  e.currentTarget.setSelectionRange(length, length)
                }}
                placeholder="What should I write?"
                className="text-sm min-h-[80px] resize-none bg-white/80 dark:bg-black/20 focus-visible:ring-brand-green/20 dark:focus-visible:ring-brand-gold/20"
              />
              {error && (
                <p className="mt-2 text-xs text-red-600 dark:text-red-400">{error}</p>
              )}
              <div className="mt-3 flex justify-end gap-2">
                <Button onClick={() => setOpen(false)} variant="ghost" size="sm" className="rounded-xl px-4 h-9 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300">
                  Cancel
                </Button>
                <Button onClick={handleGenerate} disabled={isGenerating || !prompt.trim()} size="sm" className="rounded-xl px-5 h-9 bg-brand-green hover:bg-brand-green/90 dark:bg-brand-gold-700 dark:hover:bg-brand-gold-800 text-white dark:text-brand-deep shadow-sm">
                  {isGenerating ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-2" /> : <Sparkles className="w-3.5 h-3.5 mr-2" />}
                  Generate
                </Button>
              </div>
            </>
          ) : (
             <div className="text-sm text-brand-deep/80 dark:text-brand-cream/80 p-3 bg-white dark:bg-[#021a12] rounded-lg border border-brand-deep/5 dark:border-white/5 max-h-[200px] overflow-y-auto">
               {generatedText}
             </div>
          )}
        </div>
        {generatedText && (
           <div className="p-4 bg-slate-50/50 dark:bg-slate-900/50">
             <div className="flex items-center gap-2">
               <Button onClick={() => setGeneratedText("")} variant="ghost" size="sm" className="rounded-xl px-3 h-9 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300">
                 Cancel
               </Button>
               <Button onClick={handleReplace} variant="outline" size="sm" className="flex-1 rounded-xl px-4 h-9 border-brand-deep/10 dark:border-white/10 hover:bg-brand-deep/5 dark:hover:bg-white/5 text-brand-deep dark:text-brand-cream">Replace</Button>
               <Button onClick={handleAppend} size="sm" className="flex-1 rounded-xl px-4 h-9 bg-brand-deep hover:bg-brand-deep/90 text-brand-cream dark:bg-brand-cream dark:hover:bg-brand-cream/90 dark:text-brand-deep shadow-sm">Append</Button>
             </div>
           </div>
        )}
      </PopoverContent>
    </Popover>
  )
}
