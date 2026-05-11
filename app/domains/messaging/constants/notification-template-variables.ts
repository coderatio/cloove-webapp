export type WhatsAppTemplateVariable = {
  /** Token inside braces, e.g. `customerName` for `{customerName}` */
  key: string
  /** Short UI label for chips and autocomplete */
  label: string
  /** Optional tooltip */
  description?: string
  /** Example text used in the sample preview (toggle next to the editor) */
  sampleText?: string
}

/** Matches server-side replacements in `OrderWhatsAppNotificationService.render` */
export const ORDER_WHATSAPP_TEMPLATE_VARIABLES: WhatsAppTemplateVariable[] = [
  {
    key: "customerName",
    label: "Customer",
    description: "Customer name, or a friendly default if missing",
    sampleText: "Jamie",
  },
  {
    key: "orderCode",
    label: "Order code",
    description: "Short order code or id prefix",
    sampleText: "A4F2",
  },
  {
    key: "businessName",
    label: "Business",
    description: "Your business name",
    sampleText: "Luna Kitchen",
  },
  {
    key: "stage",
    label: "Stage",
    description: "Kitchen stage label (when applicable)",
    sampleText: "Preparing",
  },
  {
    key: "total",
    label: "Total",
    description: "Formatted order total",
    sampleText: "$24.50",
  },
  {
    key: "serviceMode",
    label: "Service mode",
    description: "Dine-in / takeaway style label",
    sampleText: "Pickup",
  },
]

/** Replace `{variable}` tokens for preview. Optional `contextValues` overrides samples when a key is present with a non-empty string. */
export function substituteWhatsAppVariableSamples(
  message: string,
  variables: WhatsAppTemplateVariable[],
  contextValues?: Record<string, string | undefined>
): string {
  const map = new Map<string, string>()
  for (const v of variables) {
    const raw = contextValues?.[v.key]
    const trimmed = typeof raw === "string" ? raw.trim() : ""
    const resolved = trimmed.length > 0 ? trimmed : v.sampleText ?? v.label
    map.set(v.key, resolved)
  }
  return message.replace(/\{([a-zA-Z0-9_]+)\}/g, (full, key: string) =>
    map.has(key) ? map.get(key)! : full
  )
}
