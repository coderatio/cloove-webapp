"use client"

import { useState } from "react"
import { Drawer, DrawerContent, DrawerDescription, DrawerFooter, DrawerHeader, DrawerTitle } from "@/app/components/ui/drawer"
import { Button } from "@/app/components/ui/button"
import { Input } from "@/app/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/components/ui/select"
import { Wallet, Building2, ChevronDown, Check } from "lucide-react"
import { cn } from "@/app/lib/utils"

interface WithdrawalDrawerProps {
    isOpen: boolean
    onOpenChange: (open: boolean) => void
    onContinue: (amount: number, bankId: string) => void
    availableBalance: number
    banks: Array<{ id: string, bankName: string, accountNumber: string }>
}

export function WithdrawalDrawer({
    isOpen,
    onOpenChange,
    onContinue,
    availableBalance,
    banks
}: WithdrawalDrawerProps) {
    const [amount, setAmount] = useState("")
    const [selectedBank, setSelectedBank] = useState("")

    const handleContinue = () => {
        const rawAmount = Number(amount.replace(/,/g, ""))
        onContinue(rawAmount, selectedBank)
        onOpenChange(false)
    }

    const numericAmount = Number(amount.replace(/,/g, ""))
    const isValid = numericAmount >= 5000 && numericAmount <= availableBalance && selectedBank !== ""

    return (
        <Drawer open={isOpen} onOpenChange={onOpenChange}>
            <DrawerContent>
                <div className="mx-auto w-full max-w-sm">
                    <DrawerHeader>
                        <div className="mx-auto bg-brand-deep/5 dark:bg-white/5 p-3 rounded-full w-fit mb-4">
                            <Wallet className="w-6 h-6 text-brand-deep dark:text-brand-cream" />
                        </div>
                        <DrawerTitle className="text-center text-xl font-serif text-brand-deep dark:text-brand-cream">
                            Withdraw Funds
                        </DrawerTitle>
                        <DrawerDescription className="text-center text-brand-deep/60 dark:text-brand-cream/60">
                            Select a destination and enter amount.
                        </DrawerDescription>
                    </DrawerHeader>

                    <div className="p-4 space-y-6">
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-brand-deep/60 dark:text-brand-cream/60">Amount (Min ₦5,000)</label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-deep/40 dark:text-brand-cream/40 font-serif">₦</span>
                                    <Input
                                        type="text"
                                        inputMode="numeric"
                                        placeholder="0.00"
                                        value={amount}
                                        onChange={(e) => {
                                            const value = e.target.value.replace(/[^0-9]/g, "")
                                            if (value) {
                                                setAmount(Number(value).toLocaleString())
                                            } else {
                                                setAmount("")
                                            }
                                        }}
                                        className="pl-8 bg-brand-deep/5 dark:bg-white/5 border-transparent h-12 rounded-2xl"
                                    />
                                </div>
                                <div className="flex justify-between text-xs text-brand-deep/40 dark:text-brand-cream/40">
                                    <span>Available: ₦{availableBalance.toLocaleString()}</span>
                                    {(() => {
                                        const numAmount = Number(amount.replace(/,/g, ""))
                                        if (numAmount > availableBalance) return <span className="text-red-500">Insufficient balance</span>
                                        if (amount && numAmount < 5000) return <span className="text-orange-500">Minimum withdrawal is ₦5,000</span>
                                        return null
                                    })()}
                                </div>
                            </div>

                            <div className="space-y-3">
                                <label className="text-sm font-medium text-brand-deep/60 dark:text-brand-cream/60">Destination</label>

                                <div className="space-y-2">
                                    {/* Cloove Wallet Option */}
                                    <button
                                        onClick={() => setSelectedBank("CLOOVE_WALLET")}
                                        className={cn(
                                            "w-full p-4 rounded-3xl cursor-pointer border flex items-center gap-4 transition-all group relative overflow-hidden",
                                            selectedBank === "CLOOVE_WALLET"
                                                ? "bg-brand-deep/5 dark:bg-white/5 border-brand-deep/20 dark:border-brand-cream/20 ring-1 ring-brand-deep/20 dark:ring-brand-cream/20"
                                                : "bg-white dark:bg-white/5 border-border hover:border-brand-deep/20 dark:hover:border-brand-cream/20"
                                        )}
                                    >
                                        <div className={cn(
                                            "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors",
                                            selectedBank === "CLOOVE_WALLET"
                                                ? "bg-brand-deep text-brand-gold dark:bg-brand-gold dark:text-brand-deep"
                                                : "bg-brand-deep/5 dark:bg-white/10 text-brand-deep dark:text-brand-cream"
                                        )}>
                                            <Wallet className="w-5 h-5" />
                                        </div>

                                        <div className="text-left flex-1 min-w-0">
                                            <div className="font-medium text-brand-deep dark:text-brand-cream">
                                                Cloove Business Wallet
                                            </div>
                                            <div className="text-xs text-brand-deep/60 dark:text-brand-cream/60">
                                                Instant transfer, zero fees
                                            </div>
                                        </div>

                                        {selectedBank === "CLOOVE_WALLET" && (
                                            <div className="w-5 h-5 rounded-full bg-brand-deep dark:bg-brand-gold flex items-center justify-center text-brand-gold dark:text-brand-deep animate-in zoom-in spin-in-12">
                                                <Check className="w-3 h-3" strokeWidth={3} />
                                            </div>
                                        )}
                                    </button>

                                    {/* Divider for Banks */}
                                    {banks.length > 0 && (
                                        <div className="relative py-2">
                                            <div className="absolute inset-0 flex items-center">
                                                <span className="w-full border-t border-brand-deep/5 dark:border-white/5" />
                                            </div>
                                            <div className="relative flex justify-center text-xs uppercase">
                                                <span className="bg-brand-cream dark:bg-[#021a12] px-2 text-muted-foreground">Or to Bank Account</span>
                                            </div>
                                        </div>
                                    )}

                                    {/* Bank Options */}
                                    {banks.map((bank) => (
                                        <button
                                            key={bank.id}
                                            onClick={() => setSelectedBank(bank.id)}
                                            className={cn(
                                                "w-full p-3 rounded-3xl cursor-pointer border flex items-center gap-3 transition-all text-left",
                                                selectedBank === bank.id
                                                    ? "bg-brand-deep/5 dark:bg-white/5 border-brand-deep/20 dark:border-brand-cream/20"
                                                    : "bg-transparent border-transparent hover:bg-brand-deep/5 dark:hover:bg-white/5"
                                            )}
                                        >
                                            <div className="w-10 h-10 rounded-xl bg-brand-deep/5 dark:bg-white/5 flex items-center justify-center shrink-0 text-brand-deep/60 dark:text-brand-cream/60">
                                                <Building2 className="w-5 h-5" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="font-medium text-brand-deep dark:text-brand-cream truncate">
                                                    {bank.bankName}
                                                </div>
                                                <div className="text-xs text-brand-deep/60 dark:text-brand-cream/60 truncate">
                                                    {bank.accountNumber}
                                                </div>
                                            </div>
                                            {selectedBank === bank.id && (
                                                <div className="w-4 h-4 rounded-full bg-brand-deep dark:bg-brand-gold flex items-center justify-center text-brand-gold dark:text-brand-deep">
                                                    <Check className="w-2.5 h-2.5" strokeWidth={3} />
                                                </div>
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <Button
                            onClick={handleContinue}
                            disabled={!isValid}
                            className="w-full h-12 bg-brand-deep hover:bg-brand-deep/90 text-brand-cream dark:bg-brand-gold dark:text-brand-deep dark:hover:bg-brand-gold/90 text-base font-medium rounded-xl"
                        >
                            Continue
                        </Button>
                    </div>
                </div>
            </DrawerContent>
        </Drawer>
    )
}
