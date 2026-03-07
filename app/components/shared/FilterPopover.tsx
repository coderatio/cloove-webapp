"use client"

import * as React from "react"
import { Filter, X, Check } from "lucide-react"
import { cn } from "../../lib/utils"
import { Button } from "../ui/button"
import { useIsMobile } from "@/app/hooks/useMediaQuery"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "../ui/popover"
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

export interface FilterOption {
    label: string
    value: string
}

export interface FilterGroup {
    title: string
    options: FilterOption[]
}

interface FilterPopoverProps {
    groups: FilterGroup[]
    selectedValues: string[]
    onSelectionChange: (values: string[]) => void
    onClear: () => void
    className?: string
    align?: "start" | "center" | "end"
    iconOnly?: boolean
}

export function FilterPopover({
    groups,
    selectedValues,
    onSelectionChange,
    onClear,
    className,
    align = "start",
    iconOnly = false
}: FilterPopoverProps) {
    const isMobile = useIsMobile()
    const [isOpen, setIsOpen] = React.useState(false)

    const toggleOption = (groupIdx: number, value: string) => {
        const groupOptions = groups[groupIdx].options.map(o => o.value)
        const isCurrentlySelected = selectedValues.includes(value)

        let newSelectedValues: string[]
        if (isCurrentlySelected) {
            newSelectedValues = selectedValues.filter(v => v !== value)
        } else {
            newSelectedValues = [...selectedValues, value]
        }

        onSelectionChange(newSelectedValues)
    }

    const activeCount = selectedValues.length

    const FilterTrigger = iconOnly ? (
        <Button
            type="button"
            variant="outline"
            aria-label={activeCount > 0 ? `Filter (${activeCount} selected)` : "Filter"}
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
                <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 flex items-center justify-center rounded-full bg-rose-500 text-white text-[10px] font-bold shadow-sm">
                    {activeCount}
                </span>
            )}
        </Button>
    ) : (
        <Button
            variant="outline"
            className={cn(
                "rounded-2xl h-[46px] w-full bg-white border-brand-deep/8 dark:border-brand-gold/20 dark:bg-brand-deep/20 px-4 transition-all duration-300",
                isOpen
                    ? "bg-brand-deep text-brand-gold dark:bg-brand-gold dark:text-brand-deep border-transparent shadow-lg"
                    : "text-brand-accent/90 dark:text-brand-cream/90 hover:bg-brand-deep/5 dark:hover:bg-white/5",
                activeCount > 0 && !isOpen && "border-brand-green/30 dark:border-brand-gold/30 bg-brand-green/5 dark:bg-brand-gold/5"
            )}
        >
            <Filter className={cn("w-4 h-4 mr-2 transition-transform", isOpen && "scale-110")} />
            Filter
            {activeCount > 0 && (
                <span className="ml-2 w-5 h-5 flex items-center justify-center rounded-full bg-rose-500 text-white text-[10px] font-bold shadow-sm">
                    {activeCount}
                </span>
            )}
        </Button>
    )

    const Content = (
        <div className="space-y-6">
            {groups.map((group, groupIdx) => (
                <div key={groupIdx} className="space-y-3">
                    <h4 className="px-2 text-[10px] font-bold uppercase tracking-widest text-brand-accent/60 dark:text-white/50">
                        {group.title}
                    </h4>
                    <div className="grid grid-cols-1 gap-1">
                        {group.options.map((option) => {
                            const isSelected = selectedValues.includes(option.value)
                            return (
                                <Button
                                    variant="ghost"
                                    key={option.value}
                                    onClick={() => toggleOption(groupIdx, option.value)}
                                    className={cn(
                                        "w-full flex items-center justify-between px-3 py-2.5 h-auto rounded-xl transition-all duration-200 group text-left font-normal",
                                        isSelected
                                            ? "bg-brand-green/10 dark:bg-brand-gold/10 text-brand-deep dark:text-brand-gold hover:bg-brand-green/15 dark:hover:bg-brand-gold/15"
                                            : "text-brand-accent/60 dark:text-brand-cream/60 hover:bg-brand-deep/5 dark:hover:bg-white/5"
                                    )}
                                >
                                    <span className="text-sm font-medium">{option.label}</span>
                                    {isSelected && <Check className="w-3.5 h-3.5" />}
                                </Button>
                            )
                        })}
                    </div>
                </div>
            ))}
        </div>
    )

    if (isMobile) {
        return (
            <Drawer open={isOpen} onOpenChange={setIsOpen}>
                <DrawerTrigger asChild className={className}>
                    {FilterTrigger}
                </DrawerTrigger>
                <DrawerContent>
                    <DrawerStickyHeader>
                        <div className="flex items-center justify-between">
                            <DrawerTitle className="text-xl">Select Filters</DrawerTitle>
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
                        {Content}
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
        <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild className={className}>
                {FilterTrigger}
            </PopoverTrigger>
            <PopoverContent
                align={align}
                sideOffset={12}
                avoidCollisions
                collisionPadding={10}
                className="w-80 p-0 rounded-[32px] flex flex-col overflow-hidden bg-white dark:bg-brand-deep border-brand-deep/5 dark:border-white/10 shadow-2xl z-50 transition-all duration-200 max-h-(--radix-popover-content-available-height)"
            >
                {/* Header */}
                <div className="px-6 py-4 flex items-center justify-between border-b border-brand-deep/5 dark:border-white/5 shrink-0">
                    <span className="text-xs font-bold uppercase tracking-widest text-brand-accent/70 dark:text-brand-cream/80">Select Filters</span>
                </div>

                {/* Content */}
                <div className="p-4 flex-1 overflow-y-auto custom-scrollbar">
                    {Content}
                </div>

                {/* Footer */}
                <div className="p-4 bg-brand-cream/10 dark:bg-white/5 border-t border-brand-deep/5 dark:border-white/5 shrink-0">
                    <div className="flex items-center gap-2">
                        {activeCount > 0 && (
                            <Button
                                variant="ghost"
                                onClick={(e) => {
                                    e.stopPropagation()
                                    onClear()
                                }}
                                className="flex-1 rounded-xl text-rose-500/80 dark:text-rose-400 hover:text-rose-500 bg-rose-500/5 hover:bg-rose-500/10 dark:hover:bg-rose-500/10 dark:bg-rose-500/5 font-bold text-[10px] h-10 uppercase tracking-widest"
                            >
                                Reset
                            </Button>
                        )}
                        <Button
                            onClick={() => setIsOpen(false)}
                            className={cn(
                                "rounded-xl bg-brand-deep text-brand-gold dark:bg-brand-gold dark:hover:bg-brand-gold/80 dark:text-brand-deep font-bold text-[10px] h-10 shadow-lg uppercase tracking-widest",
                                activeCount > 0 ? "flex-[1.5]" : "w-full"
                            )}
                        >
                            Done
                        </Button>
                    </div>
                </div>
            </PopoverContent>
        </Popover>
    )
}
