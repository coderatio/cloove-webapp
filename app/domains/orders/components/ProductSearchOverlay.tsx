"use client"

import * as React from "react"
import { Search, Barcode, Plus, Package, X } from "lucide-react"
import { Product } from "../hooks/useInventory"
import { formatCurrency } from "@/app/lib/formatters"
import { CurrencyText } from "@/app/components/shared/CurrencyText"
import { useBusiness } from "@/app/components/BusinessProvider"
import { cn } from "@/app/lib/utils"
import { toast } from "sonner"
import { Button } from "@/app/components/ui/button"
import { motion, AnimatePresence } from "framer-motion"

interface ProductSearchOverlayProps {
    isOpen: boolean
    onClose: () => void
    products: Product[]
    onSelect: (product: Product) => void
    isLoading?: boolean
    isLocalMode?: boolean
    onSearchChange?: (search: string) => void
}

export function ProductSearchOverlay({
    isOpen,
    onClose,
    products,
    onSelect,
    isLoading = false,
    isLocalMode = true,
    onSearchChange,
}: ProductSearchOverlayProps) {
    const { activeBusiness } = useBusiness()
    const [search, setSearch] = React.useState("")
    const [activeIndex, setActiveIndex] = React.useState(0)
    const [isKeyboardNavigating, setIsKeyboardNavigating] = React.useState(false)
    const listRef = React.useRef<HTMLDivElement>(null)
    const inputRef = React.useRef<HTMLInputElement>(null)
    const lastMouseMoveRef = React.useRef(0)

    // Report search changes to parent if not in local mode
    React.useEffect(() => {
        if (!isLocalMode && onSearchChange) {
            onSearchChange(search)
        }
    }, [search, isLocalMode, onSearchChange])

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
        setIsKeyboardNavigating(false)
    }, [search])

    // Detect mouse movement to re-enable mouse-based active index
    React.useEffect(() => {
        const handleMouseMove = () => {
            const now = Date.now()
            if (now - lastMouseMoveRef.current > 100) {
                setIsKeyboardNavigating(false)
                lastMouseMoveRef.current = now
            }
        }
        window.addEventListener("mousemove", handleMouseMove)
        return () => window.removeEventListener("mousemove", handleMouseMove)
    }, [])

    // Barcode auto-add: exact match on barcode clears search and re-focuses
    React.useEffect(() => {
        if (search.length >= 8) {
            const exactMatch = products.find(
                (p) => p.barcode === search
            )
            if (exactMatch) {
                onSelect(exactMatch)
                setSearch("")
                if (exactMatch.status !== 'Out of Stock') {
                    toast.success(`Added ${exactMatch.product} via scan`, { duration: 1500 })
                }
                requestAnimationFrame(() => inputRef.current?.focus())
            }
        }
    }, [search, products, onSelect])

    // Keyboard navigation
    React.useEffect(() => {
        if (!isOpen) return

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                e.preventDefault()
                onClose()
                return
            }

            if (filteredProducts.length === 0) return

            if (e.key === "ArrowDown") {
                e.preventDefault()
                setIsKeyboardNavigating(true)
                setActiveIndex((prev) => (prev + 1) % filteredProducts.length)
            } else if (e.key === "ArrowUp") {
                e.preventDefault()
                setIsKeyboardNavigating(true)
                setActiveIndex((prev) => (prev - 1 + filteredProducts.length) % filteredProducts.length)
            } else if (e.key === "Enter") {
                e.preventDefault()
                const selectedProduct = filteredProducts[activeIndex]
                if (selectedProduct) {
                    onSelect(selectedProduct)
                    if (selectedProduct.status !== 'Out of Stock') {
                        toast.success(`Added ${selectedProduct.product} to cart`)
                    }
                }
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
            const stickyOffset = 88 // Header height + some padding
            const itemTop = activeItem.offsetTop
            const itemBottom = itemTop + activeItem.offsetHeight
            const containerScrollTop = listElement.scrollTop
            const containerHeight = listElement.clientHeight

            if (itemTop < containerScrollTop + stickyOffset) {
                listElement.scrollTo({
                    top: itemTop - stickyOffset - 16,
                    behavior: isKeyboardNavigating ? 'auto' : 'smooth'
                })
            }
            else if (itemBottom > containerScrollTop + containerHeight) {
                listElement.scrollTo({
                    top: itemBottom - containerHeight + 16,
                    behavior: isKeyboardNavigating ? 'auto' : 'smooth'
                })
            }
        }
    }, [activeIndex, isKeyboardNavigating])

    // Auto-focus input
    React.useEffect(() => {
        if (isOpen) {
            requestAnimationFrame(() => inputRef.current?.focus())
        } else {
            setSearch("")
        }
    }, [isOpen])

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="absolute inset-0 w-full h-full z-40 flex overflow-hidden">
                    <PerformanceStyles />
                    {/* Local Backdrop - only covers parent */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-brand-cream/85 dark:bg-brand-deep/90 z-0"
                    />

                    {/* Sidebar Content */}
                    <motion.div
                        initial={{ x: "-100%" }}
                        animate={{ x: 0 }}
                        exit={{ x: "-100%" }}
                        transition={{ type: "spring", damping: 25, stiffness: 200 }}
                        className="relative z-10 w-[720px] max-w-[90%] bg-white dark:bg-brand-deep-900 border-r border-brand-accent/10 dark:border-white/10 shadow-2xl flex flex-col h-full overflow-hidden"
                    >
                        {/* Header / Search Area */}
                        <div className="flex items-center gap-4 border-b border-brand-accent/5 dark:border-white/5 px-6 h-24 shrink-0 bg-white dark:bg-brand-deep-950 relative z-30">
                            <div className="relative flex-1 flex items-center">
                                <Search className="absolute left-0 h-6 w-6 text-brand-accent/40 dark:text-brand-cream/40" />
                                <input
                                    ref={inputRef}
                                    type="text"
                                    placeholder="Find products by name, category or scan..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    role="combobox"
                                    aria-autocomplete="list"
                                    aria-expanded={isOpen}
                                    aria-haspopup="listbox"
                                    aria-controls="product-search-results"
                                    aria-activedescendant={`product-option-${activeIndex}`}
                                    className="w-full pl-10 pr-4 h-16 text-lg sm:text-2xl font-serif text-brand-deep dark:text-brand-cream placeholder:text-brand-accent/30 dark:placeholder:text-brand-cream/20 bg-transparent border-none focus:outline-none focus:ring-0"
                                />
                            </div>
                            <div className="flex items-center gap-3 px-4 py-2 rounded-2xl bg-brand-gold/10 text-brand-gold dark:text-brand-gold text-[10px] font-black uppercase tracking-[0.2em] border border-brand-gold/30 shadow-sm whitespace-nowrap shrink-0">
                                <Barcode className="h-4 w-4" />
                                <span className="hidden sm:inline">Scan Active</span>
                            </div>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={onClose}
                                className="h-10 w-10 rounded-xl hover:bg-rose-500/10 text-brand-accent/40 dark:text-brand-cream/40 hover:text-rose-500 transition-all shrink-0 ml-2"
                            >
                                <X className="h-5 w-5" />
                            </Button>
                        </div>

                        {/* Results List */}
                        <div
                            className="flex-1 overflow-y-auto custom-scrollbar relative z-10 [scrollbar-gutter:stable] overscroll-contain isolation-auto"
                            ref={listRef}
                        >
                            <div className="text-[10px] font-black uppercase tracking-[0.3em] text-brand-accent/40 dark:text-brand-cream/40 px-10 sticky top-0 bg-white dark:bg-brand-deep-900 py-6 z-20 border-b border-brand-accent/5 dark:border-white/5 flex items-center justify-between">
                                <span>
                                    {isLocalMode ? 'Local Catalog' : 'Cloud Search'} • {(isLocalMode ? filteredProducts : products).length} Results
                                </span>
                                {isLoading && (
                                    <div className="flex items-center gap-2 text-brand-gold animate-pulse">
                                        <div className="w-1.5 h-1.5 rounded-full bg-brand-gold animate-bounce" />
                                        <span className="text-[9px]">Searching backend...</span>
                                    </div>
                                )}
                            </div>

                            <div
                                id="product-search-results"
                                role="listbox"
                                className="p-6 px-10 space-y-2 will-change-scroll"
                            >
                                {(isLocalMode ? filteredProducts : products).length > 0 ? (
                                    (isLocalMode ? filteredProducts : products).map((product, index) => (
                                        <div
                                            key={product.id}
                                            id={`product-option-${index}`}
                                            role="option"
                                            aria-selected={activeIndex === index}
                                            data-item-index={index}
                                            onClick={() => {
                                                onSelect(product)
                                                if (product.status !== 'Out of Stock') {
                                                    toast.success(`Added ${product.product} to cart`)
                                                }
                                            }}
                                            onMouseEnter={() => {
                                                if (!isKeyboardNavigating) {
                                                    setActiveIndex(index)
                                                }
                                            }}
                                            className={cn(
                                                "relative flex items-center justify-between p-4 rounded-3xl cursor-pointer transition-all duration-200 border group",
                                                activeIndex === index
                                                    ? "bg-brand-deep/5 dark:bg-white/5 border-brand-accent/20 dark:border-white/20 shadow-xs"
                                                    : "bg-transparent border-transparent hover:bg-brand-accent/5 dark:hover:bg-white/5"
                                            )}
                                        >
                                            <div className="flex items-center gap-4 relative z-10 min-w-0 pr-4">
                                                <div className="h-12 w-12 rounded-xl bg-brand-accent/5 dark:bg-white/5 flex items-center justify-center overflow-hidden border border-brand-accent/5 dark:border-white/5 shrink-0 transition-transform group-hover:scale-105">
                                                    {product.image ? (
                                                        <img src={product.image} alt={product.product} className="h-full w-full object-cover" />
                                                    ) : (
                                                        <Package className="h-6 w-6 text-brand-accent/20 dark:text-brand-cream/20" />
                                                    )}
                                                </div>
                                                <div className="flex flex-col min-w-0">
                                                    <h4 className={cn(
                                                        "font-medium tracking-tight text-[15px] leading-tight truncate",
                                                        activeIndex === index ? "text-brand-deep dark:text-brand-cream font-semibold" : "text-brand-deep/80 dark:text-brand-cream/80"
                                                    )}>
                                                        {product.product}
                                                    </h4>
                                                    <p className="text-[10px] font-bold uppercase tracking-widest text-brand-accent/50 dark:text-brand-cream/40 mt-1 truncate">
                                                        {product.category} • {product.stock} left
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-4 relative z-10 shrink-0">
                                                <div className="flex flex-col items-end">
                                                    <p className={cn(
                                                        "font-semibold tracking-tight text-lg",
                                                        activeIndex === index ? "text-brand-deep dark:text-brand-cream" : "text-brand-deep/80 dark:text-brand-cream/80"
                                                    )}>
                                                        <CurrencyText value={formatCurrency(product.price, { currency: activeBusiness?.currency || 'NGN' }).replace('NGN', '₦')} />
                                                    </p>
                                                    <div className={cn(
                                                        "text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded flex items-center gap-1 mt-0.5",
                                                        product.status === 'In Stock'
                                                            ? "text-emerald-500"
                                                            : "text-rose-500"
                                                    )}>
                                                        <div className={cn(
                                                            "w-1.5 h-1.5 rounded-full",
                                                            product.status === 'In Stock' ? "bg-emerald-500" : "bg-rose-500"
                                                        )} />
                                                        {product.status}
                                                    </div>
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
                                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-brand-deep dark:text-brand-cream">
                                    CLOOVE POS
                                </p>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    )
}

// Global styles for performance
const PerformanceStyles = () => (
    <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
            width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
            background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
            background: rgba(212, 175, 55, 0.2);
            border-radius: 20px;
            border: 2px solid transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
            background: rgba(212, 175, 55, 0.4);
        }
        .will-change-scroll {
            will-change: scroll-position;
        }
        .will-change-transform {
            will-change: transform;
        }
    `}</style>
)
