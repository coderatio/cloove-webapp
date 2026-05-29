"use client"

import { ArrowDownLeft, ArrowUpRight, ShoppingBag, CreditCard, UserPlus, ChevronRight, PackageSearch, Sparkles, ArrowRight, Wallet } from "lucide-react"
import { cn } from "@/app/lib/utils"
import { GlassCard } from "../ui/glass-card"
import Link from "next/link"
import { CurrencyText } from "@/app/components/shared/CurrencyText"

export interface ActivityItem {
    id: string
    type: 'sale' | 'payment' | 'debt' | 'customer' | 'inventory' | 'deposit' | 'withdrawal'
    /** The raw business event type, e.g. "ORDER_CREATED", "CUSTOMER_UPDATED" */
    eventType?: string
    description: string
    amount?: string
    timeAgo: string
    customer?: string
    href?: string
    orderId?: string
    txId?: string
    /** ISO timestamp for sorting when merging with other sources */
    timestamp?: string
    /** Extra event metadata for displaying details */
    metadata?: Record<string, unknown>
}

interface ActivityStreamProps {
    activities: ActivityItem[]
    onOrderClick?: (orderId: string) => void
    onFinanceClick?: (txId: string) => void
    className?: string
}

export const ActivityIcon = ({ type }: { type: ActivityItem['type'] }) => {
    switch (type) {
        case 'sale':
            return <div className="p-2 bg-brand-green/10 text-brand-green dark:bg-brand-green/20 dark:text-brand-cream rounded-full"><ShoppingBag className="w-4 h-4" /></div>
        case 'payment':
            return <div className="p-2 bg-brand-gold/10 text-brand-gold dark:bg-brand-gold/20 dark:text-brand-gold rounded-full"><CreditCard className="w-4 h-4" /></div>
        case 'debt':
            return <div className="p-2 bg-danger/10 text-danger dark:bg-danger/20 dark:text-red-400 rounded-full"><ArrowDownLeft className="w-4 h-4" /></div>
        case 'customer':
            return <div className="p-2 bg-brand-accent/10 text-brand-accent dark:bg-brand-gold/10 dark:text-brand-gold rounded-full"><UserPlus className="w-4 h-4" /></div>
        case 'inventory':
            return <div className="p-2 bg-brand-blue/10 text-brand-blue dark:bg-brand-gold/10 dark:text-brand-gold rounded-full"><PackageSearch className="w-4 h-4" /></div>
        case 'deposit':
            return <div className="p-2 bg-brand-green/10 text-brand-green dark:bg-brand-green/20 dark:text-brand-cream rounded-full"><Wallet className="w-4 h-4" /></div>
        case 'withdrawal':
            return <div className="p-2 bg-brand-accent/10 text-brand-accent dark:bg-brand-accent/20 dark:text-brand-gold rounded-full"><ArrowUpRight className="w-4 h-4" /></div>
    }
}

const ActivityEmptyState = () => {
    return (
        <div className="flex flex-col items-center justify-center py-12 px-8 text-center">
            <div className="relative mb-6">
                <div className="relative h-20 w-20 rounded-[28px] bg-white/40 dark:bg-brand-deep/40 border border-brand-deep/5 dark:border-white/5 backdrop-blur-md shadow-[0_20px_50px_rgba(0,0,0,0.05)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.2)] flex items-center justify-center group">
                    <div className="absolute inset-0 rounded-[28px] bg-linear-to-tr from-brand-gold/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                    <Sparkles className="w-8 h-8 text-brand-gold transition-transform duration-700 group-hover:scale-110 group-hover:rotate-12" />
                </div>
            </div>

            <div className="space-y-3">
                <h4 className="text-2xl font-semibold tracking-tight text-foreground">
                    The Pulse of Potential
                </h4>
                <p className="mx-auto max-w-[280px] text-sm leading-relaxed text-muted-foreground">
                    Your store&apos;s narrative is just beginning. Once you record sales or adjust stock, your activity stream will bloom.
                </p>

                <div className="pt-4">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-deep/5 dark:bg-white/5 border border-brand-deep/5 dark:border-white/5">
                        <div className="w-1 h-1 rounded-full bg-brand-gold-700 animate-pulse" />
                        <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Awakening System</span>
                    </div>
                </div>
            </div>
        </div>
    )
}

export function ActivityStream({ activities, onOrderClick, onFinanceClick, className }: ActivityStreamProps) {
    return (
        <div className={cn("space-y-4", className)}>
            <div className="flex items-center justify-between px-2">
                <h3 className="text-lg font-semibold text-foreground">Recent Activity</h3>
                {activities.length > 0 && (
                    <Link href="/activity" className="flex items-center gap-1 text-xs font-semibold text-muted-foreground transition-colors hover:text-foreground">
                        <span>View all</span>
                        <ArrowRight className="w-4 h-4" />
                    </Link>
                )}
            </div>

            <GlassCard className="rounded-[32px] p-2 space-y-1 overflow-hidden">
                {activities.length > 0 ? (
                    activities.map((item) => {
                        const Content = (
                            <div className="flex items-center gap-4 p-3 hover:bg-white/60 dark:hover:bg-white/5 hover:translate-x-1 rounded-2xl transition-all group cursor-pointer">
                                <ActivityIcon type={item.type} />

                                <div className="flex-1 min-w-0">
                                    <p className="truncate text-sm font-semibold text-foreground transition-colors group-hover:text-foreground">
                                        {item.description}
                                    </p>
                                    <p className="truncate text-xs text-muted-foreground">
                                        {item.customer && <span className="font-medium text-foreground/80">{item.customer} • </span>}
                                        {item.timeAgo}
                                    </p>
                                </div>

                                <div className="flex items-center gap-3">
                                    {item.amount && (
                                        <div className={cn(
                                            "text-sm font-bold whitespace-nowrap",
                                            item.type === 'sale' || item.type === 'payment' || item.type === 'deposit'
                                                ? "text-brand-green dark:text-emerald-300"
                                                : item.type === 'withdrawal' || item.type === 'debt'
                                                  ? "text-rose-600 dark:text-rose-400"
                                                  : "text-foreground"
                                        )}>
                                            <CurrencyText value={`${item.type === 'withdrawal' || item.type === 'debt' ? '-' : item.type === 'sale' || item.type === 'payment' || item.type === 'deposit' ? '+' : ''}${item.amount}`} />
                                        </div>
                                    )}
                                    <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/50 transition-colors group-hover:text-foreground/80" />
                                </div>
                            </div>
                        )

                        if (item.type === 'sale' && item.orderId && onOrderClick) {
                            return (
                                <button
                                    key={item.id}
                                    type="button"
                                    onClick={() => onOrderClick(item.orderId!)}
                                    className="block w-full text-left"
                                >
                                    {Content}
                                </button>
                            )
                        }
                        if (item.txId && onFinanceClick) {
                            return (
                                <button
                                    key={item.id}
                                    type="button"
                                    onClick={() => onFinanceClick(item.txId!)}
                                    className="block w-full text-left"
                                >
                                    {Content}
                                </button>
                            )
                        }
                        if (item.href) {
                            return (
                                <Link key={item.id} href={item.href} className="block">
                                    {Content}
                                </Link>
                            )
                        }
                        return (
                            <div key={item.id}>
                                {Content}
                            </div>
                        )
                    })
                ) : (
                    <ActivityEmptyState />
                )}
            </GlassCard>
        </div>
    )
}
