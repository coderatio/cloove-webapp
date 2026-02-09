"use client"

import * as React from "react"
import { CalendarIcon } from "lucide-react"
import { addDays, format, subDays } from "date-fns"
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
}

export function DateRangeFilter({
    className,
    date,
    setDate,
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

    return (
        <div className={cn("grid gap-2", className)}>
            <Popover>
                <PopoverTrigger asChild>
                    <Button
                        id="date"
                        variant={"outline"}
                        className={cn(
                            "w-[260px] justify-start text-left font-medium rounded-xl border-brand-accent/10 dark:border-white/10 bg-white/50 dark:bg-white/5 hover:bg-white/80 dark:hover:bg-white/10 hover:border-brand-accent/20 dark:hover:border-white/20 transition-all duration-300 shadow-sm hover:shadow-md text-brand-deep/80 dark:text-brand-cream/80",
                            !date && "text-muted-foreground"
                        )}
                    >
                        <CalendarIcon className="mr-2 h-4 w-4 text-brand-accent/40" />
                        {date?.from ? (
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
                        )}
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
                    <div className="p-3 border-b border-brand-deep/5 dark:border-white/5 bg-brand-green/5 dark:bg-white/5">
                        <Select onValueChange={handlePresetChange}>
                            <SelectTrigger className="w-full h-9 text-xs cursor-pointer border-brand-accent/10 dark:border-white/10 bg-white/40 dark:bg-black/20 backdrop-blur-sm rounded-xl hover:bg-white/60 dark:hover:bg-black/40 transition-all duration-300">
                                <SelectValue placeholder="Quick Filter" />
                            </SelectTrigger>
                            <SelectContent position="popper" className="z-[110]">
                                <SelectItem value="today">Today</SelectItem>
                                <SelectItem value="yesterday">Yesterday</SelectItem>
                                <SelectItem value="last7">Last 7 Days</SelectItem>
                                <SelectItem value="last30">Last 30 Days</SelectItem>
                                <SelectItem value="thisMonth">This Month</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <Calendar
                        initialFocus
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
