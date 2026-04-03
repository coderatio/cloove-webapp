"use client"

import * as React from "react"
import { Building2, Search, Check, Loader2, ArrowLeft, Save } from "lucide-react"
import { Button } from "@/app/components/ui/button"
import { Input } from "@/app/components/ui/input"
import { Label } from "@/app/components/ui/label"
import { BankSelector, Bank } from "@/app/components/shared/BankSelector"
import { Switch } from "@/app/components/ui/switch"
import {
    DrawerBody,
    DrawerFooter,
} from "@/app/components/ui/drawer"
import { useResolveAccount, useBanks, useWalletBalance } from "@/app/domains/finance/hooks/useFinance"
import { cn } from "@/app/lib/utils"
import { motion, AnimatePresence } from "framer-motion"

interface BankDetails {
    bankCode: string
    bankName: string
    accountNumber: string
    accountName: string
    provider: string
}

interface WithdrawToOtherAccountFormProps {
    onBack: () => void
    onConfirm: (details: BankDetails, saveToPayout: boolean) => void
}

export function WithdrawToOtherAccountForm({ onBack, onConfirm }: WithdrawToOtherAccountFormProps) {
    const [step, setStep] = React.useState<"bank" | "details">("bank")
    const [selectedBank, setSelectedBank] = React.useState<Bank | null>(null)
    const [accountNumber, setAccountNumber] = React.useState("")
    const [accountName, setAccountName] = React.useState("")
    const [saveToPayout, setSaveToPayout] = React.useState(false)

    // Get banks for default provider (internal useBanks will handle default if not passed)
    const { wallet } = useWalletBalance()
    const defaultProvider = wallet?.defaultWithdrawalProvider || "monnify"

    const { banks, isLoading: banksLoading } = useBanks()
    const resolveAccountMutation = useResolveAccount()

    const handleBankSelect = (bank: Bank) => {
        setSelectedBank(bank)
        setStep("details")
    }

    const handleAccountNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value.replace(/\D/g, "").slice(0, 10)
        setAccountNumber(val)
        setAccountName("") // Reset name when number changes
    }

    React.useEffect(() => {
        if (accountNumber.length === 10 && selectedBank) {
            const timer = setTimeout(() => {
                resolveAccountMutation.mutate({
                    accountNumber,
                    bankCode: selectedBank.code,
                    provider: defaultProvider // Use dynamic provider for resolution
                }, {
                    onSuccess: (res) => {
                        if (res.data?.accountName) {
                            setAccountName(res.data.accountName)
                        }
                    }
                })
            }, 500)
            return () => clearTimeout(timer)
        }
    }, [accountNumber, selectedBank])

    const canContinue = selectedBank && accountNumber.length === 10 && accountName && !resolveAccountMutation.isPending

    const handleSubmit = () => {
        if (!canContinue || !selectedBank) return
        onConfirm({
            bankCode: selectedBank.code,
            bankName: selectedBank.name,
            accountNumber,
            accountName,
            provider: defaultProvider // Dynamic provider
        }, saveToPayout)
    }

    return (
        <>
            <DrawerBody className="p-4 flex-1 overflow-y-auto no-scrollbar">
                <div className="flex flex-col space-y-6">
                    <div className="flex items-center gap-4">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => step === "details" ? setStep("bank") : onBack()}
                            className="h-10 w-10 rounded-full bg-brand-deep/5 dark:bg-white/5 cursor-pointer"
                        >
                            <ArrowLeft className="w-5 h-5 text-brand-deep/40 dark:text-brand-cream/40" />
                        </Button>
                        <div>
                            <h4 className="text-lg font-serif font-bold text-brand-deep dark:text-brand-cream">
                                {step === "bank" ? "Select Bank" : "Account Details"}
                            </h4>
                            <p className="text-[10px] text-brand-deep/40 dark:text-brand-cream/40 uppercase tracking-widest font-black">
                                {step === "bank" ? "Where are you sending to?" : "Enter the destination account"}
                            </p>
                        </div>
                    </div>

                    <div className="flex-1">
                        <AnimatePresence mode="wait">
                            {step === "bank" ? (
                                <motion.div
                                    key="bank-list"
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 20 }}
                                    className="h-full"
                                >
                                    <BankSelector
                                        onSelect={handleBankSelect}
                                        selectedBankName={selectedBank?.name}
                                        banks={banks}
                                        isLoading={banksLoading}
                                    />
                                </motion.div>
                            ) : (
                                <motion.div
                                    key="account-details"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className="space-y-6"
                                >
                                    <div className="p-4 rounded-3xl bg-brand-deep/3 dark:bg-white/3 border border-brand-deep/5 dark:border-white/5 flex items-center gap-4">
                                        <div className="h-12 w-12 rounded-2xl bg-brand-gold/10 flex items-center justify-center text-brand-gold font-bold text-sm">
                                            {selectedBank?.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="text-[10px] font-black uppercase tracking-widest text-brand-deep/40 dark:text-brand-cream/80">Selected Bank</div>
                                            <div className="font-bold text-brand-deep dark:text-brand-cream text-base">{selectedBank?.name}</div>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => setStep("bank")}
                                            className="text-[10px] font-black text-brand-gold uppercase tracking-widest"
                                        >
                                            Change
                                        </Button>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <Label className="text-[10px] font-black uppercase tracking-widest text-brand-deep/40 dark:text-brand-cream/80 ml-1">Account Number</Label>
                                            <div className="relative">
                                                <Input
                                                    type="text"
                                                    inputMode="numeric"
                                                    placeholder="0123456789"
                                                    value={accountNumber}
                                                    onChange={handleAccountNumberChange}
                                                    className="h-14 rounded-2xl bg-brand-deep/5 dark:bg-white/5 border-transparent focus:bg-white dark:focus:bg-brand-deep transition-all text-lg font-mono tracking-wider dark:text-white!"
                                                    autoFocus
                                                />
                                                {resolveAccountMutation.isPending && (
                                                    <div className="absolute right-4 top-1/2 -translate-y-1/2">
                                                        <Loader2 className="w-5 h-5 animate-spin text-brand-gold" />
                                                    </div>
                                                )}
                                                {!resolveAccountMutation.isPending && accountName && (
                                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center animate-in zoom-in">
                                                        <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <AnimatePresence>
                                            {accountName && (
                                                <motion.div
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    className="p-4 rounded-3xl bg-emerald-500/5 border border-emerald-500/10"
                                                >
                                                    <div className="text-[10px] font-black uppercase tracking-widest text-emerald-500/60 ml-1">Account Name</div>
                                                    <div className="font-black text-brand-deep dark:text-brand-cream uppercase tracking-tight">{accountName}</div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>

                                        <div className="p-4 rounded-3xl bg-brand-deep/3 dark:bg-white/3 border border-brand-deep/5 dark:border-white/5 flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="h-10 w-10 rounded-xl bg-brand-gold/10 flex items-center justify-center text-brand-gold">
                                                    <Save className="w-5 h-5" />
                                                </div>
                                                <div>
                                                    <div className="text-xs font-bold text-brand-deep dark:text-brand-cream">Save to my accounts</div>
                                                    <div className="text-[10px] text-brand-deep/40 dark:text-brand-cream/40 uppercase tracking-widest">Mark as favorite for later</div>
                                                </div>
                                            </div>
                                            <Switch
                                                checked={saveToPayout}
                                                onCheckedChange={setSaveToPayout}
                                            />
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </DrawerBody>

            {step === "details" && (
                <DrawerFooter className="p-4 md:p-6 dark:bg-transparent">
                    <Button
                        onClick={handleSubmit}
                        disabled={!canContinue}
                        className="w-full h-18 bg-brand-deep text-brand-gold dark:bg-brand-gold-400 dark:text-brand-deep font-black uppercase tracking-[0.3em] text-xs rounded-4xl shadow-[0_20px_40px_rgba(0,0,0,0.2)] hover:scale-[1.02] active:scale-95 transition-all duration-300 disabled:opacity-50"
                    >
                        Continue with this account
                    </Button>
                </DrawerFooter>
            )}
        </>
    )
}
