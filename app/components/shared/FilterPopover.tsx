"use client"

import * as React from "react"
import { Filter, X, Check } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "../../lib/utils"
import { Button } from "../ui/button"

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
}

export function FilterPopover({
    groups,
    selectedValues,
    onSelectionChange,
    onClear,
    className
}: FilterPopoverProps) {
    const [isOpen, setIsOpen] = React.useState(false)
    const popoverRef = React.useRef<HTMLDivElement>(null)

    // Handle clicks outside to close
    React.useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
                setIsOpen(false)
            }
        }
        if (isOpen) {
            document.addEventListener("mousedown", handleClickOutside)
        }
        return () => document.removeEventListener("mousedown", handleClickOutside)
    }, [isOpen])

    const toggleOption = (value: string) => {
        if (selectedValues.includes(value)) {
            onSelectionChange(selectedValues.filter(v => v !== value))
        } else {
            onSelectionChange([...selectedValues, value])
        }
    }

    const activeCount = selectedValues.length

    return (
        <div className={cn("relative inline-block text-left", className)} ref={popoverRef}>
            <Button
                variant="outline"
                onClick={() => setIsOpen(!isOpen)}
                className={cn(
                    "rounded-2xl h-[46px] bg-white border-brand-deep/8 dark:border-brand-gold/20 dark:bg-brand-deep/20 px-4 transition-all duration-300",
                    isOpen
                        ? "bg-brand-deep text-brand-gold dark:bg-brand-gold dark:text-brand-deep border-transparent shadow-lg"
                        : "text-brand-accent/60 dark:text-brand-cream/60 hover:bg-brand-deep/5 dark:hover:bg-white/5",
                    activeCount > 0 && !isOpen && "border-brand-green/30 dark:border-brand-gold/30 bg-brand-green/5 dark:bg-brand-gold/5"
                )}
            >
                <Filter className={cn("w-4 h-4 mr-2 transition-transform", isOpen && "scale-110")} />
                Filter
                {activeCount > 0 && (
                    <span className="ml-2 w-5 h-5 flex items-center justify-center rounded-full bg-brand-green text-brand-cream text-[10px] font-bold dark:bg-brand-gold dark:text-brand-deep shadow-sm">
                        {activeCount}
                    </span>
                )}
            </Button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                        className="absolute right-0 mt-3 w-72 origin-top-right rounded-3xl bg-white dark:bg-brand-deep border border-brand-deep/5 dark:border-white/10 shadow-2xl z-50 overflow-hidden"
                    >
                        {/* Header */}
                        <div className="px-6 py-4 flex items-center justify-between border-b border-brand-deep/5 dark:border-white/5">
                            <span className="text-xs font-bold uppercase tracking-widest text-brand-accent/40 dark:text-brand-cream/40">Select Filters</span>
                            {activeCount > 0 && (
                                <Button
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        onClear()
                                    }}
                                    variant="destructive"
                                    className="text-[10px] font-bold text-rose-500/60 dark:text-rose-400 hover:text-rose-500 dark:hover:text-rose-500 transition-colors uppercase tracking-widest"
                                >
                                    Clear All
                                </Button>
                            )}
                        </div>

                        {/* Content */}
                        <div className="p-4 max-h-[400px] overflow-y-auto custom-scrollbar">
                            {groups.map((group, groupIdx) => (
                                <div key={groupIdx} className={cn("space-y-3", groupIdx > 0 && "mt-6")}>
                                    <h4 className="px-2 text-[10px] font-bold uppercase tracking-widest text-brand-accent/30 dark:text-white/20">
                                        {group.title}
                                    </h4>
                                    <div className="grid grid-cols-1 gap-1">
                                        {group.options.map((option) => {
                                            const isSelected = selectedValues.includes(option.value)
                                            return (
                                                <button
                                                    key={option.value}
                                                    onClick={() => toggleOption(option.value)}
                                                    className={cn(
                                                        "flex cursor-pointer items-center justify-between px-3 py-2.5 rounded-xl transition-all duration-200 group text-left",
                                                        isSelected
                                                            ? "bg-brand-green/10 dark:bg-brand-gold/10 text-brand-deep dark:text-brand-gold"
                                                            : "text-brand-accent/60 dark:text-brand-cream/60 hover:bg-brand-deep/5 dark:hover:bg-white/5"
                                                    )}
                                                >
                                                    <span className="text-sm font-medium">{option.label}</span>
                                                    {isSelected && <Check className="w-3.5 h-3.5" />}
                                                </button>
                                            )
                                        })}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Footer */}
                        <div className="p-4 bg-brand-cream/10 dark:bg-white/5 border-t border-brand-deep/5 dark:border-white/5">
                            <Button
                                onClick={() => setIsOpen(false)}
                                className="w-full rounded-xl bg-brand-deep text-brand-gold dark:bg-brand-gold dark:hover:bg-brand-gold/80 dark:text-brand-deep font-bold text-xs h-10 shadow-lg"
                            >
                                Done
                            </Button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
