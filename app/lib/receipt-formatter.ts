import type { ReceiptData } from "@/app/components/shared/ReceiptTemplate"

const DEFAULT_WIDTH = 32 // chars for 80mm thermal paper

// ── ESC/POS segment type ─────────────────────────────────────────────────

/** Each segment is one BLE write. Command bytes are prepended to text so
 *  we never send extra standalone writes that overwhelm the printer. */
export interface ReceiptSegment { data: Uint8Array }

// ── Exported ESC/POS init constants (used by useReceiptPrinter) ──────────

const ESC = 0x1b
const GS = 0x1d

export const ESC_INIT = new Uint8Array([ESC, 0x40])           // Initialize printer

// Heating parameters: ESC 7 n1 n2 n3
export const ESC_HEAT = new Uint8Array([
    ESC, 0x37,
    2,    // n1: 2 → (2+1)*8 = 24 dots at a time (default ~80)
    60,   // n2: 600µs heating time (lighter but legible)
    40,   // n3: 400µs interval between rows (long cooldown)
])

// Print density: DC2 # n — bits 0-4: density, bits 5-7: break time
export const DC2_DENSITY = new Uint8Array([
    0x12, 0x23,
    (0b011 << 5) | 8,  // break time 3 (longest), density 8 (low-medium)
])

export const FEED_AND_CUT = new Uint8Array([
    0x0a, 0x0a, 0x0a, 0x0a,  // Feed 4 lines
    GS, 0x56, 0x01,           // Partial cut
])

// ESC/POS command constants — only universally-supported commands.
// GS ! (select print size) and GS L (left margin) are NOT supported on
// cheap BLE printers like MPT-II and get rendered as garbage text.
const CMD_CENTER = [0x1b, 0x61, 0x01]
const CMD_LEFT = [0x1b, 0x61, 0x00]
const CMD_BOLD_ON = [0x1b, 0x45, 0x01]
const CMD_BOLD_OFF = [0x1b, 0x45, 0x00]

// ── Helpers ──────────────────────────────────────────────────────────────

/** Map of Unicode currency symbols to ASCII-safe equivalents */
const CURRENCY_ASCII: Record<string, string> = {
    "₦": "NGN ",
    "€": "EUR ",
    "£": "GBP ",
    "$": "$",
    "¥": "JPY ",
    "₹": "INR ",
    "₵": "GHS ",
    "R": "R",
}

/**
 * Format a number as a currency string using only ASCII characters.
 * Thermal printers typically only support ASCII/CP437 — Unicode symbols
 * like ₦ will print as garbage.
 */
function formatAmount(value: number, currency: string): string {
    // Build a simple formatted number: e.g. "18,000"
    const num = Math.abs(value)
    const formatted = num.toLocaleString("en", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
    })

    // Use a simple ASCII prefix based on currency code
    const prefixMap: Record<string, string> = {
        NGN: "N",
        USD: "$",
        GBP: "GBP ",
        EUR: "EUR ",
        GHS: "GHS ",
        KES: "KES ",
    }
    const prefix = prefixMap[currency.toUpperCase()] || currency + " "
    const sign = value < 0 ? "-" : ""
    return `${sign}${prefix}${formatted}`
}

function center(text: string, width: number): string {
    if (text.length >= width) return text.slice(0, width)
    const pad = Math.floor((width - text.length) / 2)
    return " ".repeat(pad) + text
}

function majorSeparator(width: number): string {
    return "=".repeat(width)
}

function minorSeparator(width: number): string {
    return "-".repeat(width)
}

function row(left: string, right: string, width: number): string {
    const gap = width - left.length - right.length
    if (gap < 1) {
        const maxLeft = width - right.length - 1
        return left.slice(0, Math.max(maxLeft, 1)) + " " + right
    }
    return left + " ".repeat(gap) + right
}

/**
 * Parse an ISO date string into a human-readable format.
 * Returns the input as-is if it's already formatted (non-ISO).
 */
export function formatReceiptDate(str: string): string {
    // Detect ISO format (contains 'T' and timezone offset or Z)
    if (!str.includes("T")) return str
    const d = new Date(str)
    if (isNaN(d.getTime())) return str
    
    // Using default locale (undefined) to respect user's browser settings
    return d.toLocaleString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
    })
}

// ── Segment-based ESC/POS formatter (for Bluetooth thermal print) ────────

const encoder = new TextEncoder()

/** Build one segment: optional command prefix bytes + text, all in one write. */
function seg(prefix: number[], str: string): ReceiptSegment {
    const textBytes = encoder.encode(str)
    const data = new Uint8Array(prefix.length + textBytes.length)
    data.set(prefix, 0)
    data.set(textBytes, prefix.length)
    return { data }
}

/** Text-only segment (no command prefix). */
function line(str: string): ReceiptSegment {
    return { data: encoder.encode(str) }
}

export function formatReceiptCommands(
    data: ReceiptData,
    width: number = DEFAULT_WIDTH
): ReceiptSegment[] {
    const segments: ReceiptSegment[] = []
    const curr = data.currency || "NGN"
    const date = formatReceiptDate(data.date)

    // 1. Business name — centered + bold (command bytes inlined with text)
    segments.push(seg([...CMD_CENTER, ...CMD_BOLD_ON], data.businessName.toUpperCase() + "\n"))

    // 2. Address, phone — still centered, bold off
    if (data.businessAddress) {
        segments.push(seg(CMD_BOLD_OFF, data.businessAddress + "\n"))
    } else {
        segments.push(seg(CMD_BOLD_OFF, ""))
    }
    if (data.businessPhone) {
        segments.push(line("Tel: " + data.businessPhone + "\n"))
    }

    // 3. Major separator + left align
    segments.push(seg(CMD_LEFT, majorSeparator(width) + "\n"))

    // 4. Date, order#, customer
    segments.push(line(row("Date:", date, width) + "\n"))
    segments.push(line(row("Order:", data.shortCode || data.orderId.substring(0, 8), width) + "\n"))
    if (data.customerName) {
        segments.push(line(row("Customer:", data.customerName, width) + "\n"))
    }

    // 5. Minor separator
    segments.push(line(minorSeparator(width) + "\n"))

    // 6. Item lines
    for (const item of data.items) {
        const qty = item.quantity > 1 ? " x" + item.quantity : ""
        const name = item.productName + qty
        const price = formatAmount(item.total, curr)
        segments.push(line(row(name, price, width) + "\n"))
    }

    // 7. Minor separator
    segments.push(line(minorSeparator(width) + "\n"))

    // 8. Discount section (if applicable)
    if (data.discountAmount && data.discountAmount > 0) {
        segments.push(line(row("Subtotal:", formatAmount(data.subtotal, curr), width) + "\n"))
        segments.push(line(row("Discount:", "-" + formatAmount(data.discountAmount, curr), width) + "\n"))
        segments.push(line(minorSeparator(width) + "\n"))
    }

    // 9. TOTAL — bold (command bytes inlined)
    segments.push(seg(CMD_BOLD_ON, row("TOTAL:", formatAmount(data.totalAmount, curr), width) + "\n"))

    // 10. Paid, balance, method — bold off inlined with first line
    segments.push(seg(CMD_BOLD_OFF, row("Paid:", formatAmount(data.amountPaid, curr), width) + "\n"))
    if (data.remainingAmount > 0) {
        segments.push(line(row("Balance Due:", formatAmount(data.remainingAmount, curr), width) + "\n"))
    }
    if (data.paymentMethod) {
        segments.push(line(row("Method:", data.paymentMethod, width) + "\n"))
    }

    // 11. Major separator
    segments.push(line(majorSeparator(width) + "\n"))

    // 12. Footer — centered (command inlined)
    segments.push(seg(CMD_CENTER, "\n"))
    segments.push(line("Thank you for your business!\n"))
    segments.push(line("Powered by Cloove\n"))
    segments.push(line("\n"))

    return segments
}

// ── Plain-text formatter (for browser print) ─────────────────────────────

export function formatReceiptText(
    data: ReceiptData,
    width: number = DEFAULT_WIDTH
): string {
    const lines: string[] = []
    const curr = data.currency || "NGN"
    const date = formatReceiptDate(data.date)

    // Header
    lines.push(center(data.businessName.toUpperCase(), width))
    if (data.businessAddress) {
        lines.push(center(data.businessAddress, width))
    }
    if (data.businessPhone) {
        lines.push(center("Tel: " + data.businessPhone, width))
    }
    lines.push(majorSeparator(width))

    // Order meta
    lines.push(row("Date:", date, width))
    lines.push(row("Order:", data.shortCode || data.orderId.substring(0, 8), width))
    if (data.customerName) {
        lines.push(row("Customer:", data.customerName, width))
    }
    lines.push(minorSeparator(width))

    // Items
    for (const item of data.items) {
        const qty = item.quantity > 1 ? " x" + item.quantity : ""
        const name = item.productName + qty
        const price = formatAmount(item.total, curr)
        lines.push(row(name, price, width))
    }
    lines.push(minorSeparator(width))

    // Totals
    if (data.discountAmount && data.discountAmount > 0) {
        lines.push(row("Subtotal:", formatAmount(data.subtotal, curr), width))
        lines.push(row("Discount:", "-" + formatAmount(data.discountAmount, curr), width))
        lines.push(minorSeparator(width))
    }
    lines.push(row("TOTAL:", formatAmount(data.totalAmount, curr), width))
    lines.push(row("Paid:", formatAmount(data.amountPaid, curr), width))
    if (data.remainingAmount > 0) {
        lines.push(row("Balance Due:", formatAmount(data.remainingAmount, curr), width))
    }
    if (data.paymentMethod) {
        lines.push(row("Method:", data.paymentMethod, width))
    }
    lines.push(majorSeparator(width))

    // Footer
    lines.push("")
    lines.push(center("Thank you for your business!", width))
    lines.push(center("Powered by Cloove", width))
    lines.push("")

    return lines.join("\n")
}
