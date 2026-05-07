"use client"

import * as React from "react"
import { Loader2, Phone, Banknote, Bell, FileText, Clock, Download, Send, Link2 } from "lucide-react"
import { cn } from "@/app/lib/utils"
import { Button } from "@/app/components/ui/button"
import {
    Drawer,
    DrawerContent,
    DrawerStickyHeader,
    DrawerTitle,
    DrawerDescription,
    DrawerBody,
    DrawerFooter,
} from "@/app/components/ui/drawer"
import { GlassCard } from "@/app/components/ui/glass-card"
import { useBusiness } from "@/app/components/BusinessProvider"
import { formatCurrency, formatDate } from "@/app/lib/formatters"
import { CurrencyText } from "@/app/components/shared/CurrencyText"
import { useDebtDetail, useDebtActions, type Debt } from "../hooks/useDebts"

interface DebtDetailDrawerProps {
    debt: Debt | null
    open: boolean
    onOpenChange: (open: boolean) => void
    onRecordPayment: (debt: Debt) => void
    onGeneratePaymentLink?: (debt: Debt) => void
    isGeneratingPaymentLink?: boolean
}

const statusConfig: Record<string, { label: string; className: string }> = {
    PENDING: { label: "Pending", className: "border-amber-500/25 bg-amber-500/10 text-amber-700 dark:border-amber-400/25 dark:bg-amber-400/12 dark:text-amber-200" },
    PARTIAL: { label: "Partial", className: "border-amber-500/25 bg-amber-500/10 text-amber-700 dark:border-amber-400/25 dark:bg-amber-400/12 dark:text-amber-200" },
    PAID: { label: "Paid", className: "border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:border-emerald-400/25 dark:bg-emerald-400/12 dark:text-emerald-200" },
    OVERDUE: { label: "Overdue", className: "border-rose-500/25 bg-rose-500/10 text-rose-700 dark:border-rose-400/25 dark:bg-rose-400/12 dark:text-rose-200" },
}

export function DebtDetailDrawer({
    debt,
    open,
    onOpenChange,
    onRecordPayment,
    onGeneratePaymentLink,
    isGeneratingPaymentLink,
}: DebtDetailDrawerProps) {
    const { activeBusiness } = useBusiness()
    const currencyCode = activeBusiness?.currency ?? "NGN"
    const { data: detailData, isLoading } = useDebtDetail(debt?.id ?? "")
    const detail = detailData?.data
    const { sendReminder, generateInvoice, isSendingReminder, isGeneratingInvoice } = useDebtActions()

    // Track which invoice action is in progress
    const [invoiceAction, setInvoiceAction] = React.useState<"generate" | "send" | null>(null)

    const handleGenerateInvoice = async () => {
        if (!debt) return
        setInvoiceAction("generate")
        try { await generateInvoice({ debtId: debt.id }) } finally { setInvoiceAction(null) }
    }

    const handleSendInvoice = async () => {
        if (!debt) return
        setInvoiceAction("send")
        try { await generateInvoice({ debtId: debt.id, sendTo: "CUSTOMER" }) } finally { setInvoiceAction(null) }
    }

    if (!debt) return null

    const config = statusConfig[debt.status] ?? statusConfig.PENDING
    const isOverdue = debt.dueAt && new Date(debt.dueAt) < new Date() && debt.status !== "PAID"
    const hasInvoice = !!debt.invoiceUrl

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
                        <GlassCard className="p-5 space-y-3 rounded-3xl before:rounded-3xl">
                            <div className="flex items-center justify-between">
                                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                                    Customer
                                </p>
                                <span className={cn("px-2.5 py-1 rounded-full text-xs font-medium border", isOverdue ? statusConfig.OVERDUE.className : config.className)}>
                                    {isOverdue ? "Overdue" : config.label}
                                </span>
                            </div>
                            <p className="text-lg font-semibold text-foreground">{debt.customerName}</p>
                            {debt.customerPhone && (
                                <a href={`tel:${debt.customerPhone}`} className="flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground">
                                    <Phone className="w-4 h-4" />
                                    {debt.customerPhone}
                                </a>
                            )}
                        </GlassCard>

                        {/* Amount Summary */}
                        <div className="grid grid-cols-2 gap-3">
                            <GlassCard className="p-4 rounded-3xl before:rounded-3xl">
                                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                                    Original Amount
                                </p>
                                <p className="mt-1 text-xl font-semibold text-foreground">
                                    <CurrencyText value={formatCurrency(debt.amount, { currency: currencyCode })} />
                                </p>
                            </GlassCard>
                            <GlassCard className={cn("p-4 rounded-3xl before:rounded-3xl", debt.remainingAmount > 0 && "border-rose-500/20 bg-rose-500/5")}>
                                <p className="text-[10px] font-bold uppercase tracking-widest text-rose-500/60">
                                    Remaining
                                </p>
                                <p className="text-xl font-serif font-medium text-rose-500 mt-1">
                                    <CurrencyText value={formatCurrency(debt.remainingAmount, { currency: currencyCode })} />
                                </p>
                            </GlassCard>
                        </div>

                        {debt.dueAt && (
                            <div className={cn(
                                "flex items-center gap-2.5 px-4 py-3 rounded-xl text-sm",
                                isOverdue
                                    ? "bg-rose-500/5 text-rose-500 font-medium"
                                    : "text-muted-foreground"
                            )}>
                                <Clock className={cn("w-4 h-4 shrink-0", isOverdue ? "text-rose-500" : "text-muted-foreground/70")} />
                                Due {formatDate(debt.dueAt, "MMM d, yyyy")}
                                {isOverdue && " — Overdue"}
                            </div>
                        )}

                        {/* Invoice Actions */}
                        {debt.status !== "PAID" && (
                            <div className="space-y-3">
                                <p className="ml-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                                    Invoice
                                </p>
                                <div className="flex gap-3">
                                    <Button
                                        variant="outline"
                                        onClick={handleGenerateInvoice}
                                        disabled={isGeneratingInvoice}
                                        className="h-12 flex-1 rounded-2xl"
                                    >
                                        {invoiceAction === "generate" ? (
                                            <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                        ) : (
                                            <Download className="w-4 h-4 mr-2" />
                                        )}
                                        {hasInvoice ? "View Invoice" : "Generate Invoice"}
                                    </Button>
                                    {debt.customerPhone && (
                                        <Button
                                            variant="outline"
                                            onClick={handleSendInvoice}
                                            disabled={isGeneratingInvoice}
                                            className="h-12 flex-1 rounded-2xl"
                                        >
                                            {invoiceAction === "send" ? (
                                                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                            ) : (
                                                <Send className="w-4 h-4 mr-2" />
                                            )}
                                            Send to Customer
                                        </Button>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Repayment History */}
                        <div className="space-y-3">
                            <p className="ml-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                                Repayment History
                            </p>
                            {isLoading ? (
                                <div className="flex items-center justify-center py-8">
                                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                                </div>
                            ) : !detail?.repayments?.length ? (
                                <GlassCard className="p-8 text-center space-y-3 rounded-3xl before:rounded-3xl">
                                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                                        <Banknote className="h-6 w-6 text-muted-foreground/60" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground">
                                            No repayments yet
                                        </p>
                                        <p className="mt-1 text-xs text-muted-foreground">
                                            Payments will appear here once recorded.
                                        </p>
                                    </div>
                                </GlassCard>
                            ) : (
                                detail.repayments.map((repayment) => (
                                    <GlassCard key={repayment.id} className="p-4 flex items-center justify-between rounded-3xl before:rounded-3xl">
                                        <div className="flex items-center gap-3">
                                            <div className="h-8 w-8 rounded-full bg-emerald-500/10 flex items-center justify-center">
                                                <Banknote className="w-4 h-4 text-emerald-500" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-foreground">Payment Received</p>
                                                <p className="text-xs text-muted-foreground">
                                                    {formatDate(repayment.createdAt, "MMM d, yyyy 'at' h:mm a")}
                                                </p>
                                            </div>
                                        </div>
                                        <span className="font-serif font-medium text-emerald-500">
                                            +<CurrencyText value={formatCurrency(repayment.amount, { currency: currencyCode })} />
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
                                className="h-14 w-full rounded-2xl font-semibold shadow-sm"
                            >
                                <Banknote className="w-5 h-5 mr-2" />
                                Record Payment
                            </Button>
                            {onGeneratePaymentLink && (
                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        onOpenChange(false)
                                        onGeneratePaymentLink(debt)
                                    }}
                                    disabled={isGeneratingPaymentLink}
                                    className="h-12 w-full rounded-2xl border-emerald-500/25 bg-emerald-500/5 text-emerald-700 hover:bg-emerald-500/10 dark:border-emerald-400/25 dark:bg-emerald-400/10 dark:text-emerald-200"
                                >
                                    {isGeneratingPaymentLink ? (
                                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                    ) : (
                                        <Link2 className="w-4 h-4 mr-2" />
                                    )}
                                    Send Payment Link
                                </Button>
                            )}
                            <Button
                                variant="outline"
                                onClick={() => sendReminder(debt.id)}
                                disabled={isSendingReminder}
                                className="h-12 w-full rounded-2xl"
                            >
                                {isSendingReminder ? (
                                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                ) : (
                                    <Bell className="w-4 h-4 mr-2" />
                                )}
                                Send Reminder
                            </Button>
                        </div>
                    </DrawerFooter>
                )}
            </DrawerContent>
        </Drawer>
    )
}
