"use client"

import * as React from "react"
import { CalendarIcon } from "lucide-react"
import { endOfDay, format, startOfDay, subDays } from "date-fns"
import { DateRange } from "react-day-picker"

import { cn } from "@/app/lib/utils"
import { Button } from "@/app/components/ui/button"
import { Calendar } from "@/app/components/ui/calendar"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/app/components/ui/popover"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/app/components/ui/select"

const MS_DAY = 24 * 60 * 60 * 1000

/** Built-in quick filters; pick a subset via `quickPresets`. */
export type DateRangeQuickPreset =
    | "last24h"
    | "today"
    | "yesterday"
    | "last7"
    | "last30"
    | "rolling7d"
    | "rolling30d"
    | "thisMonth"

export const DEFAULT_DATE_RANGE_QUICK_PRESETS: DateRangeQuickPreset[] = [
    "today",
    "yesterday",
    "last7",
    "last30",
    "thisMonth",
]

const PRESET_LABELS: Record<DateRangeQuickPreset, string> = {
    last24h: "Last 24 hours",
    today: "Today",
    yesterday: "Yesterday",
    /** Calendar-style: 6 days back through today (same as legacy dashboard). */
    last7: "Last 7 days",
    last30: "Last 30 days",
    /** Rolling wall-clock window (matches typical “last N days” sales APIs). */
    rolling7d: "Last 7 days",
    rolling30d: "Last 30 days",
    thisMonth: "This month",
}

function applyQuickPreset(preset: DateRangeQuickPreset): DateRange {
    const now = new Date()
    switch (preset) {
        case "last24h":
            return { from: new Date(now.getTime() - MS_DAY), to: now }
        case "today":
            return { from: startOfDay(now), to: now }
        case "yesterday": {
            const y = subDays(now, 1)
            return { from: startOfDay(y), to: endOfDay(y) }
        }
        case "last7":
            return { from: subDays(now, 6), to: now }
        case "last30":
            return { from: subDays(now, 29), to: now }
        case "rolling7d":
            return { from: new Date(now.getTime() - 7 * MS_DAY), to: now }
        case "rolling30d":
            return { from: new Date(now.getTime() - 30 * MS_DAY), to: now }
        case "thisMonth": {
            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
            return { from: startOfMonth, to: now }
        }
        default:
            return { from: now, to: now }
    }
}

export interface DateRangeFilterProps {
    date: DateRange | undefined
    setDate: (date: DateRange | undefined) => void
    className?: string
    buttonClassName?: string
    /** Mobile: icon-only trigger inside a grouped toolbar — full picker unchanged */
    iconOnly?: boolean
    /** Which quick filters appear in the popover (order preserved). Defaults to dashboard set. */
    quickPresets?: DateRangeQuickPreset[]
    /** Placeholder for the quick-filter select */
    quickFilterPlaceholder?: string
}

function formatRangeLabel(date: DateRange | undefined): string {
    if (!date?.from) return "Pick a date range"
    if (date.to) {
        return `${format(date.from, "LLL d, y")} – ${format(date.to, "LLL d, y")}`
    }
    return format(date.from, "LLL d, y")
}

export function DateRangeFilter({
    className,
    date,
    setDate,
    buttonClassName,
    iconOnly = false,
    quickPresets = DEFAULT_DATE_RANGE_QUICK_PRESETS,
    quickFilterPlaceholder = "Quick filter",
}: DateRangeFilterProps) {
    const handlePresetChange = (value: string) => {
        setDate(applyQuickPreset(value as DateRangeQuickPreset))
    }

    const rangeLabel = formatRangeLabel(date)

    return (
        <div className={cn(iconOnly ? "contents" : "grid gap-2", className)}>
            <Popover>
                <PopoverTrigger asChild>
                    <Button
                        id="date"
                        type="button"
                        variant={"outline"}
                        aria-label={iconOnly ? `Date range: ${rangeLabel}` : undefined}
                        title={iconOnly ? rangeLabel : undefined}
                        className={cn(
                            iconOnly
                                ? "inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-brand-accent/15 bg-white/70 p-0 dark:border-white/15 dark:bg-white/10 hover:bg-white dark:hover:bg-white/15"
                                : "w-auto md:min-w-[260px] justify-start text-left font-medium rounded-2xl h-12 border-brand-accent/10 dark:border-white/10 bg-white/50 dark:bg-white/5 hover:bg-white/80 dark:hover:bg-white/10 hover:border-brand-accent/20 dark:hover:border-white/20 transition-all duration-300 shadow-sm hover:shadow-md text-brand-deep/80 dark:text-brand-cream/80 px-3 md:px-4 text-[10px] md:text-sm",
                            !date && !iconOnly && "text-muted-foreground",
                            buttonClassName
                        )}
                    >
                        <CalendarIcon
                            className={cn(
                                iconOnly
                                    ? "h-4 w-4 text-brand-deep/70 dark:text-brand-cream/80"
                                    : "mr-1.5 md:mr-2 h-3.5 w-3.5 md:h-4 md:w-4 text-brand-accent/40"
                            )}
                        />
                        {!iconOnly &&
                            (date?.from ? (
                                date.to ? (
                                    <span className="text-brand-deep dark:text-brand-cream">
                                        {format(date.from, "LLL dd, y")} -{" "}
                                        {format(date.to, "LLL dd, y")}
                                    </span>
                                ) : (
                                    <span className="text-brand-deep dark:text-brand-cream">
                                        {format(date.from, "LLL dd, y")}
                                    </span>
                                )
                            ) : (
                                <span className="text-brand-accent/60">Pick a date range</span>
                            ))}
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
                    <div className="p-3 border-b border-brand-deep/5 dark:border-white/5 bg-brand-green/5 dark:bg-white/5 rounded-t-2xl">
                        <Select onValueChange={handlePresetChange}>
                            <SelectTrigger className="w-full h-9 text-xs cursor-pointer border-brand-accent/10 dark:border-white/10 bg-white/40 dark:bg-black/20 backdrop-blur-sm rounded-xl hover:bg-white/60 dark:hover:bg-black/40 transition-all duration-300">
                                <SelectValue placeholder={quickFilterPlaceholder} />
                            </SelectTrigger>
                            <SelectContent position="popper" className="z-110">
                                {quickPresets.map((preset) => (
                                    <SelectItem key={preset} value={preset}>
                                        {PRESET_LABELS[preset]}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <Calendar
                        autoFocus
                        mode="range"
                        defaultMonth={date?.from}
                        selected={date}
                        onSelect={setDate}
                        numberOfMonths={2}
                    />
                </PopoverContent>
            </Popover>
        </div>
    )
}
