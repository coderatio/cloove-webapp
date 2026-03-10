"use client"

import * as React from "react"
import { Loader2, Phone, Banknote, Bell, FileText, Clock } from "lucide-react"
import { cn } from "@/app/lib/utils"
import { Button } from "@/app/components/ui/button"
import {
    Drawer,
    DrawerContent,
    DrawerStickyHeader,
    DrawerTitle,
    DrawerDescription,
    DrawerClose,
    DrawerBody,
    DrawerFooter,
} from "@/app/components/ui/drawer"
import { GlassCard } from "@/app/components/ui/glass-card"
import { useBusiness } from "@/app/components/BusinessProvider"
import { formatCurrency, formatDate } from "@/app/lib/formatters"
import { useDebtDetail, useDebtActions, type Debt } from "../hooks/useDebts"

interface DebtDetailDrawerProps {
    debt: Debt | null
    open: boolean
    onOpenChange: (open: boolean) => void
    onRecordPayment: (debt: Debt) => void
}

const statusConfig: Record<string, { label: string; className: string }> = {
    PENDING: { label: "Pending", className: "bg-brand-gold/10 text-brand-gold border-brand-gold/20" },
    PARTIAL: { label: "Partial", className: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20" },
    PAID: { label: "Paid", className: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20" },
    OVERDUE: { label: "Overdue", className: "bg-rose-500/10 text-rose-500 border-rose-500/20" },
}

export function DebtDetailDrawer({
    debt,
    open,
    onOpenChange,
    onRecordPayment,
}: DebtDetailDrawerProps) {
    const { activeBusiness } = useBusiness()
    const currencyCode = activeBusiness?.currency ?? "NGN"
    const { data: detailData, isLoading } = useDebtDetail(debt?.id ?? "")
    const detail = detailData?.data
    const { sendReminder, generateInvoice, isSendingReminder, isGeneratingInvoice } = useDebtActions()

    if (!debt) return null

    const config = statusConfig[debt.status] ?? statusConfig.PENDING
    const isOverdue = debt.dueAt && new Date(debt.dueAt) < new Date() && debt.status !== "PAID"

    return (
        <Drawer open={open} onOpenChange={onOpenChange}>
            <DrawerContent>
                <DrawerStickyHeader>
                    <DrawerTitle>{debt.customerName}</DrawerTitle>
                    <DrawerDescription>Debt details and repayment history</DrawerDescription>
                </DrawerStickyHeader>

                <DrawerBody>
                    <div className="space-y-6">
                        {/* Customer Info */}
                        <GlassCard className="p-5 space-y-3 rounded-3xl">
                            <div className="flex items-center justify-between">
                                <p className="text-[10px] font-bold uppercase tracking-widest text-brand-accent/40 dark:text-brand-cream/40">
                                    Customer
                                </p>
                                <span className={cn("px-2.5 py-1 rounded-full text-xs font-medium border", isOverdue ? statusConfig.OVERDUE.className : config.className)}>
                                    {isOverdue ? "Overdue" : config.label}
                                </span>
                            </div>
                            <p className="font-serif text-lg font-medium text-brand-deep dark:text-brand-cream">{debt.customerName}</p>
                            {debt.customerPhone && (
                                <a href={`tel:${debt.customerPhone}`} className="flex items-center gap-2 text-sm text-brand-accent/60 dark:text-brand-cream/60 hover:text-brand-green transition-colors">
                                    <Phone className="w-4 h-4" />
                                    {debt.customerPhone}
                                </a>
                            )}
                        </GlassCard>

                        {/* Amount Summary */}
                        <div className="grid grid-cols-2 gap-3">
                            <GlassCard className="p-4 rounded-3xl">
                                <p className="text-[10px] font-bold uppercase tracking-widest text-brand-accent/40 dark:text-brand-cream/40">
                                    Original Amount
                                </p>
                                <p className="text-xl font-serif font-medium text-brand-deep dark:text-brand-cream mt-1">
                                    {formatCurrency(debt.amount, { currency: currencyCode })}
                                </p>
                            </GlassCard>
                            <GlassCard className={cn("p-4 rounded-3xl", debt.remainingAmount > 0 && "border-rose-500/20 bg-rose-500/5")}>
                                <p className="text-[10px] font-bold uppercase tracking-widest text-rose-500/60">
                                    Remaining
                                </p>
                                <p className="text-xl font-serif font-medium text-rose-500 mt-1">
                                    {formatCurrency(debt.remainingAmount, { currency: currencyCode })}
                                </p>
                            </GlassCard>
                        </div>

                        {debt.dueAt && (
                            <div className={cn(
                                "flex items-center gap-2.5 px-4 py-3 rounded-xl text-sm",
                                isOverdue
                                    ? "bg-rose-500/5 text-rose-500 font-medium"
                                    : "text-brand-accent/60 dark:text-brand-cream/60"
                            )}>
                                <Clock className={cn("w-4 h-4 shrink-0", isOverdue ? "text-rose-500" : "text-brand-accent/30 dark:text-brand-cream/30")} />
                                Due {formatDate(debt.dueAt, "MMM d, yyyy")}
                                {isOverdue && " — Overdue"}
                            </div>
                        )}

                        {/* Repayment History */}
                        <div className="space-y-3">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-brand-accent/40 dark:text-brand-cream/40 ml-1">
                                Repayment History
                            </p>
                            {isLoading ? (
                                <div className="flex items-center justify-center py-8">
                                    <Loader2 className="w-5 h-5 animate-spin text-brand-accent/40" />
                                </div>
                            ) : !detail?.repayments?.length ? (
                                <GlassCard className="p-8 text-center space-y-3 rounded-3xl">
                                    <div className="mx-auto h-12 w-12 rounded-full bg-brand-deep/5 dark:bg-white/5 flex items-center justify-center">
                                        <Banknote className="w-6 h-6 text-brand-accent/20 dark:text-brand-cream/20" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-brand-deep/60 dark:text-brand-cream/60">
                                            No repayments yet
                                        </p>
                                        <p className="text-xs text-brand-accent/30 dark:text-brand-cream/30 mt-1">
                                            Payments will appear here once recorded.
                                        </p>
                                    </div>
                                </GlassCard>
                            ) : (
                                detail.repayments.map((repayment) => (
                                    <GlassCard key={repayment.id} className="p-4 flex items-center justify-between rounded-3xl">
                                        <div className="flex items-center gap-3">
                                            <div className="h-8 w-8 rounded-full bg-emerald-500/10 flex items-center justify-center">
                                                <Banknote className="w-4 h-4 text-emerald-500" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-brand-deep dark:text-brand-cream">Payment Received</p>
                                                <p className="text-xs text-brand-accent/40 dark:text-brand-cream/40">
                                                    {formatDate(repayment.createdAt, "MMM d, yyyy 'at' h:mm a")}
                                                </p>
                                            </div>
                                        </div>
                                        <span className="font-serif font-medium text-emerald-500">
                                            +{formatCurrency(repayment.amount, { currency: currencyCode })}
                                        </span>
                                    </GlassCard>
                                ))
                            )}
                        </div>
                    </div>
                </DrawerBody>

                {debt.status !== "PAID" && (
                    <DrawerFooter>
                        <div className="max-w-lg mx-auto w-full space-y-3">
                            <Button
                                onClick={() => {
                                    onOpenChange(false)
                                    onRecordPayment(debt)
                                }}
                                className="w-full rounded-2xl h-14 bg-brand-deep text-brand-gold dark:bg-brand-gold dark:text-brand-deep font-bold shadow-xl"
                            >
                                <Banknote className="w-5 h-5 mr-2" />
                                Record Payment
                            </Button>
                            <div className="flex gap-3">
                                <Button
                                    variant="outline"
                                    onClick={() => sendReminder(debt.id)}
                                    disabled={isSendingReminder}
                                    className="flex-1 rounded-2xl h-12 border-brand-deep/5 dark:border-white/5 dark:text-brand-cream"
                                >
                                    {isSendingReminder ? (
                                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                    ) : (
                                        <Bell className="w-4 h-4 mr-2" />
                                    )}
                                    Send Reminder
                                </Button>
                                <Button
                                    variant="outline"
                                    onClick={() => generateInvoice(debt.id)}
                                    disabled={isGeneratingInvoice}
                                    className="flex-1 rounded-2xl h-12 border-brand-deep/5 dark:border-white/5 dark:text-brand-cream"
                                >
                                    {isGeneratingInvoice ? (
                                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                    ) : (
                                        <FileText className="w-4 h-4 mr-2" />
                                    )}
                                    Invoice
                                </Button>
                            </div>
                        </div>
                    </DrawerFooter>
                )}
            </DrawerContent>
        </Drawer>
    )
}
