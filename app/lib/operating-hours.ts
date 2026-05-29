/**
 * Operating-hours conversion between the human-readable schedule string the
 * `OperatingHoursBuilder` widget speaks and the structured array shape the
 * server stores in jsonb columns and feeds to the voice runtime
 * (`checkBusinessOpen`, after-hours policy, etc.).
 *
 * Storage contract (`ai_agents.operating_hours`):
 *   - `null`              → "not configured" (runtime assumes open).
 *   - `[]`                → "closed all week".
 *   - `[{ dayOfWeek, openAt, closeAt }, …]` → real schedule.
 *
 * Builder UI contract (the `value` prop on `OperatingHoursBuilder`):
 *   - `""`                → empty form.
 *   - `"Open 24 hours, 7 days a week"` / `"Closed all week"` summaries.
 *   - `"Monday: 09:00-17:00 | Tuesday: 09:00-17:00 | …"` per-day strings.
 *
 * Both shapes are lossy in the corners — "always open" structured form has
 * 7 all-day rows, "closed all week" has zero rows, and unparseable strings
 * round-trip to `null`. The webapp keeps the builder on strings (so its
 * existing parser keeps working) and converts at the wire/DB boundary.
 */

export interface OperatingHoursRow {
    dayOfWeek: number
    openAt: string
    closeAt: string
}

const DAY_NAME_TO_INDEX: Record<string, number> = {
    sun: 0,
    sunday: 0,
    mon: 1,
    monday: 1,
    tue: 2,
    tuesday: 2,
    wed: 3,
    wednesday: 3,
    thu: 4,
    thursday: 4,
    fri: 5,
    friday: 5,
    sat: 6,
    saturday: 6,
}

const WEEKDAY_LABELS = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
]

const ALWAYS_OPEN_SUMMARY = "Open 24 hours, 7 days a week"
const ALWAYS_CLOSED_SUMMARY = "Closed all week"

function parseTime(time: string): string | null {
    const trimmed = time.trim()
    const match = trimmed.match(/^(\d{1,2}):(\d{2})$/)
    if (!match) return null
    const hour = Number(match[1])
    const minute = Number(match[2])
    if (!Number.isInteger(hour) || !Number.isInteger(minute)) return null
    if (hour < 0 || hour > 23 || minute < 0 || minute > 59) return null
    return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`
}

function isAllDay(row: OperatingHoursRow): boolean {
    return row.openAt === "00:00" && row.closeAt === "23:59"
}

/**
 * Convert the builder's schedule string into the storage array shape.
 * Returns `null` when the string is empty or unparseable (so the caller can
 * persist null instead of silently fabricating a schedule).
 */
export function scheduleStringToStructured(
    value: string | null | undefined
): OperatingHoursRow[] | null {
    if (typeof value !== "string") return null
    const trimmed = value.trim()
    if (!trimmed) return null
    if (trimmed === ALWAYS_CLOSED_SUMMARY) return []
    if (trimmed === ALWAYS_OPEN_SUMMARY) {
        return Array.from({ length: 7 }, (_, dayOfWeek) => ({
            dayOfWeek,
            openAt: "00:00",
            closeAt: "23:59",
        }))
    }

    const rows: OperatingHoursRow[] = []
    for (const part of trimmed.split("|").map((s) => s.trim()).filter(Boolean)) {
        const colonIndex = part.indexOf(":")
        if (colonIndex < 0) return null
        const dayLabel = part.slice(0, colonIndex).trim().toLowerCase()
        const hoursLabel = part.slice(colonIndex + 1).trim()
        const dayOfWeek = DAY_NAME_TO_INDEX[dayLabel]
        if (typeof dayOfWeek !== "number") return null

        if (hoursLabel.toLowerCase() === "24 hours") {
            rows.push({ dayOfWeek, openAt: "00:00", closeAt: "23:59" })
            continue
        }

        const [openRaw, closeRaw] = hoursLabel.split("-").map((s) => s?.trim())
        if (!openRaw || !closeRaw) return null
        const openAt = parseTime(openRaw)
        const closeAt = parseTime(closeRaw)
        if (!openAt || !closeAt) return null
        rows.push({ dayOfWeek, openAt, closeAt })
    }
    return rows
}

/**
 * Convert the storage array (or a legacy string already in the schedule
 * format) back into the builder's schedule string. Returns "" for null /
 * undefined / unknown shapes so the builder shows the "not configured" state.
 */
export function structuredToScheduleString(
    value: OperatingHoursRow[] | string | null | undefined
): string {
    if (value === null || value === undefined) return ""
    if (typeof value === "string") return value

    if (!Array.isArray(value)) return ""
    if (value.length === 0) return ALWAYS_CLOSED_SUMMARY

    const normalized = value
        .filter(
            (row): row is OperatingHoursRow =>
                row != null &&
                typeof row === "object" &&
                typeof row.dayOfWeek === "number" &&
                typeof row.openAt === "string" &&
                typeof row.closeAt === "string"
        )
        .slice()
        .sort((a, b) => a.dayOfWeek - b.dayOfWeek)

    if (normalized.length === 0) return ""
    if (normalized.length === 7 && normalized.every(isAllDay)) return ALWAYS_OPEN_SUMMARY

    return normalized
        .map(
            (row) =>
                `${WEEKDAY_LABELS[row.dayOfWeek]}: ${
                    isAllDay(row) ? "24 hours" : `${row.openAt}-${row.closeAt}`
                }`
        )
        .join(" | ")
}
