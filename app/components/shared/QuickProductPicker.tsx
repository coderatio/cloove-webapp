"use client"

import * as React from "react"
import { Minus, Plus, Search, Package } from "lucide-react"
import { cn } from "@/app/lib/utils"
import { Button } from "@/app/components/ui/button"
import { Input } from "@/app/components/ui/input"
import { useInventory } from "@/app/domains/orders/hooks/useInventory"
import type { Product } from "@/app/domains/orders/hooks/useInventory"
import { formatCurrency } from "@/app/lib/formatters"
import { useBusiness } from "@/app/components/BusinessProvider"

export interface PickedItem {
    productId: string
    productName: string
    price: number
    quantity: number
}

interface QuickProductPickerProps {
    selected: PickedItem[]
    onChange: (items: PickedItem[]) => void
    /** Pre-filter to this category slug/name if it exists */
    categoryHint?: string
    /** Notifies parent when the total breakdown row is visible */
    onBreakdownVisibilityChange?: (isVisible: boolean) => void
    /** Optional id target to allow external jump-to-breakdown interactions */
    breakdownAnchorId?: string
}

export function QuickProductPicker({
    selected,
    onChange,
    categoryHint,
    onBreakdownVisibilityChange,
    breakdownAnchorId = "quick-product-breakdown",
}: QuickProductPickerProps) {
    const { activeBusiness } = useBusiness()
    const currency = activeBusiness?.currency ?? "NGN"
    const [search, setSearch] = React.useState("")
    const [activeCategory, setActiveCategory] = React.useState<string>("All")

    const { products, isLoadingProducts } = useInventory()

    // Derive unique categories from products
    const categories = React.useMemo(() => {
        const cats: string[] = Array.from(new Set(products.map((p: Product) => p.category)))
        return ["All", ...cats]
    }, [products])

    // Set initial category from hint once products load
    React.useEffect(() => {
        if (!categoryHint || isLoadingProducts) return
        const match = categories.find(
            (c) => c.toLowerCase() === categoryHint.toLowerCase()
        )
        if (match) setActiveCategory(match)
    }, [categories, categoryHint, isLoadingProducts])

    const filtered = React.useMemo(() => {
        let list: Product[] = products
        if (activeCategory !== "All") list = list.filter((p: Product) => p.category === activeCategory)
        if (search.trim()) {
            const q = search.toLowerCase()
            list = list.filter((p: Product) => p.product.toLowerCase().includes(q))
        }
        return list
    }, [products, activeCategory, search])

    const selectedMap = React.useMemo(
        () => new Map(selected.map((i) => [i.productId, i])),
        [selected]
    )

    const total = selected.reduce((sum, i) => sum + i.price * i.quantity, 0)
    const breakdownRef = React.useRef<HTMLDivElement | null>(null)

    React.useEffect(() => {
        if (!onBreakdownVisibilityChange) return
        if (!breakdownRef.current || selected.length === 0) {
            onBreakdownVisibilityChange(false)
            return
        }

        const observer = new IntersectionObserver(
            ([entry]) => {
                onBreakdownVisibilityChange(entry.isIntersecting)
            },
            { threshold: 0.35 }
        )

        observer.observe(breakdownRef.current)
        return () => observer.disconnect()
    }, [selected.length, onBreakdownVisibilityChange])

    const increment = (productId: string, productName: string, price: number) => {
        const existing = selectedMap.get(productId)
        if (existing) {
            onChange(selected.map((i) => i.productId === productId ? { ...i, quantity: i.quantity + 1 } : i))
        } else {
            onChange([...selected, { productId, productName, price, quantity: 1 }])
        }
    }

    const decrement = (productId: string) => {
        const existing = selectedMap.get(productId)
        if (!existing) return
        if (existing.quantity <= 1) {
            onChange(selected.filter((i) => i.productId !== productId))
        } else {
            onChange(selected.map((i) => i.productId === productId ? { ...i, quantity: i.quantity - 1 } : i))
        }
    }

    return (
        <div className="flex flex-col gap-3">
            {/* Search */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-brand-accent/40 dark:text-brand-cream/30 pointer-events-none" />
                <Input
                    placeholder="Search products..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9 h-10 rounded-xl"
                />
            </div>

            {/* Category tabs */}
            <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
                {categories.map((cat) => (
                    <Button
                        key={cat}
                        type="button"
                        variant="ghost"
                        onClick={() => setActiveCategory(cat)}
                        className={cn(
                            "shrink-0 h-auto px-3 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-wider",
                            activeCategory === cat
                                ? "bg-brand-deep text-brand-gold dark:bg-brand-gold dark:text-brand-deep hover:bg-brand-deep/90 dark:hover:bg-brand-gold/90"
                                : "bg-brand-accent/5 dark:bg-white/5 text-brand-accent/60 dark:text-brand-cream/50 hover:bg-brand-accent/10 dark:hover:bg-white/10"
                        )}
                    >
                        {cat}
                    </Button>
                ))}
            </div>

            {/* Product grid */}
            {isLoadingProducts ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                        <div key={i} className="h-40 rounded-2xl bg-brand-accent/5 dark:bg-white/5 animate-pulse" />
                    ))}
                </div>
            ) : filtered.length === 0 ? (
                <div className="py-8 flex flex-col items-center text-center">
                    <Package className="h-8 w-8 text-brand-accent/20 dark:text-brand-cream/20 mb-2" />
                    <p className="text-sm text-brand-accent/40 dark:text-brand-cream/40">No products found</p>
                </div>
            ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5 max-h-[340px] overflow-y-auto pr-0.5 pb-4">
                    {filtered.map((product) => {
                        const qty = selectedMap.get(product.id)?.quantity ?? 0
                        const outOfStock = product.status === "Out of Stock"
                        return (
                            <button
                                key={product.id}
                                type="button"
                                disabled={outOfStock}
                                onClick={() => !outOfStock && increment(product.id, product.product, product.price)}
                                className={cn(
                                    "relative w-full cursor-pointer text-left group flex flex-col h-[172px] rounded-2xl border overflow-hidden transition-all duration-200 active:scale-[0.98] outline-none",
                                    product.image
                                        ? "bg-brand-deep/5 dark:bg-white/5 border-transparent"
                                        : "bg-white dark:bg-white/5 border-brand-accent/10 dark:border-white/10 hover:border-brand-accent/20 dark:hover:border-white/20",
                                    qty > 0 && "border-amber-400/90 dark:border-brand-gold ring-2 ring-amber-300/70 dark:ring-brand-gold/60 shadow-[0_0_0_1px_rgba(251,191,36,0.35)] bg-amber-50/70 dark:bg-brand-gold/10",
                                    outOfStock && "opacity-45 cursor-not-allowed"
                                )}
                            >
                                {qty > 0 && (
                                    <span className="absolute top-1.5 right-1.5 z-20 h-6 min-w-6 px-1.5 rounded-full bg-amber-400 dark:bg-brand-gold text-brand-deep text-[10px] font-black flex items-center justify-center shadow-md ring-2 ring-white/90 dark:ring-brand-deep/70">
                                        {qty}
                                    </span>
                                )}

                                {product.image ? (
                                    <div className="absolute inset-x-0 top-0 h-20 bg-brand-deep/5 overflow-hidden z-0 border-b border-brand-accent/5 dark:border-white/5">
                                        <img
                                            src={product.image}
                                            alt={product.product}
                                            loading="lazy"
                                            className="h-full w-full object-cover opacity-90 transition-transform duration-500 group-hover:scale-105"
                                        />
                                    </div>
                                ) : null}

                                <div className={cn("relative z-10 flex flex-col h-full min-h-0 p-2.5", product.image ? "mt-20 bg-white dark:bg-brand-deep-900" : "")}>
                                    <div className="flex justify-between items-start gap-2 mb-auto">
                                        <p
                                            className="font-semibold text-[12px] leading-snug line-clamp-2 text-brand-deep dark:text-brand-cream"
                                            title={product.product}
                                        >
                                            {product.product}
                                        </p>
                                        <span
                                            className={cn(
                                                "shrink-0 w-1.5 h-1.5 rounded-full mt-1.5",
                                                outOfStock ? "bg-rose-500" : "bg-emerald-500"
                                            )}
                                        />
                                    </div>

                                    <div className="shrink-0 flex items-end justify-between mt-2 pt-2 border-t border-brand-accent/5 dark:border-white/5">
                                        <div className="flex flex-col">
                                            <span className="whitespace-nowrap text-[9px] font-bold text-brand-accent/50 dark:text-brand-cream/40 uppercase tracking-widest">
                                                {product.stock} left
                                            </span>
                                            <span className="whitespace-nowrap font-semibold text-brand-deep dark:text-brand-cream text-[13px] leading-none">
                                                {formatCurrency(product.price, { currency })}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </button>
                        )
                    })}
                </div>
            )}

            {/* Selected items */}
            {selected.length > 0 && (
                <div className="rounded-2xl border border-brand-accent/10 dark:border-white/10 bg-brand-accent/3 dark:bg-white/3 overflow-hidden">
                    <div className="px-3 py-2 border-b border-brand-accent/8 dark:border-white/8">
                        <span className="text-[10px] font-black uppercase tracking-widest text-brand-accent/50 dark:text-brand-cream/40">
                            Order · {selected.reduce((s, i) => s + i.quantity, 0)} item{selected.reduce((s, i) => s + i.quantity, 0) !== 1 ? "s" : ""}
                        </span>
                    </div>
                    <div className="divide-y divide-brand-accent/5 dark:divide-white/5">
                        {selected.map((item) => (
                            <div key={item.productId} className="flex items-center gap-2 px-3 py-2">
                                <p className="flex-1 text-sm font-medium text-brand-deep dark:text-brand-cream truncate">
                                    {item.productName}
                                </p>
                                <div className="flex items-center gap-1.5 shrink-0">
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => decrement(item.productId)}
                                        className="h-6 w-6 rounded-lg border border-brand-accent/10 dark:border-white/10 text-brand-accent/50 dark:text-brand-cream/50"
                                    >
                                        <Minus className="h-2.5 w-2.5" />
                                    </Button>
                                    <span className="text-sm font-bold text-brand-deep dark:text-brand-cream w-4 text-center">
                                        {item.quantity}
                                    </span>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => increment(item.productId, item.productName, item.price)}
                                        className="h-6 w-6 rounded-lg border border-brand-accent/10 dark:border-white/10 text-brand-accent/50 dark:text-brand-cream/50"
                                    >
                                        <Plus className="h-2.5 w-2.5" />
                                    </Button>
                                    <span className="text-[11px] font-bold text-brand-accent/60 dark:text-brand-cream/50 w-16 text-right">
                                        {formatCurrency(item.price * item.quantity, { currency })}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div
                        ref={breakdownRef}
                        id={breakdownAnchorId}
                        className="flex items-center justify-between px-3 py-2.5 bg-brand-accent/5 dark:bg-white/5 border-t border-brand-accent/8 dark:border-white/8"
                    >
                        <span className="text-xs font-bold uppercase tracking-wider text-brand-accent/60 dark:text-brand-cream/50">Total</span>
                        <span className="text-base font-black text-brand-deep dark:text-brand-cream">
                            {formatCurrency(total, { currency })}
                        </span>
                    </div>
                </div>
            )}
        </div>
    )
}
