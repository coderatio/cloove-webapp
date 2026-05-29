"use client"

import { memo, useEffect, useMemo, useState } from "react"
import { Button } from "@/app/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/components/ui/select"
import { Switch } from "@/app/components/ui/switch"

const OPERATING_HOUR_PRESETS = [
    { id: "weekday", label: "Mon-Fri, 9am-5pm" },
    { id: "business", label: "Mon-Sat, 8am-6pm" },
    { id: "always", label: "24/7" },
] as const

const WEEK_SCHEDULE = [
    { id: "mon", label: "Monday", shortLabel: "Mon" },
    { id: "tue", label: "Tuesday", shortLabel: "Tue" },
    { id: "wed", label: "Wednesday", shortLabel: "Wed" },
    { id: "thu", label: "Thursday", shortLabel: "Thu" },
    { id: "fri", label: "Friday", shortLabel: "Fri" },
    { id: "sat", label: "Saturday", shortLabel: "Sat" },
    { id: "sun", label: "Sunday", shortLabel: "Sun" },
] as const

type ScheduleDayId = (typeof WEEK_SCHEDULE)[number]["id"]

type ScheduleDay = {
    id: ScheduleDayId
    label: string
    shortLabel: string
    enabled: boolean
    open: string
    close: string
    allDay: boolean
}

interface OperatingHoursBuilderProps {
    label?: string
    description?: string
    value: string
    onChange: (value: string) => void
}

const TIME_OPTIONS = Array.from({ length: 48 }, (_, index) => {
    const hour = Math.floor(index / 2)
    const minute = index % 2 === 0 ? "00" : "30"
    const value = `${String(hour).padStart(2, "0")}:${minute}`
    const displayHour = hour % 12 === 0 ? 12 : hour % 12
    const meridiem = hour < 12 ? "AM" : "PM"
    return {
        value,
        label: `${displayHour}:${minute} ${meridiem}`,
    }
})

const TIME_OPTION_LABELS = new Map(TIME_OPTIONS.map((option) => [option.value, option.label]))

function createDefaultSchedule(): ScheduleDay[] {
    return WEEK_SCHEDULE.map((day) => ({
        ...day,
        enabled: day.id !== "sat" && day.id !== "sun",
        open: "09:00",
        close: "17:00",
        allDay: false,
    }))
}

/**
 * An "untouched" schedule with no days enabled. Used when the consumer hasn't
 * provided a value yet, so the UI reflects "not configured" instead of
 * pre-selecting a default the user never agreed to.
 */
function createEmptySchedule(): ScheduleDay[] {
    return WEEK_SCHEDULE.map((day) => ({
        ...day,
        enabled: false,
        open: "09:00",
        close: "17:00",
        allDay: false,
    }))
}

function createScheduleFromPreset(presetId: string): ScheduleDay[] {
    switch (presetId) {
        case "business":
            return WEEK_SCHEDULE.map((day) => ({
                ...day,
                enabled: day.id !== "sun",
                open: "08:00",
                close: "18:00",
                allDay: false,
            }))
        case "always":
            return WEEK_SCHEDULE.map((day) => ({
                ...day,
                enabled: true,
                open: "00:00",
                close: "23:59",
                allDay: true,
            }))
        case "weekday":
        default:
            return createDefaultSchedule()
    }
}

function cloneSchedule(days: ScheduleDay[]) {
    return days.map((day) => ({ ...day }))
}

function serializeSchedule(days: ScheduleDay[]): string {
    const enabledDays = days.filter((day) => day.enabled)
    if (enabledDays.length === 0) return "Closed all week"
    if (enabledDays.every((day) => day.allDay)) return "Open 24 hours, 7 days a week"

    return enabledDays
        .map((day) => `${day.label}: ${day.allDay ? "24 hours" : `${day.open}-${day.close}`}`)
        .join(" | ")
}

function parseSchedule(value: string): ScheduleDay[] | null {
    const normalized = value.trim()
    if (!normalized) return createDefaultSchedule()
    if (normalized === "Open 24 hours, 7 days a week") return createScheduleFromPreset("always")
    if (normalized === "Closed all week") {
        return WEEK_SCHEDULE.map((day) => ({
            ...day,
            enabled: false,
            open: "09:00",
            close: "17:00",
            allDay: false,
        }))
    }

    const dayMap = new Map(
        WEEK_SCHEDULE.map((day) => [day.label.toLowerCase(), { ...day, enabled: false, open: "09:00", close: "17:00", allDay: false }])
    )
    const parts = normalized.split("|").map((part) => part.trim()).filter(Boolean)
    if (!parts.length) return null

    for (const part of parts) {
        // Split on the FIRST colon only — the times themselves contain
        // colons (e.g. "Monday: 09:00-17:00"), so a naive `split(":")`
        // shreds the hours half into pieces and the parser bails.
        const colonIndex = part.indexOf(":")
        if (colonIndex < 0) return null
        const rawDay = part.slice(0, colonIndex).trim()
        const rawHours = part.slice(colonIndex + 1).trim()
        if (!rawDay || !rawHours) return null
        const existing = dayMap.get(rawDay.toLowerCase())
        if (!existing) return null

        if (rawHours.toLowerCase() === "24 hours") {
            existing.enabled = true
            existing.allDay = true
            existing.open = "00:00"
            existing.close = "23:59"
            continue
        }

        const [open, close] = rawHours.split("-").map((item) => item?.trim())
        if (!open || !close) return null
        existing.enabled = true
        existing.allDay = false
        existing.open = open
        existing.close = close
    }

    return WEEK_SCHEDULE.map((day) => dayMap.get(day.label.toLowerCase())!)
}

export function OperatingHoursBuilder({
    label = "Operating hours",
    description = "Used for after-hours replies and availability-aware routing.",
    value,
    onChange,
}: OperatingHoursBuilderProps) {
    const [schedule, setSchedule] = useState<ScheduleDay[]>(() => createEmptySchedule())
    const [legacyValue, setLegacyValue] = useState<string | null>(null)

    const summary = useMemo(() => serializeSchedule(schedule), [schedule])
    const normalizedValue = value.trim()
    const normalizedLegacyValue = legacyValue?.trim() ?? ""

    useEffect(() => {
        if (normalizedValue === summary) return
        if (legacyValue !== null && normalizedValue === normalizedLegacyValue) return

        if (!normalizedValue) {
            // No saved value — reflect "not configured" in the UI rather than
            // pre-filling defaults the user never agreed to. The parent's
            // form state stays empty until the user enables a day or picks a
            // preset, at which point `applySchedule` pushes the schedule.
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setSchedule(createEmptySchedule())
            setLegacyValue(null)
            return
        }

        const parsed = parseSchedule(value)
        if (parsed) {
            setSchedule(parsed)
            setLegacyValue(null)
            return
        }

        // Non-empty but unparseable — stash as legacy so the user can convert
        // it into structured hours via a preset or by editing the rows.
        setLegacyValue(value)
    }, [legacyValue, normalizedLegacyValue, normalizedValue, summary, value])

    const applySchedule = (nextSchedule: ScheduleDay[]) => {
        const cloned = cloneSchedule(nextSchedule)
        setSchedule(cloned)
        setLegacyValue(null)
        onChange(serializeSchedule(cloned))
    }

    const updateDay = (dayId: ScheduleDayId, updater: (day: ScheduleDay) => ScheduleDay) => {
        applySchedule(
            schedule.map((day) => (day.id === dayId ? updater({ ...day }) : day))
        )
    }

    return (
        <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-medium">{label}</p>
                {OPERATING_HOUR_PRESETS.map((preset) => (
                    <Button
                        key={preset.id}
                        type="button"
                        variant="outline"
                        className="h-8 rounded-full px-3 text-xs"
                        onClick={() => applySchedule(createScheduleFromPreset(preset.id))}
                    >
                        {preset.label}
                    </Button>
                ))}
            </div>

            {description ? <p className="text-sm text-muted-foreground">{description}</p> : null}

            {legacyValue ? (
                <div className="rounded-2xl border border-amber-200 bg-amber-50/70 px-4 py-3 text-sm text-amber-900 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-200">
                    <p className="font-medium">Existing custom hours detected</p>
                    <p className="mt-1">{legacyValue}</p>
                    <p className="mt-2 text-xs opacity-80">
                        Choose a preset or edit the schedule below to convert this into structured hours.
                    </p>
                </div>
            ) : null}

            <div className="rounded-2xl border border-black/5 dark:border-white/10">
                {schedule.map((day, index) => (
                    <OperatingHoursDayRow
                        key={day.id}
                        day={day}
                        hasBorder={index !== schedule.length - 1}
                        onEnabledChange={(checked) =>
                            updateDay(day.id, (current) => ({ ...current, enabled: checked }))
                        }
                        onOpenChange={(value) =>
                            updateDay(day.id, (current) => ({ ...current, open: value }))
                        }
                        onCloseChange={(value) =>
                            updateDay(day.id, (current) => ({ ...current, close: value }))
                        }
                        onAllDayChange={(checked) =>
                            updateDay(day.id, (current) => ({
                                ...current,
                                enabled: checked ? true : current.enabled,
                                allDay: checked,
                                open: checked ? "00:00" : current.open,
                                close: checked ? "23:59" : current.close,
                            }))
                        }
                    />
                ))}
            </div>

            <div className="rounded-2xl border border-black/5 px-4 py-3 text-sm text-muted-foreground dark:border-white/10">
                {summary}
            </div>
        </div>
    )
}

export { serializeSchedule, createDefaultSchedule }

const OperatingHoursDayRow = memo(function OperatingHoursDayRow({
    day,
    hasBorder,
    onEnabledChange,
    onOpenChange,
    onCloseChange,
    onAllDayChange,
}: {
    day: ScheduleDay
    hasBorder: boolean
    onEnabledChange: (checked: boolean) => void
    onOpenChange: (value: string) => void
    onCloseChange: (value: string) => void
    onAllDayChange: (checked: boolean) => void
}) {
    return (
        <div
            className={`grid gap-3 px-4 py-3 md:grid-cols-[1.1fr_0.8fr_0.8fr_auto] md:items-center ${
                hasBorder ? "border-b border-black/5 dark:border-white/10" : ""
            }`}
        >
            <div className="flex items-center justify-between gap-3">
                <div>
                    <p className="text-sm font-medium">{day.label}</p>
                    <p className="text-xs text-muted-foreground">
                        {day.enabled
                            ? day.allDay
                                ? "Open all day"
                                : `${day.open} - ${day.close}`
                            : "Closed"}
                    </p>
                </div>
                <Switch checked={day.enabled} onCheckedChange={onEnabledChange} />
            </div>

            <TimeSelect value={day.open} disabled={!day.enabled || day.allDay} onValueChange={onOpenChange} />

            <TimeSelect value={day.close} disabled={!day.enabled || day.allDay} onValueChange={onCloseChange} />

            <label className="flex items-center justify-between gap-3 rounded-2xl border border-black/5 px-4 py-3 text-sm dark:border-white/10">
                <span>24h</span>
                <Switch checked={day.allDay} onCheckedChange={onAllDayChange} />
            </label>
        </div>
    )
})

const TimeSelect = memo(function TimeSelect({
    value,
    disabled,
    onValueChange,
}: {
    value: string
    disabled?: boolean
    onValueChange: (value: string) => void
}) {
    const selected = TIME_OPTION_LABELS.get(value)

    return (
        <Select value={value} onValueChange={onValueChange} disabled={disabled}>
            <SelectTrigger className="rounded-2xl">
                <SelectValue placeholder="Select time">
                    {selected ?? value}
                </SelectValue>
            </SelectTrigger>
            <SelectContent className="max-h-72 rounded-2xl">
                {TIME_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                        {option.label}
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    )
})
