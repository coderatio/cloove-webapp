"use client"

import * as React from "react"
import { Search, Filter, Plus } from "lucide-react"
import { Button } from "../ui/button"
import { cn } from "../../lib/utils"

interface ManagementHeaderProps {
    title: string
    description?: string
    searchValue: string
    onSearchChange: (value: string) => void
    searchPlaceholder?: string
    onFilterClick?: () => void
    addButtonLabel?: string
    onAddClick?: () => void
    className?: string
}

export function ManagementHeader({
    title,
    description,
    searchValue,
    onSearchChange,
    searchPlaceholder = "Search...",
    onFilterClick,
    addButtonLabel,
    onAddClick,
    className
}: ManagementHeaderProps) {
    return (
        <div className={cn("space-y-6", className)}>
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="font-serif text-3xl md:text-5xl font-medium text-brand-deep dark:text-brand-cream mb-2">
                        {title}
                    </h1>
                    {description && (
                        <p className="text-brand-accent/60 dark:text-brand-cream/60 max-w-lg">
                            {description}
                        </p>
                    )}
                </div>
                {addButtonLabel && onAddClick && (
                    <Button
                        onClick={onAddClick}
                        className="rounded-full bg-brand-deep text-brand-gold dark:bg-brand-gold dark:text-brand-deep hover:scale-105 transition-all shadow-lg h-12 px-6"
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        {addButtonLabel}
                    </Button>
                )}
            </div>

            <div className="flex items-center gap-3">
                <div className="relative flex-1 group">
                    <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                        <Search className="w-4 h-4 text-brand-accent/40 group-focus-within:text-brand-green transition-colors" />
                    </div>
                    <input
                        type="text"
                        value={searchValue}
                        onChange={(e) => onSearchChange(e.target.value)}
                        placeholder={searchPlaceholder}
                        className="w-full pl-10 pr-4 py-3 rounded-2xl bg-white/40 dark:bg-white/5 border border-brand-deep/5 dark:border-white/5 focus:outline-none focus:ring-2 focus:ring-brand-green/20 focus:border-brand-green/30 transition-all placeholder:text-brand-accent/30 text-brand-deep dark:text-brand-cream"
                    />
                </div>
                {onFilterClick && (
                    <Button
                        variant="outline"
                        onClick={onFilterClick}
                        className="rounded-2xl h-[46px] border-brand-deep/5 dark:border-white/5 px-4 text-brand-accent/60 dark:text-brand-cream/60 hover:bg-brand-deep/5 dark:hover:bg-white/5"
                    >
                        <Filter className="w-4 h-4 mr-2" />
                        Filter
                    </Button>
                )}
            </div>
        </div>
    )
}
