"use client"

import * as React from 'react'
import DataTable from '@/app/components/DataTable'
import { useIsMobile } from '@/app/hooks/useMediaQuery'
import { PageTransition } from '@/app/components/layout/page-transition'
import { ListCard } from '@/app/components/ui/list-card'
import { GlassCard } from '@/app/components/ui/glass-card'
import {
    Wallet,
    Building2,
    ArrowUpRight,
    ArrowDownRight,
    CheckCircle2,
    Clock,
    XCircle,
    Loader2,
    ArrowRightLeft,
    Banknote,
    Receipt,
    ChevronLeft,
    ChevronRight,
    Eye,
    EyeOff,
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/app/lib/utils'
import { ManagementHeader } from '@/app/components/shared/ManagementHeader'
import { InsightWhisper } from '@/app/components/dashboard/InsightWhisper'
import { useBusiness } from '@/app/components/BusinessProvider'
import { useStores } from '@/app/domains/stores/providers/StoreProvider'
import { Button } from '@/app/components/ui/button'
import {
    Drawer,
    DrawerContent,
    DrawerStickyHeader,
    DrawerTitle,
    DrawerDescription,
    DrawerBody,
} from "@/app/components/ui/drawer"
import { TransactionDetailsDrawer } from '@/app/components/shared/TransactionDetailsDrawer'
import { motion, AnimatePresence } from 'framer-motion'
import { FilterPopover, type FilterGroup } from '@/app/components/shared/FilterPopover'
import { TableSearch } from '@/app/components/shared/TableSearch'
import { StoreContextSelector } from '@/app/components/shared/StoreContextSelector'
import { initialTransactions } from '../data/financeMocks'
import { AddFundsDrawer } from '@/app/components/shared/AddFundsDrawer'
import { WithdrawDrawer } from './WithdrawDrawer'
import { PayoutAccountsManager } from './PayoutAccountsManager'
import { CurrencyDisplay } from '@/app/components/shared/CurrencyDisplay'
import { formatCurrency, parseCurrencyToNumber } from '@/app/lib/formatters'
import { CurrencyText } from '@/app/components/shared/CurrencyText'
import type { FinanceTransactionMock } from '../data/financeMocks'
import {
    useFinanceSummary,
    useFinanceTransactions,
    useRequeryTransaction,
    type TransactionFilterParams,
    type FinanceTransactionRow
} from '../hooks/useFinance'
import { useSettings, useUpdateBusinessSettings } from '@/app/domains/business/hooks/useBusinessSettings'
import { Skeleton } from '@/app/components/ui/skeleton'
import { Badge } from '@/app/components/ui/badge'

const WALLET_BALANCE_NUMERIC = 0

const STATUS_FILTER_OPTIONS = [
    { label: "Cleared", value: "Cleared" },
    { label: "Pending", value: "Pending" },
    { label: "Processing", value: "Processing" },
    { label: "Failed", value: "Failed" },
] as const

const TYPE_FILTER_OPTIONS = [
    { label: "Revenue (Credit)", value: "Credit" },
    { label: "Expense (Debit)", value: "Debit" },
] as const

const CATEGORY_FILTER_OPTIONS = [
    { label: "Sale", value: "Sale" },
    { label: "Refund", value: "Refund" },
    { label: "Expense", value: "Expense" },
    { label: "Wallet", value: "Wallet" },
    { label: "Other", value: "Other" },
] as const

function getTransactionCategory(method: string | undefined): { label: string; variant: 'success' | 'warning' | 'gold' | 'outline' } {
    if (!method) return { label: 'Other', variant: 'outline' }
    const m = method.toLowerCase()
    if (m.includes('refund')) return { label: 'Refund', variant: 'warning' }
    if (m.includes('sale')) return { label: 'Sale', variant: 'success' }
    if (m.includes('expense') || m.includes('supplier') || m.includes('debt')) return { label: 'Expense', variant: 'warning' }
    if (m.includes('wallet') || m.includes('withdrawal') || m.includes('deposit') || m.includes('fee')) return { label: 'Wallet', variant: 'gold' }
    if (m.includes('subscription')) return { label: 'Subscription', variant: 'outline' }
    if (m.includes('commission') || m.includes('adjustment')) return { label: 'Internal', variant: 'outline' }
    return { label: 'Other', variant: 'outline' }
}

function maskAccount(accountNumber: string): string {
    if (!accountNumber || accountNumber.length < 4) return accountNumber
    return `•••• ${accountNumber.slice(-4)}`
}

interface EntityResolution {
    primary: string
    secondary: string | null
}

function resolveEntityPurpose(row: any): EntityResolution {
    const method = (row.method || '').toLowerCase()
    const meta = (row.metadata || {}) as any

    // ── Withdrawal → destination bank + masked account ───────────────────────
    if (method === 'withdrawal' && row.withdrawal) {
        const { bankName, accountNumber, accountName } = row.withdrawal
        return {
            primary: `${bankName}  ${maskAccount(accountNumber)}`,
            secondary: accountName || null,
        }
    }

    // ── Fee → "Withdrawal Fee" + parent withdrawal short-ref ────────────────
    if (method === 'fee') {
        const desc = String(row.customer || '')
        const parentRef: string | null =
            meta.withdrawalReference ||
            meta.originalReference ||
            desc.match(/CLV-WD-[A-Z0-9-]+/)?.[0] ||
            null
        return {
            primary: 'Withdrawal Fee',
            secondary: parentRef ? `For ${parentRef.length > 22 ? parentRef.slice(0, 22) + '…' : parentRef}` : null,
        }
    }

    // ── Refund / Reversal → label the reversal type with parent context ──────
    if (method === 'refund') {
        const desc = String(row.customer || '').toLowerCase()
        const isFeeReversal = desc.includes('fee')
        const originalRef: string | null =
            meta.originalReference ||
            meta.originalWithdrawalId ||
            desc.match(/CLV-WD-[A-Z0-9-]+/)?.[0] ||
            null
        return {
            primary: isFeeReversal ? 'Fee Reversal' : 'Withdrawal Reversed',
            secondary: originalRef
                ? `Ref: ${originalRef.length > 20 ? originalRef.slice(0, 20) + '…' : originalRef}`
                : null,
        }
    }

    // ── Sale / Storefront Sale → customer name + order code ─────────────────
    if (method === 'sale' || method === 'storefront sale') {
        const customerName = row.sale?.customerName || row.customer || 'Walk-in Customer'
        return {
            primary: customerName,
            secondary: row.sale?.shortCode ? `Sale #${row.sale.shortCode}` : null,
        }
    }

    // ── Wallet Deposit → payer info if available ─────────────────────────────
    if (method === 'wallet deposit') {
        const payerName = meta.payer?.name || meta.payerName || meta.senderName || null
        const payerAccount = meta.payerAccountNumber || meta.payer?.accountNumber || null
        return {
            primary: payerName || 'Bank Transfer Deposit',
            secondary: payerAccount ? maskAccount(payerAccount) : null,
        }
    }

    // ── Subscription → plan label ────────────────────────────────────────────
    if (method === 'subscription') {
        return {
            primary: 'Subscription Payment',
            secondary: meta.planName || meta.plan || null,
        }
    }

    // ── Commission (referral / agent) ────────────────────────────────────────
    if (method.includes('commission')) {
        return {
            primary: 'Commission Credit',
            secondary: meta.sourceType || null,
        }
    }

    // ── Expense / Debt / Supplier → customer field is already meaningful ─────
    // ── Adjustment / fallback ────────────────────────────────────────────────
    return {
        primary: row.customer || row.method || 'Transaction',
        secondary: null,
    }
}
const PAGE_SIZE = 10

type TransactionRow = FinanceTransactionMock | (import('../hooks/useFinance').FinanceTransactionRow & { amountNumeric?: number })

function isApiRow(row: TransactionRow): row is import('../hooks/useFinance').FinanceTransactionRow {
    return typeof (row as any).amount === 'number'
}

export function FinanceView() {
    const isMobile = useIsMobile()
    const { activeBusiness } = useBusiness()
    const currencyCode = activeBusiness?.currency || 'NGN'
    const { stores, currentStore } = useStores()
    const useApi = !!activeBusiness?.id
    const [mockTransactions, setMockTransactions] = React.useState(initialTransactions)
    const [search, setSearch] = React.useState("")
    const deferredSearch = React.useDeferredValue(search)
    const [selectedFilters, setSelectedFilters] = React.useState<string[]>([])
    const [selectedStoreId, setSelectedStoreId] = React.useState<string>('all-stores')
    const [currentPage, setCurrentPage] = React.useState(1)

    // Parse selectedFilters array into structured server-side filter params
    const serverFilters = React.useMemo<TransactionFilterParams>(() => {
        const status = selectedFilters.filter(f => STATUS_FILTER_OPTIONS.some(o => o.value === f))
        const type = selectedFilters.filter(f => TYPE_FILTER_OPTIONS.some(o => o.value === f))
        const category = selectedFilters.filter(f => CATEGORY_FILTER_OPTIONS.some(o => o.value === f))
        return {
            ...(deferredSearch ? { search: deferredSearch } : {}),
            ...(status.length > 0 ? { status } : {}),
            ...(type.length > 0 ? { type } : {}),
            ...(category.length > 0 ? { category } : {}),
        }
    }, [deferredSearch, selectedFilters])

    // Reset to page 1 when search, filters, or store changes
    React.useEffect(() => {
        if (useApi) setCurrentPage(1)
    }, [selectedStoreId, deferredSearch, selectedFilters, useApi])

    const { summary: apiSummary, isFetching: summaryFetching } = useFinanceSummary(selectedStoreId)
    const { transactions: apiTransactions, meta: apiMeta, isLoading: transactionsLoading, isFetching: transactionsFetching } = useFinanceTransactions(
        useApi ? selectedStoreId : undefined,
        currentPage,
        PAGE_SIZE,
        useApi ? serverFilters : undefined
    )
    const [viewingTx, setViewingTx] = React.useState<TransactionRow | null>(null)
    const { mutateAsync: requeryTx, isPending: isRequerying } = useRequeryTransaction()
    const isRequeryingRef = React.useRef(false)
    const [isAddMoneyOpen, setIsAddMoneyOpen] = React.useState(false)
    const [isWithdrawOpen, setIsWithdrawOpen] = React.useState(false)
    const [isPayoutSettingsOpen, setIsPayoutSettingsOpen] = React.useState(false)
    const [withdrawInitialStep, setWithdrawInitialStep] = React.useState<"details" | "manage_payouts">("details")

    const { data: settings } = useSettings()
    const updateSettings = useUpdateBusinessSettings()

    const showBalance = settings?.business?.configs?.show_wallet_balance ?? true

    const toggleBalance = React.useCallback(() => {
        updateSettings.mutate({
            show_wallet_balance: !showBalance,
            quiet: true
        })
    }, [updateSettings, showBalance])

    const transactions = useApi ? apiTransactions.map(t => ({ ...t, amountNumeric: t.amount })) : mockTransactions
    const isFetching = useApi ? (summaryFetching || transactionsFetching) : false
    const isLoading = useApi ? transactionsLoading : false

    const filterGroups: (FilterGroup & { key: string })[] = [
        { key: 'storeId', title: "Store Location", options: stores.map(s => ({ label: s.name, value: s.id })) },
        { key: 'status', title: "Transaction Status", options: [...STATUS_FILTER_OPTIONS] },
        { key: 'type', title: "Type", options: [...TYPE_FILTER_OPTIONS] },
        { key: 'category', title: "Category", options: [...CATEGORY_FILTER_OPTIONS] },
    ]

    const walletBalanceFormatted = useApi && apiSummary
        ? formatCurrency(apiSummary.walletBalance, { currency: currencyCode })
        : formatCurrency(WALLET_BALANCE_NUMERIC, { currency: currencyCode })
    const totalRevenueNumeric = useApi && apiSummary
        ? (apiSummary.creditsTotal ?? apiSummary.salesTotal)
        : transactions.filter(t => t.type === 'Credit').reduce((acc, curr) => acc + (curr.amountNumeric ?? parseCurrencyToNumber((curr as any).amount)), 0)
    const pendingReconciliation = useApi && apiSummary
        ? (apiSummary.pendingTransactionsCount ?? apiSummary.pendingOrdersCount)
        : transactions.filter(t => t.status === 'Pending').length

    // For mock (non-API) mode, apply client-side filtering as a fallback
    const displayTransactions = React.useMemo(() => {
        if (useApi) return transactions
        const query = search.toLowerCase()
        const activeStatuses = new Set(selectedFilters.filter(f => STATUS_FILTER_OPTIONS.some(o => o.value === f)))
        const activeTypes = new Set(selectedFilters.filter(f => TYPE_FILTER_OPTIONS.some(o => o.value === f)))
        const activeStores = new Set(selectedFilters.filter(f => stores.some(s => s.id === f)))
        const activeCategories = new Set(selectedFilters.filter(f => CATEGORY_FILTER_OPTIONS.some(o => o.value === f)))

        const storeScoped = selectedStoreId === 'all-stores'
            ? transactions
            : transactions.filter((t: TransactionRow) => t.storeId === selectedStoreId)

        return storeScoped.filter((t: TransactionRow) => {
            const ref = (t as any).reference ?? t.id
            const matchesSearch = t.customer.toLowerCase().includes(query) || t.id.toLowerCase().includes(query) || ref.toLowerCase().includes(query)
            const matchesStatus = activeStatuses.size === 0 || activeStatuses.has(t.status)
            const matchesType = activeTypes.size === 0 || activeTypes.has(t.type)
            const matchesStore = activeStores.size === 0 || (t.storeId && activeStores.has(t.storeId))
            const categoryLabel = getTransactionCategory((t as any).method).label
            const matchesCategory = activeCategories.size === 0 || activeCategories.has(categoryLabel)
            return matchesSearch && matchesStatus && matchesType && matchesStore && matchesCategory
        })
    }, [useApi, transactions, search, selectedFilters, selectedStoreId, stores])

    const handleRequery = React.useCallback(async () => {
        if (!viewingTx || isRequeryingRef.current) return
        isRequeryingRef.current = true
        try {
            const updated = await requeryTx(viewingTx.id)
            if (updated?.data) {
                setViewingTx(updated.data)
            }
        } catch (error) {
            console.error("Requery failed:", error)
        } finally {
            isRequeryingRef.current = false
        }
    }, [viewingTx, requeryTx])

    const handleClearManual = React.useCallback(() => {
        if (!viewingTx || isApiRow(viewingTx)) return
        setMockTransactions(prev => prev.map(t =>
            t.id === viewingTx.id ? { ...t, status: 'Cleared' as const } : t
        ))
        setViewingTx(null)
    }, [viewingTx])

    const showMockActions = viewingTx && !isApiRow(viewingTx)

    const selectedStoreName = selectedStoreId === 'all-stores' ? 'your business' : stores.find(s => s.id === selectedStoreId)?.name || 'your business'

    const columns = React.useMemo<any[]>(() => [
        {
            key: 'type',
            header: '',
            width: '48px',
            cellClassName: 'pl-6 pr-0 py-5 shrink-0 w-[48px]',
            headerClassName: 'pl-6 pr-0 py-4 w-[48px]',
            render: (_: string, row: TransactionRow) => {
                const isCredit = row.type === 'Credit'
                const Icon = isCredit ? ArrowDownRight : ArrowUpRight
                return (
                    <div className={cn(
                        "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                        isCredit ? "bg-brand-green/10 dark:bg-brand-green-600/10 text-brand-green dark:text-brand-green-600" : "bg-rose-500/10 dark:bg-rose-500/5 text-rose-500"
                    )}>
                        <Icon className="w-4 h-4" />
                    </div>
                )
            }
        },
        {
            key: 'customer',
            header: 'Entity / Purpose',
            width: '320px',
            cellClassName: 'max-w-[320px] min-w-0',
            render: (_value: string, row: any) => {
                const { label, variant } = getTransactionCategory(row.method)
                const entity = resolveEntityPurpose(row)
                const fullRef = String(row.reference ?? row.id ?? '')
                return (
                    <div className="flex flex-col gap-0.5 min-w-0 overflow-hidden">
                        <div className="flex items-center gap-2 overflow-hidden">
                            <span className="font-medium text-brand-deep dark:text-brand-cream truncate flex-1 min-w-0" title={entity.primary}>
                                {entity.primary}
                            </span>
                            <Badge variant={variant} className="shrink-0 text-[9px] px-1.5 py-0.5 font-bold uppercase tracking-wider">{label}</Badge>
                        </div>
                        {entity.secondary && (
                            <span className="text-[11px] text-brand-deep/60 dark:text-brand-cream/60 truncate block min-w-0" title={entity.secondary}>
                                {entity.secondary}
                            </span>
                        )}
                        <span className="font-mono text-[10px] text-brand-accent/40 dark:text-brand-cream/40 truncate block min-w-0" title={fullRef}>
                            {fullRef}
                        </span>
                    </div>
                )
            }
        },
        {
            key: 'amount',
            header: 'Amount',
            render: (_: string, row: TransactionRow) => {
                const num = (row as any).amountNumeric ?? (typeof (row as any).amount === 'number' ? (row as any).amount : parseCurrencyToNumber((row as any).amount))
                const formatted = formatCurrency(num, { currency: currencyCode })
                return (
                    <div className="flex flex-col items-start">
                        <span className={cn(
                            "font-serif font-medium text-base",
                            row.type === 'Credit' ? "text-brand-green dark:text-brand-gold" : "text-rose-600 dark:text-rose-400"
                        )}>
                            <CurrencyText value={`${row.type === 'Credit' ? '+' : '-'}${formatted}`} />
                        </span>
                        <span className="text-[10px] text-brand-accent/40 dark:text-brand-cream/40 font-medium uppercase tracking-tighter">
                            {row.type === 'Credit' ? 'Inbound' : 'Outbound'}
                        </span>
                    </div>
                )
            }
        },
        {
            key: 'status',
            header: 'Status',
            render: (value: string, row: TransactionRow) => {
                const statusLabel = value ?? (row as any).status ?? '—'
                const isCleared = statusLabel === 'Cleared'
                const isFailed = statusLabel === 'Failed'
                const isProcessing = statusLabel === 'Processing'
                const icon = isCleared ? (
                    <CheckCircle2 className="w-3 h-3 text-emerald-500 dark:text-emerald-400" />
                ) : isFailed ? (
                    <XCircle className="w-3 h-3 text-red-500 dark:text-red-400" />
                ) : isProcessing ? (
                    <Loader2 className="w-3 h-3 text-amber-500 dark:text-amber-400 animate-spin" />
                ) : (
                    <Clock className="w-3 h-3 text-amber-500 dark:text-amber-400 animate-pulse" />
                )
                const colorClass = isCleared
                    ? "text-emerald-600 dark:text-emerald-400"
                    : isFailed
                        ? "text-red-600 dark:text-red-400"
                        : "text-amber-600 dark:text-amber-400"

                const bgClass = isCleared
                    ? "bg-emerald-500/10 dark:bg-emerald-400/10"
                    : isFailed
                        ? "bg-red-600/5 dark:bg-red-400/5"
                        : "bg-amber-600/5 dark:bg-amber-400/5"

                return (
                    <div className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-current/10", colorClass, bgClass)}>
                        {icon}
                        <span className="text-[10px] font-bold uppercase tracking-wider">
                            {statusLabel}
                        </span>
                    </div>
                )
            }
        },
        {
            key: 'date',
            header: 'Date',
            render: (_value: string, row: any) => {
                // fullDate = "Apr 02, 2026 • 03:45 PM" from API
                // createdAt = ISO string fallback
                const fullDate: string = row.fullDate || ''
                const parts = fullDate.split(' • ')
                const dateStr = parts[0] || (() => {
                    const d = row.createdAt ? new Date(row.createdAt) : null
                    return d && !isNaN(d.getTime())
                        ? d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
                        : _value
                })()
                const timeStr = parts[1] || (() => {
                    const d = row.createdAt ? new Date(row.createdAt) : null
                    return d && !isNaN(d.getTime())
                        ? d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: true })
                        : null
                })()
                return (
                    <div className="flex flex-col gap-0.5">
                        <span className="text-xs font-medium text-brand-deep dark:text-brand-cream tabular-nums whitespace-nowrap">
                            {dateStr}
                        </span>
                        {timeStr && (
                            <span className="text-[10px] text-brand-accent/50 dark:text-brand-cream/40 tabular-nums whitespace-nowrap">
                                {timeStr}
                            </span>
                        )}
                    </div>
                )
            }
        },
    ], [currencyCode])

    const intelligenceWhisper = pendingReconciliation > 0
        ? `You have **${pendingReconciliation} payments** pending reconciliation. Use the **Re-query** tool to automatically verify bank transfers.`
        : `Your books are perfectly reconciled. All transactions have been cleared for the current period.`

    return (
        <PageTransition>
            <div className="max-w-5xl mx-auto space-y-8 pb-24">
                <ManagementHeader
                    title="Finance"
                    description={`Monitor cash flow and reconcile transactions for ${selectedStoreName}.`}
                    extraActions={
                        <StoreContextSelector
                            value={selectedStoreId}
                            onChange={setSelectedStoreId}
                            className="w-full sm:w-auto flex justify-between"
                        />
                    }
                />

                <div className="space-y-6">
                    <AnimatePresence mode="wait">
                        {pendingReconciliation > 0 && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.98 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.98 }}
                            >
                                <InsightWhisper
                                    insight={intelligenceWhisper}
                                />
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                        <div className="lg:col-span-8 space-y-4">
                            <GlassCard className="p-6 sm:p-8 relative overflow-hidden group border-brand-gold/20 bg-linear-to-br from-white/50 to-brand-gold/5 dark:from-white/5 dark:to-brand-gold/5 min-h-[220px] sm:min-h-[300px] flex flex-col justify-between">
                                <div className="absolute right-0 top-0 p-6 opacity-10 group-hover:opacity-20 transition-all duration-700 -rotate-12 group-hover:rotate-0">
                                    <Wallet className="w-32 h-32 sm:w-48 sm:h-48 text-brand-gold" />
                                </div>

                                <div className="relative z-10">
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                            <div className="w-1.5 h-1.5 rounded-full bg-brand-green animate-pulse" />
                                            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-accent/40 dark:text-brand-cream/40">Business Balance</p>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 rounded-full hover:bg-brand-deep/5 dark:hover:bg-white/5"
                                            onClick={toggleBalance}
                                            disabled={updateSettings.isPending}
                                        >
                                            {showBalance ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                                            <span className="sr-only">{showBalance ? "Hide balance" : "Show balance"}</span>
                                        </Button>
                                    </div>
                                    <h2 className="text-4xl sm:text-6xl font-serif font-medium text-brand-deep dark:text-brand-cream tracking-tight">
                                        {showBalance ? (
                                            <CurrencyDisplay
                                                value={useApi && apiSummary ? apiSummary.walletBalance : WALLET_BALANCE_NUMERIC}
                                                currency={currencyCode}
                                            />
                                        ) : (
                                            <span>••••••••</span>
                                        )}
                                    </h2>
                                </div>

                                <div className="relative z-10 flex gap-4">
                                    <Button onClick={() => setIsWithdrawOpen(true)} className="flex-1 h-12 sm:h-16 rounded-2xl bg-brand-deep text-brand-gold dark:bg-brand-gold dark:hover:bg-brand-gold/80 dark:text-brand-deep font-bold shadow-2xl flex items-center justify-center gap-3 group/btn hover:scale-[1.02] active:scale-95 transition-all">
                                        <ArrowUpRight className="w-5 h-5 sm:w-6 sm:h-6 transition-transform group-hover/btn:-translate-y-1 group-hover/btn:translate-x-1" />
                                        Withdraw
                                    </Button>
                                    <Button onClick={() => setIsAddMoneyOpen(true)} variant="outline" className="flex-1 h-12 sm:h-16 rounded-2xl border-brand-deep/10 bg-white/50 dark:bg-white/5 font-bold flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-95 transition-all">
                                        <ArrowDownRight className="w-5 h-5 sm:w-6 sm:h-6 text-brand-green dark:text-brand-gold" />
                                        Add Funds
                                    </Button>
                                </div>
                            </GlassCard>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <motion.div
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.3, delay: 0.05 }}
                                >
                                    <GlassCard className="p-6 flex items-center gap-4 border-brand-deep/5 bg-white/40 dark:bg-white/5 backdrop-blur-md">
                                        <div className="h-12 w-12 rounded-2xl bg-brand-green/10 dark:bg-brand-gold/10 flex items-center justify-center text-brand-green dark:text-brand-gold shadow-inner">
                                            {isFetching ? <Skeleton className="h-6 w-6 rounded" /> : <ArrowRightLeft className="h-6 w-6" />}
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-bold text-brand-accent/40 dark:text-brand-cream/40 uppercase tracking-[0.2em] mb-1">Total Revenue</p>
                                            {isFetching ? <Skeleton className="h-8 w-24 mt-1" /> : (
                                                <p className="text-xl font-serif font-medium text-brand-deep dark:text-brand-cream">
                                                    <CurrencyDisplay
                                                        value={totalRevenueNumeric}
                                                        currency={currencyCode}
                                                    />
                                                </p>
                                            )}
                                        </div>
                                    </GlassCard>
                                </motion.div>
                                <motion.div
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.3, delay: 0.1 }}
                                >
                                    <GlassCard className="p-6 flex items-center gap-4 border-brand-deep/5 bg-white/40 dark:bg-white/5 backdrop-blur-md">
                                        <div className="h-12 w-12 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-500 shadow-inner">
                                            {isFetching ? <Skeleton className="h-6 w-6 rounded" /> : <Clock className="h-6 w-6" />}
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-bold text-brand-accent/40 dark:text-brand-cream/40 uppercase tracking-[0.2em] mb-1">Pending Clear</p>
                                            {isFetching ? <Skeleton className="h-8 w-20 mt-1" /> : <p className="text-xl font-serif font-medium text-brand-deep dark:text-brand-cream">{pendingReconciliation} items</p>}
                                        </div>
                                    </GlassCard>
                                </motion.div>
                            </div>
                        </div>

                        <div className="lg:col-span-4 space-y-4 h-full">
                            <GlassCard className="p-8 h-full bg-brand-deep/2 dark:bg-white/2 border-brand-deep/5 flex flex-col justify-between min-h-[400px]">
                                <div>
                                    <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-brand-accent/40 dark:text-brand-cream/40 mb-8 border-b border-brand-deep/5 pb-4">Financial Utils</h3>
                                    <div className="space-y-3">
                                        <Button
                                            variant="ghost"
                                            onClick={() => toast.info('Coming soon')}
                                            className="w-full cursor-pointer flex items-center justify-between p-5 rounded-3xl h-auto bg-white/80 dark:bg-white/5 border border-brand-deep/5 hover:border-brand-gold/30 hover:shadow-xl transition-all text-left group active:scale-95"
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className="h-10 w-10 rounded-xl bg-brand-green/5 dark:bg-white/5 flex items-center justify-center group-hover:bg-brand-gold/10 transition-colors">
                                                    <Receipt className="w-5 h-5 text-brand-accent/40 dark:text-brand-cream/60 group-hover:text-brand-gold transition-colors" />
                                                </div>
                                                <span className="text-sm font-semibold text-brand-deep dark:text-brand-cream/80">Tax Report</span>
                                            </div>
                                            <ChevronRight className="w-4 h-4 text-brand-accent/20 dark:text-brand-cream/30 group-hover:text-brand-gold group-hover:translate-x-1 transition-all" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            onClick={() => toast.info('Coming soon')}
                                            className="w-full cursor-pointer flex items-center justify-between p-5 rounded-3xl h-auto bg-white/80 dark:bg-white/5 border border-brand-deep/5 hover:border-brand-gold/30 hover:shadow-xl transition-all text-left group active:scale-95"
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className="h-10 w-10 rounded-xl bg-brand-green/5 dark:bg-white/5 flex items-center justify-center group-hover:bg-brand-gold/10 transition-colors">
                                                    <Banknote className="w-5 h-5 text-brand-accent/40 dark:text-brand-cream/60 group-hover:text-brand-gold transition-colors" />
                                                </div>
                                                <span className="text-sm font-semibold text-brand-deep dark:text-brand-cream/80">Statements</span>
                                            </div>
                                            <ChevronRight className="w-4 h-4 text-brand-accent/20 dark:text-brand-cream/30 group-hover:text-brand-gold group-hover:translate-x-1 transition-all" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            onClick={() => {
                                                setIsPayoutSettingsOpen(true)
                                            }}
                                            className="w-full cursor-pointer flex items-center justify-between p-5 rounded-3xl h-auto bg-white/80 dark:bg-white/5 border border-brand-deep/5 hover:border-brand-gold/30 hover:shadow-xl transition-all text-left group active:scale-95"
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className="h-10 w-10 rounded-xl bg-brand-green/5 dark:bg-white/5 flex items-center justify-center group-hover:bg-brand-gold/10 transition-colors">
                                                    <Building2 className="w-5 h-5 text-brand-accent/40 dark:text-brand-cream/60 group-hover:text-brand-gold transition-colors" />
                                                </div>
                                                <span className="text-sm font-semibold text-brand-deep dark:text-brand-cream/80">Payout Settings</span>
                                            </div>
                                            <ChevronRight className="w-4 h-4 text-brand-accent/20 dark:text-brand-cream/30 group-hover:text-brand-gold group-hover:translate-x-1 transition-all" />
                                        </Button>
                                    </div>
                                </div>

                                {/* <div className="mt-8 p-6 rounded-2xl bg-brand-gold/5 border border-brand-gold/10 text-center relative overflow-hidden bg-[radial-gradient(circle_at_top_right,rgba(182,143,76,0.1),transparent)]">
                                    <p className="relative z-10 text-[10px] font-bold text-brand-gold uppercase tracking-[0.2em] leading-relaxed">
                                        Secure & Verified <br /> Gateway
                                    </p>
                                </div> */}
                            </GlassCard>
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand-accent/40 dark:text-brand-cream/40 ml-1">Recent Transactions</p>

                        <div className="flex items-center gap-3 w-full md:w-auto">
                            <TableSearch
                                value={search}
                                onChange={setSearch}
                                placeholder="Search transactions..."
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
                    {isMobile ? (
                        <div className="space-y-3">
                            {isLoading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <GlassCard key={i} className="p-4 space-y-3">
                                        <div className="flex items-center justify-between">
                                            <Skeleton className="h-5 w-32" />
                                            <Skeleton className="h-4 w-12" />
                                        </div>
                                        <Skeleton className="h-4 w-full" />
                                        <div className="flex justify-between items-center pt-2 border-t border-brand-deep/5 dark:border-white/5">
                                            <Skeleton className="h-4 w-20" />
                                            <Skeleton className="h-8 w-24 rounded-full" />
                                        </div>
                                    </GlassCard>
                                ))
                            ) : displayTransactions.length === 0 ? (
                                <GlassCard className="p-12 text-center border-dashed border-brand-deep/20 dark:border-white/10 bg-transparent">
                                    <div className="flex flex-col items-center gap-3">
                                        <div className="h-16 w-16 rounded-3xl bg-brand-deep/5 dark:bg-white/5 flex items-center justify-center mb-2">
                                            <Receipt className="w-8 h-8 text-brand-deep/20 dark:text-white/20" />
                                        </div>
                                        <h3 className="text-brand-deep dark:text-brand-cream font-medium">No transactions found</h3>
                                        <p className="text-xs text-brand-accent/40 dark:text-brand-cream/40 max-w-[240px] mx-auto">
                                            Try adjusting your filters or search terms to find what you're looking for.
                                        </p>
                                    </div>
                                </GlassCard>
                            ) : (
                                displayTransactions.map((tx, index) => {
                                    const num = (tx as any).amountNumeric ?? (typeof (tx as any).amount === 'number' ? (tx as any).amount : parseCurrencyToNumber((tx as any).amount))
                                    const isCredit = tx.type === 'Credit'
                                    const Icon = isCredit ? ArrowDownRight : ArrowUpRight
                                    const { label } = getTransactionCategory((tx as any).method)
                                    const entity = resolveEntityPurpose(tx)
                                    const fullRef = String((tx as any).reference ?? tx.id ?? '')

                                    return (
                                        <ListCard
                                            key={tx.id}
                                            title={entity.primary}
                                            icon={Icon}
                                            iconClassName={isCredit ? "text-brand-green dark:text-brand-gold" : "text-rose-500 dark:text-rose-400"}
                                            subtitle={entity.secondary || undefined}
                                            meta={
                                                <>
                                                    <span className="font-sans font-bold">{label}</span>
                                                    <span>•</span>
                                                    <span className="truncate">{fullRef}</span>
                                                </>
                                            }
                                            status={tx.status}
                                            statusColor={tx.status === 'Cleared' ? 'success' : tx.status === 'Failed' ? 'danger' : 'warning'}
                                            value={<CurrencyText value={`${isCredit ? '+' : '-'}${formatCurrency(num, { currency: currencyCode })}`} />}
                                            valueLabel={isCredit ? 'Inbound' : 'Outbound'}
                                            delay={index * 0.05}
                                            onClick={() => setViewingTx(tx)}
                                        />
                                    )
                                })
                            )}
                            {useApi && apiMeta && (apiMeta.totalPages ?? 1) > 1 && !isLoading && (
                                <div className="flex items-center justify-between pt-4 border-t border-brand-deep/5 dark:border-white/5">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        disabled={(apiMeta.currentPage ?? 1) === 1}
                                        onClick={() => setCurrentPage((apiMeta.currentPage ?? 1) - 1)}
                                        className="rounded-xl h-10 border-brand-deep/5 dark:border-white/10"
                                    >
                                        <ChevronLeft className="w-4 h-4 mr-1 dark:text-brand-gold" />
                                        Prev
                                    </Button>
                                    <span className="text-xs text-brand-accent/60 dark:text-brand-cream/60">
                                        Page {apiMeta.currentPage ?? 1} of {apiMeta.totalPages ?? 1}
                                    </span>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        disabled={(apiMeta.currentPage ?? 1) === (apiMeta.totalPages ?? 1)}
                                        onClick={() => setCurrentPage((apiMeta.currentPage ?? 1) + 1)}
                                        className="rounded-xl h-10 border-brand-deep/5 dark:border-white/10"
                                    >
                                        Next
                                        <ChevronRight className="w-4 h-4 ml-1 dark:text-brand-gold" />
                                    </Button>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className={cn("transition-opacity duration-300", isFetching && "opacity-50")}>
                            <GlassCard className="overflow-hidden border-brand-deep/5 dark:border-white/5">
                                <DataTable
                                    columns={columns}
                                    data={displayTransactions}
                                    emptyMessage="No transactions matching your criteria."
                                    onRowClick={setViewingTx}
                                    pageSize={useApi ? PAGE_SIZE : 8}
                                    isLoading={isLoading}
                                    manualPagination={useApi && apiMeta ? {
                                        currentPage: apiMeta.currentPage ?? currentPage,
                                        totalPages: apiMeta.totalPages ?? 1,
                                        onPageChange: setCurrentPage,
                                    } : undefined}
                                />
                            </GlassCard>
                        </div>
                    )}
                </div>

                <TransactionDetailsDrawer
                    transaction={viewingTx}
                    open={!!viewingTx}
                    onOpenChange={(open) => !open && setViewingTx(null)}
                    currencyCode={currencyCode}
                    stores={stores}
                    onRequery={handleRequery}
                    isRequerying={isRequerying}
                    onApproveManually={showMockActions ? handleClearManual : undefined}
                />


                <AddFundsDrawer
                    isOpen={isAddMoneyOpen}
                    onOpenChange={setIsAddMoneyOpen}
                    currencyCode={currencyCode}
                />
                <WithdrawDrawer
                    isOpen={isWithdrawOpen}
                    onOpenChange={(open) => {
                        setIsWithdrawOpen(open)
                        if (!open) setWithdrawInitialStep("details")
                    }}
                    currencyCode={currencyCode}
                    initialStep={withdrawInitialStep}
                />

                <Drawer
                    open={isPayoutSettingsOpen}
                    onOpenChange={setIsPayoutSettingsOpen}
                >
                    <DrawerContent>
                        <DrawerStickyHeader>
                            <DrawerTitle>Payout Settings</DrawerTitle>
                            <DrawerDescription>
                                Manage your settlement bank accounts
                            </DrawerDescription>
                        </DrawerStickyHeader>
                        <DrawerBody className="p-4 pb-12">
                            <div className="max-w-md mx-auto">
                                <PayoutAccountsManager />
                            </div>
                        </DrawerBody>
                    </DrawerContent>
                </Drawer>
            </div>
        </PageTransition >
    )
}
