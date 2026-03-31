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
} from "@/app/components/ui/drawer"
import { useWalletBalance, usePayoutAccounts, useWithdraw, useDepositAccounts } from "@/app/domains/finance/hooks/useFinance"
import { formatCurrency } from "@/app/lib/formatters"
import { toast } from "sonner"
import { cn } from "@/app/lib/utils"
import { AddPayoutAccountForm } from './AddPayoutAccountForm'
import { PayoutAccountsManager } from './PayoutAccountsManager'
import { useRouter } from "next/navigation"
import { GlassCard } from "@/app/components/ui/glass-card"

const FALLBACK_MIN_WITHDRAWAL = 1000

function currencySymbol(code: string): string {
    if (code === "NGN") return "₦"
    const parts = new Intl.NumberFormat("en", {
        style: "currency",
        currency: code,
        currencyDisplay: "narrowSymbol",
    }).formatToParts(0)
    return parts.find((p) => p.type === "currency")?.value ?? code
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

type Step = "details" | "pin" | "manage_payouts"

export function WithdrawDrawer({ isOpen, onOpenChange, currencyCode, initialStep = "details" }: WithdrawDrawerProps) {
    const { wallet, isLoading: walletLoading } = useWalletBalance()
    const { payoutAccounts, isLoading: accountsLoading } = usePayoutAccounts()
    const { depositData, isLoading: verificationLoading } = useDepositAccounts()
    const withdrawMutation = useWithdraw()
    const router = useRouter()

    const isVerified = depositData?.isEligible ?? false
    const verificationLevel = depositData?.verificationLevel ?? 0

    const [step, setStep] = React.useState<Step>("details")
    const [amount, setAmount] = React.useState("")
    const [payoutAccountId, setPayoutAccountId] = React.useState("")
    const [pinDigits, setPinDigits] = React.useState(["", "", "", ""])

    const amountNum = parseAmount(amount)
    const withdrawalFeeTiers = wallet?.withdrawalFeeTiers ?? []
    const hasFeeConfig = withdrawalFeeTiers.length > 0

    const fee = calculateWithdrawalFee(amountNum, withdrawalFeeTiers)
    const totalDebit = amountNum + fee

    const available = wallet?.availableBalance ?? 0
    const minWithdrawal = wallet?.minimumWithdrawalAmount ?? FALLBACK_MIN_WITHDRAWAL

    const amountError =
        !walletLoading && !hasFeeConfig && amountNum > 0
            ? { type: "config" as const, text: "Withdrawal service is currently being updated. Please try again in a moment." }
            : amountNum > 0 && amountNum < minWithdrawal
                ? { type: "min" as const, text: `Minimum is ${formatCurrency(minWithdrawal, { currency: currencyCode })}.` }
                : totalDebit > available
                    ? { type: "max" as const, text: "Exceeds available balance (including fee)." }
                    : null

    const canContinue =
        hasFeeConfig &&
        amountNum >= minWithdrawal &&
        totalDebit <= available &&
        payoutAccountId &&
        !withdrawMutation.isPending
    const pin = pinDigits.join("")
    const canSubmit = canContinue && pin.length === 4 && !withdrawMutation.isPending

    const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const raw = e.target.value.replace(/[^0-9]/g, "")
        if (raw) {
            setAmount(Number(raw).toLocaleString())
        } else {
            setAmount("")
        }
    }

    const handlePinDigit = (index: number, value: string) => {
        if (value.length > 1) return
        const next = [...pinDigits]
        next[index] = value.replace(/\D/g, "")
        setPinDigits(next)
        if (value && index < 3) {
            document.getElementById(`withdraw-pin-${index + 1}`)?.focus()
        }
    }

    const handlePinKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Backspace" && !pinDigits[index] && index > 0) {
            document.getElementById(`withdraw-pin-${index - 1}`)?.focus()
        }
    }

    const handleWithdraw = async () => {
        if (!canSubmit) return
        try {
            await withdrawMutation.mutateAsync({
                amount: amountNum,
                payoutAccountId,
                pin,
            })
            toast.success("Withdrawal submitted. We're processing it.")
            setAmount("")
            setPayoutAccountId("")
            setPinDigits(["", "", "", ""])
            setStep("details")
            onOpenChange(false)
        } catch (err: unknown) {
            const msg =
                (err as { data?: { message?: string }; message?: string })?.data?.message ||
                (err as Error)?.message ||
                "Withdrawal failed"
            toast.error(msg)
        }
    }

    React.useEffect(() => {
        if (isOpen && payoutAccounts.length) {
            const defaultAccount = payoutAccounts.find((a) => a.isDefault) ?? payoutAccounts[0]
            if (defaultAccount && !payoutAccountId) {
                setPayoutAccountId(defaultAccount.id)
            }
        }

        if (!isOpen) {
            setPayoutAccountId('')
        }
    }, [isOpen, payoutAccounts, payoutAccountId])

    React.useEffect(() => {
        if (!isOpen) {
            setStep("details")
        } else if (initialStep) {
            setStep(initialStep)
        }
    }, [isOpen, initialStep])

    const amountInputRef = React.useRef<HTMLInputElement>(null)
    React.useEffect(() => {
        if (isOpen && step === "details") {
            const t = setTimeout(() => amountInputRef.current?.focus(), 0)
            return () => clearTimeout(t)
        }
    }, [isOpen, step])

    const pinFirstInputRef = React.useRef<HTMLInputElement>(null)
    React.useEffect(() => {
        if (step === "pin") {
            const t = setTimeout(() => pinFirstInputRef.current?.focus(), 0)
            return () => clearTimeout(t)
        }
    }, [step])

    const symbol = currencySymbol(currencyCode)

    return (
        <Drawer open={isOpen} onOpenChange={onOpenChange}>
            <DrawerContent>
                <DrawerHeader className="px-8 py-6">
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
                            onClick={() => step === 'manage_payouts' ? setStep('details') : onOpenChange(false)}
                            className="h-10 w-10 rounded-full bg-brand-deep/5 cursor-pointer dark:bg-white/5 hover:bg-brand-deep/10 dark:hover:bg-white/10 text-brand-accent/40 dark:text-brand-cream/40 transition-colors shrink-0"
                        >
                            <X className="w-5 h-5 text-brand-deep/40 dark:text-brand-cream/40" />
                        </Button>
                    </div>
                </DrawerHeader>
                <div className="mx-auto w-full max-w-md h-full flex flex-col min-h-[500px]">


                    <DrawerBody className="p-4 flex-1 overflow-y-auto max-h-[calc(100vh-160px)]">
                        {verificationLoading ? (
                            <div className="py-12 flex items-center justify-center">
                                <Loader2 className="w-6 h-6 animate-spin text-brand-gold" />
                            </div>
                        ) : !isVerified ? (
                            <div className="py-8 flex flex-col items-center text-center max-w-md mx-auto space-y-8 animate-in fade-in zoom-in-95 duration-700">
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
                                <div className="w-full space-y-2">
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
                                <GlassCard className="w-full p-6 space-y-4 border-brand-gold/10 bg-brand-gold/2">
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
                        ) : step === "manage_payouts" ? (
                            <div className="animate-in fade-in slide-in-from-right-4 duration-500">
                                <PayoutAccountsManager onClose={() => setStep("details")} />
                            </div>
                        ) : payoutAccounts.length === 0 && !accountsLoading ? (
                            <div className="py-12 flex flex-col items-center justify-center text-center space-y-8 animate-in fade-in zoom-in-95 duration-700">
                                <div className="relative">
                                    <div className="absolute inset-0 bg-brand-gold/20 blur-3xl rounded-full animate-pulse" />
                                    <div className="relative w-24 h-24 rounded-[2.5rem] bg-linear-to-br from-brand-deep to-brand-accent flex items-center justify-center shadow-2xl overflow-hidden group rotate-3">
                                        <Building2 className="w-12 h-12 text-brand-gold group-hover:scale-110 transition-transform duration-700 -rotate-3" />
                                        <div className="absolute inset-0 bg-linear-to-t from-black/20 to-transparent" />
                                    </div>
                                </div>
                                <div className="space-y-2 max-w-[280px]">
                                    <h4 className="text-2xl font-serif font-black text-brand-deep dark:text-white tracking-tight">No settlement account</h4>
                                    <p className="text-[10px] text-brand-deep/40 dark:text-white/30 leading-relaxed uppercase tracking-[0.2em] font-black">Link a bank account to start receiving your business settlements directly.</p>
                                </div>
                                <Button
                                    onClick={() => setStep("manage_payouts")}
                                    className="w-full h-16 bg-brand-deep text-brand-gold dark:bg-brand-gold dark:text-brand-deep font-black uppercase tracking-widest text-xs rounded-2xl shadow-[0_20px_40px_rgba(0,0,0,0.2)] flex items-center justify-center gap-3 group hover:translate-y-[-4px] active:translate-y-0 transition-all duration-300"
                                >
                                    <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform duration-500" />
                                    Link Bank Account
                                </Button>
                            </div>
                        ) : step === "details" ? (
                            <div className="space-y-8 animate-in fade-in slide-in-from-left-4 duration-500">
                                <div className="space-y-6">
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-accent/40 dark:text-white/20 ml-1">
                                            Amount (Min {formatCurrency(minWithdrawal, { currency: currencyCode })})
                                        </label>
                                        <div className="relative group">
                                            <div className="absolute -inset-1 bg-brand-gold/0 group-focus-within:bg-brand-gold/10 rounded-4xl transition-all duration-500 blur-md" />
                                            <div className="relative flex items-center rounded-3xl border border-brand-deep/5 bg-brand-deep/3 dark:bg-white/3 overflow-hidden transition-all duration-300 focus-within:ring-2 focus-within:ring-brand-gold/30 focus-within:bg-white dark:focus-within:bg-brand-deep group shadow-xs">
                                                <span className="flex items-center justify-center min-w-16 px-4 h-16 text-brand-deep/40 dark:text-brand-cream/40 font-serif text-2xl shrink-0 border-r border-brand-deep/5 dark:border-white/5">
                                                    {symbol}
                                                </span>
                                                <Input
                                                    ref={amountInputRef}
                                                    type="text"
                                                    inputMode="numeric"
                                                    placeholder="0.00"
                                                    value={amount}
                                                    onChange={handleAmountChange}
                                                    className="h-16 py-0 rounded-none border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 pl-4 text-3xl font-serif font-black text-brand-deep dark:text-white placeholder:text-brand-deep/10"
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
                                                    <span className="text-[9px] font-black uppercase tracking-widest text-brand-deep/40 dark:text-white/30">
                                                        Fee: {walletLoading ? "Calculating…" : formatCurrency(fee, { currency: currencyCode })}
                                                    </span>
                                                </div>
                                            ) : (
                                                <span className="text-[9px] font-black uppercase tracking-widest text-brand-deep/30 dark:text-white/20">
                                                    Available: {walletLoading ? "…" : formatCurrency(available, { currency: currencyCode })}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="space-y-3 bg-white dark:bg-white/10 border border-brand-deep/10 dark:border-white/10 rounded-3xl p-4">
                                        <div className="flex items-center justify-between ml-1">
                                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-accent/40 dark:text-white/20">
                                                Select Destination
                                            </label>
                                            <button
                                                onClick={() => setStep("manage_payouts")}
                                                className="text-[10px] cursor-pointer font-black text-brand-gold hover:text-brand-gold/80 uppercase tracking-widest flex items-center gap-1 transition-all hover:gap-1.5"
                                            >
                                                <Settings2 className="w-3 h-3" />
                                                Manage
                                            </button>
                                        </div>
                                        <div className="grid grid-cols-1 gap-3">
                                            {payoutAccounts.map((account) => (
                                                <button
                                                    key={account.id}
                                                    onClick={() => setPayoutAccountId(account.id)}
                                                    className={cn(
                                                        "group cursor-pointer relative flex items-center justify-between p-4 rounded-3xl border transition-all duration-500",
                                                        payoutAccountId === account.id
                                                            ? "bg-brand-gold shadow-[0_15px_30px_rgba(182,143,76,0.15)] border-brand-gold"
                                                            : "bg-brand-deep/3 dark:bg-white/3 border-transparent hover:border-brand-deep/10 dark:hover:border-white/10"
                                                    )}
                                                >
                                                    <div className="flex items-center gap-4 min-w-0">
                                                        <div className={cn(
                                                            "w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500",
                                                            payoutAccountId === account.id ? "bg-white/60 text-brand-deep shadow-inner" : "bg-white dark:bg-white/10 text-brand-deep/30 dark:text-white/30"
                                                        )}>
                                                            <Building2 className="w-6 h-6" />
                                                        </div>
                                                        <div className="text-left min-w-0">
                                                            <div className="flex items-center gap-1.5">
                                                                <span className={cn(
                                                                    "text-[11px] font-black uppercase tracking-tight truncate",
                                                                    payoutAccountId === account.id ? "text-brand-deep" : "text-brand-deep dark:text-brand-cream"
                                                                )}>
                                                                    {account.bankName}
                                                                </span>
                                                                {account.isDefault && (
                                                                    <span className={cn(
                                                                        "text-[8px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-tighter",
                                                                        payoutAccountId === account.id ? "bg-brand-deep/10 text-brand-deep" : "bg-brand-gold/20 text-brand-gold"
                                                                    )}>Default</span>
                                                                )}
                                                            </div>
                                                            <span className={cn(
                                                                "text-xs font-mono font-medium block",
                                                                payoutAccountId === account.id ? "text-brand-deep/60" : "text-brand-accent/40 dark:text-white/40"
                                                            )}>{account.accountNumber}</span>
                                                        </div>
                                                    </div>
                                                    {payoutAccountId === account.id && (
                                                        <div className="w-6 h-6 rounded-full bg-brand-deep flex items-center justify-center shadow-lg animate-in zoom-in duration-500">
                                                            <Check className="w-3.5 h-3.5 text-brand-gold" strokeWidth={4} />
                                                        </div>
                                                    )}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-4">
                                    <Button
                                        onClick={() => setStep("pin")}
                                        disabled={!amount || !!amountError || !payoutAccountId}
                                        className="w-full h-16 bg-brand-deep text-brand-gold dark:bg-brand-gold dark:text-brand-deep font-black uppercase tracking-[0.2em] text-xs rounded-3xl shadow-2xl hover:translate-y-[-4px] active:translate-y-0 transition-all duration-300 disabled:opacity-50 disabled:translate-y-0"
                                    >
                                        Authorize Withdrawal
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-10 py-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
                                <div className="text-center space-y-6">
                                    <div className="mx-auto w-20 h-20 rounded-4xl bg-brand-gold/10 flex items-center justify-center text-brand-gold mb-6 group relative">
                                        <div className="absolute inset-0 bg-brand-gold/20 blur-2xl rounded-full animate-pulse" />
                                        <Lock className="w-10 h-10 relative z-10" />
                                    </div>
                                    <div className="space-y-2">
                                        <h4 className="text-3xl font-serif font-black text-brand-deep dark:text-white tracking-tight">Authorize Withdrawal</h4>
                                        <p className="text-[10px] text-brand-deep/40 dark:text-white/30 uppercase font-black tracking-[0.2em]">Enter your 4-digit pin to authorize debit of</p>
                                        <div className="text-2xl font-serif font-black text-brand-deep dark:text-white tracking-tight">
                                            {formatCurrency(amountNum + fee, { currency: currencyCode })}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex justify-center gap-4 max-w-sm mx-auto">
                                    {pinDigits.map((digit, i) => (
                                        <input
                                            key={i}
                                            ref={i === 0 ? pinFirstInputRef : undefined}
                                            id={`withdraw-pin-${i}`}
                                            type="password"
                                            inputMode="numeric"
                                            maxLength={1}
                                            value={digit}
                                            onChange={(e) => handlePinDigit(i, e.target.value)}
                                            onKeyDown={(e) => handlePinKeyDown(i, e)}
                                            className="sm:w-20 sm:h-20 w-16 h-16 rounded-2xl bg-brand-deep/5 dark:bg-white/5 border-2 border-transparent focus:border-brand-gold focus:bg-white dark:focus:bg-brand-deep text-center text-3xl font-serif font-black transition-all outline-hidden shadow-inner text-brand-deep dark:text-white"
                                        />
                                    ))}
                                </div>

                                <div className="flex flex-col gap-4 pt-4">
                                    <Button
                                        onClick={handleWithdraw}
                                        disabled={pinDigits.some(d => !d) || withdrawMutation.isPending}
                                        className="w-full h-18 bg-brand-deep text-brand-gold dark:bg-brand-gold dark:text-brand-deep font-black uppercase tracking-[0.3em] text-sm rounded-3xl shadow-[0_25px_50px_rgba(0,0,0,0.3)] hover:scale-[1.02] active:scale-95 transition-all duration-300"
                                    >
                                        {withdrawMutation.isPending ? (
                                            <div className="flex items-center gap-3">
                                                <Loader2 className="w-6 h-6 animate-spin" />
                                                <span>Processing...</span>
                                            </div>
                                        ) : (
                                            "Confirm & Execute"
                                        )}
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        onClick={() => setStep("details")}
                                        disabled={withdrawMutation.isPending}
                                        className="h-12 rounded-2xl border border-brand-deep/10 dark:border-white/10 text-brand-deep/40 dark:text-brand-cream/40 font-black uppercase tracking-widest text-[9px] hover:bg-brand-deep/5 dark:hover:bg-white/5"
                                    >
                                        Correction / Change Details
                                    </Button>
                                </div>
                            </div>
                        )}
                    </DrawerBody>
                </div>
            </DrawerContent>
        </Drawer>
    )
}
