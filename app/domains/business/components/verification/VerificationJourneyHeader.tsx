"use client"

import { Sparkles } from "lucide-react"

export function VerificationJourneyHeader() {
    return (
        <div className="flex items-center gap-4 p-4 rounded-3xl bg-brand-gold/5 border border-brand-gold/10">
            <div className="shrink-0 w-10 h-10 rounded-2xl bg-brand-gold/10 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-brand-gold" />
            </div>
            <div className="space-y-0.5">
                <h4 className="text-sm font-bold text-brand-deep dark:text-brand-cream tracking-tight">Verification Journey</h4>
                <p className="text-xs text-brand-deep/60 dark:text-brand-cream/60">Complete all levels to unlock the full power of Cloove.</p>
            </div>
        </div>
    )
}
