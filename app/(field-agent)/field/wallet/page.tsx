"use client"

import { useState, useEffect, useRef } from "react"
import { motion } from "framer-motion"
import { useFieldAgentStats } from "@/app/domains/field-agent/hooks/useFieldAgentStats"
import { useFieldAgentWallet } from "@/app/domains/field-agent/hooks/useFieldAgentWallet"
import { useFieldAgentCashoutAccounts, useAddCashoutAccount } from "@/app/domains/field-agent/hooks/useFieldAgentCashoutAccounts"
import { useFieldAgentTransactions, useWithdraw } from "@/app/domains/field-agent/hooks/useFieldAgentTransactions"
import { CashoutAccountManager } from "@/app/domains/field-agent/components/CashoutAccountManager"
import { formatCurrency } from "@/app/lib/formatters"
import { GlassCard } from "@/app/components/ui/glass-card"
import { Button } from "@/app/components/ui/button"
import {
    Building2,
    ArrowRight,
    CheckCircle2,
    Loader2,
    Search,
    ChevronRight,
    Clock,
    Wallet,
    ArrowUpRight,
    CreditCard,
    Plus,
    Banknote,
    AlertCircle,
    Sparkles,
} from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/app/lib/utils"

import { AgentStatCard } from "@/app/components/field-agent/AgentStatCard"
import { PinInputDrawer } from "@/app/components/shared/PinInputDrawer"
import {
    Drawer,
    DrawerContent,
    DrawerStickyHeader,
    DrawerTitle,
    DrawerDescription,
    DrawerBody,
    DrawerFooter,
    DrawerClose,
} from "@/app/components/ui/drawer"
import { MoneyInput } from "@/app/components/ui/money-input"
import { Label } from "@/app/components/ui/label"

export default function WalletPage() {
    const { data: stats } = useFieldAgentStats()
    const { data: wallet } = useFieldAgentWallet()
    const { data: accounts = [], isLoading: isLoadingAccounts } = useFieldAgentCashoutAccounts()
    const { data: transactions = [], isLoading: isLoadingTxns } = useFieldAgentTransactions()
    const { mutateAsync: addAccount } = useAddCashoutAccount()
    const { mutateAsync: withdraw } = useWithdraw()

    const [activeDrawer, setActiveDrawer] = useState<'payout' | 'detail' | 'pin' | 'accounts' | null>(null)
    const [isPinDrawerOpen, setIsPinDrawerOpen] = useState(false)
    const [pinAction, setPinAction] = useState<'payout' | null>(null)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [payoutAmount, setPayoutAmount] = useState(0)
    const [selectedTxn, setSelectedTxn] = useState<typeof transactions[0] | null>(null)
    const [restoreDrawer, setRestoreDrawer] = useState<'payout' | 'detail' | null>(null)
    const [selectedAccount, setSelectedAccount] = useState<typeof accounts[0] | null>(null)
    const [showAccountPicker, setShowAccountPicker] = useState(false)


    const availableBalance = wallet?.availableBalance ?? 0
    const MIN_CASHOUT_THRESHOLD = wallet?.withdrawalThreshold ?? 5000
    const canCashout = availableBalance >= MIN_CASHOUT_THRESHOLD
    const progressPercentage = Math.min((availableBalance / MIN_CASHOUT_THRESHOLD) * 100, 100)
    const amountInputRef = useRef<HTMLInputElement>(null)

    // Auto-focus amount input when payout drawer opens
    useEffect(() => {
        if (activeDrawer === 'payout' && canCashout) {
            const timer = setTimeout(() => amountInputRef.current?.focus(), 250)
            return () => clearTimeout(timer)
        }
        if (activeDrawer !== 'payout') {
            setShowAccountPicker(false)
        }
    }, [activeDrawer, canCashout])

    // Seed selected account from default whenever accounts load or payout drawer opens
    useEffect(() => {
        if (activeDrawer === 'payout' && accounts.length > 0 && !selectedAccount) {
            setSelectedAccount(accounts.find(a => a.isDefault) ?? accounts[0])
        }
    }, [activeDrawer, accounts])



    const currency = wallet?.currency ?? 'NGN'
    const fmt = (val: number) => formatCurrency(val, { currency })

    // Pick default (or first) account for payout destination display
    const defaultAccount = accounts.find(a => a.isDefault) ?? accounts[0] ?? null

    const handleRequestPayout = async () => {
        if (payoutAmount <= 0) {
            toast.error('Please enter a valid amount')
            return
        }
        if (payoutAmount > (wallet?.availableBalance ?? 0)) {
            toast.error('Insufficient balance')
            return
        }
        if (!selectedAccount) {
            toast.error('Please add a payout account first')
            setActiveDrawer('accounts')
            return
        }

        // Transition to PIN verification
        setActiveDrawer(null)
        setPinAction('payout')
        setIsPinDrawerOpen(true)
    }

    const handlePayoutSubmit = async (pin: string) => {
        if (!selectedAccount) return
        await withdraw({ amount: payoutAmount, cashoutAccountId: selectedAccount.id, pin })
        toast.success(`Payout of ${fmt(payoutAmount)} requested successfully!`)
        setPayoutAmount(0)
        setSelectedAccount(null)
        setPinAction(null)
        setIsPinDrawerOpen(false)
    }

    const handlePinSubmit = async (pin: string) => {
        if (pinAction === 'payout') {
            await handlePayoutSubmit(pin)
        }
    }

    return (
        <div className="space-y-6 md:space-y-10 pb-20">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 md:gap-8">
                <div className="space-y-2">
                    <p className="text-[10px] font-black tracking-[0.4em] uppercase text-brand-gold">Financial Command</p>
                    <h1 className="text-3xl md:text-5xl font-serif font-medium text-brand-deep dark:text-brand-cream leading-tight">Earnings Hub</h1>
                </div>
                <Button
                    onClick={() => setActiveDrawer('payout')}
                    className="w-full md:w-auto bg-brand-deep text-white rounded-[24px] px-8 md:px-12 h-16 md:h-20 font-bold shadow-2xl shadow-brand-deep/20 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-3 md:gap-4"
                >
                    <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-brand-gold/10 flex items-center justify-center">
                        <ArrowUpRight className="w-4 h-4 md:w-5 md:h-5 text-brand-gold" />
                    </div>
                    Request Payout
                </Button>
            </div>

            {/* Financial Stats */}
            <div className="flex gap-4 overflow-x-auto py-3 lg:grid lg:grid-cols-3 lg:overflow-visible lg:pb-0 scrollbar-none">
                <div className="min-w-[300px] lg:min-w-0 shrink-0 lg:shrink">
                    <AgentStatCard
                        title="Lifetime Earnings"
                        value={fmt(stats?.totalEarned ?? 0)}
                        icon={Banknote}
                        trend={{ value: 12, isPositive: true }}
                    />
                </div>
                <div className="min-w-[300px] lg:min-w-0 shrink-0 lg:shrink">
                    <AgentStatCard
                        title="Available Balance"
                        value={fmt(wallet?.availableBalance ?? 0)}
                        icon={Wallet}
                        trend={{ value: 8, isPositive: true }}
                    />
                </div>
                <div className="min-w-[300px] lg:min-w-0 shrink-0 lg:shrink">
                    <AgentStatCard
                        title="Pending Payouts"
                        value={fmt(wallet?.pendingWithdrawals ?? 0)}
                        icon={CreditCard}
                    />
                </div>
            </div>

            <div className="w-full">
                {/* Audit Trail Section */}
                <GlassCard className="p-5 md:p-10 border-none shadow-2xl shadow-brand-deep/5 flex flex-col">
                    <div className="flex items-center justify-between mb-6 md:mb-10">
                        <div>
                            <h3 className="text-xl md:text-2xl font-serif font-medium text-brand-deep dark:text-brand-cream leading-none">Payouts</h3>
                            <p className="text-[10px] font-black uppercase tracking-widest text-brand-deep/20 mt-2.5">Historical cashouts</p>
                        </div>
                        <Button
                            variant="ghost"
                            onClick={() => setActiveDrawer('accounts')}
                            className="ml-auto bg-brand-gold/10 text-brand-gold hover:bg-brand-gold/20 rounded-2xl transition-all border border-brand-gold/20 gap-1.5 h-9 md:h-12 px-3 md:px-6"
                        >
                            <Building2 className="w-3.5 h-3.5 md:w-5 md:h-5 text-brand-gold shrink-0" />
                            <span className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.15em]">Accounts</span>
                        </Button>
                    </div>
                    <div className="space-y-4 md:space-y-6 flex-1">
                        {isLoadingTxns ? (
                            [1, 2, 3].map(i => (
                                <div key={i} className="h-16 rounded-2xl bg-brand-deep/5 dark:bg-white/5 animate-pulse" />
                            ))
                        ) : transactions.length === 0 ? (
                            <div className="py-12 flex flex-col items-center gap-3 text-center">
                                <Clock className="w-8 h-8 text-brand-deep/20" />
                                <p className="text-sm font-bold text-brand-deep/40 dark:text-brand-cream/40">No payouts yet</p>
                                <p className="text-[10px] font-black uppercase tracking-widest text-brand-deep/20">Your withdrawal history will appear here</p>
                            </div>
                        ) : (
                            transactions.map((txn) => (
                                <div
                                    key={txn.id}
                                    onClick={() => {
                                        setSelectedTxn(txn)
                                        setActiveDrawer('detail')
                                    }}
                                    className="flex items-center justify-between group cursor-pointer hover:translate-x-1 transition-all"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className={cn(
                                            "w-12 h-12 rounded-full flex items-center justify-center border group-hover:scale-105 transition-transform",
                                            txn.status === 'COMPLETED' || txn.status === 'SUCCESS'
                                                ? "bg-green-500/10 text-green-600 border-green-500/20"
                                                : txn.status === 'FAILED'
                                                    ? "bg-red-500/10 text-red-600 border-red-500/20"
                                                    : "bg-brand-gold/10 text-brand-gold border-brand-gold/20"
                                        )}>
                                            {txn.status === 'COMPLETED' || txn.status === 'SUCCESS'
                                                ? <CheckCircle2 className="w-6 h-6" />
                                                : txn.status === 'FAILED'
                                                    ? <AlertCircle className="w-6 h-6" />
                                                    : <Clock className="w-6 h-6" />
                                            }
                                        </div>
                                        <div>
                                            <p className="text-lg font-serif font-medium text-brand-deep dark:text-brand-cream leading-none">
                                                {fmt(txn.amount)}
                                            </p>
                                            <p className="text-[10px] text-brand-deep/30 uppercase tracking-[0.2em] font-black mt-1.5 leading-none">
                                                {new Date(txn.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                {" · "}
                                                {new Date(txn.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-end gap-1.5">
                                        <span className={cn(
                                            "text-[10px] font-black uppercase tracking-[0.2em] leading-none",
                                            txn.status === 'COMPLETED' || txn.status === 'SUCCESS' ? "text-green-600" :
                                                txn.status === 'FAILED' ? "text-red-600" : "text-brand-gold"
                                        )}>
                                            {txn.status.charAt(0) + txn.status.slice(1).toLowerCase()}
                                        </span>
                                        <div className={cn(
                                            "w-6 h-1 rounded-full",
                                            txn.status === 'COMPLETED' || txn.status === 'SUCCESS' ? "bg-green-500/10" :
                                                txn.status === 'FAILED' ? "bg-red-500/10" : "bg-brand-gold/10"
                                        )} />
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </GlassCard>
            </div>

            {/* Request Payout Drawer */}
            <Drawer open={activeDrawer === 'payout'} onOpenChange={(o) => { if (!o) { setActiveDrawer(null) } }}>
                <DrawerContent>
                    <DrawerStickyHeader>
                        <DrawerTitle className="text-4xl">Request Payout</DrawerTitle>
                        <DrawerDescription className="text-base mt-2">Enter the amount you wish to cashout to your primary bank account.</DrawerDescription>
                    </DrawerStickyHeader>
                    <DrawerBody className="space-y-8 px-8 py-10">
                        {!canCashout ? (
                            <div className="space-y-8">
                                <GlassCard className="p-8 border-brand-gold/20 bg-brand-gold/5 overflow-hidden relative">
                                    <div className="absolute -top-12 -right-12 w-32 h-32 bg-brand-gold/10 rounded-full blur-3xl" />

                                    <div className="relative z-10 space-y-6">
                                        <div className="flex items-start gap-4">
                                            <div className="w-12 h-12 rounded-2xl bg-brand-gold/20 flex items-center justify-center text-brand-gold shrink-0">
                                                <AlertCircle className="w-6 h-6" />
                                            </div>
                                            <div>
                                                <h3 className="text-xl font-serif font-medium text-brand-deep dark:text-brand-cream">Minimum Requirement</h3>
                                                <p className="text-sm text-brand-deep/60 dark:text-brand-cream/60 mt-1 leading-relaxed">
                                                    You need a minimum balance of <span className="font-bold text-brand-gold">{fmt(MIN_CASHOUT_THRESHOLD)}</span> to initiate a cashout. Continue growing your portfolio to unlock this feature.
                                                </p>
                                            </div>
                                        </div>

                                        <div className="space-y-3">
                                            <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-brand-deep/40 dark:text-brand-cream/40">
                                                <span>Goal Progress</span>
                                                <span className="text-green-800">{Math.round(progressPercentage)}%</span>
                                            </div>
                                            <div className="h-2 w-full bg-brand-deep/5 dark:bg-white/5 rounded-full overflow-hidden">
                                                <motion.div
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${progressPercentage}%` }}
                                                    transition={{ duration: 1, ease: "easeOut" }}
                                                    className="h-full bg-linear-to-r from-brand-gold/40 to-brand-gold rounded-full"
                                                />
                                            </div>
                                            <p className="text-[10px] font-bold italic text-brand-deep/30 dark:text-brand-cream/30 text-right">
                                                {fmt(availableBalance)} of {fmt(MIN_CASHOUT_THRESHOLD)}
                                            </p>
                                        </div>
                                    </div>
                                </GlassCard>

                                <div className="p-6 rounded-3xl bg-brand-deep/5 dark:bg-white/5 border border-dashed border-brand-deep/10 dark:border-white/10 flex items-center gap-4 text-brand-deep/40 dark:text-brand-cream/40">
                                    <Sparkles className="w-5 h-5 shrink-0" />
                                    <p className="text-xs font-medium italic">Earnings from activated merchants will automatically boost your reserve.</p>
                                </div>
                            </div>
                        ) : (
                            <>
                                <div className="space-y-6 flex flex-col items-start w-full">
                                    <Label className="text-[10px] font-black uppercase tracking-[0.3em] text-brand-deep dark:text-brand-cream ml-1 opacity-60">Cashout Amount</Label>

                                    <div className="relative group py-2 w-full">
                                        <div className="absolute inset-x-0 bottom-0 h-0.5 bg-brand-gold/60 origin-left scale-x-0 group-focus-within:scale-x-100 transition-transform duration-500 rounded-full" />

                                        <MoneyInput
                                            ref={amountInputRef}
                                            value={payoutAmount}
                                            onChange={setPayoutAmount}
                                            variant="headless"
                                            className="text-7xl md:text-8xl font-serif text-brand-deep dark:text-brand-cream"
                                            placeholder="0.00"
                                        />
                                    </div>


                                    <div className="w-full flex items-center justify-between px-1">
                                        <span className="text-xs font-bold text-brand-deep/40">Available: {fmt(availableBalance)}</span>
                                        <button
                                            onClick={() => setPayoutAmount(availableBalance)}
                                            className="text-[10px] font-black uppercase tracking-widest text-brand-gold hover:underline"
                                        >
                                            Max
                                        </button>
                                    </div>
                                </div>

                                {accounts.length === 0 ? (
                                    <div
                                        onClick={() => { setActiveDrawer('accounts'); setRestoreDrawer('payout') }}
                                        className="p-6 rounded-3xl border-2 border-dashed border-brand-deep/10 dark:border-white/10 flex flex-col items-center gap-3 text-center hover:border-brand-gold/40 hover:bg-brand-gold/5 transition-all cursor-pointer"
                                    >
                                        <AlertCircle className="w-6 h-6 text-brand-deep/20" />
                                        <p className="text-[10px] font-black uppercase tracking-widest text-brand-deep/40">No destination set</p>
                                        <p className="text-[9px] font-black uppercase tracking-widest text-brand-gold">Tap to Add Account</p>
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between px-1 mb-3">
                                            <p className="text-[10px] font-black uppercase tracking-widest text-brand-deep/40">Destination</p>
                                            <button
                                                onClick={() => setShowAccountPicker(v => !v)}
                                                className="text-[10px] font-black uppercase tracking-widest text-brand-gold hover:underline"
                                            >
                                                {showAccountPicker ? 'Done' : 'Change'}
                                            </button>
                                        </div>

                                        {showAccountPicker ? (
                                            <div className="space-y-2">
                                                {accounts.map(account => (
                                                    <button
                                                        key={account.id}
                                                        onClick={() => { setSelectedAccount(account); setShowAccountPicker(false) }}
                                                        className={cn(
                                                            "w-full flex items-center gap-4 p-4 rounded-[20px] border transition-all text-left",
                                                            selectedAccount?.id === account.id
                                                                ? "bg-brand-gold/10 border-brand-gold/40"
                                                                : "bg-brand-deep/3 dark:bg-white/3 border-brand-deep/5 hover:border-brand-gold/20 hover:bg-brand-gold/5"
                                                        )}
                                                    >
                                                        <div className={cn(
                                                            "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
                                                            selectedAccount?.id === account.id ? "bg-brand-gold text-brand-deep" : "bg-brand-deep/10 dark:bg-white/10 text-brand-deep/40 dark:text-brand-cream/40"
                                                        )}>
                                                            <Building2 className="w-5 h-5" />
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="font-bold text-brand-deep dark:text-brand-cream uppercase tracking-tight text-sm truncate">{account.bankName}</p>
                                                            <p className="text-[10px] font-mono text-brand-deep/40 dark:text-brand-cream/40">•••• {account.accountNumber.slice(-4)}</p>
                                                        </div>
                                                        {account.isDefault && (
                                                            <span className="text-[9px] font-black bg-brand-gold/10 text-brand-gold px-2 py-1 rounded-full uppercase tracking-wider shrink-0">Default</span>
                                                        )}
                                                        {selectedAccount?.id === account.id && (
                                                            <CheckCircle2 className="w-4 h-4 text-brand-gold shrink-0" />
                                                        )}
                                                    </button>
                                                ))}
                                            </div>
                                        ) : selectedAccount ? (
                                            <button
                                                onClick={() => setShowAccountPicker(true)}
                                                className="w-full flex items-center gap-4 p-5 rounded-3xl bg-brand-gold/5 border border-brand-gold/20 hover:bg-brand-gold/10 transition-all text-left"
                                            >
                                                <div className="w-12 h-12 rounded-2xl bg-brand-deep flex items-center justify-center text-brand-gold shrink-0">
                                                    <Building2 className="w-6 h-6" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-serif text-lg font-medium text-brand-deep dark:text-brand-cream truncate">{selectedAccount.bankName} • •••• {selectedAccount.accountNumber.slice(-4)}</p>
                                                    <p className="text-[10px] font-black uppercase tracking-widest text-brand-deep/30 mt-0.5">{selectedAccount.accountName}</p>
                                                </div>
                                                <ChevronRight className="w-4 h-4 text-brand-deep/20 shrink-0" />
                                            </button>
                                        ) : null}
                                    </div>
                                )}
                            </>
                        )}
                    </DrawerBody>
                    <DrawerFooter className="px-8 pb-12">
                        <div className="w-full h-px bg-brand-deep/5 dark:bg-white/5 my-2" />

                        <div className="flex flex-col gap-3">
                            <Button
                                disabled={isSubmitting || payoutAmount <= 0 || payoutAmount > availableBalance}
                                onClick={handleRequestPayout}
                                className="w-full h-16 md:h-20 bg-brand-deep text-white rounded-3xl font-bold flex items-center justify-center gap-3 shadow-2xl shadow-brand-deep/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
                            >
                                {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <ArrowUpRight className="w-5 h-5 text-brand-gold" />}
                                Request Cashout
                            </Button>
                        </div>
                    </DrawerFooter>
                </DrawerContent>
            </Drawer>

            {/* Manage Accounts Drawer */}
            <Drawer
                open={activeDrawer === 'accounts'}
                onOpenChange={(o) => { if (!o) { setActiveDrawer(restoreDrawer || null) } }}
            >
                <DrawerContent>
                    <DrawerStickyHeader>
                        <DrawerTitle className="text-4xl">Payout Destinations</DrawerTitle>
                        <DrawerDescription className="text-base mt-2">Configure where your earnings are settled.</DrawerDescription>
                    </DrawerStickyHeader>
                    <DrawerBody className="px-4 sm:px-1">
                        <div className="max-w-xl mx-auto">
                            <CashoutAccountManager
                                onClose={() => setActiveDrawer(restoreDrawer || null)}
                                showBackButton={false}
                            />
                        </div>
                    </DrawerBody>
                </DrawerContent>
            </Drawer>

            <PinInputDrawer
                open={isPinDrawerOpen}
                onOpenChange={(open) => {
                    setIsPinDrawerOpen(open)
                    if (!open && pinAction) {
                        if (pinAction === 'payout') setActiveDrawer('payout')
                        setPinAction(null)
                    }
                }}
                onSubmit={handlePinSubmit}
                title="Confirm Payout"
                description={`Enter your transaction PIN to authorize the cashout of ${fmt(payoutAmount)}.`}
            />

            {/* Transaction Detail Drawer */}
            <Drawer open={activeDrawer === 'detail'} onOpenChange={(o) => !o && setActiveDrawer(null)}>
                <DrawerContent>
                    <DrawerStickyHeader>
                        <DrawerTitle className="text-4xl text-brand-deep dark:text-brand-cream">Payout Audit</DrawerTitle>
                        <DrawerDescription className="text-base mt-2">Transaction metadata for your financial records.</DrawerDescription>
                    </DrawerStickyHeader>
                    <DrawerBody className="p-8">
                        {selectedTxn && (
                            <div className="space-y-6">
                                <div className="p-8 rounded-[40px] bg-brand-deep text-white flex flex-col items-center justify-center text-center space-y-4 shadow-2xl shadow-brand-deep/20 relative overflow-hidden">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-brand-gold/10 blur-3xl rounded-full -mr-16 -mt-16" />
                                    <div className={cn(
                                        "w-20 h-20 rounded-full flex items-center justify-center border",
                                        selectedTxn.status === 'COMPLETED' || selectedTxn.status === 'SUCCESS'
                                            ? "bg-green-500/20 text-green-400 border-green-500/30"
                                            : selectedTxn.status === 'FAILED'
                                                ? "bg-red-500/20 text-red-400 border-red-500/30"
                                                : "bg-brand-gold/20 text-brand-gold border-brand-gold/30"
                                    )}>
                                        {selectedTxn.status === 'COMPLETED' || selectedTxn.status === 'SUCCESS'
                                            ? <CheckCircle2 className="w-10 h-10" />
                                            : selectedTxn.status === 'FAILED'
                                                ? <AlertCircle className="w-10 h-10" />
                                                : <Clock className="w-10 h-10" />
                                        }
                                    </div>
                                    <div>
                                        <p className="text-4xl font-serif font-medium leading-none">{fmt(selectedTxn.amount)}</p>
                                        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-white/40 mt-3">
                                            {selectedTxn.status.charAt(0) + selectedTxn.status.slice(1).toLowerCase()}
                                        </p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 gap-2">
                                    {[
                                        { label: "Reference ID", value: selectedTxn.id.slice(0, 18).toUpperCase(), icon: Search },
                                        ...(selectedTxn.bankName ? [{ label: "Channel", value: `${selectedTxn.bankName}${selectedTxn.accountNumber ? ` (****${selectedTxn.accountNumber.slice(-4)})` : ''}`, icon: Building2 }] : []),
                                        { label: "Timeline", value: `${new Date(selectedTxn.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })} · ${new Date(selectedTxn.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`, icon: Clock },
                                        { label: "Method", value: "Automated Bank Transfer", icon: ChevronRight }
                                    ].map((item, i) => (
                                        <div key={i} className="flex items-center gap-4 px-5 py-4 bg-white/70 dark:bg-white/5 rounded-2xl border border-brand-deep/5 dark:border-white/5">
                                            <div className="w-10 h-10 shrink-0 rounded-xl bg-brand-deep/5 flex items-center justify-center text-brand-deep/30">
                                                <item.icon className="w-5 h-5" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-[9px] font-black uppercase tracking-widest text-brand-deep/30 leading-none">{item.label}</p>
                                                <p className="text-sm font-bold text-brand-deep dark:text-brand-cream mt-1.5 truncate">{item.value}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </DrawerBody>
                    <DrawerFooter className="px-8 pb-12">
                        <DrawerClose asChild>
                            <Button variant="outline" className="h-16 w-full rounded-2xl font-bold border-brand-deep/10 text-brand-deep/60">Close Record</Button>
                        </DrawerClose>
                    </DrawerFooter>
                </DrawerContent>
            </Drawer>

        </div>
    )
}
