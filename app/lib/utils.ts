import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

export interface FormatPhoneNumberOptions {
    /** When true, insert country-specific spacing (e.g. "+234 813 160 0400"). Defaults to false. */
    spaced?: boolean
}

export function formatPhoneNumber(
    value: string | null | undefined,
    options: FormatPhoneNumberOptions = {}
): string {
    if (!value) return ""
    const trimmed = value.trim()
    if (!trimmed) return ""

    let digits = trimmed.replace(/\D/g, "")
    if (!digits) return trimmed

    if (!trimmed.startsWith("+") && digits.startsWith("0") && digits.length === 11) {
        digits = "234" + digits.slice(1)
    }

    const isValidE164 = digits.length >= 10 && digits.length <= 15
    if (!isValidE164) return trimmed

    if (!options.spaced) {
        return `+${digits}`
    }

    if (digits.startsWith("234") && digits.length === 13) {
        return `+234 ${digits.slice(3, 6)} ${digits.slice(6, 9)} ${digits.slice(9)}`
    }
    if (digits.startsWith("254") && digits.length === 12) {
        return `+254 ${digits.slice(3, 6)} ${digits.slice(6, 9)} ${digits.slice(9)}`
    }
    if (digits.startsWith("233") && digits.length === 12) {
        return `+233 ${digits.slice(3, 5)} ${digits.slice(5, 8)} ${digits.slice(8)}`
    }
    if (digits.startsWith("27") && digits.length === 11) {
        return `+27 ${digits.slice(2, 4)} ${digits.slice(4, 7)} ${digits.slice(7)}`
    }
    if (digits.startsWith("1") && digits.length === 11) {
        return `+1 (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`
    }
    if (digits.startsWith("44") && digits.length === 12) {
        return `+44 ${digits.slice(2, 6)} ${digits.slice(6, 9)} ${digits.slice(9)}`
    }

    return `+${digits}`
}
