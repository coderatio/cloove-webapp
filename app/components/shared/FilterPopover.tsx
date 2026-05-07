"use client"

import * as React from "react"
import { Filter, Check } from "lucide-react"
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
    /** 'list' renders flat toggle buttons (default, best for ≤3 options).
     *  'multiselect' renders a searchable dropdown (best for 4+ options). */
    type?: 'list' | 'multiselect'
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
                    ? "border-primary/20 bg-primary/12 text-foreground shadow-sm"
                    : "border-border bg-background text-foreground hover:bg-muted",
                activeCount > 0 && !isOpen && "border-primary/25 bg-primary/8"
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
                "h-[46px] w-full rounded-2xl border border-border bg-background px-4 transition-all duration-300",
                isOpen
                    ? "border-primary/20 bg-primary/12 text-foreground shadow-sm"
                    : "border-border bg-background text-foreground hover:bg-muted",
                activeCount > 0 && !isOpen && "border-primary/25 bg-primary/8"
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
                    <h4 className="px-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
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
                                            ? "border border-primary/15 bg-primary/10 text-foreground hover:bg-primary/12"
                                            : "text-muted-foreground hover:bg-muted hover:text-foreground"
                                    )}
                                >
                                    <span className="text-sm font-medium">{option.label}</span>
                                    {isSelected && <Check className="h-3.5 w-3.5 text-primary" />}
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
                                    className="h-auto bg-transparent p-0 text-[10px] font-bold uppercase tracking-widest text-rose-500/80 hover:bg-transparent hover:text-rose-500 dark:text-rose-400"
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
                                className="h-12 w-full rounded-xl text-sm font-semibold shadow-sm"
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
                className="z-50 flex max-h-(--radix-popover-content-available-height) w-80 flex-col overflow-hidden rounded-[32px] border border-border bg-background p-0 shadow-2xl transition-all duration-200"
            >
                {/* Header */}
                <div className="flex shrink-0 items-center justify-between border-b border-border px-6 py-4">
                    <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Select Filters</span>
                </div>

                {/* Content */}
                <div className="p-4 flex-1 overflow-y-auto custom-scrollbar">
                    {Content}
                </div>

                {/* Footer */}
                <div className="shrink-0 border-t border-border bg-muted/30 p-4">
                    <div className="flex items-center gap-2">
                        {activeCount > 0 && (
                            <Button
                                variant="ghost"
                                onClick={(e) => {
                                    e.stopPropagation()
                                    onClear()
                                }}
                                className="h-10 flex-1 rounded-xl bg-rose-500/5 text-[10px] font-bold uppercase tracking-widest text-rose-500/80 hover:bg-rose-500/10 hover:text-rose-500 dark:text-rose-400"
                            >
                                Reset
                            </Button>
                        )}
                        <Button
                            onClick={() => setIsOpen(false)}
                            className={cn(
                                "h-10 rounded-xl text-[10px] font-semibold uppercase tracking-widest shadow-sm",
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
