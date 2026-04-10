"use client"

import * as React from "react"
import { X } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/app/lib/utils"
import type { OrderFilterConfig, OrderFilterState } from "../types"

interface ActiveFilterChipsProps {
    value: OrderFilterState
    config: OrderFilterConfig
    onChange: (next: OrderFilterState) => void
    onClearAll: () => void
}

interface Chip {
    key: string
    label: string
    onRemove: () => void
}

export function ActiveFilterChips({ value, config, onChange, onClearAll }: ActiveFilterChipsProps) {
    const chips: Chip[] = []

    // Prefix-based filter chips
    for (const selected of value.selectedFilters) {
        let label: string | undefined
        for (const group of config.groups) {
            const opt = group.options.find(o => o.value === selected)
            if (opt) { label = opt.label; break }
        }
        if (!label) continue
        chips.push({
            key: selected,
            label,
            onRemove: () =>
                onChange({ ...value, selectedFilters: value.selectedFilters.filter(v => v !== selected) }),
        })
    }

    // Date range chip
    if (value.startDate) {
        const from = new Date(value.startDate)
        const to = value.endDate ? new Date(value.endDate) : undefined
        const label =
            to && to.getTime() !== from.getTime()
                ? `${format(from, "MMM d")} – ${format(to, "MMM d")}`
                : format(from, "MMM d, yyyy")
        chips.push({
            key: "__date__",
            label,
            onRemove: () => onChange({ ...value, startDate: undefined, endDate: undefined }),
        })
    }

    // Academic term chip
    if (value.academicTermId && config.termOptions) {
        const term = config.termOptions.find(t => t.id === value.academicTermId)
        if (term) {
            chips.push({
                key: "__term__",
                label: term.label,
                onRemove: () => onChange({ ...value, academicTermId: undefined }),
            })
        }
    }

    if (chips.length === 0) return null

    return (
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-0.5">
            {chips.map((chip) => (
                <span
                    key={chip.key}
                    className="inline-flex items-center gap-1.5 h-7 pl-3 pr-2 rounded-full bg-brand-green/10 dark:bg-brand-gold/10 text-brand-deep dark:text-brand-gold text-xs font-semibold whitespace-nowrap shrink-0 border border-brand-green/20 dark:border-brand-gold/20"
                >
                    {chip.label}
                    <button
                        type="button"
                        onClick={chip.onRemove}
                        className="flex items-center justify-center w-4 h-4 rounded-full hover:bg-brand-deep/10 dark:hover:bg-white/10 transition-colors"
                        aria-label={`Remove ${chip.label} filter`}
                    >
                        <X className="w-2.5 h-2.5" />
                    </button>
                </span>
            ))}

            <button
                type="button"
                onClick={onClearAll}
                className="inline-flex items-center h-7 px-3 rounded-full text-xs font-semibold text-rose-500/70 dark:text-rose-400/70 hover:text-rose-500 dark:hover:text-rose-400 hover:bg-rose-500/8 dark:hover:bg-rose-400/8 transition-colors whitespace-nowrap shrink-0"
            >
                Clear all
            </button>
        </div>
    )
}
