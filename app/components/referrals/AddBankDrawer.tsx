"use client"

import { useState, useEffect } from "react"
import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle } from "@/app/components/ui/drawer"
import { Button } from "@/app/components/ui/button"
import { Input } from "@/app/components/ui/input"
import { Building2, Loader2, CheckCircle2, AlertCircle, ChevronsUpDown, ArrowLeft } from "lucide-react"
import { BankSelector, NIGERIAN_BANKS } from "@/app/components/shared/BankSelector"

interface AddBankDrawerProps {
    isOpen: boolean
    onOpenChange: (open: boolean) => void
    onContinue: (details: { bankName: string, accountNumber: string, accountName: string }) => void
}

type DrawerView = "form" | "selection"

export function AddBankDrawer({
    isOpen,
    onOpenChange,
    onContinue,
}: AddBankDrawerProps) {
    const [view, setView] = useState<DrawerView>("form")
    const [details, setDetails] = useState({ bankName: "", accountNumber: "", accountName: "" })
    const [isResolving, setIsResolving] = useState(false)
    const [resolveError, setResolveError] = useState("")

    // Reset state when drawer opens/closes
    useEffect(() => {
        if (!isOpen) {
            setDetails({ bankName: "", accountNumber: "", accountName: "" })
            setResolveError("")
            setIsResolving(false)
            setView("form")
        }
    }, [isOpen])

    // Mock Account Name Resolution
    useEffect(() => {
        if (details.bankName && details.accountNumber.length === 10) {
            resolveAccount()
        }
    }, [details.bankName, details.accountNumber])

    const resolveAccount = async () => {
        setIsResolving(true)
        setResolveError("")
        setDetails(prev => ({ ...prev, accountName: "" }))

        // Simulate API delay
        setTimeout(() => {
            setIsResolving(false)
            // hardcoded mock resolution success for demo
            if (details.accountNumber === "0000000000") {
                setResolveError("Invalid account number")
            } else {
                setDetails(prev => ({ ...prev, accountName: "JOSIAH YAHAYA" }))
            }
        }, 1500)
    }

    const handleContinue = () => {
        onContinue(details)
        onOpenChange(false)
    }

    const isValid = details.bankName !== "" && details.accountNumber.length === 10 && details.accountName !== "" && !isResolving

    return (
        <Drawer open={isOpen} onOpenChange={onOpenChange}>
            <DrawerContent>
                <div className="mx-auto w-full max-w-sm flex flex-col h-[500px]">
                    {/* Header Changes dynamic based on view */}
                    <DrawerHeader>
                        {view === "form" ? (
                            <>
                                <div className="mx-auto bg-brand-deep/5 dark:bg-white/5 p-3 rounded-full w-fit mb-4">
                                    <Building2 className="w-6 h-6 text-brand-deep dark:text-brand-cream" />
                                </div>
                                <DrawerTitle className="text-center text-xl font-serif text-brand-deep dark:text-brand-cream">
                                    Add Bank Account
                                </DrawerTitle>
                                <DrawerDescription className="text-center text-brand-deep/60 dark:text-brand-cream/60">
                                    Enter your bank details to receive payouts.
                                </DrawerDescription>
                            </>
                        ) : (
                            <div className="flex items-center gap-4">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => setView("form")}
                                    className="-ml-4 h-10 w-10 rounded-full bg-brand-deep/5 dark:bg-white/5"
                                >
                                    <ArrowLeft className="w-5 h-5 text-brand-deep dark:text-brand-cream" />
                                </Button>
                                <DrawerTitle className="text-xl font-serif text-brand-deep dark:text-brand-cream">
                                    Select Bank
                                </DrawerTitle>
                            </div>
                        )}
                    </DrawerHeader>

                    <div className="flex-1 p-4 pt-0 overflow-y-auto">
                        {view === "form" ? (
                            <div className="space-y-6">
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-brand-deep/60 dark:text-brand-cream/60">Select Bank</label>
                                        <Button
                                            variant="outline"
                                            onClick={() => setView("selection")}
                                            className="w-full justify-between bg-brand-deep/5 dark:bg-white/5 border-transparent h-12 rounded-xl text-brand-deep dark:text-brand-cream hover:bg-brand-deep/10 dark:hover:bg-white/10"
                                        >
                                            <span className={details.bankName ? "" : "text-muted-foreground"}>
                                                {details.bankName || "Select your bank..."}
                                            </span>
                                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                        </Button>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-brand-deep/60 dark:text-brand-cream/60">Account Number</label>
                                        <Input
                                            placeholder="0123456789"
                                            maxLength={10}
                                            value={details.accountNumber}
                                            onChange={(e) => setDetails({ ...details, accountNumber: e.target.value })}
                                            className="bg-brand-deep/5 dark:bg-white/5 border-transparent h-12 rounded-xl"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <label className="text-sm font-medium text-brand-deep/60 dark:text-brand-cream/60">Account Name</label>
                                            {isResolving && (
                                                <span className="text-xs text-brand-gold flex items-center gap-1">
                                                    <Loader2 className="w-3 h-3 animate-spin" /> Resolving...
                                                </span>
                                            )}
                                            {details.accountName && (
                                                <span className="text-xs text-green-500 flex items-center gap-1">
                                                    <CheckCircle2 className="w-3 h-3" /> Verified
                                                </span>
                                            )}
                                            {resolveError && (
                                                <span className="text-xs text-red-500 flex items-center gap-1">
                                                    <AlertCircle className="w-3 h-3" /> {resolveError}
                                                </span>
                                            )}
                                        </div>
                                        <Input
                                            placeholder="Account Name"
                                            value={details.accountName}
                                            readOnly
                                            className={`bg-brand-deep/5 dark:bg-white/5 border-transparent h-12 rounded-xl transition-all ${details.accountName ? "text-brand-deep dark:text-brand-cream font-medium bg-green-500/5 dark:bg-green-500/10 border-green-500/20" : "text-brand-deep/40 dark:text-brand-cream/40"
                                                }`}
                                        />
                                    </div>
                                </div>

                                <Button
                                    onClick={handleContinue}
                                    disabled={!isValid}
                                    className="w-full h-12 bg-brand-deep hover:bg-brand-deep/90 text-brand-cream dark:bg-brand-gold dark:text-brand-deep dark:hover:bg-brand-gold/90 text-base font-medium rounded-xl"
                                >
                                    Confirm & Save
                                </Button>
                            </div>
                        ) : (
                            <BankSelector
                                selectedBankName={details.bankName}
                                onSelect={(bank) => {
                                    setDetails({ ...details, bankName: bank.name })
                                    setView("form")
                                }}
                            />
                        )}
                    </div>
                </div>
            </DrawerContent>
        </Drawer>
    )
}
