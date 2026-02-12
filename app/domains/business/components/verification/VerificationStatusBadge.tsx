"use client"

import { cn } from "@/app/lib/utils"

interface VerificationStatusBadgeProps {
    status: "pending" | "verified" | "rejected" | "unverified"
    isLocked?: boolean
}

export function VerificationStatusBadge({ status, isLocked }: VerificationStatusBadgeProps) {
    const isVerified = status === "verified"
    const isPending = status === "pending"
    const isRejected = status === "rejected"

    return (
        <div className={cn(
            "self-start px-4 md:px-5 py-1.5 md:py-2 rounded-xl md:rounded-2xl text-[9px] md:text-[10px] font-bold uppercase tracking-[0.2em] border transition-all duration-500",
            isVerified
                ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600"
                : isPending
                    ? "bg-brand-gold/10 border-brand-gold/30 text-brand-gold animate-pulse"
                    : isRejected
                        ? "bg-red-500/10 border-red-500/20 text-red-500"
                        : isLocked
                            ? "bg-brand-deep/5 border-transparent text-brand-deep/30 dark:text-white/30"
                            : "bg-brand-gold/5 border-brand-gold/20 text-brand-gold"
        )}>
            {isVerified ? "Authenticated" : isPending ? "Reviewing" : isRejected ? "Rejected" : isLocked ? "Locked" : "Ready"}
        </div>
    )
}
