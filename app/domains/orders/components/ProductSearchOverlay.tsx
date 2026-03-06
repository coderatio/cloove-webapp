"use client"

import * as React from "react"
import { Search, Barcode, Plus, Package, X } from "lucide-react"
import { Product } from "../hooks/useInventory"
import { formatCurrency } from "@/app/lib/formatters"
import { useBusiness } from "@/app/components/BusinessProvider"
import { cn } from "@/app/lib/utils"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/app/components/ui/dialog"
import { VisuallyHidden } from "@/app/components/ui/visually-hidden"
import { toast } from "sonner"

interface ProductSearchOverlayProps {
    isOpen: boolean
    onClose: () => void
    products: Product[]
    onSelect: (product: Product) => void
}

export function ProductSearchOverlay({
    isOpen,
    onClose,
    products,
    onSelect,
}: ProductSearchOverlayProps) {
    const { activeBusiness } = useBusiness()
    const [search, setSearch] = React.useState("")
    const [activeIndex, setActiveIndex] = React.useState(0)
    const listRef = React.useRef<HTMLDivElement>(null)
    const inputRef = React.useRef<HTMLInputElement>(null)

    // Filter products
    const filteredProducts = React.useMemo(() => {
        const s = search.toLowerCase()
        if (!s) return products
        return products.filter(
            (p) =>
                p.product.toLowerCase().includes(s) ||
                (p.barcode && p.barcode.toLowerCase().includes(s)) ||
                p.category.toLowerCase().includes(s)
        )
    }, [search, products])

    // Reset active index when search changes
    React.useEffect(() => {
        setActiveIndex(0)
    }, [search])

    // Keyboard navigation
    React.useEffect(() => {
        if (!isOpen) return

        const handleKeyDown = (e: KeyboardEvent) => {
            if (filteredProducts.length === 0) return

            if (e.key === "ArrowDown") {
                e.preventDefault()
                setActiveIndex((prev) => (prev + 1) % filteredProducts.length)
            } else if (e.key === "ArrowUp") {
                e.preventDefault()
                setActiveIndex((prev) => (prev - 1 + filteredProducts.length) % filteredProducts.length)
            } else if (e.key === "Enter") {
                e.preventDefault()
                const selectedProduct = filteredProducts[activeIndex]
                if (selectedProduct) {
                    onSelect(selectedProduct)
                    if (selectedProduct.status !== 'Out of Stock') {
                        toast.success(`Added ${selectedProduct.product} to cart`)
                    }
                    // Removed onClose() to allow multiple additions
                }
            } else if (e.key === "Escape") {
                e.preventDefault()
                onClose()
            }
        }

        window.addEventListener("keydown", handleKeyDown)
        return () => window.removeEventListener("keydown", handleKeyDown)
    }, [isOpen, filteredProducts, activeIndex, onSelect, onClose])

    // Scroll active item into view
    React.useEffect(() => {
        const listElement = listRef.current
        if (!listElement) return

        const activeItem = listElement.querySelector(`[data-item-index="${activeIndex}"]`) as HTMLElement
        if (activeItem) {
            // Calculate sticky header offset (padding top + header height + some buffer)
            const stickyOffset = 80 // Approximate height of the sticky header area
            const itemTop = activeItem.offsetTop
            const itemBottom = itemTop + activeItem.offsetHeight
            const containerScrollTop = listElement.scrollTop
            const containerHeight = listElement.clientHeight

            // Check if item is above the visible area (hidden under sticky header)
            if (itemTop < containerScrollTop + stickyOffset) {
                listElement.scrollTo({
                    top: itemTop - stickyOffset - 16, // 16px extra padding
                    behavior: 'smooth'
                })
            }
            // Check if item is below the visible area
            else if (itemBottom > containerScrollTop + containerHeight) {
                listElement.scrollTo({
                    top: itemBottom - containerHeight + 16, // 16px extra padding
                    behavior: 'smooth'
                })
            }
        }
    }, [activeIndex])

    // Auto-focus input
    React.useEffect(() => {
        if (isOpen) {
            setTimeout(() => inputRef.current?.focus(), 100)
        } else {
            setSearch("")
        }
    }, [isOpen])

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent
                onEscapeKeyDown={(e) => {
                    e.preventDefault()
                    onClose()
                }}
                className="max-w-3xl p-0 overflow-hidden border-brand-accent/10 dark:border-white/10 bg-white dark:bg-brand-deep backdrop-blur-3xl sm:rounded-3xl shadow-2xl flex flex-col h-[85vh] selection:bg-brand-gold/20"
            >
                {/* Header / Search Area */}
                <div className="flex items-center gap-4 border-b border-brand-accent/5 dark:border-white/5 px-6 h-24 shrink-0 bg-white dark:bg-brand-deep relative z-30">
                    <div className="relative flex-1 flex items-center">
                        <Search className="absolute left-0 h-6 w-6 text-brand-accent/40 dark:text-brand-cream/40" />
                        <input
                            ref={inputRef}
                            type="text"
                            placeholder="Find products by name, category or scan..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-10 pr-4 h-16 text-lg sm:text-2xl font-serif text-brand-deep dark:text-brand-cream placeholder:text-brand-accent/30 dark:placeholder:text-brand-cream/20 bg-transparent border-none focus:outline-none focus:ring-0"
                        />
                    </div>
                    {/* Hidden on mobile to avoid close button conflict */}
                    <div className="hidden sm:flex items-center gap-3 px-4 py-2 rounded-2xl bg-brand-gold/10 text-brand-gold dark:text-brand-gold text-[10px] font-black uppercase tracking-[0.2em] border border-brand-gold/30 shadow-sm whitespace-nowrap shrink-0 mr-16">
                        <Barcode className="h-4 w-4" />
                        Scan Active
                    </div>
                </div>

                {/* Results List */}
                <div className="flex-1 overflow-y-auto custom-scrollbar relative z-10" ref={listRef}>
                    <div className="text-[10px] font-black uppercase tracking-[0.3em] text-brand-accent/40 dark:text-brand-cream/40 px-10 sticky top-0 bg-white dark:bg-brand-deep py-6 z-20 border-b border-brand-accent/5 dark:border-white/5">
                        Catalog Results • {filteredProducts.length} Found
                    </div>

                    <div className="p-6 px-10 space-y-2">
                        {filteredProducts.length > 0 ? (
                            filteredProducts.map((product, index) => (
                                <div
                                    key={product.id}
                                    data-item-index={index}
                                    onClick={() => {
                                        onSelect(product)
                                        if (product.status !== 'Out of Stock') {
                                            toast.success(`Added ${product.product} to cart`)
                                        }
                                        // Removed onClose() to allow multiple additions
                                    }}
                                    onMouseEnter={() => setActiveIndex(index)}
                                    className={cn(
                                        "relative flex items-center justify-between p-5 rounded-[24px] cursor-pointer transition-all duration-200 border group",
                                        activeIndex === index
                                            ? "bg-brand-gold/10 dark:bg-white/10 border-brand-gold/30 shadow-sm"
                                            : "bg-transparent border-transparent hover:bg-brand-accent/2 dark:hover:bg-white/2"
                                    )}
                                >
                                    <div className="flex items-center gap-6 relative z-10">
                                        <div className="h-14 w-14 rounded-2xl bg-brand-accent/5 dark:bg-white/5 flex items-center justify-center overflow-hidden border border-brand-accent/5 dark:border-white/5 transition-transform group-hover:scale-105">
                                            {product.image ? (
                                                <img src={product.image} alt={product.product} className="h-full w-full object-cover" />
                                            ) : (
                                                <Package className="h-7 w-7 text-brand-accent/10 dark:text-brand-cream/10" />
                                            )}
                                        </div>
                                        <div className="flex flex-col">
                                            <h4 className={cn(
                                                "font-sans text-xl lg:text-2xl leading-tight transition-colors tracking-tight font-medium",
                                                activeIndex === index ? "text-brand-gold" : "text-brand-deep dark:text-brand-cream"
                                            )}>
                                                {product.product}
                                            </h4>
                                            <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-brand-accent/60 dark:text-brand-cream/50 mt-0.5">
                                                {product.category} • {product.stock} in stock
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-8 relative z-10">
                                        <div className="text-right">
                                            <p className={cn(
                                                "font-serif font-black text-xl lg:text-2xl tracking-tighter transition-colors",
                                                activeIndex === index ? "text-brand-gold" : "text-brand-deep dark:text-brand-cream"
                                            )}>
                                                {formatCurrency(product.price, { currency: activeBusiness?.currency || 'NGN' })}
                                            </p>
                                            <div className={cn(
                                                "text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg inline-block mt-1 border",
                                                product.status === 'In Stock'
                                                    ? "bg-emerald-500/5 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                                                    : "bg-rose-500/5 text-rose-600 dark:text-rose-400 border-rose-500/20"
                                            )}>
                                                {product.status}
                                            </div>
                                        </div>
                                        <div className={cn(
                                            "h-12 w-12 rounded-2xl flex items-center justify-center transition-opacity duration-200 border shadow-lg",
                                            activeIndex === index
                                                ? "bg-brand-gold text-brand-deep opacity-100 border-brand-gold/50"
                                                : "bg-brand-deep dark:bg-brand-accent text-brand-gold opacity-0 border-transparent"
                                        )}>
                                            <Plus className="h-6 w-6" />
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="py-24 flex flex-col items-center justify-center text-brand-accent/30 dark:text-brand-cream/30">
                                <Package className="h-16 w-16 mb-6 opacity-10" />
                                <p className="text-xl font-serif tracking-tight">No match found</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer Controls */}
                <div className="p-4 sm:p-5 bg-brand-accent/5 dark:bg-white/5 flex flex-col sm:flex-row items-center justify-between shrink-0 border-t border-brand-accent/5 dark:border-white/5 relative z-30 gap-4 sm:gap-0">
                    <div className="flex items-center gap-4 sm:gap-8 overflow-x-auto w-full sm:w-auto pb-2 sm:pb-0 touch-pan-x hide-scrollbar">
                        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                            <kbd className="flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-white dark:bg-brand-deep text-[10px] font-black border border-brand-accent/20 dark:border-white/20 shadow-sm text-brand-deep dark:text-brand-cream">↑↓</kbd>
                            <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-brand-accent/60 dark:text-brand-cream/50">Navigate</span>
                        </div>
                        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                            <kbd className="flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-white dark:bg-brand-deep text-[10px] font-black border border-brand-accent/20 dark:border-white/20 shadow-sm text-brand-deep dark:text-brand-cream">↵</kbd>
                            <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-brand-accent/60 dark:text-brand-cream/50">Select</span>
                        </div>
                        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                            <kbd className="flex items-center justify-center px-1.5 sm:px-2 h-7 sm:h-8 rounded-xl bg-white dark:bg-brand-deep text-[10px] font-black border border-brand-accent/20 dark:border-white/20 shadow-sm text-brand-deep dark:text-brand-cream">ESC</kbd>
                            <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-brand-accent/60 dark:text-brand-cream/50">Close</span>
                        </div>
                    </div>
                    <div className="hidden sm:flex items-center gap-2 shrink-0">
                        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-brand-gold">
                            CLOOVE POS SYSTEM
                        </p>
                    </div>
                </div>

                <VisuallyHidden>
                    <DialogHeader>
                        <DialogTitle>Search Products</DialogTitle>
                    </DialogHeader>
                </VisuallyHidden>
            </DialogContent>
        </Dialog>
    )
}
