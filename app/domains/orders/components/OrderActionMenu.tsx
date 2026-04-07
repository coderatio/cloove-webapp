"use client"

import React, { useState } from 'react'
import { MoreVertical, Eye, Check, RefreshCw, Printer, Download, XCircle, Loader2, Link2 } from 'lucide-react'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/app/components/ui/dropdown-menu"
import { Button } from '@/app/components/ui/button'
import { cn } from '@/app/lib/utils'
import { Order, OrderStatus } from '../types'
import { toast } from 'sonner'
import { useLayoutPresetId } from "@/app/domains/workspace/hooks/usePresetPageCopy"

interface OrderActionMenuProps {
    order: Order
    onViewDetails: (order: Order) => void
    onUpdateStatus: (id: string, status: OrderStatus) => Promise<any>
    onRequery: (id: string) => Promise<any>
    onGenerateReceipt: (id: string) => Promise<any>
    onPrintReceipt: (order: Order) => void
    onRecordPayment: (order: Order) => void
    onGeneratePaymentLink?: (order: Order) => void
}

export function OrderActionMenu({
    order,
    onViewDetails,
    onUpdateStatus,
    onRequery,
    onGenerateReceipt,
    onPrintReceipt,
    onRecordPayment,
    onGeneratePaymentLink
}: OrderActionMenuProps) {
    const layoutPresetId = useLayoutPresetId()
    const [isProcessing, setIsProcessing] = useState(false)
    const [activeAction, setActiveAction] = useState<string | null>(null)
    const recordLabel = layoutPresetId === "school" ? "Fee Record" : "Order"

    const computedRemaining = Math.max(
        0,
        Number(order.totalAmount || 0) - Number(order.amountPaid || 0)
    )
    const hasBalance = computedRemaining > 0
    const isPayable = hasBalance && order.status !== 'CANCELLED' && order.status !== 'REFUNDED'

    const handleAction = async (actionName: string, label: string, fn: () => Promise<any>) => {
        setIsProcessing(true)
        setActiveAction(actionName)

        toast.promise(fn(), {
            loading: `Processing ${label.toLowerCase()}...`,
            success: (data: any) => data?.message || `${label} successful`,
            error: (err: any) => err?.message || `Failed to ${label.toLowerCase()}`,
            finally: () => {
                setIsProcessing(false)
                setActiveAction(null)
            }
        })
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild disabled={isProcessing}>
                <Button
                    variant="ghost"
                    size="sm"
                    className={cn(
                        "h-8 w-8 p-0 opacity-40 hover:opacity-100 rounded-full transition-all",
                        isProcessing && "opacity-100 bg-brand-deep/5"
                    )}
                >
                    {isProcessing ? (
                        <Loader2 className="w-4 h-4 animate-spin text-brand-green dark:text-brand-gold" />
                    ) : (
                        <MoreVertical className="w-4 h-4" />
                    )}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 rounded-2xl p-1.5 shadow-xl border-brand-deep/5 dark:border-white/5 bg-white/90 dark:bg-brand-deep-900 backdrop-blur-xl">
                <DropdownMenuItem
                    onSelect={() => onViewDetails(order)}
                    className="gap-3 rounded-xl py-2.5 focus:bg-brand-deep-50 dark:focus:bg-white/10 cursor-pointer"
                    disabled={isProcessing}
                >
                    <Eye className="w-4 h-4 text-brand-accent/60 dark:text-brand-cream/40" />
                    <span className="font-medium text-sm">View Details</span>
                </DropdownMenuItem>

                {isPayable && (
                    <DropdownMenuItem
                        onSelect={() => onRecordPayment(order)}
                        className="gap-3 rounded-xl py-2.5 focus:bg-brand-deep-50 dark:focus:bg-white/10 cursor-pointer text-brand-green dark:text-brand-gold"
                        disabled={isProcessing}
                    >
                        <Check className="w-4 h-4" />
                        <span className="font-medium text-sm">Record Payment</span>
                    </DropdownMenuItem>
                )}

                {isPayable && onGeneratePaymentLink && (
                    <DropdownMenuItem
                        onSelect={() => onGeneratePaymentLink(order)}
                        className="gap-3 rounded-xl py-2.5 focus:bg-brand-gold/10 cursor-pointer"
                        disabled={isProcessing}
                    >
                        <Link2 className="w-4 h-4 text-brand-gold" />
                        <span className="font-medium text-sm">Payment Link</span>
                    </DropdownMenuItem>
                )}

                {order.status === 'PENDING' && !hasBalance && (
                    <DropdownMenuItem
                        onSelect={(e) => {
                            e.preventDefault()
                            handleAction('paid', 'Mark as Paid', () => onUpdateStatus(order.id, 'COMPLETED' as any))
                        }}
                        className="gap-3 rounded-xl py-2.5 focus:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 cursor-pointer"
                        disabled={isProcessing}
                    >
                        {activeAction === 'paid' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                        <span className="font-medium text-sm">Mark as Paid</span>
                    </DropdownMenuItem>
                )}

                {order.isAutomated && order.status === 'PENDING' && (
                    <DropdownMenuItem
                        onSelect={(e) => {
                            e.preventDefault()
                            handleAction('requery', 'Requery Payment', () => onRequery(order.id))
                        }}
                        className="gap-3 rounded-xl py-2.5 focus:bg-brand-gold/10 cursor-pointer"
                        disabled={isProcessing}
                    >
                        <RefreshCw className={cn("w-4 h-4 text-brand-gold", activeAction === 'requery' && "animate-spin")} />
                        <span className="font-medium text-sm">Requery Payment</span>
                    </DropdownMenuItem>
                )}

                <DropdownMenuItem
                    onSelect={(e) => {
                        e.preventDefault()
                        onPrintReceipt(order)
                    }}
                    className="gap-3 rounded-xl py-2.5 focus:bg-brand-deep-50 dark:focus:bg-white/10 cursor-pointer"
                    disabled={isProcessing}
                >
                    <Printer className={cn("w-4 h-4 text-brand-accent/60 dark:text-brand-cream/40")} />
                    <span className="font-medium text-sm">Print Receipt</span>
                </DropdownMenuItem>

                <DropdownMenuItem
                    onSelect={(e) => {
                        e.preventDefault()
                        handleAction('receipt', 'Download Receipt', () => onGenerateReceipt(order.id))
                    }}
                    className="gap-3 rounded-xl py-2.5 focus:bg-brand-deep-50 dark:focus:bg-white/10 cursor-pointer"
                    disabled={isProcessing}
                >
                    <Download className={cn("w-4 h-4 text-brand-accent/60 dark:text-brand-cream/40", activeAction === 'receipt' && "animate-pulse")} />
                    <span className="font-medium text-sm">Download Receipt</span>
                </DropdownMenuItem>

                {(order.status === 'PENDING' || (order.status === 'COMPLETED' && !order.isAutomated)) && (
                    <>
                        <DropdownMenuSeparator className="bg-brand-deep/5 dark:bg-white/5 my-1" />
                        <DropdownMenuItem
                            onSelect={(e) => {
                                e.preventDefault()
                                handleAction('cancel', `Cancel ${recordLabel}`, () => onUpdateStatus(order.id, 'CANCELLED' as any))
                            }}
                            className="gap-3 rounded-xl py-2.5 focus:bg-red-500/10 text-red-600 dark:text-red-400 cursor-pointer"
                            disabled={isProcessing}
                        >
                            {activeAction === 'cancel' ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                            <span className="font-medium text-sm">{`Cancel ${recordLabel}`}</span>
                        </DropdownMenuItem>
                    </>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
