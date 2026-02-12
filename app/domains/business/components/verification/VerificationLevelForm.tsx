"use client"

import { MapPin, Loader2 } from "lucide-react"
import { Input } from "@/app/components/ui/input"
import { Button } from "@/app/components/ui/button"

interface VerificationLevelFormProps {
    level: number
    bvn: string
    onBvnChange: (value: string) => void
    address: string
    onAddressChange: (value: string) => void
    onSubmit: () => void
    onCancel: () => void
    isPending: boolean
}

export function VerificationLevelForm({
    level,
    bvn,
    onBvnChange,
    address,
    onAddressChange,
    onSubmit,
    onCancel,
    isPending
}: VerificationLevelFormProps) {
    return (
        <div className="w-full space-y-4">
            {level === 1 && (
                <div className="space-y-2">
                    <Input
                        inputMode="numeric"
                        value={bvn}
                        onChange={(e) => onBvnChange(e.target.value)}
                        placeholder="Enter 11-digit BVN"
                        autoFocus
                        maxLength={11}
                        className="h-12 md:h-14 bg-white/50 dark:bg-white/5 border-brand-gold/20 rounded-xl md:rounded-2xl font-mono text-center tracking-[0.25em] text-base md:text-lg focus:ring-brand-gold/10"
                    />
                </div>
            )}

            {level === 3 && (
                <div className="relative group">
                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-gold" />
                    <Input
                        value={address}
                        onChange={(e) => onAddressChange(e.target.value)}
                        placeholder="Physical Business Address"
                        className="h-12 md:h-14 pl-12 bg-white/50 dark:bg-white/5 border-brand-gold/20 rounded-xl md:rounded-2xl focus:ring-brand-gold/10"
                    />
                </div>
            )}

            <div className="flex items-center gap-2 md:gap-3">
                <Button
                    onClick={onSubmit}
                    disabled={isPending}
                    className="flex-1 h-12 md:h-14 rounded-xl md:rounded-2xl bg-brand-gold px-8 hover:bg-brand-gold/80 text-brand-deep font-bold uppercase tracking-widest hover:brightness-105 active:scale-[0.98] transition-all shadow-lg shadow-brand-gold/10"
                >
                    {isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : "Verify Identity"}
                </Button>
                <Button
                    variant="ghost"
                    onClick={onCancel}
                    className="h-12 md:h-14 px-4 md:px-6 rounded-xl md:rounded-2xl hover:bg-black/5 dark:hover:bg-white/5"
                >
                    Cancel
                </Button>
            </div>
        </div>
    )
}
