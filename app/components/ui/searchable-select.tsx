"use client"

import * as React from 'react'
import { Check, ChevronsUpDown, Search, X } from 'lucide-react'
import { cn } from '@/app/lib/utils'
import { Button } from '@/app/components/ui/button'
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/app/components/ui/popover'

export interface SearchableSelectOption {
    label: string
    value: string
    icon?: React.ReactNode
    disabled?: boolean
}

interface SearchableSelectProps {
    options: SearchableSelectOption[]
    value?: string
    onChange: (value: string) => void
    placeholder?: string
    searchPlaceholder?: string
    emptyMessage?: string
    disabled?: boolean
    className?: string
    triggerClassName?: string
    renderTrigger?: (selectedValue: string | undefined, options: SearchableSelectOption[]) => React.ReactNode
}

export function SearchableSelect({
    options,
    value,
    onChange,
    placeholder = "Select item...",
    searchPlaceholder = "Search...",
    emptyMessage = "No item found.",
    disabled = false,
    className,
    triggerClassName,
    renderTrigger
}: SearchableSelectProps) {
    const [open, setOpen] = React.useState(false)
    const [searchQuery, setSearchQuery] = React.useState("")

    // Filter options based on search query
    const filteredOptions = options.filter(option =>
        option.label.toLowerCase().includes(searchQuery.toLowerCase())
    )

    const handleSelect = (optionValue: string) => {
        onChange(optionValue)
        setOpen(false)
        setSearchQuery("")
    }

    const selectedOption = options.find(o => o.value === value)

    // Default trigger renderer
    const defaultRenderTrigger = () => {
        return (
            <Button
                variant="outline"
                role="combobox"
                aria-expanded={open}
                disabled={disabled}
                className={cn(
                    "w-full justify-between h-12 rounded-xl border-brand-deep/10 dark:border-white/10 bg-white dark:bg-white/5 hover:bg-brand-deep/2 text-left font-normal",
                    triggerClassName
                )}
            >
                <div className="flex items-center gap-2 truncate">
                    {selectedOption?.icon && (
                        <span className="text-brand-accent/60 dark:text-brand-cream/60 shrink-0">
                            {selectedOption.icon}
                        </span>
                    )}
                    {value ? (
                        <span className="font-medium truncate text-brand-deep dark:text-brand-cream">
                            {selectedOption?.label || value}
                        </span>
                    ) : (
                        <span className="text-brand-accent/40 dark:text-brand-cream/40 font-normal">
                            {placeholder}
                        </span>
                    )}
                </div>
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
        )
    }

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                {renderTrigger ? renderTrigger(value, options) : defaultRenderTrigger()}
            </PopoverTrigger>
            <PopoverContent
                className={cn(
                    "w-(--radix-popover-trigger-width) p-0 rounded-xl overflow-hidden shadow-xl border-brand-deep/5 dark:border-brand-cream/10 bg-white dark:bg-brand-deep-800",
                    className
                )}
                align="start"
            >
                <div className="flex flex-col max-h-[300px]">
                    {/* Search Input */}
                    <div className="flex items-center border-b border-brand-deep/5 dark:border-brand-cream/10 px-3 py-2 sticky top-0 bg-white dark:bg-brand-deep-800 z-10">
                        <Search className="mr-2 h-4 w-4 shrink-0 opacity-50 dark:text-brand-cream/60" />
                        <input
                            className="flex h-9 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground dark:placeholder:text-brand-cream/40 disabled:cursor-not-allowed disabled:opacity-50 dark:text-brand-cream"
                            placeholder={searchPlaceholder}
                            value={searchQuery}
                            autoFocus
                            onChange={(e) => setSearchQuery(e.target.value)}
                            autoComplete="off"
                        />
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery("")}
                                className="ml-1 opacity-50 hover:opacity-100 dark:text-brand-cream/60"
                                type="button"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        )}
                    </div>

                    {/* Options List */}
                    <div className="overflow-y-auto flex-1 p-1 custom-scrollbar">
                        {filteredOptions.length === 0 ? (
                            <div className="py-6 text-center text-sm text-brand-deep/60 dark:text-brand-cream/60">
                                {emptyMessage}
                            </div>
                        ) : (
                            <div className="space-y-0.5">
                                {filteredOptions.map((option) => (
                                    <div
                                        key={option.value}
                                        className={cn(
                                            "relative flex cursor-pointer select-none items-center rounded-lg px-2 py-1.5 text-sm outline-none transition-colors",
                                            "hover:bg-brand-deep/5 dark:hover:bg-white/10 dark:text-brand-cream",
                                            option.disabled && "pointer-events-none opacity-50"
                                        )}
                                    >
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.preventDefault()
                                                e.stopPropagation()
                                                handleSelect(option.value)
                                            }}
                                            disabled={option.disabled}
                                            className="flex cursor-pointer w-full items-center text-left"
                                        >
                                            <div className={cn(
                                                "mr-2 flex h-4 w-4 items-center justify-center transition-all shrink-0",
                                                value === option.value
                                                    ? "text-brand-deep dark:text-brand-cream"
                                                    : "opacity-0"
                                            )}>
                                                <Check className={cn("h-4 w-4")} />
                                            </div>
                                            {option.icon && <span className="mr-2 text-muted-foreground">{option.icon}</span>}
                                            <span className="flex-1 truncate">{option.label}</span>
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </PopoverContent>
        </Popover>
    )
}
