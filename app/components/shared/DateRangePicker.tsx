"use client"

import * as React from "react"
import { Calendar as CalendarIcon, X } from "lucide-react"
import { DateRange } from "react-day-picker"
import { format, parseISO } from "date-fns"

import { cn } from "@/app/lib/utils"
import { Button } from "@/app/components/ui/button"
import { Calendar } from "@/app/components/ui/calendar"
import { useIsMobile } from "@/app/hooks/useMediaQuery"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/app/components/ui/popover"
import {
    Drawer,
    DrawerContent,
    DrawerTrigger,
    DrawerStickyHeader,
    DrawerBody,
    DrawerFooter,
    DrawerClose,
    DrawerTitle,
} from "../ui/drawer"

interface DateRangePickerProps {
    value?: { from?: Date; to?: Date }
    onChange: (range: { from?: string; to?: string } | undefined) => void
    className?: string
    placeholder?: string
}

export function DateRangePicker({
    value,
    onChange,
    className,
    placeholder = "Pick a date range",
}: DateRangePickerProps) {
    const isMobile = useIsMobile()
    const [date, setDate] = React.useState<DateRange | undefined>(
        value ? { from: value.from, to: value.to } : undefined
    )
    const [isOpen, setIsOpen] = React.useState(false)

    // Sync state if prop changes (e.g. on Clear All)
    React.useEffect(() => {
        if (!value?.from && !value?.to) {
            setDate(undefined)
        }
    }, [value])

    const handleSelect = (range: DateRange | undefined) => {
        setDate(range)
        if (range?.from) {
            const from = format(range.from, "yyyy-MM-dd")
            const to = range.to ? format(range.to, "yyyy-MM-dd") : from
            onChange({ from, to })
        } else {
            onChange(undefined)
        }
    }

    const TriggerContent = (
        <Button
            id="date"
            variant={"outline"}
            className={cn(
                "rounded-2xl h-[46px] w-full bg-white border-brand-deep/8 dark:border-brand-gold/20 dark:bg-brand-deep/20 px-4 font-medium transition-all duration-300",
                !date && "text-brand-accent/60 dark:text-brand-cream/60",
                date && "border-brand-green/30 dark:border-brand-gold/30 bg-brand-green/5 dark:bg-brand-gold/5 text-brand-deep dark:text-brand-cream"
            )}
        >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {date?.from ? (
                date.to ? (
                    <>
                        {format(date.from, "LLL dd, y")} -{" "}
                        {format(date.to, "LLL dd, y")}
                    </>
                ) : (
                    format(date.from, "LLL dd, y")
                )
            ) : (
                <span>{placeholder}</span>
            )}
        </Button>
    )

    const handleClear = (e: React.MouseEvent) => {
        e.stopPropagation()
        setDate(undefined)
        onChange(undefined)
        setIsOpen(false)
    }

    if (isMobile) {
        return (
            <Drawer open={isOpen} onOpenChange={setIsOpen}>
                <DrawerTrigger asChild className={className}>
                    {TriggerContent}
                </DrawerTrigger>
                <DrawerContent>
                    <DrawerStickyHeader>
                        <div className="flex items-center justify-between">
                            <DrawerTitle className="text-xl">Pick Date Range</DrawerTitle>
                            {date && (
                                <Button
                                    variant="ghost"
                                    onClick={handleClear}
                                    className="h-auto p-0 text-[10px] font-bold text-rose-500/80 dark:text-rose-400 hover:text-rose-500 bg-transparent hover:bg-transparent uppercase tracking-widest"
                                >
                                    Clear
                                </Button>
                            )}
                        </div>
                    </DrawerStickyHeader>
                    <DrawerBody className="flex justify-center p-0">
                        <Calendar
                            initialFocus
                            mode="range"
                            defaultMonth={date?.from}
                            selected={date}
                            onSelect={handleSelect}
                            numberOfMonths={1}
                            className="p-6"
                        />
                    </DrawerBody>
                    <DrawerFooter>
                        <DrawerClose asChild>
                            <Button
                                className="w-full rounded-xl bg-brand-deep text-brand-gold dark:bg-brand-gold dark:text-brand-deep font-bold text-sm h-12 shadow-lg"
                            >
                                Done
                            </Button>
                        </DrawerClose>
                    </DrawerFooter>
                </DrawerContent>
            </Drawer>
        )
    }

    return (
        <div className={cn("flex", className)}>
            <Popover open={isOpen} onOpenChange={setIsOpen}>
                <PopoverTrigger asChild>
                    {TriggerContent}
                </PopoverTrigger>
                <PopoverContent
                    className="w-auto p-0 rounded-3xl flex flex-col overflow-hidden border-brand-deep/5 dark:border-white/10 shadow-2xl z-50 max-h-(--radix-popover-content-available-height)"
                    align="start"
                    sideOffset={12}
                    avoidCollisions
                    collisionPadding={10}
                >
                    <div className="px-5 py-3 border-b border-brand-deep/5 dark:border-white/5 flex items-center justify-between bg-brand-cream/5 dark:bg-white/5 shrink-0">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-brand-accent/60 dark:text-brand-cream/60">
                            Select Dates
                        </span>
                        <div className="flex items-center gap-3">
                            {date && (
                                <Button
                                    variant="ghost"
                                    onClick={handleClear}
                                    className="h-auto p-0 text-[10px] font-bold text-rose-500/80 dark:text-rose-400 hover:text-rose-500 bg-transparent hover:bg-transparent transition-colors uppercase tracking-widest"
                                >
                                    Clear
                                </Button>
                            )}
                            <Button
                                variant="ghost"
                                onClick={() => setIsOpen(false)}
                                className="h-auto p-0 text-[10px] font-bold text-brand-deep/60 dark:text-brand-gold hover:text-brand-deep dark:hover:text-brand-gold/80 bg-transparent hover:bg-transparent transition-colors uppercase tracking-widest"
                            >
                                Done
                            </Button>
                        </div>
                    </div>
                    <div className="flex-1 overflow-auto custom-scrollbar">
                        <Calendar
                            initialFocus
                            mode="range"
                            defaultMonth={date?.from}
                            selected={date}
                            onSelect={handleSelect}
                            numberOfMonths={2}
                        />
                    </div>
                </PopoverContent>
            </Popover>
        </div>
    )
}
