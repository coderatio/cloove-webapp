"use client"

import { useState } from "react"
import { Drawer, DrawerContent, DrawerDescription, DrawerFooter, DrawerHeader, DrawerTitle } from "@/app/components/ui/drawer"
import { Button } from "@/app/components/ui/button"
import { Input } from "@/app/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/components/ui/select"
import { Wallet, Building2, ChevronDown } from "lucide-react"

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
        onContinue(Number(amount), selectedBank)
        onOpenChange(false)
    }

    const isValid = Number(amount) >= 5000 && Number(amount) <= availableBalance && selectedBank !== ""

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
                                        type="number"
                                        placeholder="0.00"
                                        value={amount}
                                        onChange={(e) => setAmount(e.target.value)}
                                        className="pl-8 bg-brand-deep/5 dark:bg-white/5 border-transparent h-12 rounded-2xl"
                                    />
                                </div>
                                <div className="flex justify-between text-xs text-brand-deep/40 dark:text-brand-cream/40">
                                    <span>Available: ₦{availableBalance.toLocaleString()}</span>
                                    {Number(amount) > availableBalance && <span className="text-red-500">Insufficient balance</span>}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-brand-deep/60 dark:text-brand-cream/60">Destination Bank</label>
                                {banks.length > 0 ? (
                                    <div className="space-y-2">
                                        {banks.map((bank) => (
                                            <button
                                                key={bank.id}
                                                onClick={() => setSelectedBank(bank.id)}
                                                className={`w-full p-3 rounded-3xl border cursor-pointer flex items-center gap-3 transition-all ${selectedBank === bank.id
                                                    ? "bg-brand-gold/10 border-brand-gold text-brand-deep dark:text-brand-cream"
                                                    : "bg-brand-deep/5 dark:bg-white/5 border-transparent text-brand-deep/60 dark:text-brand-cream/60 hover:bg-brand-deep/10 dark:hover:bg-white/10"
                                                    }`}
                                            >
                                                <div className="w-8 h-8 rounded-full bg-brand-deep/10 dark:bg-white/10 flex items-center justify-center shrink-0">
                                                    <Building2 className="w-4 h-4" />
                                                </div>
                                                <div className="text-left flex-1 min-w-0">
                                                    <div className="font-medium truncate">{bank.bankName}</div>
                                                    <div className="text-xs opacity-70 truncate">{bank.accountNumber}</div>
                                                </div>
                                                {selectedBank === bank.id && (
                                                    <div className="w-4 h-4 rounded-full bg-brand-gold" />
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="p-4 rounded-xl bg-orange-500/10 text-orange-600 dark:text-orange-400 text-sm text-center">
                                        Please add a bank account first.
                                    </div>
                                )}
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
