"use client"

import { useEditor, EditorContent } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import Placeholder from "@tiptap/extension-placeholder"
import Link from "@tiptap/extension-link"
import Image from "@tiptap/extension-image"
import { TextStyle, Color } from "@tiptap/extension-text-style"
import { useEffect, useCallback, useState } from "react"
import { cn } from "@/app/lib/utils"
import { Button } from "@/app/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/app/components/ui/popover"
import { ColorPicker } from "@/app/components/ui/color-picker"
import {
  Bold,
  Italic,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Link as LinkIcon,
  Undo,
  Redo,
  Code,
  Image as ImageIcon,
  Minus,
  Palette,
} from "lucide-react"

const TEXT_COLOR_PRESETS = [
  { value: "", label: "Default" },
  { value: "#000000", label: "Black" },
  { value: "#ffffff", label: "White" },
  { value: "#374151", label: "Gray" },
  { value: "#dc2626", label: "Red" },
  { value: "#2563eb", label: "Blue" },
  { value: "#059669", label: "Green" },
  { value: "#7c3aed", label: "Purple" },
  { value: "#d97706", label: "Amber" },
]

interface RichTextEditorProps {
  content: string
  onChange: (html: string) => void
  placeholder?: string
  className?: string
}

export function RichTextEditor({ content, onChange, placeholder = "Start writing…", className }: RichTextEditorProps) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3, 4] },
      }),
      Placeholder.configure({ placeholder }),
      Link.configure({ openOnClick: false, HTMLAttributes: { class: "underline text-[var(--sf-primary)]" } }),
      Image.configure({ inline: false, allowBase64: true }),
      TextStyle,
      Color.configure({ types: ["textStyle"] }),
    ],
    content,
    onUpdate: ({ editor: e }) => {
      onChange(e.getHTML())
    },
    editorProps: {
      attributes: {
        class: "prose prose-sm max-w-none focus:outline-none min-h-[120px] px-4 py-3",
      },
    },
  })

  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content, { emitUpdate: false })
    }
  }, [content, editor])

  const setLink = useCallback(() => {
    if (!editor) return
    const prev = editor.getAttributes("link").href
    const url = window.prompt("URL", prev ?? "")
    if (url === null) return
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run()
    } else {
      editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run()
    }
  }, [editor])

  const addImage = useCallback(() => {
    if (!editor) return
    const url = window.prompt("Image URL")
    if (url) editor.chain().focus().setImage({ src: url }).run()
  }, [editor])

  if (!editor) return null

  return (
    <div className={cn("rounded-xl border border-brand-deep/10 dark:border-white/10 bg-white/50 dark:bg-white/5 overflow-hidden transition-all duration-300", className)}>
      {/* Fixed toolbar */}
      <div className="flex flex-wrap items-center gap-0.5 px-2 py-1.5 border-b border-brand-deep/5 dark:border-white/5 bg-brand-cream/30 dark:bg-white/3">
        <ToolbarButton
          active={editor.isActive("bold")}
          onClick={() => editor.chain().focus().toggleBold().run()}
          icon={Bold}
          label="Bold"
        />
        <ToolbarButton
          active={editor.isActive("italic")}
          onClick={() => editor.chain().focus().toggleItalic().run()}
          icon={Italic}
          label="Italic"
        />
        <ToolbarButton
          active={editor.isActive("code")}
          onClick={() => editor.chain().focus().toggleCode().run()}
          icon={Code}
          label="Code"
        />
        <ToolbarSeparator />
        <ToolbarColorPicker editor={editor} />
        <ToolbarSeparator />
        <ToolbarButton
          active={editor.isActive("heading", { level: 2 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          icon={Heading2}
          label="Heading 2"
        />
        <ToolbarButton
          active={editor.isActive("heading", { level: 3 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          icon={Heading3}
          label="Heading 3"
        />
        <ToolbarSeparator />
        <ToolbarButton
          active={editor.isActive("bulletList")}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          icon={List}
          label="Bullet list"
        />
        <ToolbarButton
          active={editor.isActive("orderedList")}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          icon={ListOrdered}
          label="Ordered list"
        />
        <ToolbarButton
          active={editor.isActive("blockquote")}
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          icon={Quote}
          label="Quote"
        />
        <ToolbarSeparator />
        <ToolbarButton
          active={editor.isActive("link")}
          onClick={setLink}
          icon={LinkIcon}
          label="Link"
        />
        <ToolbarButton
          active={false}
          onClick={addImage}
          icon={ImageIcon}
          label="Image"
        />
        <ToolbarButton
          active={false}
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
          icon={Minus}
          label="Divider"
        />
        <div className="flex-1" />
        <ToolbarButton
          active={false}
          onClick={() => editor.chain().focus().undo().run()}
          icon={Undo}
          label="Undo"
          disabled={!editor.can().undo()}
        />
        <ToolbarButton
          active={false}
          onClick={() => editor.chain().focus().redo().run()}
          icon={Redo}
          label="Redo"
          disabled={!editor.can().redo()}
        />
      </div>

      <EditorContent editor={editor} />
    </div>
  )
}

function ToolbarColorPicker({ editor }: { editor: ReturnType<typeof useEditor> }) {
  const [customOpen, setCustomOpen] = useState(false)
  const current = editor?.getAttributes("textStyle").color ?? ""

  if (!editor) return null

  return (
    <Popover open={customOpen} onOpenChange={setCustomOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label="Text color"
          className={cn(
            "h-7 w-7 rounded-md transition-all duration-200",
            current && "bg-brand-green/10 text-brand-green dark:bg-brand-gold/10 dark:text-brand-gold"
          )}
        >
          <Palette className="w-3.5 h-3.5" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-56 p-2" align="start">
        <div className="grid grid-cols-3 gap-1 mb-2">
          {TEXT_COLOR_PRESETS.map(({ value, label }) => (
            <button
              key={value || "default"}
              type="button"
              onClick={() => {
                if (value) editor.chain().focus().setColor(value).run()
                else editor.chain().focus().unsetColor().run()
                setCustomOpen(false)
              }}
              className={cn(
                "h-7 rounded border text-xs",
                !value && "border-dashed border-brand-deep/20 dark:border-white/20"
              )}
              style={value ? { backgroundColor: value } : undefined}
              title={label}
            >
              {!value && <span className="text-[10px] opacity-70">Default</span>}
            </button>
          ))}
        </div>
        <div className="border-t border-brand-deep/10 dark:border-white/10 pt-2 mt-2">
          <span className="text-xs font-medium mb-1.5 block">Custom</span>
          <ColorPicker
            color={current && /^#[0-9A-Fa-f]{6}$/.test(current) ? current : "#000000"}
            onChange={(color) => editor.chain().focus().setColor(color).run()}
            showHexInput={true}
          />
        </div>
      </PopoverContent>
    </Popover>
  )
}

function ToolbarButton({ active, onClick, icon: Icon, label, disabled }: { active: boolean; onClick: () => void; icon: React.ComponentType<{ className?: string }>; label: string; disabled?: boolean }) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className={cn(
        "h-7 w-7 rounded-md transition-all duration-200",
        active && "bg-brand-green/10 text-brand-green dark:bg-brand-gold/10 dark:text-brand-gold",
        disabled && "opacity-30"
      )}
    >
      <Icon className="w-3.5 h-3.5" />
    </Button>
  )
}

function ToolbarSeparator() {
  return <div className="w-px h-5 bg-brand-deep/10 dark:bg-white/10 mx-1" />
}

