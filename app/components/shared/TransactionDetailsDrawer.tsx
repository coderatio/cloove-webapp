"use client"

import * as React from "react"
import {
    ArrowUpRight,
    ArrowDownRight,
    RefreshCcw,
    CheckCircle2,
    Clock,
    XCircle,
    Banknote,
    Copy,
    CreditCard,
    Globe,
    Share2,
} from "lucide-react"
import { toast } from "sonner"
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
} from "@/app/components/ui/drawer"
import { CurrencyDisplay } from "@/app/components/shared/CurrencyDisplay"
import { formatCurrency } from "@/app/lib/formatters"
import { VisuallyHidden } from "@/app/components/ui/visually-hidden"
import { Badge } from "@/app/components/ui/badge"
import { Skeleton } from "@/app/components/ui/skeleton"
import type { FinanceTransactionRow } from "@/app/domains/finance/hooks/useFinance"

export interface TransactionDetailsDrawerProps {
    transaction: FinanceTransactionRow | null
    open: boolean
    onOpenChange: (open: boolean) => void
    currencyCode: string
    stores: { id: string; name: string }[]
    onRequery?: () => void
    isRequerying?: boolean
    isLoading?: boolean
}

const statusDisplay = (status: string) => {
    switch (status) {
        case "Cleared":
            return "Completed successfully"
        case "Failed":
            return "Transaction failed"
        case "Processing":
            return "Processing payment"
        case "Pending":
        default:
            return "Awaiting confirmation"
    }
}

const verificationLabel = (status: string) => {
    switch (status) {
        case "Cleared":
            return "Fully Verified"
        case "Failed":
            return "Declined"
        case "Processing":
            return "In Progress"
        case "Pending":
        default:
            return "Awaiting"
    }
}

export function TransactionDetailsDrawer({
    transaction,
    open,
    onOpenChange,
    currencyCode,
    stores,
    onRequery,
    isRequerying = false,
    isLoading = false,
}: TransactionDetailsDrawerProps) {
    const tx = transaction
    const status = (tx?.status ?? "") as string
    const isPendingOrProcessing = status === "Pending" || status === "Processing"

    return (
        <Drawer open={open} onOpenChange={onOpenChange}>
            <DrawerContent className="max-h-[92vh]">
                <VisuallyHidden>
                    <DrawerTitle>Transaction Details</DrawerTitle>
                    <DrawerDescription>View detailed information about this transaction.</DrawerDescription>
                </VisuallyHidden>
                <DrawerStickyHeader className="border-b-0 pb-0">
                    <div className="flex flex-col items-center text-center pt-4">
                        {isLoading && !tx ? (
                            <div className="space-y-4 w-full max-w-sm">
                                <Skeleton className="h-8 w-32 mx-auto" />
                                <Skeleton className="h-14 w-48 mx-auto" />
                                <Skeleton className="h-5 w-40 mx-auto" />
                            </div>
                        ) : (
                            <>
                                <div
                                    className={cn(
                                        "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-[0.2em] mb-4 flex items-center gap-2",
                                        tx?.type === "Credit"
                                            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                                            : "bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20"
                                    )}
                                >
                                    {tx?.type === "Credit" ? (
                                        <ArrowDownRight className="w-3 h-3" />
                                    ) : (
                                        <ArrowUpRight className="w-3 h-3" />
                                    )}
                                    {tx?.type === "Credit" ? "Inbound Payment" : "Outbound Transfer"}
                                </div>

                                <h2 className="text-5xl sm:text-7xl font-serif font-medium text-brand-deep dark:text-brand-cream">
                                    {tx ? (
                                        <CurrencyDisplay
                                            value={typeof tx.amount === "number" ? tx.amount : 0}
                                            currency={currencyCode}
                                            className="justify-center"
                                        />
                                    ) : (
                                        "—"
                                    )}
                                </h2>

                                <p className="text-brand-accent/60 dark:text-brand-cream/60 font-medium mt-2">
                                    {tx?.sale?.customerName ??
                                        (tx?.withdrawal ? tx.withdrawal.bankName : tx?.customer)}
                                </p>
                            </>
                        )}
                    </div>
                </DrawerStickyHeader>

                <DrawerBody className="pb-12 pt-8">
                    {!tx ? (
                        <div className="max-w-2xl mx-auto space-y-6 px-4">
                            <Skeleton className="h-24 w-full rounded-2xl" />
                            <Skeleton className="h-40 w-full rounded-2xl" />
                        </div>
                    ) : (
                    <div className="max-w-2xl mx-auto space-y-8">
                        <div className="px-1">
                            <div
                                className={cn(
                                    "p-1 rounded-4xl border transition-all duration-500",
                                    status === "Cleared" && "bg-emerald-500/5 border-emerald-500/10",
                                    isPendingOrProcessing && "bg-amber-500/5 border-amber-500/10",
                                    status === "Failed" && "bg-rose-500/5 border-rose-500/10"
                                )}
                            >
                                <div className="flex items-center justify-between p-4 pr-6">
                                    <div className="flex items-center gap-4">
                                        <div
                                            className={cn(
                                                "h-14 w-14 rounded-2xl flex items-center justify-center shadow-sm",
                                                status === "Cleared" &&
                                                    "bg-emerald-500 text-white shadow-emerald-500/20",
                                                isPendingOrProcessing &&
                                                    "bg-amber-500 text-white shadow-amber-500/20",
                                                status === "Failed" &&
                                                    "bg-rose-500 text-white shadow-rose-500/20"
                                            )}
                                        >
                                            {status === "Cleared" && (
                                                <CheckCircle2 className="w-7 h-7" />
                                            )}
                                            {isPendingOrProcessing && (
                                                <Clock
                                                    className={cn(
                                                        "w-7 h-7",
                                                        status === "Processing" && "animate-pulse"
                                                    )}
                                                />
                                            )}
                                            {status === "Failed" && (
                                                <XCircle className="w-7 h-7" />
                                            )}
                                            {!status || (!["Cleared", "Pending", "Processing", "Failed"].includes(status)) && (
                                                <Clock className="w-7 h-7 opacity-70" />
                                            )}
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-bold uppercase tracking-widest text-brand-accent/40 dark:text-white/30 mb-0.5">
                                                Payment Status
                                            </p>
                                            <p className="font-bold text-xl text-brand-deep dark:text-brand-cream">
                                                {status || "—"}
                                            </p>
                                        </div>
                                    </div>

                                    {isPendingOrProcessing && onRequery ? (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={onRequery}
                                            disabled={isRequerying}
                                            className="h-10 rounded-xl border-brand-gold/30 text-brand-gold hover:bg-brand-gold/10 px-4"
                                        >
                                            <RefreshCcw
                                                className={cn(
                                                    "w-4 h-4 mr-2",
                                                    isRequerying && "animate-spin"
                                                )}
                                            />
                                            {isRequerying ? "Querying..." : "Re-query"}
                                        </Button>
                                    ) : (
                                        <div className="text-right">
                                            <p className="text-[10px] font-bold uppercase tracking-widest text-brand-accent/40 dark:text-white/30 mb-0.5">
                                                Verification
                                            </p>
                                            <p className="text-sm font-medium text-brand-deep dark:text-brand-cream">
                                                {verificationLabel(status)}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-center justify-between px-1">
                                <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-accent/40 dark:text-white/30">
                                    Transaction Information
                                </h3>
                                <Badge
                                    variant="outline"
                                    className="text-[9px] uppercase tracking-wider h-5 flex items-center"
                                >
                                    {tx?.method}
                                </Badge>
                            </div>

                            <div className="grid grid-cols-1 gap-3">
                                <div className="p-6 rounded-[2.5rem] bg-brand-deep/5 dark:bg-white/5 border border-brand-deep/5 dark:border-white/5 space-y-6">
                                    <div className="flex items-center justify-between group">
                                        <div>
                                            <p className="text-[10px] font-bold text-brand-accent/40 dark:text-brand-cream/40 uppercase tracking-widest mb-1">
                                                Reference ID
                                            </p>
                                            <p className="text-sm font-mono font-medium text-brand-deep dark:text-brand-cream truncate">
                                                {tx?.reference ?? tx?.id ?? "—"}
                                            </p>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 rounded-xl transition-all duration-300 bg-brand-deep/5 dark:bg-white/5 hover:bg-brand-deep/10 dark:hover:bg-white/10"
                                            onClick={() => {
                                                const id = tx?.reference ?? tx?.id ?? ""
                                                navigator.clipboard.writeText(id)
                                                toast.success("ID copied to clipboard")
                                            }}
                                        >
                                            <Copy className="w-3.5 h-3.5" />
                                        </Button>
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-[10px] font-bold text-brand-accent/40 dark:text-brand-cream/40 uppercase tracking-widest mb-1.5">
                                                Transaction Type
                                            </p>
                                            <div className="flex items-center gap-2">
                                                <div className="w-5 h-5 rounded-md bg-brand-gold/10 flex items-center justify-center">
                                                    <CreditCard className="w-3 h-3 text-brand-gold" />
                                                </div>
                                                <p className="text-sm font-medium text-brand-deep dark:text-brand-cream">
                                                    {tx?.method}
                                                </p>
                                            </div>
                                        </div>
                                        {tx?.storeId && (
                                            <div className="text-right">
                                                <p className="text-[10px] font-bold text-brand-accent/40 dark:text-brand-cream/40 uppercase tracking-widest mb-1.5">
                                                    Location
                                                </p>
                                                <div className="flex items-center justify-end gap-2">
                                                    <p className="text-sm font-medium text-brand-deep dark:text-brand-cream">
                                                        {stores.find((s) => s.id === tx?.storeId)
                                                            ?.name ?? "Main Branch"}
                                                    </p>
                                                    <Globe className="w-3 h-3 text-emerald-500" />
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    <div className="pt-4 border-t border-brand-deep/5 dark:border-white/5">
                                        <p className="text-[10px] font-bold text-brand-accent/40 dark:text-brand-cream/40 uppercase tracking-widest mb-2">
                                            Time & Date
                                        </p>
                                        <div className="flex items-start justify-between gap-4">
                                            <div>
                                                <p className="text-sm font-medium text-brand-deep dark:text-brand-cream">
                                                    {tx?.fullDate ?? tx?.date}
                                                </p>
                                                <p className="text-[10px] text-brand-accent/40 dark:text-brand-cream/40 mt-1">
                                                    {tx?.dateLabel ?? tx?.date} • {statusDisplay(status)}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {(tx?.withdrawal ?? tx?.sale) && (
                                    <div className="p-6 rounded-[2.5rem] bg-brand-deep/5 dark:bg-white/5 border border-brand-deep/5 dark:border-white/5">
                                        {tx?.withdrawal && (
                                            <div>
                                                <p className="text-[10px] font-bold text-brand-accent/40 dark:text-brand-cream/40 uppercase tracking-widest mb-4">
                                                    Destination Account
                                                </p>
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 rounded-2xl bg-brand-deep/10 dark:bg-brand-gold/10 flex items-center justify-center">
                                                        <Banknote className="w-6 h-6 text-brand-deep dark:text-brand-gold" />
                                                    </div>
                                                    <div>
                                                        <p className="text-base font-bold text-brand-deep dark:text-brand-cream">
                                                            {tx.withdrawal.bankName}
                                                        </p>
                                                        <p className="text-sm text-brand-accent/60 dark:text-brand-cream/60">
                                                            {tx.withdrawal.accountNumber} •{" "}
                                                            {tx.withdrawal.accountName}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {tx?.sale && (
                                            <div className="space-y-6">
                                                <div className="flex items-center justify-between">
                                                    <p className="text-[10px] font-bold text-brand-accent/40 dark:text-brand-cream/40 uppercase tracking-widest">
                                                        Linked Sale
                                                    </p>
                                                    <Badge
                                                        variant="outline"
                                                        className="text-[9px] uppercase tracking-wider"
                                                    >
                                                        {tx.sale.status === "COMPLETED" ||
                                                        tx.sale.status === "completed"
                                                            ? "Completed"
                                                            : tx.sale.status}
                                                    </Badge>
                                                </div>
                                                <div className="flex items-center justify-between gap-4">
                                                    <div>
                                                        <p className="text-base font-bold text-brand-deep dark:text-brand-cream">
                                                            {tx.sale.customerName ?? "Walking Customer"}
                                                        </p>
                                                        <p className="text-sm text-brand-accent/60 dark:text-brand-cream/60 mt-0.5">
                                                            Sale #{tx.sale.shortCode}
                                                        </p>
                                                    </div>
                                                    <div className="text-right shrink-0">
                                                        <p className="text-[10px] text-brand-accent/40 dark:text-brand-cream/40 uppercase tracking-widest mb-1">
                                                            Sale Total
                                                        </p>
                                                        <p className="text-base font-bold font-mono text-brand-deep dark:text-brand-cream">
                                                            {formatCurrency(tx.sale.totalAmount, {
                                                                currency: currencyCode,
                                                            })}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-4 pt-4 px-1">
                            <Button
                                variant="outline"
                                className="flex-1 h-14 rounded-3xl border-brand-deep/10 dark:border-white/10 font-bold flex items-center justify-center gap-3"
                            >
                                <Share2 className="w-4 h-4" />
                                Share Receipt
                            </Button>
                            <DrawerClose asChild>
                                <Button className="flex-1 h-14 rounded-3xl bg-brand-deep text-brand-gold dark:bg-brand-gold dark:hover:bg-brand-gold/80 dark:text-brand-deep dark:hover:text-brand-deep font-bold shadow-xl">
                                    Close
                                </Button>
                            </DrawerClose>
                        </div>
                    </div>
                    )}
                </DrawerBody>
            </DrawerContent>
        </Drawer>
    )
}
