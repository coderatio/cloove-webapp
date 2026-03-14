"use client"

import * as React from "react"
import DataTable, { type Column } from "@/app/components/DataTable"
import { useIsMobile } from "@/app/hooks/useMediaQuery"
import { PageTransition } from "@/app/components/layout/page-transition"
import { ListCard } from "@/app/components/ui/list-card"
import { GlassCard } from "@/app/components/ui/glass-card"
import { AlertCircle, Users, Clock, TrendingUp, ChevronLeft, ChevronRight, MoreHorizontal, Banknote, Bell, FileText, Eye, Download, Send, Link2, Loader2 } from "lucide-react"
import { cn } from "@/app/lib/utils"
import { ManagementHeader } from "@/app/components/shared/ManagementHeader"
import { useBusiness } from "@/app/components/BusinessProvider"
import { formatCurrency, formatDate } from "@/app/lib/formatters"
import { Button } from "@/app/components/ui/button"
import { FilterPopover } from "@/app/components/shared/FilterPopover"
import { TableSearch } from "@/app/components/shared/TableSearch"
import { Skeleton } from "@/app/components/ui/skeleton"
import { useDebts, useDebtStats, useDebtActions, type Debt } from "../hooks/useDebts"
import { AddDebtDrawer } from "./AddDebtDrawer"
import { DebtDetailDrawer } from "./DebtDetailDrawer"
import { RecordRepaymentDrawer } from "./RecordRepaymentDrawer"
import { useCreatePaymentLink } from "@/app/domains/checkout/hooks/usePaymentLinks"
import { PaymentLinkDialog } from "@/app/domains/checkout/components/PaymentLinkDialog"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/app/components/ui/dialog"
import { Switch } from "@/app/components/ui/switch"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
    DropdownMenuLabel,
} from "@/app/components/ui/dropdown-menu"

const PAGE_SIZE = 20

const STATUS_OPTIONS = [
    { label: "All", value: "ALL" },
    { label: "Pending", value: "PENDING" },
    { label: "Partial", value: "PARTIAL" },
    { label: "Paid", value: "PAID" },
    { label: "Overdue", value: "OVERDUE" },
]

const statusConfig: Record<string, { label: string; className: string; statusColor?: "success" | "warning" | "danger" | "neutral" }> = {
    PENDING: { label: "Pending", className: "bg-brand-gold/10 text-brand-gold border-brand-gold/20", statusColor: "warning" },
    PARTIAL: { label: "Partial", className: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20", statusColor: "warning" },
    PAID: { label: "Paid", className: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20", statusColor: "success" },
    OVERDUE: { label: "Overdue", className: "bg-rose-500/10 text-rose-500 border-rose-500/20", statusColor: "danger" },
}

function getDebtDisplayStatus(debt: Debt): string {
    if (debt.status === "PAID") return "PAID"
    if (debt.dueAt && new Date(debt.dueAt) < new Date()) return "OVERDUE"
    return debt.status
}

export function DebtsView() {
    const isMobile = useIsMobile()
    const { activeBusiness } = useBusiness()
    const currencyCode = activeBusiness?.currency ?? "NGN"
    const [search, setSearch] = React.useState("")
    const deferredSearch = React.useDeferredValue(search)
    const [currentPage, setCurrentPage] = React.useState(1)
    const [selectedFilters, setSelectedFilters] = React.useState<string[]>([])
    const [isAddOpen, setIsAddOpen] = React.useState(false)
    const [viewingDebt, setViewingDebt] = React.useState<Debt | null>(null)
    const [repayingDebt, setRepayingDebt] = React.useState<Debt | null>(null)
    const [paymentLinkDialogOpen, setPaymentLinkDialogOpen] = React.useState(false)
    const [generatedPaymentLink, setGeneratedPaymentLink] = React.useState<string | null>(null)
    const [paymentLinkConfirmOpen, setPaymentLinkConfirmOpen] = React.useState(false)
    const [paymentLinkDebt, setPaymentLinkDebt] = React.useState<Debt | null>(null)
    const [recordAsSale, setRecordAsSale] = React.useState(false)

    const statusFilter = selectedFilters.find(f => STATUS_OPTIONS.some(s => s.value === f)) || undefined

    const {
        debts,
        meta,
        isPending,
        error,
        createDebt,
        isCreating,
    } = useDebts(currentPage, PAGE_SIZE, deferredSearch, statusFilter)

    const { data: statsData, isLoading: isStatsLoading } = useDebtStats()
    const stats = statsData?.data

    const { recordRepayment, sendReminder, generateInvoice, isRecordingRepayment, isSendingReminder } = useDebtActions()
    const createPaymentLink = useCreatePaymentLink()

    const handlePaymentLinkClick = React.useCallback((debt: Debt) => {
        setPaymentLinkDebt(debt)
        setRecordAsSale(false)
        // If debt already has a sale, skip the "record as sale" dialog and generate directly
        if (debt.saleId) {
            setPaymentLinkConfirmOpen(false)
            setPaymentLinkDialogOpen(true)
            setGeneratedPaymentLink(null)
            createPaymentLink.mutateAsync({
                targetType: 'DEBT',
                targetId: debt.id,
                recordAsSale: false,
            }).then((result) => {
                const reference = result?.reference || (result as any)?.data?.reference
                if (reference) {
                    const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''
                    setGeneratedPaymentLink(`${baseUrl}/pay/${reference}`)
                }
            }).catch(() => {
                // Error handled by the hook's onError
            })
        } else {
            setPaymentLinkConfirmOpen(true)
        }
    }, [createPaymentLink])

    const handleConfirmGeneratePaymentLink = React.useCallback(async () => {
        if (!paymentLinkDebt) return
        setPaymentLinkConfirmOpen(false)
        setPaymentLinkDialogOpen(true)
        setGeneratedPaymentLink(null)
        try {
            const result = await createPaymentLink.mutateAsync({
                targetType: 'DEBT',
                targetId: paymentLinkDebt.id,
                recordAsSale,
            })
            const reference = result?.reference || (result as any)?.data?.reference
            if (reference) {
                const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''
                setGeneratedPaymentLink(`${baseUrl}/pay/${reference}`)
            }
        } catch {
            // Error handled by the hook's onError
        }
    }, [createPaymentLink, paymentLinkDebt, recordAsSale])

    const filterGroups = [
        {
            title: "Status",
            options: STATUS_OPTIONS,
        },
    ]

    const handleAddDebt = async (data: any) => {
        await createDebt(data)
        setIsAddOpen(false)
    }

    const handleRepayment = async (amount: number) => {
        if (!repayingDebt) return
        await recordRepayment({ debtId: repayingDebt.id, data: { amount } })
        setRepayingDebt(null)
    }

    const renderActions = (item: Debt) => {
        const displayStatus = getDebtDisplayStatus(item)
        return (
            <div onClick={(e) => e.stopPropagation()}>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0 hover:bg-brand-deep/5 dark:hover:bg-white/5 rounded-full">
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56 rounded-2xl p-2 border-brand-deep/5 dark:border-white/5 shadow-2xl">
                        <DropdownMenuLabel className="text-[10px] font-bold uppercase tracking-widest text-brand-accent/40 dark:text-brand-cream/40 p-3">
                            Debt Actions
                        </DropdownMenuLabel>
                        <DropdownMenuItem
                            onClick={() => setViewingDebt(item)}
                            className="rounded-xl flex items-center gap-3 cursor-pointer dark:text-brand-cream dark:focus:bg-white/5"
                        >
                            <div className="h-8 w-8 rounded-full bg-brand-green/10 dark:bg-emerald-500/10 flex items-center justify-center text-brand-green dark:text-emerald-400">
                                <Eye className="w-4 h-4" />
                            </div>
                            <span className="font-medium">View Details</span>
                        </DropdownMenuItem>
                        {displayStatus !== "PAID" && (
                            <>
                                <DropdownMenuItem
                                    onClick={() => setRepayingDebt(item)}
                                    className="rounded-xl flex items-center gap-3 cursor-pointer dark:text-brand-cream dark:focus:bg-white/5"
                                >
                                    <div className="h-8 w-8 rounded-full bg-brand-gold/10 flex items-center justify-center text-brand-gold">
                                        <Banknote className="w-4 h-4" />
                                    </div>
                                    <span className="font-medium">Record Payment</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    onClick={() => handlePaymentLinkClick(item)}
                                    className="rounded-xl flex items-center gap-3 cursor-pointer dark:text-brand-cream dark:focus:bg-white/5"
                                >
                                    <div className="h-8 w-8 rounded-full bg-brand-gold/10 flex items-center justify-center text-brand-gold">
                                        <Link2 className="w-4 h-4" />
                                    </div>
                                    <span className="font-medium">Payment Link</span>
                                </DropdownMenuItem>
                                <DropdownMenuSeparator className="bg-brand-deep/5 my-1" />
                                <DropdownMenuItem
                                    onClick={() => sendReminder(item.id)}
                                    disabled={isSendingReminder}
                                    className="rounded-xl flex items-center gap-3 cursor-pointer dark:text-brand-cream dark:focus:bg-white/5"
                                >
                                    <div className="h-8 w-8 rounded-full bg-brand-deep/5 dark:bg-white/5 flex items-center justify-center text-brand-accent dark:text-brand-cream">
                                        <Bell className="w-4 h-4" />
                                    </div>
                                    <span className="font-medium">Send Reminder</span>
                                </DropdownMenuItem>
                                <DropdownMenuSeparator className="bg-brand-deep/5 my-1" />
                                <DropdownMenuLabel className="text-[10px] font-bold uppercase tracking-widest text-brand-accent/40 dark:text-brand-cream/40 p-3 pt-2">
                                    Invoice
                                </DropdownMenuLabel>
                                <DropdownMenuItem
                                    onClick={() => generateInvoice({ debtId: item.id })}
                                    className="rounded-xl flex items-center gap-3 cursor-pointer dark:text-brand-cream dark:focus:bg-white/5"
                                >
                                    <div className="h-8 w-8 rounded-full bg-brand-deep/5 dark:bg-white/5 flex items-center justify-center text-brand-accent dark:text-brand-cream">
                                        <Download className="w-4 h-4" />
                                    </div>
                                    <span className="font-medium">{item.invoiceUrl ? "View Invoice" : "Generate Invoice"}</span>
                                </DropdownMenuItem>
                                {item.customerPhone && (
                                    <DropdownMenuItem
                                        onClick={() => generateInvoice({ debtId: item.id, sendTo: "CUSTOMER" })}
                                        className="rounded-xl flex items-center gap-3 cursor-pointer dark:text-brand-cream dark:focus:bg-white/5"
                                    >
                                        <div className="h-8 w-8 rounded-full bg-brand-deep/5 dark:bg-white/5 flex items-center justify-center text-brand-accent dark:text-brand-cream">
                                            <Send className="w-4 h-4" />
                                        </div>
                                        <span className="font-medium">Send Invoice</span>
                                    </DropdownMenuItem>
                                )}
                            </>
                        )}
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        )
    }

    const columns: Column<Debt>[] = [
        {
            key: "customerName",
            header: "Customer",
            render: (_value, item) => (
                <span className="font-serif font-medium text-base text-brand-deep dark:text-brand-cream">
                    {item.customerName}
                </span>
            ),
        },
        {
            key: "amount",
            header: "Amount",
            render: (_value, item) => (
                <span className="font-serif text-brand-deep dark:text-brand-cream">
                    {formatCurrency(item.amount, { currency: currencyCode })}
                </span>
            ),
        },
        {
            key: "remainingAmount",
            header: "Remaining",
            render: (_value, item) => (
                <span className={cn("font-serif font-medium", item.remainingAmount > 0 ? "text-rose-500" : "text-emerald-500")}>
                    {formatCurrency(item.remainingAmount, { currency: currencyCode })}
                </span>
            ),
        },
        {
            key: "status",
            header: "Status",
            render: (_value, item) => {
                const displayStatus = getDebtDisplayStatus(item)
                const config = statusConfig[displayStatus] ?? statusConfig.PENDING
                return (
                    <span className={cn("px-2.5 py-1 rounded-full text-xs font-medium border inline-flex items-center gap-1.5", config.className)}>
                        {displayStatus === "OVERDUE" && (
                            <div className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                        )}
                        {config.label}
                    </span>
                )
            },
        },
        {
            key: "dueAt",
            header: "Due Date",
            render: (_value, item) => (
                <span className={cn(
                    "text-sm",
                    item.dueAt && new Date(item.dueAt) < new Date() && item.status !== "PAID"
                        ? "text-rose-500 font-medium"
                        : "text-brand-accent/60 dark:text-brand-cream/60"
                )}>
                    {item.dueAt ? formatDate(item.dueAt, "MMM d, yyyy") : "\u2014"}
                </span>
            ),
        },
        {
            key: "actions" as any,
            header: "",
            render: (_value, item) => renderActions(item),
        },
    ]

    const totalPages = meta?.totalPages ?? 1
    const canPrev = currentPage > 1
    const canNext = currentPage < totalPages

    if (error) {
        return (
            <PageTransition>
                <div className="max-w-5xl mx-auto space-y-8 pb-24">
                    <ManagementHeader title="Debts" description="Track customer debts." />
                    <GlassCard className="p-8 text-center">
                        <p className="text-brand-deep dark:text-brand-cream mb-4">
                            {(error as Error).message}
                        </p>
                        <Button
                            variant="outline"
                            onClick={() => window.location.reload()}
                            className="rounded-2xl dark:border-white/5 dark:text-brand-cream hover:dark:bg-white/5"
                        >
                            Retry
                        </Button>
                    </GlassCard>
                </div>
            </PageTransition>
        )
    }

    return (
        <PageTransition>
            <div className="max-w-5xl mx-auto space-y-8 pb-24">
                <ManagementHeader
                    title="Debts"
                    description="Track and manage customer debts and repayments."
                    addButtonLabel="Record Debt"
                    onAddClick={() => setIsAddOpen(true)}
                />

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <GlassCard className={cn(
                        "p-5 flex items-center gap-4 relative overflow-hidden group transition-all rounded-3xl before:rounded-3xl",
                        (stats?.totalOutstanding ?? 0) > 0
                            ? "border-rose-500/20 bg-rose-500/5 shadow-[0_0_20px_rgba(239,68,68,0.05)]"
                            : "border-brand-deep/5"
                    )}>
                        <div className="absolute right-0 top-0 p-3 opacity-5 group-hover:opacity-10 transition-opacity text-rose-500">
                            <AlertCircle className="w-24 h-24" />
                        </div>
                        <div className="h-12 w-12 rounded-full bg-rose-500/10 flex items-center justify-center text-rose-500">
                            <AlertCircle className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-rose-500/60 uppercase tracking-widest">
                                Outstanding
                            </p>
                            {isStatsLoading ? (
                                <Skeleton className="h-8 w-20 mt-1" />
                            ) : (
                                <p className="text-2xl font-serif font-medium text-rose-500">
                                    {formatCurrency(stats?.totalOutstanding ?? 0, { currency: currencyCode })}
                                </p>
                            )}
                        </div>
                    </GlassCard>

                    <GlassCard className="p-5 flex items-center gap-4 relative overflow-hidden group rounded-3xl before:rounded-3xl">
                        <div className="absolute right-0 top-0 p-3 opacity-5 group-hover:opacity-10 transition-opacity">
                            <Users className="w-24 h-24" />
                        </div>
                        <div className="h-12 w-12 rounded-full bg-brand-green/10 dark:bg-brand-green/20 flex items-center justify-center text-brand-deep dark:text-brand-cream">
                            <Users className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-brand-accent/40 dark:text-brand-cream/60 uppercase tracking-widest">
                                Active Debtors
                            </p>
                            {isStatsLoading ? (
                                <Skeleton className="h-8 w-12 mt-1" />
                            ) : (
                                <p className="text-2xl font-serif font-medium text-brand-deep dark:text-brand-cream">
                                    {stats?.activeDebtors ?? 0}
                                </p>
                            )}
                        </div>
                    </GlassCard>

                    <GlassCard className={cn(
                        "p-5 flex items-center gap-4 relative overflow-hidden group transition-all rounded-3xl before:rounded-3xl",
                        (stats?.overdueCount ?? 0) > 0
                            ? "border-rose-500/20 bg-rose-500/5"
                            : "border-brand-deep/5"
                    )}>
                        <div className="absolute right-0 top-0 p-3 opacity-5 group-hover:opacity-10 transition-opacity text-rose-500">
                            <Clock className="w-24 h-24" />
                        </div>
                        <div className={cn(
                            "h-12 w-12 rounded-full flex items-center justify-center",
                            (stats?.overdueCount ?? 0) > 0 ? "bg-rose-500/10 text-rose-500" : "bg-brand-accent/10 text-brand-accent"
                        )}>
                            <Clock className="h-6 w-6" />
                        </div>
                        <div>
                            <p className={cn(
                                "text-[10px] font-bold uppercase tracking-widest",
                                (stats?.overdueCount ?? 0) > 0 ? "text-rose-500/60" : "text-brand-accent/40 dark:text-brand-cream/40"
                            )}>
                                Overdue
                            </p>
                            {isStatsLoading ? (
                                <Skeleton className="h-8 w-12 mt-1" />
                            ) : (
                                <div className="flex items-center gap-2">
                                    <p className={cn(
                                        "text-2xl font-serif font-medium",
                                        (stats?.overdueCount ?? 0) > 0 ? "text-rose-500" : "text-brand-deep dark:text-brand-cream"
                                    )}>
                                        {stats?.overdueCount ?? 0}
                                    </p>
                                    {(stats?.overdueCount ?? 0) > 0 && (
                                        <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                                    )}
                                </div>
                            )}
                        </div>
                    </GlassCard>

                    <GlassCard className="p-5 flex items-center gap-4 relative overflow-hidden group rounded-3xl before:rounded-3xl">
                        <div className="absolute right-0 top-0 p-3 opacity-5 group-hover:opacity-10 transition-opacity">
                            <TrendingUp className="w-24 h-24" />
                        </div>
                        <div className="h-12 w-12 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                            <TrendingUp className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-emerald-500/60 uppercase tracking-widest">
                                Collection Rate
                            </p>
                            {isStatsLoading ? (
                                <Skeleton className="h-8 w-12 mt-1" />
                            ) : (
                                <p className="text-2xl font-serif font-medium text-emerald-500">
                                    {stats?.collectionRate ?? 0}%
                                </p>
                            )}
                        </div>
                    </GlassCard>
                </div>

                <div className="space-y-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 w-full">
                        <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand-accent/40 dark:text-brand-cream/40 ml-1">
                            Debt Records
                        </p>
                        <div className="flex items-center gap-3 font-sans w-full md:w-auto">
                            <TableSearch
                                value={search}
                                onChange={setSearch}
                                placeholder="Search by customer..."
                                className="flex-1 min-w-0 w-full"
                            />
                            <div className="shrink-0">
                                <FilterPopover
                                    groups={filterGroups}
                                    selectedValues={selectedFilters}
                                    onSelectionChange={setSelectedFilters}
                                    onClear={() => setSelectedFilters([])}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {isPending && !debts.length ? (
                    <div className="space-y-3">
                        {[1, 2, 3, 4, 5].map((i) => (
                            <Skeleton key={i} className="h-20 w-full rounded-2xl" />
                        ))}
                    </div>
                ) : debts.length === 0 ? (
                    <GlassCard className="p-12 text-center">
                        <div className="flex flex-col items-center space-y-4">
                            <div className="w-20 h-20 rounded-3xl bg-brand-deep/5 dark:bg-white/5 flex items-center justify-center">
                                <AlertCircle className="w-10 h-10 text-brand-accent/30 dark:text-brand-cream/30" />
                            </div>
                            <h3 className="text-xl font-serif font-medium text-brand-deep dark:text-brand-cream">
                                No Debt Records
                            </h3>
                            <p className="text-sm text-brand-accent/60 dark:text-brand-cream/60 max-w-[300px]">
                                {deferredSearch || selectedFilters.length > 0
                                    ? "No debts match your search or filters."
                                    : "Record a debt to track amounts owed by customers."}
                            </p>
                            {!deferredSearch && selectedFilters.length === 0 && (
                                <Button
                                    onClick={() => setIsAddOpen(true)}
                                    className="rounded-2xl bg-brand-deep text-brand-gold dark:bg-brand-gold dark:text-brand-deep hover:bg-brand-deep/90 dark:hover:bg-brand-gold/90 font-semibold"
                                >
                                    <AlertCircle className="w-4 h-4 mr-2" />
                                    Record Debt
                                </Button>
                            )}
                        </div>
                    </GlassCard>
                ) : isMobile ? (
                    <div className="space-y-3">
                        {debts.map((debt, index) => {
                            const displayStatus = getDebtDisplayStatus(debt)
                            const config = statusConfig[displayStatus] ?? statusConfig.PENDING
                            return (
                                <ListCard
                                    key={debt.id}
                                    title={debt.customerName}
                                    subtitle={`Owed: ${formatCurrency(debt.amount, { currency: currencyCode })}`}
                                    meta={debt.dueAt ? `Due: ${formatDate(debt.dueAt, "MMM d, yyyy")}` : undefined}
                                    icon={AlertCircle}
                                    iconClassName={displayStatus === "OVERDUE" ? "text-rose-500" : "text-brand-deep/40 dark:text-brand-cream/40"}
                                    status={config.label}
                                    statusColor={config.statusColor}
                                    value={formatCurrency(debt.remainingAmount, { currency: currencyCode })}
                                    valueLabel="Remaining"
                                    delay={index * 0.05}
                                    actions={renderActions(debt)}
                                    onClick={() => setViewingDebt(debt)}
                                />
                            )
                        })}
                    </div>
                ) : (
                    <GlassCard className="overflow-hidden border-brand-deep/5 dark:border-white/5">
                        <DataTable
                            columns={columns}
                            data={debts}
                            emptyMessage="No debts found"
                        />
                    </GlassCard>
                )}

                {totalPages > 1 && (
                    <div className="flex items-center justify-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={!canPrev || isPending}
                            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                            className="rounded-xl dark:border-white/5 dark:text-brand-cream hover:dark:bg-white/5"
                        >
                            <ChevronLeft className="w-4 h-4" />
                            Previous
                        </Button>
                        <span className="text-sm text-brand-accent/60 dark:text-brand-cream/60">
                            Page {currentPage} of {totalPages}
                        </span>
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={!canNext || isPending}
                            onClick={() => setCurrentPage((p) => p + 1)}
                            className="rounded-xl dark:border-white/5 dark:text-brand-cream hover:dark:bg-white/5"
                        >
                            Next
                            <ChevronRight className="w-4 h-4" />
                        </Button>
                    </div>
                )}

                <AddDebtDrawer
                    open={isAddOpen}
                    onOpenChange={setIsAddOpen}
                    onSubmit={handleAddDebt}
                    isSubmitting={isCreating}
                />

                <DebtDetailDrawer
                    debt={viewingDebt}
                    open={!!viewingDebt}
                    onOpenChange={(open) => !open && setViewingDebt(null)}
                    onRecordPayment={(debt) => {
                        setViewingDebt(null)
                        setRepayingDebt(debt)
                    }}
                    onGeneratePaymentLink={handlePaymentLinkClick}
                    isGeneratingPaymentLink={createPaymentLink.isPending}
                />

                <Dialog open={paymentLinkConfirmOpen} onOpenChange={setPaymentLinkConfirmOpen}>
                    <DialogContent className="max-w-sm rounded-3xl! p-6 gap-5">
                        <DialogHeader>
                            <DialogTitle className="font-serif text-lg text-brand-deep dark:text-brand-cream">
                                Generate Payment Link
                            </DialogTitle>
                            <DialogDescription className="text-brand-accent/50 dark:text-white/50 text-sm">
                                Create a payment link for this debt
                                {paymentLinkDebt ? ` of ${formatCurrency(paymentLinkDebt.remainingAmount, { currency: currencyCode })}` : ''}.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="flex items-center justify-between gap-3 bg-brand-deep/5 dark:bg-white/5 border border-brand-deep/5 dark:border-white/10 rounded-2xl p-4">
                            <div className="space-y-0.5">
                                <p className="text-sm font-medium text-brand-deep dark:text-brand-cream">Record as a sale</p>
                                <p className="text-xs text-brand-accent/40 dark:text-white/40">
                                    When paid, also create a sale record in your books
                                </p>
                            </div>
                            <Switch
                                checked={recordAsSale}
                                onCheckedChange={setRecordAsSale}
                            />
                        </div>

                        <div className="flex gap-3">
                            <Button
                                variant="outline"
                                onClick={() => setPaymentLinkConfirmOpen(false)}
                                className="flex-1 h-12 rounded-2xl font-semibold"
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleConfirmGeneratePaymentLink}
                                disabled={createPaymentLink.isPending}
                                className="flex-1 h-12 rounded-2xl bg-brand-deep text-brand-gold dark:bg-brand-gold dark:text-brand-deep hover:bg-brand-deep/90 dark:hover:bg-brand-gold/90 font-semibold gap-2"
                            >
                                {createPaymentLink.isPending ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <Link2 className="w-4 h-4" />
                                )}
                                Generate
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>

                <PaymentLinkDialog
                    isOpen={paymentLinkDialogOpen}
                    onClose={() => setPaymentLinkDialogOpen(false)}
                    link={generatedPaymentLink}
                    isLoading={createPaymentLink.isPending}
                />

                <RecordRepaymentDrawer
                    debt={repayingDebt}
                    open={!!repayingDebt}
                    onOpenChange={(open) => !open && setRepayingDebt(null)}
                    onSubmit={handleRepayment}
                    isSubmitting={isRecordingRepayment}
                />
            </div>
        </PageTransition>
    )
}
