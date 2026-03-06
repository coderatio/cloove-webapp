"use client"

import React from "react"
import { ShoppingBag, ChevronRight, CheckCircle2, Clock, XCircle, AlertCircle } from "lucide-react"
import { Badge } from "@/app/components/ui/badge"
import { Button } from "@/app/components/ui/button"
import { cn } from "@/app/lib/utils"
import { formatCurrency, formatDate } from "@/app/lib/formatters"
import { type Order } from "../../orders/types"

interface CustomerTransactionListItemProps {
    transaction: Order
    currencyCode: string
    onClick: () => void
}

const statusColorMap: Record<string, { label: string, className: string, icon: React.ComponentType<{ className?: string }> }> = {
    COMPLETED: {
        label: 'Completed',
        className: "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 dark:bg-emerald-400/10",
        icon: CheckCircle2
    },
    PENDING: {
        label: 'Pending',
        className: "text-amber-600 dark:text-amber-400 bg-amber-600/5 dark:bg-amber-400/5",
        icon: Clock
    },
    CANCELLED: {
        label: 'Cancelled',
        className: "text-red-600 dark:text-red-400 bg-red-600/5 dark:bg-red-400/5",
        icon: XCircle
    }
}

export function CustomerTransactionListItem({
    transaction,
    currencyCode,
    onClick
}: CustomerTransactionListItemProps) {
    const status = transaction.status?.toUpperCase() || 'UNKNOWN'
    const config = statusColorMap[status] || {
        label: transaction.status || 'Unknown',
        className: "text-brand-deep/60 dark:text-brand-cream/60 bg-brand-deep/5 dark:bg-white/5",
        icon: AlertCircle
    }
    const StatusIcon = config.icon

    return (
        <Button
            variant="ghost"
            onClick={onClick}
            className="w-full h-auto flex items-center gap-4 p-4 rounded-3xl bg-white dark:bg-brand-deep/40 border border-brand-deep/5 dark:border-white/5 shadow-sm group hover:border-brand-gold/20 dark:hover:border-brand-gold/20 hover:bg-white dark:hover:bg-brand-deep/60 transition-all text-left justify-start"
        >
            <div className="h-10 w-10 shrink-0 rounded-full bg-brand-gold/5 dark:bg-brand-gold/10 flex items-center justify-center text-brand-gold group-hover:bg-brand-gold group-hover:text-white transition-all">
                <ShoppingBag className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-0.5">
                    <p className="text-xs font-bold text-brand-deep dark:text-brand-cream truncate">
                        {transaction.summary || 'Purchase'}
                    </p>
                    <p className="text-xs font-serif font-bold text-brand-deep dark:text-brand-cream">
                        {formatCurrency(transaction.totalAmount, { currency: currencyCode })}
                    </p>
                </div>
                <div className="flex items-center justify-between">
                    <p className="text-[10px] text-brand-accent/40 dark:text-brand-cream/40 uppercase tracking-widest">
                        {formatDate(transaction.date, 'MMM d, h:mm a')}
                    </p>
                    <Badge variant="outline" className={cn(
                        "text-[8px] uppercase tracking-tighter h-4 px-1.5 border-none",
                        config.className
                    )}>
                        <StatusIcon className="w-2 h-2 mr-1" />
                        {config.label}
                    </Badge>
                </div>
            </div>
            <ChevronRight className="w-4 h-4 shrink-0 text-brand-accent/20 dark:text-brand-cream/20 group-hover:text-brand-gold group-hover:translate-x-0.5 transition-all" />
        </Button>
    )
}
