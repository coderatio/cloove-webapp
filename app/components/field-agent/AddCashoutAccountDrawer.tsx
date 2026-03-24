"use client"

import { useState, useEffect } from "react"
import { Building2, Loader2, CheckCircle2, AlertCircle, ChevronsUpDown, ArrowLeft } from "lucide-react"
import { Button } from "@/app/components/ui/button"
import { Input } from "@/app/components/ui/input"
import {
    Drawer,
    DrawerContent,
    DrawerStickyHeader,
    DrawerTitle,
    DrawerDescription,
    DrawerBody,
} from "@/app/components/ui/drawer"
import { BankSelector } from "@/app/components/shared/BankSelector"
import { usePaymentProviders } from "@/app/domains/finance/hooks/useFinance"
import { useFieldAgentBanks } from "@/app/domains/field-agent/hooks/useFieldAgentBanks"
import { resolveFieldAgentBankAccount } from "@/app/domains/field-agent/hooks/useFieldAgentCashoutAccounts"
import { cn } from "@/app/lib/utils"

export interface CashoutAccountDetails {
    bankName: string
    bankCode: string
    accountNumber: string
    accountName: string
    provider: string
}

interface AddCashoutAccountDrawerProps {
    isOpen: boolean
    onOpenChange: (open: boolean) => void
    onContinue: (details: CashoutAccountDetails) => void
}

type DrawerView = "provider-selection" | "bank-selection" | "form"

export function AddCashoutAccountDrawer({
    isOpen,
    onOpenChange,
    onContinue,
}: AddCashoutAccountDrawerProps) {
    const { data: providersResponse, isLoading: providersLoading } = usePaymentProviders()
    const enabledProviders = providersResponse?.data?.filter((p) => p.is_enabled) ?? []

    const [view, setView] = useState<DrawerView>("provider-selection")
    const [details, setDetails] = useState<CashoutAccountDetails>({
        bankName: "",
        bankCode: "",
        accountNumber: "",
        accountName: "",
        provider: "",
    })
    const [isResolving, setIsResolving] = useState(false)
    const [resolveError, setResolveError] = useState("")

    const { banks, isLoading: isLoadingBanks } = useFieldAgentBanks(details.provider || undefined)

    // Reset on close
    useEffect(() => {
        if (!isOpen) {
            setView("provider-selection")
            setDetails({ bankName: "", bankCode: "", accountNumber: "", accountName: "", provider: "" })
            setResolveError("")
            setIsResolving(false)
        }
    }, [isOpen])

    // Skip provider selection when only one provider is available
    useEffect(() => {
        if (!providersLoading && enabledProviders.length === 1 && !details.provider) {
            setDetails((prev) => ({ ...prev, provider: enabledProviders[0].id }))
            setView("form")
        }
    }, [providersLoading, enabledProviders.length])

    // Auto-resolve account name when account number + bank code are ready
    useEffect(() => {
        if (!details.bankCode || details.accountNumber.length !== 10) return
        let cancelled = false

        const run = async () => {
            setIsResolving(true)
            setResolveError("")
            setDetails((prev) => ({ ...prev, accountName: "" }))
            try {
                const result = await resolveFieldAgentBankAccount(details.accountNumber, details.bankCode)
                if (!cancelled) setDetails((prev) => ({ ...prev, accountName: result.accountName }))
            } catch (err) {
                if (!cancelled) setResolveError((err as Error).message ?? "Failed to resolve account")
            } finally {
                if (!cancelled) setIsResolving(false)
            }
        }
        run()
        return () => { cancelled = true }
    }, [details.bankCode, details.accountNumber])

    const handleContinue = () => {
        onContinue(details)
        onOpenChange(false)
    }

    const isValid =
        details.bankName !== "" &&
        details.accountNumber.length === 10 &&
        details.accountName !== "" &&
        details.provider !== "" &&
        !isResolving

    const selectedProvider = enabledProviders.find((p) => p.id === details.provider)

    const renderHeader = () => {
        if (view === "provider-selection") {
            return (
                <>
                    <DrawerTitle className="text-4xl">Add Payout Account</DrawerTitle>
                    <DrawerDescription className="text-base mt-2">Select a payment partner to continue.</DrawerDescription>
                </>
            )
        }
        if (view === "bank-selection") {
            return (
                <div className="flex items-center gap-4">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setView(enabledProviders.length > 1 ? "provider-selection" : "form")}
                        className="-ml-2 w-10 h-10 rounded-full bg-brand-deep/5 dark:bg-white/5"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </Button>
                    <DrawerTitle className="text-2xl">Select Bank</DrawerTitle>
                </div>
            )
        }
        return (
            <div className="flex items-center gap-4">
                {enabledProviders.length > 1 && (
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setView("provider-selection")}
                        className="-ml-2 w-10 h-10 rounded-full bg-brand-deep/5 dark:bg-white/5"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </Button>
                )}
                <div>
                    <DrawerTitle className="text-2xl">Account Details</DrawerTitle>
                    {selectedProvider && (
                        <DrawerDescription className="mt-0.5">
                            via {selectedProvider.name}
                        </DrawerDescription>
                    )}
                </div>
            </div>
        )
    }

    return (
        <Drawer open={isOpen} onOpenChange={onOpenChange}>
            <DrawerContent>
                <DrawerStickyHeader>
                    {renderHeader()}
                </DrawerStickyHeader>

                <DrawerBody className="px-8 py-6">
                    {/* Provider Selection */}
                    {view === "provider-selection" && (
                        <div className="space-y-4">
                            {providersLoading ? (
                                <div className="flex flex-col items-center justify-center py-16 gap-4">
                                    <Loader2 className="w-8 h-8 animate-spin text-brand-gold/50" />
                                    <p className="text-[10px] font-black uppercase tracking-widest text-brand-deep/30">Sourcing providers...</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 gap-3">
                                    {enabledProviders.map((provider) => (
                                        <button
                                            key={provider.id}
                                            type="button"
                                            onClick={() => {
                                                setDetails((prev) => ({ ...prev, provider: provider.id }))
                                                setView("form")
                                            }}
                                            className="group flex items-center gap-4 p-5 rounded-3xl border border-brand-deep/5 bg-brand-deep/3 dark:bg-white/3 hover:border-brand-gold/40 hover:bg-brand-gold/5 transition-all text-left"
                                        >
                                            <div className="w-14 h-14 rounded-2xl bg-white dark:bg-white/10 flex items-center justify-center shadow-sm shrink-0">
                                                {provider.logo_url ? (
                                                    <img src={provider.logo_url} alt={provider.name} className="w-9 h-9 object-contain" />
                                                ) : (
                                                    <Building2 className="w-7 h-7 text-brand-deep/20" />
                                                )}
                                            </div>
                                            <div>
                                                <p className="font-bold text-brand-deep dark:text-brand-cream">{provider.name}</p>
                                                <p className="text-[10px] text-brand-deep/30 dark:text-brand-cream/30 uppercase tracking-widest font-bold mt-0.5">
                                                    Connect your bank via {provider.name}
                                                </p>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Bank Selection */}
                    {view === "bank-selection" && (
                        <div className="h-[420px] flex flex-col">
                            <BankSelector
                                selectedBankName={details.bankName}
                                banks={banks}
                                isLoading={isLoadingBanks}
                                onSelect={(bank) => {
                                    setDetails((prev) => ({ ...prev, bankName: bank.name, bankCode: bank.code }))
                                    setView("form")
                                }}
                            />
                        </div>
                    )}

                    {/* Account Details Form */}
                    {view === "form" && (
                        <div className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase tracking-widest text-brand-deep/40 ml-1">Bank</label>
                                <Button
                                    variant="outline"
                                    onClick={() => setView("bank-selection")}
                                    className="w-full justify-between bg-brand-deep/5 dark:bg-white/5 border-transparent h-14 rounded-2xl text-brand-deep dark:text-brand-cream hover:bg-brand-deep/10 dark:hover:bg-white/10 text-base"
                                >
                                    <span className={details.bankName ? "font-semibold" : "text-brand-deep/40 dark:text-brand-cream/40"}>
                                        {details.bankName || "Select your bank..."}
                                    </span>
                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase tracking-widest text-brand-deep/40 ml-1">Account Number</label>
                                <Input
                                    type="tel"
                                    inputMode="numeric"
                                    placeholder="0123456789"
                                    maxLength={10}
                                    value={details.accountNumber}
                                    onChange={(e) =>
                                        setDetails((prev) => ({ ...prev, accountNumber: e.target.value.replace(/\D/g, "") }))
                                    }
                                    className="bg-brand-deep/5 dark:bg-white/5 border-transparent h-14 rounded-2xl font-mono text-lg tracking-widest"
                                />
                            </div>

                            <div className="space-y-2">
                                <div className="flex items-center justify-between ml-1">
                                    <label className="text-xs font-bold uppercase tracking-widest text-brand-deep/40">Account Name</label>
                                    {isResolving && (
                                        <span className="text-[10px] font-bold text-brand-gold flex items-center gap-1 uppercase tracking-wider">
                                            <Loader2 className="w-3 h-3 animate-spin" /> Resolving...
                                        </span>
                                    )}
                                    {details.accountName && !isResolving && (
                                        <span className="text-[10px] font-bold text-green-500 flex items-center gap-1 uppercase tracking-wider">
                                            <CheckCircle2 className="w-3 h-3" /> Verified
                                        </span>
                                    )}
                                    {resolveError && (
                                        <span className="text-[10px] font-bold text-red-500 flex items-center gap-1 uppercase tracking-wider">
                                            <AlertCircle className="w-3 h-3" /> {resolveError}
                                        </span>
                                    )}
                                </div>
                                <Input
                                    placeholder="Auto-filled on resolution"
                                    value={details.accountName}
                                    readOnly
                                    className={cn(
                                        "border-transparent h-14 rounded-2xl transition-all",
                                        details.accountName
                                            ? "bg-green-500/5 dark:bg-green-500/10 text-brand-deep dark:text-brand-cream font-semibold"
                                            : "bg-brand-deep/5 dark:bg-white/5 text-brand-deep/40 dark:text-brand-cream/40 italic"
                                    )}
                                />
                            </div>

                            <Button
                                onClick={handleContinue}
                                disabled={!isValid}
                                className="w-full h-14 bg-brand-gold text-brand-deep hover:bg-brand-gold/90 rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-brand-gold/20 transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50"
                            >
                                Save Account
                            </Button>
                        </div>
                    )}
                </DrawerBody>
            </DrawerContent>
        </Drawer>
    )
}
