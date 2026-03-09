"use client"

import { useEditor, EditorContent, Editor, Extension } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import Placeholder from "@tiptap/extension-placeholder"
import Link from "@tiptap/extension-link"
import Image from "@tiptap/extension-image"
import TextAlign from "@tiptap/extension-text-align"
import { TextStyle } from "@tiptap/extension-text-style"
import { Color } from "@tiptap/extension-color"
import { FontFamily } from "@tiptap/extension-font-family"
import { useEffect, useCallback, useState, useRef } from "react"
import { cn } from "@/app/lib/utils"
import { Button } from "@/app/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/app/components/ui/popover"
import { ColorPicker } from "@/app/components/ui/color-picker"
import { Input } from "@/app/components/ui/input"
import { GOOGLE_FONTS_ALLOWED } from "@/app/domains/storefront/lib/theme-defaults"
import {
  Bold,
  Italic,
  Heading1,
  Heading2,
  Heading3,
  Type,
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
  AlignLeft,
  AlignCenter,
  AlignRight,
  ChevronDown,
  MoreHorizontal,
} from "lucide-react"

const FONT_SIZE_QUICK_OPTIONS = ["12px", "14px", "16px", "18px", "24px", "32px", "48px"]

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

const FontSize = Extension.create({
  name: "fontSize",
  addOptions() {
    return {
      types: ["textStyle"],
    }
  },
  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          fontSize: {
            default: null,
            parseHTML: (element) => element.style.fontSize.replace(/['"]+/g, ""),
            renderHTML: (attributes) => {
              if (!attributes.fontSize) return {}
              return { style: `font-size: ${attributes.fontSize}` }
            },
          },
        },
      },
    ]
  },
  addCommands() {
    return {
      setFontSize: (fontSize: string) => ({ chain }: { chain: any }) => {
        return chain().setMark("textStyle", { fontSize }).run()
      },
      unsetFontSize: () => ({ chain }: { chain: any }) => {
        return chain().setMark("textStyle", { fontSize: null }).removeEmptyTextStyle().run()
      },
    } as any
  },
})

interface RichTextEditorProps {
  content: string
  onChange: (html: string) => void
  placeholder?: string
  className?: string
}

export function RichTextEditor({ content, onChange, placeholder = "Start writing…", className }: RichTextEditorProps) {
  const [fontsLoaded, setFontsLoaded] = useState<Set<string>>(new Set())

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3, 4] },
      }),
      Placeholder.configure({ placeholder }),
      Link.configure({ openOnClick: false, HTMLAttributes: { class: "underline text-[var(--sf-primary)]" } }),
      Image.configure({ inline: false, allowBase64: true }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      TextStyle,
      Color.configure({ types: ["textStyle"] }),
      FontFamily.configure({ types: ["textStyle"] }),
      FontSize.configure({ types: ["textStyle"] }),
    ],
    content,
    onUpdate: ({ editor: e }) => {
      onChange(e.getHTML())
    },
    editorProps: {
      attributes: {
        class: "prose prose-sm max-w-none focus:outline-none min-h-[120px] px-4 py-3 [&_ul]:list-disc [&_ul]:ml-4 [&_ol]:list-decimal [&_ol]:ml-4 text-brand-deep dark:text-brand-cream",
      },
    },
  })

  useEffect(() => {
    if (!editor) return
    const currentHTML = editor.getHTML()
    if (content !== currentHTML && content !== "") {
      // Small delay to ensure we don't conflict with in-progress updates
      const timer = setTimeout(() => {
        if (content !== editor.getHTML()) {
          editor.commands.setContent(content, { emitUpdate: false })
        }
      }, 0)
      return () => clearTimeout(timer)
    }
  }, [content, editor])

  // Load Google Fonts dynamically when they are used in the editor
  useEffect(() => {
    if (!editor) return

    const checkFonts = () => {
      const html = editor.getHTML()
      const usedFonts = GOOGLE_FONTS_ALLOWED.filter(font => html.includes(`font-family: ${font}`) || html.includes(`font-family: '${font}'`))

      const newFonts = usedFonts.filter(f => !fontsLoaded.has(f))
      if (newFonts.length > 0) {
        newFonts.forEach(font => {
          const link = document.createElement("link")
          link.href = `https://fonts.googleapis.com/css2?family=${font.replace(/ /g, "+")}:wght@400;500;600;700&display=swap`
          link.rel = "stylesheet"
          document.head.appendChild(link)
        })
        setFontsLoaded(prev => new Set([...prev, ...newFonts]))
      }
    }

    editor.on("update", checkFonts)
    checkFonts()

    return () => {
      editor.off("update", checkFonts)
    }
  }, [editor, fontsLoaded])

  const addImage = useCallback(() => {
    if (!editor) return
    const url = window.prompt("Image URL")
    if (url) editor.chain().focus().setImage({ src: url }).run()
  }, [editor])

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

  return (
    <div className={cn("rounded-3xl border border-brand-deep/10 dark:border-white/10 bg-white/50 dark:bg-white/5 overflow-hidden transition-all duration-300", className)}>
      {/* Toolbar: always visible so formatting options are clear */}
      <div className="flex flex-wrap items-center gap-0.5 px-2 py-1.5 border-b border-brand-deep/5 dark:border-white/5 bg-brand-cream/30 dark:bg-white/3">
        {!editor ? (
          <span className="text-xs text-brand-deep/50 dark:text-brand-cream/50 px-2 py-1.5">Loading editor…</span>
        ) : (
          <>
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
            <ToolbarSeparator />
            <ToolbarFontFamily editor={editor} />
            <ToolbarFontSize editor={editor} />
            <ToolbarSeparator />
            <ToolbarColorPicker editor={editor} />
            <ToolbarSeparator />
            <ToolbarFormatting editor={editor} />
            <ToolbarSeparator />
            <div className="flex items-center gap-0.5">
              <ToolbarButton
                active={editor.isActive({ textAlign: "left" })}
                onClick={() => editor.chain().focus().setTextAlign("left").run()}
                icon={AlignLeft}
                label="Align Left"
              />
              <ToolbarButton
                active={editor.isActive({ textAlign: "center" })}
                onClick={() => editor.chain().focus().setTextAlign("center").run()}
                icon={AlignCenter}
                label="Align Center"
              />
              <ToolbarButton
                active={editor.isActive({ textAlign: "right" })}
                onClick={() => editor.chain().focus().setTextAlign("right").run()}
                icon={AlignRight}
                label="Align Right"
              />
            </div>
            <ToolbarSeparator />
            <ToolbarMore editor={editor} setLink={setLink} addImage={addImage} />

            <div className="flex-1" />

            <div className="flex items-center gap-0.5 border-l border-brand-deep/5 dark:border-white/5 pl-2 ml-1">
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
          </>
        )}
      </div>

      {editor ? <EditorContent editor={editor} /> : <div className="min-h-[120px] px-4 py-3 text-sm text-brand-deep/40 dark:text-brand-cream/40">Loading…</div>}
    </div>
  )
}

function ToolbarFontFamily({ editor }: { editor: Editor }) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState("")
  const current = editor?.getAttributes("textStyle").fontFamily ?? ""

  const filteredFonts = GOOGLE_FONTS_ALLOWED.filter(f => f.toLowerCase().includes(search.toLowerCase()))
  const isCustomFont = current && GOOGLE_FONTS_ALLOWED.includes(current as any)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          aria-label="Font family"
          className="h-7 px-2 rounded-lg text-xs font-medium gap-1 min-w-[100px] justify-between"
        >
          <span className="truncate max-w-[80px]">
            {isCustomFont ? current : "Default"}
          </span>
          <ChevronDown className="w-3 h-3 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-48 p-0" align="start">
        <div className="p-2 border-b border-brand-deep/5">
          <Input
            placeholder="Search fonts..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-7 text-xs"
          />
        </div>
        <div className="max-h-60 overflow-y-auto p-1">
          <Button
            type="button"
            variant="ghost"
            onClick={() => {
              editor.chain().focus().unsetFontFamily().run()
              setOpen(false)
            }}
            className={cn(
              "w-full justify-start px-2 py-1.5 h-auto text-xs font-normal",
              !current && "bg-brand-green/10 text-brand-green dark:bg-brand-gold/10 dark:text-brand-gold"
            )}
          >
            Default
          </Button>
          {filteredFonts.map((f) => (
            <Button
              key={f}
              type="button"
              variant="ghost"
              onClick={() => {
                editor.chain().focus().setFontFamily(f).run()
                setOpen(false)
              }}
              style={{ fontFamily: f }}
              className={cn(
                "w-full justify-start px-2 py-1.5 h-auto text-xs font-normal",
                current === f && "bg-brand-green/10 text-brand-green dark:bg-brand-gold/10 dark:text-brand-gold"
              )}
            >
              {f}
            </Button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  )
}

function ToolbarFontSize({ editor }: { editor: Editor }) {
  const [open, setOpen] = useState(false)
  const current = editor?.getAttributes("textStyle").fontSize ?? ""
  const [inputValue, setInputValue] = useState(current.replace("px", ""))

  useEffect(() => {
    setInputValue(current.replace("px", ""))
  }, [current])

  if (!editor) return null

  const applySize = (val: string) => {
    const size = val.includes("px") || val.includes("rem") || val.includes("em") ? val : `${val}px`
    if (val) editor.chain().focus().setFontSize(size).run()
    else editor.chain().focus().unsetFontSize().run()
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <div className="flex items-center gap-0.5 bg-black/5 dark:bg-white/5 rounded-lg px-1 group focus-within:ring-1 focus-within:ring-brand-green/30 transition-all border border-transparent shadow-sm">
          <input
            type="text"
            className="w-8 h-7 bg-transparent border-none text-[10px] text-center focus:ring-0 focus:outline-none p-0"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                applySize(inputValue)
                setOpen(false)
              }
            }}
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-7 w-4 p-0 rounded-none hover:bg-transparent"
            onClick={() => setOpen(!open)}
          >
            <ChevronDown className="w-3 h-3 opacity-50" />
          </Button>
        </div>
      </PopoverTrigger>
      <PopoverContent className="w-24 p-1" align="start">
        {FONT_SIZE_QUICK_OPTIONS.map((size) => {
          const isActive = current === size || current === size.replace("px", "")
          return (
            <Button
              key={size}
              type="button"
              variant="ghost"
              onClick={() => {
                applySize(size)
                setOpen(false)
              }}
              className={cn(
                "w-full justify-start px-2 py-1 h-auto text-xs font-normal transition-colors",
                isActive
                  ? "bg-brand-green/10 text-brand-green dark:bg-brand-gold/10 dark:text-brand-gold font-semibold"
                  : "hover:bg-brand-deep/5 dark:hover:bg-white/5"
              )}
            >
              {size.replace("px", "")}
            </Button>
          )
        })}
      </PopoverContent>
    </Popover>
  )
}

function ToolbarFormatting({ editor }: { editor: Editor }) {
  const [open, setOpen] = useState(false)

  if (!editor) return null

  const options = [
    { label: "Paragraph", active: editor.isActive("paragraph"), onClick: () => editor.chain().focus().setParagraph().run(), icon: Type },
    { label: "Heading 1", active: editor.isActive("heading", { level: 1 }), onClick: () => editor.chain().focus().toggleHeading({ level: 1 }).run(), icon: Heading1 },
    { label: "Heading 2", active: editor.isActive("heading", { level: 2 }), onClick: () => editor.chain().focus().toggleHeading({ level: 2 }).run(), icon: Heading2 },
    { label: "Heading 3", active: editor.isActive("heading", { level: 3 }), onClick: () => editor.chain().focus().toggleHeading({ level: 3 }).run(), icon: Heading3 },
  ]

  const current = options.find(o => o.active) ?? options[0]

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-7 px-2 rounded-md text-xs font-medium gap-1"
        >
          {current.label}
          <ChevronDown className="w-3 h-3 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-40 p-1" align="start">
        {options.map((opt) => (
          <Button
            key={opt.label}
            type="button"
            variant="ghost"
            onClick={() => {
              opt.onClick()
              setOpen(false)
            }}
            className={cn(
              "w-full justify-start px-2 py-1.5 h-auto text-xs font-normal flex items-center gap-2",
              opt.active && "bg-brand-green/10 text-brand-green dark:bg-brand-gold/10 dark:text-brand-gold"
            )}
          >
            <opt.icon className="w-3.5 h-3.5" />
            {opt.label}
          </Button>
        ))}
      </PopoverContent>
    </Popover>
  )
}

function ToolbarColorPicker({ editor }: { editor: Editor }) {
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
            <Button
              key={value || "default"}
              type="button"
              variant="ghost"
              onClick={() => {
                if (value) editor.chain().focus().setColor(value).run()
                else editor.chain().focus().unsetColor().run()
                setCustomOpen(false)
              }}
              className={cn(
                "h-7 w-full p-0 rounded border text-xs",
                !value && "border-dashed border-brand-deep/20 dark:border-white/20"
              )}
              style={value ? { backgroundColor: value } : undefined}
              title={label}
            >
              {!value && <span className="text-[10px] opacity-70">Default</span>}
            </Button>
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

function ToolbarMore({ editor, setLink, addImage }: { editor: Editor; setLink: () => void; addImage: () => void }) {
  const [open, setOpen] = useState(false)

  if (!editor) return null

  const items = [
    { label: "Bullet List", active: editor.isActive("bulletList"), onClick: () => editor.chain().focus().toggleBulletList().run(), icon: List },
    { label: "Ordered List", active: editor.isActive("orderedList"), onClick: () => editor.chain().focus().toggleOrderedList().run(), icon: ListOrdered },
    { label: "Quote", active: editor.isActive("blockquote"), onClick: () => editor.chain().focus().toggleBlockquote().run(), icon: Quote },
    { label: "Divider", active: false, onClick: () => editor.chain().focus().setHorizontalRule().run(), icon: Minus },
    { label: "Code", active: editor.isActive("code"), onClick: () => editor.chain().focus().toggleCode().run(), icon: Code },
    { label: "Link", active: editor.isActive("link"), onClick: setLink, icon: LinkIcon },
    { label: "Image", active: false, onClick: addImage, icon: ImageIcon },
  ]

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label="More"
          className="h-7 w-7 rounded-md"
        >
          <MoreHorizontal className="w-3.5 h-3.5" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-44 p-1" align="end">
        <div className="grid grid-cols-1 gap-0.5">
          {items.map((item) => (
            <Button
              key={item.label}
              type="button"
              variant="ghost"
              onClick={() => {
                item.onClick()
                setOpen(false)
              }}
              className={cn(
                "w-full justify-start px-2 py-1.5 h-auto text-xs font-normal flex items-center gap-2 hover:bg-brand-deep/5 dark:hover:bg-white/5 transition-colors",
                item.active && "bg-brand-green/10 text-brand-green dark:bg-brand-gold/10 dark:text-brand-gold"
              )}
            >
              <item.icon className="w-3.5 h-3.5" />
              {item.label}
            </Button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  )
}

function ToolbarSeparator() {
  return <div className="w-px h-5 bg-brand-deep/10 dark:bg-white/10 mx-1" />
}


