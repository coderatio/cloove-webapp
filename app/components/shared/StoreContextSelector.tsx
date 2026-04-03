"use client"

import * as React from 'react'
import { Building2, Store as StoreIcon, ChevronsUpDown } from 'lucide-react'
import { cn } from '@/app/lib/utils'
import { useStores } from '@/app/domains/stores/providers/StoreProvider'
import { SearchableSelect, SearchableSelectOption } from '@/app/components/ui/searchable-select'

interface StoreContextSelectorProps {
    value: string // 'all-stores' or store.id
    onChange: (storeId: string) => void
    className?: string
    /** Narrow trigger: single line, no “Viewing” label — for grouped mobile toolbar */
    compact?: boolean
}

export function StoreContextSelector({ value, onChange, className, compact = false }: StoreContextSelectorProps) {
    const { stores, isLoading } = useStores()

    const options: SearchableSelectOption[] = React.useMemo(() => {
        const storeOptions = stores.map(store => ({
            label: store.name,
            value: store.id,
            icon: <StoreIcon className="h-4 w-4" />
        }))

        if (stores.length <= 1) return storeOptions

        return [
            {
                label: 'All Stores',
                value: 'all-stores',
                icon: <Building2 className="h-4 w-4" />
            },
            ...storeOptions
        ]
    }, [stores])

    const selectedOption = options.find(opt => opt.value === value) || options[0] || { label: 'Select Store', value: '' }

    return (
        <SearchableSelect
            options={options}
            value={value}
            onChange={onChange}
            disabled={isLoading || options.length === 0}
            placeholder="Select store..."
            searchPlaceholder="Search branches..."
            popoverAlign={compact ? 'end' : 'center'}
            renderTrigger={(currValue) => (
                <button
                    type="button"
                    aria-label={compact ? `Store: ${selectedOption.label}` : undefined}
                    className={cn(
                        "cursor-pointer border border-brand-deep/5 bg-white transition-all flex items-center shadow-sm active:scale-[0.98] dark:border-white/10 dark:bg-white/5 hover:bg-brand-deep/2 dark:hover:bg-white/10",
                        compact
                            ? "h-10 max-w-[118px] gap-1.5 rounded-full px-2.5 py-0"
                            : "h-12 w-full gap-3 rounded-full px-6",
                        className
                    )}
                >
                    <div
                        className={cn(
                            "flex min-w-0 flex-1 items-center",
                            compact ? "gap-1.5" : "gap-1.5"
                        )}
                    >
                        <div
                            className={cn(
                                "flex shrink-0 items-center justify-center bg-brand-green/10 text-brand-green dark:bg-brand-gold/10 dark:text-brand-gold",
                                compact ? "h-7 w-7 rounded-full" : "h-6 w-6 rounded-lg"
                            )}
                        >
                            {currValue === "all-stores" ? (
                                <Building2 className={compact ? "h-3.5 w-3.5" : "h-3.5 w-3.5"} />
                            ) : (
                                <StoreIcon className={compact ? "h-3.5 w-3.5" : "h-3.5 w-3.5"} />
                            )}
                        </div>
                        <div
                            className={cn(
                                "min-w-0 flex-1 overflow-hidden text-left",
                                compact ? "flex items-center" : "flex flex-col justify-center"
                            )}
                        >
                            {!compact && (
                                <span className="mb-0.5 truncate text-[10px] font-bold uppercase leading-none tracking-widest text-brand-accent/40 dark:text-brand-cream/40">
                                    Viewing
                                </span>
                            )}
                            <span
                                className={cn(
                                    "truncate font-bold text-brand-deep dark:text-brand-cream",
                                    compact ? "text-[11px] leading-tight" : "text-xs leading-none"
                                )}
                            >
                                {selectedOption.label}
                            </span>
                        </div>
                    </div>
                    <ChevronsUpDown
                        className={cn(
                            "shrink-0 opacity-40 dark:opacity-60",
                            compact ? "ml-0 h-3.5 w-3.5" : "ml-2 h-4 w-4"
                        )}
                    />
                </button>
            )}
        />
    )
}
