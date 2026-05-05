"use client"

import { useEffect, useCallback } from "react"
import { useEditor, EditorContent } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import Placeholder from "@tiptap/extension-placeholder"
import TurndownService from "turndown"
import { cn } from "@/app/lib/utils"
import { Bold, Italic, List, ListOrdered } from "lucide-react"

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
  placeholder?: string
  className?: string
  minHeight?: string
}

export function MarkdownEditor({
  value,
  onChange,
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
      <div className="flex items-center gap-0.5 px-2 py-1.5 border-b border-brand-deep/5 dark:border-white/5">
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
