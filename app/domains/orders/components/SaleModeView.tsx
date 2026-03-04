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
    User,
    UserPlus,
    X,
    ArrowBigUpDash
} from 'lucide-react'
import { GlassCard } from '@/app/components/ui/glass-card'
import { Button } from '@/app/components/ui/button'
import { Input } from '@/app/components/ui/input'
import { cn } from '@/app/lib/utils'
import { initialInventory } from '../data/inventoryMocks'
import { mockCustomers, Customer } from '../data/customerMocks'
import { toast } from 'sonner'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface CartItem {
    id: string
    product: string
    price: number
    quantity: number
}

// Stagger variants for the container
const containerVariants: Variants = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: {
            staggerChildren: 0.05
        }
    }
}

const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    show: {
        opacity: 1,
        y: 0,
        transition: {
            type: "spring",
            stiffness: 300,
            damping: 24
        }
    }
}

export function SaleModeView() {
    const router = useRouter()
    const [search, setSearch] = React.useState("")
    const [selectedCategory, setSelectedCategory] = React.useState<string | null>(null)
    const [cart, setCart] = React.useState<CartItem[]>([])
    const [paymentMethod, setPaymentMethod] = React.useState<'Cash' | 'Transfer' | 'Card'>('Cash')
    const [isCheckingOut, setIsCheckingOut] = React.useState(false)
    const [allCustomers, setAllCustomers] = React.useState<Customer[]>(mockCustomers)
    const [selectedCustomer, setSelectedCustomer] = React.useState<Customer | null>(null)
    const [customerSearch, setCustomerSearch] = React.useState("")
    const [isCustomerSearchOpen, setIsCustomerSearchOpen] = React.useState(false)
    const customerDropdownRef = React.useRef<HTMLDivElement>(null)
    const [currentPage, setCurrentPage] = React.useState(1)
    const itemsPerPage = 8

    // Derived State
    const categories = Array.from(new Set(initialInventory.map(item => item.category)))

    const filteredProducts = initialInventory.filter(p => {
        const matchesSearch = p.product.toLowerCase().includes(search.toLowerCase()) ||
            (p.barcode && p.barcode.includes(search))
        const matchesCategory = !selectedCategory || p.category === selectedCategory
        return matchesSearch && matchesCategory
    })

    const totalPages = Math.ceil(filteredProducts.length / itemsPerPage)
    const paginatedProducts = filteredProducts.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    )

    const subtotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0)
    const totalItems = cart.reduce((acc, item) => acc + item.quantity, 0)

    // Barcode Auto-Add Logic
    React.useEffect(() => {
        if (search.length >= 8) { // Typical minimum barcode length
            const exactMatch = initialInventory.find(p => p.barcode === search)
            if (exactMatch) {
                addToCart(exactMatch)
                setSearch("")
                toast.success(`Added ${exactMatch.product} via scan`, {
                    icon: <Barcode className="h-4 w-4" />,
                    duration: 1500
                })
            }
        }
    }, [search])

    // Reset to page 1 when search or category changes
    React.useEffect(() => {
        setCurrentPage(1)
    }, [search, selectedCategory])

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
        const price = parseInt(product.price.replace(/[^0-9]/g, ''))
        setCart(prev => {
            const existing = prev.find(item => item.id === product.id)
            if (existing) {
                return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item)
            }
            return [...prev, { id: product.id, product: product.product, price, quantity: 1 }]
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

    const handleCheckout = () => {
        if (cart.length === 0) {
            toast.error("Cart is empty")
            return
        }
        setIsCheckingOut(true)
        setTimeout(() => {
            toast.success("Sale recorded successfully!")
            setCart([])
            setIsCheckingOut(false)
            router.push('/orders')
        }, 2000)
    }

    return (
        <div className="fixed inset-0 z-50 flex flex-col md:flex-row overflow-hidden theme-transition bg-brand-cream dark:bg-brand-deep">
            {/* Background Decorative Elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10 opacity-40 dark:opacity-20">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-brand-gold/10 blur-[120px] animate-float-slow" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-brand-green/20 dark:bg-brand-gold/5 blur-[120px] animate-float-slower" />
            </div>

            {/* Left Side: Product Catalog */}
            <div className="flex-1 flex flex-col min-w-0 p-4 md:p-8 space-y-8 relative z-10">
                <header className="flex items-center justify-between">
                    <div className="flex items-center gap-6">
                        <Link href="/orders">
                            <Button
                                variant="outline"
                                size="icon"
                                className="rounded-2xl h-12 w-12 group hover:bg-brand-gold/10 transition-all duration-500"
                            >
                                <ArrowLeft className="h-5 w-5 group-hover:-translate-x-1 transition-transform" />
                            </Button>
                        </Link>
                        <div>
                            <h2 className="text-4xl font-serif text-brand-deep dark:text-brand-cream tracking-tighter">Sale Mode</h2>
                            <p className="text-brand-accent/60 dark:text-brand-cream/40 text-sm font-sans">Point of Sale & Catalog Management</p>
                        </div>
                    </div>
                </header>

                {/* Filters & Search */}
                <div className="flex flex-col md:flex-row gap-4 items-start">
                    <div className="relative flex-2 w-full md:w-auto min-w-[320px] group flex items-center">
                        <div className="absolute left-4 inset-y-0 flex items-center pointer-events-none">
                            <Search className="h-4 w-4 text-brand-accent/30 dark:text-brand-cream/20 group-focus-within:text-brand-gold transition-colors" />
                        </div>
                        <Input
                            placeholder="Search catalog or scan barcode..."
                            className="pl-12 pr-12 h-14 bg-white/40 dark:bg-white/5 border-brand-accent/10 dark:border-white/10 rounded-2xl focus:ring-2 focus:ring-brand-gold/20 w-full"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            autoFocus
                        />
                        <Button
                            variant="ghost"
                            className="absolute right-2 top-2 bottom-2 flex items-center gap-2 px-3 rounded-[14px] transition-all z-30 pointer-events-auto cursor-pointer group/scan hover:bg-brand-gold/10 dark:hover:bg-white/5 active:scale-95 h-auto"
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                toast.info("Barcode scanner protocol active...")
                            }}
                        >
                            <div className="h-6 w-px bg-brand-accent/10 dark:bg-white/10 mx-1" />
                            <Barcode className="h-5 w-5 text-brand-gold/60 group-hover/scan:text-brand-gold group-hover/scan:scale-110 transition-all animate-pulse" />
                        </Button>
                    </div>
                    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none scroll-smooth">
                        <Button
                            variant={!selectedCategory ? 'base' : 'outline'}
                            onClick={() => setSelectedCategory(null)}
                            className={cn(
                                "rounded-2xl h-14 px-8 min-w-max transition-all duration-500",
                                !selectedCategory && "bg-brand-deep dark:bg-brand-accent border-brand-deep dark:border-brand-accent text-brand-gold shadow-sm"
                            )}
                        >
                            Catalog
                        </Button>
                        {categories.map(cat => (
                            <Button
                                key={cat}
                                variant={selectedCategory === cat ? 'base' : 'outline'}
                                onClick={() => setSelectedCategory(cat)}
                                className={cn(
                                    "rounded-2xl h-14 px-8 min-w-max transition-all duration-500",
                                    selectedCategory === cat && "bg-brand-deep dark:bg-brand-accent border-brand-deep dark:border-brand-accent text-brand-gold shadow-sm"
                                )}
                            >
                                {cat}
                            </Button>
                        ))}
                    </div>
                </div>

                {/* Product Area: Grid (Scrollable) + Pagination (Fixed) */}
                <div className="flex-1 min-h-0 flex flex-col gap-6">
                    <motion.div
                        key={`${selectedCategory}-${search}-${currentPage}`}
                        variants={containerVariants}
                        initial="hidden"
                        animate="show"
                        className="flex-1 overflow-y-auto pr-2 custom-scrollbar"
                    >
                        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-6 pt-3">
                            {paginatedProducts.map((product) => (
                                <motion.div key={product.id} variants={itemVariants}>
                                    <GlassCard
                                        onClick={() => addToCart(product)}
                                        hoverEffect
                                        className="p-5 cursor-pointer group flex flex-col h-full bg-white/40 dark:bg-white/3 border-brand-accent/5 dark:border-white/5"
                                    >
                                        <div className="flex-1 space-y-4">
                                            <div className="flex justify-between items-start">
                                                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-gold/80">{product.category}</span>
                                                <div className={cn(
                                                    "w-2 h-2 rounded-full",
                                                    product.status === 'In Stock' ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" : "bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]"
                                                )} />
                                            </div>
                                            <div className="space-y-1">
                                                <h3 className="font-serif text-xl leading-tight text-brand-deep dark:text-brand-cream group-hover:text-brand-gold transition-colors duration-300">{product.product}</h3>
                                                <p className="text-[10px] font-medium text-brand-accent/40 dark:text-brand-cream/30 uppercase tracking-widest">{product.status} • {product.stock} units</p>
                                            </div>
                                        </div>
                                        <div className="mt-6 flex items-center justify-between pt-4 border-t border-brand-accent/5 dark:border-white/5">
                                            <p className="font-sans font-bold text-xl text-brand-gold tracking-tight">{product.price}</p>
                                            <div className="h-10 w-10 rounded-2xl bg-brand-gold/10 flex items-center justify-center text-brand-gold opacity-0 group-hover:opacity-100 group-hover:scale-110 transition-all duration-300 shadow-xl shadow-brand-gold/10">
                                                <Plus className="h-5 w-5" />
                                            </div>
                                        </div>
                                    </GlassCard>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>

                    {/* Pagination Controls - Fixed Bottom */}
                    {totalPages > 1 && (
                        <div className="flex items-center justify-center gap-6 py-4 border-t border-brand-accent/5 dark:border-white/5 bg-brand-cream/40 dark:bg-brand-deep/40 backdrop-blur-sm rounded-2xl">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                disabled={currentPage === 1}
                                className="rounded-xl px-4 hover:bg-brand-gold/5 transition-all text-xs font-bold uppercase tracking-widest"
                            >
                                <ChevronLeft className="h-4 w-4 mr-2" />
                                Previous
                            </Button>

                            <div className="flex items-center gap-2">
                                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                                    <Button
                                        key={page}
                                        variant={currentPage === page ? 'default' : 'ghost'}
                                        size="sm"
                                        onClick={() => setCurrentPage(page)}
                                        className={cn(
                                            "w-10 h-10 rounded-xl font-bold transition-all duration-300",
                                            currentPage === page
                                                ? "bg-brand-deep dark:bg-brand-accent text-brand-gold shadow-lg shadow-brand-deep/20"
                                                : "text-brand-accent/40 dark:text-brand-cream/40 hover:text-brand-accent hover:bg-brand-accent/5"
                                        )}
                                    >
                                        {page}
                                    </Button>
                                ))}
                            </div>

                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                disabled={currentPage === totalPages}
                                className="rounded-xl px-4 hover:bg-brand-gold/5 transition-all text-xs font-bold uppercase tracking-widest"
                            >
                                Next
                                <ChevronRight className="h-4 w-4 ml-2" />
                            </Button>
                        </div>
                    )}
                </div>
            </div>

            {/* Right Side: Cart & Checkout Summary */}
            <div className="w-full md:w-[420px] lg:w-[480px] bg-white/60 dark:bg-brand-deep/80 backdrop-blur-3xl flex flex-col border-l border-brand-accent/10 dark:border-white/5 shadow-2xl relative z-20">
                <div className="p-6 border-b border-brand-accent/10 dark:border-white/5 flex flex-col gap-4 bg-brand-gold/5 dark:bg-brand-gold/5 relative">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="h-12 w-12 rounded-[16px] bg-brand-deep dark:bg-brand-accent flex items-center justify-center text-brand-gold shadow-lg shadow-brand-deep/20">
                                <ShoppingCart className="h-5 w-5" />
                            </div>
                            <div>
                                <h3 className="font-serif text-2xl text-brand-deep dark:text-brand-cream tracking-tight">Active Order</h3>
                                <p className="text-[10px] uppercase tracking-[0.2em] text-brand-accent/40 dark:text-brand-cream/40 font-bold">{totalItems} Positions Selected</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            {selectedCustomer ? (
                                <Button
                                    variant="ghost"
                                    onClick={() => setIsCustomerSearchOpen(!isCustomerSearchOpen)}
                                    className="h-12 rounded-2xl bg-brand-accent/10 dark:bg-brand-accent/20 text-brand-accent dark:text-brand-cream hover:bg-brand-accent/20 border border-brand-accent/10 dark:border-white/10 transition-all flex items-center gap-3"
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
                                    className="h-12 w-12 rounded-xl text-brand-accent/40 dark:text-brand-cream/40 hover:text-brand-accent hover:bg-brand-accent/10 transition-all"
                                >
                                    <User className="h-5 w-5" />
                                </Button>
                            )}
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
                                className="absolute top-0 left-0 right-0 z-50 p-6 pt-8 pb-10 bg-white/95 dark:bg-brand-deep/95 backdrop-blur-2xl flex flex-col gap-5 rounded-b-[40px] shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)] border-b border-brand-accent/20 dark:border-white/10"
                            >
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-3">
                                        <div className="h-8 w-8 rounded-full bg-brand-accent/10 flex items-center justify-center text-brand-accent">
                                            <User className="h-4 w-4" />
                                        </div>
                                        <h4 className="font-serif text-2xl text-brand-deep dark:text-brand-cream tracking-tight">Client Search</h4>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => setIsCustomerSearchOpen(false)}
                                        className="h-10 w-10 rounded-xl bg-brand-accent/5 hover:bg-rose-500/10 hover:text-rose-500 transition-all"
                                    >
                                        <X className="h-5 w-5" />
                                    </Button>
                                </div>

                                <div className="relative group px-0.5">
                                    <div className="absolute left-4 inset-y-0 flex items-center pointer-events-none">
                                        <Search className="h-5 w-5 text-brand-accent/40 group-focus-within:text-brand-accent transition-colors" />
                                    </div>
                                    <Input
                                        autoFocus
                                        placeholder="Type name, phone or email..."
                                        value={customerSearch}
                                        onChange={(e) => setCustomerSearch(e.target.value)}
                                        className="pl-14 h-16 text-lg bg-brand-deep/5 dark:bg-white/5 border-brand-accent/10 dark:border-white/10 rounded-2xl focus:ring-brand-accent/30 focus:border-brand-accent/20 transition-all"
                                    />
                                </div>

                                <div className="flex-1 overflow-y-auto custom-scrollbar -mx-2 px-2">
                                    <div className="space-y-1">
                                        {/* Filtered Customers */}
                                        {allCustomers
                                            .filter(c => c.name.toLowerCase().includes(customerSearch.toLowerCase()) || c.phone.includes(customerSearch))
                                            .map(customer => (
                                                <Button
                                                    key={customer.id}
                                                    variant="ghost"
                                                    onClick={() => {
                                                        setSelectedCustomer(customer)
                                                        setIsCustomerSearchOpen(false)
                                                        setCustomerSearch("")
                                                        toast.success(`Client ${customer.name} attached`)
                                                    }}
                                                    className="w-full p-4 h-auto text-left hover:bg-brand-accent/5 justify-start transition-colors rounded-2xl group border border-transparent hover:border-brand-accent/10"
                                                >
                                                    <div className="flex items-center justify-between w-full">
                                                        <div>
                                                            <h4 className="font-bold text-brand-deep dark:text-brand-cream group-hover:text-brand-accent transition-colors">{customer.name}</h4>
                                                            <p className="text-xs text-brand-accent/40 dark:text-brand-cream/30">{customer.phone} • {customer.type}</p>
                                                        </div>
                                                        <div className="flex items-center gap-3">
                                                            {customer.recentPurchases && (
                                                                <span className="text-[10px] font-bold text-brand-gold bg-brand-gold/10 px-2 py-0.5 rounded-full">{customer.recentPurchases} orders</span>
                                                            )}
                                                            <ChevronRight className="h-4 w-4 opacity-0 group-hover:opacity-40 transition-opacity" />
                                                        </div>
                                                    </div>
                                                </Button>
                                            ))}

                                        {/* Quick Create Option */}
                                        {customerSearch.length > 2 && !allCustomers.some(c => c.name.toLowerCase() === customerSearch.toLowerCase()) && (
                                            <Button
                                                variant="outline"
                                                onClick={() => {
                                                    const newCustomer: Customer = {
                                                        id: `new-${Date.now()}`,
                                                        name: customerSearch,
                                                        phone: "0800-PENDING",
                                                        type: 'Walk-in'
                                                    }
                                                    setAllCustomers(prev => [newCustomer, ...prev])
                                                    setSelectedCustomer(newCustomer)
                                                    setIsCustomerSearchOpen(false)
                                                    setCustomerSearch("")
                                                    toast.success(`New customer "${customerSearch}" created`)
                                                }}
                                                className="w-full p-4 h-auto text-left border-dashed border-brand-accent/30 hover:border-brand-accent bg-brand-accent/5 hover:bg-brand-accent/10 group rounded-2xl transition-all"
                                            >
                                                <div className="flex items-center gap-4">
                                                    <div className="h-10 w-10 rounded-xl bg-brand-accent/20 flex items-center justify-center text-brand-accent">
                                                        <UserPlus className="h-5 w-5" />
                                                    </div>
                                                    <div>
                                                        <p className="text-xs font-bold text-brand-accent">Add as new customer</p>
                                                        <h4 className="font-black text-brand-deep dark:text-brand-cream">{customerSearch}</h4>
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
                <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
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
                                    <GlassCard className="p-5 flex items-center gap-5 bg-white/40 dark:bg-white/5 border-brand-accent/5 dark:border-white/5 group-hover:border-brand-gold/20 transition-all duration-300">
                                        <div className="flex-1 min-w-0">
                                            <h4 className="font-medium text-brand-deep dark:text-brand-cream truncate text-lg group-hover:text-brand-gold transition-colors">{item.product}</h4>
                                            <p className="text-sm font-bold text-brand-gold tracking-tight">₦{item.price.toLocaleString()}</p>
                                        </div>
                                        <div className="flex items-center gap-3 bg-brand-deep/5 dark:bg-white/5 rounded-2xl p-1 border border-brand-accent/5 dark:border-white/5">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => updateQuantity(item.id, -1)}
                                                className="h-10 w-10 flex items-center justify-center text-brand-accent/40 dark:text-brand-cream/40 hover:text-brand-gold hover:bg-brand-gold/10 rounded-xl transition-all"
                                            >
                                                <Minus className="h-4 w-4" />
                                            </Button>
                                            <span className="w-10 text-center text-base font-bold text-brand-deep dark:text-brand-cream tabular-nums">{item.quantity}</span>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => updateQuantity(item.id, 1)}
                                                className="h-10 w-10 flex items-center justify-center text-brand-accent/40 dark:text-brand-cream/40 hover:text-brand-gold hover:bg-brand-gold/10 rounded-xl transition-all"
                                            >
                                                <Plus className="h-4 w-4" />
                                            </Button>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => updateQuantity(item.id, -item.quantity)}
                                            className="h-12 w-12 flex items-center justify-center text-rose-500/30 hover:text-rose-500 hover:bg-rose-500/10 rounded-2xl transition-all group-hover:bg-rose-500/5"
                                        >
                                            <Trash2 className="h-5 w-5" />
                                        </Button>
                                    </GlassCard>
                                </motion.div>
                            ))
                        )}
                    </AnimatePresence>
                </div>

                {/* Billing Summary & Actions */}
                <div className="p-6 bg-brand-gold/5 dark:bg-brand-gold/5 border-t border-brand-accent/10 dark:border-white/5 space-y-6">
                    {/* Adaptive Payment Selection */}
                    <div className="space-y-3">
                        <header className="flex justify-between items-center px-1">
                            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-accent/40 dark:text-brand-cream/40">Settlement Method</p>
                            <div className="h-px flex-1 mx-4 bg-brand-accent/10 dark:bg-brand-gold/10" />
                        </header>
                        <div className="grid grid-cols-3 gap-3">
                            {[
                                { id: 'Cash', icon: Banknote },
                                { id: 'Transfer', icon: ArrowBigUpDash },
                                { id: 'Card', icon: CreditCard }
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
                    <div className="space-y-3 py-4 border-y border-brand-accent/10 dark:border-white/10">
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-brand-accent/60 dark:text-brand-cream/40 font-medium">Order Subtotal</span>
                            <span className="text-brand-deep dark:text-brand-cream font-bold tabular-nums">₦{subtotal.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-brand-accent/60 dark:text-brand-cream/40 font-medium">Applied Discounts</span>
                            <span className="text-emerald-600 dark:text-brand-gold font-bold">₦0.00</span>
                        </div>
                        <div className="flex justify-between items-center pt-3 border-t border-brand-accent/5 dark:border-white/5">
                            <span className="font-serif text-xl text-brand-deep dark:text-brand-gold">Total Amount</span>
                            <div className="text-right">
                                <span className="font-sans font-black text-3xl text-brand-deep dark:text-brand-gold tracking-tighter">₦{subtotal.toLocaleString()}</span>
                            </div>
                        </div>
                    </div>

                    {/* Pro Actions */}
                    <div className="grid grid-cols-2 gap-4">
                        <Button
                            variant="outline"
                            className="h-14 px-3 rounded-2xl border-brand-accent/10 dark:border-white/10 text-brand-accent/60 dark:text-brand-cream/80 hover:bg-brand-gold/5 hover:text-brand-gold font-bold transition-all duration-500"
                            onClick={() => toast.info("Initializing receipt printer protocol...")}
                        >
                            <ReceiptText className="h-5 w-5 mr-3" />
                            Print
                        </Button>
                        <Button
                            className="h-14 px-3 rounded-2xl bg-brand-deep dark:bg-brand-accent text-brand-gold font-bold text-xl hover:scale-[1.01] shadow-md active:scale-95 transition-all duration-500 border border-brand-gold/20"
                            onClick={handleCheckout}
                            disabled={isCheckingOut || cart.length === 0}
                        >
                            {isCheckingOut ? (
                                <motion.div key="loader" animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }}>
                                    <ArrowRight className="h-7 w-7" />
                                </motion.div>
                            ) : (
                                <motion.span key="text" className="inline-flex items-center">
                                    Finalize
                                    <CheckCircle2 className="h-6 w-6 ml-3" />
                                </motion.span>
                            )}
                        </Button>
                    </div>
                </div>
            </div>

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
