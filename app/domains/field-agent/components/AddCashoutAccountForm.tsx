"use client"

import { useState, useEffect } from "react"
import { Button } from "@/app/components/ui/button"
import { Input } from "@/app/components/ui/input"
import { Building2, Loader2, CheckCircle2, AlertCircle, ChevronsUpDown, ArrowLeft, ShieldCheck } from "lucide-react"
import { BankSelector } from "@/app/components/shared/BankSelector"
import {
    useAddCashoutAccount,
    resolveFieldAgentBankAccount,
    useFieldAgentBanks,
} from "../hooks/useFieldAgentCashoutAccounts"
import { PinInputDrawer } from "@/app/components/shared/PinInputDrawer"
import { cn } from "@/app/lib/utils"

interface AddCashoutAccountFormProps {
    onSuccess?: () => void
    onCancel?: () => void
}

type FormView = "provider-selection" | "bank-selection" | "form"

export function AddCashoutAccountForm({ onSuccess, onCancel }: AddCashoutAccountFormProps) {
    const [view, setView] = useState<FormView>("provider-selection")
    const [details, setDetails] = useState({
        bankName: "",
        bankCode: "",
        accountNumber: "",
        accountName: "",
        provider: "",
    })
    const [showPinDrawer, setShowPinDrawer] = useState(false)
    const [resolveError, setResolveError] = useState("")
    const [isResolving, setIsResolving] = useState(false)

    const providers = [
        { id: "flutterwave", name: "Flutterwave", is_enabled: true, logo_url: null },
    ]

    const addMutation = useAddCashoutAccount()
    const agentBanks = useFieldAgentBanks(details.provider)

    useEffect(() => {
        if (!details.bankCode || details.accountNumber.length !== 10) return
        const timer = setTimeout(async () => {
            setResolveError("")
            setDetails((prev) => ({ ...prev, accountName: "" }))
            setIsResolving(true)
            try {
                const data = await resolveFieldAgentBankAccount(details.accountNumber, details.bankCode)
                if (data?.accountName) {
                    setDetails((prev) => ({ ...prev, accountName: data.accountName }))
                } else {
                    setResolveError("Could not resolve account name")
                }
            } catch (err: any) {
                setResolveError(err.message || "Resolution failed")
            } finally {
                setIsResolving(false)
            }
        }, 500)
        return () => clearTimeout(timer)
    }, [details.bankCode, details.accountNumber])

    const isValid =
        details.bankName !== "" &&
        details.accountNumber.length === 10 &&
        details.accountName !== "" &&
        details.provider !== "" &&
        !isResolving

    const handleAuthorize = (e: React.FormEvent) => {
        e.preventDefault()
        if (!isValid) return
        setShowPinDrawer(true)
    }

    const handlePinSubmit = async (pin: string) => {
        await addMutation.mutateAsync({
            bankName: details.bankName,
            accountNumber: details.accountNumber,
            accountName: details.accountName,
            bankCode: details.bankCode,
            pin,
        })
        onSuccess?.()
    }

    if (view === "provider-selection") {
        return (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="space-y-2 text-center">
                    <h3 className="text-xl font-serif font-medium text-brand-deep dark:text-brand-cream">Select Payment Partner</h3>
                    <p className="text-sm text-brand-deep/40 dark:text-brand-cream/40">Choose your preferred settlement network.</p>
                </div>

                <div className="grid grid-cols-1 gap-4">
                    {providers.map((p) => (
                        <button
                            key={p.id}
                            onClick={() => {
                                setDetails((prev) => ({ ...prev, provider: p.id }))
                                setView("bank-selection")
                            }}
                            className="group flex items-center justify-between p-5 rounded-[24px] bg-white dark:bg-white/5 border border-brand-deep/5 hover:border-brand-gold/40 hover:bg-brand-gold/2 transition-all"
                        >
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-brand-deep/5 dark:bg-white/5 flex items-center justify-center">
                                    <Building2 className="w-6 h-6 text-brand-deep/40 dark:text-brand-cream/40" />
                                </div>
                                <div className="text-left">
                                    <p className="font-bold text-brand-deep dark:text-brand-cream uppercase tracking-tight">{p.name}</p>
                                    <p className="text-[10px] text-brand-accent/40 dark:text-white/20 uppercase tracking-widest">Instant Settlement</p>
                                </div>
                            </div>
                            <div className="w-8 h-8 rounded-full bg-brand-deep/5 dark:bg-white/5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <ChevronsUpDown className="w-4 h-4 text-brand-deep/40 dark:text-brand-cream/40 rotate-90" />
                            </div>
                        </button>
                    ))}
                </div>

                {onCancel && (
                    <Button
                        variant="ghost"
                        onClick={onCancel}
                        className="w-full h-14 rounded-2xl text-brand-deep/40 dark:text-brand-cream/40 font-bold uppercase tracking-widest text-[10px]"
                    >
                        Maybe Later
                    </Button>
                )}
            </div>
        )
    }

    if (view === "bank-selection") {
        return (
            <div className="flex flex-col h-[500px] animate-in fade-in zoom-in-95 duration-500">
                <div className="flex items-center gap-3 mb-6">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setView("provider-selection")}
                        className="h-10 w-10 rounded-full bg-brand-deep/5 dark:bg-white/5"
                    >
                        <ArrowLeft className="w-4 h-4" />
                    </Button>
                    <h3 className="text-xl font-serif font-medium text-brand-deep dark:text-brand-cream">Select Your Bank</h3>
                </div>

                <div className="flex-1 min-h-0">
                    <BankSelector
                        selectedBankName={details.bankName}
                        provider={details.provider}
                        banks={agentBanks.data}
                        isLoading={agentBanks.isLoading}
                        onSelect={(bank: any) => {
                            setDetails((prev) => ({ ...prev, bankName: bank.name, bankCode: bank.code }))
                            setView("form")
                        }}
                    />
                </div>
            </div>
        )
    }

    return (
        <>
            <form onSubmit={handleAuthorize} className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
                <div className="flex items-center gap-3 mb-2">
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => setView("bank-selection")}
                        className="h-10 w-10 rounded-full bg-brand-deep/5 dark:bg-white/5"
                    >
                        <ArrowLeft className="w-4 h-4" />
                    </Button>
                    <div className="space-y-0.5">
                        <h3 className="text-lg font-serif font-medium text-brand-deep dark:text-brand-cream">Confirm Details</h3>
                        <p className="text-[10px] text-brand-accent/40 dark:text-white/20 uppercase tracking-[0.2em]">Step 3 of 3</p>
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-brand-accent/40 dark:text-white/30 ml-1">Receiving Bank</label>
                        <button
                            type="button"
                            onClick={() => setView("bank-selection")}
                            className="w-full flex items-center justify-between bg-brand-deep/5 dark:bg-white/5 border-transparent h-14 rounded-2xl px-5 text-brand-deep dark:text-brand-cream hover:bg-brand-deep/10 transition-all font-bold uppercase tracking-tight"
                        >
                            {details.bankName}
                            <ArrowLeft className="w-4 h-4 rotate-180 opacity-20" />
                        </button>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-brand-accent/40 dark:text-white/30 ml-1">Account Number</label>
                        <Input
                            placeholder="0000000000"
                            value={details.accountNumber}
                            onChange={(e) =>
                                setDetails((prev) => ({ ...prev, accountNumber: e.target.value.replace(/\D/g, "").slice(0, 10) }))
                            }
                            className="h-14 bg-brand-deep/5 dark:bg-white/5 border-transparent rounded-2xl text-lg font-mono tracking-widest px-5 focus:bg-white dark:focus:bg-white/10 transition-all"
                        />
                    </div>

                    <div className="space-y-2">
                        <div className="flex items-center justify-between ml-1">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-brand-accent/40 dark:text-white/30">Resolved Name</label>
                            {isResolving && (
                                <span className="text-[10px] font-bold text-brand-gold flex items-center gap-1 uppercase tracking-tighter">
                                    <Loader2 className="w-3 h-3 animate-spin" /> Resolving...
                                </span>
                            )}
                        </div>
                        <div className={cn(
                            "h-14 flex items-center px-5 rounded-2xl border transition-all duration-500",
                            resolveError ? "bg-rose-500/5 border-rose-500/20" :
                            details.accountName ? "bg-brand-gold/5 border-brand-gold/20" : "bg-brand-deep/2 dark:bg-white/2 border-transparent"
                        )}>
                            {resolveError ? (
                                <p className="text-xs font-bold text-rose-500 uppercase tracking-tight flex items-center gap-2">
                                    <AlertCircle className="w-3.5 h-3.5" /> {resolveError}
                                </p>
                            ) : details.accountName ? (
                                <p className="text-sm font-bold text-brand-deep dark:text-brand-cream uppercase tracking-tight flex items-center gap-2">
                                    <CheckCircle2 className="w-3.5 h-3.5 text-brand-gold" /> {details.accountName}
                                </p>
                            ) : (
                                <p className="text-xs text-brand-accent/20 dark:text-white/10 uppercase tracking-widest">Enter account number...</p>
                            )}
                        </div>
                    </div>
                </div>

                <div className="pt-4">
                    <Button
                        type="submit"
                        disabled={!isValid}
                        className="w-full h-14 bg-brand-deep text-brand-gold dark:bg-brand-gold dark:text-brand-deep font-bold rounded-2xl shadow-xl hover:scale-[1.02] active:scale-95 transition-all text-xs uppercase tracking-widest disabled:opacity-50"
                    >
                        <ShieldCheck className="w-4 h-4 mr-2" />
                        Authorize & Save
                    </Button>
                </div>
            </form>

            <PinInputDrawer
                open={showPinDrawer}
                onOpenChange={setShowPinDrawer}
                onSubmit={handlePinSubmit}
                title="Authorize New Account"
                description={`Enter your PIN to save ${details.bankName} ••••${details.accountNumber.slice(-4)}.`}
            />
        </>
    )
}
