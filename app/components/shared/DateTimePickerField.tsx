"use client"

import * as React from "react"
import { format } from "date-fns"
import { HugeiconsIcon } from "@hugeicons/react"
import { Calendar03Icon as CalendarIcon, Clock01Icon as Clock } from "@hugeicons/core-free-icons"
import { Button } from "@/app/components/ui/button"
import { Calendar } from "@/app/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/app/components/ui/popover"
import { SearchableSelect } from "@/app/components/ui/searchable-select"
import { cn } from "@/app/lib/utils"

const HOURS = Array.from({ length: 24 }, (_, hour) => {
    const value = String(hour).padStart(2, "0")
    return { label: value, value }
})

const MINUTES = ["00", "15", "30", "45"].map((minute) => ({
    label: minute,
    value: minute,
}))

function toDateTimeLocal(value: string | null | undefined) {
    if (!value) return ""
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return ""
    const pad = (v: number) => String(v).padStart(2, "0")
    return [
        `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`,
        `${pad(date.getHours())}:${pad(date.getMinutes())}`,
    ].join("T")
}

function parseDate(value: string) {
    if (!value) return undefined
    const date = new Date(value)
    return Number.isNaN(date.getTime()) ? undefined : date
}

function getTimeParts(value: string, defaultTime: string) {
    const date = parseDate(value)
    if (!date) {
        const [hour = "00", minute = "00"] = defaultTime.split(":")
        return { hour: hour.padStart(2, "0"), minute: minute.padStart(2, "0") }
    }
    return {
        hour: String(date.getHours()).padStart(2, "0"),
        minute: String(date.getMinutes()).padStart(2, "0"),
    }
}

function setDatePart(value: string, nextDate: Date | undefined, defaultTime: string) {
    if (!nextDate) return ""
    const current = parseDate(value)
    const { hour, minute } = getTimeParts(value, defaultTime)
    const next = new Date(nextDate)
    next.setHours(
        current ? current.getHours() : Number(hour),
        current ? current.getMinutes() : Number(minute),
        0,
        0
    )
    return toDateTimeLocal(next.toISOString())
}

function setTimePart(value: string, nextPart: { hour?: string; minute?: string }, defaultTime: string) {
    const current = parseDate(value) ?? new Date()
    const { hour, minute } = getTimeParts(value, defaultTime)
    current.setHours(Number(nextPart.hour ?? hour), Number(nextPart.minute ?? minute), 0, 0)
    return toDateTimeLocal(current.toISOString())
}

interface DateTimePickerFieldProps {
    label: string
    value: string
    onChange: (value: string) => void
    disabled?: boolean
    placeholder?: string
    clearLabel?: string
    defaultTime?: string
    disableDate?: (date: Date) => boolean
    className?: string
}

export function DateTimePickerField({
    label,
    value,
    onChange,
    disabled = false,
    placeholder = "Pick a date",
    clearLabel,
    defaultTime = "00:00",
    disableDate,
    className,
}: DateTimePickerFieldProps) {
    const date = parseDate(value)
    const { hour, minute } = getTimeParts(value, defaultTime)

    return (
        <div className={cn("space-y-3", className)}>
            <label className="px-1 text-sm font-medium text-brand-deep/75 dark:text-brand-cream/75">
                {label}
            </label>

            <Popover>
                <PopoverTrigger asChild>
                    <Button
                        type="button"
                        variant="outline"
                        disabled={disabled}
                        className={cn(
                            "h-12 w-full justify-start rounded-2xl border-brand-deep/10 bg-white/55 px-4 text-left font-medium transition-colors hover:bg-white/70 dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10",
                            !date && "text-brand-accent/45 dark:text-brand-cream/40"
                        )}
                    >
                        <HugeiconsIcon icon={CalendarIcon} className="mr-3 h-4 w-4 shrink-0 opacity-50" />
                        <span className="truncate">{date ? format(date, "PP") : placeholder}</span>
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto overflow-hidden rounded-3xl border-none p-0 shadow-2xl" align="start">
                    <Calendar
                        mode="single"
                        selected={date}
                        onSelect={(nextDate) => onChange(setDatePart(value, nextDate, defaultTime))}
                        disabled={disableDate}
                        autoFocus
                    />
                </PopoverContent>
            </Popover>

            <div className="grid grid-cols-2 gap-2">
                <SearchableSelect
                    options={HOURS}
                    value={hour}
                    disabled={disabled}
                    onChange={(nextHour) => onChange(setTimePart(value, { hour: nextHour }, defaultTime))}
                    placeholder="HR"
                    searchPlaceholder="Search hour"
                    popoverAlign="start"
                    renderTrigger={(selectedHour) => (
                        <Button
                            type="button"
                            variant="outline"
                            disabled={disabled}
                            className="group relative h-12 w-full justify-between rounded-2xl border-brand-deep/10 bg-white/55 pl-11 pr-4 text-base font-medium dark:border-white/10 dark:bg-white/5"
                        >
                            <HugeiconsIcon icon={Clock} className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-accent/35 transition-colors group-focus:text-brand-gold/60 dark:text-brand-cream/35" />
                            <span className="text-brand-deep dark:text-brand-cream">{selectedHour ?? hour}</span>
                            <span className="text-xs font-medium text-brand-accent/45 dark:text-brand-cream/45">Hour</span>
                        </Button>
                    )}
                />
                <SearchableSelect
                    options={MINUTES}
                    value={minute}
                    disabled={disabled}
                    onChange={(nextMinute) => onChange(setTimePart(value, { minute: nextMinute }, defaultTime))}
                    placeholder="MIN"
                    searchPlaceholder="Search minute"
                    popoverAlign="end"
                    renderTrigger={(selectedMinute) => (
                        <Button
                            type="button"
                            variant="outline"
                            disabled={disabled}
                            className="h-12 w-full justify-between rounded-2xl border-brand-deep/10 bg-white/55 px-4 text-base font-medium dark:border-white/10 dark:bg-white/5"
                        >
                            <span className="text-brand-deep dark:text-brand-cream">{selectedMinute ?? minute}</span>
                            <span className="text-xs font-medium text-brand-accent/45 dark:text-brand-cream/45">Min</span>
                        </Button>
                    )}
                />
            </div>

            {value ? (
                <Button
                    type="button"
                    variant="ghost"
                    disabled={disabled}
                    onClick={() => onChange("")}
                    className="h-8 rounded-full px-2 text-xs font-semibold text-brand-accent/55 hover:text-brand-deep dark:text-brand-cream/45 dark:hover:text-brand-cream"
                >
                    {clearLabel ?? `Clear ${label.toLowerCase()}`}
                </Button>
            ) : null}
        </div>
    )
}
