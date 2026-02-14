"use client"

import * as React from 'react'
import { Trash2, Edit3, DollarSign, Package, Tag, AlertCircle } from 'lucide-react'
import { GlassCard } from '@/app/components/ui/glass-card'
import { cn } from '@/app/lib/utils'
import { MoneyInput } from '@/app/components/ui/money-input'
import { useBusiness } from '@/app/components/BusinessProvider'

export interface ExtractedProduct {
    id: string
    name: string
    price: number | string
    sku: string
    stockQuantity: number | string
    status: 'pending' | 'error' | 'success'
    errors?: string[]
}

interface ProductExtractionCardProps {
    product: ExtractedProduct
    onUpdate: (id: string, updates: Partial<ExtractedProduct>) => void
    onRemove: (id: string) => void
}

export function ProductExtractionCard({
    product,
    onUpdate,
    onRemove
}: ProductExtractionCardProps) {
    const { currency } = useBusiness()
    const [isEditing, setIsEditing] = React.useState(false)

    const hasErrors = product.errors && product.errors.length > 0

    return (
        <div className="relative group">
            <GlassCard className={cn(
                "p-4 border transition-all duration-300",
                hasErrors
                    ? "border-rose-500/20 bg-rose-500/5 dark:border-rose-400/20 dark:bg-rose-400/10"
                    : "border-brand-deep/5 dark:border-white/5 bg-brand-deep/2 dark:bg-white/2"
            )}>
                <div className="flex items-start gap-4">
                    {/* Status Indicator */}
                    <div className={cn(
                        "mt-1 w-2 h-2 rounded-full shrink-0",
                        product.status === 'success' ? "bg-brand-green dark:bg-brand-deep-400" :
                            product.status === 'error' ? "bg-rose-500 dark:bg-rose-400" : "bg-brand-gold animate-pulse"
                    )} />

                    <div className="flex-1 space-y-4">
                        <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                                <input
                                    value={product.name}
                                    onChange={(e) => onUpdate(product.id, { name: e.target.value })}
                                    className="w-full bg-transparent font-serif text-lg font-medium text-brand-deep dark:text-brand-cream focus:outline-none focus:ring-b-2 focus:ring-brand-gold/40 border-b border-transparent hover:border-brand-deep/10 dark:hover:border-white/10"
                                    placeholder="Product Name"
                                />
                            </div>
                            <button
                                onClick={() => onRemove(product.id)}
                                className="p-2 rounded-xl cursor-pointer text-rose-500 dark:text-rose-400 hover:bg-rose-500/10 dark:hover:bg-rose-400/20 transition-colors sm:opacity-0 group-hover:opacity-100"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div className="space-y-1">
                                <label className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-brand-deep/40 dark:text-brand-cream/40">
                                    <Tag className="w-3 h-3" /> Price
                                </label>
                                <div className="flex items-center gap-1 border-b border-transparent hover:border-brand-deep/10 dark:hover:border-white/10 transition-colors">
                                    <span className="text-sm font-medium text-brand-deep dark:text-brand-gold">{currency}</span>
                                    <MoneyInput
                                        value={product.price}
                                        onChange={(val) => onUpdate(product.id, { price: val })}
                                        hideSymbol
                                        className="w-full bg-transparent text-sm text-brand-deep dark:text-brand-cream focus-visible:ring-0 border-none dark:border-none dark:bg-transparent px-0 py-1 h-auto"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-brand-deep/40 dark:text-brand-cream/40">
                                    <Package className="w-3 h-3" /> SKU
                                </label>
                                <input
                                    value={product.sku}
                                    onChange={(e) => onUpdate(product.id, { sku: e.target.value })}
                                    className="w-full bg-transparent text-sm text-brand-deep dark:text-brand-cream focus:outline-none border-b border-transparent hover:border-brand-deep/10 dark:hover:border-white/10"
                                    placeholder="SKU-123"
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-brand-deep/40 dark:text-brand-cream/40">
                                    Stock
                                </label>
                                <input
                                    type="text"
                                    inputMode="numeric"
                                    pattern="[0-9]*"
                                    value={product.stockQuantity}
                                    onChange={(e) => {
                                        const val = e.target.value.replace(/[^0-9]/g, '')
                                        onUpdate(product.id, { stockQuantity: val === '' ? 0 : parseInt(val) })
                                    }}
                                    className="w-full bg-transparent text-sm text-brand-deep dark:text-brand-cream focus:outline-none border-b border-transparent hover:border-brand-deep/10 dark:hover:border-white/10"
                                    placeholder="0"
                                />
                            </div>
                        </div>

                        {hasErrors && (
                            <div className="flex flex-col gap-1.5 pt-2 border-t border-rose-500/10 dark:border-rose-400/20">
                                {product.errors?.map((err, i) => (
                                    <div key={i} className="flex items-center gap-2 text-rose-500 dark:text-rose-300 text-[10px] font-medium">
                                        <AlertCircle className="w-3 h-3" />
                                        {err}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </GlassCard>
        </div>
    )
}
