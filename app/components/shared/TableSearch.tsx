"use client"

import * as React from "react"
import { Search } from "lucide-react"
import { cn } from "../../lib/utils"

interface TableSearchProps {
    value: string
    onChange: (value: string) => void
    placeholder?: string
    className?: string
}

export function TableSearch({
    value,
    onChange,
    placeholder = "Search...",
    className
}: TableSearchProps) {
    return (
        <div className={cn("relative group min-w-[300px]", className)}>
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                <Search className="w-4 h-4 text-brand-accent/40 group-focus-within:text-brand-green transition-colors" />
            </div>
            <input
                type="text"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-white/40 dark:bg-white/5 border border-brand-deep/5 dark:border-white/5 focus:outline-none focus:ring-2 focus:ring-brand-green/20 focus:border-brand-green/30 transition-all placeholder:text-brand-accent/30 text-brand-deep dark:text-brand-cream text-sm font-medium"
            />
        </div>
    )
}
