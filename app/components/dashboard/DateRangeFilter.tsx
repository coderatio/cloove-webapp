"use client"

import * as React from "react"
import { CalendarIcon } from "lucide-react"
import { format, subDays } from "date-fns"
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

export interface DateRangeFilterProps {
    date: DateRange | undefined
    setDate: (date: DateRange | undefined) => void
    className?: string
    buttonClassName?: string
    /** Mobile: icon-only trigger inside a grouped toolbar — full picker unchanged */
    iconOnly?: boolean
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
}: DateRangeFilterProps) {
    const handlePresetChange = (value: string) => {
        const today = new Date()
        switch (value) {
            case "today":
                setDate({ from: today, to: today })
                break
            case "yesterday":
                const yesterday = subDays(today, 1)
                setDate({ from: yesterday, to: yesterday })
                break
            case "last7":
                setDate({ from: subDays(today, 6), to: today })
                break
            case "last30":
                setDate({ from: subDays(today, 29), to: today })
                break
            case "thisMonth":
                // Simple implementation for "This Month" - from 1st to today
                const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
                setDate({ from: startOfMonth, to: today })
                break
        }
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
                                <SelectValue placeholder="Quick Filter" />
                            </SelectTrigger>
                            <SelectContent position="popper" className="z-110">
                                <SelectItem value="today">Today</SelectItem>
                                <SelectItem value="yesterday">Yesterday</SelectItem>
                                <SelectItem value="last7">Last 7 Days</SelectItem>
                                <SelectItem value="last30">Last 30 Days</SelectItem>
                                <SelectItem value="thisMonth">This Month</SelectItem>
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
