import { format, formatDistanceToNow, parseISO } from "date-fns"

/**
 * Higher-order date utility for the Cloove ecosystem.
 * Ensures consistent formatting across all modules.
 */

export const formatDate = (date: string | Date, pattern: string = "PPP") => {
    const d = typeof date === "string" ? parseISO(date) : date
    return format(d, pattern)
}

export const formatDateTime = (date: string | Date) => {
    const d = typeof date === "string" ? parseISO(date) : date
    return format(d, "MMM d, yyyy • h:mm a")
}

export const formatTime = (date: string | Date) => {
    const d = typeof date === "string" ? parseISO(date) : date
    return format(d, "h:mm a")
}

export const formatRelativeTime = (date: string | Date) => {
    const d = typeof date === "string" ? parseISO(date) : date
    return formatDistanceToNow(d, { addSuffix: true })
}

/**
 * Returns a human-friendly "Active since..." or "Joined..." string
 */
export const formatJourneyDate = (date: string | Date) => {
    const d = typeof date === "string" ? parseISO(date) : date
    return `since ${format(d, "MMMM yyyy")}`
}
