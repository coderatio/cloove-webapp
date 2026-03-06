"use client"

import React from "react"
import {
    Drawer,
    DrawerContent,
    DrawerStickyHeader,
    DrawerTitle,
    DrawerClose,
} from "@/app/components/ui/drawer"
import { GlassCard } from "@/app/components/ui/glass-card"
import { Button } from "@/app/components/ui/button"
import { Badge } from "@/app/components/ui/badge"
import {
    Phone,
    MessageSquare,
    Mail,
    ShoppingBag,
    TrendingUp,
    ShieldAlert,
    Loader2,
    Crown,
    Star,
    History,
    Sparkles,
    Activity,
    ChevronRight,
} from "lucide-react"
import { type Customer, useCustomerTransactions } from "../hooks/useCustomers"
import { useBusiness } from "@/app/components/BusinessProvider"
import { type Order } from "../../orders/types"
import { formatCompactCurrency, formatDate } from "@/app/lib/formatters"
import { cn } from "@/app/lib/utils"
import { OrderDetailsDrawer } from "../../orders/components/OrderDetailsDrawer"
import { CustomerLedgerDrawer } from "./CustomerLedgerDrawer"
import { CustomerTransactionListItem } from "./CustomerTransactionListItem"
import { useOrders } from "../../orders/hooks/useOrders"
import { useReceiptPrinter } from "@/app/hooks/useReceiptPrinter"
import { format } from "date-fns"

interface CustomerProfileDrawerProps {
    customer: Customer | null
    open: boolean
    onOpenChange: (open: boolean) => void
    onEdit: (customer: Customer) => void
    onUpdateVip?: (id: string, isVip: boolean) => Promise<void>
}

export function CustomerProfileDrawer({
    customer,
    open,
    onOpenChange,
    onEdit,
    onUpdateVip
}: CustomerProfileDrawerProps) {
    const { activeBusiness } = useBusiness()
    const { data: txResponse, isLoading: isLoadingTx } = useCustomerTransactions(customer?.id || "")
    const { updateOrder, isUpdating: isUpdatingTx, deleteOrder, isDeleting: isDeletingTx } = useOrders(1, 10, { customerId: customer?.id })
    const { printReceipt } = useReceiptPrinter()

    const [viewingOrder, setViewingOrder] = React.useState<Order | null>(null)
    const [isLedgerOpen, setIsLedgerOpen] = React.useState(false)

    const currencyCode = activeBusiness?.currency || 'NGN'

    if (!customer) return null

    const hasDebt = customer.owing !== "—"
    const whatsappUrl = customer.phoneNumber
        ? `https://wa.me/${customer.phoneNumber.replace(/[^0-9]/g, "")}`
        : null

    return (
        <Drawer open={open} onOpenChange={onOpenChange}>
            <DrawerContent>
                <DrawerStickyHeader>
                    <div className="flex items-center justify-between">
                        <div className="space-y-1">
                            <DrawerTitle className="text-2xl font-serif">
                                {customer.name}
                            </DrawerTitle>
                            <div className="flex items-center gap-2">
                                {customer.isVip && (
                                    <Badge className="bg-brand-gold/10 text-brand-gold border-brand-gold/20 flex items-center gap-1.5 uppercase text-[10px] tracking-widest font-bold px-2.5 py-1">
                                        <Crown className="w-3 h-3 fill-brand-gold/20" />
                                        VIP
                                    </Badge>
                                )}
                                {customer.isBlacklisted && (
                                    <Badge variant="destructive" className="uppercase text-[10px] tracking-widest font-bold">
                                        Blacklisted
                                    </Badge>
                                )}
                                <Badge variant="outline" className="text-[10px] tracking-widest font-bold uppercase py-1 border-brand-deep/5 dark:border-white/10">
                                    Member since {formatDate(customer.joinedAt)}
                                </Badge>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                className={cn(
                                    "rounded-xl h-9 px-4 gap-2 border-brand-deep/5 transition-all duration-300",
                                    customer.isVip
                                        ? "text-brand-accent border-brand-accent/20 bg-brand-accent/5 hover:bg-brand-accent/10 dark:text-brand-cream/60"
                                        : "text-brand-gold border-brand-gold/20 bg-brand-gold/5 hover:bg-brand-gold/10"
                                )}
                                onClick={() => onUpdateVip?.(customer.id, !customer.isVip)}
                            >
                                <Star className={cn("w-3.5 h-3.5", customer.isVip ? "text-brand-accent fill-brand-accent/20 dark:text-brand-cream/60 dark:hover:text-brand-gold" : "text-brand-gold")} />
                                {customer.isVip ? "Remove VIP" : "Make VIP"}
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                className="rounded-xl h-9 px-4 border-brand-deep/5"
                                onClick={() => onEdit(customer)}
                            >
                                Edit
                            </Button>
                        </div>
                    </div>
                </DrawerStickyHeader>

                <div className="p-6 md:p-8 space-y-8 overflow-y-auto max-h-[75vh]">
                    {/* Quick Stats Grid - Academic Luxury Overhaul */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                        <GlassCard className="p-6 flex flex-col gap-3 border-none bg-brand-deep/5 dark:bg-white/5 relative overflow-hidden group rounded-3xl before:rounded-3xl">
                            <div className="absolute -right-2 -top-2 opacity-10 group-hover:opacity-20 transition-opacity transform rotate-12">
                                <ShoppingBag className="w-20 h-20 text-brand-deep/10 dark:text-white/10" />
                            </div>
                            <span className="text-[10px] font-bold text-brand-accent/40 dark:text-brand-cream/40 uppercase tracking-[0.2em]">
                                Total Orders
                            </span>
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-2xl bg-brand-green/10 dark:bg-emerald-500/10 flex items-center justify-center text-brand-green dark:text-emerald-400">
                                    <ShoppingBag className="w-5 h-5" />
                                </div>
                                <span className="text-2xl font-serif font-medium text-brand-deep dark:text-brand-cream">{customer.orders}</span>
                            </div>
                        </GlassCard>

                        <GlassCard className="p-6 flex flex-col gap-3 border-none bg-brand-deep/5 dark:bg-white/5 relative overflow-hidden group rounded-3xl before:rounded-3xl">
                            <div className="absolute -right-2 -top-2 opacity-10 group-hover:opacity-20 transition-opacity transform -rotate-12">
                                <TrendingUp className="w-20 h-20 text-brand-gold/10" />
                            </div>
                            <span className="text-[10px] font-bold text-brand-accent/40 dark:text-brand-cream/40 uppercase tracking-[0.2em]">
                                Lifetime Spend
                            </span>
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-2xl bg-brand-gold/10 flex items-center justify-center text-brand-gold">
                                    <TrendingUp className="w-5 h-5" />
                                </div>
                                <span className="text-2xl font-serif font-medium text-brand-deep dark:text-brand-cream">
                                    {formatCompactCurrency(customer.totalSpent, { currency: currencyCode })}
                                </span>
                            </div>
                        </GlassCard>

                        <GlassCard className={cn(
                            "p-6 flex flex-col gap-3 border-none relative overflow-hidden group transition-all duration-500 rounded-3xl before:rounded-3xl",
                            hasDebt
                                ? "bg-rose-500/4 border border-rose-500/10 shadow-[0_0_30px_rgba(239,68,68,0.05)]"
                                : "bg-brand-deep/3 dark:bg-white/3"
                        )}>
                            <div className="absolute -right-2 -top-2 opacity-5 group-hover:opacity-10 transition-opacity transform rotate-12">
                                <ShieldAlert className={cn("w-20 h-20", hasDebt ? "text-rose-500/10" : "text-brand-accent/5")} />
                            </div>
                            <span className={cn(
                                "text-[10px] font-bold uppercase tracking-[0.2em]",
                                hasDebt ? "text-rose-500/60" : "text-brand-accent/40 dark:text-brand-cream/40"
                            )}>
                                Outstanding Debt
                            </span>
                            <div className="flex items-center gap-3">
                                <div className={cn(
                                    "h-10 w-10 rounded-2xl flex items-center justify-center transition-colors",
                                    hasDebt ? "bg-rose-500/10 text-rose-500 dark:text-rose-400" : "bg-brand-accent/10 dark:bg-white/5 text-brand-accent/40 dark:text-brand-cream/40"
                                )}>
                                    <ShieldAlert className="w-5 h-5" />
                                </div>
                                <span className={cn(
                                    "text-2xl font-serif font-medium transition-colors",
                                    hasDebt ? "text-rose-500" : "text-brand-deep/40 dark:text-brand-cream/40"
                                )}>
                                    {customer.owing !== "—" ? formatCompactCurrency(customer.owing, { currency: currencyCode }) : customer.owing}
                                </span>
                            </div>
                        </GlassCard>
                    </div>

                    {/* Contact Actions */}
                    <div className={cn(
                        "space-y-4",
                        !customer.phoneNumber && !customer.email && "hidden"
                    )}>
                        <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-accent/40 dark:text-brand-cream/40 ml-1">
                            Connect & Communicate
                        </h4>
                        <GlassCard className="p-0 border-brand-deep/5 dark:border-white/5 overflow-hidden">
                            <div className="flex flex-col divide-y divide-brand-deep/5 dark:divide-white/5">
                                {customer.phoneNumber && (
                                    <>
                                        <Button
                                            variant="ghost"
                                            className="h-16 rounded-none justify-start gap-4 px-6 hover:bg-brand-deep/2 dark:hover:bg-white/2 group"
                                            asChild
                                        >
                                            <a href={`tel:${customer.phoneNumber}`} className="w-full flex items-center gap-4">
                                                <div className="h-9 w-9 rounded-full bg-brand-green/10 dark:bg-emerald-500/10 flex items-center justify-center text-brand-green dark:text-emerald-400 group-hover:bg-brand-green group-hover:text-white transition-all">
                                                    <Phone className="w-4.5 h-4.5" />
                                                </div>
                                                <div className="flex flex-col items-start flex-1">
                                                    <span className="text-xs font-bold uppercase tracking-wider text-brand-deep dark:text-brand-cream">Call Customer</span>
                                                    <span className="text-[10px] text-brand-accent/60 dark:text-brand-cream/60">{customer.phoneNumber}</span>
                                                </div>
                                                <ChevronRight className="w-4 h-4 text-brand-accent/20 dark:text-brand-cream/20 group-hover:translate-x-0.5 transition-transform" />
                                            </a>
                                        </Button>

                                        {whatsappUrl && (
                                            <Button
                                                variant="ghost"
                                                className="h-16 rounded-none justify-start gap-4 px-6 hover:bg-brand-green/2 dark:hover:bg-brand-green/10 group"
                                                asChild
                                            >
                                                <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="w-full flex items-center gap-4">
                                                    <div className="h-9 w-9 rounded-full bg-brand-green/10 dark:bg-emerald-500/10 flex items-center justify-center text-brand-green dark:text-emerald-400 group-hover:bg-brand-green group-hover:text-white transition-all">
                                                        <MessageSquare className="w-4.5 h-4.5" />
                                                    </div>
                                                    <div className="flex flex-col items-start flex-1">
                                                        <span className="text-xs font-bold uppercase tracking-wider text-brand-green dark:text-emerald-400">WhatsApp Chat</span>
                                                        <span className="text-[10px] text-brand-green/60 dark:text-emerald-400/60 uppercase tracking-tighter font-medium">Fastest response</span>
                                                    </div>
                                                    <ChevronRight className="w-4 h-4 text-brand-green/20 dark:text-emerald-400/20 group-hover:translate-x-0.5 transition-transform" />
                                                </a>
                                            </Button>
                                        )}
                                    </>
                                )}

                                {customer.email && (
                                    <Button
                                        variant="ghost"
                                        className="h-16 rounded-none justify-start gap-4 px-6 hover:bg-brand-gold/2 dark:hover:bg-brand-gold/10 group"
                                        asChild
                                    >
                                        <a href={`mailto:${customer.email}`} className="w-full flex items-center gap-4">
                                            <div className="h-9 w-9 rounded-full bg-brand-gold/10 flex items-center justify-center text-brand-gold group-hover:bg-brand-gold group-hover:text-white transition-all">
                                                <Mail className="w-4.5 h-4.5" />
                                            </div>
                                            <div className="flex flex-col items-start flex-1">
                                                <span className="text-xs font-bold uppercase tracking-wider text-brand-deep dark:text-brand-cream">Send Email</span>
                                                <span className="text-[10px] text-brand-accent/60 dark:text-brand-cream/60">{customer.email}</span>
                                            </div>
                                            <ChevronRight className="w-4 h-4 text-brand-accent/20 dark:text-brand-cream/20 group-hover:translate-x-0.5 transition-transform" />
                                        </a>
                                    </Button>
                                )}
                            </div>
                        </GlassCard>
                    </div>

                    {/* Timeline/History */}
                    <div className="space-y-6 pb-4">
                        <div className="flex items-center justify-between">
                            <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-accent/40 dark:text-brand-cream/40 ml-1">
                                Relationship History
                            </h4>
                            <Button
                                variant="link"
                                size="sm"
                                onClick={() => setIsLedgerOpen(true)}
                                className="text-brand-gold text-[10px] uppercase font-bold tracking-widest h-auto p-0"
                            >
                                View Full Ledger
                                <ChevronRight className="w-4 h-4 text-brand-accent/20 dark:text-brand-gold group-hover:translate-x-0.5 transition-transform" />
                            </Button>
                        </div>

                        <div className="space-y-4">
                            {isLoadingTx ? (
                                <div className="flex items-center justify-center py-12">
                                    <Loader2 className="w-6 h-6 animate-spin text-brand-gold/40" />
                                </div>
                            ) : txResponse?.data && txResponse.data.length > 0 ? (
                                <div className="space-y-3 bg-brand-deep/5 dark:bg-white/5 p-4 rounded-3xl">
                                    {txResponse.data.slice(0, 5).map((tx: Order) => (
                                        <CustomerTransactionListItem
                                            key={tx.id}
                                            transaction={tx}
                                            currencyCode={currencyCode}
                                            onClick={() => setViewingOrder(tx)}
                                        />
                                    ))}
                                    {txResponse.data.length > 5 && (
                                        <Button
                                            variant="ghost"
                                            onClick={() => setIsLedgerOpen(true)}
                                            className="w-full h-10 text-[10px] uppercase font-bold tracking-widest text-brand-accent/40 dark:text-brand-cream/40 hover:text-brand-gold hover:bg-transparent! transition-colors"
                                        >
                                            + {txResponse.data.length - 5} More Transactions
                                        </Button>
                                    )}
                                </div>
                            ) : (
                                /* Empty State Overhaul */
                                <div className="relative group">
                                    <div className="absolute inset-0 bg-linear-to-b from-brand-gold/5 to-transparent rounded-3xl -m-2 opacity-0 group-hover:opacity-100 transition-opacity" />
                                    <div className="relative flex flex-col items-center justify-center p-12 rounded-[2.5rem] bg-brand-deep/2 dark:bg-white/2 border border-dashed border-brand-deep/10 dark:border-white/10 text-center overflow-hidden">
                                        {/* Decorative elements */}
                                        <div className="absolute top-0 right-0 p-8 transform translate-x-1/4 -translate-y-1/4 opacity-5">
                                            <Sparkles className="w-32 h-32 text-brand-gold" />
                                        </div>
                                        <div className="absolute bottom-0 left-0 p-8 transform -translate-x-1/4 translate-y-1/4 opacity-5">
                                            <Activity className="w-24 h-24 text-brand-green dark:text-emerald-400" />
                                        </div>

                                        <div className="w-20 h-20 rounded-full bg-white dark:bg-brand-deep shadow-2xl shadow-brand-gold/10 flex items-center justify-center mb-6 relative">
                                            <div className="absolute inset-0 rounded-full bg-brand-gold/20 animate-ping opacity-20" />
                                            <History className="w-8 h-8 text-brand-gold" />
                                        </div>

                                        <h5 className="text-lg font-serif font-medium text-brand-deep dark:text-brand-cream mb-2">
                                            No transactions yet
                                        </h5>
                                        <p className="text-sm text-brand-accent/60 dark:text-brand-cream/40 max-w-[240px] leading-relaxed mb-6">
                                            This relationship is just beginning. Once they make their first purchase, you&apos;ll see deep insights here.
                                        </p>

                                        <Badge variant="outline" className="rounded-full bg-white/50 dark:bg-brand-deep/50 border-brand-deep/5 backdrop-blur-sm px-4 py-1.5 flex items-center gap-2">
                                            <div className="w-1.5 h-1.5 rounded-full bg-brand-green dark:bg-emerald-400 animate-pulse" />
                                            <span className="text-[10px] font-bold uppercase tracking-widest text-brand-accent/60 dark:text-brand-cream/60">Waiting for activity</span>
                                        </Badge>
                                    </div>
                                </div>
                            )}

                            <div className="flex items-center gap-4 p-5 rounded-3xl bg-white dark:bg-brand-deep/40 border border-brand-deep/5 dark:border-white/5 shadow-sm">
                                <div className="h-10 w-10 rounded-full bg-brand-green/10 dark:bg-emerald-500/10 flex items-center justify-center text-brand-green dark:text-emerald-400">
                                    <ShoppingBag className="w-5 h-5" />
                                </div>
                                <div className="flex-1">
                                    <p className="text-xs font-bold uppercase tracking-widest text-brand-accent/40 dark:text-brand-cream/40 mb-0.5">Registration Status</p>
                                    <p className="text-sm font-medium text-brand-deep dark:text-brand-cream">Customer Profile Active</p>
                                </div>
                                <div className="h-8 px-3 rounded-xl bg-brand-green/10 dark:bg-emerald-500/10 flex items-center text-[10px] font-bold text-brand-green dark:text-emerald-400 uppercase tracking-wider">
                                    Verified
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="p-6 md:p-8 pt-0 sm:hidden">
                    <DrawerClose asChild>
                        <Button variant="outline" className="w-full h-12 rounded-xl border-brand-deep/5 dark:border-white/5 dark:text-brand-cream">
                            Close
                        </Button>
                    </DrawerClose>
                </div>
            </DrawerContent>

            <OrderDetailsDrawer
                order={viewingOrder}
                open={!!viewingOrder}
                onOpenChange={(open) => !open && setViewingOrder(null)}
                onUpdateStatus={async (id, status) => { await updateOrder({ id, updates: { status } }) }}
                onDelete={async (id) => { await deleteOrder(id) }}
                onPrintReceipt={async (order) => {
                    if (!activeBusiness) return
                    const receiptData = {
                        businessName: activeBusiness.name,
                        businessAddress: (activeBusiness as any).address,
                        businessPhone: (activeBusiness as any).phone,
                        orderId: order.id,
                        shortCode: order.shortCode,
                        date: order.date || format(new Date(), 'dd MMM yyyy, HH:mm'),
                        customerName: order.customer,
                        items: order.items?.map(item => ({
                            productName: item.productName,
                            quantity: Number(item.quantity),
                            price: Number(item.price),
                            total: Number(item.total)
                        })) || [],
                        subtotal: Number(order.subtotalAmount || order.totalAmount),
                        discountAmount: order.discountAmount ? Number(order.discountAmount) : undefined,
                        totalAmount: Number(order.totalAmount),
                        amountPaid: Number(order.amountPaid),
                        remainingAmount: Number(order.remainingAmount || 0),
                        paymentMethod: order.paymentMethod,
                        currency: order.currency || activeBusiness.currency || 'NGN'
                    }
                    await printReceipt(receiptData)
                }}
                isUpdating={isUpdatingTx}
                isDeleting={isDeletingTx}
            />

            <CustomerLedgerDrawer
                customer={customer}
                open={isLedgerOpen}
                onOpenChange={setIsLedgerOpen}
            />
        </Drawer >
    )
}
