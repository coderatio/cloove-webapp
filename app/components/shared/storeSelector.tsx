"use client"

import * as React from 'react'
import { ChevronsUpDown, Store as StoreIcon } from 'lucide-react'
import { Button } from '@/app/components/ui/button'
import { useStores } from '@/app/domains/stores/providers/StoreProvider'
import { MultiSelect, MultiSelectOption } from '@/app/components/ui/multi-select'

interface StoreSelectorProps {
    value: string[]
    onChange: (storeIds: string[]) => void
    disabled?: boolean
}

export function StoreSelector({ value = [], onChange, disabled }: StoreSelectorProps) {
    const { stores, isLoading } = useStores()

    // Filter out 'all-stores' if it exists in the list for selection purposes
    const availableStores = stores.filter(s => s.id !== 'all-stores')

    const options: MultiSelectOption[] = availableStores.map(store => ({
        label: store.name,
        value: store.id,
        disabled: false,
        badge: store.isDefault ? (
            <span className="text-[10px] uppercase tracking-wider font-bold text-brand-accent/40 dark:text-brand-cream/40">
                Default
            </span>
        ) : undefined
    }))

    return (
        <MultiSelect
            options={options}
            value={value}
            onChange={onChange}
            disabled={disabled || isLoading}
            placeholder="Select stores..."
            searchPlaceholder="Search stores..."
            emptyMessage="No store found."
            renderTrigger={(selectedValues, opts) => (
                <Button
                    variant="outline"
                    role="combobox"
                    disabled={disabled || isLoading}
                    className="w-full justify-between h-12 rounded-xl border-brand-deep/10 dark:border-white/10 bg-white dark:bg-white/5 hover:bg-brand-deep/2 text-left font-normal"
                >
                    <div className="flex items-center gap-2 truncate">
                        <StoreIcon className="w-4 h-4 text-brand-accent/60 dark:text-brand-cream/60 shrink-0" />
                        {selectedValues.length === 0 ? (
                            <span className="text-brand-accent/40 dark:text-brand-cream/40 font-normal">
                                Select stores...
                            </span>
                        ) : (
                            <span className="font-medium truncate text-brand-deep dark:text-brand-cream">
                                {selectedValues.length === opts.length
                                    ? "All Stores"
                                    : `${selectedValues.length} selected`}
                            </span>
                        )}
                    </div>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            )}
        />
    )
}
