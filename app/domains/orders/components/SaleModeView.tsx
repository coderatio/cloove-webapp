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
import { mockCustomers, Customer } from '../data/customerMocks'
import { toast } from 'sonner'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useReceiptPrinter } from '@/app/hooks/useReceiptPrinter'
import { useBusiness } from '@/app/components/BusinessProvider'
import { format } from 'date-fns'
import { useQueuedSales, CartItem } from '../hooks/useQueuedSales'
import { QueuedSalesDrawer } from './QueuedSalesDrawer'
import { useRecordSale } from '../hooks/useRecordSale'
import { useInventory } from '../hooks/useInventory'
import { useCustomers } from '../hooks/useCustomers'
import { usePromotions } from '../hooks/usePromotions'
import { formatCurrency } from '@/app/lib/formatters'
import { ProductSearchOverlay } from './ProductSearchOverlay'
import { Product } from '../hooks/useInventory'

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
            type: "spring",
            stiffness: 400,
            damping: 28
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

function CreativeLoader() {
    return (
        <div className="col-span-full py-32 flex flex-col items-center justify-center">
            <div className="relative h-24 w-24 mb-10">
                {/* Pulsing Core */}
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

                {/* Orbiting Icons */}
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

export function SaleModeView() {
    const router = useRouter()
    const [cart, setCart] = React.useState<CartItem[]>([])
    const [search, setSearch] = React.useState('')
    const debouncedSearch = useDebounce(search, 300)
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
    const itemsPerPage = 12
    const [discount, setDiscount] = React.useState(0)
    const [note, setNote] = React.useState('')
    const [amountPaid, setAmountPaid] = React.useState<number | "">("")
    const [selectedPromotion, setSelectedPromotion] = React.useState<string>('none')
    const [autoPrint, setAutoPrint] = React.useState(true)
    const [showExtras, setShowExtras] = React.useState(false)
    const [isSearchOpen, setIsSearchOpen] = React.useState(false)

    // Queue Sale State
    const { queuedSales, queueSale, removeQueuedSale } = useQueuedSales()
    const [isQueueDrawerOpen, setIsQueueDrawerOpen] = React.useState(false)

    const { currency, activeBusiness } = useBusiness()
    const { printReceipt } = useReceiptPrinter()
    const { recordSale, isRecording } = useRecordSale()

    // Initial fetch checks if we can use local mode. If not, it passes the debounced search to the backend.
    const { products, isLoadingProducts, isLocalMode, totalProducts } = useInventory({
        search: search ? debouncedSearch : '', // Only pass search if there is one, to prevent initial refetching on mount
        category: selectedCategory
    })

    const { customers, createCustomer } = useCustomers(customerSearch)
    const { data: promotions } = usePromotions()

    const subtotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0)
    const totalAfterDiscount = Math.max(0, subtotal - discount)
    const totalItems = cart.reduce((acc, item) => acc + item.quantity, 0)
    const totalPrice = formatCurrency(totalAfterDiscount, { currency: activeBusiness?.currency || 'NGN' })
    const amountPaidNum = typeof amountPaid === 'number' ? amountPaid : 0
    const changeDue = paymentMethod === 'Cash' && amountPaidNum > 0
        ? Math.max(0, amountPaidNum - totalAfterDiscount)
        : 0

    const handlePrintReceipt = React.useCallback(async () => {
        if (!activeBusiness || cart.length === 0) {
            if (cart.length === 0) toast.error("Cart is empty")
            return
        }

        const receiptData = {
            businessName: activeBusiness.name,
            businessAddress: (activeBusiness as any).address,
            businessPhone: (activeBusiness as any).phone,
            orderId: `SALE-${Date.now()}`,
            shortCode: `S${Math.floor(Math.random() * 9000) + 1000}`,
            date: format(new Date(), 'dd MMM yyyy, HH:mm'),
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

    // Derived State
    const categories = Array.from(new Set(products.map((item: Product) => item.category))) as string[]

    const filteredProducts = products.filter((p: Product) => {
        // If not in local mode and there's a search term, the backend already verified matches
        // We still filter locally to avoid weird UI flashes before backend returns, 
        // but if isLocalMode is false and isLoadingProducts is true, we will just show what we have.
        const matchesSearch = p.product?.toLowerCase().includes(search.toLowerCase()) ||
            (p.barcode && p.barcode.includes(search))
        const matchesCategory = !selectedCategory || p.category === selectedCategory

        // In complete server mode, we just trust the backend. For hybrid, we local filter what we can see.
        return isLocalMode ? (matchesSearch && matchesCategory) : matchesCategory
    })

    const totalPages = Math.ceil(filteredProducts.length / itemsPerPage)
    const paginatedProducts = filteredProducts.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    )

    // Barcode Auto-Add Logic
    const mobileInputRef = React.useRef<HTMLInputElement>(null)
    React.useEffect(() => {
        if (search.length >= 8) { // Typical minimum barcode length
            const exactMatch = products.find((p: Product) => p.barcode === search)
            if (exactMatch) {
                addToCart(exactMatch)
                setSearch("")
                // Re-focus the mobile input so consecutive scans work seamlessly
                requestAnimationFrame(() => mobileInputRef.current?.focus())
                toast.success(`Added ${exactMatch.product} via scan`, {
                    icon: <Barcode className="h-4 w-4" />,
                    duration: 1500
                })
            }
        }
    }, [search, products])

    // Reset to page 1 when search or category changes
    React.useEffect(() => {
        setCurrentPage(1)
    }, [search, selectedCategory])

    // Keyboard shortcut for search
    React.useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === '/' && !isSearchOpen) {
                // Don't open if user is typing in another input
                const isInput = document.activeElement?.tagName === 'INPUT' ||
                    document.activeElement?.tagName === 'TEXTAREA'
                if (!isInput) {
                    e.preventDefault()
                    setIsSearchOpen(true)
                }
            }
        }
        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [isSearchOpen])

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

    // Handlers
    const addToCart = (product: any) => {
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
    }

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

        // Snapshot cart before clearing
        const saleCart = [...cart]
        const saleCustomer = selectedCustomer
        const salePaymentMethod = paymentMethod
        const saleTotal = totalAfterDiscount
        const saleAmountPaid = amountPaidNum > 0 ? amountPaidNum : saleTotal

        try {
            const result = await recordSale({
                items: saleCart.map(item => ({
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
                notes: note.trim() || undefined,
            })

            const buildReceiptData = () => ({
                businessName: activeBusiness?.name || '',
                businessAddress: (activeBusiness as any)?.address,
                businessPhone: (activeBusiness as any)?.phone,
                orderId: result?.id || `SALE-${Date.now()}`,
                shortCode: result?.shortCode || `S${Math.floor(Math.random() * 9000) + 1000}`,
                date: format(new Date(), 'dd MMM yyyy, HH:mm'),
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

            toast.success('Sale recorded!', {
                description: `${saleCart.length} item${saleCart.length > 1 ? 's' : ''} • ${formatCurrency(saleTotal, { currency: activeBusiness?.currency || 'NGN' })}`,
                duration: 8000,
                action: {
                    label: 'Print Receipt',
                    onClick: () => printReceipt(buildReceiptData()),
                }
            })

            if (autoPrint) {
                printReceipt(buildReceiptData())
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

    return (
        <div className={cn("fixed inset-0 z-50 flex flex-col lg:flex-row overflow-hidden bg-brand-cream dark:bg-background", mounted && "theme-transition")}>
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
                    onSearchChange={setSearch}
                />
                <div className="flex-1 flex flex-col p-4 lg:pt-2 lg:px-8 lg:pb-8 space-y-4 lg:space-y-6 min-h-0">
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
                                <p className="text-brand-accent/60 dark:text-brand-cream/40 text-xs lg:text-sm font-sans uppercase tracking-[0.2em] font-black">Catalog</p>
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

                    {/* Filters & Search */}
                    <div className="flex flex-col lg:flex-row gap-4 items-start">
                        <div className="w-full lg:w-auto min-w-[320px] flex-2">
                            {/* Desktop: Opens Overlay */}
                            <div
                                className="relative hidden lg:flex items-center group cursor-pointer"
                                onClick={() => setIsSearchOpen(true)}
                            >
                                <div className="absolute left-4 inset-y-0 flex items-center pointer-events-none">
                                    <Search className="h-4 w-4 text-brand-accent/30 dark:text-brand-cream/20 group-hover:text-brand-gold transition-colors" />
                                </div>
                                <div className="pl-12 pr-6 h-14 bg-white/40 dark:bg-white/5 border border-brand-accent/10 dark:border-white/10 rounded-2xl flex items-center text-brand-accent/40 dark:text-brand-cream/40 text-sm select-none w-full group-hover:border-brand-gold/30 transition-all">
                                    Search catalog or scan barcode... <span className="ml-auto text-[10px] font-black bg-brand-accent/5 dark:bg-white/5 px-2 py-1 rounded-lg border border-brand-accent/10">/</span>
                                </div>
                            </div>

                            {/* Mobile: Inline Search Input */}
                            <div className="relative flex lg:hidden items-center group">
                                <div className="absolute left-4 inset-y-0 flex items-center pointer-events-none">
                                    <Search className="h-4 w-4 text-brand-accent/40 dark:text-brand-cream/40 group-focus-within:text-brand-gold transition-colors" />
                                </div>
                                <input
                                    ref={mobileInputRef}
                                    type="text"
                                    placeholder="Search catalog or scan..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="w-full pl-12 pr-6 h-14 bg-white/40 dark:bg-white/5 border border-brand-accent/10 dark:border-white/10 rounded-2xl text-brand-deep dark:text-brand-cream text-sm placeholder:text-brand-accent/40 dark:placeholder:text-brand-cream/40 focus:outline-none focus:border-brand-gold/30 focus:ring-1 focus:ring-brand-gold/30 transition-all"
                                />
                            </div>
                        </div>
                        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none scroll-smooth w-full">
                            <Button
                                variant={!selectedCategory ? 'base' : 'outline'}
                                onClick={() => setSelectedCategory(null)}
                                className={cn(
                                    "rounded-2xl h-14 px-8 min-w-max transition-all duration-500",
                                    !selectedCategory && "bg-brand-deep dark:bg-brand-deep-800 border-brand-deep dark:border-brand-deep-800 text-brand-gold dark:hover:bg-brand-deep-700 shadow-sm"
                                )}
                            >
                                Catalog
                            </Button>
                            {categories.map((cat: string) => (
                                <Button
                                    key={cat}
                                    variant={selectedCategory === cat ? 'base' : 'outline'}
                                    onClick={() => setSelectedCategory(cat)}
                                    className={cn(
                                        "rounded-2xl h-14 px-8 min-w-max transition-all duration-500",
                                        selectedCategory === cat && "bg-brand-deep dark:bg-brand-deep-800 border-brand-deep dark:border-brand-deep-800 text-brand-gold dark:hover:bg-brand-deep-700 shadow-sm"
                                    )}
                                >
                                    {cat}
                                </Button>
                            ))}
                        </div>
                    </div>

                    {/* Product Area: Grid (Scrollable) + Pagination (Fixed) */}
                    <div className="flex-1 min-h-0 flex flex-col gap-4 lg:gap-6 mt-4 lg:mt-0">
                        <motion.div
                            key={String(`${selectedCategory}-${search}-${currentPage}-${products.length}`)}
                            variants={containerVariants}
                            initial="hidden"
                            animate="show"
                            className="flex-1 overflow-y-auto custom-scrollbar pr-1 lg:pr-2 -mr-1 lg:-mr-2 min-h-0"
                        >
                            <div className={cn(
                                "grid grid-cols-2 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4 lg:gap-6 pb-6",
                                cart.length > 0 && "pb-40 lg:pb-6"
                            )}>
                                <AnimatePresence mode="popLayout">
                                    {isLoadingProducts || !activeBusiness ? (
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
                                                <GlassCard
                                                    onClick={() => addToCart(product)}
                                                    hoverEffect
                                                    className={cn(
                                                        "group cursor-pointer flex flex-col h-[220px] relative overflow-hidden p-0 rounded-[32px] transition-none!",
                                                        product.image
                                                            ? "bg-brand-deep! border-none!"
                                                            : "bg-white! dark:bg-brand-deep-900! border! border-brand-gold/25! dark:border-white/10!"
                                                    )}
                                                >
                                                    {/* Immersive Background Image or Editorial Watermark */}
                                                    {product.image ? (
                                                        <div className="absolute inset-0 z-0">
                                                            <img
                                                                src={product.image}
                                                                alt={product.product}
                                                                className="h-full w-full object-cover transition-transform duration-1000 group-hover:scale-110"
                                                            />
                                                            {/* Top Protection Gradient */}
                                                            <div className="absolute inset-x-0 top-0 h-1/3 bg-linear-to-b from-brand-deep-900/80 via-brand-deep-800/40 to-transparent z-10 pointer-events-none" />

                                                            {/* Base Image Overlay */}
                                                            <div className="absolute inset-0 bg-brand-deep-900/20 z-10" />

                                                            {/* Bottom Protection Gradient */}
                                                            <div className="absolute inset-x-0 bottom-0 h-1/2 bg-linear-to-t from-brand-deep-900/90 via-brand-deep-900/50 to-transparent z-10 pointer-events-none backdrop-blur-[1px]" />
                                                        </div>
                                                    ) : (
                                                        <div className="absolute inset-0 z-0 opacity-[0.04] dark:opacity-[0.08] pointer-events-none overflow-hidden">
                                                            <div className="absolute -right-8 -bottom-8 scale-[2] rotate-[-15deg]">
                                                                <h4 className="font-serif text-8xl font-black select-none tracking-tighter">CLOOVE</h4>
                                                            </div>
                                                            <div className="absolute -left-4 top-1/4 scale-[1.5] rotate-10 opacity-50">
                                                                <h4 className="font-serif text-6xl font-black select-none tracking-tighter">EST 2024</h4>
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* Content Layer */}
                                                    <div className="relative z-20 flex flex-col h-full p-5 lg:p-6">
                                                        <div className="absolute top-4 right-4 lg:top-5 lg:right-5">
                                                            <div className={cn(
                                                                "w-2 h-2 rounded-full border-2 border-white/20 shadow-xl",
                                                                product.status === 'In Stock' ? "bg-emerald-500 shadow-emerald-500/40" : "bg-rose-500 shadow-rose-500/40"
                                                            )} />
                                                        </div>

                                                        <div className="space-y-4 flex flex-col h-full">
                                                            <div className="space-y-1">
                                                                <h3 className={cn(
                                                                    "font-serif text-xl lg:text-2xl leading-[1.15] transition-colors duration-500 line-clamp-2 min-h-[2.3em]",
                                                                    product.image
                                                                        ? "text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]"
                                                                        : "text-brand-deep dark:text-brand-cream"
                                                                )}>
                                                                    {product.product}
                                                                </h3>
                                                                <p className={cn(
                                                                    "text-[9px] font-bold uppercase tracking-[0.2em]",
                                                                    product.image
                                                                        ? "text-brand-cream opacity-80 drop-shadow-sm"
                                                                        : "text-brand-accent dark:text-brand-cream opacity-40"
                                                                )}>
                                                                    {product.status} • {product.stock} units
                                                                </p>
                                                            </div>

                                                            <div className={cn(
                                                                "flex items-center justify-between pt-4 border-t transition-colors duration-500 mt-auto",
                                                                product.image ? "border-white/20" : "border-brand-accent/5 dark:border-white/10"
                                                            )}>
                                                                <p className={cn(
                                                                    "font-serif font-black text-xl lg:text-2xl tracking-tight",
                                                                    product.image
                                                                        ? "text-brand-gold drop-shadow-md"
                                                                        : "text-brand-deep dark:text-brand-gold"
                                                                )}>
                                                                    {formatCurrency(product.price, { currency: activeBusiness?.currency || 'NGN' })}
                                                                </p>
                                                                <div className={cn(
                                                                    "h-10 w-10 rounded-2xl flex items-center justify-center transition-all duration-500 opacity-0 group-hover:opacity-100 scale-90 group-hover:scale-100 shadow-2xl",
                                                                    product.image
                                                                        ? "bg-brand-gold text-brand-deep shadow-brand-gold/20"
                                                                        : "bg-brand-deep dark:bg-brand-gold text-brand-gold dark:text-brand-deep shadow-xl"
                                                                )}>
                                                                    <Plus className="h-5 w-5" />
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Glass Overlay on Bottom for depth (only for images) */}
                                                    {product.image && (
                                                        <div className="absolute bottom-0 inset-x-0 h-2/5 bg-linear-to-t from-brand-deep via-brand-deep/40 to-transparent backdrop-blur-[1px] z-10 pointer-events-none" />
                                                    )}
                                                </GlassCard>
                                            </motion.div>
                                        ))
                                    )}
                                </AnimatePresence>
                            </div>
                        </motion.div>

                        {/* Pagination Controls - Fixed Bottom */}
                        {totalPages > 1 && (
                            <div className="flex items-center justify-center lg:justify-center gap-2 lg:gap-6 py-3 lg:py-4 border-t border-brand-accent/5 dark:border-white/5 bg-brand-cream/40 dark:bg-background backdrop-blur-sm rounded-2xl shrink-0 relative">
                                {/* Mobile Back Button */}
                                <div className="absolute left-2 lg:hidden">
                                    <Link href="/orders">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="rounded-xl h-10 w-10 hover:bg-brand-gold/10 transition-all duration-500"
                                        >
                                            <ArrowLeft className="h-5 w-5" />
                                        </Button>
                                    </Link>
                                </div>

                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                    disabled={currentPage === 1}
                                    className="rounded-xl px-2 lg:px-4 hover:bg-brand-gold/5 transition-all text-[10px] lg:text-xs font-bold uppercase tracking-widest h-10"
                                >
                                    <ChevronLeft className="h-4 w-4 lg:mr-2" />
                                    <span className="hidden lg:inline">Previous</span>
                                </Button>

                                <div className="flex items-center gap-1 lg:gap-2">
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
                                                    "w-10 h-10 rounded-xl font-bold transition-all duration-300",
                                                    currentPage === page
                                                        ? "bg-brand-deep dark:bg-brand-accent border-brand-deep dark:border-brand-accent text-brand-gold shadow-lg shadow-brand-deep/20"
                                                        : "text-brand-accent/40 dark:text-brand-cream/40 hover:text-brand-accent hover:bg-brand-accent/5"
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
                                    className="rounded-xl px-2 lg:px-4 hover:bg-brand-gold/5 transition-all text-[10px] lg:text-xs font-bold uppercase tracking-widest h-10"
                                >
                                    <span className="hidden lg:inline">Next</span>
                                    <ChevronRight className="h-4 w-4 lg:ml-2" />
                                </Button>
                            </div>
                        )}
                    </div>
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
                                        <p className="text-xs font-black leading-tight">{selectedCustomer.name.split(' ')[0]}</p>
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
                <div className="flex-1 overflow-y-auto p-4 lg:p-5 space-y-3 custom-scrollbar min-h-0">
                    <AnimatePresence mode="popLayout">
                        {cart.length === 0 ? (
                            <motion.div
                                key="empty-cart"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="h-full flex flex-col items-center justify-center text-center py-20"
                            >
                                <div className="mb-12 relative group">
                                    <div className="absolute inset-0 bg-brand-gold/20 blur-[60px] opacity-0 group-hover:opacity-100 transition-opacity duration-1000 rounded-full" />
                                    <GlassCard className="h-24 w-48 rounded-[48px] border-brand-gold/10 bg-white/5 dark:bg-white/2 flex items-center justify-center relative overflow-hidden group-hover:scale-[1.02] transition-transform duration-500">
                                        <div className="absolute inset-0 bg-linear-to-br from-brand-gold/5 to-transparent animate-float-slow" />
                                        <ShoppingCart className="h-10 w-10 text-brand-gold/40 relative z-10 group-hover:rotate-12 transition-transform duration-500" />
                                    </GlassCard>
                                </div>
                                <h4 className="font-serif text-2xl text-brand-deep/40 dark:text-brand-cream/40 mb-2">Cart is empty</h4>
                                <p className="text-sm text-brand-accent/40 dark:text-brand-cream/20 px-8">Select items from the catalog to begin recording this sale.</p>
                            </motion.div>
                        ) : (
                            cart.map((item) => (
                                <motion.div
                                    key={item.id}
                                    layout
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, x: 20 }}
                                    className="group"
                                >
                                    <GlassCard className="p-4 rounded-[20px] before:rounded-[20px] sm:rounded-3xl sm:before:rounded-3xl flex flex-col gap-3 bg-white/40 dark:bg-white/10 border-brand-accent/10 dark:border-white/5 group-hover:border-brand-gold/20 transition-all duration-300">
                                        <div className="flex gap-4 items-center min-w-0">
                                            {item.image && (
                                                <div className="h-12 w-12 rounded-xl overflow-hidden bg-brand-deep/5 dark:bg-white/5 shrink-0 border border-brand-accent/5 dark:border-white/5 relative">
                                                    <img
                                                        src={item.image}
                                                        alt={item.product}
                                                        className="h-full w-full object-cover"
                                                    />
                                                </div>
                                            )}
                                            <div className="min-w-0 flex-1">
                                                <h4 className="font-medium text-brand-deep dark:text-brand-cream truncate text-lg group-hover:text-brand-gold transition-colors">{item.product}</h4>
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between gap-4">
                                            <div className="flex items-center gap-2 min-w-0">
                                                <p className="font-bold text-brand-gold text-base tracking-tight shrink-0">₦{item.price.toLocaleString()}</p>
                                                {(item as any).category && (
                                                    <>
                                                        <div className="w-1 h-1 rounded-full bg-brand-accent/20 shrink-0" />
                                                        <p className="text-[10px] font-bold text-brand-accent/40 dark:text-brand-cream/30 uppercase tracking-widest truncate">{(item as any).category}</p>
                                                    </>
                                                )}
                                            </div>

                                            <div className="flex items-center gap-2">
                                                <div className="flex items-center gap-1.5 bg-brand-deep/5 dark:bg-white/5 rounded-xl p-0.5 border border-brand-accent/5 dark:border-white/5">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => updateQuantity(item.id, -1)}
                                                        className="h-7 w-7 flex items-center justify-center text-brand-accent/40 dark:text-brand-cream/40 hover:text-brand-gold hover:bg-brand-gold/10 rounded-md transition-all"
                                                    >
                                                        <Minus className="h-3 w-3" />
                                                    </Button>
                                                    <span className="w-6 text-center text-xs font-bold text-brand-deep dark:text-brand-cream tabular-nums">{item.quantity}</span>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => updateQuantity(item.id, 1)}
                                                        className="h-7 w-7 flex items-center justify-center text-brand-accent/40 dark:text-brand-cream/40 hover:text-brand-gold hover:bg-brand-gold/10 rounded-md transition-all"
                                                    >
                                                        <Plus className="h-3 w-3" />
                                                    </Button>
                                                </div>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => updateQuantity(item.id, -item.quantity)}
                                                    className="h-8 w-8 flex items-center justify-center text-rose-500/30 dark:text-rose-300/80 hover:text-rose-500 hover:bg-rose-500/10 rounded-xl transition-all"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    </GlassCard>
                                </motion.div>
                            ))
                        )}
                    </AnimatePresence>
                </div>

                {/* Billing Summary & Actions */}
                <div className="p-4 lg:p-5 bg-brand-gold/5 dark:bg-brand-gold/5 border-t border-brand-accent/10 dark:border-white/5 space-y-4 shrink-0">
                    {/* Adaptive Payment Selection */}
                    <div className="space-y-2.5">
                        <header className="flex justify-between items-center">
                            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-accent/40 dark:text-brand-cream/40">Settlement Method</p>
                            <div className="h-px flex-1 mx-4 bg-brand-accent/10 dark:bg-brand-gold/10" />
                        </header>
                        <div className="grid grid-cols-3 gap-3">
                            {[
                                { id: 'Cash', icon: Banknote },
                                { id: 'Transfer', icon: ArrowBigUpDash },
                                { id: 'POS', icon: CreditCard }
                            ].map((method) => (
                                <Button
                                    key={method.id}
                                    variant={paymentMethod === method.id ? 'default' : 'outline'}
                                    onClick={() => setPaymentMethod(method.id as any)}
                                    className={cn(
                                        "flex flex-col items-center gap-1 py-2 px-2 rounded-2xl border transition-all duration-500 h-auto",
                                        paymentMethod === method.id
                                            ? "bg-brand-deep dark:bg-brand-accent border-brand-deep dark:border-brand-accent text-brand-gold shadow-xl shadow-brand-deep/20 scale-[1.02]"
                                            : "bg-white/40 dark:bg-white/5 border-brand-accent/10 dark:border-white/5 text-brand-accent/40 dark:text-brand-cream/40 hover:border-brand-gold/50"
                                    )}
                                >
                                    <method.icon className={cn("h-5 w-5 transition-transform duration-500", paymentMethod === method.id && "scale-110")} />
                                    <span className="text-[10px] font-bold uppercase tracking-widest">{method.id}</span>
                                </Button>
                            ))}
                        </div>
                    </div>

                    {/* Breakdown */}
                    <div className="space-y-4 py-6 border-y border-brand-accent/10 dark:border-white/10">
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-brand-accent/60 dark:text-brand-cream/40 font-medium">Order Subtotal</span>
                            <div className="flex items-center gap-3">
                                <span className="text-brand-deep dark:text-brand-cream font-bold tabular-nums">
                                    {formatCurrency(subtotal, { currency: activeBusiness?.currency || 'NGN' })}
                                </span>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setShowExtras(!showExtras)}
                                    className={cn(
                                        "h-7 px-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
                                        showExtras
                                            ? "bg-brand-gold/10 text-brand-gold border border-brand-gold/20"
                                            : "text-brand-accent/40 dark:text-brand-cream/40 hover:text-brand-gold hover:bg-brand-gold/5"
                                    )}
                                >
                                    {showExtras ? "Hide Options" : "Add Options/Discount"}
                                    <ChevronDown className={cn("ml-1 h-3 w-3 transition-transform duration-300", showExtras && "rotate-180")} />
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
                                    <div className="space-y-4">
                                        {/* Discount Input & Promotions */}
                                        <div className="flex items-center justify-between text-sm gap-3 pt-2">
                                            <span className="text-brand-accent/60 dark:text-brand-cream/40 font-medium shrink-0">Discount</span>

                                            <div className="flex items-center justify-end gap-2 flex-1">
                                                {selectedPromotion !== 'none' ? (
                                                    <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 px-3 py-2 rounded-xl">
                                                        <span className="text-xs font-bold truncate max-w-[120px]">
                                                            {promotions?.find((p: any) => p.id === selectedPromotion)?.name || 'Promo'}
                                                        </span>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => {
                                                                setSelectedPromotion('none')
                                                                setDiscount(0)
                                                            }}
                                                            className="h-6 w-6 rounded-full hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors"
                                                            aria-label="Remove promotion"
                                                        >
                                                            <X className="w-3 h-3" />
                                                        </Button>
                                                    </div>
                                                ) : (
                                                    <div className="w-36">
                                                        <MoneyInput
                                                            size="sm"
                                                            value={discount || ''}
                                                            onChange={(val) => {
                                                                setDiscount(Math.min(val || 0, subtotal))
                                                                if (val > 0) setShowExtras(true)
                                                            }}
                                                            currencySymbol={currency}
                                                            className="border-brand-accent/10 dark:border-white/10 text-emerald-600 dark:text-brand-gold transition-colors"
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
                                                                const promo = promotions.find((p: any) => p.id === val)
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
                                                        <SelectTrigger className="w-10 h-10 shrink-0 px-0 justify-center border-brand-accent/10 dark:border-white/10 dark:bg-white/5 rounded-xl hover:bg-white/50 dark:hover:bg-white/10 transition-colors [&>svg:last-child]:hidden [&>span]:hidden" aria-label="Apply promotion">
                                                            <SelectValue placeholder="Promo" />
                                                            <Tag className="w-4 h-4 text-brand-accent/60 dark:text-brand-cream/60" />
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

                                        <div className="flex flex-col text-sm gap-2">
                                            <span className="text-brand-accent/60 dark:text-brand-cream/40 font-medium">Order Note</span>
                                            <Textarea
                                                value={note}
                                                onChange={(e) => setNote(e.target.value)}
                                                placeholder="Special instructions or remarks..."
                                                maxLength={120}
                                                rows={1}
                                                className="w-full bg-white/40 dark:bg-white/5 rounded-xl border border-brand-accent/10 dark:border-white/10 px-3 py-2 text-sm text-brand-deep dark:text-brand-cream placeholder:text-brand-accent/30 dark:placeholder:text-brand-cream/20 outline-none focus:border-brand-gold/40 transition-colors resize-none min-h-[44px]"
                                            />
                                        </div>

                                        {/* Amount Received (Cash only) */}
                                        {paymentMethod === 'Cash' && (
                                            <div className="flex items-center justify-between text-sm gap-3 pt-2">
                                                <span className="text-brand-accent/60 dark:text-brand-cream/40 font-medium shrink-0">Amount Received</span>
                                                <div className="flex-1 max-w-[180px]">
                                                    <MoneyInput
                                                        size="sm"
                                                        value={amountPaid === '' ? '' : amountPaid}
                                                        onChange={(val) => setAmountPaid(val === 0 ? '' : val)}
                                                        currencySymbol={currency}
                                                        placeholder={String(totalAfterDiscount)}
                                                        className="h-11 border-brand-accent/10 dark:border-white/10 text-brand-deep dark:text-brand-cream text-base"
                                                    />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <div className="flex justify-between items-center pt-4 border-t border-brand-accent/5 dark:border-white/5">
                            <span className="font-serif text-lg text-brand-deep dark:text-brand-gold">Total Payable</span>
                            <div className="text-right">
                                <span className="font-sans font-black text-2xl lg:text-3xl text-brand-deep dark:text-brand-gold tracking-tighter">
                                    {formatCurrency(totalAfterDiscount, { currency: activeBusiness?.currency || 'NGN' })}
                                </span>
                            </div>
                        </div>

                        {/* Change Due (Cash only) */}
                        {paymentMethod === 'Cash' && changeDue > 0 && (
                            <div className="flex justify-between items-center text-sm bg-emerald-500/10 dark:bg-emerald-500/5 rounded-2xl px-4 py-3 border border-emerald-500/20">
                                <span className="font-bold text-emerald-600 dark:text-emerald-400">Change Due</span>
                                <span className="font-black text-emerald-600 dark:text-emerald-400 tabular-nums text-lg">
                                    {formatCurrency(changeDue, { currency: activeBusiness?.currency || 'NGN' })}
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Pro Actions */}
                    <div className="flex flex-col gap-3">
                        <div className="grid grid-cols-2 gap-3">
                            <Button
                                variant="outline"
                                className="h-12 px-3 rounded-[14px] border-brand-accent/10 dark:border-white/10 text-brand-accent/60 dark:text-brand-cream/80 hover:bg-brand-gold/5 hover:text-brand-gold font-bold transition-all duration-500"
                                onClick={handlePrintReceipt}
                                disabled={cart.length === 0}
                            >
                                <ReceiptText className="h-4 w-4 mr-2" />
                                Print
                            </Button>
                            <Button
                                variant="outline"
                                className="h-12 px-3 rounded-[14px] border-brand-accent/10 dark:border-white/10 text-brand-accent/60 dark:text-brand-cream/80 hover:bg-brand-gold/5 hover:text-brand-gold font-bold transition-all duration-500"
                                onClick={handleQueueSale}
                                disabled={cart.length === 0}
                            >
                                <Layers className="h-4 w-4 mr-2" />
                                Queue
                            </Button>
                        </div>
                        <Button
                            className="h-14 px-3 rounded-[20px] bg-brand-deep dark:bg-brand-accent text-brand-gold font-serif font-black text-xl hover:scale-[1.01] shadow-xl active:scale-95 transition-all duration-500 border border-brand-gold/30 group relative overflow-hidden"
                            onClick={handleCheckout}
                            disabled={isRecording || cart.length === 0}
                        >
                            <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                            {isRecording ? (
                                <motion.div key="loader" animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }}>
                                    <ArrowRight className="h-7 w-7" />
                                </motion.div>
                            ) : (
                                <motion.span key="text" className="inline-flex items-center">
                                    Finalize Sale
                                    <CheckCircle2 className="h-6 w-6 ml-3" />
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
            `}</style>
        </div>
    )
}
