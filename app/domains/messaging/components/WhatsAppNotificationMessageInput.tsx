"use client"

import * as React from "react"
import { createPortal } from "react-dom"
import { useEditor, EditorContent, type Editor } from "@tiptap/react"
import { NodeSelection, type EditorState } from "@tiptap/pm/state"
import type { Node as PMNode } from "@tiptap/pm/model"
import type { EditorView } from "@tiptap/pm/view"
import StarterKit from "@tiptap/starter-kit"
import Placeholder from "@tiptap/extension-placeholder"
import { Bold, Italic, Strikethrough, Code, Braces, Eye, PencilLine, CircleHelp } from "lucide-react"
import { cn } from "@/app/lib/utils"
import { Button } from "@/app/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/app/components/ui/dropdown-menu"
import { Popover, PopoverContent, PopoverTrigger } from "@/app/components/ui/popover"
import {
  ORDER_WHATSAPP_TEMPLATE_VARIABLES,
  substituteWhatsAppVariableSamples,
  type WhatsAppTemplateVariable,
} from "@/app/domains/messaging/constants/notification-template-variables"
import { WhatsappVariable } from "@/app/domains/messaging/tiptap/whatsapp-variable-extension"
import { WhatsAppFormattedSamplePreview } from "@/app/domains/messaging/tiptap/whatsapp-preview"
import {
  docPosForParaStringOffset,
  normalizeTrailingNewlines,
  textBeforeCursorInParagraph,
  whatsappDocToString,
  whatsappStringToDoc,
} from "@/app/domains/messaging/tiptap/whatsapp-doc"

export type { WhatsAppTemplateVariable }

export { ORDER_WHATSAPP_TEMPLATE_VARIABLES }

/** Marks that apply to the next character when the selection is collapsed (document context + “armed” toggles). */
function effectiveCollapsedInsertionMarks(state: EditorState) {
  const { selection, storedMarks } = state
  if (storedMarks !== null) return storedMarks
  return selection.$from.marks()
}

/**
 * Toolbar highlight for bold/italic/strike/code. With a range, use `isActive`. With a caret, mirror
 * ProseMirror insertion marks: when the user toggles a format before typing, `storedMarks` is set and
 * must count as active; when `storedMarks` is null, fall back to marks at the cursor position.
 */
function toolbarMarkActive(editor: Editor, markName: "bold" | "italic" | "strike" | "code"): boolean {
  const type = editor.schema.marks[markName]
  if (!type) return false
  const { selection } = editor.state
  if (!selection.empty) {
    return editor.isActive(markName)
  }
  return effectiveCollapsedInsertionMarks(editor.state).some((m) => m.type.name === markName)
}

function getOpenBraceFilter(value: string, caret: number): { start: number; filter: string } | null {
  if (caret <= 0) return null
  const before = value.slice(0, caret)
  const start = before.lastIndexOf("{")
  if (start === -1) return null
  const inner = before.slice(start + 1)
  if (inner.includes("}")) return null
  if (!/^[a-zA-Z0-9_]*$/.test(inner)) return null
  return { start, filter: inner }
}

function filterVariables(variables: WhatsAppTemplateVariable[], filter: string) {
  const q = filter.toLowerCase()
  return variables.filter(
    (v) =>
      v.key.toLowerCase().includes(q) ||
      v.label.toLowerCase().includes(q) ||
      `{${v.key}}`.toLowerCase().includes(q)
  )
}

/** Matches DropdownMenuContent `sideOffset` so height math lines up with Radix placement */
const VARIABLES_MENU_SIDE_OFFSET_PX = 6
/** Minimum space between the bottom of the menu and the visual viewport bottom */
const VARIABLES_MENU_VIEWPORT_BOTTOM_GAP_PX = 28
const VARIABLES_MENU_MAX_CAP_PX = 22 * 16
const VARIABLES_MENU_MIN_HEIGHT_PX = 140

function variablesDropdownMaxHeightPx(triggerEl: HTMLElement | null): number | null {
  if (typeof window === "undefined" || !triggerEl) return null
  const vv = window.visualViewport
  const vh = vv?.height ?? window.innerHeight
  const rect = triggerEl.getBoundingClientRect()
  const available = vh - rect.bottom - VARIABLES_MENU_SIDE_OFFSET_PX - VARIABLES_MENU_VIEWPORT_BOTTOM_GAP_PX
  return Math.max(
    VARIABLES_MENU_MIN_HEIGHT_PX,
    Math.min(VARIABLES_MENU_MAX_CAP_PX, available)
  )
}

function resolveWhatsappVariablePos(doc: PMNode, view: EditorView, chip: HTMLElement): number | null {
  const pos = view.posAtDOM(chip, 0)
  const $pos = doc.resolve(pos)
  if ($pos.nodeAfter?.type.name === "whatsappVariable") return pos
  if ($pos.nodeBefore?.type.name === "whatsappVariable") {
    return pos - $pos.nodeBefore.nodeSize
  }
  for (const p of [pos, pos - 1, pos + 1]) {
    if (p < 0 || p > doc.content.size) continue
    try {
      const ns = NodeSelection.create(doc, p)
      if (ns.node.type.name === "whatsappVariable") return p
    } catch {
      /* invalid selection position */
    }
  }
  return null
}

export interface WhatsAppNotificationMessageInputProps {
  value: string
  onChange: (value: string) => void
  variables?: WhatsAppTemplateVariable[]
  placeholder?: string
  minHeight?: number
  disabled?: boolean
  className?: string
  textareaClassName?: string
  footer?: React.ReactNode | null
  id?: string
  /** When true (default), shows a compact help control in the toolbar. Set false to hide it. */
  showDefaultFooter?: boolean
  /**
   * Non-empty values override static samples in the eye-toggle preview (e.g. real customer name,
   * order id, business name from the current ticket or workspace).
   */
  previewVariableContext?: Record<string, string | undefined>
}

export function WhatsAppNotificationMessageInput({
  value,
  onChange,
  variables = ORDER_WHATSAPP_TEMPLATE_VARIABLES,
  placeholder = "Write your message…",
  minHeight = 120,
  disabled = false,
  className,
  textareaClassName,
  footer,
  id,
  showDefaultFooter = true,
  previewVariableContext,
}: WhatsAppNotificationMessageInputProps) {
  const knownKeys = React.useMemo(() => new Set(variables.map((v) => v.key)), [variables])
  const variablesRef = React.useRef(variables)
  const listId = React.useId()
  const replaceListId = React.useId()
  const isInternal = React.useRef(false)
  const onChangeRef = React.useRef(onChange)

  const [auto, setAuto] = React.useState<{
    start: number
    filter: string
    activeIndex: number
    /** ProseMirror position used with coordsAtPos for floating autocomplete */
    anchorPos: number
  } | null>(null)
  const autoRef = React.useRef(auto)
  const disabledRef = React.useRef(disabled)
  const [autoCoords, setAutoCoords] = React.useState<{ left: number; top: number } | null>(null)
  const [replacePicker, setReplacePicker] = React.useState<{
    pos: number
    anchorPos: number
    currentKey: string
  } | null>(null)
  const replacePickerRef = React.useRef(replacePicker)
  const [replaceCoords, setReplaceCoords] = React.useState<{ left: number; top: number } | null>(null)
  /** Mount `{` autocomplete inside the dialog tree so Radix modal does not swallow pointer events (body portals are "outside"). */
  const [autoCompletePortalHost, setAutoCompletePortalHost] = React.useState<HTMLDivElement | null>(null)

  const [variablesMenuOpen, setVariablesMenuOpen] = React.useState(false)
  const [variablesMenuMaxPx, setVariablesMenuMaxPx] = React.useState<number | null>(null)
  const variablesTriggerRef = React.useRef<HTMLButtonElement>(null)

  const [samplePreviewOpen, setSamplePreviewOpen] = React.useState(false)

  const recalcVariablesMenuMaxHeight = React.useCallback(() => {
    const next = variablesDropdownMaxHeightPx(variablesTriggerRef.current)
    if (next != null) setVariablesMenuMaxPx(next)
  }, [])

  React.useLayoutEffect(() => {
    if (!variablesMenuOpen) return
    recalcVariablesMenuMaxHeight()
    const raf = requestAnimationFrame(() => recalcVariablesMenuMaxHeight())
    const vv = window.visualViewport
    window.addEventListener("resize", recalcVariablesMenuMaxHeight)
    document.addEventListener("scroll", recalcVariablesMenuMaxHeight, true)
    vv?.addEventListener("resize", recalcVariablesMenuMaxHeight)
    vv?.addEventListener("scroll", recalcVariablesMenuMaxHeight)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener("resize", recalcVariablesMenuMaxHeight)
      document.removeEventListener("scroll", recalcVariablesMenuMaxHeight, true)
      vv?.removeEventListener("resize", recalcVariablesMenuMaxHeight)
      vv?.removeEventListener("scroll", recalcVariablesMenuMaxHeight)
    }
  }, [variablesMenuOpen, recalcVariablesMenuMaxHeight])

  React.useEffect(() => {
    variablesRef.current = variables
  }, [variables])
  React.useEffect(() => {
    onChangeRef.current = onChange
  }, [onChange])
  React.useLayoutEffect(() => {
    autoRef.current = auto
  }, [auto])
  React.useLayoutEffect(() => {
    replacePickerRef.current = replacePicker
  }, [replacePicker])
  React.useEffect(() => {
    disabledRef.current = disabled
  }, [disabled])

  const autoListScrollRef = React.useRef<HTMLDivElement>(null)
  const replaceListScrollRef = React.useRef<HTMLDivElement>(null)

  const filtered = React.useMemo(() => {
    if (!auto) return []
    return filterVariables(variables, auto.filter)
  }, [auto, variables])

  React.useLayoutEffect(() => {
    if (!replacePicker) return
    const root = replaceListScrollRef.current
    if (!root) return
    const selected = root.querySelector(
      "[data-replace-selected=\"true\"]"
    ) as HTMLElement | null
    selected?.scrollIntoView({ block: "nearest", inline: "nearest" })
  }, [replacePicker])

  React.useLayoutEffect(() => {
    if (!auto || filtered.length === 0) return
    const root = autoListScrollRef.current
    if (!root) return
    const active = root.querySelector(
      '[role="option"][aria-selected="true"]'
    ) as HTMLElement | null
    active?.scrollIntoView({ block: "nearest", inline: "nearest" })
  }, [auto, filtered])

  const syncAutocompleteFromEditor = React.useCallback((ed: Editor) => {
    const pos = ed.state.selection.from
    const before = textBeforeCursorInParagraph(ed.state, pos)
    const hit = getOpenBraceFilter(before, before.length)
    if (!hit) {
      setAuto(null)
      return
    }
    const list = filterVariables(variablesRef.current, hit.filter)
    if (list.length === 0) {
      setAuto(null)
      return
    }
    setAuto((prev) => {
      const sameToken =
        prev && prev.start === hit.start && prev.filter === hit.filter
      const nextIndex = sameToken && prev ? Math.min(prev.activeIndex, list.length - 1) : 0
      return { start: hit.start, filter: hit.filter, activeIndex: nextIndex, anchorPos: pos }
    })
  }, [])

  const chipMouseDownRef = React.useRef<(view: EditorView, event: MouseEvent) => boolean>(() => false)

  const stableChipDomHandlers = React.useMemo(
    () => ({
      mousedown(view: EditorView, event: MouseEvent) {
        return chipMouseDownRef.current(view, event)
      },
    }),
    []
  )

  React.useLayoutEffect(() => {
    chipMouseDownRef.current = (view, event) => {
      if (disabledRef.current) return false
      const chip = (event.target as HTMLElement).closest("[data-wa-var]")
      if (!chip || !view.dom.contains(chip)) return false
      event.preventDefault()
      event.stopPropagation()
      setAuto(null)
      const doc = view.state.doc
      const pos = resolveWhatsappVariablePos(doc, view, chip as HTMLElement)
      if (pos == null) return false
      try {
        NodeSelection.create(doc, pos)
      } catch {
        return false
      }
      const prevOpen = replacePickerRef.current
      if (prevOpen && prevOpen.pos === pos) {
        replacePickerRef.current = null
        setReplacePicker(null)
        const tr = view.state.tr.setSelection(NodeSelection.create(doc, pos))
        view.dispatch(tr)
        view.focus()
        return true
      }
      const $r = doc.resolve(pos)
      const wa = $r.nodeAfter
      const currentKey =
        wa?.type.name === "whatsappVariable" ? String(wa.attrs?.key ?? "") : ""
      const rp = { pos, anchorPos: pos, currentKey }
      replacePickerRef.current = rp
      setReplacePicker(rp)
      const tr = view.state.tr.setSelection(NodeSelection.create(doc, pos))
      view.dispatch(tr)
      view.focus()
      return true
    }
  })

  const editor = useEditor(
    {
      immediatelyRender: false,
      /** Default in TipTap v3 is false — without this, React never re-renders on selection moves, so the toolbar stays stuck showing old mark "active" state. */
      shouldRerenderOnTransaction: true,
      extensions: [
        StarterKit.configure({
          heading: false,
          bulletList: false,
          orderedList: false,
          listItem: false,
          blockquote: false,
          codeBlock: false,
          horizontalRule: false,
        }),
        WhatsappVariable,
        Placeholder.configure({ placeholder }),
      ],
      content: whatsappStringToDoc(value, knownKeys),
      editable: !disabled,
      editorProps: {
        attributes: {
          ...(id ? { id } : {}),
          class: cn(
            "min-h-[var(--wm-min)] w-full px-3 py-2.5 text-sm leading-relaxed text-brand-deep outline-none dark:text-brand-cream",
            "prose prose-sm max-w-none dark:prose-invert prose-p:my-0",
            "prose-strong:text-brand-deep dark:prose-strong:text-brand-cream",
            "prose-em:text-brand-deep dark:prose-em:text-brand-cream",
            "[&_.ProseMirror]:min-h-[var(--wm-min)] [&_.ProseMirror]:outline-none",
            textareaClassName
          ),
          style: `--wm-min: ${minHeight}px`,
        },
        handleDOMEvents: stableChipDomHandlers,
      },
      onUpdate: ({ editor: ed }) => {
        isInternal.current = true
        const next = normalizeTrailingNewlines(whatsappDocToString(ed.getJSON()))
        onChangeRef.current(next)
        syncAutocompleteFromEditor(ed)
      },
      onSelectionUpdate: ({ editor: ed }) => {
        syncAutocompleteFromEditor(ed)
      },
    },
    [knownKeys, placeholder, disabled, minHeight, textareaClassName, id, syncAutocompleteFromEditor, stableChipDomHandlers]
  )

  const measureAutocompleteCoords = React.useCallback(
    (anchorPos: number) => {
      if (!editor) {
        setAutoCoords(null)
        return
      }
      const host = autoCompletePortalHost
      if (!host) {
        setAutoCoords(null)
        return
      }
      try {
        const hostRect = host.getBoundingClientRect()
        const coords = editor.view.coordsAtPos(anchorPos)
        const gap = 6
        const approxListH = 168
        const margin = 8
        const hostH = hostRect.height
        let left = coords.left - hostRect.left
        let top = coords.bottom - hostRect.top + gap
        if (top + approxListH > hostH - margin) {
          top = Math.max(margin, coords.top - hostRect.top - approxListH - gap)
        }
        const maxW = 320
        left = Math.min(Math.max(margin, left), hostRect.width - maxW - margin)
        setAutoCoords({ left, top })
      } catch {
        setAutoCoords(null)
      }
    },
    [editor, autoCompletePortalHost]
  )

  const measureReplaceCoords = React.useCallback(
    (anchorPos: number) => {
      if (!editor) {
        setReplaceCoords(null)
        return
      }
      const host = autoCompletePortalHost
      if (!host) {
        setReplaceCoords(null)
        return
      }
      try {
        const hostRect = host.getBoundingClientRect()
        const coords = editor.view.coordsAtPos(anchorPos)
        const gap = 6
        const approxListH = 220
        const margin = 8
        const hostH = hostRect.height
        let left = coords.left - hostRect.left
        let top = coords.bottom - hostRect.top + gap
        if (top + approxListH > hostH - margin) {
          top = Math.max(margin, coords.top - hostRect.top - approxListH - gap)
        }
        const maxW = 320
        left = Math.min(Math.max(margin, left), hostRect.width - maxW - margin)
        setReplaceCoords({ left, top })
      } catch {
        setReplaceCoords(null)
      }
    },
    [editor, autoCompletePortalHost]
  )

  React.useLayoutEffect(() => {
    if (!auto || filtered.length === 0) {
      setAutoCoords(null)
      return
    }
    measureAutocompleteCoords(auto.anchorPos)
  }, [auto, filtered.length, measureAutocompleteCoords, autoCompletePortalHost])

  React.useLayoutEffect(() => {
    if (!replacePicker) {
      setReplaceCoords(null)
      return
    }
    measureReplaceCoords(replacePicker.anchorPos)
  }, [replacePicker, measureReplaceCoords, autoCompletePortalHost])

  React.useEffect(() => {
    if (!auto) return
    const onReposition = () => measureAutocompleteCoords(auto.anchorPos)
    window.addEventListener("scroll", onReposition, true)
    window.addEventListener("resize", onReposition)
    const vv = window.visualViewport
    vv?.addEventListener("resize", onReposition)
    vv?.addEventListener("scroll", onReposition)
    return () => {
      window.removeEventListener("scroll", onReposition, true)
      window.removeEventListener("resize", onReposition)
      vv?.removeEventListener("resize", onReposition)
      vv?.removeEventListener("scroll", onReposition)
    }
  }, [auto, measureAutocompleteCoords])

  React.useEffect(() => {
    if (!replacePicker) return
    const onReposition = () => measureReplaceCoords(replacePicker.anchorPos)
    window.addEventListener("scroll", onReposition, true)
    window.addEventListener("resize", onReposition)
    const vv = window.visualViewport
    vv?.addEventListener("resize", onReposition)
    vv?.addEventListener("scroll", onReposition)
    return () => {
      window.removeEventListener("scroll", onReposition, true)
      window.removeEventListener("resize", onReposition)
      vv?.removeEventListener("resize", onReposition)
      vv?.removeEventListener("scroll", onReposition)
    }
  }, [replacePicker, measureReplaceCoords])

  React.useEffect(() => {
    if (!replacePicker) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault()
        setReplacePicker(null)
      }
    }
    window.addEventListener("keydown", onKey, true)
    return () => window.removeEventListener("keydown", onKey, true)
  }, [replacePicker])

  React.useEffect(() => {
    if (!editor) return
    const onSel = () => {
      const rp = replacePickerRef.current
      if (!rp) return
      const sel = editor.state.selection
      if (!(sel instanceof NodeSelection) || sel.from !== rp.pos) {
        setReplacePicker(null)
      }
    }
    editor.on("selectionUpdate", onSel)
    return () => {
      editor.off("selectionUpdate", onSel)
    }
  }, [editor])

  React.useEffect(() => {
    if (!editor) return
    editor.setEditable(!disabled)
  }, [editor, disabled])

  React.useEffect(() => {
    if (!editor) return
    if (isInternal.current) {
      isInternal.current = false
      return
    }
    const cur = normalizeTrailingNewlines(whatsappDocToString(editor.getJSON()))
    if (cur !== value) {
      editor.commands.setContent(whatsappStringToDoc(value, knownKeys), { emitUpdate: false })
    }
  }, [value, editor, knownKeys])

  React.useEffect(() => {
    if (!editor) return
    const dom = editor.view.dom as HTMLElement
    const onKey = (event: KeyboardEvent) => {
      const a = autoRef.current
      if (!a) return
      const list = filterVariables(variablesRef.current, a.filter)
      if (list.length === 0) return
      if (event.key === "Escape") {
        event.preventDefault()
        event.stopPropagation()
        setAuto(null)
        return
      }
      if (event.key === "ArrowDown") {
        event.preventDefault()
        event.stopPropagation()
        setAuto((prev) => {
          if (!prev) return null
          const li = filterVariables(variablesRef.current, prev.filter)
          return {
            ...prev,
            activeIndex: Math.min(prev.activeIndex + 1, li.length - 1),
            anchorPos: editor.state.selection.from,
          }
        })
        return
      }
      if (event.key === "ArrowUp") {
        event.preventDefault()
        event.stopPropagation()
        setAuto((prev) =>
          prev
            ? {
              ...prev,
              activeIndex: Math.max(prev.activeIndex - 1, 0),
              anchorPos: editor.state.selection.from,
            }
            : null
        )
        return
      }
      if (event.key === "Home") {
        event.preventDefault()
        event.stopPropagation()
        setAuto((prev) =>
          prev ? { ...prev, activeIndex: 0, anchorPos: editor.state.selection.from } : null
        )
        return
      }
      if (event.key === "End") {
        event.preventDefault()
        event.stopPropagation()
        setAuto((prev) => {
          if (!prev) return null
          const li = filterVariables(variablesRef.current, prev.filter)
          return { ...prev, activeIndex: Math.max(0, li.length - 1), anchorPos: editor.state.selection.from }
        })
        return
      }
      if (event.key === "Enter" || event.key === "Tab") {
        event.preventDefault()
        event.stopPropagation()
        const aNow = autoRef.current
        if (!aNow) return
        const listNow = filterVariables(variablesRef.current, aNow.filter)
        const pick = listNow[aNow.activeIndex]
        if (!pick) return
        const { state } = editor
        const pos = state.selection.from
        const $pos = state.doc.resolve(pos)
        if ($pos.parent.type.name !== "paragraph") return
        const paraStart = $pos.start()
        const from = docPosForParaStringOffset($pos.parent, paraStart, aNow.start)
        editor.chain().focus().deleteRange({ from, to: pos }).insertContentAt(from, {
          type: "whatsappVariable",
          attrs: { key: pick.key },
        }).run()
        setAuto(null)
      }
    }
    dom.addEventListener("keydown", onKey, true)
    return () => dom.removeEventListener("keydown", onKey, true)
  }, [editor])

  const insertVariable = React.useCallback(
    (key: string) => {
      if (!editor) return
      editor.chain().focus().insertContent({ type: "whatsappVariable", attrs: { key } }).run()
      setAuto(null)
    },
    [editor]
  )

  const pickAutocomplete = React.useCallback(
    (key: string) => {
      if (!editor || !auto) return
      const { state } = editor
      const pos = state.selection.from
      const $pos = state.doc.resolve(pos)
      if ($pos.parent.type.name !== "paragraph") return
      const paraStart = $pos.start()
      const from = docPosForParaStringOffset($pos.parent, paraStart, auto.start)
      editor.chain().focus().deleteRange({ from, to: pos }).insertContentAt(from, {
        type: "whatsappVariable",
        attrs: { key },
      }).run()
      setAuto(null)
    },
    [editor, auto]
  )

  const pickReplaceVariable = React.useCallback(
    (key: string) => {
      if (!editor) return
      const sel = editor.state.selection
      if (!(sel instanceof NodeSelection) || sel.node.type.name !== "whatsappVariable") return
      const node = sel.node
      const from = sel.from
      const marksJson = node.marks.map((m) => ({
        type: m.type.name,
        attrs: m.attrs,
      }))
      editor
        .chain()
        .focus()
        .deleteRange({ from, to: from + node.nodeSize })
        .insertContentAt(from, {
          type: "whatsappVariable",
          attrs: { key },
          ...(marksJson.length > 0 ? { marks: marksJson } : {}),
        })
        .run()
      setReplacePicker(null)
    },
    [editor]
  )

  const samplePreviewDoc = React.useMemo(() => {
    if (!editor || !samplePreviewOpen) return null
    const plain = normalizeTrailingNewlines(whatsappDocToString(editor.getJSON()))
    const sampled = substituteWhatsAppVariableSamples(plain, variables, previewVariableContext)
    return whatsappStringToDoc(sampled, new Set())
  }, [editor, samplePreviewOpen, variables, previewVariableContext])

  React.useEffect(() => {
    if (!samplePreviewOpen) return
    setAuto(null)
    setReplacePicker(null)
  }, [samplePreviewOpen])

  React.useEffect(() => {
    if (!samplePreviewOpen) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault()
        setSamplePreviewOpen(false)
      }
    }
    window.addEventListener("keydown", onKey, true)
    return () => window.removeEventListener("keydown", onKey, true)
  }, [samplePreviewOpen])

  const renderedFooter = footer !== undefined ? footer : null

  if (!editor) {
    return (
      <div
        className={cn(
          "animate-pulse rounded-xl border border-brand-deep/10 bg-white/50 px-3 py-8 text-center text-xs text-brand-accent/50 dark:border-white/10 dark:bg-white/5",
          className
        )}
        style={{ minHeight }}
      >
        Loading editor…
      </div>
    )
  }

  return (
    <div className={cn("relative rounded-2xl border border-brand-deep/10 bg-white/90 dark:border-white/10 dark:bg-brand-deep-950/60", className)}>
      <div className="overflow-hidden rounded-t-xl">
        <div
          className="flex w-full flex-wrap items-center gap-1 border-b border-brand-deep/8 px-2 py-1.5 dark:border-white/10"
          onMouseDown={(e) => e.stopPropagation()}
        >
          {!samplePreviewOpen ? (
            <>
              <ToolbarIcon
                title="Bold (*text*)"
                active={toolbarMarkActive(editor, "bold")}
                disabled={disabled}
                onClick={() => editor.chain().focus().toggleBold().run()}
              >
                <Bold className="h-3.5 w-3.5" />
              </ToolbarIcon>
              <ToolbarIcon
                title="Italic (_text_)"
                active={toolbarMarkActive(editor, "italic")}
                disabled={disabled}
                onClick={() => editor.chain().focus().toggleItalic().run()}
              >
                <Italic className="h-3.5 w-3.5" />
              </ToolbarIcon>
              <ToolbarIcon
                title="Strikethrough (~text~)"
                active={toolbarMarkActive(editor, "strike")}
                disabled={disabled}
                onClick={() => editor.chain().focus().toggleStrike().run()}
              >
                <Strikethrough className="h-3.5 w-3.5" />
              </ToolbarIcon>
              <ToolbarIcon
                title="Monospace (`text`)"
                active={toolbarMarkActive(editor, "code")}
                disabled={disabled}
                onClick={() => editor.chain().focus().toggleCode().run()}
              >
                <Code className="h-3.5 w-3.5" />
              </ToolbarIcon>
              <span className="mx-0.5 h-4 w-px shrink-0 bg-brand-deep/15 dark:bg-white/10" aria-hidden />
            </>
          ) : null}
          <ToolbarIcon
            title={samplePreviewOpen ? "Edit message" : "Preview with sample values"}
            active={samplePreviewOpen}
            disabled={disabled}
            onClick={() => setSamplePreviewOpen((v) => !v)}
          >
            {samplePreviewOpen ? (
              <PencilLine className="h-3.5 w-3.5" />
            ) : (
              <Eye className="h-3.5 w-3.5" />
            )}
          </ToolbarIcon>
          {!samplePreviewOpen ? (
            <>
              <span className="mx-0.5 h-4 w-px shrink-0 bg-brand-deep/15 dark:bg-white/10" aria-hidden />
              <DropdownMenu
                modal={false}
                open={variablesMenuOpen}
                onOpenChange={(open) => {
                  setVariablesMenuOpen(open)
                  if (!open) setVariablesMenuMaxPx(null)
                }}
              >
                <DropdownMenuTrigger asChild>
                  <Button
                    ref={variablesTriggerRef}
                    type="button"
                    variant="ghost"
                    size="icon"
                    title="Insert variable"
                    disabled={disabled}
                    onMouseDown={(e) => e.preventDefault()}
                    className={cn(
                      "h-8 w-8 shrink-0 rounded-lg text-brand-accent/55 hover:bg-brand-deep/5 dark:text-brand-cream/50 dark:hover:bg-white/6",
                      "data-[state=open]:bg-brand-deep/10 data-[state=open]:text-brand-deep dark:data-[state=open]:bg-white/10 dark:data-[state=open]:text-brand-cream"
                    )}
                  >
                    <Braces className="h-3.5 w-3.5" />
                    <span className="sr-only">Insert variable</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  side="bottom"
                  align="start"
                  sideOffset={VARIABLES_MENU_SIDE_OFFSET_PX}
                  avoidCollisions={false}
                  collisionPadding={16}
                  className={cn(
                    "z-80 flex w-72 min-h-0 flex-col overflow-hidden p-0",
                    variablesMenuOpen && variablesMenuMaxPx == null && "max-h-[50dvh]"
                  )}
                  style={
                    variablesMenuOpen && variablesMenuMaxPx != null
                      ? { maxHeight: variablesMenuMaxPx }
                      : undefined
                  }
                  onWheelCapture={(e) => e.stopPropagation()}
                >
                  <div className="shrink-0 border-b border-brand-deep/10 px-3 py-2 text-xs font-normal text-brand-accent/70 dark:border-white/10 dark:text-brand-cream/55">
                    Choose a variable to insert at the cursor
                  </div>
                  <div
                    className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-1 [-webkit-overflow-scrolling:touch] [touch-action:pan-y]"
                    onWheelCapture={(e) => e.stopPropagation()}
                  >
                    {variables.map((v) => (
                      <DropdownMenuItem
                        key={v.key}
                        disabled={disabled}
                        title={v.description}
                        className="cursor-pointer flex-col items-start gap-0.5 py-2.5"
                        onSelect={() => insertVariable(v.key)}
                      >
                        <span className="font-medium text-brand-deep dark:text-brand-cream">{v.label}</span>
                        <span className="font-mono text-xs text-brand-accent/60 dark:text-brand-cream/45">{`{${v.key}}`}</span>
                      </DropdownMenuItem>
                    ))}
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : null}
          {showDefaultFooter ? (
            <div className="ml-auto flex shrink-0 items-center">
              <WhatsAppMessageHelpPopover disabled={disabled} />
            </div>
          ) : null}
        </div>

        <div
          className="border-b border-brand-deep/8 dark:border-white/10"
          onMouseDown={(e) => e.stopPropagation()}
        >
          {samplePreviewOpen && samplePreviewDoc ? (
            <div
              className={cn(
                "min-h-(--wm-min) w-full px-3 py-2.5 text-sm leading-relaxed text-brand-deep outline-none dark:text-brand-cream",
                "prose prose-sm max-w-none dark:prose-invert prose-p:my-0",
                "prose-strong:text-brand-deep dark:prose-strong:text-brand-cream",
                "prose-em:text-brand-deep dark:prose-em:text-brand-cream",
                textareaClassName
              )}
              style={{ "--wm-min": `${minHeight}px` } as React.CSSProperties}
              aria-label="Sample message preview"
            >
              <p className="mb-2 mt-0 text-[11px] font-medium text-brand-accent/60 dark:text-brand-cream/45">
                Sample preview — live values used when this screen provides them
              </p>
              <WhatsAppFormattedSamplePreview doc={samplePreviewDoc} />
            </div>
          ) : (
            <EditorContent editor={editor} />
          )}
        </div>
      </div>

      <div ref={setAutoCompletePortalHost} className="pointer-events-none fixed inset-0 z-120" />

      {autoCompletePortalHost &&
        auto &&
        filtered.length > 0 &&
        autoCoords
        ? createPortal(
          <div
            ref={autoListScrollRef}
            role="presentation"
            style={{
              position: "absolute",
              left: autoCoords.left,
              top: autoCoords.top,
              zIndex: 1,
            }}
            className="pointer-events-auto max-h-[min(12rem,40dvh)] w-[min(320px,calc(100%-16px))] overflow-y-auto overscroll-contain rounded-xl border border-brand-deep/10 bg-white/98 py-1 shadow-lg [-webkit-overflow-scrolling:touch] [touch-action:pan-y] dark:border-white/10 dark:bg-brand-deep-900/98"
            onWheelCapture={(e) => e.stopPropagation()}
          >
            <ul id={listId} role="listbox" className="py-0">
              {filtered.map((v, i) => (
                <li key={v.key} role="presentation">
                  <button
                    type="button"
                    role="option"
                    aria-selected={i === auto.activeIndex}
                    className={cn(
                      "flex w-full flex-col gap-0.5 border-l-4 py-2 pl-2.5 pr-3 text-left text-sm transition-colors",
                      i === auto.activeIndex
                        ? "border-l-brand-green-400 bg-brand-green/12 text-brand-deep dark:border-l-amber-400/90 dark:bg-brand-gold/15 dark:text-brand-cream"
                        : "border-l-transparent text-brand-deep dark:text-brand-cream"
                    )}
                    onMouseDown={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      pickAutocomplete(v.key)
                    }}
                    onMouseEnter={() => setAuto((prev) => (prev ? { ...prev, activeIndex: i } : null))}
                  >
                    <span className="font-medium">{v.label}</span>
                    <span className="font-mono text-xs text-brand-accent/60 dark:text-brand-cream/45">{`{${v.key}}`}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>,
          autoCompletePortalHost
        )
        : null}

      {autoCompletePortalHost &&
        replacePicker &&
        replaceCoords
        ? createPortal(
          <div
            role="presentation"
            style={{
              position: "absolute",
              left: replaceCoords.left,
              top: replaceCoords.top,
              zIndex: 2,
            }}
            className="pointer-events-auto flex max-h-[min(14rem,45dvh)] w-[min(320px,calc(100%-16px))] flex-col overflow-hidden rounded-xl border border-brand-deep/10 bg-white/98 shadow-lg dark:border-white/10 dark:bg-brand-deep-900/98"
          >
            <div className="shrink-0 border-b border-brand-deep/10 px-3 py-2 text-xs font-normal text-brand-accent/70 dark:border-white/10 dark:text-brand-cream/55">
              Replace variable
            </div>
            <div
              ref={replaceListScrollRef}
              className="min-h-0 flex-1 overflow-y-auto overscroll-contain py-1 [-webkit-overflow-scrolling:touch] [touch-action:pan-y]"
              onWheelCapture={(e) => e.stopPropagation()}
            >
              <ul id={replaceListId} role="listbox" className="py-0">
                {variables.map((v) => {
                  const selected = v.key === replacePicker.currentKey
                  return (
                    <li key={v.key} role="presentation">
                      <button
                        type="button"
                        role="option"
                        aria-selected={selected}
                        data-replace-selected={selected ? "true" : undefined}
                        className={cn(
                          "flex w-full flex-col gap-0.5 border-l-4 py-2 pl-2.5 pr-3 text-left text-sm transition-colors",
                          selected
                            ? "border-l-brand-green-400 bg-brand-green/12 text-brand-deep dark:border-l-amber-400/90 dark:bg-brand-gold/15 dark:text-brand-cream"
                            : "border-l-transparent text-brand-deep hover:border-l-brand-green-400/80 hover:bg-brand-green/10 dark:text-brand-cream dark:hover:bg-white/6"
                        )}
                        onMouseDown={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          pickReplaceVariable(v.key)
                        }}
                      >
                        <span className="font-medium">{v.label}</span>
                        <span className="font-mono text-xs text-brand-accent/60 dark:text-brand-cream/45">{`{${v.key}}`}</span>
                      </button>
                    </li>
                  )
                })}
              </ul>
            </div>
          </div>,
          autoCompletePortalHost
        )
        : null}

      {renderedFooter ? (
        <div className="overflow-hidden rounded-b-xl border-t border-brand-deep/8 dark:border-white/10">{renderedFooter}</div>
      ) : null}
    </div>
  )
}

function WhatsAppMessageHelpPopover({ disabled }: { disabled: boolean }) {
  return (
    <Popover modal={false}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          disabled={disabled}
          title="Formatting and variables"
          aria-label="Formatting and variables help"
          onMouseDown={(e) => e.preventDefault()}
          className={cn(
            "h-8 w-8 shrink-0 rounded-lg text-brand-accent/55 hover:bg-brand-deep/5 dark:text-brand-cream/50 dark:hover:bg-white/6"
          )}
        >
          <CircleHelp className="h-3.5 w-3.5" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        side="bottom"
        sideOffset={6}
        collisionPadding={16}
        className="z-200 flex w-[min(22rem,calc(100vw-1.5rem))] max-h-[min(26rem,78dvh)] flex-col overflow-hidden border-brand-deep/10 p-0 shadow-lg dark:border-white/10"
      >
        <div className="shrink-0 border-b border-brand-deep/10 bg-white px-4 pb-3 pt-4 dark:border-white/10 dark:bg-[#021a12]">
          <p className="text-sm font-semibold text-brand-deep dark:text-brand-cream">WhatsApp message</p>
          <p className="mt-1 text-[11px] leading-snug text-brand-accent/65 dark:text-brand-cream/50">
            Shortcuts for this editor and how placeholders work when you send.
          </p>
        </div>
        <div
          className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain [-webkit-overflow-scrolling:touch] [touch-action:pan-y]"
          onWheelCapture={(e) => e.stopPropagation()}
        >
          <div className="space-y-4 px-4 py-3 text-[11px] leading-relaxed text-brand-accent/85 dark:text-brand-cream/75">
            <section className="space-y-1.5">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-brand-deep/80 dark:text-brand-cream/70">
                Formatting
              </h3>
              <p>
                Use the toolbar for{" "}
                <span className="font-mono text-brand-deep/90 dark:text-brand-cream/85">*bold*</span>,{" "}
                <span className="font-mono text-brand-deep/90 dark:text-brand-cream/85">_italic_</span>,{" "}
                <span className="font-mono text-brand-deep/90 dark:text-brand-cream/85">~strike~</span>, and{" "}
                <span className="font-mono text-brand-deep/90 dark:text-brand-cream/85">`monospace`</span>. Toggle a style
                before you type so it applies to new text; toggle again to stop.
              </p>
            </section>
            <section className="space-y-1.5">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-brand-deep/80 dark:text-brand-cream/70">
                Preview
              </h3>
              <p>
                The eye fills placeholders with samples, or real values when this screen provides them (for example order or
                business name). Press <kbd className="rounded bg-brand-deep/8 px-1 py-0.5 font-mono text-[10px] dark:bg-white/10">Esc</kbd>{" "}
                or tap the pencil to keep editing.
              </p>
            </section>
            <section className="space-y-1.5">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-brand-deep/80 dark:text-brand-cream/70">
                Variables
              </h3>
              <ul className="list-disc space-y-1 pl-4 marker:text-brand-accent/40">
                <li>
                  Open the braces menu or type{" "}
                  <kbd className="rounded bg-brand-deep/8 px-1 py-0.5 font-mono text-[10px] dark:bg-white/10">{"{"}</kbd> for
                  suggestions (↑↓, Home/End, Tab, Enter).
                </li>
                <li>Select a chip to replace it or apply formatting like regular text.</li>
              </ul>
            </section>
            <section className="rounded-lg bg-brand-deep/4 px-2.5 py-2 dark:bg-white/6">
              <p className="text-[11px] text-brand-accent/75 dark:text-brand-cream/60">
                Placeholders such as <span className="font-mono text-brand-deep/90 dark:text-brand-cream/85">{"{…}"}</span>{" "}
                are replaced when the message is sent.
              </p>
            </section>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}

function ToolbarIcon({
  title,
  active,
  disabled,
  onClick,
  children,
}: {
  title: string
  active: boolean
  disabled: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      title={title}
      disabled={disabled}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className={cn(
        "h-8 w-8 shrink-0 rounded-lg",
        active
          ? "bg-brand-deep/10 text-brand-deep dark:bg-white/10 dark:text-brand-cream"
          : "text-brand-accent/55 hover:bg-brand-deep/5 dark:text-brand-cream/50 dark:hover:bg-white/6"
      )}
    >
      {children}
    </Button>
  )
}
