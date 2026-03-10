"use client"

import { useState } from "react"
import { ManagementHeader } from "@/app/components/shared/ManagementHeader"
import { GlassCard } from "@/app/components/ui/glass-card"
import { Button } from "@/app/components/ui/button"
import { Input } from "@/app/components/ui/input"
import { Copy, Wallet, ArrowUpRight, Clock, CheckCircle2, Building2, ChevronRight, Loader2, Users, Share2 } from "lucide-react"
import { toast } from "sonner"
import { PageTransition } from "@/app/components/layout/page-transition"
import { PinVerificationDrawer } from "@/app/components/security/PinVerificationDrawer"
import { WithdrawalDrawer } from "@/app/components/referrals/WithdrawalDrawer"
import { AddBankDrawer } from "@/app/components/referrals/AddBankDrawer"
import {
    Drawer,
    DrawerContent,
    DrawerDescription,
    DrawerHeader,
    DrawerTitle,
    DrawerBody,
    DrawerStickyHeader,
} from "@/app/components/ui/drawer"
import { PayoutAccountsManager } from "@/app/domains/finance/components/PayoutAccountsManager"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/app/components/ui/dialog"
import {
    useReferralStats,
    useReferralBankAccounts,
    useReferralPayouts,
    useReferralList,
    useReferralWithdraw,
    resolveReferralBankAccount,
} from "../hooks/useReferrals"
import { useBusiness } from "@/app/components/BusinessProvider"
import type { ReferralPayout, ReferralBankAccount } from "../types"

const MIN_WITHDRAWAL = 5000

function formatCurrency(amount: number, currency: string = "NGN") {
    const symbol = currency === "NGN" ? "₦" : currency
    return `${symbol}${amount.toLocaleString()}`
}

function formatDate(iso: string) {
    try {
        return new Date(iso).toLocaleDateString(undefined, { dateStyle: "medium" })
    } catch {
        return iso
    }
}

export function ReferralsView() {
    const { activeBusiness } = useBusiness()
    const currency = activeBusiness?.currency ?? "NGN"

    const { stats, isLoading: statsLoading, error: statsError } = useReferralStats()
    const { banks, isLoading: banksLoading, addBank, deleteBank, isAddingBank, isDeletingBank } = useReferralBankAccounts()
    const { payouts, isLoading: payoutsLoading } = useReferralPayouts(1, 20)
    const { list: referralList, isLoading: listLoading } = useReferralList(1, 10)
    const { withdraw, isWithdrawing } = useReferralWithdraw()

    const [isWithdrawalDrawerOpen, setIsWithdrawalDrawerOpen] = useState(false)
    const [isAddBankDrawerOpen, setIsAddBankDrawerOpen] = useState(false)
    const [isAccountsDrawerOpen, setIsAccountsDrawerOpen] = useState(false)
    const [isPinDrawerOpen, setIsPinDrawerOpen] = useState(false)
    const [selectedPayout, setSelectedPayout] = useState<ReferralPayout | null>(null)
    const [bankToDelete, setBankToDelete] = useState<ReferralBankAccount | null>(null)
    const [deletePin, setDeletePin] = useState("")

    const [pendingAction, setPendingAction] = useState<{
        type: "withdraw" | "add_bank"
        data: { amount?: number; bankId?: string; bankName?: string; accountNumber?: string; accountName?: string; bankCode?: string }
    } | null>(null)

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text)
        toast.success("Copied to clipboard")
    }

    const startWithdrawal = () => setIsWithdrawalDrawerOpen(true)
    const onWithdrawalDetailsEntered = (amount: number, bankId: string) => {
        setPendingAction({ type: "withdraw", data: { amount, bankId } })
        setTimeout(() => setIsPinDrawerOpen(true), 200)
    }

    const startAddBank = () => setIsAddBankDrawerOpen(true)
    const onBankDetailsEntered = (details: { bankName: string; accountNumber: string; accountName: string; bankCode?: string }) => {
        setPendingAction({ type: "add_bank", data: details })
        setTimeout(() => setIsPinDrawerOpen(true), 200)
    }

    const handlePinSuccess = async (pin: string) => {
        setIsPinDrawerOpen(false)
        if (!pendingAction) return
        try {
            if (pendingAction.type === "withdraw" && pendingAction.data.amount != null && pendingAction.data.bankId) {
                await withdraw({ amount: pendingAction.data.amount, bankAccountId: pendingAction.data.bankId, pin })
            } else if (pendingAction.type === "add_bank" && pendingAction.data.bankName && pendingAction.data.accountNumber && pendingAction.data.accountName) {
                await addBank({
                    bankName: pendingAction.data.bankName,
                    accountNumber: pendingAction.data.accountNumber,
                    accountName: pendingAction.data.accountName,
                    bankCode: pendingAction.data.bankCode,
                    pin,
                })
                setIsAddBankDrawerOpen(false)
            }
        } finally {
            setPendingAction(null)
        }
    }

    const handleDeleteBank = (bank: ReferralBankAccount) => setBankToDelete(bank)
    const confirmDeleteBank = async () => {
        if (!bankToDelete || !deletePin) return
        try {
            await deleteBank({ id: bankToDelete.id, pin: deletePin })
            setBankToDelete(null)
            setDeletePin("")
        } catch {
            // toast handled in mutation
        }
    }

    const banksForDrawer = banks.map((b) => ({ id: b.id, bankName: b.bankName, accountNumber: b.accountNumber }))
    const availableBalance = stats?.availableBalance ?? 0
    const isLoading = statsLoading
    const canWithdraw = availableBalance >= MIN_WITHDRAWAL && banks.length > 0

    if (statsError) {
        return (
            <PageTransition>
                <div className="max-w-5xl mx-auto space-y-8 pb-20">
                    <ManagementHeader title="Refer & Earn" description="Invite other businesses to Cloove and earn commissions." />
                    <GlassCard className="p-8 text-center">
                        <p className="text-brand-deep/70 dark:text-brand-cream/70">{(statsError as Error).message}</p>
                    </GlassCard>
                </div>
            </PageTransition>
        )
    }

    return (
        <PageTransition>
            <div className="max-w-5xl mx-auto space-y-8 pb-20">
                <ManagementHeader
                    title="Refer & Earn"
                    description="Invite other businesses to Cloove and earn commissions."
                />

                <section className="grid md:grid-cols-2 gap-6">
                    <GlassCard className="p-6 md:p-8 relative overflow-hidden bg-brand-deep/5 dark:bg-white/5 border-0 rounded-3xl before:rounded-3xl">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-linear-to-br from-brand-gold/10 to-transparent rounded-full -mr-16 -mt-16 blur-2xl" />
                        <div className="relative z-10 space-y-6">
                            <div className="space-y-2">
                                <h3 className="text-xl md:text-2xl font-serif text-brand-deep dark:text-brand-cream">
                                    Your Referral Code
                                </h3>
                                <p className="text-sm md:text-base text-brand-deep/60 dark:text-brand-cream/60">
                                    Share this code to earn commission on subscription payments.
                                </p>
                            </div>
                            <div className="space-y-4">
                                <div className="p-4 bg-white dark:bg-black/20 rounded-3xl flex items-center justify-between border border-brand-deep/5 dark:border-white/5">
                                    <code className="text-lg md:text-xl font-bold tracking-wider text-brand-deep dark:text-brand-gold">
                                        {isLoading ? "..." : stats?.referralCode ?? "—"}
                                    </code>
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => stats?.referralCode && copyToClipboard(stats.referralCode)}
                                        disabled={!stats?.referralCode}
                                        className="hover:bg-brand-deep/5 dark:hover:bg-white/5 rounded-xl"
                                    >
                                        <Copy className="w-4 h-4" />
                                    </Button>
                                </div>
                                <div className="flex gap-2">
                                    <Input
                                        readOnly
                                        value={stats?.referralLink ?? ""}
                                        className="bg-transparent border-brand-deep/10 dark:border-white/10 text-brand-deep/80 dark:text-brand-cream/80 rounded-xl"
                                    />
                                    <Button
                                        onClick={() => stats?.referralLink && copyToClipboard(stats.referralLink)}
                                        disabled={!stats?.referralLink}
                                        className="bg-brand-deep text-brand-gold dark:bg-brand-gold dark:text-brand-deep font-bold shrink-0 rounded-xl"
                                    >
                                        Copy
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </GlassCard>

                    <div className="grid grid-rows-2 gap-6">
                        <GlassCard className="p-6 flex flex-col justify-between relative overflow-hidden rounded-3xl before:rounded-3xl">
                            <div className="absolute top-0 right-0 p-4 opacity-10">
                                <Wallet className="w-12 h-12 text-brand-deep dark:text-brand-cream" />
                            </div>
                            <div className="relative z-10">
                                <span className="text-xs font-bold uppercase tracking-widest text-brand-accent/60 dark:text-brand-cream/60">Available Balance</span>
                                <div className="text-3xl font-serif text-brand-deep dark:text-brand-cream mt-1">
                                    {isLoading ? "..." : formatCurrency(availableBalance, currency)}
                                </div>
                            </div>
                            <div className="flex gap-2 mt-4">
                                <Button
                                    onClick={startWithdrawal}
                                    disabled={isWithdrawing || !canWithdraw}
                                    className="flex-1 justify-between bg-brand-deep/5 hover:bg-brand-deep/10 dark:bg-white/5 dark:hover:bg-white/10 text-brand-deep dark:text-brand-cream rounded-2xl h-12"
                                >
                                    {isWithdrawing ? <Loader2 className="w-4 h-4 animate-spin" /> : "Withdraw Funds"}
                                    <ArrowUpRight className="w-4 h-4" />
                                </Button>
                                <Button
                                    onClick={() => setIsAccountsDrawerOpen(true)}
                                    variant="outline"
                                    className="rounded-2xl h-12 border-brand-deep/10 dark:border-white/10 hover:bg-brand-deep/5 dark:hover:bg-white/5"
                                >
                                    <Building2 className="w-4 h-4" />
                                </Button>
                            </div>
                        </GlassCard>

                        <div className="grid grid-cols-2 gap-6">
                            <GlassCard className="p-6 flex flex-col justify-center space-y-2 rounded-3xl before:rounded-3xl">
                                <span className="text-xs font-bold uppercase tracking-widest text-brand-accent/60 dark:text-brand-cream/60">Total Earned</span>
                                <div className="text-2xl font-serif text-brand-deep dark:text-brand-cream">
                                    {isLoading ? "..." : formatCurrency(stats?.totalEarnings ?? 0, currency)}
                                </div>
                            </GlassCard>
                            <GlassCard className="p-6 flex flex-col justify-center space-y-2 rounded-3xl before:rounded-3xl">
                                <span className="text-xs font-bold uppercase tracking-widest text-brand-accent/60 dark:text-brand-cream/60">Referrals</span>
                                <div className="flex items-baseline gap-2">
                                    <div className="text-2xl font-serif text-brand-deep dark:text-brand-cream">
                                        {isLoading ? "..." : stats?.totalReferrals ?? 0}
                                    </div>
                                    <div className="text-xs text-brand-deep/60 dark:text-brand-cream/60">
                                        ({stats?.completedReferrals ?? 0} completed)
                                    </div>
                                </div>
                            </GlassCard>
                        </div>
                    </div>
                </section>

                <section className="space-y-4">
                    <h3 className="font-serif text-xl text-brand-deep dark:text-brand-cream px-1">Payout History</h3>
                    <div className="space-y-3">
                        {payoutsLoading ? (
                            <div className="flex items-center justify-center py-8">
                                <Loader2 className="w-6 h-6 animate-spin text-brand-deep/50 dark:text-brand-cream/50" />
                            </div>
                        ) : payouts.length === 0 ? (
                            <GlassCard className="p-12 flex flex-col items-center justify-center text-center space-y-4 bg-brand-deep/2 dark:bg-white/2 border-dashed border-brand-deep/10 dark:border-white/10 rounded-3xl before:rounded-3xl">
                                <div className="w-14 h-14 rounded-2xl bg-brand-deep/5 dark:bg-white/5 flex items-center justify-center">
                                    <Wallet className="w-7 h-7 text-brand-deep/20 dark:text-white/20" />
                                </div>
                                <div className="space-y-1">
                                    <p className="text-sm font-medium text-brand-deep dark:text-brand-cream">No payouts yet</p>
                                    <p className="text-xs text-brand-accent/40 dark:text-white/30 max-w-[240px]">
                                        Your withdrawal history will appear here once you make your first payout.
                                    </p>
                                </div>
                                {canWithdraw && (
                                    <Button
                                        onClick={startWithdrawal}
                                        size="sm"
                                        className="mt-2 bg-brand-deep text-brand-gold dark:bg-brand-gold dark:text-brand-deep font-bold rounded-xl gap-2"
                                    >
                                        <ArrowUpRight className="w-4 h-4" />
                                        Withdraw Funds
                                    </Button>
                                )}
                            </GlassCard>
                        ) : (
                            payouts.map((payout) => (
                                <GlassCard
                                    key={payout.id}
                                    className="p-4 group hover:bg-brand-deep/5 dark:hover:bg-white/5 transition-colors cursor-pointer rounded-3xl"
                                    onClick={() => setSelectedPayout(payout)}
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${payout.status === "completed"
                                                ? "bg-emerald-500/10 text-emerald-500"
                                                : "bg-amber-500/10 text-amber-500"
                                                }`}>
                                                {payout.status === "completed" ? <CheckCircle2 className="w-5 h-5" /> : <Clock className="w-5 h-5" />}
                                            </div>
                                            <div>
                                                <div className="font-medium text-brand-deep dark:text-brand-cream">Withdrawal</div>
                                                <div className="text-xs text-brand-deep/60 dark:text-brand-cream/60">
                                                    {formatDate(payout.createdAt)} • {payout.reference}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="font-serif text-lg text-brand-deep dark:text-brand-cream">
                                                {formatCurrency(payout.amount, payout.currency)}
                                            </div>
                                            <div className="text-xs text-brand-deep/40 dark:text-brand-cream/40 flex items-center justify-end gap-1">
                                                View Details <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                                            </div>
                                        </div>
                                    </div>
                                </GlassCard>
                            ))
                        )}
                    </div>
                </section>

                <section className="space-y-4">
                    <h3 className="font-serif text-xl text-brand-deep dark:text-brand-cream px-1">People you referred</h3>
                    <div className="space-y-2">
                        {listLoading ? (
                            <div className="flex items-center justify-center py-6">
                                <Loader2 className="w-6 h-6 animate-spin text-brand-deep/50 dark:text-brand-cream/50" />
                            </div>
                        ) : referralList.length === 0 ? (
                            <GlassCard className="p-12 flex flex-col items-center justify-center text-center space-y-4 bg-brand-deep/2 dark:bg-white/2 border-dashed border-brand-deep/10 dark:border-white/10 rounded-3xl before:rounded-3xl">
                                <div className="w-14 h-14 rounded-2xl bg-brand-deep/5 dark:bg-white/5 flex items-center justify-center">
                                    <Users className="w-7 h-7 text-brand-deep/20 dark:text-white/20" />
                                </div>
                                <div className="space-y-1">
                                    <p className="text-sm font-medium text-brand-deep dark:text-brand-cream">No referrals yet</p>
                                    <p className="text-xs text-brand-accent/40 dark:text-white/30 max-w-[240px]">
                                        Share your referral code with other businesses and start earning commissions.
                                    </p>
                                </div>
                                <Button
                                    onClick={() => stats?.referralCode && copyToClipboard(stats.referralCode)}
                                    disabled={!stats?.referralCode}
                                    size="sm"
                                    className="mt-2 bg-brand-deep text-brand-gold dark:bg-brand-gold dark:text-brand-deep font-bold rounded-xl gap-2"
                                >
                                    <Share2 className="w-4 h-4" />
                                    Share Your Code
                                </Button>
                            </GlassCard>
                        ) : (
                            referralList.map((ref) => (
                                <GlassCard key={ref.id} className="p-4 flex items-center justify-between rounded-3xl before:rounded-3xl">
                                    <div>
                                        <div className="font-medium text-brand-deep dark:text-brand-cream">
                                            {ref.referredBusinessName ?? "—"}
                                        </div>
                                        <div className="text-xs text-brand-deep/60 dark:text-brand-cream/60">
                                            {formatDate(ref.createdAt)} · {ref.status.toLowerCase()}
                                        </div>
                                    </div>
                                </GlassCard>
                            ))
                        )}
                    </div>
                </section>

                <WithdrawalDrawer
                    isOpen={isWithdrawalDrawerOpen}
                    onOpenChange={setIsWithdrawalDrawerOpen}
                    onContinue={onWithdrawalDetailsEntered}
                    availableBalance={availableBalance}
                    banks={banksForDrawer}
                    minAmount={MIN_WITHDRAWAL}
                />

                <AddBankDrawer
                    isOpen={isAddBankDrawerOpen}
                    onOpenChange={setIsAddBankDrawerOpen}
                    onContinue={onBankDetailsEntered}
                    onResolveAccount={resolveReferralBankAccount}
                />

                <PinVerificationDrawer
                    isOpen={isPinDrawerOpen}
                    onOpenChange={setIsPinDrawerOpen}
                    onSuccess={handlePinSuccess}
                    title={pendingAction?.type === "withdraw" ? "Confirm Withdrawal" : "Verify Security PIN"}
                    description={pendingAction?.type === "withdraw" ? "Enter your PIN to confirm withdrawal request" : "Enter PIN to verify and add bank account"}
                    isLoading={isWithdrawing || isAddingBank}
                />

                <Drawer open={!!selectedPayout} onOpenChange={(open) => !open && setSelectedPayout(null)}>
                    <DrawerContent>
                        {selectedPayout && (
                            <div className="max-w-md mx-auto w-full pb-8">
                                <DrawerHeader>
                                    <DrawerTitle>Transaction Details</DrawerTitle>
                                    <DrawerDescription>Reference: {selectedPayout.reference}</DrawerDescription>
                                </DrawerHeader>
                                <div className="p-6 space-y-6">
                                    <div className="text-center space-y-2">
                                        <div className="text-3xl font-serif text-brand-deep dark:text-brand-cream">
                                            {formatCurrency(selectedPayout.amount, selectedPayout.currency)}
                                        </div>
                                        <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase ${selectedPayout.status === "completed"
                                            ? "bg-emerald-500/10 text-emerald-500"
                                            : "bg-amber-500/10 text-amber-500"
                                            }`}>
                                            {selectedPayout.status === "completed" ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                                            {selectedPayout.status}
                                        </div>
                                    </div>
                                    <div className="bg-brand-deep/5 dark:bg-white/5 rounded-2xl p-4 space-y-4">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-brand-deep/60 dark:text-brand-cream/60">Bank</span>
                                            <span className="font-medium text-brand-deep dark:text-brand-cream">{selectedPayout.bank ?? "—"}</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-brand-deep/60 dark:text-brand-cream/60">Date</span>
                                            <span className="font-medium text-brand-deep dark:text-brand-cream">{formatDate(selectedPayout.createdAt)}</span>
                                        </div>
                                    </div>
                                    <Button className="w-full rounded-xl h-12" variant="outline" onClick={() => setSelectedPayout(null)}>
                                        Close
                                    </Button>
                                </div>
                            </div>
                        )}
                    </DrawerContent>
                </Drawer>

                <Drawer open={isAccountsDrawerOpen} onOpenChange={setIsAccountsDrawerOpen}>
                    <DrawerContent>
                        <DrawerStickyHeader>
                            <DrawerTitle>Payout Accounts</DrawerTitle>
                            <DrawerDescription>Manage your bank accounts for referral payouts.</DrawerDescription>
                        </DrawerStickyHeader>
                        <DrawerBody className="p-4 pb-12">
                            <PayoutAccountsManager onClose={() => setIsAccountsDrawerOpen(false)} showBackButton={false} />
                        </DrawerBody>
                    </DrawerContent>
                </Drawer>

                <Dialog open={!!bankToDelete} onOpenChange={(open) => !open && (setBankToDelete(null), setDeletePin(""))}>

                    <DialogContent className="max-w-[400px]">
                        <DialogHeader>
                            <DialogTitle>Remove bank account?</DialogTitle>
                            <DialogDescription>
                                This will remove {bankToDelete?.bankName} ({bankToDelete?.accountNumber}) from your referral payout accounts. Enter your PIN to confirm.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="py-2">
                            <label className="text-sm font-medium text-brand-deep dark:text-brand-cream">Transaction PIN</label>
                            <Input
                                type="password"
                                inputMode="numeric"
                                maxLength={4}
                                placeholder="Enter PIN"
                                value={deletePin}
                                onChange={(e) => setDeletePin(e.target.value.replace(/\D/g, ""))}
                                className="mt-2 rounded-xl"
                            />
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => (setBankToDelete(null), setDeletePin(""))} disabled={isDeletingBank}>
                                Cancel
                            </Button>
                            <Button
                                variant="destructive"
                                onClick={confirmDeleteBank}
                                disabled={deletePin.length !== 4 || isDeletingBank}
                            >
                                {isDeletingBank ? <Loader2 className="w-4 h-4 animate-spin" /> : "Remove"}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </PageTransition>
    )
}
