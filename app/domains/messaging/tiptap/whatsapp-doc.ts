import type { JSONContent } from "@tiptap/react"
import type { Node as PMNode } from "@tiptap/pm/model"
import type { EditorState } from "@tiptap/pm/state"

const MARK_ORDER = ["code", "strike", "italic", "bold"] as const

function applyMarks(text: string, marks: { type: string }[] | undefined): string {
  if (!marks?.length) return text
  const by = new Set(marks.map((m) => m.type))
  let t = text
  for (const type of MARK_ORDER) {
    if (!by.has(type)) continue
    if (type === "bold") t = `*${t}*`
    else if (type === "italic") t = `_${t}_`
    else if (type === "strike") t = `~${t}~`
    else if (type === "code") t = `\`${t}\``
  }
  return t
}

/** TipTap JSON → WhatsApp-style plain string (variables + * _ ~ `). */
export function whatsappDocToString(doc: JSONContent): string {
  if (!doc || !doc.type) return ""
  switch (doc.type) {
    case "doc":
      return (doc.content ?? []).map(whatsappDocToString).join("")
    case "paragraph": {
      const inner = (doc.content ?? []).map(whatsappDocToString).join("")
      return `${inner}\n`
    }
    case "text":
      return applyMarks(doc.text ?? "", doc.marks as { type: string }[] | undefined)
    case "whatsappVariable":
      return applyMarks(
        `{${(doc.attrs?.key as string) ?? ""}}`,
        doc.marks as { type: string }[] | undefined
      )
    case "hardBreak":
      return "\n"
    default:
      return (doc.content ?? []).map(whatsappDocToString).join("")
  }
}

export function normalizeTrailingNewlines(s: string): string {
  return s.replace(/\n+$/, "")
}

type Delim = "*" | "_" | "~" | "`"

function firstWrappedSegment(s: string): { delim: Delim; start: number; end: number } | null {
  let best: { delim: Delim; start: number; end: number } | null = null
  const tryPair = (delim: Delim, open: string, close: string) => {
    let i = 0
    while (i < s.length) {
      const a = s.indexOf(open, i)
      if (a === -1) break
      const b = s.indexOf(close, a + open.length)
      if (b === -1) break
      if (b === a + open.length) {
        i = a + 1
        continue
      }
      if (!best || a < best.start) best = { delim, start: a, end: b }
      i = a + 1
    }
  }
  tryPair("*", "*", "*")
  tryPair("_", "_", "_")
  tryPair("~", "~", "~")
  tryPair("`", "`", "`")
  return best
}

function applyMarkToNode(n: JSONContent, markType: string): JSONContent {
  const prev = (n.marks as { type: string }[] | undefined) ?? []
  const marks = [...prev, { type: markType }]
  if (n.type === "text" || n.type === "whatsappVariable") {
    return { ...n, marks }
  }
  return n
}

/** Split `{knownKey}` tokens; text runs go through delimiter parsing only (no nested vars in one text run). */
function parseVarsOnly(line: string, knownKeys: Set<string>): JSONContent[] {
  if (!line) return []

  const varRe = /(\{[a-zA-Z0-9_]+\})/g
  const pieces: Array<{ t: "text"; s: string } | { t: "var"; key: string }> = []
  let last = 0
  let m: RegExpExecArray | null
  while ((m = varRe.exec(line)) !== null) {
    if (m.index > last) pieces.push({ t: "text", s: line.slice(last, m.index) })
    const inner = m[1].slice(1, -1)
    if (knownKeys.has(inner)) pieces.push({ t: "var", key: inner })
    else pieces.push({ t: "text", s: m[1] })
    last = m.index + m[1].length
  }
  if (last < line.length) pieces.push({ t: "text", s: line.slice(last) })

  const out: JSONContent[] = []
  for (const p of pieces) {
    if (p.t === "var") {
      out.push({ type: "whatsappVariable", attrs: { key: p.key } })
    } else {
      out.push(...parseMarkedText(p.s))
    }
  }
  return out
}

/** Parse one line: outer `*bold*`, `_italic_`, etc. may wrap `{variables}` (WhatsApp-style). */
function parseMarkedWithVars(line: string, knownKeys: Set<string>): JSONContent[] {
  if (!line) return []
  const seg = firstWrappedSegment(line)
  if (!seg) return parseVarsOnly(line, knownKeys)
  const left = line.slice(0, seg.start)
  const inner = line.slice(seg.start + 1, seg.end)
  const right = line.slice(seg.end + 1)
  const markType =
    seg.delim === "*"
      ? "bold"
      : seg.delim === "_"
        ? "italic"
        : seg.delim === "~"
          ? "strike"
          : "code"
  const innerNodes = mergeAdjacentText(parseMarkedWithVars(inner, knownKeys))
  const marked = innerNodes.map((n) => applyMarkToNode(n, markType))
  return mergeAdjacentText([
    ...(left ? parseMarkedWithVars(left, knownKeys) : []),
    ...marked,
    ...(right ? parseMarkedWithVars(right, knownKeys) : []),
  ])
}

/** Parse one line into inline JSON (variables + simple nested * _ ~ `). */
export function parseInlineWhatsApp(line: string, knownKeys: Set<string>): JSONContent[] {
  return parseMarkedWithVars(line, knownKeys)
}

function parseMarkedText(s: string): JSONContent[] {
  if (!s) return []
  const seg = firstWrappedSegment(s)
  if (!seg) return [{ type: "text", text: s }]
  const left = s.slice(0, seg.start)
  const inner = s.slice(seg.start + 1, seg.end)
  const right = s.slice(seg.end + 1)
  const markType =
    seg.delim === "*"
      ? "bold"
      : seg.delim === "_"
        ? "italic"
        : seg.delim === "~"
          ? "strike"
          : "code"
  const innerNodes = parseMarkedText(inner)
  const merged = mergeAdjacentText(innerNodes)
  const marked = merged.map((n) => applyMarkToNode(n, markType))
  return mergeAdjacentText([
    ...(left ? parseMarkedText(left) : []),
    ...marked,
    ...(right ? parseMarkedText(right) : []),
  ])
}

function mergeAdjacentText(nodes: JSONContent[]): JSONContent[] {
  const res: JSONContent[] = []
  for (const n of nodes) {
    if (n.type === "text" && res.length && res[res.length - 1].type === "text") {
      const prev = res[res.length - 1]
      if (sameMarks(prev.marks as never, n.marks as never)) {
        res[res.length - 1] = { ...prev, text: (prev.text ?? "") + (n.text ?? "") }
        continue
      }
    }
    res.push(n)
  }
  return res
}

function sameMarks(a: { type: string }[] | undefined, b: { type: string }[] | undefined): boolean {
  if (!a?.length && !b?.length) return true
  if (!a || !b || a.length !== b.length) return false
  return a.every((x, i) => x.type === b[i]?.type)
}

/** WhatsApp string → TipTap `doc` JSON. */
export function whatsappStringToDoc(s: string, knownKeys: Set<string>): JSONContent {
  const raw = s.replace(/\r\n/g, "\n")
  const lines = raw.length === 0 ? [""] : raw.split("\n")
  return {
    type: "doc",
    content: lines.map((line) => {
      const content = parseInlineWhatsApp(line, knownKeys)
      return {
        type: "paragraph",
        content: content.length > 0 ? content : [{ type: "text", text: "" }],
      }
    }),
  }
}

/** Plain text (with `{var}` for atoms) from doc start to `pos`, within same paragraph as `pos`. */
export function textBeforeCursorInParagraph(state: EditorState, pos: number): string {
  const $pos = state.doc.resolve(pos)
  const parent = $pos.parent
  if (parent.type.name !== "paragraph") return ""
  const start = $pos.start()
  return state.doc.textBetween(start, pos, "", (node) => {
    if (node.type.name === "whatsappVariable") return `{${node.attrs.key as string}}`
    return ""
  })
}

/** Map string offset (within paragraph plain view) to document position. */
export function docPosForParaStringOffset(
  paragraph: PMNode,
  paragraphStartPos: number,
  targetOffset: number
): number {
  if (targetOffset <= 0) return paragraphStartPos
  let acc = 0
  let pos = paragraphStartPos
  for (let i = 0; i < paragraph.childCount; i++) {
    const child = paragraph.child(i)
    if (child.isText) {
      const text = child.text ?? ""
      if (acc + text.length >= targetOffset) {
        return pos + (targetOffset - acc)
      }
      acc += text.length
      pos += child.nodeSize
    } else if (child.type.name === "whatsappVariable") {
      const t = `{${child.attrs.key as string}}`
      if (acc + t.length >= targetOffset) {
        return pos
      }
      acc += t.length
      pos += child.nodeSize
    } else {
      pos += child.nodeSize
    }
  }
  return pos
}
