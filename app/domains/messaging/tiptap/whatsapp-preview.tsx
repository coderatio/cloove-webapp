"use client"

import * as React from "react"
import type { JSONContent } from "@tiptap/react"

/** Matches serialization order in whatsapp-doc (inner → outer). */
const MARK_WRAP_ORDER = ["code", "strike", "italic", "bold"] as const

function wrapMark(type: (typeof MARK_WRAP_ORDER)[number], child: React.ReactNode): React.ReactNode {
  switch (type) {
    case "bold":
      return <strong className="font-semibold">{child}</strong>
    case "italic":
      return <em>{child}</em>
    case "strike":
      return <s>{child}</s>
    case "code":
      return (
        <code className="rounded bg-brand-deep/10 px-1 py-px font-mono text-[0.92em] dark:bg-white/15">
          {child}
        </code>
      )
    default:
      return child
  }
}

function PreviewInline({ nodes }: { nodes: JSONContent[] }): React.ReactNode {
  return nodes.map((node, i) => <PreviewNode key={i} node={node} />)
}

function PreviewNode({ node }: { node: JSONContent }): React.ReactNode {
  if (node.type === "text") {
    const marks = (node.marks ?? []) as { type: string }[]
    let el: React.ReactNode = node.text ?? ""
    for (const type of MARK_WRAP_ORDER) {
      if (marks.some((m) => m.type === type)) {
        el = wrapMark(type, el)
      }
    }
    return <>{el}</>
  }
  if (node.type === "whatsappVariable") {
    const key = String(node.attrs?.key ?? "")
    return (
      <span className="mx-px inline-flex items-baseline rounded-md border border-emerald-500/25 bg-emerald-500/12 px-1 py-px align-middle font-mono text-[12px] font-semibold text-emerald-900 dark:border-emerald-400/30 dark:bg-emerald-500/15 dark:text-emerald-100">
        {`{${key}}`}
      </span>
    )
  }
  if (node.type === "hardBreak") {
    return <br />
  }
  return null
}

/** Renders TipTap-style WhatsApp JSON as readable preview (paragraphs + marks). */
export function WhatsAppFormattedSamplePreview({ doc }: { doc: JSONContent }): React.ReactNode {
  if (!doc.content?.length) {
    return (
      <p className="my-0 text-brand-accent/45 dark:text-brand-cream/35">
        Empty message
      </p>
    )
  }
  return (
    <div className="space-y-1">
      {doc.content.map((block, i) => {
        if (block.type !== "paragraph") return null
        const inner = block.content ?? []
        return (
          <p key={i} className="my-0 whitespace-pre-wrap">
            {inner.length > 0 ? <PreviewInline nodes={inner} /> : "\u00a0"}
          </p>
        )
      })}
    </div>
  )
}
