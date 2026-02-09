"use client"

import { useState } from "react"
import { Search, Check } from "lucide-react"
import { Input } from "@/app/components/ui/input"
import { cn } from "@/app/lib/utils"

export interface Bank {
    code: string
    name: string
}

export const NIGERIAN_BANKS: Bank[] = [
    { code: "058", name: "Guaranty Trust Bank" },
    { code: "044", name: "Access Bank" },
    { code: "050", name: "Ecobank Nigeria" },
    { code: "070", name: "Fidelity Bank" },
    { code: "011", name: "First Bank of Nigeria" },
    { code: "214", name: "First City Monument Bank" },
    { code: "030", name: "Heritage Bank" },
    { code: "301", name: "Jaiz Bank" },
    { code: "082", name: "Keystone Bank" },
    { code: "014", name: "Mainstreet Bank" },
    { code: "076", name: "Skye Bank" },
    { code: "039", name: "Stanbic IBTC Bank" },
    { code: "232", name: "Sterling Bank" },
    { code: "032", name: "Union Bank of Nigeria" },
    { code: "033", name: "United Bank for Africa" },
    { code: "215", name: "Unity Bank" },
    { code: "035", name: "Wema Bank" },
    { code: "057", name: "Zenith Bank" },
    { code: "101", name: "Providus Bank" },
    { code: "100", name: "SunTrust Bank" },
    { code: "302", name: "TAJ Bank" },
    { code: "090115", name: "TCF MFB" },
]

interface BankSelectorProps {
    onSelect: (bank: Bank) => void
    selectedBankName?: string
    className?: string
}

export function BankSelector({ onSelect, selectedBankName, className }: BankSelectorProps) {
    const [searchQuery, setSearchQuery] = useState("")

    const filteredBanks = NIGERIAN_BANKS.filter(bank =>
        bank.name.toLowerCase().includes(searchQuery.toLowerCase())
    )

    return (
        <div className={cn("flex flex-col h-full space-y-4 pt-2", className)}>
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-brand-deep/40 dark:text-brand-cream/40" />
                <Input
                    placeholder="Search bank..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 bg-brand-deep/5 dark:bg-white/5 border-transparent h-11 rounded-xl"
                    autoFocus
                />
            </div>
            <div className="flex-1 overflow-y-auto -mx-2 px-2 pb-4">
                {filteredBanks.length === 0 ? (
                    <div className="py-8 text-center text-sm text-brand-deep/40 dark:text-brand-cream/40">
                        No banks found
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-2">
                        {filteredBanks.map((bank) => {
                            // Extract first 2 letters of words for initials (e.g., "Guaranty Trust" -> "GT")
                            const initials = bank.name.split(" ").map(n => n[0]).join("").slice(0, 2)
                            const isSelected = selectedBankName === bank.name

                            return (
                                <button
                                    key={bank.code}
                                    onClick={() => onSelect(bank)}
                                    className={cn(
                                        "group relative w-full flex items-center cursor-pointer gap-4 p-3 rounded-2xl text-left transition-all duration-300",
                                        isSelected
                                            ? "bg-brand-deep/5 dark:bg-white/5 ring-1 ring-brand-gold/30"
                                            : "hover:bg-brand-deep/5 dark:hover:bg-white/5"
                                    )}
                                >
                                    {/* Icon/Initials */}
                                    <div className={cn(
                                        "h-10 w-10 shrink-0 rounded-xl flex items-center justify-center text-xs font-bold transition-colors shadow-sm",
                                        isSelected
                                            ? "bg-brand-deep text-brand-gold dark:bg-brand-gold dark:text-brand-deep"
                                            : "bg-white dark:bg-white/10 text-brand-deep/60 dark:text-brand-cream/60 group-hover:text-brand-deep dark:group-hover:text-brand-cream"
                                    )} style={{ fontFamily: 'var(--font-serif)' }}>
                                        {initials}
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <div className={cn(
                                            "font-medium truncate transition-colors",
                                            isSelected ? "text-brand-deep dark:text-brand-cream" : "text-brand-deep/80 dark:text-brand-cream/80"
                                        )}>
                                            {bank.name}
                                        </div>
                                        {isSelected && (
                                            <div className="text-[10px] text-brand-gold font-medium animate-in fade-in slide-in-from-left-1">
                                                Selected
                                            </div>
                                        )}
                                    </div>

                                    {isSelected && (
                                        <div className="h-6 w-6 rounded-full bg-brand-gold flex items-center justify-center text-brand-deep shadow-sm animate-in zoom-in spin-in-12 duration-300">
                                            <Check className="h-3 w-3" strokeWidth={3} />
                                        </div>
                                    )}
                                </button>
                            )
                        })}
                    </div>
                )}
            </div>
        </div>
    )
}
