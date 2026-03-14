"use client"

import React from "react"
import {
    Drawer,
    DrawerContent,
    DrawerStickyHeader,
    DrawerTitle,
    DrawerDescription,
    DrawerClose,
    DrawerBody,
} from "@/app/components/ui/drawer"
import { Button } from "@/app/components/ui/button"
import { GlassCard } from "@/app/components/ui/glass-card"
import { Badge } from "@/app/components/ui/badge"
import {
    ReceiptText,
    Copy,
    Trash2,
    RefreshCw,
    AlertCircle,
    CheckCircle2,
    Clock,
    XCircle,
    Link2
} from "lucide-react"
import { Order, OrderStatus } from "../types"
import { formatCurrency } from "@/app/lib/formatters"
import { useBusiness } from "@/app/components/BusinessProvider"
import { cn } from "@/app/lib/utils"
import { toast } from "sonner"

interface OrderDetailsDrawerProps {
    order: Order | null
    open: boolean
    onOpenChange: (open: boolean) => void
    onUpdateStatus?: (orderId: string, status: OrderStatus) => Promise<void>
    onDelete?: (orderId: string) => Promise<void>
    onPrintReceipt?: (order: Order) => Promise<void>
    onGeneratePaymentLink?: (order: Order) => void
    isUpdating?: boolean
    isDeleting?: boolean
    isLoading?: boolean
}

const statusColorMap: Record<string, { label: string, color: string, className: string, icon: any }> = {
    COMPLETED: {
        label: 'Completed',
        color: 'success',
        className: "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 dark:bg-emerald-400/10",
        icon: CheckCircle2
    },
    PENDING: {
        label: 'Pending',
        color: 'warning',
        className: "text-amber-600 dark:text-amber-400 bg-amber-600/5 dark:bg-amber-400/5",
        icon: Clock
    },
    CANCELLED: {
        label: 'Cancelled',
        color: 'danger',
        className: "text-red-600 dark:text-red-400 bg-red-600/5 dark:bg-red-400/5",
        icon: XCircle
    }
}

export function OrderDetailsDrawer({
    order,
    open,
    onOpenChange,
    onUpdateStatus,
    onDelete,
    onPrintReceipt,
    onGeneratePaymentLink,
    isUpdating,
    isDeleting,
    isLoading,
}: OrderDetailsDrawerProps) {
    const { activeBusiness } = useBusiness()
    const currencyCode = order?.currency || activeBusiness?.currency || 'NGN'

    if (open && !order && isLoading) {
        return (
            <Drawer open={open} onOpenChange={onOpenChange}>
                <DrawerContent>
                    <DrawerTitle className="sr-only">Order details</DrawerTitle>
                    <div className="p-8 flex items-center justify-center min-h-[200px] text-brand-accent/60 dark:text-brand-cream/60">
                        Loading order details…
                    </div>
                </DrawerContent>
            </Drawer>
        )
    }
    if (!order) return null

    const status = order.status?.toUpperCase() || 'UNKNOWN'
    const config = statusColorMap[status] || {
        label: order.status || 'Unknown',
        className: "text-brand-deep/60 dark:text-brand-cream/60 bg-brand-deep/5 dark:bg-white/5",
        icon: AlertCircle
    }
    const StatusIcon = config.icon

    return (
        <Drawer open={open} onOpenChange={onOpenChange}>
            <DrawerContent>
                <DrawerStickyHeader>
                    <DrawerTitle>Order Details</DrawerTitle>
                    <DrawerDescription>
                        Transaction #{order.shortCode || order.id.substring(0, 6)} for {order.customer}
                    </DrawerDescription>
                </DrawerStickyHeader>

                <DrawerBody>
                    <div className="space-y-8">
                        <div className="space-y-4">
                            <h3 className="text-[10px] font-bold uppercase tracking-widest text-brand-accent/40 dark:text-brand-cream/40 ml-1">Itemized List</h3>
                            <GlassCard className="divide-y divide-brand-deep/5 dark:divide-white/5 border-brand-deep/5 rounded-3xl before:rounded-3xl">
                                {order.items?.map((item, idx) => (
                                    <div key={idx} className="p-4 flex justify-between items-center">
                                        <div>
                                            <p className="font-medium text-brand-deep dark:text-brand-cream">{item.productName}</p>
                                            <p className="text-xs text-brand-accent/40 dark:text-brand-cream/40">
                                                {Number(item.quantity)} {Number(item.quantity) === 1 ? 'unit' : 'units'} x {formatCurrency(item.price, { currency: currencyCode })}
                                            </p>
                                        </div>
                                        <p className="font-serif font-medium text-brand-deep dark:text-brand-cream">{formatCurrency(item.total, { currency: currencyCode })}</p>
                                    </div>
                                )) || (
                                        <div className="p-4 text-center text-xs opacity-40">No item details available</div>
                                    )}
                                <div className="p-4 space-y-3 bg-brand-deep/5 dark:bg-white/5">
                                    <div className="flex justify-between items-center opacity-60">
                                        <p className="font-bold text-[10px] uppercase tracking-widest text-brand-accent">Subtotal</p>
                                        <p className="text-sm font-bold text-brand-deep dark:text-brand-cream">
                                            {formatCurrency(order.subtotalAmount || order.totalAmount, { currency: currencyCode })}
                                        </p>
                                    </div>

                                    {order.discountAmount ? (
                                        <div className="flex justify-between items-center text-red-500 dark:text-red-400 italic">
                                            <p className="font-bold text-[10px] uppercase tracking-widest">Less: Discount</p>
                                            <p className="text-sm font-bold">
                                                - {formatCurrency(order.discountAmount, { currency: currencyCode })}
                                            </p>
                                        </div>
                                    ) : null}

                                    <div className="flex justify-between items-center text-emerald-600 dark:text-emerald-400">
                                        <p className="font-bold text-[10px] uppercase tracking-widest">Amount Paid</p>
                                        <p className="text-sm font-bold">
                                            {formatCurrency(order.amountPaid, { currency: currencyCode })}
                                        </p>
                                    </div>
                                    <div className="pt-2 border-t border-brand-accent/10 flex justify-between items-center">
                                        <p className="font-bold text-xs uppercase tracking-widest text-brand-accent">Remaining Balance</p>
                                        <p className="text-2xl font-bold text-brand-green dark:text-brand-gold">
                                            {formatCurrency(Number(order.remainingAmount || 0), { currency: currencyCode })}
                                        </p>
                                    </div>
                                </div>
                            </GlassCard>
                        </div>

                        <div className="space-y-4">
                            <h3 className="text-[10px] font-bold uppercase tracking-widest text-brand-accent/40 dark:text-brand-cream/40 ml-1">Payment Information</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <GlassCard className="p-4 rounded-3xl before:rounded-3xl">
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-brand-accent/30 dark:text-brand-cream/30 mb-2">Status</p>
                                    <div className="flex">
                                        <div className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-current/10 whitespace-nowrap", config.className)}>
                                            <StatusIcon className="w-3 h-3" />
                                            <span className="text-[10px] font-bold uppercase tracking-wider">
                                                {config.label}
                                            </span>
                                        </div>
                                    </div>
                                </GlassCard>
                                <GlassCard className="p-4 rounded-3xl before:rounded-3xl">
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-brand-accent/30 dark:text-brand-cream/30 mb-2">Method</p>
                                    <p className="text-sm font-bold text-brand-deep dark:text-brand-cream capitalize tracking-tight leading-none">
                                        {(order.isAutomated || order.paymentMethod === 'TRANSFER') ? 'Bank Transfer' : order.paymentMethod?.replace('_', ' ').toLowerCase()}
                                    </p>
                                </GlassCard>
                            </div>
                            {order.notes && (
                                <GlassCard className="p-4 rounded-3xl before:rounded-3xl">
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-brand-accent/30 dark:text-brand-cream/30 mb-1">Notes</p>
                                    <p className="text-sm text-brand-deep/70 dark:text-brand-cream/70 leading-relaxed">{order.notes}</p>
                                </GlassCard>
                            )}
                        </div>

                        {order.deposit && (
                            <div className="space-y-4">
                                <h3 className="text-[10px] font-bold uppercase tracking-widest text-brand-accent/40 dark:text-brand-cream/40 ml-1">Automated Payment Details</h3>
                                <GlassCard className="p-6 rounded-3xl space-y-4 bg-brand-gold/5 border-brand-gold/10 before:rounded-3xl">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <p className="text-[10px] font-bold uppercase tracking-widest text-brand-gold/60 mb-1">Bank Name</p>
                                            <p className="text-sm font-medium text-brand-deep dark:text-brand-cream">{order.deposit.bankName}</p>
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <p className="text-[10px] font-bold uppercase tracking-widest text-brand-gold/60">Account Number</p>
                                                <button
                                                    onClick={() => {
                                                        navigator.clipboard.writeText(order.deposit?.virtualAccountNumber || '')
                                                        toast.success('Account number copied to clipboard')
                                                    }}
                                                    className="text-brand-gold hover:text-brand-gold/80 transition-colors"
                                                >
                                                    <Copy className="w-2.5 h-2.5" />
                                                </button>
                                            </div>
                                            <p className="text-sm font-mono font-medium text-brand-deep dark:text-brand-cream tracking-wider">{order.deposit.virtualAccountNumber}</p>
                                        </div>
                                    </div>
                                    <div className="pt-3 border-t border-brand-gold/10 grid grid-cols-2 gap-4">
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <p className="text-[10px] font-bold uppercase tracking-widest text-brand-gold/60">Reference</p>
                                                <button
                                                    onClick={() => {
                                                        navigator.clipboard.writeText(order.deposit?.paymentReference || '')
                                                        toast.success('Reference copied to clipboard')
                                                    }}
                                                    className="text-brand-gold hover:text-brand-gold/80 transition-colors"
                                                >
                                                    <Copy className="w-2.5 h-2.5" />
                                                </button>
                                            </div>
                                            <p className="text-[11px] font-mono text-brand-deep/60 dark:text-brand-cream/60 truncate">{order.deposit.paymentReference}</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-bold uppercase tracking-widest text-brand-gold/60 mb-1">Provider</p>
                                            <p className="text-[11px] font-bold text-brand-deep/40 dark:text-brand-cream/40 uppercase tracking-tighter">{order.deposit.provider}</p>
                                        </div>
                                    </div>
                                </GlassCard>
                            </div>
                        )}

                        <div className="flex gap-4 pt-6">
                            <Button
                                variant="outline"
                                className="flex-1 rounded-2xl h-14 border-brand-deep/5"
                                onClick={() => onPrintReceipt?.(order)}
                            >
                                <ReceiptText className="w-4 h-4 mr-2" />
                                Print Receipt
                            </Button>
                            <DrawerClose asChild>
                                <Button className="flex-1 rounded-2xl h-14 bg-brand-deep text-brand-gold dark:bg-brand-gold dark:text-brand-deep font-bold shadow-xl">
                                    Done
                                </Button>
                            </DrawerClose>
                        </div>

                        {status === 'PENDING' && onGeneratePaymentLink && (
                            <Button
                                variant="outline"
                                onClick={() => {
                                    onOpenChange(false)
                                    onGeneratePaymentLink(order)
                                }}
                                className="w-full rounded-2xl h-12 border-brand-gold/20 text-brand-gold hover:bg-brand-gold/5 dark:border-brand-gold/20 dark:text-brand-gold"
                            >
                                <Link2 className="w-4 h-4 mr-2" />
                                Generate Payment Link
                            </Button>
                        )}

                        <div className={cn("pt-6 border-t border-brand-deep/5 dark:border-white/5 mt-6",
                            order.isAutomated && status !== 'PENDING' ? "hidden" : "")
                        }>
                            {order.isAutomated ? (
                                <div className="space-y-3">
                                    {status === 'PENDING' ? (
                                        <Button
                                            variant="outline"
                                            onClick={async () => {
                                                await onUpdateStatus?.(order.id, 'CANCELLED' as any)
                                                onOpenChange(false)
                                            }}
                                            disabled={isUpdating}
                                            className="flex items-center justify-center gap-2 w-full h-14 text-xs font-bold text-amber-600 hover:text-amber-700 transition-all uppercase tracking-widest border-amber-600/10 rounded-2xl"
                                        >
                                            <RefreshCw className={cn("w-4 h-4", isUpdating && "animate-spin")} />
                                            {isUpdating ? "Cancelling..." : "Cancel Order"}
                                        </Button>
                                    ) : null}
                                </div>
                            ) : (
                                <Button
                                    variant="ghost"
                                    onClick={async () => {
                                        await onDelete?.(order.id)
                                        onOpenChange(false)
                                    }}
                                    disabled={isDeleting}
                                    className="flex items-center justify-center gap-2 w-full h-14 text-xs font-bold text-rose-500/60 hover:text-rose-500 hover:bg-rose-500/5 transition-all uppercase tracking-widest disabled:opacity-50 rounded-2xl"
                                >
                                    <Trash2 className={cn("w-4 h-4", isDeleting && "animate-spin")} />
                                    {isDeleting ? "Deleting..." : "Cancel & Delete Order"}
                                </Button>
                            )}
                        </div>
                    </div>
                </DrawerBody>
            </DrawerContent>
        </Drawer>
    )
}
