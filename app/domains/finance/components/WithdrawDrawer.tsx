"use client"

import * as React from "react"
import { Wallet, Building2, Check, Lock, Loader2 } from "lucide-react"
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
import { useWalletBalance, usePayoutAccounts, useWithdraw } from "@/app/domains/finance/hooks/useFinance"
import { formatCurrency } from "@/app/lib/formatters"
import { toast } from "sonner"
import { cn } from "@/app/lib/utils"

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

type Step = "details" | "pin"

export function WithdrawDrawer({ isOpen, onOpenChange, currencyCode }: WithdrawDrawerProps) {
    const { wallet, isLoading: walletLoading } = useWalletBalance()
    const { payoutAccounts, isLoading: accountsLoading } = usePayoutAccounts()
    const withdrawMutation = useWithdraw()

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

    const selectedAccount = payoutAccounts.find((a) => a.id === payoutAccountId)

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

    const goToPin = () => {
        if (!canContinue) return
        setStep("pin")
        setPinDigits(["", "", "", ""])
    }

    const goBack = () => {
        setStep("details")
        setPinDigits(["", "", "", ""])
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
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
        if (isOpen && payoutAccounts.length && !payoutAccountId) {
            const defaultAccount = payoutAccounts.find((a) => a.isDefault) ?? payoutAccounts[0]
            setPayoutAccountId(defaultAccount.id)
        }
    }, [isOpen, payoutAccounts, payoutAccountId])

    React.useEffect(() => {
        if (!isOpen) setStep("details")
    }, [isOpen])

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
                <div className="mx-auto w-full max-w-md">
                    {step === "details" && (
                        <>
                            <DrawerHeader>
                                <div className="mx-auto bg-brand-deep/5 dark:bg-white/5 p-3 rounded-full w-fit mb-4">
                                    <Wallet className="w-6 h-6 text-brand-deep dark:text-brand-cream" />
                                </div>
                                <DrawerTitle className="text-center text-xl font-serif text-brand-deep dark:text-brand-cream">
                                    Withdraw Funds
                                </DrawerTitle>
                                <DrawerDescription className="text-center text-brand-deep/60 dark:text-brand-cream/60">
                                    Move funds to your bank account.
                                </DrawerDescription>
                            </DrawerHeader>

                            <DrawerBody className="p-4 space-y-6 max-h-[calc(100vh-200px)] overflow-y-auto">
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-brand-deep/60 dark:text-brand-cream/60">
                                            Amount (Min {formatCurrency(minWithdrawal, { currency: currencyCode })})
                                        </label>
                                        <div className="flex rounded-2xl border border-transparent bg-brand-deep/5 dark:bg-white/5 overflow-hidden focus-within:ring-2 focus-within:ring-brand-deep/20 focus-within:border-brand-deep/10">
                                            <span className="flex items-center justify-center min-w-14 px-3 h-12 text-brand-deep/50 dark:text-brand-cream/50 font-serif text-base shrink-0 border-r border-brand-deep/10 dark:border-white/10">
                                                {symbol}
                                            </span>
                                            <Input
                                                ref={amountInputRef}
                                                type="text"
                                                inputMode="numeric"
                                                placeholder="0.00"
                                                value={amount}
                                                onChange={handleAmountChange}
                                                className="h-12 rounded-none border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 pl-3"
                                                aria-describedby={amountError ? "amount-hint amount-error" : "amount-hint"}
                                            />
                                        </div>
                                        {amountError ? (
                                            <span id="amount-error" className={cn(
                                                "text-xs font-medium",
                                                amountError.type === "config" ? "text-amber-600 dark:text-amber-400" :
                                                    amountError.type === "min" ? "text-orange-500" : "text-red-500"
                                            )} role="alert">
                                                {amountError.text}
                                            </span>
                                        ) : amountNum > 0 ? (
                                            <div className="flex items-center gap-1.5 h-4">
                                                {walletLoading ? (
                                                    <Loader2 className="w-3 h-3 animate-spin text-brand-deep/30 dark:text-brand-cream/30" />
                                                ) : null}
                                                <span className="text-xs text-brand-deep/60 dark:text-brand-cream/60">
                                                    Fee: {walletLoading ? "Calculating…" : formatCurrency(fee, { currency: currencyCode })}
                                                </span>
                                            </div>
                                        ) : (
                                            <span id="amount-hint" className="text-xs text-brand-deep/40 dark:text-brand-cream/40">
                                                Available: {walletLoading ? "…" : formatCurrency(available, { currency: currencyCode })}
                                            </span>
                                        )}
                                    </div>

                                    <div className="space-y-3">
                                        <label className="text-sm font-medium text-brand-deep/60 dark:text-brand-cream/60">
                                            To account
                                        </label>
                                        {payoutAccounts.length === 0 && !accountsLoading ? (
                                            <p className="text-sm text-amber-600 dark:text-amber-400 py-3">
                                                Add a payout account in settings first.
                                            </p>
                                        ) : (
                                            <div className="space-y-3 bg-brand-deep/5 dark:bg-white/5 rounded-3xl p-3">
                                                {payoutAccounts.map((acc) => (
                                                    <button
                                                        key={acc.id}
                                                        type="button"
                                                        onClick={() => setPayoutAccountId(acc.id)}
                                                        className={cn(
                                                            "w-full cursor-pointer p-4 rounded-3xl flex items-center gap-4 transition-all text-left border-2",
                                                            payoutAccountId === acc.id
                                                                ? "bg-brand-deep/5 dark:bg-white/5 border-brand-gold/50 dark:border-brand-gold/40 shadow-md shadow-brand-gold/5"
                                                                : "bg-white dark:bg-white/5 border-brand-deep/10 dark:border-white/10 hover:border-brand-deep/20 dark:hover:border-white/20 hover:bg-brand-deep/3 dark:hover:bg-white/5"
                                                        )}
                                                    >
                                                        <div
                                                            className={cn(
                                                                "w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-colors",
                                                                payoutAccountId === acc.id
                                                                    ? "bg-brand-deep text-brand-gold dark:bg-brand-gold dark:text-brand-deep"
                                                                    : "bg-brand-deep/5 dark:bg-white/10 text-brand-deep/60 dark:text-brand-cream/60"
                                                            )}
                                                        >
                                                            <Building2 className="w-6 h-6" />
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <div className="font-semibold text-brand-deep dark:text-brand-cream flex items-center gap-2 flex-wrap">
                                                                {acc.bankName}
                                                                {acc.isDefault && (
                                                                    <span className="text-[10px] bg-brand-gold/15 text-brand-gold px-2 py-0.5 rounded-full font-bold uppercase">
                                                                        Default
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <div className="text-sm text-brand-deep/70 dark:text-brand-cream/70 font-mono mt-0.5">
                                                                {acc.accountNumber ?? ""}
                                                            </div>
                                                        </div>
                                                        {payoutAccountId === acc.id && (
                                                            <div className="w-6 h-6 rounded-full bg-brand-deep dark:bg-brand-gold flex items-center justify-center text-brand-gold dark:text-brand-deep shrink-0">
                                                                <Check className="w-3.5 h-3.5" strokeWidth={3} />
                                                            </div>
                                                        )}
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="flex gap-3">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        className="flex-1 h-12 rounded-2xl bg-brand-deep/5 dark:bg-white/5 border-transparent hover:bg-brand-deep/10 dark:hover:bg-white/10 text-brand-deep dark:text-brand-cream font-medium"
                                        onClick={() => onOpenChange(false)}
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        type="button"
                                        disabled={!canContinue}
                                        onClick={goToPin}
                                        className="flex-1 h-12 bg-brand-deep hover:bg-brand-deep/90 text-brand-cream dark:bg-brand-gold dark:text-brand-deep dark:hover:bg-brand-gold/90 text-base font-medium rounded-2xl"
                                    >
                                        Continue
                                    </Button>
                                </div>
                            </DrawerBody>
                        </>
                    )}

                    {step === "pin" && selectedAccount && (
                        <>
                            <div className="relative">
                                <DrawerHeader>
                                    <div className="mx-auto bg-brand-gold/10 dark:bg-brand-gold/20 p-4 rounded-2xl w-fit mb-4">
                                        <Lock className="w-8 h-8 text-brand-gold" />
                                    </div>
                                    <DrawerTitle className="text-center text-xl font-serif text-brand-deep dark:text-brand-cream">
                                        Confirm with PIN
                                    </DrawerTitle>
                                    <DrawerDescription className="text-center text-brand-deep/60 dark:text-brand-cream/60">
                                        Enter your 4-digit transaction PIN to authorise this withdrawal.
                                    </DrawerDescription>
                                </DrawerHeader>
                            </div>

                            <DrawerBody className="p-4 pt-0 space-y-6 max-h-[calc(100vh-200px)] overflow-y-auto">
                                <div className="rounded-2xl bg-brand-deep/5 dark:bg-white/5 border border-brand-deep/10 dark:border-white/10 p-4 space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-brand-deep/60 dark:text-brand-cream/60">Amount</span>
                                        <span className="font-semibold text-brand-deep dark:text-brand-cream">
                                            {formatCurrency(amountNum, { currency: currencyCode })}
                                        </span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-brand-deep/60 dark:text-brand-cream/60">Fee</span>
                                        <span className="font-medium text-brand-deep dark:text-brand-cream">
                                            {formatCurrency(fee, { currency: currencyCode })}
                                        </span>
                                    </div>
                                    <div className="pt-2 mt-2 border-t border-brand-deep/10 dark:border-white/10 flex justify-between text-base font-bold">
                                        <span className="text-brand-deep dark:text-brand-cream">Total Debit</span>
                                        <span className="text-brand-deep dark:text-brand-cream">
                                            {formatCurrency(totalDebit, { currency: currencyCode })}
                                        </span>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <p className="text-center text-xs font-medium text-brand-deep/50 dark:text-brand-cream/50 uppercase tracking-wider">
                                        Transaction PIN
                                    </p>
                                    <div className="flex justify-center gap-3">
                                        {pinDigits.map((digit, i) => (
                                            <Input
                                                key={i}
                                                ref={i === 0 ? pinFirstInputRef : undefined}
                                                id={`withdraw-pin-${i}`}
                                                type="password"
                                                inputMode="numeric"
                                                autoComplete="off"
                                                maxLength={1}
                                                value={digit}
                                                onChange={(e) => handlePinDigit(i, e.target.value)}
                                                onKeyDown={(e) => handlePinKeyDown(i, e)}
                                                className="w-14 h-14 text-center text-2xl font-bold rounded-2xl bg-brand-deep/5 dark:bg-white/5 border-2 border-transparent focus:border-brand-gold focus:ring-2 focus:ring-brand-gold/20 text-brand-deep dark:text-brand-cream transition-all"
                                            />
                                        ))}
                                    </div>
                                </div>

                                <form onSubmit={handleSubmit} className="space-y-3">
                                    <Button
                                        type="submit"
                                        disabled={!canSubmit}
                                        className="w-full h-16 bg-brand-deep hover:bg-brand-deep/90 text-brand-cream dark:bg-brand-gold dark:text-brand-deep dark:hover:bg-brand-gold/90 text-base font-medium rounded-2xl"
                                    >
                                        {withdrawMutation.isPending ? (
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                        ) : (
                                            "Withdraw " + formatCurrency(totalDebit, { currency: currencyCode })
                                        )}
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        className="w-full h-14 rounded-2xl text-brand-deep/60 dark:text-brand-cream/60"
                                        onClick={goBack}
                                    >
                                        Change details
                                    </Button>
                                </form>
                            </DrawerBody>
                        </>
                    )}
                </div>
            </DrawerContent>
        </Drawer>
    )
}
