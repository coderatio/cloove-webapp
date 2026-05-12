import { Node, mergeAttributes } from "@tiptap/react"

/** Inline atom rendered as a chip; serializes to `{key}` in WhatsApp plain text. */
export const WhatsappVariable = Node.create({
  name: "whatsappVariable",
  group: "inline",
  inline: true,
  atom: true,
  selectable: true,
  draggable: false,
  /** Allow bold / italic / strike / code around variables (WhatsApp-style). */
  marks: "_",

  addAttributes() {
    return {
      key: {
        default: "",
        parseHTML: (element) => (element as HTMLElement).getAttribute("data-wa-var") ?? "",
        renderHTML: (attrs) => ({ "data-wa-var": String(attrs.key ?? "") }),
      },
    }
  },

  parseHTML() {
    return [{ tag: "span[data-wa-var]" }]
  },

  renderHTML({ node, HTMLAttributes }) {
    const key = String(node.attrs.key ?? "")
    return [
      "span",
      mergeAttributes(HTMLAttributes, {
        "data-wa-var": key,
        class:
          "mx-px inline-flex cursor-pointer items-baseline gap-0.5 rounded-md border border-emerald-500/25 bg-emerald-500/12 px-1 py-px align-middle font-mono text-[12px] font-semibold text-emerald-900 dark:border-emerald-400/30 dark:bg-emerald-500/15 dark:text-emerald-100",
        spellcheck: "false",
      }),
      `{${key}}`,
    ]
  },

})
