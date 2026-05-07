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
        <div className={cn("relative group flex-1 md:min-w-[300px] min-w-0", className)}>
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                <Search className="w-4 h-4 text-muted-foreground transition-colors group-focus-within:text-foreground" />
            </div>
            <input
                type="text"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                className="w-full rounded-2xl border border-border bg-background px-4 py-3 pl-10 text-sm font-medium text-foreground transition-all placeholder:text-muted-foreground focus:border-primary/30 focus:outline-none focus:ring-2 focus:ring-primary/15"
            />
        </div>
    )
}
