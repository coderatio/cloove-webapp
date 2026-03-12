import type { ReceiptData } from "@/app/components/shared/ReceiptTemplate"

const DEFAULT_WIDTH = 32 // chars for 80mm thermal paper

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

function separator(width: number): string {
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

export function formatReceiptText(
    data: ReceiptData,
    width: number = DEFAULT_WIDTH
): string {
    const lines: string[] = []
    const curr = data.currency || "NGN"

    // Header
    lines.push(center(data.businessName.toUpperCase(), width))
    if (data.businessAddress) {
        lines.push(center(data.businessAddress, width))
    }
    if (data.businessPhone) {
        lines.push(center("Tel: " + data.businessPhone, width))
    }
    lines.push(separator(width))

    // Order meta
    lines.push(row("Date:", data.date, width))
    lines.push(row("Order:", data.shortCode || data.orderId.substring(0, 8), width))
    if (data.customerName) {
        lines.push(row("Customer:", data.customerName, width))
    }
    lines.push(separator(width))

    // Items
    for (const item of data.items) {
        const qty = item.quantity > 1 ? " x" + item.quantity : ""
        const name = item.productName + qty
        const price = formatAmount(item.total, curr)
        lines.push(row(name, price, width))
    }
    lines.push(separator(width))

    // Totals
    if (data.discountAmount && data.discountAmount > 0) {
        lines.push(row("Subtotal:", formatAmount(data.subtotal, curr), width))
        lines.push(row("Discount:", "-" + formatAmount(data.discountAmount, curr), width))
        lines.push(separator(width))
    }
    lines.push(row("TOTAL:", formatAmount(data.totalAmount, curr), width))
    lines.push(row("Paid:", formatAmount(data.amountPaid, curr), width))
    if (data.remainingAmount > 0) {
        lines.push(row("Balance Due:", formatAmount(data.remainingAmount, curr), width))
    }
    if (data.paymentMethod) {
        lines.push(row("Method:", data.paymentMethod, width))
    }
    lines.push(separator(width))

    // Footer
    lines.push("")
    lines.push(center("Thank you for your business!", width))
    lines.push(center("Powered by Cloove", width))
    lines.push("")

    return lines.join("\n")
}
