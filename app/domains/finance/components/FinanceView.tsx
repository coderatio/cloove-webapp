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
    RefreshCcw,
    CheckCircle2,
    Clock,
    XCircle,
    Loader2,
    ArrowRightLeft,
    Banknote,
    Receipt,
    ChevronLeft,
    ChevronRight,
    Copy,
    Eye,
    EyeOff,
    CreditCard,
    Globe,
    Share2,
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
    DrawerClose,
    DrawerBody,
} from "@/app/components/ui/drawer"
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
import type { FinanceTransactionMock } from '../data/financeMocks'
import { useFinanceSummary, useFinanceTransactions, type TransactionFilterParams } from '../hooks/useFinance'
import { useSettings, useUpdateBusinessSettings } from '@/app/domains/business/hooks/useBusinessSettings'
import { Skeleton } from '@/app/components/ui/skeleton'
import { VisuallyHidden } from '@/app/components/ui/visually-hidden'
import { Badge } from '@/app/components/ui/badge'

const WALLET_BALANCE_NUMERIC = 0

function getTransactionCategory(method: string | undefined): { label: string; variant: 'success' | 'warning' | 'gold' | 'outline' } {
    if (!method) return { label: 'Other', variant: 'outline' }
    const m = method.toLowerCase()
    if (m.includes('sale') || m.includes('refund')) return { label: 'Sale', variant: 'success' }
    if (m.includes('expense') || m.includes('supplier') || m.includes('debt')) return { label: 'Expense', variant: 'warning' }
    if (m.includes('wallet') || m.includes('withdrawal') || m.includes('deposit')) return { label: 'Wallet', variant: 'gold' }
    return { label: 'Other', variant: 'outline' }
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
    const [selectedStoreId, setSelectedStoreId] = React.useState<string>(currentStore?.id || 'all-stores')
    const [currentPage, setCurrentPage] = React.useState(1)

    const statusFilterOptions = [
        { label: "Cleared", value: "Cleared" },
        { label: "Pending", value: "Pending" },
        { label: "Processing", value: "Processing" },
        { label: "Failed", value: "Failed" },
    ] as const
    const typeFilterOptions = [
        { label: "Revenue (Credit)", value: "Credit" },
        { label: "Expense (Debit)", value: "Debit" },
    ] as const
    const categoryFilterOptions = [
        { label: "Sale", value: "Sale" },
        { label: "Expense", value: "Expense" },
        { label: "Wallet", value: "Wallet" },
        { label: "Other", value: "Other" },
    ] as const

    // Parse selectedFilters array into structured server-side filter params
    const serverFilters = React.useMemo<TransactionFilterParams>(() => {
        const status = selectedFilters.filter(f => statusFilterOptions.some(o => o.value === f))
        const type = selectedFilters.filter(f => typeFilterOptions.some(o => o.value === f))
        const category = selectedFilters.filter(f => categoryFilterOptions.some(o => o.value === f))
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
    const [isRequerying, setIsRequerying] = React.useState(false)
    const [isAddMoneyOpen, setIsAddMoneyOpen] = React.useState(false)
    const [isWithdrawOpen, setIsWithdrawOpen] = React.useState(false)
    const [isPayoutSettingsOpen, setIsPayoutSettingsOpen] = React.useState(false)
    const [withdrawInitialStep, setWithdrawInitialStep] = React.useState<"details" | "manage_payouts">("details")

    const { data: settings } = useSettings()
    const updateSettings = useUpdateBusinessSettings()

    const showBalance = settings?.business?.configs?.show_wallet_balance ?? true

    const toggleBalance = () => {
        updateSettings.mutate({
            show_wallet_balance: !showBalance,
            quiet: true
        })
    }

    const transactions = useApi ? apiTransactions.map(t => ({ ...t, amountNumeric: t.amount })) : mockTransactions
    const isFetching = useApi ? (summaryFetching || transactionsFetching) : false
    const isLoading = useApi ? transactionsLoading : false

    const filterGroups: (FilterGroup & { key: string })[] = [
        { key: 'storeId', title: "Store Location", options: stores.map(s => ({ label: s.name, value: s.id })) },
        { key: 'status', title: "Transaction Status", options: [...statusFilterOptions] },
        { key: 'type', title: "Type", options: [...typeFilterOptions] },
        { key: 'category', title: "Category", options: [...categoryFilterOptions] },
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
        const activeStatuses = new Set(selectedFilters.filter(f => statusFilterOptions.some(o => o.value === f)))
        const activeTypes = new Set(selectedFilters.filter(f => typeFilterOptions.some(o => o.value === f)))
        const activeStores = new Set(selectedFilters.filter(f => stores.some(s => s.id === f)))
        const activeCategories = new Set(selectedFilters.filter(f => categoryFilterOptions.some(o => o.value === f)))

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

    const handleRequery = async () => {
        if (!viewingTx || isApiRow(viewingTx)) return
        setIsRequerying(true)
        await new Promise(resolve => setTimeout(resolve, 2000))
        if (viewingTx.id === 'TX-9022') {
            setMockTransactions(prev => prev.map(t =>
                t.id === viewingTx.id ? { ...t, status: 'Cleared' as const } : t
            ))
            setViewingTx(prev => prev ? { ...prev, status: 'Cleared' as const } : null)
        }
        setIsRequerying(false)
    }

    const handleClearManual = () => {
        if (!viewingTx || isApiRow(viewingTx)) return
        setMockTransactions(prev => prev.map(t =>
            t.id === viewingTx.id ? { ...t, status: 'Cleared' as const } : t
        ))
        setViewingTx(null)
    }

    const showMockActions = viewingTx && !isApiRow(viewingTx)

    const selectedStoreName = selectedStoreId === 'all-stores' ? 'your business' : stores.find(s => s.id === selectedStoreId)?.name || 'your business'

    const columns: any[] = [
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
                        isCredit ? "bg-brand-green/10 text-brand-green" : "bg-rose-500/10 text-rose-500"
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
            render: (value: string, row: any) => {
                const { label, variant } = getTransactionCategory(row.method)
                const fullRef = String(row.reference ?? row.id ?? '')
                return (
                    <div className="flex flex-col gap-0.5 min-w-0 overflow-hidden">
                        <div className="flex items-center gap-2 overflow-hidden">
                            <span className="font-medium text-brand-deep dark:text-brand-cream truncate flex-1 min-w-0" title={value}>
                                {value}
                            </span>
                            <Badge variant={variant} className="shrink-0 text-[9px] px-1.5 py-0.5 font-bold uppercase tracking-wider">{label}</Badge>
                        </div>
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
                            {row.type === 'Credit' ? '+' : '-'}{formatted}
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
            render: (value: string) => {
                const isCleared = value === 'Cleared'
                const isFailed = value === 'Failed'
                const isProcessing = value === 'Processing'
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
                            {value}
                        </span>
                    </div>
                )
            }
        },
        {
            key: 'date',
            header: 'Date',
            render: (value: string) => (
                <span className="text-xs text-brand-accent/60 dark:text-brand-cream/60 tabular-nums">
                    {value}
                </span>
            )
        },
    ]

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

                        <div className="flex items-center gap-3">
                            <TableSearch
                                value={search}
                                onChange={setSearch}
                                placeholder="Search transactions..."
                            />
                            <FilterPopover
                                groups={filterGroups}
                                selectedValues={selectedFilters}
                                onSelectionChange={setSelectedFilters}
                                onClear={() => setSelectedFilters([])}
                            />
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
                                    return (
                                        <ListCard
                                            key={tx.id}
                                            title={tx.customer}
                                            icon={Icon}
                                            iconClassName={isCredit ? "text-brand-green dark:text-brand-gold" : "text-rose-500 dark:text-rose-400"}
                                            subtitle={`${(tx as any).reference ?? tx.id} • ${tx.method}`}
                                            status={tx.status}
                                            statusColor={tx.status === 'Cleared' ? 'success' : tx.status === 'Failed' ? 'danger' : 'warning'}
                                            value={(isCredit ? '+' : '-') + formatCurrency(num, { currency: currencyCode })}
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

                <Drawer
                    open={!!viewingTx}
                    onOpenChange={(open) => !open && setViewingTx(null)}
                >
                    <DrawerContent className="max-h-[92vh]">
                        <VisuallyHidden>
                            <DrawerTitle>Transaction Details</DrawerTitle>
                            <DrawerDescription>View detailed information about this transaction.</DrawerDescription>
                        </VisuallyHidden>
                        <DrawerStickyHeader className="border-b-0 pb-0">
                            <div className="flex flex-col items-center text-center pt-4">
                                <div className={cn(
                                    "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-[0.2em] mb-4 flex items-center gap-2",
                                    viewingTx?.type === 'Credit'
                                        ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                                        : "bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20"
                                )}>
                                    {viewingTx?.type === 'Credit' ? <ArrowDownRight className="w-3 h-3" /> : <ArrowUpRight className="w-3 h-3" />}
                                    {viewingTx?.type === 'Credit' ? 'Inbound Payment' : 'Outbound Transfer'}
                                </div>

                                <h2 className="text-5xl sm:text-7xl font-serif font-medium text-brand-deep dark:text-brand-cream">
                                    {viewingTx ? (
                                        <CurrencyDisplay
                                            value={(viewingTx as any).amountNumeric ?? (typeof (viewingTx as any).amount === 'number' ? (viewingTx as any).amount : parseCurrencyToNumber((viewingTx as any).amount))}
                                            currency={currencyCode}
                                            className="justify-center"
                                        />
                                    ) : '—'}
                                </h2>

                                <p className="text-brand-accent/60 dark:text-brand-cream/60 font-medium mt-2">
                                    {/* For sales, prefer customer name. For withdrawals, show bank name. Else show description. */}
                                    {viewingTx?.sale?.customerName
                                        ? viewingTx.sale.customerName
                                        : viewingTx?.withdrawal
                                            ? viewingTx.withdrawal.bankName
                                            : viewingTx?.customer}
                                </p>
                            </div>
                        </DrawerStickyHeader>

                        <DrawerBody className="pb-12 pt-8">
                            <div className="max-w-2xl mx-auto space-y-8">
                                {/* Status Card */}
                                <div className="px-1">
                                    <div className={cn(
                                        "p-1 rounded-4xl border transition-all duration-500",
                                        viewingTx?.status === 'Cleared' && "bg-emerald-500/5 border-emerald-500/10",
                                        (viewingTx?.status === 'Pending' || viewingTx?.status === 'Processing') && "bg-amber-500/5 border-amber-500/10",
                                        viewingTx?.status === 'Failed' && "bg-rose-500/5 border-rose-500/10"
                                    )}>
                                        <div className="flex items-center justify-between p-4 pr-6">
                                            <div className="flex items-center gap-4">
                                                <div className={cn(
                                                    "h-14 w-14 rounded-2xl flex items-center justify-center shadow-sm",
                                                    viewingTx?.status === 'Cleared' && "bg-emerald-500 text-white shadow-emerald-500/20",
                                                    (viewingTx?.status === 'Pending' || viewingTx?.status === 'Processing') && "bg-amber-500 text-white shadow-amber-500/20",
                                                    viewingTx?.status === 'Failed' && "bg-rose-500 text-white shadow-rose-500/20"
                                                )}>
                                                    {viewingTx?.status === 'Cleared' && <CheckCircle2 className="w-7 h-7" />}
                                                    {(viewingTx?.status === 'Pending' || viewingTx?.status === 'Processing') && <Clock className={cn("w-7 h-7", viewingTx?.status === 'Processing' && "animate-pulse")} />}
                                                    {viewingTx?.status === 'Failed' && <XCircle className="w-7 h-7" />}
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-bold uppercase tracking-widest text-brand-accent/40 dark:text-white/30 mb-0.5">Payment Status</p>
                                                    <p className="font-bold text-xl text-brand-deep dark:text-brand-cream">{viewingTx?.status}</p>
                                                </div>
                                            </div>

                                            {(viewingTx?.status === 'Pending' || viewingTx?.status === 'Processing') && showMockActions ? (
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={handleRequery}
                                                    disabled={isRequerying}
                                                    className="h-10 rounded-xl border-brand-gold/30 text-brand-gold hover:bg-brand-gold/10 px-4"
                                                >
                                                    <RefreshCcw className={cn("w-4 h-4 mr-2", isRequerying && "animate-spin")} />
                                                    {isRequerying ? "Querying..." : "Re-query"}
                                                </Button>
                                            ) : (
                                                <div className="text-right">
                                                    <p className="text-[10px] font-bold uppercase tracking-widest text-brand-accent/40 dark:text-white/30 mb-0.5">Verification</p>
                                                    <p className="text-sm font-medium text-brand-deep dark:text-brand-cream">
                                                        {viewingTx?.status === 'Cleared'
                                                            ? 'Fully Verified'
                                                            : viewingTx?.status === 'Failed'
                                                                ? 'Declined'
                                                                : viewingTx?.status === 'Processing'
                                                                    ? 'In Progress'
                                                                    : 'Awaiting'}
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Data Grid */}
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between px-1">
                                        <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-accent/40 dark:text-white/30">Transaction Information</h3>
                                        <Badge variant="outline" className="text-[9px] uppercase tracking-wider h-5 flex items-center">{viewingTx?.method}</Badge>
                                    </div>

                                    <div className="grid grid-cols-1 gap-3">
                                        {/* Core Details Group */}
                                        <div className="p-6 rounded-[2.5rem] bg-brand-deep/5 dark:bg-white/5 border border-brand-deep/5 dark:border-white/5 space-y-6">
                                            <div className="flex items-center justify-between group">
                                                <div>
                                                    <p className="text-[10px] font-bold text-brand-accent/40 dark:text-brand-cream/40 uppercase tracking-widest mb-1">Reference ID</p>
                                                    <p className="text-sm font-mono font-medium text-brand-deep dark:text-brand-cream truncate">
                                                        {(viewingTx as any)?.reference ?? viewingTx?.id ?? '—'}
                                                    </p>
                                                </div>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 rounded-xl transition-all duration-300 bg-brand-deep/5 dark:bg-white/5 hover:bg-brand-deep/10 dark:hover:bg-white/10"
                                                    onClick={() => {
                                                        const id = (viewingTx as any)?.reference ?? viewingTx?.id ?? ''
                                                        navigator.clipboard.writeText(id)
                                                        toast.success('ID copied to clipboard')
                                                    }}
                                                >
                                                    <Copy className="w-3.5 h-3.5" />
                                                </Button>
                                            </div>

                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p className="text-[10px] font-bold text-brand-accent/40 dark:text-brand-cream/40 uppercase tracking-widest mb-1.5">Transaction Type</p>
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-5 h-5 rounded-md bg-brand-gold/10 flex items-center justify-center">
                                                            <CreditCard className="w-3 h-3 text-brand-gold" />
                                                        </div>
                                                        <p className="text-sm font-medium text-brand-deep dark:text-brand-cream">{viewingTx?.method}</p>
                                                    </div>
                                                </div>
                                                {viewingTx?.storeId && (
                                                    <div className="text-right">
                                                        <p className="text-[10px] font-bold text-brand-accent/40 dark:text-brand-cream/40 uppercase tracking-widest mb-1.5">Location</p>
                                                        <div className="flex items-center justify-end gap-2">
                                                            <p className="text-sm font-medium text-brand-deep dark:text-brand-cream">
                                                                {stores.find(s => s.id === viewingTx?.storeId)?.name || 'Main Branch'}
                                                            </p>
                                                            <Globe className="w-3 h-3 text-emerald-500" />
                                                        </div>
                                                    </div>
                                                )}
                                            </div>

                                            <div className="pt-4 border-t border-brand-deep/5 dark:border-white/5">
                                                <p className="text-[10px] font-bold text-brand-accent/40 dark:text-brand-cream/40 uppercase tracking-widest mb-2">Time & Date</p>
                                                <div className="flex items-start justify-between gap-4">
                                                    <div>
                                                        <p className="text-sm font-medium text-brand-deep dark:text-brand-cream">
                                                            {viewingTx?.fullDate || viewingTx?.date}
                                                        </p>
                                                        <p className="text-[10px] text-brand-accent/40 dark:text-brand-cream/40 mt-1">
                                                            {viewingTx?.dateLabel || viewingTx?.date} • {' '}
                                                            {viewingTx?.status === 'Cleared'
                                                                ? 'Completed successfully'
                                                                : viewingTx?.status === 'Failed'
                                                                    ? 'Transaction failed'
                                                                    : viewingTx?.status === 'Processing'
                                                                        ? 'Processing payment'
                                                                        : 'Awaiting confirmation'}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Contextual Information Group */}
                                        {(viewingTx?.withdrawal || viewingTx?.sale) && (
                                            <div className="p-6 rounded-[2.5rem] bg-brand-deep/5 dark:bg-white/5 border border-brand-deep/5 dark:border-white/5">
                                                {viewingTx?.withdrawal && (
                                                    <div>
                                                        <p className="text-[10px] font-bold text-brand-accent/40 dark:text-brand-cream/40 uppercase tracking-widest mb-4">Destination Account</p>
                                                        <div className="flex items-center gap-4">
                                                            <div className="w-12 h-12 rounded-2xl bg-brand-deep/10 dark:bg-brand-gold/10 flex items-center justify-center">
                                                                <Banknote className="w-6 h-6 text-brand-deep dark:text-brand-gold" />
                                                            </div>
                                                            <div>
                                                                <p className="text-base font-bold text-brand-deep dark:text-brand-cream">{viewingTx.withdrawal.bankName}</p>
                                                                <p className="text-sm text-brand-accent/60 dark:text-brand-cream/60">{viewingTx.withdrawal.accountNumber} • {viewingTx.withdrawal.accountName}</p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}

                                                {viewingTx?.sale && (
                                                    <div className="space-y-6">
                                                        <div className="flex items-center justify-between">
                                                            <p className="text-[10px] font-bold text-brand-accent/40 dark:text-brand-cream/40 uppercase tracking-widest">Linked Sale</p>
                                                            <Badge variant="outline" className="text-[9px] uppercase tracking-wider">
                                                                {viewingTx.sale.status === 'COMPLETED' || viewingTx.sale.status === 'completed'
                                                                    ? 'Completed'
                                                                    : viewingTx.sale.status}
                                                            </Badge>
                                                        </div>
                                                        <div className="flex items-center justify-between gap-4">
                                                            <div>
                                                                <p className="text-base font-bold text-brand-deep dark:text-brand-cream">
                                                                    {viewingTx.sale.customerName || 'Walking Customer'}
                                                                </p>
                                                                <p className="text-sm text-brand-accent/60 dark:text-brand-cream/60 mt-0.5">Sale #{viewingTx.sale.shortCode}</p>
                                                            </div>
                                                            <div className="text-right shrink-0">
                                                                <p className="text-[10px] text-brand-accent/40 dark:text-brand-cream/40 uppercase tracking-widest mb-1">Sale Total</p>
                                                                <p className="text-base font-bold font-mono text-brand-deep dark:text-brand-cream">
                                                                    {formatCurrency(viewingTx.sale.totalAmount, { currency: currencyCode })}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex flex-col sm:flex-row gap-4 pt-4 px-1">
                                    <Button variant="outline" className="flex-1 h-14 rounded-3xl border-brand-deep/10 dark:border-white/10 font-bold flex items-center justify-center gap-3">
                                        <Share2 className="w-4 h-4" />
                                        Share Receipt
                                    </Button>

                                    {viewingTx?.status === 'Pending' && showMockActions ? (
                                        <Button
                                            onClick={handleClearManual}
                                            className="flex-1 h-14 rounded-3xl bg-brand-deep text-brand-gold dark:bg-brand-gold dark:hover:bg-brand-gold/80 dark:hover:text-brand-deep font-bold shadow-xl"
                                        >
                                            Approve Manually
                                        </Button>
                                    ) : (
                                        <DrawerClose asChild>
                                            <Button className="flex-1 h-14 rounded-3xl bg-brand-deep text-brand-gold dark:bg-brand-gold dark:hover:bg-brand-gold/80 dark:text-brand-deep dark:hover:text-brand-deep font-bold shadow-xl">
                                                Close
                                            </Button>
                                        </DrawerClose>
                                    )}
                                </div>
                            </div>
                        </DrawerBody>
                    </DrawerContent>
                </Drawer>


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
