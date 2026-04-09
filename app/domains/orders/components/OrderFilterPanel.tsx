"use client"

import * as React from "react"
import { Filter, Check, X, CalendarIcon, ChevronsUpDown } from "lucide-react"
import { DateRange } from "react-day-picker"
import { format } from "date-fns"
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
} from "@/app/components/ui/drawer"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/app/components/ui/select"
import { MultiSelect } from "@/app/components/ui/multi-select"
import type { OrderFilterConfig, OrderFilterState } from "../types"

interface OrderFilterPanelProps {
    config: OrderFilterConfig
    value: OrderFilterState
    onChange: (next: OrderFilterState) => void
    onClear: () => void
}

export function OrderFilterPanel({ config, value, onChange, onClear }: OrderFilterPanelProps) {
    const isMobile = useIsMobile()
    const [isOpen, setIsOpen] = React.useState(false)

    const dateRange: DateRange | undefined =
        value.startDate
            ? {
                  from: new Date(value.startDate),
                  to: value.endDate ? new Date(value.endDate) : undefined,
              }
            : undefined

    const activeCount =
        value.selectedFilters.length +
        (value.startDate ? 1 : 0) +
        (value.academicTermId ? 1 : 0)

    const toggleOption = (optionValue: string) => {
        const isSelected = value.selectedFilters.includes(optionValue)
        onChange({
            ...value,
            selectedFilters: isSelected
                ? value.selectedFilters.filter(v => v !== optionValue)
                : [...value.selectedFilters, optionValue],
        })
    }

    const handleDateSelect = (range: DateRange | undefined) => {
        if (range?.from) {
            onChange({
                ...value,
                startDate: format(range.from, "yyyy-MM-dd"),
                endDate: range.to ? format(range.to, "yyyy-MM-dd") : format(range.from, "yyyy-MM-dd"),
            })
        } else {
            onChange({ ...value, startDate: undefined, endDate: undefined })
        }
    }

    const handleTermChange = (termId: string) => {
        onChange({
            ...value,
            academicTermId: termId === "__all__" ? undefined : termId,
        })
    }

    const Trigger = (
        <Button
            type="button"
            variant="outline"
            aria-label={activeCount > 0 ? `Filters (${activeCount} active)` : "Filters"}
            className={cn(
                "rounded-2xl h-12 w-12 p-0 shrink-0 bg-white border-brand-deep/8 dark:border-brand-gold/20 dark:bg-brand-deep/20 transition-all duration-300 relative",
                isOpen
                    ? "bg-brand-deep text-brand-gold dark:bg-brand-gold dark:text-brand-deep border-transparent shadow-lg"
                    : "text-brand-accent/90 dark:text-brand-cream/90 hover:bg-brand-deep/5 dark:hover:bg-white/5",
                activeCount > 0 && !isOpen && "border-brand-green/30 dark:border-brand-gold/30 bg-brand-green/5 dark:bg-brand-gold/5"
            )}
        >
            <Filter className={cn("w-4 h-4 transition-transform", isOpen && "scale-110")} />
            {activeCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 flex items-center justify-center rounded-full bg-rose-500 text-white text-[10px] font-bold shadow-sm">
                    {activeCount}
                </span>
            )}
        </Button>
    )

    const PanelBody = (
        <div className="space-y-1">
            {/* Filter groups */}
            {config.groups.map((group, groupIdx) => {
                const isLast = groupIdx === config.groups.length - 1 && !config.showDateRange && !config.termOptions
                const groupSelected = group.options.map(o => o.value).filter(v => value.selectedFilters.includes(v))

                const handleGroupChange = (nextSelected: string[]) => {
                    const otherFilters = value.selectedFilters.filter(v => !group.options.some(o => o.value === v))
                    onChange({ ...value, selectedFilters: [...otherFilters, ...nextSelected] })
                }

                return (
                    <div key={groupIdx}>
                        <p className="px-2 py-3 text-[10px] font-bold uppercase tracking-widest text-brand-accent/50 dark:text-brand-cream/40">
                            {group.title}
                        </p>

                        {group.type === 'multiselect' ? (
                            <div className="px-1 pb-1">
                                <MultiSelect
                                    options={group.options}
                                    value={groupSelected}
                                    onChange={handleGroupChange}
                                    placeholder={`All ${group.title.toLowerCase()}`}
                                    searchPlaceholder={`Search ${group.title.toLowerCase()}…`}
                                    renderTrigger={(selected, opts) => (
                                        <button
                                            type="button"
                                            className={cn(
                                                "w-full flex items-center justify-between px-3 py-2.5 rounded-xl border transition-all duration-150 text-left text-sm",
                                                selected.length > 0
                                                    ? "border-brand-green/30 dark:border-brand-gold/30 bg-brand-green/8 dark:bg-brand-gold/8 text-brand-deep dark:text-brand-gold"
                                                    : "border-brand-deep/8 dark:border-white/10 bg-transparent text-brand-accent/60 dark:text-brand-cream/50 hover:bg-brand-deep/5 dark:hover:bg-white/5"
                                            )}
                                        >
                                            <span className="font-medium truncate">
                                                {selected.length === 0
                                                    ? `All ${group.title.toLowerCase()}`
                                                    : selected.length === opts.length
                                                        ? "All selected"
                                                        : selected.map(v => opts.find(o => o.value === v)?.label).join(", ")}
                                            </span>
                                            <div className="flex items-center gap-1.5 shrink-0 ml-2">
                                                {selected.length > 0 && (
                                                    <span className="min-w-[18px] h-[18px] px-1 flex items-center justify-center rounded-full bg-rose-500 text-white text-[10px] font-bold">
                                                        {selected.length}
                                                    </span>
                                                )}
                                                <ChevronsUpDown className="w-3.5 h-3.5 opacity-40" />
                                            </div>
                                        </button>
                                    )}
                                />
                            </div>
                        ) : (
                            <div className="space-y-0.5">
                                {group.options.map((option) => {
                                    const isSelected = value.selectedFilters.includes(option.value)
                                    return (
                                        <button
                                            key={option.value}
                                            type="button"
                                            onClick={() => toggleOption(option.value)}
                                            className={cn(
                                                "w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all duration-150 text-left",
                                                isSelected
                                                    ? "bg-brand-green/10 dark:bg-brand-gold/10 text-brand-deep dark:text-brand-gold"
                                                    : "text-brand-accent/70 dark:text-brand-cream/60 hover:bg-brand-deep/5 dark:hover:bg-white/5"
                                            )}
                                        >
                                            <span className="text-sm font-medium">{option.label}</span>
                                            {isSelected && <Check className="w-3.5 h-3.5 shrink-0" />}
                                        </button>
                                    )
                                })}
                            </div>
                        )}

                        {!isLast && <div className="h-px bg-brand-deep/5 dark:bg-white/5 mx-2 mt-3" />}
                    </div>
                )
            })}

            {/* Date range */}
            {config.showDateRange && (
                <div>
                    <div className="flex items-center justify-between px-2 py-3">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-brand-accent/50 dark:text-brand-cream/40">
                            Date Range
                        </p>
                        {dateRange?.from && (
                            <button
                                type="button"
                                onClick={() => onChange({ ...value, startDate: undefined, endDate: undefined })}
                                className="text-[10px] font-bold uppercase tracking-widest text-rose-500/70 hover:text-rose-500 transition-colors"
                            >
                                Clear
                            </button>
                        )}
                    </div>
                    {dateRange?.from && (
                        <div className="mx-2 mb-3 px-3 py-2 rounded-xl bg-brand-green/8 dark:bg-brand-gold/8 flex items-center gap-2">
                            <CalendarIcon className="w-3.5 h-3.5 text-brand-accent/40 dark:text-brand-cream/40 shrink-0" />
                            <span className="text-xs font-medium text-brand-deep dark:text-brand-cream">
                                {format(dateRange.from, "MMM d")}
                                {dateRange.to && dateRange.to.getTime() !== dateRange.from.getTime()
                                    ? ` – ${format(dateRange.to, "MMM d, yyyy")}`
                                    : `, ${format(dateRange.from, "yyyy")}`}
                            </span>
                        </div>
                    )}
                    <Calendar
                        mode="range"
                        defaultMonth={dateRange?.from}
                        selected={dateRange}
                        onSelect={handleDateSelect}
                        numberOfMonths={1}
                        className="p-2"
                    />
                    {config.termOptions && (
                        <div className="h-px bg-brand-deep/5 dark:bg-white/5 mx-2 mt-1" />
                    )}
                </div>
            )}

            {/* Academic term */}
            {config.termOptions && config.termOptions.length > 0 && (
                <div>
                    <p className="px-2 py-3 text-[10px] font-bold uppercase tracking-widest text-brand-accent/50 dark:text-brand-cream/40">
                        Academic Term
                    </p>
                    <div className="px-2 pb-2">
                        <Select
                            value={value.academicTermId || "__all__"}
                            onValueChange={handleTermChange}
                        >
                            <SelectTrigger className="w-full rounded-xl h-10 text-sm">
                                <SelectValue placeholder="All terms" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="__all__">All terms</SelectItem>
                                {config.termOptions.map((t) => (
                                    <SelectItem key={t.id} value={t.id}>
                                        {t.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            )}
        </div>
    )

    const Footer = (close: () => void) => (
        <div className="flex items-center gap-2">
            {activeCount > 0 && (
                <Button
                    variant="ghost"
                    onClick={() => { onClear(); close() }}
                    className="flex-1 rounded-xl text-rose-500/80 dark:text-rose-400 hover:text-rose-500 bg-rose-500/5 hover:bg-rose-500/10 dark:bg-rose-500/5 dark:hover:bg-rose-500/10 font-bold text-[10px] h-10 uppercase tracking-widest"
                >
                    Reset
                </Button>
            )}
            <Button
                onClick={close}
                className={cn(
                    "rounded-xl bg-brand-deep text-brand-gold dark:bg-brand-gold dark:hover:bg-brand-gold/80 dark:text-brand-deep font-bold text-[10px] h-10 shadow-lg uppercase tracking-widest",
                    activeCount > 0 ? "flex-[1.5]" : "w-full"
                )}
            >
                Done
            </Button>
        </div>
    )

    if (isMobile) {
        return (
            <Drawer open={isOpen} onOpenChange={setIsOpen}>
                <DrawerTrigger asChild>{Trigger}</DrawerTrigger>
                <DrawerContent>
                    <DrawerStickyHeader>
                        <div className="flex items-center justify-between">
                            <DrawerTitle className="text-xl">
                                Filters
                                {activeCount > 0 && (
                                    <span className="ml-2 text-sm font-normal text-brand-accent/50 dark:text-brand-cream/50">
                                        {activeCount} active
                                    </span>
                                )}
                            </DrawerTitle>
                            {activeCount > 0 && (
                                <Button
                                    variant="ghost"
                                    onClick={onClear}
                                    className="h-auto p-0 text-[10px] font-bold text-rose-500/80 dark:text-rose-400 hover:text-rose-500 bg-transparent hover:bg-transparent uppercase tracking-widest"
                                >
                                    Clear All
                                </Button>
                            )}
                        </div>
                    </DrawerStickyHeader>
                    <DrawerBody className="custom-scrollbar">
                        {PanelBody}
                    </DrawerBody>
                    <DrawerFooter>
                        <DrawerClose asChild>
                            <Button className="w-full rounded-xl bg-brand-deep text-brand-gold dark:bg-brand-gold dark:text-brand-deep font-bold text-sm h-12 shadow-lg">
                                Done
                            </Button>
                        </DrawerClose>
                    </DrawerFooter>
                </DrawerContent>
            </Drawer>
        )
    }

    return (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>{Trigger}</PopoverTrigger>
            <PopoverContent
                align="end"
                sideOffset={12}
                avoidCollisions
                collisionPadding={10}
                className="w-96 p-0 rounded-[32px] flex flex-col overflow-hidden bg-white dark:bg-brand-deep border-brand-deep/5 dark:border-white/10 shadow-2xl z-50 max-h-(--radix-popover-content-available-height)"
            >
                <div className="px-6 py-4 flex items-center justify-between border-b border-brand-deep/5 dark:border-white/5 shrink-0">
                    <span className="text-xs font-bold uppercase tracking-widest text-brand-accent/70 dark:text-brand-cream/80">
                        Filters
                    </span>
                    {activeCount > 0 && (
                        <span className="text-[10px] font-bold text-brand-accent/40 dark:text-brand-cream/40 uppercase tracking-widest">
                            {activeCount} active
                        </span>
                    )}
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar px-2 py-2">
                    {PanelBody}
                </div>

                <div className="p-4 bg-brand-cream/10 dark:bg-white/5 border-t border-brand-deep/5 dark:border-white/5 shrink-0">
                    {Footer(() => setIsOpen(false))}
                </div>
            </PopoverContent>
        </Popover>
    )
}
