"use client"

import { useState, useEffect } from "react"
import { Button } from "@/app/components/ui/button"
import { Input } from "@/app/components/ui/input"
import { Building2, Loader2, CheckCircle2, AlertCircle, ChevronsUpDown, ArrowLeft, Lock } from "lucide-react"
import { BankSelector, Bank } from "@/app/components/shared/BankSelector"
import { useAddPayoutAccount, useResolveAccount, usePaymentProviders } from "../hooks/useFinance"
import { cn } from "@/app/lib/utils"

interface AddPayoutAccountFormProps {
    onSuccess?: () => void
    onCancel?: () => void
}

type FormView = "form" | "bank-selection" | "provider-selection"

export function AddPayoutAccountForm({ onSuccess, onCancel }: AddPayoutAccountFormProps) {
    const { data: providersResponse, isLoading: providersLoading } = usePaymentProviders()
    const enabledProviders = providersResponse?.data?.filter((p) => p.is_enabled) || []

    const [view, setView] = useState<FormView>("provider-selection")
    const [details, setDetails] = useState({
        bankName: "",
        bankCode: "",
        accountNumber: "",
        accountName: "",
        provider: "",
        pin: ""
    })

    const addPayoutAccount = useAddPayoutAccount()
    const resolveAccountMutation = useResolveAccount()

    const [resolveError, setResolveError] = useState("")

    // Initialize view and provider based on loaded data
    useEffect(() => {
        if (!providersLoading && enabledProviders.length > 0) {
            if (enabledProviders.length === 1) {
                setDetails((prev) => ({ ...prev, provider: enabledProviders[0].id }))
                setView("form")
            } else if (!details.provider) {
                setView("provider-selection")
            }
        }
    }, [providersLoading, enabledProviders.length, details.provider])

    // Real Account Name Resolution
    useEffect(() => {
        if (details.bankCode && details.accountNumber.length === 10 && details.provider) {
            resolveAccount()
        }
    }, [details.bankCode, details.accountNumber, details.provider])

    const [isResolving, setIsResolving] = useState(false)

    const resolveAccount = async () => {
        setResolveError("")
        setDetails(prev => ({ ...prev, accountName: "" }))
        setIsResolving(true)

        resolveAccountMutation.mutate({
            accountNumber: details.accountNumber,
            bankCode: details.bankCode,
            provider: details.provider
        }, {
            onSuccess: (response) => {
                if (response.data?.accountName) {
                    setDetails(prev => ({ ...prev, accountName: response.data!.accountName }))
                } else {
                    setResolveError("Could not resolve account name")
                }
                setIsResolving(false)
            },
            onError: (err: any) => {
                setResolveError(err.data?.message || err.message || "Resolution failed")
                setIsResolving(false)
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
        details.provider !== "" &&
        details.pin.length === 4 &&
        !isResolving &&
        !addPayoutAccount.isPending

    if (providersLoading) {
        return (
            <div className="flex flex-col items-center justify-center py-20 animate-pulse">
                <Loader2 className="w-10 h-10 animate-spin text-brand-gold/40" />
                <p className="mt-4 text-[10px] font-bold uppercase tracking-widest text-brand-accent/40">
                    Sourcing providers...
                </p>
            </div>
        )
    }

    if (view === "provider-selection") {
        return (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="flex items-center gap-3 mb-2">
                    {onCancel && (
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={onCancel}
                            className="h-8 w-8 rounded-full bg-brand-deep/5 dark:bg-white/5 hover:bg-brand-deep/10 dark:hover:bg-white/10"
                        >
                            <ArrowLeft className="w-4 h-4 text-brand-deep/60 dark:text-brand-cream/60" />
                        </Button>
                    )}
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-accent/40 dark:text-white/20">
                        Select Payment Partner
                    </span>
                </div>

                <div className="grid grid-cols-1 gap-3">
                    {enabledProviders.map((provider) => (
                        <button
                            key={provider.id}
                            type="button"
                            onClick={() => {
                                setDetails(prev => ({ ...prev, provider: provider.id }))
                                setView("form")
                            }}
                            className="group cursor-pointer relative flex items-center gap-4 p-4 rounded-3xl border border-brand-deep/5 bg-brand-deep/3 dark:bg-white/3 hover:border-brand-gold/50 transition-all duration-300 text-left"
                        >
                            <div className="w-12 h-12 rounded-2xl bg-white dark:bg-white/10 flex items-center justify-center shadow-sm">
                                {provider.logo_url ? (
                                    <img src={provider.logo_url} alt={provider.name} className="w-8 h-8 object-contain" />
                                ) : (
                                    <Building2 className="w-6 h-6 text-brand-deep/20 dark:text-white/20" />
                                )}
                            </div>
                            <div>
                                <p className="font-bold text-brand-deep dark:text-brand-cream uppercase tracking-tight">{provider.name}</p>
                                <p className="text-[10px] text-brand-accent/40 dark:text-white/20 uppercase tracking-widest">Connect your bank via {provider.name}</p>
                            </div>
                        </button>
                    ))}
                </div>
            </div>
        )
    }

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
                        provider={details.provider}
                        onSelect={(bank: Bank) => {
                            setDetails(prev => ({ ...prev, bankName: bank.name, bankCode: bank.code }))
                            setView("form")
                        }}
                    />
                </div>
            </div>
        )
    }

    const selectedProvider = enabledProviders.find(p => p.id === details.provider)

    return (
        <form onSubmit={handleSubmit} className="space-y-6 animate-in fade-in slide-in-from-left-4 duration-300">
            {(onCancel || enabledProviders.length > 1) && (
                <div className="flex items-center gap-3 mb-2">
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => (enabledProviders.length > 1 ? setView("provider-selection") : onCancel?.())}
                        className="h-8 w-8 rounded-full bg-brand-deep/5 dark:bg-white/5 hover:bg-brand-deep/10 dark:hover:bg-white/10"
                    >
                        <ArrowLeft className="w-4 h-4 text-brand-deep/60 dark:text-brand-cream/60" />
                    </Button>
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-accent/40 dark:text-white/20">
                        {enabledProviders.length > 1 && selectedProvider
                            ? `Add Account via ${selectedProvider.name}`
                            : "Add Payout Account"}
                    </span>
                </div>
            )}
            <div className="space-y-4">
                <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-brand-accent/40 dark:text-brand-cream/80 ml-1">Bank Name</label>
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => setView("bank-selection")}
                        className="w-full justify-between bg-brand-deep/5 dark:bg-white/5 border-transparent h-14 rounded-xl text-brand-deep dark:text-brand-cream hover:bg-brand-deep/10 dark:hover:bg-white/10 transition-all font-bold uppercase tracking-tight"
                    >
                        <span className={details.bankName ? "font-medium" : "text-brand-deep/40 dark:text-brand-cream/40"}>
                            {details.bankName || "Select your bank..."}
                        </span>
                        <ArrowLeft className="w-4 h-4 rotate-180 opacity-20" />
                    </Button>
                </div>

                <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-brand-accent/40 dark:text-brand-cream/80 ml-1">Account Number</label>
                    <Input
                        type="tel"
                        placeholder="0123456789"
                        maxLength={10}
                        value={details.accountNumber}
                        onChange={(e) => setDetails({ ...details, accountNumber: e.target.value.replace(/\D/g, '') })}
                        className="bg-brand-deep/5 h-14 dark:bg-white/5 border-transparent rounded-xl focus:bg-white dark:focus:bg-white/10 transition-all font-mono"
                    />
                </div>

                <div className="space-y-2">
                    <div className="flex items-center justify-between ml-1">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-brand-accent/40 dark:text-brand-cream/80">Account Name</label>
                        {isResolving && (
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
                            "bg-brand-deep/5 dark:bg-white/5 border-transparent h-14 rounded-xl transition-all",
                            details.accountName ? "text-brand-deep dark:text-brand-cream font-medium bg-emerald-500/5 dark:bg-emerald-500/10 border-emerald-500/10" : "text-brand-deep/40 dark:text-brand-cream/40 italic"
                        )}
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-brand-accent/40 dark:text-brand-cream/80 ml-1">Transaction PIN</label>
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
                            className="bg-brand-deep/5 dark:bg-white/5 border-transparent h-14 rounded-xl pl-10 focus:bg-white dark:focus:bg-white/10 transition-all tracking-[0.5em] font-mono"
                        />
                    </div>
                    <p className="text-[9px] text-brand-accent/40 dark:text-white/20 ml-1">Required to securely add a payout account.</p>
                </div>
            </div>

            <div className="flex gap-4 pt-4">
                {(onCancel || enabledProviders.length > 1) && (
                    <Button
                        type="button"
                        variant="ghost"
                        onClick={() => enabledProviders.length > 1 ? setView("provider-selection") : onCancel?.()}
                        disabled={addPayoutAccount.isPending}
                        className="flex-1 h-12 rounded-xl text-brand-deep/60 dark:text-brand-cream/60"
                    >
                        Back
                    </Button>
                )}
                <Button
                    type="submit"
                    disabled={!isValid}
                    className="flex-3 h-12 bg-brand-deep text-brand-gold dark:bg-brand-gold-400 dark:text-brand-deep shadow-2xl! font-bold rounded-xl hover:scale-[1.02] active:scale-95 transition-all text-xs uppercase tracking-widest"
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
