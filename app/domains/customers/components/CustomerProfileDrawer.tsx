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
    Activity
} from "lucide-react"
import { type Customer, useCustomerTransactions } from "../hooks/useCustomers"
import { useBusiness } from "@/app/components/BusinessProvider"
import { type Order } from "../../orders/types"
import { formatCurrency, formatCompactCurrency, formatDate } from "@/app/lib/formatters"
import { cn } from "@/app/lib/utils"

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
                                    "rounded-xl h-9 px-4 gap-2 border-brand-deep/5",
                                    customer.isVip ? "text-brand-accent/40" : "text-brand-gold border-brand-gold/20 bg-brand-gold/5"
                                )}
                                onClick={() => onUpdateVip?.(customer.id, !customer.isVip)}
                            >
                                {customer.isVip ? (
                                    <>Remove VIP</>
                                ) : (
                                    <>
                                        <Star className="w-3.5 h-3.5 fill-brand-gold" />
                                        Make VIP
                                    </>
                                )}
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
                        <GlassCard className="p-6 flex flex-col gap-3 border-none bg-brand-deep/5 dark:bg-white/5 relative overflow-hidden group">
                            <div className="absolute -right-2 -top-2 opacity-10 group-hover:opacity-20 transition-opacity transform rotate-12">
                                <ShoppingBag className="w-20 h-20 text-brand-deep/10 dark:text-white/10" />
                            </div>
                            <span className="text-[10px] font-bold text-brand-accent/40 dark:text-brand-cream/40 uppercase tracking-[0.2em]">
                                Total Orders
                            </span>
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-2xl bg-brand-green/10 flex items-center justify-center text-brand-green">
                                    <ShoppingBag className="w-5 h-5" />
                                </div>
                                <span className="text-2xl font-serif font-medium text-brand-deep dark:text-brand-cream">{customer.orders}</span>
                            </div>
                        </GlassCard>

                        <GlassCard className="p-6 flex flex-col gap-3 border-none bg-brand-deep/5 dark:bg-white/5 relative overflow-hidden group">
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
                            "p-6 flex flex-col gap-3 border-none relative overflow-hidden group transition-all duration-500",
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
                                    hasDebt ? "bg-rose-500/10 text-rose-500" : "bg-brand-accent/10 text-brand-accent/40"
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
                    <div className="space-y-4">
                        <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-accent/40 dark:text-brand-cream/40 ml-1">
                            Connect & Communicate
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {customer.phoneNumber && (
                                <>
                                    <Button
                                        variant="outline"
                                        className="h-14 rounded-2xl justify-start gap-4 px-6 border-brand-deep/5 dark:border-white/5"
                                        asChild
                                    >
                                        <a href={`tel:${customer.phoneNumber}`}>
                                            <div className="h-8 w-8 rounded-full bg-brand-green/10 flex items-center justify-center text-brand-green">
                                                <Phone className="w-4 h-4" />
                                            </div>
                                            <div className="flex flex-col items-start">
                                                <span className="text-xs font-bold uppercase tracking-wider text-brand-deep dark:text-brand-cream">Call Customer</span>
                                                <span className="text-[10px] text-brand-accent/60">{customer.phoneNumber}</span>
                                            </div>
                                        </a>
                                    </Button>

                                    {whatsappUrl && (
                                        <Button
                                            variant="outline"
                                            className="h-14 rounded-2xl justify-start gap-4 px-6 border-brand-green/20 bg-brand-green/5"
                                            asChild
                                        >
                                            <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
                                                <div className="h-8 w-8 rounded-full bg-brand-green flex items-center justify-center text-white">
                                                    <MessageSquare className="w-4 h-4" />
                                                </div>
                                                <div className="flex flex-col items-start">
                                                    <span className="text-xs font-bold uppercase tracking-wider text-brand-green">WhatsApp Chat</span>
                                                    <span className="text-[10px] text-brand-green/60">Fastest response</span>
                                                </div>
                                            </a>
                                        </Button>
                                    )}
                                </>
                            )}

                            {customer.email && (
                                <Button
                                    variant="outline"
                                    className="h-14 rounded-2xl justify-start gap-4 px-6 border-brand-deep/5 dark:border-white/5 col-span-full"
                                    asChild
                                >
                                    <a href={`mailto:${customer.email}`}>
                                        <div className="h-8 w-8 rounded-full bg-brand-gold/10 flex items-center justify-center text-brand-gold">
                                            <Mail className="w-4 h-4" />
                                        </div>
                                        <div className="flex flex-col items-start">
                                            <span className="text-xs font-bold uppercase tracking-wider text-brand-deep dark:text-brand-cream">Send Email</span>
                                            <span className="text-[10px] text-brand-accent/60">{customer.email}</span>
                                        </div>
                                    </a>
                                </Button>
                            )}
                        </div>
                    </div>

                    {/* Timeline/History */}
                    <div className="space-y-6 pb-4">
                        <div className="flex items-center justify-between">
                            <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-accent/40 dark:text-brand-cream/40 ml-1">
                                Relationship History
                            </h4>
                            <Button variant="link" size="sm" className="text-brand-gold text-[10px] uppercase font-bold tracking-widest h-auto p-0">
                                View Full Ledger
                            </Button>
                        </div>

                        <div className="space-y-4">
                            {isLoadingTx ? (
                                <div className="flex items-center justify-center py-12">
                                    <Loader2 className="w-6 h-6 animate-spin text-brand-gold/40" />
                                </div>
                            ) : txResponse?.data && txResponse.data.length > 0 ? (
                                <div className="space-y-3 bg-brand-deep/5 dark:bg-white/5 p-4 rounded-3xl">
                                    {txResponse.data.map((tx: Order, idx: number) => (
                                        <div key={tx.id || idx} className="flex items-center gap-4 p-4 rounded-2xl bg-white dark:bg-brand-deep/40 border border-brand-deep/5 dark:border-white/5 shadow-sm group hover:border-brand-gold/20 transition-all">
                                            <div className="h-10 w-10 rounded-full bg-brand-gold/5 flex items-center justify-center text-brand-gold group-hover:bg-brand-gold group-hover:text-white transition-all">
                                                <ShoppingBag className="w-5 h-5" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between mb-0.5">
                                                    <p className="text-xs font-bold text-brand-deep dark:text-brand-cream truncate">
                                                        {tx.summary || 'Purchase'}
                                                    </p>
                                                    <p className="text-xs font-serif font-bold text-brand-deep dark:text-brand-cream">
                                                        {formatCurrency(tx.totalAmount, { currency: currencyCode })}
                                                    </p>
                                                </div>
                                                <div className="flex items-center justify-between">
                                                    <p className="text-[10px] text-brand-accent/40 dark:text-brand-cream/40 uppercase tracking-widest">
                                                        {tx.date || 'Recent'}
                                                    </p>
                                                    <Badge variant="outline" className={cn(
                                                        "text-[8px] uppercase tracking-tighter h-4 px-1.5 border-none",
                                                        tx.status === 'COMPLETED' ? "bg-emerald-500/10 text-emerald-600" : "bg-amber-500/10 text-amber-600"
                                                    )}>
                                                        {tx.status}
                                                    </Badge>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
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
                                            <Activity className="w-24 h-24 text-brand-green" />
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
                                            <div className="w-1.5 h-1.5 rounded-full bg-brand-green animate-pulse" />
                                            <span className="text-[10px] font-bold uppercase tracking-widest text-brand-accent/60">Waiting for activity</span>
                                        </Badge>
                                    </div>
                                </div>
                            )}

                            <div className="flex items-center gap-4 p-5 rounded-2xl bg-white dark:bg-brand-deep/40 border border-brand-deep/5 dark:border-white/5 shadow-sm">
                                <div className="h-10 w-10 rounded-full bg-brand-green/10 flex items-center justify-center text-brand-green">
                                    <ShoppingBag className="w-5 h-5" />
                                </div>
                                <div className="flex-1">
                                    <p className="text-xs font-bold uppercase tracking-widest text-brand-accent/40 mb-0.5">Registration Status</p>
                                    <p className="text-sm font-medium text-brand-deep dark:text-brand-cream">Customer Profile Active</p>
                                </div>
                                <div className="h-8 px-3 rounded-xl bg-brand-green/10 flex items-center text-[10px] font-bold text-brand-green uppercase tracking-wider">
                                    Verified
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="p-6 md:p-8 pt-0">
                    <DrawerClose asChild>
                        <Button variant="outline" className="w-full h-12 rounded-xl border-brand-deep/5">
                            Close Profile
                        </Button>
                    </DrawerClose>
                </div>
            </DrawerContent>
        </Drawer>
    )
}
