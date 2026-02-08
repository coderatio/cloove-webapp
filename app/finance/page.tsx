"use client"

import * as React from 'react'
import DataTable from '../components/DataTable'
import { useIsMobile } from '../hooks/useMediaQuery'
import { PageTransition } from '../components/layout/page-transition'
import { ListCard } from '../components/ui/list-card'
import { GlassCard } from '../components/ui/glass-card'
import {
    Wallet,
    ArrowUpRight,
    ArrowDownRight,
    RefreshCcw,
    CheckCircle2,
    Clock,
    MoreHorizontal,
    Filter,
    ArrowRightLeft,
    Banknote,
    Receipt,
    ChevronRight,
    ChevronLeft
} from 'lucide-react'
import { cn } from '@/app/lib/utils'
import { ManagementHeader } from '../components/shared/ManagementHeader'
import { InsightWhisper } from '../components/dashboard/InsightWhisper'
import { useBusiness } from '../components/BusinessProvider'
import { Button } from '../components/ui/button'
import {
    Drawer,
    DrawerContent,
    DrawerStickyHeader,
    DrawerTitle,
    DrawerDescription,
    DrawerClose,
} from "../components/ui/drawer"
import { motion, AnimatePresence } from 'framer-motion'
import { FilterPopover } from '../components/shared/FilterPopover'
import { TableSearch } from '../components/shared/TableSearch'

const initialTransactions = [
    { id: 'TX-9021', type: 'Credit', amount: '₦45,000', customer: 'Mrs. Adebayo', status: 'Cleared', date: 'Today, 10:30 AM', method: 'Bank Transfer' },
    { id: 'TX-9022', type: 'Credit', amount: '₦12,500', customer: 'Chief Okonkwo', status: 'Pending', date: 'Today, 09:15 AM', method: 'Bank Transfer' },
    { id: 'TX-9023', type: 'Debit', amount: '₦8,000', customer: 'Vendor: Alaba Textiles', status: 'Cleared', date: 'Yesterday', method: 'Cash' },
    { id: 'TX-9024', type: 'Credit', amount: '₦24,000', customer: 'Blessing Stores', status: 'Cleared', date: 'Yesterday', method: 'POS' },
    { id: 'TX-9025', type: 'Credit', amount: '₦15,800', customer: 'Mama Tunde', status: 'Pending', date: 'Feb 5', method: 'Bank Transfer' },
    { id: 'TX-9026', type: 'Debit', amount: '₦50,000', customer: 'Rent: Feb 2026', status: 'Cleared', date: 'Feb 1', method: 'Bank Transfer' },
    { id: 'TX-9027', type: 'Credit', amount: '₦5,500', customer: 'Grace Fashion', status: 'Cleared', date: 'Jan 31', method: 'Cash' },
]

export default function FinancePage() {
    const isMobile = useIsMobile()
    const { stores, currentStore, setCurrentStore } = useBusiness()
    const [transactions, setTransactions] = React.useState(initialTransactions)
    const [search, setSearch] = React.useState("")
    const [selectedFilters, setSelectedFilters] = React.useState<string[]>([])
    const [viewingTx, setViewingTx] = React.useState<any>(null)
    const [isRequerying, setIsRequerying] = React.useState(false)

    const filterGroups = [
        {
            title: "Store Location",
            options: stores.map(s => ({ label: s.name, value: s.id }))
        },
        {
            title: "Transaction Status",
            options: [
                { label: "Cleared", value: "Cleared" },
                { label: "Pending", value: "Pending" },
            ]
        },
        {
            title: "Type",
            options: [
                { label: "Revenue (Credit)", value: "Credit" },
                { label: "Expense (Debit)", value: "Debit" },
            ]
        }
    ]

    const walletBalance = "₦245,800"
    const pendingReconciliation = transactions.filter(t => t.status === 'Pending').length
    const totalRevenue = transactions
        .filter(t => t.type === 'Credit')
        .reduce((acc, curr) => acc + (parseInt(curr.amount.replace(/[^0-9]/g, '')) || 0), 0)

    const filteredTransactions = transactions.filter(t => {
        const matchesSearch = t.customer.toLowerCase().includes(search.toLowerCase()) || t.id.toLowerCase().includes(search.toLowerCase())
        const matchesFilters = selectedFilters.length === 0 || selectedFilters.includes(t.status) || selectedFilters.includes(t.type) || selectedFilters.includes(currentStore.id)
        return matchesSearch && matchesFilters
    })

    const handleRequery = async () => {
        setIsRequerying(true)
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 2000))

        if (viewingTx.id === 'TX-9022') {
            setTransactions((prev: any[]) => prev.map(t =>
                t.id === viewingTx.id ? { ...t, status: 'Cleared' } : t
            ))
            setViewingTx((prev: any) => ({ ...prev, status: 'Cleared' }))
        }
        setIsRequerying(false)
    }

    const handleClearManual = () => {
        setTransactions(prev => prev.map(t =>
            t.id === viewingTx.id ? { ...t, status: 'Cleared' } : t
        ))
        setViewingTx(null)
    }

    const columns: any[] = [
        {
            key: 'id',
            header: 'TX ID',
            render: (value: string) => <span className="font-mono text-[10px] text-brand-accent/40 dark:text-brand-cream/40">{value}</span>
        },
        {
            key: 'customer',
            header: 'Entity / Purpose',
            render: (value: string, row: any) => (
                <div className="flex flex-col">
                    <span className="font-medium text-brand-deep dark:text-brand-cream">{value}</span>
                    <span className="text-[10px] text-brand-accent/40 dark:text-brand-cream/40">{row.method}</span>
                </div>
            )
        },
        {
            key: 'amount',
            header: 'Amount',
            render: (value: string, row: any) => (
                <span className={cn(
                    "font-serif font-medium",
                    row.type === 'Credit' ? "text-brand-green dark:text-brand-gold" : "text-rose-600 dark:text-rose-400"
                )}>
                    {row.type === 'Credit' ? '+' : '-'}{value}
                </span>
            )
        },
        {
            key: 'status',
            header: 'Status',
            render: (value: string) => (
                <div className="flex items-center gap-1.5">
                    {value === 'Cleared' ? (
                        <CheckCircle2 className="w-3 h-3 text-brand-green dark:text-emerald-400" />
                    ) : (
                        <Clock className="w-3 h-3 text-amber-500 animate-pulse" />
                    )}
                    <span className={cn(
                        "text-[10px] font-bold uppercase tracking-wider",
                        value === 'Cleared' ? "text-brand-green dark:text-emerald-400" : "text-amber-600 dark:text-amber-400"
                    )}>
                        {value}
                    </span>
                </div>
            )
        },
        { key: 'date', header: 'Date' },
    ]

    const intelligenceWhisper = pendingReconciliation > 0
        ? `You have **${pendingReconciliation} payments** pending reconciliation. Use the **Re-query** tool to automatically verify bank transfers.`
        : `Your books are perfectly reconciled. All transactions have been cleared for the current period.`

    return (
        <PageTransition>
            <div className="max-w-5xl mx-auto space-y-8 pb-24">
                <ManagementHeader
                    title="Finance"
                    description={`Monitor cash flow and reconcile transactions for ${currentStore.name}.`}
                />

                <div className="space-y-6">
                    {/* Focused Insight - Now full width at the top when relevant */}
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
                        {/* Wallet Section - Spans 8 cols */}
                        <div className="lg:col-span-8 space-y-4">
                            <GlassCard className="p-8 relative overflow-hidden group border-brand-gold/20 bg-gradient-to-br from-white/50 to-brand-gold/5 dark:from-white/5 dark:to-brand-gold/5 min-h-[300px] flex flex-col justify-between">
                                <div className="absolute right-0 top-0 p-6 opacity-10 group-hover:opacity-20 transition-all duration-700 -rotate-12 group-hover:rotate-0">
                                    <Wallet className="w-48 h-48 text-brand-gold" />
                                </div>

                                <div className="relative z-10">
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-brand-green animate-pulse" />
                                        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-accent/40 dark:text-white/30">Business Balance</p>
                                    </div>
                                    <h2 className="text-6xl font-serif font-medium text-brand-deep dark:text-brand-cream tracking-tight">{walletBalance}</h2>
                                </div>

                                <div className="relative z-10 flex gap-4">
                                    <Button className="flex-1 h-16 rounded-2xl bg-brand-deep text-brand-gold dark:bg-brand-gold dark:text-brand-deep font-bold shadow-2xl flex items-center justify-center gap-3 group/btn hover:scale-[1.02] active:scale-95 transition-all">
                                        <ArrowUpRight className="w-6 h-6 transition-transform group-hover/btn:-translate-y-1 group-hover/btn:translate-x-1" />
                                        Withdraw
                                    </Button>
                                    <Button variant="outline" className="flex-1 h-16 rounded-2xl border-brand-deep/10 bg-white/50 dark:bg-white/5 font-bold flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-95 transition-all">
                                        <ArrowDownRight className="w-6 h-6 text-brand-green" />
                                        Add Funds
                                    </Button>
                                </div>
                            </GlassCard>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <GlassCard className="p-6 flex items-center gap-4 border-brand-deep/5 bg-white/40 dark:bg-white/5 backdrop-blur-md">
                                    <div className="h-12 w-12 rounded-2xl bg-brand-green/10 flex items-center justify-center text-brand-green shadow-inner">
                                        <ArrowRightLeft className="h-6 w-6" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold text-brand-accent/40 uppercase tracking-[0.2em] mb-1">Total Revenue</p>
                                        <p className="text-xl font-serif font-medium text-brand-deep dark:text-brand-cream">₦{totalRevenue.toLocaleString()}</p>
                                    </div>
                                </GlassCard>
                                <GlassCard className="p-6 flex items-center gap-4 border-brand-deep/5 bg-white/40 dark:bg-white/5 backdrop-blur-md">
                                    <div className="h-12 w-12 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-500 shadow-inner">
                                        <Clock className="h-6 w-6" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold text-brand-accent/40 uppercase tracking-[0.2em] mb-1">Pending Clear</p>
                                        <p className="text-xl font-serif font-medium text-brand-deep dark:text-brand-cream">{pendingReconciliation} items</p>
                                    </div>
                                </GlassCard>
                            </div>
                        </div>

                        {/* Financial Tools - Spans 4 cols */}
                        <div className="lg:col-span-4 space-y-4 h-full">
                            <GlassCard className="p-8 h-full bg-brand-deep/[0.02] dark:bg-white/[0.02] border-brand-deep/5 flex flex-col justify-between min-h-[400px]">
                                <div>
                                    <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-brand-accent/40 dark:text-brand-cream/40 mb-8 border-b border-brand-deep/5 pb-4">Financial Utils</h3>
                                    <div className="space-y-3">
                                        <button className="w-full flex items-center justify-between p-5 rounded-3xl bg-white/80 dark:bg-white/5 border border-brand-deep/5 hover:border-brand-gold/30 hover:shadow-xl transition-all text-left group active:scale-95">
                                            <div className="flex items-center gap-4">
                                                <div className="h-10 w-10 rounded-xl bg-brand-green/5 dark:bg-white/5 flex items-center justify-center group-hover:bg-brand-gold/10 transition-colors">
                                                    <Receipt className="w-5 h-5 text-brand-accent/40 dark:text-brand-cream/60 group-hover:text-brand-gold transition-colors" />
                                                </div>
                                                <span className="text-sm font-semibold text-brand-deep dark:text-brand-cream/80">Tax Report</span>
                                            </div>
                                            <ChevronRight className="w-4 h-4 text-brand-accent/20 dark:text-brand-cream/30 group-hover:text-brand-gold group-hover:translate-x-1 transition-all" />
                                        </button>
                                        <button className="w-full flex items-center justify-between p-5 rounded-3xl bg-white/80 dark:bg-white/5 border border-brand-deep/5 hover:border-brand-gold/30 hover:shadow-xl transition-all text-left group active:scale-95">
                                            <div className="flex items-center gap-4">
                                                <div className="h-10 w-10 rounded-xl bg-brand-green/5 dark:bg-white/5 flex items-center justify-center group-hover:bg-brand-gold/10 transition-colors">
                                                    <Banknote className="w-5 h-5 text-brand-accent/40 dark:text-brand-cream/60 group-hover:text-brand-gold transition-colors" />
                                                </div>
                                                <span className="text-sm font-semibold text-brand-deep dark:text-brand-cream/80">Statements</span>
                                            </div>
                                            <ChevronRight className="w-4 h-4 text-brand-accent/20 dark:text-brand-cream/30 group-hover:text-brand-gold group-hover:translate-x-1 transition-all" />
                                        </button>
                                    </div>
                                </div>

                                <div className="mt-8 p-6 rounded-2xl bg-brand-gold/5 border border-brand-gold/10 text-center relative overflow-hidden bg-[radial-gradient(circle_at_top_right,rgba(182,143,76,0.1),transparent)]">
                                    <p className="relative z-10 text-[10px] font-bold text-brand-gold uppercase tracking-[0.2em] leading-relaxed">
                                        Secure & Verified <br /> Gateway
                                    </p>
                                </div>
                            </GlassCard>
                        </div>
                    </div>
                </div>

                {/* Main Transaction List */}
                <div className="space-y-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand-accent/40 dark:text-white/30 ml-1">Recent Transactions</p>

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
                            {filteredTransactions.map((tx, index) => (
                                <ListCard
                                    key={tx.id}
                                    title={tx.customer}
                                    subtitle={`${tx.id} • ${tx.method}`}
                                    status={tx.status}
                                    statusColor={tx.status === 'Cleared' ? 'success' : 'warning'}
                                    value={tx.amount}
                                    valueLabel={tx.type === 'Credit' ? 'Inbound' : 'Outbound'}
                                    delay={index * 0.05}
                                    onClick={() => setViewingTx(tx)}
                                />
                            ))}
                        </div>
                    ) : (
                        <GlassCard className="overflow-hidden border-brand-deep/5 dark:border-white/5">
                            <DataTable
                                columns={columns}
                                data={filteredTransactions}
                                emptyMessage="No transactions matching your criteria."
                                onRowClick={setViewingTx}
                                pageSize={8}
                            />
                        </GlassCard>
                    )}
                </div>

                {/* Reconciliation Drawer */}
                <Drawer
                    open={!!viewingTx}
                    onOpenChange={(open) => !open && setViewingTx(null)}
                >
                    <DrawerContent>
                        <DrawerStickyHeader>
                            <DrawerTitle>Verify Transaction</DrawerTitle>
                            <DrawerDescription>
                                {viewingTx?.id}: {viewingTx?.customer} ({viewingTx?.amount})
                            </DrawerDescription>
                        </DrawerStickyHeader>

                        <div className="p-8 pb-12 overflow-y-auto">
                            <div className="max-w-lg mx-auto space-y-8">
                                <div className="space-y-4">
                                    <h3 className="text-[10px] font-bold uppercase tracking-widest text-brand-accent/40 dark:text-white/30 ml-1">Transaction Status</h3>
                                    <GlassCard className={cn(
                                        "p-6 flex items-center justify-between border-brand-deep/5 transition-colors",
                                        viewingTx?.status === 'Cleared' ? "bg-brand-green/5 border-brand-green/20" : "bg-amber-500/5 border-amber-500/20"
                                    )}>
                                        <div className="flex items-center gap-4">
                                            <div className={cn(
                                                "h-12 w-12 rounded-full flex items-center justify-center",
                                                viewingTx?.status === 'Cleared' ? "bg-brand-green/20 text-brand-green" : "bg-amber-500/20 text-amber-500"
                                            )}>
                                                {viewingTx?.status === 'Cleared' ? <CheckCircle2 className="w-6 h-6" /> : <Clock className="w-6 h-6 animate-pulse" />}
                                            </div>
                                            <div>
                                                <p className="font-bold text-lg">{viewingTx?.status}</p>
                                                <p className="text-xs text-brand-accent/40 dark:text-brand-cream/40">Verified via {viewingTx?.method}</p>
                                            </div>
                                        </div>
                                        {viewingTx?.status === 'Pending' && (
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={handleRequery}
                                                disabled={isRequerying}
                                                className="h-10 rounded-xl border-brand-gold/30 text-brand-gold hover:bg-brand-gold/10"
                                            >
                                                <RefreshCcw className={cn("w-4 h-4 mr-2", isRequerying && "animate-spin")} />
                                                {isRequerying ? "Querying..." : "Re-query API"}
                                            </Button>
                                        )}
                                    </GlassCard>
                                </div>

                                <div className="space-y-4">
                                    <h3 className="text-[10px] font-bold uppercase tracking-widest text-brand-accent/40 dark:text-white/30 ml-1">Payment Details</h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="p-4 rounded-2xl bg-brand-deep/5 dark:bg-white/5">
                                            <p className="text-[10px] font-bold text-brand-accent/40 uppercase tracking-widest mb-1">Inbound Amount</p>
                                            <p className="text-xl font-serif font-medium text-brand-deep dark:text-brand-cream">{viewingTx?.amount}</p>
                                        </div>
                                        <div className="p-4 rounded-2xl bg-brand-deep/5 dark:bg-white/5">
                                            <p className="text-[10px] font-bold text-brand-accent/40 uppercase tracking-widest mb-1">Time Initiated</p>
                                            <p className="text-sm font-medium text-brand-deep dark:text-brand-cream">{viewingTx?.date}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex gap-4 pt-6">
                                    {viewingTx?.status === 'Pending' ? (
                                        <Button
                                            onClick={handleClearManual}
                                            className="flex-1 h-14 rounded-2xl bg-brand-deep text-brand-gold dark:bg-brand-gold dark:text-brand-deep font-bold shadow-xl"
                                        >
                                            Mark as Cleared Manually
                                        </Button>
                                    ) : (
                                        <DrawerClose asChild>
                                            <Button className="flex-1 h-14 rounded-2xl bg-brand-deep text-brand-gold dark:bg-brand-gold dark:text-brand-deep font-bold shadow-xl">
                                                Done
                                            </Button>
                                        </DrawerClose>
                                    )}
                                </div>
                            </div>
                        </div>
                    </DrawerContent>
                </Drawer>
            </div>
        </PageTransition>
    )
}
