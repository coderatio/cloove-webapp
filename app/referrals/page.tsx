"use client"

import { useState } from "react"
import { ManagementHeader } from "@/app/components/shared/ManagementHeader"
import { GlassCard } from "@/app/components/ui/glass-card"
import { Button } from "@/app/components/ui/button"
import { Input } from "@/app/components/ui/input"
import { Copy, Wallet, TrendingUp, ArrowUpRight, Clock, CheckCircle2, Plus, Building2, Trash2, MoreVertical, CreditCard, ChevronRight } from "lucide-react"
import { toast } from "sonner"
import { PageTransition } from "../components/layout/page-transition"
import { PinVerificationDrawer } from "../components/security/PinVerificationDrawer"
import { WithdrawalDrawer } from "../components/referrals/WithdrawalDrawer"
import { AddBankDrawer } from "../components/referrals/AddBankDrawer"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/app/components/ui/dropdown-menu"
import {
    Drawer,
    DrawerContent,
    DrawerDescription,
    DrawerHeader,
    DrawerTitle,
} from "@/app/components/ui/drawer"

// Mock data
const MOCK_STATS = {
    referralCode: "CLV-JOSIAH",
    referralLink: "https://usecloove.com/signup?ref=CLV-JOSIAH",
    totalReferrals: 12,
    activeReferrals: 8,
    totalEarnings: 45000,
    availableBalance: 15000,
    pendingPayout: 5000
}

const MOCK_PAYOUTS = [
    { id: 1, amount: 10000, status: "completed", date: "2024-02-01", bank: "Gtbank •••• 1234", reference: "REF-82392-X", items: [] },
    { id: 2, amount: 15000, status: "completed", date: "2024-01-15", bank: "Gtbank •••• 1234", reference: "REF-99231-Y", items: [] },
    { id: 3, amount: 5000, status: "pending", date: "2024-02-08", bank: "Gtbank •••• 1234", reference: "REF-11234-Z", items: [] },
]

const MOCK_BANKS = [
    { id: "1", bankName: "Guaranty Trust Bank", accountNumber: "0123456789", accountName: "Josiah Yahaya", isPrimary: true },
    { id: "2", bankName: "Zenith Bank", accountNumber: "2001234567", accountName: "Josiah Yahaya", isPrimary: false },
]

export default function ReferralsPage() {
    const [isLoading, setIsLoading] = useState(false)

    // UI State
    const [isWithdrawalDrawerOpen, setIsWithdrawalDrawerOpen] = useState(false)
    const [isAddBankDrawerOpen, setIsAddBankDrawerOpen] = useState(false)
    const [isPinDrawerOpen, setIsPinDrawerOpen] = useState(false)
    const [selectedPayout, setSelectedPayout] = useState<typeof MOCK_PAYOUTS[0] | null>(null)

    // Flow State
    const [pendingAction, setPendingAction] = useState<{
        type: "withdraw" | "add_bank",
        data: any
    } | null>(null)

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text)
        toast.success("Copied to clipboard")
    }

    // -- Withdraw Flow --
    const startWithdrawal = () => {
        setIsWithdrawalDrawerOpen(true)
    }

    const onWithdrawalDetailsEntered = (amount: number, bankId: string) => {
        // Now ask for PIN
        setPendingAction({ type: "withdraw", data: { amount, bankId } })
        setTimeout(() => setIsPinDrawerOpen(true), 200) // Small delay for smoother transition
    }

    // -- Add Bank Flow --
    const startAddBank = () => {
        setIsAddBankDrawerOpen(true)
    }

    const onBankDetailsEntered = (details: any) => {
        // Now ask for PIN
        setPendingAction({ type: "add_bank", data: details })
        setTimeout(() => setIsPinDrawerOpen(true), 200)
    }

    // -- Final PIN Verification --
    const handlePinSuccess = (pin: string) => {
        setIsPinDrawerOpen(false)
        setIsLoading(true)

        // Simulate API call
        setTimeout(() => {
            setIsLoading(false)
            if (pendingAction?.type === "withdraw") {
                toast.success(`Withdrawal of ₦${pendingAction.data.amount.toLocaleString()} initiated successfully`)
            } else if (pendingAction?.type === "add_bank") {
                toast.success("Bank account added successfully")
            }
            setPendingAction(null)
        }, 1500)
    }

    return (
        <PageTransition>
            <div className="max-w-5xl mx-auto space-y-8 pb-20">
                <ManagementHeader
                    title="Refer & Earn"
                    description="Invite other businesses to Cloove and earn commissions."
                />

                {/* Hero Stats */}
                <section className="grid md:grid-cols-2 gap-6">
                    <GlassCard className="p-6 md:p-8 relative overflow-hidden bg-brand-deep/5 dark:bg-white/5 border-0 rounded-3xl">
                        <div className="absolute inset-0 bg-gradient-to-br from-brand-gold/20 via-transparent to-transparent opacity-50" />
                        <div className="relative z-10 space-y-6">
                            <div className="space-y-2">
                                <h3 className="text-xl md:text-2xl font-serif text-brand-deep dark:text-brand-cream">
                                    Your Referral Code
                                </h3>
                                <p className="text-sm md:text-base text-brand-deep/60 dark:text-brand-cream/60">
                                    Share this code to earn 10% commission on subscription payments.
                                </p>
                            </div>

                            <div className="space-y-4">
                                <div className="p-4 bg-white dark:bg-black/20 rounded-3xl flex items-center justify-between border border-brand-deep/5 dark:border-white/5">
                                    <code className="text-lg md:text-xl font-bold tracking-wider text-brand-deep dark:text-brand-gold">
                                        {MOCK_STATS.referralCode}
                                    </code>
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => copyToClipboard(MOCK_STATS.referralCode)}
                                        className="hover:bg-brand-deep/5 dark:hover:bg-white/5 rounded-xl"
                                    >
                                        <Copy className="w-4 h-4" />
                                    </Button>
                                </div>
                                <div className="flex gap-2">
                                    <Input
                                        readOnly
                                        value={MOCK_STATS.referralLink}
                                        className="bg-transparent border-brand-deep/10 dark:border-white/10 text-brand-deep/80 dark:text-brand-cream/80 rounded-xl"
                                    />
                                    <Button
                                        onClick={() => copyToClipboard(MOCK_STATS.referralLink)}
                                        className="bg-brand-deep text-brand-gold dark:bg-brand-gold dark:text-brand-deep font-bold shrink-0 rounded-xl"
                                    >
                                        Copy
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </GlassCard>

                    <div className="grid grid-rows-2 gap-6">
                        <GlassCard className="p-6 flex flex-col justify-between relative overflow-hidden rounded-3xl">
                            <div className="absolute top-0 right-0 p-4 opacity-10">
                                <Wallet className="w-12 h-12 text-brand-deep dark:text-brand-cream" />
                            </div>
                            <div className="flex items-start justify-between relative z-10">
                                <div className="space-y-1">
                                    <span className="text-xs font-bold uppercase tracking-widest text-brand-accent/60 dark:text-white/60">Available Balance</span>
                                    <div className="text-3xl font-serif text-brand-deep dark:text-brand-cream">
                                        ₦{MOCK_STATS.availableBalance.toLocaleString()}
                                    </div>
                                </div>
                            </div>
                            <Button
                                onClick={startWithdrawal}
                                disabled={isLoading || MOCK_STATS.availableBalance < 5000}
                                className="w-full justify-between bg-brand-deep/5 hover:bg-brand-deep/10 dark:bg-white/5 dark:hover:bg-white/10 text-brand-deep dark:text-brand-cream mt-4 rounded-2xl h-12"
                            >
                                Withdraw Funds
                                <ArrowUpRight className="w-4 h-4" />
                            </Button>
                        </GlassCard>

                        <div className="grid grid-cols-2 gap-6">
                            <GlassCard className="p-6 flex flex-col justify-center space-y-2 rounded-3xl">
                                <span className="text-xs font-bold uppercase tracking-widest text-brand-accent/60 dark:text-white/60">Total Earned</span>
                                <div className="text-2xl font-serif text-brand-deep dark:text-brand-cream">
                                    ₦{MOCK_STATS.totalEarnings.toLocaleString()}
                                </div>
                            </GlassCard>
                            <GlassCard className="p-6 flex flex-col justify-center space-y-2 rounded-3xl">
                                <span className="text-xs font-bold uppercase tracking-widest text-brand-accent/60 dark:text-white/60">Referrals</span>
                                <div className="flex items-baseline gap-2">
                                    <div className="text-2xl font-serif text-brand-deep dark:text-brand-cream">
                                        {MOCK_STATS.totalReferrals}
                                    </div>
                                    <div className="text-xs text-brand-deep/60 dark:text-brand-cream/60">
                                        ({MOCK_STATS.activeReferrals} active)
                                    </div>
                                </div>
                            </GlassCard>
                        </div>
                    </div>
                </section>

                <div className="grid md:grid-cols-2 gap-8">
                    {/* Bank Accounts */}
                    <section className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="font-serif text-xl text-brand-deep dark:text-brand-cream px-1">Bank Accounts</h3>
                            <Button size="sm" variant="ghost" className="text-brand-gold hover:text-brand-gold/80 rounded-xl" onClick={startAddBank}>
                                <Plus className="w-4 h-4 mr-1" /> Add New
                            </Button>
                        </div>
                        <div className="space-y-3">
                            {MOCK_BANKS.map((bank) => (
                                <GlassCard key={bank.id} className="p-4 flex items-center justify-between group rounded-3xl">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-full bg-brand-deep/5 dark:bg-white/5 flex items-center justify-center">
                                            <Building2 className="w-5 h-5 text-brand-deep/60 dark:text-brand-cream/60" />
                                        </div>
                                        <div>
                                            <div className="font-medium text-brand-deep dark:text-brand-cream flex items-center gap-2">
                                                {bank.bankName}
                                                {bank.isPrimary && (
                                                    <span className="text-[10px] bg-brand-gold/10 text-brand-gold px-1.5 py-0.5 rounded-full font-bold uppercase">Primary</span>
                                                )}
                                            </div>
                                            <div className="text-sm text-brand-deep/60 dark:text-brand-cream/60">
                                                {bank.accountNumber} • {bank.accountName}
                                            </div>
                                        </div>
                                    </div>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button size="icon" variant="ghost" className="opacity-0 group-hover:opacity-100 transition-opacity rounded-xl">
                                                <MoreVertical className="w-4 h-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem className="text-red-500 focus:text-red-600 cursor-pointer">
                                                <Trash2 className="w-4 h-4 mr-2" /> Delete
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </GlassCard>
                            ))}
                        </div>
                    </section>

                    {/* Payout History */}
                    <section className="space-y-4">
                        <h3 className="font-serif text-xl text-brand-deep dark:text-brand-cream px-1">Payout History</h3>

                        <div className="space-y-3">
                            {MOCK_PAYOUTS.map((payout) => (
                                <GlassCard
                                    key={payout.id}
                                    className="p-4 group hover:bg-brand-deep/5 dark:hover:bg-white/5 transition-colors cursor-pointer rounded-3xl"
                                    onClick={() => setSelectedPayout(payout)}
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${payout.status === 'completed'
                                                ? 'bg-emerald-500/10 text-emerald-500'
                                                : 'bg-amber-500/10 text-amber-500'
                                                }`}>
                                                {payout.status === 'completed' ? <CheckCircle2 className="w-5 h-5" /> : <Clock className="w-5 h-5" />}
                                            </div>
                                            <div>
                                                <div className="font-medium text-brand-deep dark:text-brand-cream">
                                                    Withdrawal
                                                </div>
                                                <div className="text-xs text-brand-deep/60 dark:text-brand-cream/60">
                                                    {payout.date} • {payout.reference}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="font-serif text-lg text-brand-deep dark:text-brand-cream">
                                                ₦{payout.amount.toLocaleString()}
                                            </div>
                                            <div className="text-xs text-brand-deep/40 dark:text-brand-cream/40 flex items-center justify-end gap-1">
                                                View Details <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                                            </div>
                                        </div>
                                    </div>
                                </GlassCard>
                            ))}
                        </div>
                    </section>
                </div>

                {/* Drawers */}
                <WithdrawalDrawer
                    isOpen={isWithdrawalDrawerOpen}
                    onOpenChange={setIsWithdrawalDrawerOpen}
                    onContinue={onWithdrawalDetailsEntered}
                    availableBalance={MOCK_STATS.availableBalance}
                    banks={MOCK_BANKS}
                />

                <AddBankDrawer
                    isOpen={isAddBankDrawerOpen}
                    onOpenChange={setIsAddBankDrawerOpen}
                    onContinue={onBankDetailsEntered}
                />

                <PinVerificationDrawer
                    isOpen={isPinDrawerOpen}
                    onOpenChange={setIsPinDrawerOpen}
                    onSuccess={handlePinSuccess}
                    title={pendingAction?.type === "withdraw" ? "Confirm Withdrawal" : "Verify Security PIN"}
                    description={pendingAction?.type === "withdraw" ? "Enter your PIN to confirm withdrawal request" : "Enter PIN to verify and add bank account"}
                    isLoading={isLoading}
                />

                {/* Payout Details Drawer */}
                <Drawer open={!!selectedPayout} onOpenChange={(open) => !open && setSelectedPayout(null)}>
                    <DrawerContent>
                        {selectedPayout && (
                            <div className="max-w-md mx-auto w-full pb-8">
                                <DrawerHeader>
                                    <DrawerTitle>Transaction Details</DrawerTitle>
                                    <DrawerDescription>
                                        Reference: {selectedPayout.reference}
                                    </DrawerDescription>
                                </DrawerHeader>
                                <div className="p-6 space-y-6">
                                    <div className="text-center space-y-2">
                                        <div className="text-3xl font-serif text-brand-deep dark:text-brand-cream">
                                            ₦{selectedPayout.amount.toLocaleString()}
                                        </div>
                                        <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase ${selectedPayout.status === 'completed'
                                            ? 'bg-emerald-500/10 text-emerald-500'
                                            : 'bg-amber-500/10 text-amber-500'
                                            }`}>
                                            {selectedPayout.status === 'completed' ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                                            {selectedPayout.status}
                                        </div>
                                    </div>

                                    <div className="bg-brand-deep/5 dark:bg-white/5 rounded-2xl p-4 space-y-4">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-brand-deep/60 dark:text-brand-cream/60">Bank</span>
                                            <span className="font-medium text-brand-deep dark:text-brand-cream">{selectedPayout.bank}</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-brand-deep/60 dark:text-brand-cream/60">Date</span>
                                            <span className="font-medium text-brand-deep dark:text-brand-cream">{selectedPayout.date}</span>
                                        </div>
                                    </div>

                                    <Button
                                        className="w-full rounded-xl h-12"
                                        variant="outline"
                                        onClick={() => setSelectedPayout(null)}
                                    >
                                        Close
                                    </Button>
                                </div>
                            </div>
                        )}
                    </DrawerContent>
                </Drawer>
            </div>
        </PageTransition>
    )
}
