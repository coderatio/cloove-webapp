"use client"

import { useState, useEffect } from "react"
import { Button } from "@/app/components/ui/button"
import { Input } from "@/app/components/ui/input"
import { Building2, Loader2, CheckCircle2, AlertCircle, ChevronsUpDown, ArrowLeft, Lock } from "lucide-react"
import { BankSelector, Bank } from "@/app/components/shared/BankSelector"
import { useAddPayoutAccount, useResolveAccount } from "../hooks/useFinance"
import { cn } from "@/app/lib/utils"

interface AddPayoutAccountFormProps {
    onSuccess?: () => void
    onCancel?: () => void
}

type FormView = "form" | "bank-selection"

export function AddPayoutAccountForm({ onSuccess, onCancel }: AddPayoutAccountFormProps) {
    const [view, setView] = useState<FormView>("form")
    const [details, setDetails] = useState({
        bankName: "",
        bankCode: "",
        accountNumber: "",
        accountName: "",
        pin: ""
    })

    const [resolveError, setResolveError] = useState("")

    const addPayoutAccount = useAddPayoutAccount()
    const resolveAccountMutation = useResolveAccount()

    // Real Account Name Resolution
    useEffect(() => {
        if (details.bankCode && details.accountNumber.length === 10) {
            resolveAccount()
        }
    }, [details.bankCode, details.accountNumber])

    const resolveAccount = async () => {
        setResolveError("")
        setDetails(prev => ({ ...prev, accountName: "" }))

        resolveAccountMutation.mutate({
            accountNumber: details.accountNumber,
            bankCode: details.bankCode
        }, {
            onSuccess: (response) => {
                if (response.data?.accountName) {
                    setDetails(prev => ({ ...prev, accountName: response.data!.accountName }))
                } else {
                    setResolveError("Could not resolve account name")
                }
            },
            onError: (err: any) => {
                setResolveError(err.data?.message || err.message || "Resolution failed")
            }
        })
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!isValid) return

        addPayoutAccount.mutate(details, {
            onSuccess: () => {
                onSuccess?.()
            }
        })
    }

    const isValid =
        details.bankName !== "" &&
        details.accountNumber.length === 10 &&
        details.accountName !== "" &&
        details.pin.length === 4 &&
        !resolveAccountMutation.isPending &&
        !addPayoutAccount.isPending

    if (view === "bank-selection") {
        return (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300 h-full flex flex-col">
                <div className="flex items-center gap-3 mb-2">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setView("form")}
                        className="h-8 w-8 rounded-full bg-brand-deep/5 dark:bg-white/5 hover:bg-brand-deep/10 dark:hover:bg-white/10"
                    >
                        <ArrowLeft className="w-4 h-4 text-brand-deep/60 dark:text-brand-cream/60" />
                    </Button>
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-accent/40 dark:text-white/20">
                        Select Bank
                    </span>
                </div>
                <div className="flex-1">
                    <BankSelector
                        selectedBankName={details.bankName}
                        onSelect={(bank: Bank) => {
                            setDetails(prev => ({ ...prev, bankName: bank.name, bankCode: bank.code }))
                            setView("form")
                        }}
                    />
                </div>
            </div>
        )
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6 animate-in fade-in slide-in-from-left-4 duration-300">
            {onCancel && (
                <div className="flex items-center gap-3 mb-2">
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={onCancel}
                        className="h-8 w-8 rounded-full bg-brand-deep/5 dark:bg-white/5 hover:bg-brand-deep/10 dark:hover:bg-white/10"
                    >
                        <ArrowLeft className="w-4 h-4 text-brand-deep/60 dark:text-brand-cream/60" />
                    </Button>
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-accent/40 dark:text-white/20">
                        Add Payout Account
                    </span>
                </div>
            )}
            <div className="space-y-4">
                <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-brand-accent/40 dark:text-white/30 ml-1">Bank Name</label>
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => setView("bank-selection")}
                        className="w-full justify-between bg-brand-deep/5 dark:bg-white/5 border-transparent h-12 rounded-xl text-brand-deep dark:text-brand-cream hover:bg-brand-deep/10 dark:hover:bg-white/10 transition-all"
                    >
                        <span className={details.bankName ? "font-medium" : "text-brand-deep/40 dark:text-brand-cream/40"}>
                            {details.bankName || "Select your bank..."}
                        </span>
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                </div>

                <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-brand-accent/40 dark:text-white/30 ml-1">Account Number</label>
                    <Input
                        type="tel"
                        placeholder="0123456789"
                        maxLength={10}
                        value={details.accountNumber}
                        onChange={(e) => setDetails({ ...details, accountNumber: e.target.value.replace(/\D/g, '') })}
                        className="bg-brand-deep/5 dark:bg-white/5 border-transparent h-12 rounded-xl focus:bg-white dark:focus:bg-white/10 transition-all font-mono"
                    />
                </div>

                <div className="space-y-2">
                    <div className="flex items-center justify-between ml-1">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-brand-accent/40 dark:text-white/30">Account Name</label>
                        {resolveAccountMutation.isPending && (
                            <span className="text-[10px] font-bold text-brand-gold flex items-center gap-1 uppercase tracking-tighter">
                                <Loader2 className="w-3 h-3 animate-spin" /> Resolving...
                            </span>
                        )}
                        {details.accountName && (
                            <span className="text-[10px] font-bold text-emerald-500 flex items-center gap-1 uppercase tracking-tighter">
                                <CheckCircle2 className="w-3 h-3" /> Verified
                            </span>
                        )}
                        {resolveError && (
                            <span className="text-[10px] font-bold text-rose-500 flex items-center gap-1 uppercase tracking-tighter">
                                <AlertCircle className="w-3 h-3" /> {resolveError}
                            </span>
                        )}
                    </div>
                    <Input
                        placeholder="Account Name"
                        value={details.accountName}
                        readOnly
                        className={cn(
                            "bg-brand-deep/5 dark:bg-white/5 border-transparent h-12 rounded-xl transition-all",
                            details.accountName ? "text-brand-deep dark:text-brand-cream font-medium bg-emerald-500/5 dark:bg-emerald-500/10 border-emerald-500/10" : "text-brand-deep/40 dark:text-brand-cream/40 italic"
                        )}
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-brand-accent/40 dark:text-white/30 ml-1">Transaction PIN</label>
                    <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-deep/20 dark:text-white/20" />
                        <Input
                            type="password"
                            inputMode="numeric"
                            autoComplete="one-time-code"
                            pattern="\d{4}"
                            placeholder="Enter 4-digit PIN"
                            maxLength={4}
                            value={details.pin}
                            onChange={(e) => setDetails({ ...details, pin: e.target.value.replace(/\D/g, '') })}
                            className="bg-brand-deep/5 dark:bg-white/5 border-transparent h-12 rounded-xl pl-10 focus:bg-white dark:focus:bg-white/10 transition-all tracking-[0.5em] font-mono"
                        />
                    </div>
                    <p className="text-[9px] text-brand-accent/40 dark:text-white/20 ml-1">Required to securely add a payout account.</p>
                </div>
            </div>

            <div className="flex gap-4 pt-4">
                {onCancel && (
                    <Button
                        type="button"
                        variant="ghost"
                        onClick={onCancel}
                        disabled={addPayoutAccount.isPending}
                        className="flex-1 h-12 rounded-xl text-brand-deep/60 dark:text-brand-cream/60"
                    >
                        Back
                    </Button>
                )}
                <Button
                    type="submit"
                    disabled={!isValid}
                    className="flex-3 h-12 bg-brand-deep text-brand-gold dark:bg-brand-gold dark:text-brand-deep font-bold rounded-xl shadow-xl hover:scale-[1.02] active:scale-95 transition-all"
                >
                    {addPayoutAccount.isPending ? (
                        <div className="flex items-center gap-2">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Saving...
                        </div>
                    ) : (
                        "Save Account"
                    )}
                </Button>
            </div>
        </form>
    )
}
