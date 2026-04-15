"use client"

import * as React from 'react'
import { motion, AnimatePresence, Variants } from 'framer-motion'
import {
    Search,
    ShoppingCart,
    Plus,
    Minus,
    Trash2,
    CreditCard,
    Banknote,
    ArrowRight,
    ReceiptText,
    CheckCircle2,
    ArrowLeft,
    Barcode,
    ChevronLeft,
    ChevronRight,
    ChevronDown,
    SlidersHorizontal,
    User,
    UserPlus,
    X,
    ArrowBigUpDash,
    UsersRoundIcon,
    UserSearchIcon,
    Layers,
    History,
    Tag
} from 'lucide-react'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/app/components/ui/select'
import { GlassCard } from '@/app/components/ui/glass-card'
import { Button } from '@/app/components/ui/button'
import { Input } from '@/app/components/ui/input'
import { Textarea } from '@/app/components/ui/textarea'
import { MoneyInput } from '@/app/components/ui/money-input'
import { Switch } from '@/app/components/ui/switch'
import { cn } from '@/app/lib/utils'
import { Customer } from '../data/customerMocks'
import { toast } from 'sonner'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useReceiptPrinter } from '@/app/hooks/useReceiptPrinter'
import { useBusiness } from '@/app/components/BusinessProvider'
import { format } from 'date-fns'
import { useQueuedSales, CartItem } from '../hooks/useQueuedSales'
import { QueuedSalesDrawer } from './QueuedSalesDrawer'
import {
    Drawer,
    DrawerBody,
    DrawerClose,
    DrawerContent,
    DrawerDescription,
    DrawerFooter,
    DrawerStickyHeader,
    DrawerTitle,
} from '@/app/components/ui/drawer'
import { useRecordSale } from '../hooks/useRecordSale'
import { useInventory } from '../hooks/useInventory'
import { useCustomers } from '../hooks/useCustomers'
import { usePromotions } from '../hooks/usePromotions'
import { useLayoutPresetId } from "@/app/domains/workspace/hooks/usePresetPageCopy"
import { getPresetCapabilities } from "@/app/domains/workspace/nav/preset-capabilities"
import { useAcademicCalendar } from "@/app/domains/school/hooks/useAcademicCalendar"
import { formatCurrency } from '@/app/lib/formatters'
import { CurrencyText } from '@/app/components/shared/CurrencyText'
import { ProductSearchOverlay } from './ProductSearchOverlay'
import { Product } from '../hooks/useInventory'
import { useRestaurantTables } from '@/app/domains/restaurant/hooks/useRestaurantOps'
import { CapacityStepper } from '@/app/domains/restaurant/components/CapacityStepper'
import { storage, STORAGE_KEYS } from '@/app/lib/storage'

// Stagger variants for the container
const containerVariants: Variants = {
    hidden: { opacity: 1 },
    show: {
        opacity: 1,
        transition: {
            staggerChildren: 0.04
        }
    }
}

const itemVariants: Variants = {
    hidden: { opacity: 0, y: 12 },
    show: {
        opacity: 1,
        y: 0,
        transition: {
            type: "tween",
            duration: 0.2,
            ease: "easeOut"
        }
    }
}

// Simple debounce hook for search
function useDebounce<T>(value: T, delay?: number): T {
    const [debouncedValue, setDebouncedValue] = React.useState<T>(value)

    React.useEffect(() => {
        const timer = setTimeout(() => setDebouncedValue(value), delay || 300)
        return () => clearTimeout(timer)
    }, [value, delay])

    return debouncedValue
}

function Box(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
            <path d="m3.3 7 8.7 5 8.7-5" />
            <path d="M12 22V12" />
        </svg>
    )
}

function CreativeLoader() {
    return (
        <div className="col-span-full py-32 flex flex-col items-center justify-center">
            <div className="relative h-24 w-24 mb-10">
                <motion.div
                    animate={{
                        scale: [1, 1.2, 1],
                        opacity: [0.3, 0.6, 0.3]
                    }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute inset-0 rounded-full bg-brand-gold/20 blur-xl"
                />
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="h-12 w-12 rounded-2xl bg-brand-deep dark:bg-brand-gold flex items-center justify-center shadow-2xl relative z-10">
                        <Layers className="h-6 w-6 text-brand-gold dark:text-brand-deep animate-pulse" />
                    </div>
                </div>

                {[Tag, ShoppingCart, Box, History].map((Icon, i) => (
                    <motion.div
                        key={i}
                        animate={{
                            rotate: 360,
                        }}
                        transition={{
                            duration: 8,
                            repeat: Infinity,
                            ease: "linear",
                            delay: i * 0.5
                        }}
                        className="absolute inset-x-0 h-full w-full pointer-events-none"
                    >
                        <motion.div
                            animate={{
                                scale: [0.8, 1.1, 0.8],
                                opacity: [0.4, 0.8, 0.4]
                            }}
                            transition={{ duration: 3, repeat: Infinity, delay: i * 0.7 }}
                            style={{
                                position: 'absolute',
                                left: '50%',
                                top: '-10%',
                                transform: 'translateX(-50%)'
                            }}
                            className="bg-white/40 dark:bg-white/5 p-2 rounded-xl backdrop-blur-md border border-brand-accent/10"
                        >
                            <Icon className="h-4 w-4 text-brand-deep dark:text-brand-cream" />
                        </motion.div>
                    </motion.div>
                ))}
            </div>
            <div className="space-y-2 text-center">
                <h3 className="text-2xl font-serif text-brand-deep dark:text-brand-cream/80 tracking-tight">Curating your catalog</h3>
                <p className="text-xs uppercase tracking-[0.3em] font-black text-brand-accent/40 dark:text-brand-cream/30">Just a moment...</p>
            </div>
        </div>
    )
}

interface ProductGridProps {
    products: Product[]
    isLoading: boolean
    activeBusiness: any | null
    addToCart: (product: Product) => void
    currentPage: number
    itemsPerPage: number
    search: string
    selectedCategory: string | null
    isLocalMode: boolean
}

const ProductGrid = React.memo(({
    products,
    isLoading,
    activeBusiness,
    addToCart,
    currentPage,
    itemsPerPage,
    search,
    selectedCategory,
    isLocalMode
}: ProductGridProps) => {
    const filteredProducts = React.useMemo(() => {
        return products.filter((p: Product) => {
            const matchesSearch = p.product?.toLowerCase().includes(search.toLowerCase()) ||
                (p.barcode && p.barcode.includes(search))
            const matchesCategory = !selectedCategory || p.category === selectedCategory
            return isLocalMode ? (matchesSearch && matchesCategory) : matchesCategory
        })
    }, [products, search, selectedCategory, isLocalMode])

    const paginatedProducts = React.useMemo(() => {
        return filteredProducts.slice(
            (currentPage - 1) * itemsPerPage,
            currentPage * itemsPerPage
        )
    }, [filteredProducts, currentPage, itemsPerPage])

    return (
        <motion.div
            key={String(`${selectedCategory}-${search}-${currentPage}-${products.length}`)}
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="flex-1 overflow-y-auto custom-scrollbar pr-1 lg:pr-2 -mr-1 lg:-mr-2 min-h-0 [scrollbar-gutter:stable] overscroll-contain isolation-auto"
        >
            <div className={cn(
                "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-3 lg:gap-4 pb-16 will-change-scroll"
            )}>
                <AnimatePresence mode="popLayout">
                    {isLoading || !activeBusiness ? (
                        <motion.div
                            key="loader"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="col-span-full h-full flex items-center justify-center p-12"
                        >
                            <CreativeLoader />
                        </motion.div>
                    ) : filteredProducts.length === 0 ? (
                        <motion.div
                            key="empty"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="col-span-full py-24 flex flex-col items-center justify-center text-brand-accent/40 dark:text-brand-cream/30"
                        >
                            <Layers className="h-20 w-20 mb-6 opacity-20" />
                            <p className="text-2xl font-serif tracking-tight text-brand-deep dark:text-brand-cream">No items found</p>
                            <p className="text-sm mt-2">{search ? `No results for "${search}"` : 'Your catalog is empty'}</p>
                        </motion.div>
                    ) : (
                        paginatedProducts.map((product: Product) => (
                            <motion.div key={product.id} variants={itemVariants}>
                                <button
                                    onClick={() => addToCart(product)}
                                    className={cn(
                                        "w-full cursor-pointer text-left group flex flex-col relative overflow-hidden rounded-2xl transition-all duration-200 active:scale-[0.98] border shadow-xs hover:shadow-sm isolate outline-none focus-visible:ring-2 focus-visible:ring-brand-deep/20 dark:focus-visible:ring-white/20",
                                        product.image ? "h-[168px] lg:h-[178px]" : "h-[136px] lg:h-[146px]",
                                        product.image
                                            ? "bg-brand-deep/5 dark:bg-white/5 border-transparent"
                                            : "bg-white dark:bg-white/5 border-brand-accent/10 dark:border-white/10 hover:border-brand-accent/20 dark:hover:border-white/20"
                                    )}
                                >
                                    {product.image && (
                                        <div className="absolute inset-x-0 top-0 h-16 bg-brand-deep/5 overflow-hidden z-0 border-b border-brand-accent/5 dark:border-white/5">
                                            <img
                                                src={product.image}
                                                alt={product.product}
                                                loading="lazy"
                                                className="h-full w-full object-cover opacity-90 transition-transform duration-500 group-hover:scale-105"
                                            />
                                        </div>
                                    )}

                                    <div className={cn("relative z-10 flex flex-col h-full min-h-0 p-3.5", product.image ? "mt-16 bg-white dark:bg-brand-deep-900" : "")}>
                                        <div className="flex justify-between items-start gap-2 mb-auto">
                                            <h3 className={cn(
                                                "font-medium text-[15px] leading-snug line-clamp-2",
                                                "text-brand-deep dark:text-brand-cream"
                                            )} title={product.product}>
                                                {product.product}
                                            </h3>
                                            <div className={cn(
                                                "shrink-0 w-1.5 h-1.5 rounded-full mt-1.5",
                                                product.status === 'In Stock' ? "bg-emerald-500" : "bg-rose-500"
                                            )} />
                                        </div>

                                        <div className="shrink-0 flex items-end justify-between mt-2 pt-2 border-t border-brand-accent/5 dark:border-white/5">
                                            <div className="flex flex-col">
                                                <span className="whitespace-nowrap text-[10px] font-medium text-brand-accent/50 dark:text-brand-cream/40 uppercase tracking-widest mb-0.5">
                                                    {product.stock} left
                                                </span>
                                                <span className="whitespace-nowrap font-semibold text-brand-deep dark:text-brand-cream text-lg tracking-tight leading-none">
                                                    <CurrencyText value={formatCurrency(product.price, { currency: activeBusiness?.currency || 'NGN' })} />
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </button>
                            </motion.div>
                        ))
                    )}
                </AnimatePresence>
            </div>
        </motion.div>
    )
})

ProductGrid.displayName = 'ProductGrid'

export function SaleModeView({ embedded = false }: { embedded?: boolean }) {
    const router = useRouter()
    const [cart, setCart] = React.useState<CartItem[]>([])
    const [search, setSearch] = React.useState('')
    const [localSearch, setLocalSearch] = React.useState('')
    const debouncedSearch = useDebounce(localSearch, 300)

    // Sync debounced local search back to the main search state
    React.useEffect(() => {
        setSearch(debouncedSearch)
    }, [debouncedSearch])

    const [selectedCategory, setSelectedCategory] = React.useState<string | null>(null)
    const [paymentMethod, setPaymentMethod] = React.useState<'Cash' | 'Transfer' | 'POS'>('Cash')
    const [currentPage, setCurrentPage] = React.useState(1)
    const [mobileView, setMobileView] = React.useState<'catalog' | 'cart'>('catalog')
    const [customerSearch, setCustomerSearch] = React.useState('')
    const [selectedCustomer, setSelectedCustomer] = React.useState<Customer | null>(null)
    const [isCustomerSearchOpen, setIsCustomerSearchOpen] = React.useState(false)
    const customerDropdownRef = React.useRef<HTMLDivElement>(null)
    const [mounted, setMounted] = React.useState(false)
    React.useEffect(() => { setMounted(true) }, [])

    // Extras Panel State
    const itemsPerPage = 20
    const [discount, setDiscount] = React.useState(0)
    const [note, setNote] = React.useState('')
    const [amountPaid, setAmountPaid] = React.useState<number | "">("")
    const [selectedPromotion, setSelectedPromotion] = React.useState<string>('none')
    const [autoPrint, setAutoPrint] = React.useState(true)
    const [showExtras, setShowExtras] = React.useState(false)
    const [isSearchOpen, setIsSearchOpen] = React.useState(false)
    const [serviceMode, setServiceMode] = React.useState<'DINE_IN' | 'TAKEAWAY'>('DINE_IN')
    const [tableLabel, setTableLabel] = React.useState('')
    const [covers, setCovers] = React.useState(1)
    const [kitchenStation, setKitchenStation] = React.useState('kitchen')
    const [sendToKitchen, setSendToKitchen] = React.useState(true)
    const [serviceControlsDrawerOpen, setServiceControlsDrawerOpen] = React.useState(false)

    const serviceControlsSummary = React.useMemo(() => {
        if (serviceMode === "TAKEAWAY") {
            return `Takeaway · ${sendToKitchen ? "Kitchen on" : "Kitchen off"}`
        }
        const t = tableLabel.trim()
        const tablePart = t || "Manual entry"
        return `Dine-in · ${tablePart} · ${covers} ${covers === 1 ? "cover" : "covers"}`
    }, [serviceMode, tableLabel, covers, sendToKitchen])

    // Queue Sale State
    const { queuedSales, queueSale, removeQueuedSale } = useQueuedSales()
    const [isQueueDrawerOpen, setIsQueueDrawerOpen] = React.useState(false)

    const { currency, activeBusiness } = useBusiness()
    React.useEffect(() => {
        if (!embedded) return
        const persisted = storage.get(STORAGE_KEYS.SALES_MODE_AUTO_PRINT)
        if (persisted === "false") {
            setAutoPrint(false)
        } else if (persisted === "true") {
            setAutoPrint(true)
        }
    }, [embedded])

    React.useEffect(() => {
        if (!embedded) return
        storage.set(STORAGE_KEYS.SALES_MODE_AUTO_PRINT, String(autoPrint))
    }, [embedded, autoPrint])

    React.useEffect(() => {
        if (!embedded) return
        const onSetAutoPrint = (event: Event) => {
            const detail = (event as CustomEvent<{ enabled: boolean }>).detail
            if (typeof detail?.enabled === "boolean") {
                setAutoPrint(detail.enabled)
            }
        }
        window.addEventListener("sales-mode:set-auto-print", onSetAutoPrint)
        return () => window.removeEventListener("sales-mode:set-auto-print", onSetAutoPrint)
    }, [embedded])

    const { printReceipt } = useReceiptPrinter()
    const { recordSale, isRecording } = useRecordSale()
    const layoutPreset = useLayoutPresetId()
    const presetCapabilities = React.useMemo(() => getPresetCapabilities(layoutPreset), [layoutPreset])
    const { data: academicCal } = useAcademicCalendar()
    const [feeTermChoice, setFeeTermChoice] = React.useState<string>("__default__")

    // Initial fetch checks if we can use local mode. If not, it passes the debounced search to the backend.
    const { products, isLoadingProducts, isLocalMode, totalProducts } = useInventory({
        search: search ? debouncedSearch : '', // Only pass search if there is one, to prevent initial refetching on mount
        category: selectedCategory
    })

    const { customers, createCustomer } = useCustomers(customerSearch)
    const { data: promotions } = usePromotions()
    const { data: restaurantTables = [] } = useRestaurantTables()

    // Handlers
    const addToCart = React.useCallback((product: any) => {
        // OOS Guard: block adding out-of-stock items
        if (product.status === 'Out of Stock') {
            toast.error(`${product.product} is out of stock`)
            return
        }
        // price is already numeric from useInventory
        const price = typeof product.price === 'number'
            ? product.price
            : parseInt(String(product.price).replace(/[^0-9]/g, ''), 10) || 0
        setCart(prev => {
            const existing = prev.find(item => item.id === product.id)
            if (existing) {
                return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item)
            }
            return [...prev, {
                id: product.id,
                product: product.product,
                price,
                category: product.category,
                quantity: 1,
                image: product.image
            }]
        })
    }, [])

    const subtotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0)
    const totalAfterDiscount = Math.max(0, subtotal - discount)
    const totalItems = cart.reduce((acc, item) => acc + item.quantity, 0)
    const totalPrice = formatCurrency(totalAfterDiscount, { currency: activeBusiness?.currency || 'NGN' })
    const amountPaidNum = typeof amountPaid === 'number' ? amountPaid : 0
    const changeDue = paymentMethod === 'Cash' && amountPaidNum > 0
        ? Math.max(0, amountPaidNum - totalAfterDiscount)
        : 0

    const categories = React.useMemo(() => {
        return Array.from(new Set(products.map((item: Product) => item.category))) as string[]
    }, [products])

    const handlePrintReceipt = React.useCallback(async () => {
        if (!activeBusiness || cart.length === 0) {
            if (cart.length === 0) toast.error("Cart is empty")
            return
        }

        const receiptData = {
            businessName: activeBusiness.name,
            businessAddress: undefined,
            businessPhone: undefined,
            businessLogo: activeBusiness.logo,
            orderId: `SALE-${Date.now()}`,
            shortCode: `S${Math.floor(Math.random() * 9000) + 1000}`,
            date: new Date().toISOString(),
            customerName: selectedCustomer?.name || 'Walk-in Customer',
            items: cart.map(item => ({
                productName: item.product,
                quantity: item.quantity,
                price: item.price,
                total: item.price * item.quantity
            })),
            subtotal: subtotal,
            discountAmount: discount,
            totalAmount: totalAfterDiscount,
            amountPaid: amountPaidNum > 0 ? amountPaidNum : totalAfterDiscount,
            remainingAmount: Math.max(0, totalAfterDiscount - (amountPaidNum > 0 ? amountPaidNum : totalAfterDiscount)),
            paymentMethod: paymentMethod.toUpperCase(),
            currency: activeBusiness.currency || 'NGN'
        }

        await printReceipt(receiptData)
    }, [activeBusiness, cart, subtotal, selectedCustomer, paymentMethod, printReceipt])

    const totalProductsCount = isLocalMode ? products.length : totalProducts

    const handleSearchChange = (val: string) => {
        setLocalSearch(val)
    }

    // Derived total pages using filtered products from within ProductGrid would be cleaner, 
    // but we need it here for pagination controls. 
    // Let's replicate the filter logic or pass it back.
    const filteredProductsCount = React.useMemo(() => {
        return products.filter((p: Product) => {
            const matchesSearch = p.product?.toLowerCase().includes(search.toLowerCase()) ||
                (p.barcode && p.barcode.includes(search))
            const matchesCategory = !selectedCategory || p.category === selectedCategory
            return isLocalMode ? (matchesSearch && matchesCategory) : matchesCategory
        }).length
    }, [products, search, selectedCategory, isLocalMode])

    const totalPages = Math.ceil(filteredProductsCount / itemsPerPage)

    // Barcode Auto-Add Logic
    const mobileInputRef = React.useRef<HTMLInputElement>(null)
    React.useEffect(() => {
        if (localSearch.length >= 8) { // Typical minimum barcode length
            const exactMatch = products.find((p: Product) => p.barcode === localSearch)
            if (exactMatch) {
                addToCart(exactMatch)
                setLocalSearch("")
                setSearch("")
                // Re-focus the mobile input so consecutive scans work seamlessly
                requestAnimationFrame(() => mobileInputRef.current?.focus())
                toast.success(`Added ${exactMatch.product} via scan`, {
                    icon: <Barcode className="h-4 w-4" />,
                    duration: 1500
                })
            }
        }
    }, [search, products, addToCart])

    // Reset to page 1 when search or category changes
    React.useEffect(() => {
        setCurrentPage(1)
    }, [localSearch, selectedCategory])

    // Click outside customer dropdown
    React.useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (customerDropdownRef.current && !customerDropdownRef.current.contains(event.target as Node)) {
                setIsCustomerSearchOpen(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    const updateQuantity = (id: string, delta: number) => {
        setCart(prev => prev.map(item => {
            if (item.id === id) {
                const newQty = Math.max(0, item.quantity + delta)
                return { ...item, quantity: newQty }
            }
            return item
        }).filter(item => item.quantity > 0))
    }

    const handleCheckout = async () => {
        if (cart.length === 0) {
            toast.error("Cart is empty")
            return
        }
        if (presetCapabilities.requirePaymentMethodBeforeCheckout && !paymentMethod) {
            toast.error("Select a payment method before checkout")
            return
        }

        // Snapshot cart before clearing
        const saleCart = [...cart]
        const saleCustomer = selectedCustomer
        const salePaymentMethod = paymentMethod
        const saleTotal = totalAfterDiscount
        const saleAmountPaid = amountPaidNum > 0 ? amountPaidNum : saleTotal

        try {
            const result = await recordSale({
                items: saleCart.map(item => ({
                    productId: item.id,
                    productName: item.product,
                    quantity: item.quantity,
                    customPrice: item.price,
                })),
                paymentMethod: salePaymentMethod.toUpperCase(),
                amountPaid: saleAmountPaid,
                discountAmount: discount || undefined,
                promotionId: selectedPromotion !== 'none' ? selectedPromotion : undefined,
                customerId: saleCustomer?.id?.startsWith('new-') ? undefined : saleCustomer?.id,
                customerName: saleCustomer?.name,
                tags: layoutPreset === "restaurant" ? [serviceMode === "DINE_IN" ? "dine-in" : "takeaway"] : undefined,
                serviceMode: layoutPreset === "restaurant" ? serviceMode : undefined,
                tableLabel: layoutPreset === "restaurant" && serviceMode === "DINE_IN" ? tableLabel.trim() || undefined : undefined,
                covers: layoutPreset === "restaurant" && serviceMode === "DINE_IN" ? covers : undefined,
                kitchenStation: layoutPreset === "restaurant" ? kitchenStation.trim() || undefined : undefined,
                sendToKitchen: layoutPreset === "restaurant" ? sendToKitchen : undefined,
                notes: note.trim() || undefined,
                ...(layoutPreset === "school"
                    ? {
                        academicTermId:
                            feeTermChoice === "__default__"
                                ? undefined
                                : feeTermChoice === "__none__"
                                    ? null
                                    : feeTermChoice,
                    }
                    : {}),
            })

            const buildReceiptData = () => ({
                businessName: activeBusiness?.name || '',
                businessAddress: undefined,
                businessPhone: undefined,
                businessLogo: activeBusiness?.logo,
                orderId: result?.saleId || `SALE-${Date.now()}`,
                shortCode: result?.shortCode || `S${Math.floor(Math.random() * 9000) + 1000}`,
                date: new Date().toISOString(),
                customerName: saleCustomer?.name || 'Walk-in Customer',
                items: saleCart.map(item => ({
                    productName: item.product,
                    quantity: item.quantity,
                    price: item.price,
                    total: item.price * item.quantity
                })),
                subtotal: subtotal,
                discountAmount: discount,
                totalAmount: saleTotal,
                amountPaid: saleAmountPaid,
                remainingAmount: Math.max(0, saleTotal - saleAmountPaid),
                paymentMethod: salePaymentMethod.toUpperCase(),
                currency: activeBusiness?.currency || 'NGN'
            })

            if (result.offlineQueued) {
                toast.success('Sale saved offline', {
                    description: `Will sync when you are back online • ${saleCart.length} item${saleCart.length > 1 ? 's' : ''} • ${formatCurrency(saleTotal, { currency: activeBusiness?.currency || 'NGN' })}`,
                    duration: 9000,
                    action: {
                        label: 'Print receipt',
                        onClick: () => printReceipt(buildReceiptData(), result?.saleId),
                    },
                })
            } else {
                toast.success('Sale recorded!', {
                    description: `Synced instantly • ${saleCart.length} item${saleCart.length > 1 ? 's' : ''} • ${formatCurrency(saleTotal, { currency: activeBusiness?.currency || 'NGN' })}`,
                    duration: 8000,
                    action: {
                        label: 'Print Receipt',
                        onClick: () => printReceipt(buildReceiptData(), result?.saleId),
                    },
                })
            }

            if (autoPrint) {
                printReceipt(buildReceiptData(), result?.saleId)
            }

            // Reset state
            setCart([])
            setSelectedCustomer(null)
            setDiscount(0)
            setSelectedPromotion('none')
            setNote('')
            setAmountPaid('')
        } catch (err: any) {
            const message = err?.message || 'Failed to record sale. Please try again.'
            toast.error('Checkout failed', { description: message })
        }
    }

    const handleQueueSale = () => {
        if (cart.length === 0) {
            toast.error("Cart is empty")
            return
        }

        queueSale({
            customer: selectedCustomer,
            items: cart,
            paymentMethod: paymentMethod,
            discount: discount,
            promotionId: selectedPromotion !== 'none' ? selectedPromotion : undefined,
            note: note,
            amountPaid: amountPaid,
            total: subtotal
        })

        toast.success("Sale parked successfully", {
            description: selectedCustomer ? `Saved for ${selectedCustomer.name}` : "Saved for walk-in customer",
            icon: <Layers className="h-4 w-4" />
        })

        // Clear active cart
        setCart([])
        setSelectedCustomer(null)
        setDiscount(0)
        setNote('')
        setAmountPaid('')
    }

    // Keyboard shortcuts for search, service controls, and fast checkout
    React.useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            const activeEl = document.activeElement as HTMLElement | null
            const isInput = activeEl?.tagName === 'INPUT' || activeEl?.tagName === 'TEXTAREA'
            const isEditable = activeEl?.isContentEditable || activeEl?.getAttribute('role') === 'textbox'
            const hasModifier = e.metaKey || e.ctrlKey || e.altKey

            if (e.key === '/' && !isSearchOpen) {
                if (!isInput && !isEditable && !hasModifier) {
                    e.preventDefault()
                    setIsSearchOpen(true)
                }
            }

            if (
                layoutPreset === "restaurant" &&
                presetCapabilities.showServiceModeChips &&
                e.key.toLowerCase() === 'o' &&
                !isInput &&
                !isEditable &&
                !hasModifier &&
                !e.repeat &&
                !serviceControlsDrawerOpen
            ) {
                e.preventDefault()
                setServiceControlsDrawerOpen(true)
            }

            if (!presetCapabilities.fastCheckout) return
            if (isInput || isEditable || hasModifier) return
            if ((e.key === 'Enter' || e.key.toLowerCase() === 'p') && cart.length > 0 && !isRecording) {
                e.preventDefault()
                void handleCheckout()
            }
            if (e.key.toLowerCase() === 'k' && cart.length > 0) {
                e.preventDefault()
                handleQueueSale()
            }
        }
        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [isSearchOpen, layoutPreset, presetCapabilities.fastCheckout, presetCapabilities.showServiceModeChips, cart.length, isRecording, handleCheckout, serviceControlsDrawerOpen])

    const handleRecallSale = (sale: any) => {
        if (cart.length > 0) {
            toast.error("Cart not empty", {
                description: "Please clear or queue your current cart before recalling a sale."
            })
            return
        }

        setCart(sale.items)
        setSelectedCustomer(sale.customer)
        setPaymentMethod(sale.paymentMethod)
        setDiscount(sale.discount || 0)
        setSelectedPromotion(sale.promotionId || 'none')
        setNote(sale.note || '')
        setAmountPaid(sale.amountPaid || '')

        // Auto-show extras if there is relevant data
        if (sale.discount > 0 || sale.note || sale.promotionId) {
            setShowExtras(true)
        }

        removeQueuedSale(sale.id)
        setIsQueueDrawerOpen(false)

        toast.info("Sale recalled", {
            icon: <History className="h-4 w-4" />
        })
    }

    const renderRestaurantServiceControls = () => (
        <div className="flex flex-col gap-4">
            <div className="space-y-2">
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                    Order type
                </p>
                <div className="flex w-full items-center gap-1 rounded-2xl border border-brand-accent/8 bg-brand-accent/5 p-1 dark:border-white/5 dark:bg-white/5">
                    <button
                        type="button"
                        onClick={() => setServiceMode('DINE_IN')}
                        className={cn(
                            "flex flex-1 items-center justify-center gap-2 min-h-11 px-3 rounded-xl text-sm font-semibold transition-all duration-200",
                            serviceMode === 'DINE_IN'
                                ? "bg-white dark:bg-white/10 text-foreground shadow-sm ring-1 ring-black/5 dark:ring-white/10"
                                : "text-muted-foreground hover:text-foreground"
                        )}
                    >
                        <UsersRoundIcon className="h-4 w-4 shrink-0 opacity-80" />
                        Dine-in
                    </button>
                    <button
                        type="button"
                        onClick={() => setServiceMode('TAKEAWAY')}
                        className={cn(
                            "flex flex-1 items-center justify-center gap-2 min-h-11 px-3 rounded-xl text-sm font-semibold transition-all duration-200",
                            serviceMode === 'TAKEAWAY'
                                ? "bg-white dark:bg-white/10 text-foreground shadow-sm ring-1 ring-black/5 dark:ring-white/10"
                                : "text-muted-foreground hover:text-foreground"
                        )}
                    >
                        <ArrowBigUpDash className="h-4 w-4 shrink-0 opacity-80" />
                        Takeaway
                    </button>
                </div>
            </div>

            {serviceMode === "DINE_IN" ? (
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    <div className="flex flex-col gap-1.5 w-full">
                        <label className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                            Table
                        </label>
                        <Select value={tableLabel || "__none__"} onValueChange={(v) => setTableLabel(v === "__none__" ? "" : v)}>
                            <SelectTrigger className="h-11 w-full text-sm bg-white dark:bg-white/5 border-brand-accent/10 dark:border-white/10 rounded-xl">
                                <SelectValue placeholder="Select table" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="__none__">Manual entry</SelectItem>
                                {restaurantTables
                                    .filter((t) => t.isActive)
                                    .map((t) => (
                                        <SelectItem key={t.id} value={t.label}>
                                            {t.label} · {t.capacity} seats
                                        </SelectItem>
                                    ))}
                            </SelectContent>
                        </Select>
                    </div>
                    {(!tableLabel || !restaurantTables.some((t) => t.label === tableLabel)) ? (
                        <div className="flex flex-col gap-1.5 w-full">
                            <label className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                                Label
                            </label>
                            <Input
                                value={tableLabel}
                                onChange={(e) => setTableLabel(e.target.value)}
                                placeholder="e.g. T12"
                                className="h-11 w-full text-sm rounded-xl bg-white dark:bg-white/5"
                            />
                        </div>
                    ) : null}
                </div>
            ) : null}

            {serviceMode === "DINE_IN" ? (
                <div className="flex flex-col gap-1.5 w-full">
                    <label className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                        Prep station
                    </label>
                    <div className="flex items-center gap-2 min-h-11 px-3 rounded-xl border border-brand-accent/10 dark:border-white/10 bg-white dark:bg-white/5">
                        <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground shrink-0">
                            Station
                        </span>
                        <input
                            value={kitchenStation}
                            onChange={(e) => setKitchenStation(e.target.value)}
                            placeholder="kitchen"
                            className="min-w-0 flex-1 text-sm bg-transparent border-none outline-none text-foreground placeholder:text-muted-foreground"
                        />
                    </div>
                </div>
            ) : null}
            <div className="grid grid-cols-2 gap-3">
                {serviceMode === "DINE_IN" ? (
                    <div className="flex flex-col gap-1.5 w-full">
                        <label className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                            Covers
                        </label>
                        <div className="flex items-center min-h-11">
                            <CapacityStepper
                                value={covers}
                                onChange={setCovers}
                                className="h-11 px-2"
                            />
                        </div>
                    </div>
                ) : null}
                {serviceMode === "TAKEAWAY" ? (
                    <div className="flex flex-col gap-1.5 w-full">
                        <label className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                            Prep station
                        </label>
                        <div className="flex items-center gap-2 min-h-11 px-3 rounded-xl border border-brand-accent/10 dark:border-white/10 bg-white dark:bg-white/5">
                            <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground shrink-0">
                                Station
                            </span>
                            <input
                                value={kitchenStation}
                                onChange={(e) => setKitchenStation(e.target.value)}
                                placeholder="kitchen"
                                className="min-w-0 flex-1 text-sm bg-transparent border-none outline-none text-foreground placeholder:text-muted-foreground"
                            />
                        </div>
                    </div>
                ) : null}
                {(serviceMode === "TAKEAWAY" || serviceMode === "DINE_IN") ? (
                    <div className="flex flex-col gap-1.5 w-full">
                        <label className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                            Send to kitchen
                        </label>
                        <div className="flex items-center justify-between gap-3 min-h-11 px-3 rounded-xl border border-brand-accent/10 dark:border-white/10 bg-white dark:bg-white/5 w-full">
                            <span className="text-sm font-medium text-foreground">
                                {sendToKitchen ? "On" : "Off"}
                            </span>
                            <Switch checked={sendToKitchen} onCheckedChange={setSendToKitchen} className="scale-100" />
                        </div>
                    </div>
                ) : null}
            </div>

        </div>
    )

    return (
        <div
            className={cn(
                embedded
                    ? "relative h-full flex flex-col lg:flex-row overflow-hidden bg-brand-cream dark:bg-background"
                    : "fixed inset-0 z-50 flex flex-col lg:flex-row overflow-hidden bg-brand-cream dark:bg-background",
                mounted && "theme-transition"
            )}
        >
            {/* Background Decorative Elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10 opacity-40 dark:opacity-20">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-brand-gold/10 blur-[120px] animate-float-slow" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-brand-green/20 dark:bg-brand-gold/5 blur-[120px] animate-float-slower" />
            </div>

            {/* Left Side: Product Catalog */}
            <div className={cn(
                "flex-1 flex flex-col min-w-0 h-full relative z-10 overflow-hidden isolate",
                mobileView === 'cart' ? "hidden lg:flex" : "flex"
            )}>
                <ProductSearchOverlay
                    isOpen={isSearchOpen}
                    onClose={() => setIsSearchOpen(false)}
                    products={products}
                    onSelect={addToCart}
                    isLoading={isLoadingProducts}
                    isLocalMode={isLocalMode}
                    onSearchChange={setLocalSearch}
                />
                <div className="flex-1 flex flex-col pt-4 pr-4 pl-5 pb-0 lg:pt-2 lg:px-4 lg:pb-0 min-h-0">
                    {!embedded && (
                        <header className="flex items-center justify-between shrink-0">
                            <div className="flex items-center gap-6">
                                <Link href="/orders" className="hidden lg:block">
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        className="rounded-2xl h-12 w-12 group border-brand-deep/15 dark:border-white/5 bg-white dark:bg-brand-deep-800 hover:bg-brand-gold/10 dark:hover:bg-brand-deep-900 hover:border-brand-deep-800/15 transition-all duration-500"
                                    >
                                        <ArrowLeft className="h-5 w-5 group-hover:-translate-x-1 transition-transform" />
                                    </Button>
                                </Link>
                                <div>
                                    <h2 className="text-3xl lg:text-4xl font-serif text-brand-deep dark:text-brand-cream tracking-tighter">Sale Mode</h2>
                                    <p className="text-brand-accent/60 dark:text-brand-cream/40 text-xs lg:text-sm font-sans uppercase tracking-[0.2em] font-black">
                                        {presetCapabilities.fastCheckout ? "Fast Checkout" : "Catalog"}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-4">
                                {/* Auto Print Toggle */}
                                <div className="flex items-center gap-2 bg-brand-deep/5 dark:bg-white/5 px-4 lg:px-3 py-1.5 rounded-2xl border border-brand-accent/5 dark:border-white/5 h-12">
                                    <span className="text-[10px] lg:text-xs font-bold text-brand-accent/60 dark:text-brand-cream/60 uppercase tracking-widest hidden sm:block">Auto Print</span>
                                    <span className="text-[10px] font-bold text-brand-accent/60 dark:text-brand-cream/60 uppercase tracking-widest sm:hidden">Print</span>
                                    <Switch checked={autoPrint} onCheckedChange={setAutoPrint} className="scale-75 origin-right" />
                                </div>

                                <div className="flex lg:hidden items-center gap-2">
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        onClick={() => setMobileView('cart')}
                                        className="rounded-2xl h-12 w-12 bg-white/40 dark:bg-white/5 relative"
                                    >
                                        <ShoppingCart className="h-5 w-5 text-brand-accent dark:text-brand-cream" />
                                        {totalItems > 0 && (
                                            <span className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-brand-gold text-brand-deep flex items-center justify-center text-[10px] font-black shadow-lg">
                                                {totalItems}
                                            </span>
                                        )}
                                    </Button>
                                </div>
                            </div>
                        </header>
                    )}

                    {/* Filters & Search */}
                    <div className={cn("flex flex-col lg:flex-row gap-4 lg:items-center pb-4", embedded && "pt-2")}>
                        <div className="w-full lg:w-auto min-w-[320px] flex-none">
                            {/* Desktop: Opens Overlay */}
                            <div
                                className="relative hidden lg:flex items-center group cursor-pointer"
                                onClick={() => setIsSearchOpen(true)}
                            >
                                <div className="absolute left-4 inset-y-0 flex items-center pointer-events-none">
                                    <Search className="h-4 w-4 text-brand-accent/40 dark:text-brand-cream/40 group-hover:text-brand-deep dark:group-hover:text-brand-cream transition-colors" />
                                </div>
                                <div className="pl-11 pr-6 h-12 bg-white dark:bg-white/5 border border-brand-accent/10 dark:border-white/10 rounded-[14px] flex items-center text-brand-accent/40 dark:text-brand-cream/40 text-[13px] font-medium select-none w-full group-hover:border-brand-accent/30 dark:group-hover:border-white/30 transition-all shadow-xs">
                                    Search catalog or scan... <span className="ml-auto text-[10px] font-bold bg-brand-accent/5 dark:bg-white/5 px-2 py-0.5 rounded-md border border-brand-accent/10">/</span>
                                </div>
                            </div>

                            {/* Mobile: Inline Search Input */}
                            <div className="relative flex lg:hidden items-center group">
                                <div className="absolute left-4 inset-y-0 flex items-center pointer-events-none">
                                    <Search className="h-4 w-4 text-brand-accent/40 dark:text-brand-cream/40 group-focus-within:text-brand-deep dark:group-focus-within:text-brand-cream transition-colors" />
                                </div>
                                <input
                                    ref={mobileInputRef}
                                    type="text"
                                    placeholder="Search or scan..."
                                    value={localSearch}
                                    onChange={(e) => handleSearchChange(e.target.value)}
                                    className="w-full pl-11 pr-6 h-12 bg-white dark:bg-white/5 border border-brand-accent/10 dark:border-white/10 rounded-[14px] text-brand-deep dark:text-brand-cream text-[13px] font-medium placeholder:text-brand-accent/40 dark:placeholder:text-brand-cream/40 focus:outline-none focus:border-brand-accent/30 focus:ring-1 focus:ring-brand-accent/30 dark:focus:border-white/30 dark:focus:ring-white/30 transition-all shadow-xs"
                                />
                            </div>
                        </div>
                        <div className="flex gap-2 overflow-x-auto scrollbar-none scroll-smooth w-full lg:flex-1 py-1">
                            <Button
                                variant={!selectedCategory ? 'base' : 'outline'}
                                onClick={() => setSelectedCategory(null)}
                                className={cn(
                                    "rounded-[12px] h-10 px-5 min-w-max transition-all duration-300 text-sm font-medium",
                                    !selectedCategory
                                        ? "bg-brand-deep dark:bg-white text-white dark:text-brand-deep shadow-xs border-transparent hover:bg-brand-deep hover:text-white dark:hover:bg-white dark:hover:text-brand-deep"
                                        : "bg-white dark:bg-transparent text-brand-accent/60 dark:text-brand-cream/60 border-brand-accent/10 dark:border-white/10 hover:border-brand-accent/30 dark:hover:border-white/30"
                                )}
                            >
                                All Items
                            </Button>
                            {categories.map((cat: string) => (
                                <Button
                                    key={cat}
                                    variant={selectedCategory === cat ? 'base' : 'outline'}
                                    onClick={() => setSelectedCategory(cat)}
                                    className={cn(
                                        "rounded-[12px] h-10 px-5 min-w-max transition-all duration-300 text-sm font-medium",
                                        selectedCategory === cat
                                            ? "bg-brand-deep dark:bg-white text-white dark:text-brand-deep shadow-xs border-transparent hover:bg-brand-deep hover:text-white dark:hover:bg-white dark:hover:text-brand-deep"
                                            : "bg-white dark:bg-transparent text-brand-accent/60 dark:text-brand-cream/60 border-brand-accent/10 dark:border-white/10 hover:border-brand-accent/30 dark:hover:border-white/30"
                                    )}
                                >
                                    {cat}
                                </Button>
                            ))}
                        </div>
                    </div>
                    {layoutPreset === "restaurant" && presetCapabilities.showServiceModeChips ? (
                        <>
                            <div className="rounded-2xl border border-brand-accent/10 dark:border-white/10 bg-white/60 dark:bg-white/6 shadow-sm overflow-hidden mb-4">
                                <button
                                    type="button"
                                    className="flex w-full items-center justify-between cursor-pointer gap-3 text-left min-h-13 px-4 py-3 active:bg-brand-accent/5 dark:active:bg-white/5 transition-colors"
                                    onClick={() => setServiceControlsDrawerOpen(true)}
                                    aria-haspopup="dialog"
                                >
                                    <div className="min-w-0 flex-1">
                                        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                                            Order & service
                                        </p>
                                        <p className="text-sm font-medium text-foreground truncate mt-0.5">
                                            {serviceControlsSummary}
                                        </p>
                                    </div>
                                    <div className="inline-flex items-center gap-2 rounded-xl border border-brand-accent/15 dark:border-white/10 bg-background/70 px-2.5 py-1.5">
                                        <SlidersHorizontal className="h-4 w-4 shrink-0 text-muted-foreground" />
                                        <span className="text-xs font-semibold text-foreground">Adjust</span>
                                        <span className="ml-0.5 rounded-md border border-brand-accent/15 bg-brand-accent/5 px-1.5 py-0.5 text-[10px] font-bold text-muted-foreground">
                                            O
                                        </span>
                                    </div>
                                </button>
                            </div>
                            <Drawer open={serviceControlsDrawerOpen} onOpenChange={setServiceControlsDrawerOpen}>
                                <DrawerContent className="max-h-[88vh] flex flex-col">
                                    <DrawerStickyHeader className="pb-4">
                                        <DrawerTitle className="text-xl font-serif">Order &amp; service</DrawerTitle>
                                        <DrawerDescription>
                                            Table, covers, prep station, and kitchen routing.
                                        </DrawerDescription>
                                    </DrawerStickyHeader>
                                    <DrawerBody className="pt-2 pb-4">
                                        {renderRestaurantServiceControls()}
                                    </DrawerBody>
                                    <DrawerFooter className="pb-8 pt-2">
                                        <p className="text-[9px] font-semibold uppercase tracking-widest text-muted-foreground text-center">
                                            Enter/P · Pay · K · Park
                                        </p>
                                        <DrawerClose asChild>
                                            <Button variant="base" className="w-full rounded-xl h-11">
                                                Done
                                            </Button>
                                        </DrawerClose>
                                    </DrawerFooter>
                                </DrawerContent>
                            </Drawer>
                        </>
                    ) : null}
                    {/* Product Area: Grid (Scrollable) + Pagination (Fixed) */}
                    <div className="flex-1 min-h-0 flex flex-col gap-4 lg:gap-6 mt-4 lg:mt-0">
                        <ProductGrid
                            products={products}
                            isLoading={isLoadingProducts}
                            activeBusiness={activeBusiness}
                            addToCart={addToCart}
                            currentPage={currentPage}
                            itemsPerPage={itemsPerPage}
                            search={search}
                            selectedCategory={selectedCategory}
                            isLocalMode={isLocalMode}
                        />
                    </div>

                    {/* Pagination Controls - Fixed Bottom */}
                    {totalPages > 1 && (
                        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-20 flex items-center justify-center">
                            {/* Mobile Back Button */}
                            {!embedded && <div className="absolute left-2 lg:hidden">
                                <Link href="/orders">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="rounded-lg h-8 w-8 hover:bg-brand-gold/10 transition-all duration-500"
                                    >
                                        <ArrowLeft className="h-4 w-4" />
                                    </Button>
                                </Link>
                            </div>}

                            <div className="inline-flex w-fit items-center gap-2 rounded-[18px] border border-brand-accent/10 bg-transparent px-2 py-1.5 shadow-[0_10px_24px_rgba(0,0,0,0.08)] backdrop-blur-xl dark:border-white/10 dark:shadow-[0_10px_30px_rgba(0,0,0,0.35)]">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                    disabled={currentPage === 1}
                                    className="rounded-lg px-2 lg:px-3 hover:bg-brand-gold/5 transition-all text-[10px] font-bold uppercase tracking-widest h-8"
                                >
                                    <ChevronLeft className="h-3 w-3 lg:mr-1.5" />
                                    <span className="hidden lg:inline">Previous</span>
                                </Button>

                                <div className="flex items-center gap-1">
                                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                                        // Logic to show fewer pages on mobile
                                        const isVisibleOnMobile = Math.abs(currentPage - page) <= 1 || page === 1 || page === totalPages;
                                        if (!isVisibleOnMobile) return null;

                                        return (
                                            <Button
                                                key={page}
                                                variant={currentPage === page ? 'default' : 'ghost'}
                                                size="sm"
                                                onClick={() => setCurrentPage(page)}
                                                className={cn(
                                                    "w-8 h-8 rounded-lg font-semibold transition-all duration-300 text-xs",
                                                    currentPage === page
                                                        ? "bg-brand-deep dark:bg-brand-accent border-brand-deep dark:border-brand-accent text-brand-gold shadow-xs"
                                                        : "text-brand-accent/60 dark:text-brand-cream/60 hover:text-brand-accent hover:bg-brand-accent/5"
                                                )}
                                            >
                                                {page}
                                            </Button>
                                        )
                                    })}
                                </div>

                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                    disabled={currentPage === totalPages}
                                    className="rounded-lg px-2 lg:px-3 hover:bg-brand-gold/5 transition-all text-[10px] font-bold uppercase tracking-widest h-8"
                                >
                                    <span className="hidden lg:inline">Next</span>
                                    <ChevronRight className="h-3 w-3 lg:ml-1.5" />
                                </Button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Mobile Floating Action Button */}
                {mobileView === 'catalog' && cart.length > 0 && (
                    <motion.div
                        initial={{ y: 100, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        className="fixed bottom-20 sm:bottom-24 left-6 right-6 z-40 lg:hidden"
                    >
                        <Button
                            onClick={() => setMobileView('cart')}
                            className="w-full h-16 rounded-[24px] bg-brand-deep dark:bg-brand-accent text-brand-gold shadow-[0_20px_40px_rgba(0,0,0,0.3)] border border-brand-gold/20 flex items-center justify-between px-6 group"
                        >
                            <div className="flex items-center gap-4">
                                <div className="h-10 w-10 rounded-xl bg-white/10 flex items-center justify-center">
                                    <ShoppingCart className="h-5 w-5" />
                                </div>
                                <div className="text-left">
                                    <p className="text-[10px] font-bold uppercase tracking-widest opacity-60">Complete Sale</p>
                                    <p className="text-lg font-black tracking-tight">{totalPrice}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-bold uppercase tracking-widest mr-2">{totalItems} Items</span>
                                <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                            </div>
                        </Button>
                    </motion.div>
                )}
            </div>

            {/* Right Side: Cart & Checkout Summary */}
            <div className={cn(
                "w-full lg:w-[420px] lg:h-full bg-white/60 dark:bg-background backdrop-blur-3xl flex flex-col border-l border-brand-accent/10 dark:border-white/5 shadow-2xl relative z-20 min-h-0",
                mobileView === 'catalog' ? "hidden lg:flex" : "flex h-full fixed inset-0 z-50 lg:relative lg:inset-auto"
            )}>
                <div className="p-4 lg:pt-3 lg:px-5 lg:pb-5 border-b border-brand-accent/10 dark:border-white/5 flex flex-col gap-3 bg-brand-gold/5 dark:bg-brand-gold/5 relative">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            {/* Mobile Back to Catalog Button */}
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setMobileView('catalog')}
                                className="h-12 w-12 rounded-xl text-brand-accent hover:text-brand-accent dark:text-brand-cream lg:hidden hover:bg-brand-accent/10 transition-all shadow-sm border border-brand-accent/5"
                            >
                                <ArrowLeft className="h-5 w-5" />
                            </Button>

                            <div className="hidden lg:flex h-10 w-10 rounded-[14px] border border-brand-accent/15 bg-brand-cream/60 dark:bg-brand-accent items-center justify-center text-brand-deep dark:text-brand-gold shadow-sm shadow-brand-deep/20">
                                <ShoppingCart className="h-4 w-4" />
                            </div>
                            <div>
                                <h3 className="font-serif text-xl lg:text-2xl text-brand-deep dark:text-brand-cream tracking-tight">Checkout</h3>
                                <p className="text-[10px] uppercase tracking-[0.2em] text-brand-accent/40 dark:text-brand-cream/40 font-bold leading-none mt-1">{totalItems} Items in Basket</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            {/* Customer Select / Open Drawer */}
                            {selectedCustomer ? (
                                <Button
                                    variant="ghost"
                                    onClick={() => setIsCustomerSearchOpen(!isCustomerSearchOpen)}
                                    className="h-12 rounded-2xl bg-white dark:bg-brand-accent/20 text-brand-accent dark:text-brand-cream hover:bg-white/80 dark:hover:bg-brand-accent/30 border border-brand-accent/5 dark:border-white/5 shadow-sm transition-all flex items-center gap-3 px-4"
                                >
                                    <div className="text-left">
                                        <p className="text-[10px] font-bold uppercase tracking-widest leading-none opacity-40 dark:opacity-60">Client</p>
                                        <p className="text-xs font-black leading-tight">{selectedCustomer?.name?.split(' ')[0] || 'Client'}</p>
                                    </div>
                                    <User className="h-4 w-4" />
                                </Button>
                            ) : (
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => setIsCustomerSearchOpen(!isCustomerSearchOpen)}
                                    className="size-12 rounded-[16px] bg-white dark:bg-white/5 text-brand-accent/40 dark:text-brand-cream/40 hover:text-brand-accent hover:bg-white/80 transition-all border border-brand-accent/5 dark:border-white/5 shadow-sm"
                                >
                                    <UsersRoundIcon className="h-5 w-5" />
                                </Button>
                            )}

                            {/* Queue Sale Indicator */}
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setIsQueueDrawerOpen(true)}
                                className={cn(
                                    "size-12 rounded-[16px] bg-white dark:bg-white/5 text-brand-accent/40 dark:text-brand-cream/40 hover:text-brand-gold hover:bg-white/80 transition-all border border-brand-accent/5 dark:border-white/5 shadow-sm relative",
                                    queuedSales.length > 0 && "text-brand-gold border-brand-gold/20"
                                )}
                            >
                                <Layers className="h-5 w-5" />
                                {queuedSales.length > 0 && (
                                    <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-brand-gold text-brand-deep flex items-center justify-center text-[9px] font-black shadow-lg">
                                        {queuedSales.length}
                                    </span>
                                )}
                            </Button>
                        </div>
                    </div>

                    {/* Absolute Customer Search Overlay */}
                    <AnimatePresence>
                        {isCustomerSearchOpen && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95, y: -20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: -20 }}
                                ref={customerDropdownRef}
                                className="absolute top-0 left-0 right-0 z-50 p-6 pt-8 pb-10 bg-white dark:bg-brand-deep-900 flex flex-col gap-5 rounded-b-[40px] shadow-[0_25px_50px_-12px_rgba(0,0,0,0.1)] dark:shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)] border-b border-brand-accent/10 dark:border-white/5"
                            >
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 rounded-xl bg-brand-accent/5 dark:bg-white/5 flex items-center justify-center text-brand-accent dark:text-brand-gold">
                                            <UserSearchIcon className="h-5 w-5" />
                                        </div>
                                        <h4 className="font-serif text-2xl text-brand-deep dark:text-brand-cream tracking-tight">Customer Search</h4>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => setIsCustomerSearchOpen(false)}
                                        className="h-10 w-10 rounded-xl bg-brand-accent/5 dark:bg-white/5 hover:bg-rose-500/10 dark:hover:bg-rose-500/20 text-brand-accent/60 dark:text-brand-cream/60 hover:text-rose-500 transition-all"
                                    >
                                        <X className="h-5 w-5" />
                                    </Button>
                                </div>

                                <div className="relative group px-0.5">
                                    <div className="absolute left-6 inset-y-0 flex items-center pointer-events-none">
                                        <Search className="h-5 w-5 text-brand-accent/30 dark:text-brand-cream/30 group-focus-within:text-brand-gold transition-colors" />
                                    </div>
                                    <Input
                                        autoFocus
                                        placeholder="Type name, phone or email..."
                                        value={customerSearch}
                                        onChange={(e) => setCustomerSearch(e.target.value)}
                                        className="pl-16 h-16 text-lg bg-brand-deep/5 dark:bg-white/10 border-brand-accent/5 dark:border-white/5 rounded-2xl dark:focus:ring-brand-accent/30 dark:text-brand-cream dark:placeholder:text-brand-cream/20 transition-all font-medium"
                                    />
                                </div>

                                <div className="flex-1 overflow-y-auto custom-scrollbar -mx-2 px-2">
                                    <div className="space-y-1">
                                        {/* Filtered Customers — from useCustomers hook */}
                                        {customers
                                            .filter((c: Customer) => c.name?.toLowerCase().includes(customerSearch?.toLowerCase() ?? '') || c.phone?.includes(customerSearch ?? ''))
                                            .map((customer: Customer) => (
                                                <Button
                                                    key={customer.id}
                                                    variant="ghost"
                                                    onClick={() => {
                                                        setSelectedCustomer(customer)
                                                        setIsCustomerSearchOpen(false)
                                                        setCustomerSearch("")
                                                        toast.success(`Client ${customer.name} attached`)
                                                    }}
                                                    className="w-full rounded-3xl p-4 h-auto text-left hover:bg-brand-accent/5 dark:hover:bg-white/5 justify-start transition-colors group border border-transparent hover:border-brand-accent/5 dark:hover:border-white/10"
                                                >
                                                    <div className="flex items-center justify-between w-full">
                                                        <div className="flex items-center gap-4">
                                                            <div className="h-12 w-12 rounded-2xl bg-brand-accent/5 dark:bg-white/10 flex items-center justify-center text-brand-accent dark:text-brand-cream group-hover:bg-brand-accent/10 dark:group-hover:bg-brand-accent/20 transition-colors shadow-sm">
                                                                <User className="h-5 w-5" />
                                                            </div>
                                                            <div>
                                                                <h4 className="font-bold text-brand-deep dark:text-brand-cream group-hover:text-brand-accent dark:group-hover:text-brand-gold transition-colors">{customer.name}</h4>
                                                                <p className="text-xs text-brand-accent/40 dark:text-brand-cream/40 font-medium">{customer.phone} • {customer.type}</p>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-3">
                                                            {customer.recentPurchases && (
                                                                <span className="text-[10px] font-bold text-brand-gold bg-brand-gold/10 px-2.5 py-1 rounded-lg border border-brand-gold/20">{customer.recentPurchases} orders</span>
                                                            )}
                                                            <ChevronRight className="h-5 w-5 text-brand-accent/20 dark:text-brand-cream/20 group-hover:text-brand-gold transition-colors" />
                                                        </div>
                                                    </div>
                                                </Button>
                                            ))}

                                        {/* Quick Create Option */}
                                        {customerSearch.length > 2 && !customers.some((c: Customer) => c.name?.toLowerCase() === customerSearch?.toLowerCase()) && (
                                            <Button
                                                variant="outline"
                                                onClick={async () => {
                                                    try {
                                                        const newCustomer = await createCustomer(customerSearch)
                                                        setSelectedCustomer(newCustomer as Customer)
                                                    } catch {
                                                        // Fallback: create local placeholder (will be synced on checkout via customerName)
                                                        setSelectedCustomer({ id: `new-${Date.now()}`, name: customerSearch, phone: '', type: 'Walk-in' })
                                                    }
                                                    setIsCustomerSearchOpen(false)
                                                    setCustomerSearch("")
                                                    toast.success(`Customer "${customerSearch}" added`)
                                                }}
                                                className="w-full p-5 h-auto text-left border border-dashed border-brand-accent/30 dark:border-white/20 hover:border-brand-accent bg-brand-accent/5 dark:bg-white/5 hover:bg-brand-accent/10 dark:hover:bg-white/10 group rounded-3xl transition-all"
                                            >
                                                <div className="flex items-center gap-4">
                                                    <div className="h-12 w-12 rounded-xl bg-brand-accent/10 dark:bg-brand-accent/30 flex items-center justify-center text-brand-accent dark:text-brand-cream shadow-inner">
                                                        <UserPlus className="h-6 w-6" />
                                                    </div>
                                                    <div>
                                                        <p className="text-[10px] font-bold text-brand-accent dark:text-brand-gold uppercase tracking-[0.2em] mb-1">Add as new customer</p>
                                                        <h4 className="font-serif text-2xl text-brand-deep dark:text-brand-cream font-medium tracking-tight">{customerSearch}</h4>
                                                    </div>
                                                </div>
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Cart Items List */}
                <div className="flex-1 overflow-y-auto p-4 lg:p-5 custom-scrollbar min-h-0">
                    <AnimatePresence mode="popLayout">
                        {cart.length === 0 ? (
                            <motion.div
                                key="empty-cart"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="h-full flex flex-col items-center justify-center text-center py-20"
                            >
                                <div className="mb-6 h-20 w-20 rounded-full bg-brand-deep/5 dark:bg-white/5 flex items-center justify-center border border-brand-accent/5 dark:border-white/5">
                                    <ShoppingCart className="h-8 w-8 text-brand-accent/30 dark:text-brand-cream/30" />
                                </div>
                                <h4 className="font-semibold text-lg text-brand-deep/60 dark:text-brand-cream/60 mb-1 tracking-tight">Cart is empty</h4>
                                <p className="text-[13px] text-brand-accent/40 dark:text-brand-cream/30 px-8">Select items to begin recording.</p>
                            </motion.div>
                        ) : (
                            <div className="flex flex-col">
                                {cart.map((item, index) => (
                                    <motion.div
                                        key={item.id}
                                        layout
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, x: -10 }}
                                        className={cn(
                                            "flex items-center gap-4 py-3 group",
                                            index !== cart.length - 1 && "border-b border-brand-accent/5 dark:border-white/5"
                                        )}
                                    >
                                        <div className="min-w-0 flex-1 flex flex-col justify-center">
                                            <div className="flex items-center justify-between mb-0.5">
                                                <h4 className="font-medium text-[15px] text-brand-deep dark:text-brand-cream truncate group-hover:text-brand-accent transition-colors">{item.product}</h4>
                                                <p className="font-semibold text-brand-deep dark:text-brand-cream text-[15px] tracking-tight shrink-0 ml-4">
                                                    <CurrencyText value={formatCurrency(item.price * item.quantity, { currency: activeBusiness?.currency || 'NGN' }).replace('NGN', '₦')} />
                                                </p>
                                            </div>
                                            <div className="flex items-center justify-between mt-1">
                                                <div className="flex items-center gap-1.5 bg-brand-deep/5 dark:bg-white/5 rounded-lg p-0.5">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => updateQuantity(item.id, -1)}
                                                        className="h-6 w-6 flex items-center justify-center text-brand-accent/60 dark:text-brand-cream/60 hover:text-brand-deep hover:bg-black/5 rounded-[6px] transition-all"
                                                    >
                                                        <Minus className="h-3 w-3" />
                                                    </Button>
                                                    <span className="w-5 text-center text-[13px] font-semibold text-brand-deep dark:text-brand-cream tabular-nums">{item.quantity}</span>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => updateQuantity(item.id, 1)}
                                                        className="h-6 w-6 flex items-center justify-center text-brand-accent/60 dark:text-brand-cream/60 hover:text-brand-deep hover:bg-black/5 rounded-[6px] transition-all"
                                                    >
                                                        <Plus className="h-3 w-3" />
                                                    </Button>
                                                </div>
                                                <p className="text-[12px] text-brand-accent/40 dark:text-brand-cream/30 font-medium tracking-wide">
                                                    {item.quantity} × <CurrencyText value={formatCurrency(item.price, { currency: activeBusiness?.currency || 'NGN' }).replace('NGN', '₦')} />
                                                </p>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Billing Summary & Actions */}
                <div className="p-4 bg-brand-deep/5 dark:bg-brand-gold/5 border-t border-brand-accent/10 dark:border-white/5 shrink-0 flex flex-col gap-4">
                    {/* Adaptive Payment Selection */}
                    <div className="flex flex-col gap-2">
                        <header className="flex justify-between items-center">
                            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-accent/50 dark:text-brand-cream/50">Settlement Method</p>
                        </header>
                        <div className="flex bg-brand-deep/5 dark:bg-white/5 p-1 rounded-xl">
                            {[
                                { id: 'Cash' },
                                { id: 'Transfer' },
                                { id: 'POS' }
                            ].map((method) => (
                                <button
                                    key={method.id}
                                    onClick={() => setPaymentMethod(method.id as any)}
                                    className={cn(
                                        "flex-1 py-2 rounded-lg text-xs font-semibold transition-all duration-200 outline-none",
                                        paymentMethod === method.id
                                            ? "bg-white dark:bg-brand-deep shadow-xs text-brand-deep dark:text-brand-cream"
                                            : "text-brand-accent/50 dark:text-brand-cream/40 hover:text-brand-deep dark:hover:text-brand-cream"
                                    )}
                                >
                                    {method.id}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Breakdown */}
                    <div className="flex flex-col gap-2 border-t border-brand-accent/10 dark:border-white/10 pt-4">
                        <div className="flex justify-between items-center text-[13px]">
                            <span className="text-brand-accent/60 dark:text-brand-cream/60 font-medium">Order Subtotal</span>
                            <div className="flex items-center gap-2">
                                <span className="text-brand-deep dark:text-brand-cream font-semibold tabular-nums">
                                    <CurrencyText value={formatCurrency(subtotal, { currency: activeBusiness?.currency || 'NGN' })} />
                                </span>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setShowExtras(!showExtras)}
                                    className="h-6 px-1.5 -mr-1.5 rounded-md text-[10px] font-bold uppercase tracking-wider text-brand-accent/40 dark:text-brand-cream/40 hover:bg-brand-deep/5"
                                >
                                    <ChevronDown className={cn("h-3 w-3 transition-transform duration-300", showExtras && "rotate-180")} />
                                </Button>
                            </div>
                        </div>

                        <AnimatePresence>
                            {showExtras && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: "auto", opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                >
                                    <div className="flex flex-col gap-3 pb-2">
                                        {/* Discount Input & Promotions */}
                                        <div className="flex items-center justify-between text-[13px] gap-3 pt-1">
                                            <span className="text-brand-accent/60 dark:text-brand-cream/60 font-medium">Discount</span>

                                            <div className="flex items-center justify-end gap-2 flex-1">
                                                {selectedPromotion !== 'none' ? (
                                                    <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 px-2 py-1 rounded-md">
                                                        <span className="text-[11px] font-bold truncate max-w-[100px]">
                                                            {promotions?.find((p: any) => p.id === selectedPromotion)?.name || 'Promo'}
                                                        </span>
                                                        <button
                                                            onClick={() => {
                                                                setSelectedPromotion('none')
                                                                setDiscount(0)
                                                            }}
                                                            className="text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors"
                                                            aria-label="Remove promotion"
                                                        >
                                                            <X className="w-3 h-3" />
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <div className="w-28">
                                                        <MoneyInput
                                                            size="sm"
                                                            value={discount || ''}
                                                            onChange={(val) => {
                                                                setDiscount(Math.min(val || 0, subtotal))
                                                                if (val > 0) setShowExtras(true)
                                                            }}
                                                            currencySymbol={currency}
                                                            className="h-8 border-brand-accent/10 dark:border-white/10 text-emerald-600 dark:text-brand-gold text-xs"
                                                        />
                                                    </div>
                                                )}

                                                {promotions && promotions.length > 0 && (
                                                    <Select
                                                        value={selectedPromotion}
                                                        onValueChange={(val) => {
                                                            setSelectedPromotion(val)
                                                            if (val === 'none') {
                                                                setDiscount(0)
                                                            } else {
                                                                setShowExtras(true)
                                                                const promo = promotions?.find((p: any) => p.id === val)
                                                                if (promo) {
                                                                    let calcDiscount = 0
                                                                    if (promo.type === 'PERCENTAGE') {
                                                                        calcDiscount = subtotal * (promo.value / 100)
                                                                    } else if (promo.type === 'FIXED') {
                                                                        calcDiscount = promo.value
                                                                    }
                                                                    setDiscount(Math.min(calcDiscount, subtotal))
                                                                }
                                                            }
                                                        }}
                                                    >
                                                        <SelectTrigger className="w-8 h-8 px-0 justify-center border-brand-accent/10 dark:border-white/10 dark:bg-white/5 rounded-md hover:bg-white/50 dark:hover:bg-white/10 transition-colors [&>svg:last-child]:hidden [&>span]:hidden" aria-label="Apply promotion">
                                                            <SelectValue placeholder="Promo" />
                                                            <Tag className="w-3.5 h-3.5 text-brand-accent/60 dark:text-brand-cream/60" />
                                                        </SelectTrigger>
                                                        <SelectContent align="end">
                                                            <SelectItem value="none">Custom amount</SelectItem>
                                                            {promotions.map((promo: any) => (
                                                                <SelectItem key={promo.id} value={promo.id}>
                                                                    {promo.name}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex flex-col text-[13px] gap-1.5">
                                            <span className="text-brand-accent/60 dark:text-brand-cream/60 font-medium">Order Note</span>
                                            <Textarea
                                                value={note}
                                                onChange={(e) => setNote(e.target.value)}
                                                placeholder="Special instructions or remarks..."
                                                maxLength={120}
                                                rows={1}
                                                className="w-full bg-white dark:bg-white/5 rounded-lg border border-brand-accent/10 dark:border-white/10 px-3 py-1.5 text-xs text-brand-deep dark:text-brand-cream placeholder:text-brand-accent/30 dark:placeholder:text-brand-cream/20 outline-none focus:border-brand-deep/20 transition-colors resize-none min-h-[36px]"
                                            />
                                        </div>

                                        {/* Amount Received (Cash only) */}
                                        {paymentMethod === 'Cash' && (
                                            <div className="flex items-center justify-between text-[13px] gap-3 pt-1">
                                                <span className="text-brand-accent/60 dark:text-brand-cream/60 font-medium shrink-0">Amount Received</span>
                                                <div className="flex-1 max-w-[140px]">
                                                    <MoneyInput
                                                        size="sm"
                                                        value={amountPaid === '' ? '' : amountPaid}
                                                        onChange={(val) => setAmountPaid(val === 0 ? '' : val)}
                                                        currencySymbol={currency}
                                                        placeholder={String(totalAfterDiscount)}
                                                        className="h-8 border-brand-accent/10 dark:border-white/10 text-brand-deep dark:text-brand-cream text-[13px]"
                                                    />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {layoutPreset === "school" ? (
                            <div className="flex flex-col gap-1.5 pt-1 border-t border-brand-accent/5 dark:border-white/5 mt-1">
                                <span className="text-[10px] font-bold uppercase tracking-widest text-brand-accent/50 dark:text-brand-cream/45">
                                    Fee period
                                </span>
                                <Select value={feeTermChoice} onValueChange={setFeeTermChoice}>
                                    <SelectTrigger className="h-9 text-xs bg-white dark:bg-white/5 border-brand-accent/10">
                                        <SelectValue placeholder="Term" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="__default__">Workspace default</SelectItem>
                                        <SelectItem value="__none__">No term</SelectItem>
                                        {(academicCal?.sessions ?? []).flatMap((s) =>
                                            (s.terms ?? []).map((t) => (
                                                <SelectItem key={t.id} value={t.id}>
                                                    {s.name} · {t.name}
                                                </SelectItem>
                                            ))
                                        )}
                                    </SelectContent>
                                </Select>
                            </div>
                        ) : null}

                        <div className="flex justify-between items-end pt-2">
                            <span className="text-[13px] font-semibold text-brand-deep dark:text-brand-cream/80">Total Payable</span>
                            <span className="font-semibold text-2xl text-brand-deep dark:text-brand-cream tracking-tight leading-none tabular-nums">
                                <CurrencyText value={formatCurrency(totalAfterDiscount, { currency: activeBusiness?.currency || 'NGN' })} />
                            </span>
                        </div>

                        {/* Change Due (Cash only) */}
                        {paymentMethod === 'Cash' && changeDue > 0 && (
                            <div className="flex justify-between items-center text-xs bg-emerald-500/10 dark:bg-emerald-500/5 rounded-lg px-3 py-2 border border-emerald-500/20 mt-1">
                                <span className="font-semibold text-emerald-600 dark:text-emerald-400">Change Due</span>
                                <span className="font-bold text-emerald-600 dark:text-emerald-400 tabular-nums text-sm">
                                    <CurrencyText value={formatCurrency(changeDue, { currency: activeBusiness?.currency || 'NGN' })} />
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Pro Actions */}
                    <div className="flex items-center gap-2 mt-2">
                        <Button
                            variant="outline"
                            className="h-12 w-12 shrink-0 rounded-[14px] border-brand-accent/10 dark:border-white/10 text-brand-accent/60 dark:text-brand-cream/80 hover:bg-brand-deep/5 hover:text-brand-deep transition-all duration-300"
                            onClick={handlePrintReceipt}
                            disabled={cart.length === 0}
                            title="Print Receipt"
                        >
                            <ReceiptText className="h-5 w-5" />
                        </Button>
                        <Button
                            variant="outline"
                            className="h-12 w-12 shrink-0 rounded-[14px] border-brand-accent/10 dark:border-white/10 text-brand-accent/60 dark:text-brand-cream/80 hover:bg-brand-deep/5 hover:text-brand-deep transition-all duration-300"
                            onClick={handleQueueSale}
                            disabled={cart.length === 0}
                            title="Queue Sale"
                        >
                            <Layers className="h-5 w-5" />
                        </Button>
                        <Button
                            className="h-12 flex-1 rounded-[14px] bg-brand-deep dark:bg-white text-white dark:text-brand-deep font-semibold text-base hover:scale-[1.01] active:scale-[0.98] transition-all duration-200 border-none group relative overflow-hidden disabled:opacity-50"
                            onClick={handleCheckout}
                            disabled={isRecording || cart.length === 0}
                        >
                            {isRecording ? (
                                <motion.div key="loader" animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }}>
                                    <ArrowRight className="h-5 w-5" />
                                </motion.div>
                            ) : (
                                <motion.span key="text" className="inline-flex items-center">
                                    Charge <CurrencyText value={formatCurrency(totalAfterDiscount, { currency: activeBusiness?.currency || 'NGN' }).replace('NGN', '₦')} className="ml-1" />
                                </motion.span>
                            )}
                        </Button>
                    </div>
                </div>
            </div>

            {/* Queued Sales Management */}
            <QueuedSalesDrawer
                isOpen={isQueueDrawerOpen}
                onClose={() => setIsQueueDrawerOpen(false)}
                sales={queuedSales}
                onRecall={handleRecallSale}
                onRemove={removeQueuedSale}
            />


            {/* Global Refinements */}
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
                .scrollbar-none::-webkit-scrollbar {
                    display: none;
                }
                .theme-transition {
                    transition: background-color 0.5s ease, color 0.5s ease, border-color 0.5s ease, box-shadow 0.5s ease;
                }
                .will-change-scroll {
                    will-change: scroll-position;
                }
                .will-change-transform {
                    will-change: transform;
                }
            `}</style>
        </div>
    )
}
