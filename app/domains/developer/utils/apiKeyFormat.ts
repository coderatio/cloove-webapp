import { toast } from "sonner"
import type { ExpiryPreset } from "@/app/domains/developer/utils/apiKeyConfig"

export function formatDate(value: string | null | undefined) {
    if (!value) return "Never"
    return new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric" }).format(new Date(value))
}

export function copy(value: string) {
    void navigator.clipboard.writeText(value)
    toast.success("Copied")
}

export function splitLines(value: string) {
    return value
        .split(/\r?\n|,/)
        .map((item) => item.trim())
        .filter(Boolean)
}

export function expiryFromPreset(preset: ExpiryPreset, customDate: string) {
    if (preset === "never") return null
    if (preset === "custom") return customDate ? new Date(`${customDate}T23:59:59.000Z`).toISOString() : null
    const date = new Date()
    date.setDate(date.getDate() + 60)
    return date.toISOString()
}
