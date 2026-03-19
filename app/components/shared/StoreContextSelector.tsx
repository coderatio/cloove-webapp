"use client"

import * as React from 'react'
import { LayoutGrid, Store as StoreIcon, ChevronsUpDown } from 'lucide-react'
import { cn } from '@/app/lib/utils'
import { useStores } from '@/app/domains/stores/providers/StoreProvider'
import { SearchableSelect, SearchableSelectOption } from '@/app/components/ui/searchable-select'

interface StoreContextSelectorProps {
    value: string // 'all-stores' or store.id
    onChange: (storeId: string) => void
    className?: string
}

export function StoreContextSelector({ value, onChange, className }: StoreContextSelectorProps) {
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
                icon: <LayoutGrid className="h-4 w-4" />
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
            className={className}
            renderTrigger={(currValue) => (
                <button
                    className={cn(
                        "h-12 px-6 cursor-pointer rounded-full border border-brand-deep/5 dark:border-white/10 bg-white dark:bg-white/5 hover:bg-brand-deep/2 dark:hover:bg-white/10 transition-all flex w-full items-center gap-3 shadow-sm active:scale-95",
                        className
                    )}
                >
                    <div className="flex min-w-0 flex-1 items-center gap-1.5">
                        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-brand-green/10 dark:bg-brand-gold/10 text-brand-green dark:text-brand-gold">
                            {currValue === 'all-stores' ? <LayoutGrid className="h-3.5 w-3.5" /> : <StoreIcon className="h-3.5 w-3.5" />}
                        </div>
                        <div className="min-w-0 flex-1 flex flex-col justify-center overflow-hidden text-left">
                            <span className="text-[10px] uppercase tracking-widest font-bold text-brand-accent/40 dark:text-brand-cream/40 leading-none mb-0.5 truncate">Viewing</span>
                            <span className="truncate text-xs font-bold leading-none text-brand-deep dark:text-brand-cream">
                                {selectedOption.label}
                            </span>
                        </div>
                    </div>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-40 dark:opacity-60" />
                </button>
            )}
        />
    )
}
