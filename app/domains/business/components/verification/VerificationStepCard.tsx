"use client"

import { motion, AnimatePresence } from "framer-motion"
import { ShieldCheck, Lock, ChevronRight } from "lucide-react"
import { GlassCard } from "@/app/components/ui/glass-card"
import { cn } from "@/app/lib/utils"
import { VerificationLevelConfig, VerificationType } from "@/app/domains/business/hooks/use-verification"
import { VerificationStatusBadge } from "./VerificationStatusBadge"
import { VerificationAuditTrail } from "./VerificationAuditTrail"
import { VerificationLevelForm } from "./VerificationLevelForm"

interface VerificationStepCardProps {
    step: VerificationLevelConfig
    status: "pending" | "verified" | "rejected" | "unverified"
    isActive: boolean
    isLocked: boolean
    icon: any
    onBegin: () => void
    onCancel: () => void
    onSubmit: (levelId: number, type: VerificationType) => void
    bvn: string
    onBvnChange: (val: string) => void
    address: string
    onAddressChange: (val: string) => void
    isPending: boolean
    showHistory: boolean
    onToggleHistory: () => void
    rejectionReason?: string | null
    logs?: any[]
}

export function VerificationStepCard({
    step,
    status,
    isActive,
    isLocked,
    icon: Icon,
    onBegin,
    onCancel,
    onSubmit,
    bvn,
    onBvnChange,
    address,
    onAddressChange,
    isPending,
    showHistory,
    onToggleHistory,
    rejectionReason,
    logs = []
}: VerificationStepCardProps) {
    const isVerified = status === "verified"
    const isRejected = status === "rejected"
    const canResubmit = isRejected || status === "unverified"

    return (
        <motion.div layout className="relative z-10">
            <GlassCard
                hoverEffect={!isLocked}
                className={cn(
                    "group transition-all duration-500",
                    "bg-brand-cream dark:bg-brand-deep md:bg-brand-cream/80 md:dark:bg-brand-deep/90",
                    isActive && "border-brand-gold/40 shadow-[0_32px_64px_rgba(212,175,55,0.1)] scale-[1.01]",
                    isVerified && "border-emerald-500/20 bg-emerald-500/10",
                    isLocked && "opacity-100 grayscale-[0.6]"
                )}
            >
                <div className="p-5 md:p-10">
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                        <div className="flex items-start gap-4 md:gap-6">
                            <div className={cn(
                                "w-14 h-14 md:w-16 md:h-16 rounded-2xl md:rounded-3xl flex items-center justify-center shrink-0 transition-all duration-500",
                                isVerified
                                    ? "bg-emerald-500/10 text-emerald-600 shadow-inner"
                                    : "bg-brand-gold/5 text-brand-deep/40 dark:text-brand-cream/40"
                            )}>
                                <Icon className="w-7 h-7 md:w-8 md:h-8 opacity-80" />
                            </div>
                            <div className="space-y-1 md:space-y-2">
                                <h3 className="text-xl md:text-2xl font-serif text-brand-deep dark:text-brand-cream leading-tight">
                                    {step.name}
                                </h3>
                                <p className="text-xs md:text-sm text-brand-deep/60 dark:text-brand-cream/60 max-w-sm leading-relaxed">
                                    {step.description}
                                </p>
                            </div>
                        </div>

                        <VerificationStatusBadge status={status} isLocked={isLocked} />
                    </div>

                    {isRejected && (
                        <VerificationAuditTrail
                            logs={logs}
                            showHistory={showHistory}
                            onToggleHistory={onToggleHistory}
                            rejectionReason={rejectionReason}
                        />
                    )}

                    <div className="mt-8 md:mt-12 flex flex-col md:flex-row items-end justify-between gap-8">
                        <div className="space-y-4 w-full md:w-auto">
                            <div className="flex items-center gap-3">
                                <div className="h-px w-6 md:w-8 bg-brand-gold/40" />
                                <span className="text-[9px] md:text-[10px] font-bold uppercase tracking-widest text-brand-gold/80">Required Credentials</span>
                            </div>
                            <ul className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-2 md:gap-y-3">
                                {step.requirements.map((req, i) => (
                                    <li key={i} className="flex items-center gap-2 md:gap-3 text-[11px] md:text-xs text-brand-deep/50 dark:text-brand-cream/50">
                                        <div className="w-1 md:w-1.5 h-1 md:h-1.5 rounded-full bg-brand-gold/60" />
                                        {req}
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div className="w-full md:w-auto">
                            <AnimatePresence mode="wait">
                                {canResubmit && (
                                    isActive ? (
                                        <motion.div
                                            initial={{ opacity: 0, y: 15 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, scale: 0.95 }}
                                            className="w-full"
                                        >
                                            <VerificationLevelForm
                                                level={step.level}
                                                bvn={bvn}
                                                onBvnChange={onBvnChange}
                                                address={address}
                                                onAddressChange={onAddressChange}
                                                onSubmit={() => onSubmit(step.level, step.type)}
                                                onCancel={onCancel}
                                                isPending={isPending}
                                            />
                                        </motion.div>
                                    ) : (
                                        <button
                                            onClick={onBegin}
                                            disabled={isLocked || isVerified}
                                            className={cn(
                                                "w-full md:w-auto h-12 md:h-14 px-8 md:px-10 rounded-xl md:rounded-2xl font-bold uppercase tracking-widest transition-all duration-500 group flex items-center justify-center gap-2",
                                                isLocked
                                                    ? "bg-brand-deep/5 text-brand-deep/20 dark:bg-white/5 dark:text-white/20 border-transparent cursor-not-allowed"
                                                    : "bg-brand-gold text-brand-deep hover:shadow-[0_12px_32px_rgba(212,175,55,0.25)] hover:-translate-y-0.5 hover:bg-brand-gold/80"
                                            )}
                                        >
                                            {isLocked ? (
                                                <span className="flex items-center gap-2 opacity-50 text-xs md:text-sm"><Lock className="w-4 h-4" /> Locked</span>
                                            ) : (
                                                <span className="flex items-center gap-2 text-xs md:text-sm">
                                                    {isRejected ? "Resubmit" : "Begin"}
                                                    <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                                </span>
                                            )}
                                        </button>
                                    )
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                </div>
            </GlassCard>
        </motion.div>
    )
}
