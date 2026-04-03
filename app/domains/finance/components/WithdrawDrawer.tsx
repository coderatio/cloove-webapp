"use client"

import * as React from "react"
import { Wallet, Building2, Check, Lock, Loader2, X, AlertCircle, Plus, Settings2, CheckCircle2, ShieldCheck, ArrowRight } from "lucide-react"
import { Button } from "@/app/components/ui/button"
import { Input } from "@/app/components/ui/input"
import {
    Drawer,
    DrawerContent,
    DrawerHeader,
    DrawerTitle,
    DrawerDescription,
    DrawerBody,
    DrawerFooter,
} from "@/app/components/ui/drawer"
import { PinInputDrawer } from "@/app/components/shared/PinInputDrawer"
import { useWalletBalance, usePayoutAccounts, useWithdraw, useDepositAccounts, useRecentWithdrawalAccounts } from "@/app/domains/finance/hooks/useFinance"
import { formatCurrency } from "@/app/lib/formatters"
import { CurrencyText } from "@/app/components/shared/CurrencyText"
import { toast } from "sonner"
import { cn } from "@/app/lib/utils"
import { PayoutAccountsManager } from './PayoutAccountsManager'
import { useRouter } from "next/navigation"
import { GlassCard } from "@/app/components/ui/glass-card"
import { WithdrawToOtherAccountForm } from "./WithdrawToOtherAccountForm"

const FALLBACK_MIN_WITHDRAWAL = 50

function currencySymbol(code: string): string {
    if (code === 'NGN') return '₦'
    const parts = new Intl.NumberFormat('en', {
        style: 'currency',
        currency: code,
        currencyDisplay: 'narrowSymbol',
    }).formatToParts(0)
    return parts.find((p) => p.type === 'currency')?.value ?? code
}

interface WithdrawDrawerProps {
    isOpen: boolean
    onOpenChange: (open: boolean) => void
    currencyCode: string
    initialStep?: Step
}

function parseAmount(value: string): number {
    const cleaned = value.replace(/[^0-9.]/g, "")
    const parsed = parseFloat(cleaned)
    return Number.isFinite(parsed) ? parsed : 0
}

function calculateWithdrawalFee(amount: number, tiers: { min: number; max: number | null; fee: number }[]): number {
    if (!tiers || tiers.length === 0) return 0
    const sorted = [...tiers].sort((a, b) => a.min - b.min)
    let matchedFee: number | null = null
    for (const tier of sorted) {
        if (amount >= tier.min && (tier.max === null || amount <= tier.max)) {
            matchedFee = tier.fee
            break
        }
    }
    return matchedFee ?? (sorted.length > 0 ? sorted[sorted.length - 1].fee : 0)
}

type Step = 'details' | 'destination_selection' | 'other_account_form' | 'summary' | 'manage_payouts'

export function WithdrawDrawer({ isOpen, onOpenChange, currencyCode, initialStep = 'details' }: WithdrawDrawerProps) {
    const { wallet, isLoading: walletLoading } = useWalletBalance()
    const { payoutAccounts, isLoading: accountsLoading } = usePayoutAccounts()
    const { depositData, isLoading: verificationLoading } = useDepositAccounts()
    const { recentAccounts, isLoading: recentLoading } = useRecentWithdrawalAccounts()
    const withdrawMutation = useWithdraw()
    const router = useRouter()

    const isVerified = depositData?.isEligible ?? false
    const verificationLevel = depositData?.verificationLevel ?? 0

    const [step, setStep] = React.useState<Step>("details")
    const [amount, setAmount] = React.useState("")
    const [payoutAccountId, setPayoutAccountId] = React.useState("")
    const [otherAccountDetails, setOtherAccountDetails] = React.useState<{
        bankCode: string
        bankName: string
        accountNumber: string
        accountName: string
        provider: string
    } | null>(null)
    const [saveToPayout, setSaveToPayout] = React.useState(false)
    const [isPinOpen, setIsPinOpen] = React.useState(false)

    const amountNum = parseAmount(amount)
    const withdrawalFeeTiers = wallet?.withdrawalFeeTiers ?? []
    const hasFeeConfig = withdrawalFeeTiers.length > 0

    const fee = calculateWithdrawalFee(amountNum, withdrawalFeeTiers)
    const totalDebit = amountNum + fee

    const available = wallet?.availableBalance ?? 0
    const minWithdrawal = wallet?.minimumWithdrawalAmount ?? FALLBACK_MIN_WITHDRAWAL

    const amountError: { type: "config" | "min" | "max"; text: React.ReactNode } | null =
        !walletLoading && !hasFeeConfig && amountNum > 0
            ? { type: "config" as const, text: "Withdrawal service is currently being updated. Please try again in a moment." }
            : amountNum > 0 && amountNum < minWithdrawal
                ? { type: "min" as const, text: <>Minimum is <CurrencyText value={formatCurrency(minWithdrawal, { currency: currencyCode })} />.</> }
                : totalDebit > available
                    ? { type: "max" as const, text: "Exceeds available balance (including fee)." }
                    : null

    const canContinue =
        hasFeeConfig &&
        amountNum >= minWithdrawal &&
        totalDebit <= available &&
        (payoutAccountId || otherAccountDetails) &&
        !withdrawMutation.isPending

    const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const raw = e.target.value.replace(/[^0-9]/g, "")
        if (raw) {
            setAmount(Number(raw).toLocaleString())
        } else {
            setAmount("")
        }
    }



    const handleWithdraw = async (pin: string) => {
        if (!canContinue) return
        try {
            await withdrawMutation.mutateAsync({
                amount: amountNum,
                payoutAccountId: payoutAccountId || undefined,
                pin,
                ...(otherAccountDetails ? {
                    bankCode: otherAccountDetails.bankCode,
                    accountNumber: otherAccountDetails.accountNumber,
                    accountName: otherAccountDetails.accountName,
                    bankName: otherAccountDetails.bankName,
                    provider: otherAccountDetails.provider,
                    saveToPayoutAccounts: saveToPayout,
                } : {})
            })
            toast.success("Withdrawal submitted. We're processing it.")
            setAmount("")
            setPayoutAccountId("")
            setOtherAccountDetails(null)
            setSaveToPayout(false)
            setStep("details")
            onOpenChange(false)
        } catch (err: unknown) {
            const msg =
                (err as { data?: { message?: string }; message?: string })?.data?.message ||
                (err as Error)?.message ||
                "Withdrawal failed"
            // Re-throw so PinInputDrawer shows the error
            throw new Error(msg)
        }
    }

    React.useEffect(() => {
        if (isOpen && payoutAccounts.length) {
            const defaultAccount = payoutAccounts.find((a) => a.isDefault) ?? payoutAccounts[0]
            if (defaultAccount && !payoutAccountId && !otherAccountDetails) {
                setPayoutAccountId(defaultAccount.id)
            }
        }

        if (!isOpen) {
            setPayoutAccountId('')
            setOtherAccountDetails(null)
            setSaveToPayout(false)
        }
    }, [isOpen, payoutAccounts, payoutAccountId, otherAccountDetails])

    React.useEffect(() => {
        if (!isOpen) {
            setStep("details")
        } else if (initialStep) {
            const targetStep = (initialStep as string) === 'pin' ? 'summary' : initialStep as Step;
            setStep(targetStep)
        }
    }, [isOpen, initialStep])

    const amountInputRef = React.useRef<HTMLInputElement>(null)
    React.useEffect(() => {
        if (isOpen && step === "details") {
            const t = setTimeout(() => amountInputRef.current?.focus(), 0)
            return () => clearTimeout(t)
        }
    }, [isOpen, step])



    const symbol = currencySymbol(currencyCode)

    const renderContent = () => {
        if (verificationLoading) {
            return (
                <DrawerBody className="p-4 flex items-center justify-center min-h-[300px] no-scrollbar">
                    <Loader2 className="w-6 h-6 animate-spin text-brand-gold" />
                </DrawerBody>
            )
        }

        if (!isVerified) {
            return (
                <DrawerBody className="p-4 flex-1 overflow-y-auto no-scrollbar flex flex-col items-center text-center space-y-8 animate-in fade-in zoom-in-95 duration-700">
                    <div className="relative">
                        <div className="w-24 h-24 rounded-3xl bg-brand-gold/10 flex items-center justify-center">
                            <ShieldCheck className="w-12 h-12 text-brand-gold" />
                        </div>
                        <div className="absolute -bottom-2 -right-2 w-10 h-10 rounded-xl bg-brand-deep dark:bg-brand-cream flex items-center justify-center shadow-lg">
                            <Lock className="w-5 h-5 text-brand-gold dark:text-brand-deep" />
                        </div>
                    </div>
                    <div className="space-y-3">
                        <h3 className="text-2xl font-serif font-medium text-brand-deep dark:text-brand-cream">
                            Verification Required
                        </h3>
                        <p className="text-sm text-brand-accent/60 dark:text-brand-cream/60 leading-relaxed max-w-[300px] mx-auto">
                            Complete Level 1 verification to unlock withdrawals and move funds to your bank account.
                        </p>
                    </div>
                    <div className="w-full space-y-2 max-w-sm">
                        <div className="flex items-center justify-between text-xs">
                            <span className="font-bold text-brand-accent/40 dark:text-brand-cream/40 uppercase tracking-widest">
                                Level {verificationLevel} of 3
                            </span>
                            <span className="text-brand-gold font-medium">
                                {Math.round((verificationLevel / 3) * 100)}%
                            </span>
                        </div>
                        <div className="h-2 rounded-full bg-brand-deep/5 dark:bg-white/5 overflow-hidden">
                            <div
                                className="h-full rounded-full bg-linear-to-r from-brand-gold/60 to-brand-gold transition-all duration-800"
                                style={{ width: `${(verificationLevel / 3) * 100}%` }}
                            />
                        </div>
                    </div>
                    <GlassCard className="w-full p-6 space-y-4 border-brand-gold/10 bg-brand-gold/2 max-w-sm">
                        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-accent/40 dark:text-brand-cream/40">
                            What Level 1 Unlocks
                        </p>
                        <div className="space-y-3">
                            {["Withdraw funds to your bank account", "Full access to wallet features", "Higher transaction limits"].map((benefit, i) => (
                                <div key={i} className="flex items-start gap-3">
                                    <div className="w-5 h-5 rounded-md bg-brand-gold/10 flex items-center justify-center shrink-0 mt-0.5">
                                        <Check className="w-3 h-3 text-brand-gold" />
                                    </div>
                                    <p className="text-sm text-brand-deep/80 dark:text-brand-cream/80 text-left leading-snug">
                                        {benefit}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </GlassCard>
                    <div className="w-full max-w-sm pt-4">
                        <Button
                            onClick={() => {
                                onOpenChange(false)
                                setTimeout(() => router.push("/settings?tab=verification"), 300)
                            }}
                            className="w-full h-14 rounded-2xl bg-brand-gold text-brand-deep font-bold text-base shadow-xl shadow-brand-gold/20 hover:bg-brand-gold/90 active:scale-[0.98] transition-all flex items-center justify-center gap-3"
                        >
                            Start Verification
                            <ArrowRight className="w-5 h-5" />
                        </Button>
                    </div>
                </DrawerBody>
            )
        }

        switch (step) {
            case 'manage_payouts':
                return (
                    <DrawerBody className="p-4 animate-in fade-in slide-in-from-right-4 duration-500 no-scrollbar">
                        <PayoutAccountsManager onClose={() => setStep("details")} />
                    </DrawerBody>
                )
            case 'details':
                return (
                    <>
                        <DrawerBody className="p-6 space-y-8 animate-in fade-in slide-in-from-left-4 duration-500 no-scrollbar">
                            <div className="space-y-6">
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-accent/40 dark:text-brand-cream/80 ml-1">
                                        Amount (Min <CurrencyText value={formatCurrency(minWithdrawal, { currency: currencyCode })} />)
                                    </label>
                                    <div className="relative group">
                                        <div className="absolute -inset-1 bg-brand-gold/0 group-focus-within:bg-brand-gold/10 rounded-4xl transition-all duration-500 blur-md" />
                                        <div className="relative flex items-center rounded-3xl border border-brand-deep/5 bg-brand-deep/3 dark:bg-white/3 overflow-hidden transition-all duration-300 focus-within:ring-2 focus-within:ring-brand-gold/30 focus-within:bg-white dark:focus-within:bg-brand-deep group shadow-xs">
                                            <span className="flex items-center justify-center min-w-16 px-4 h-16 text-brand-deep/40 dark:text-brand-cream/80 font-sans text-2xl shrink-0 border-r border-brand-deep/5 dark:border-white/5">
                                                {symbol}
                                            </span>
                                            <Input
                                                ref={amountInputRef}
                                                type="text"
                                                inputMode="numeric"
                                                placeholder="0.00"
                                                value={amount}
                                                onChange={handleAmountChange}
                                                className="h-16 py-0 rounded-none border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 pl-4 text-3xl font-serif font-black text-brand-cream! dark:text-white! dark:bg-brand-deep/30 placeholder:text-brand-deep/20 dark:placeholder:text-white/60"
                                            />
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between px-1">
                                        {amountError ? (
                                            <div className="text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5 text-rose-500 animate-in slide-in-from-left-2">
                                                <AlertCircle className="w-3 h-3" />
                                                {amountError.text}
                                            </div>
                                        ) : amountNum > 0 ? (
                                            <div className="flex items-center gap-1.5 h-4 animate-in fade-in">
                                                <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                                                <span className="text-[9px] font-black uppercase tracking-widest text-brand-deep/40 dark:text-brand-cream/60">
                                                    Fee: {walletLoading ? "Calculating…" : <CurrencyText value={formatCurrency(fee, { currency: currencyCode })} />}
                                                </span>
                                            </div>
                                        ) : (
                                            <span className="text-[9px] font-black uppercase tracking-widest text-brand-deep/30 dark:text-brand-cream/60">
                                                Available: {walletLoading ? "…" : <CurrencyText value={formatCurrency(available, { currency: currencyCode })} />}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </DrawerBody>
                        <DrawerFooter className="p-6 md:p-8 dark:bg-transparent">
                            <Button
                                onClick={() => setStep("destination_selection")}
                                disabled={!amount || !!amountError}
                                className="w-full h-18 bg-brand-deep text-brand-gold dark:bg-brand-gold-400 dark:text-brand-deep font-black uppercase tracking-[0.2em] text-xs rounded-3xl shadow-2xl hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 disabled:opacity-50"
                            >
                                Choose Withdrawal Account
                            </Button>
                        </DrawerFooter>
                    </>
                )
            case 'destination_selection':
                return (
                    <>
                        <DrawerBody className="p-6 space-y-8 animate-in fade-in slide-in-from-right-4 duration-500 no-scrollbar">
                            <div className="space-y-4">
                                <div className="flex items-center justify-between ml-1">
                                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-accent/40 dark:text-white/20">
                                        Saved Accounts
                                    </label>
                                    <button
                                        onClick={() => setStep("manage_payouts")}
                                        className="text-[10px] cursor-pointer font-black text-brand-gold hover:text-brand-gold/80 uppercase tracking-widest flex items-center gap-1 transition-all"
                                    >
                                        <Settings2 className="w-3 h-3" />
                                        Manage
                                    </button>
                                </div>

                                {payoutAccounts.length === 0 && !accountsLoading ? (
                                    <div className="py-8 flex flex-col items-center justify-center text-center space-y-4 bg-brand-deep/3 dark:bg-white/3 rounded-3xl border border-dashed border-brand-gold/20">
                                        <Building2 className="w-8 h-8 text-brand-gold/40" />
                                        <p className="text-[10px] text-brand-deep/40 dark:text-white/30 uppercase tracking-widest font-black">No saved accounts</p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 gap-2">
                                        {payoutAccounts.map((account) => (
                                            <button
                                                key={account.id}
                                                onClick={() => {
                                                    setPayoutAccountId(account.id)
                                                    setOtherAccountDetails(null)
                                                    setStep("summary")
                                                }}
                                                className="group cursor-pointer flex items-center justify-between p-4 rounded-3xl border border-brand-deep/5 dark:border-white/5 bg-brand-deep/2 dark:bg-white/2 hover:ring-1 hover:ring-brand-gold/30 hover:bg-brand-deep/5 dark:hover:bg-white/5 transition-all"
                                            >
                                                <div className="flex items-center gap-4 min-w-0">
                                                    <div className="w-10 h-10 rounded-2xl bg-brand-gold/10 text-brand-gold flex items-center justify-center">
                                                        <Building2 className="w-5 h-5" />
                                                    </div>
                                                    <div className="text-left min-w-0">
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-[11px] font-black uppercase truncate text-brand-deep dark:text-brand-cream">{account.bankName}</span>
                                                            {account.isDefault && <span className="text-[8px] bg-brand-gold/20 text-brand-gold px-1.5 py-0.5 rounded-full font-black">Default</span>}
                                                        </div>
                                                        <span className="text-[10px] font-mono text-brand-deep/40 dark:text-white/40">{account.accountNumber} • {account.accountName}</span>
                                                    </div>
                                                </div>
                                                <ArrowRight className="w-4 h-4 text-brand-gold/40 group-hover:text-brand-gold group-hover:translate-x-1 transition-all" />
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {recentAccounts.length > 0 && (
                                <div className="space-y-4">
                                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-accent/40 dark:text-white/20 ml-1">
                                        Recent Transfers
                                    </label>
                                    <div className="overflow-x-auto pb-2 -mx-1 px-1">
                                        <div className="flex gap-4">
                                            {recentAccounts.map((account, i) => (
                                                <button
                                                    key={`recent-${i}`}
                                                    onClick={() => {
                                                        setOtherAccountDetails({
                                                            bankCode: account.bankCode || '',
                                                            bankName: account.bankName,
                                                            accountNumber: account.accountNumber || '',
                                                            accountName: account.accountName,
                                                            provider: account.provider || 'monnify'
                                                        })
                                                        setPayoutAccountId("")
                                                        setStep("summary")
                                                    }}
                                                    className="flex flex-col items-center space-y-2 min-w-[72px] group cursor-pointer"
                                                >
                                                    <div className="w-14 h-14 rounded-[1.2rem] bg-brand-deep/5 dark:bg-white/5 border border-transparent group-hover:border-brand-gold/30 flex items-center justify-center transition-all group-hover:translate-y-[-4px]">
                                                        <div className="text-sm font-black text-brand-gold">
                                                            {account.bankName.charAt(0)}
                                                        </div>
                                                    </div>
                                                    <div className="text-center">
                                                        <p className="text-[10px] font-black text-brand-deep dark:text-brand-cream/80 truncate w-16">{account.accountName.split(' ')[0]}</p>
                                                        <p className="text-[8px] font-medium text-brand-deep/40 dark:text-brand-cream/40 truncate w-16">{account.bankName}</p>
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </DrawerBody>
                        <DrawerFooter className="p-6 md:p-8 dark:bg-transparent">
                            <Button
                                onClick={() => setStep("other_account_form")}
                                className="w-full h-18 bg-white dark:bg-white/5 border-2 border-dashed border-brand-gold/30 text-brand-gold font-black uppercase tracking-widest text-[10px] rounded-3xl hover:bg-brand-gold/5 transition-all flex items-center justify-center gap-3 shadow-sm hover:shadow-md"
                            >
                                <Plus className="w-5 h-5" />
                                Transfer to New Account
                            </Button>
                        </DrawerFooter>
                    </>
                )
            case 'other_account_form':
                return (
                    <WithdrawToOtherAccountForm
                        onBack={() => setStep("destination_selection")}
                        onConfirm={(details, saveToPayout) => {
                            setOtherAccountDetails(details)
                            setSaveToPayout(saveToPayout)
                            setPayoutAccountId("")
                            setStep("summary")
                        }}
                    />
                )
            case 'summary':
                return (
                    <>
                        <DrawerBody className="p-6 no-scrollbar">
                            <div className="space-y-8 py-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
                                <div className="text-center space-y-6">
                                    <div className="mx-auto w-20 h-20 rounded-4xl bg-brand-gold/10 flex items-center justify-center text-brand-gold mb-2 group relative">
                                        <div className="absolute inset-0 bg-brand-gold/20 blur-2xl rounded-full animate-pulse" />
                                        <ShieldCheck className="w-10 h-10 relative z-10" />
                                    </div>
                                    <div className="space-y-2">
                                        <h4 className="text-2xl font-serif font-black text-brand-deep dark:text-white tracking-tight">Confirm Details</h4>
                                        <p className="text-brand-deep/40 dark:text-white/30 font-base max-w-[340px] mx-auto leading-relaxed">Please review your withdrawal summary before authorizing the transaction.</p>
                                    </div>
                                </div>

                                <GlassCard className="p-5 space-y-4 border-brand-gold/10 bg-brand-gold/2 max-w-sm mx-auto shadow-xs">
                                    <div className="flex items-center justify-between">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-brand-deep/40 dark:text-white/30">Withdrawal Amount</span>
                                        <span className="text-sm font-serif font-bold text-brand-deep dark:text-white">
                                            <CurrencyText value={formatCurrency(amountNum, { currency: currencyCode })} />
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-brand-deep/40 dark:text-white/30">Transaction Fee</span>
                                        <span className="text-sm font-serif font-bold text-brand-deep dark:text-white">
                                            <CurrencyText value={formatCurrency(fee, { currency: currencyCode })} />
                                        </span>
                                    </div>
                                    <div className="pt-3 border-t border-brand-gold/10 flex items-center justify-between">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-brand-gold">Total to Debit</span>
                                        <span className="text-xl font-serif font-black text-brand-deep dark:text-white">
                                            <CurrencyText value={formatCurrency(amountNum + fee, { currency: currencyCode })} />
                                        </span>
                                    </div>
                                </GlassCard>

                                <div className="max-w-sm mx-auto p-4 rounded-3xl bg-brand-deep/3 dark:bg-white/3 border border-brand-deep/5 dark:border-white/5 space-y-3">
                                    <div className="text-[10px] font-black uppercase tracking-widest text-brand-deep/30 dark:text-white/20">Destination Account</div>
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-2xl bg-brand-gold/20 flex items-center justify-center">
                                            <Building2 className="w-5 h-5 text-brand-gold" />
                                        </div>
                                        <div>
                                            <div className="text-xs font-black text-brand-deep dark:text-white uppercase truncate">
                                                {payoutAccounts.find(a => a.id === payoutAccountId)?.bankName || otherAccountDetails?.bankName}
                                            </div>
                                            <div className="text-[10px] font-mono text-brand-deep/40 dark:text-white/40">
                                                {payoutAccounts.find(a => a.id === payoutAccountId)?.accountNumber || otherAccountDetails?.accountNumber}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </DrawerBody>
                        <DrawerFooter className="p-6 md:p-8 space-y-4 dark:bg-transparent">
                            <Button
                                onClick={() => setIsPinOpen(true)}
                                className="w-full h-18 bg-brand-deep text-brand-gold dark:bg-brand-gold dark:text-brand-deep font-black uppercase tracking-[0.3em] text-sm rounded-3xl shadow-[0_25px_50px_rgba(0,0,0,0.3)] hover:scale-[1.02] active:scale-95 transition-all duration-300"
                            >
                                Confirm & Execute
                            </Button>
                            <Button
                                variant="ghost"
                                onClick={() => setStep(otherAccountDetails ? "other_account_form" : "destination_selection")}
                                className="h-12 w-full rounded-2xl border border-brand-deep/10 dark:border-white/10 text-brand-deep/40 dark:text-brand-cream/40 font-black uppercase tracking-widest text-[9px] hover:bg-brand-deep/5 dark:hover:bg-white/5"
                            >
                                Correction / Change Details
                            </Button>
                        </DrawerFooter>
                    </>
                )
            default:
                return null
        }
    }

    return (
        <Drawer open={isOpen} onOpenChange={onOpenChange} dismissible={false}>
            <DrawerContent className="h-[96vh] sm:h-auto sm:max-h-[90vh]">
                <DrawerHeader className="px-8 py-6 pb-2 dark:bg-brand-deep rounded-t-3xl">
                    <div className="flex items-center justify-between">
                        <div className="space-y-1">
                            <DrawerTitle className="text-xl font-serif text-brand-deep dark:text-brand-cream text-left">
                                {step === 'manage_payouts' ? "Manage Payouts" : "Withdraw Funds"}
                            </DrawerTitle>
                            <DrawerDescription className="text-[10px] text-brand-deep/60 dark:text-brand-cream/60 uppercase tracking-[0.2em] font-black">
                                {step === 'manage_payouts' ? "Add or update bank accounts" : "Move funds to your bank account"}
                            </DrawerDescription>
                        </div>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                                if (step === 'manage_payouts') setStep('details')
                                else if (step === 'destination_selection') setStep('details')
                                else if (step === 'other_account_form') setStep('destination_selection')
                                else if (step === 'summary') setStep(otherAccountDetails ? 'other_account_form' : 'destination_selection')
                                else onOpenChange(false)
                            }}
                            className="h-10 w-10 rounded-full bg-brand-deep/5 cursor-pointer dark:bg-white/5 hover:bg-brand-deep/10 dark:hover:bg-white/10 text-brand-accent/40 dark:text-brand-cream/40 transition-colors shrink-0"
                        >
                            <X className="w-5 h-5 text-brand-deep/40 dark:text-brand-cream/40" />
                        </Button>
                    </div>
                </DrawerHeader>
                <div className="mx-auto w-full max-w-md md:max-w-lg flex-1 flex flex-col min-h-0 overflow-hidden">
                    {renderContent()}
                </div>
            </DrawerContent>

            <PinInputDrawer
                open={isPinOpen}
                onOpenChange={setIsPinOpen}
                onSubmit={handleWithdraw}
                title="Authorize Withdrawal"
                description="Enter your 4-digit PIN to confirm the bank transfer."
            />
        </Drawer>
    )
}
