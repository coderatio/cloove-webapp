"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Sparkles, ShieldCheck, FileText, CheckCircle2, Circle, Upload, MapPin, ChevronRight, AlertCircle, Loader2, Lock } from "lucide-react"
import { GlassCard } from "@/app/components/ui/glass-card"
import { Button } from "@/app/components/ui/button"
import { Input } from "@/app/components/ui/input"
import { cn } from "@/app/lib/utils"
import { toast } from "sonner"
import { ErrorDisplay } from "@/app/components/shared/ErrorDisplay"
import {
    useVerifications,
    useVerificationLevels,
    useSubmitVerification,
    VerificationLevel,
    VerificationType,
    VerificationData,
    VerificationLevelConfig,
} from "@/app/domains/business/hooks/use-verification"

const ICON_MAP: Record<string, any> = {
    "ShieldCheck": ShieldCheck,
    "FileText": FileText,
    "MapPin": MapPin,
    "Briefcase": Sparkles // Fallback or additional icon
}

export function VerificationSettings() {
    const { data: verificationData, error, isLoading: isFetching, refetch } = useVerifications()
    const { data: levels, isLoading: isLoadingLevels } = useVerificationLevels()
    const submitVerification = useSubmitVerification()

    const [activeLevel, setActiveLevel] = useState<VerificationLevel | null>(null)
    const [showHistory, setShowHistory] = useState<number | null>(null)
    const [bvn, setBvn] = useState("")
    const [address, setAddress] = useState("")

    const handleVerification = async (levelId: number, type: VerificationType) => {
        let payload: VerificationData = {}

        // TODO: This logic needs to be dynamic based on type, not just level number
        // For now, mapping simplified types
        if (type === "BVN") {
            if (bvn.length !== 11) {
                toast.error("Please enter a valid 11-digit BVN")
                return
            }
            payload = { bvn }
        } else if (type === "GOVT_ID") {
            toast.info("Document upload coming soon")
            return
        } else if (type === "ADDRESS") {
            if (!address) {
                toast.error("Please enter your business address")
                return
            }
            payload = { address }
        }

        try {
            await submitVerification.mutateAsync({
                levelId,
                type,
                data: payload
            })

            setActiveLevel(null)
            setBvn("")
            setAddress("")
        } catch (err) {
            // Error handling is done in mutation hook
        }
    }

    if (error) return (
        <ErrorDisplay
            title="Unable to load verification status"
            description="We encountered an issue while fetching your verification details. Please check your connection and try again."
            onRetry={() => refetch()}
        />
    )

    if (isFetching || isLoadingLevels) return (
        <div className="flex flex-col items-center justify-center p-24 space-y-4">
            <Loader2 className="w-10 h-10 animate-spin text-brand-gold" />
            <p className="text-sm font-medium text-brand-deep/40 dark:text-brand-cream/40 animate-pulse">Synchronizing Security Status...</p>
        </div>
    )

    const verifications = verificationData?.verifications || []
    const sortedLevels = levels ? [...levels].sort((a, b) => a.level - b.level) : []

    const getVerification = (levelConfig: VerificationLevelConfig) => {
        return verifications.find((v) => v.levelId === levelConfig.id)
    }

    const getStepStatus = (levelConfig: VerificationLevelConfig): "pending" | "verified" | "rejected" | "unverified" => {
        const verification = getVerification(levelConfig)
        if (!verification) return "unverified"
        return verification.status.toLowerCase() as "pending" | "verified" | "rejected" | "unverified"
    }

    return (
        <div className="relative space-y-12 pb-20">
            {/* Header Insight */}
            <div className="flex items-center gap-4 p-4 rounded-3xl bg-brand-gold/5 border border-brand-gold/10">
                <div className="shrink-0 w-10 h-10 rounded-2xl bg-brand-gold/10 flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-brand-gold" />
                </div>
                <div className="space-y-0.5">
                    <h4 className="text-sm font-bold text-brand-deep dark:text-brand-cream tracking-tight">Verification Journey</h4>
                    <p className="text-xs text-brand-deep/60 dark:text-brand-cream/60">Complete all levels to unlock the full power of Cloove.</p>
                </div>
            </div>

            {/* Journey Track */}
            <div className="relative isolate">
                {/* 1. Background Track Layer - Definitive basement stacking */}
                <div className="absolute inset-0 pointer-events-none z-0">
                    <div className="relative h-full w-full">
                        {/* Desktop Line */}
                        <div
                            className="absolute top-8 bottom-8 w-[4px] bg-linear-to-b from-brand-gold via-brand-gold/20 to-transparent dark:from-brand-gold/60 dark:via-brand-gold/10 rounded-full hidden md:block"
                            style={{ left: '54px' }}
                        />
                        {/* Mobile Line */}
                        <div
                            className="absolute top-8 bottom-8 w-[2px] bg-linear-to-b from-brand-gold via-brand-gold/20 to-transparent rounded-full md:hidden left-1/2 -translate-x-1/2"
                        />
                    </div>
                </div>

                {/* 2. Foreground Content Layer - Definitive stage stacking */}
                <div className="relative z-10 space-y-20 md:space-y-12">
                    {sortedLevels.map((step, index) => {
                        const status = getStepStatus(step)
                        const isVerified = status === "verified"
                        const isPending = status === "pending"
                        const isRejected = status === "rejected"
                        const isActive = activeLevel === step.level

                        const prevStep = sortedLevels[index - 1]
                        const isLocked = prevStep && getStepStatus(prevStep) !== "verified"

                        const Icon = step.icon && ICON_MAP[step.icon] ? ICON_MAP[step.icon] : ShieldCheck // Default icon

                        return (
                            <div key={step.level} className="relative flex flex-col md:block">
                                {/* Journey Node - Stage Layer (Top Priority) */}
                                <div className={cn(
                                    "absolute left-1/2 -translate-x-1/2 md:translate-x-0 md:left-9 top-0 md:top-6 w-[40px] h-[40px] rounded-full border-2 z-20 transition-all duration-700 flex items-center justify-center overflow-hidden",
                                    isVerified
                                        ? "bg-brand-gold border-brand-gold shadow-[0_0_25px_rgba(212,175,55,0.4)]"
                                        : isLocked
                                            ? "bg-brand-cream dark:bg-brand-deep border-brand-deep/10 dark:border-white/10"
                                            : "bg-brand-cream border-brand-gold dark:bg-brand-deep shadow-[0_4px_12px_rgba(0,0,0,0.1)]"
                                )}>
                                    {isVerified ? (
                                        <CheckCircle2 className="w-5 h-5 text-brand-deep" />
                                    ) : (
                                        <span className={cn(
                                            "font-serif text-xl font-bold leading-none mt-[2px]",
                                            isLocked ? "text-brand-deep/20 dark:text-white/20" : "text-brand-gold"
                                        )}>
                                            {step.level}
                                        </span>
                                    )}
                                </div>

                                <motion.div
                                    layout
                                    className="pt-14 md:pt-0 md:pl-28 relative z-10"
                                >
                                    <GlassCard
                                        hoverEffect={!isLocked}
                                        className={cn(
                                            "group transition-all duration-500",
                                            // Absolute Masking: Solid on mobile, frosted on desktop
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
                                            </div>

                                            {isRejected && (
                                                <div className="mt-4 p-5 rounded-[24px] bg-red-500/5 border border-red-500/10 flex flex-col gap-4">
                                                    <div className="flex items-start gap-3">
                                                        <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                                                        <div className="space-y-1">
                                                            <p className="text-[10px] font-bold text-red-500 uppercase tracking-widest leading-none">Identity Rejection</p>
                                                            <p className="text-sm text-brand-deep dark:text-brand-cream/90 leading-relaxed font-medium">
                                                                {getVerification(step)?.logs[0]?.rejectionReason || "Please verify your information and try again."}
                                                            </p>
                                                        </div>
                                                    </div>

                                                    <button
                                                        onClick={() => setShowHistory(showHistory === step.id ? null : step.id)}
                                                        className="text-[10px] font-bold text-brand-deep/40 dark:text-brand-cream/40 hover:text-brand-gold uppercase tracking-widest transition-colors flex items-center gap-2 self-start"
                                                    >
                                                        {showHistory === step.id ? "Hide Audit Trail" : "View Audit Trail"}
                                                        <ChevronRight className={cn("w-3 h-3 transition-transform", showHistory === step.id && "rotate-90")} />
                                                    </button>

                                                    <AnimatePresence>
                                                        {showHistory === step.id && (
                                                            <motion.div
                                                                initial={{ height: 0, opacity: 0 }}
                                                                animate={{ height: "auto", opacity: 1 }}
                                                                exit={{ height: 0, opacity: 0 }}
                                                                className="overflow-hidden border-t border-red-500/5 pt-4 space-y-4"
                                                            >
                                                                {getVerification(step)?.logs.map((log, i) => (
                                                                    <div key={log.id} className="flex gap-4 relative">
                                                                        {i !== (getVerification(step)?.logs.length || 0) - 1 && (
                                                                            <div className="absolute left-1.5 top-3 bottom-0 w-px bg-brand-deep/5 dark:bg-white/5" />
                                                                        )}
                                                                        <div className={cn(
                                                                            "w-3 h-3 rounded-full mt-1.5 shrink-0 border-2",
                                                                            log.status === "VERIFIED" ? "bg-emerald-500 border-emerald-500/20" :
                                                                                log.status === "PENDING" ? "bg-brand-gold border-brand-gold/20" :
                                                                                    "bg-red-500 border-red-500/20"
                                                                        )} />
                                                                        <div className="space-y-1.5 pb-2">
                                                                            <div className="flex items-center gap-2">
                                                                                <span className="text-[10px] font-bold uppercase tracking-wider text-brand-deep/80 dark:text-brand-cream/80">{log.status}</span>
                                                                                <span className="text-[10px] text-brand-deep/40 dark:text-brand-cream/40">{new Date(log.createdAt).toLocaleString()}</span>
                                                                            </div>
                                                                            {log.rejectionReason && (
                                                                                <p className="text-xs text-brand-deep/60 dark:text-brand-cream/60 leading-relaxed italic pr-4">
                                                                                    "{log.rejectionReason}"
                                                                                </p>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </motion.div>
                                                        )}
                                                    </AnimatePresence>
                                                </div>
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
                                                        {(status === "unverified" || status === "rejected") && (
                                                            isActive ? (
                                                                <motion.div
                                                                    initial={{ opacity: 0, y: 15 }}
                                                                    animate={{ opacity: 1, y: 0 }}
                                                                    exit={{ opacity: 0, scale: 0.95 }}
                                                                    className="w-full space-y-4"
                                                                >
                                                                    {step.level === 1 && (
                                                                        <div className="space-y-2">
                                                                            <Input
                                                                                inputMode="numeric"
                                                                                value={bvn}
                                                                                onChange={(e) => setBvn(e.target.value)}
                                                                                placeholder="Enter 11-digit BVN"
                                                                                autoFocus
                                                                                maxLength={11}
                                                                                className="h-12 md:h-14 bg-white/50 dark:bg-white/5 border-brand-gold/20 rounded-xl md:rounded-2xl font-mono text-center tracking-[0.25em] text-base md:text-lg focus:ring-brand-gold/10"
                                                                            />
                                                                        </div>
                                                                    )}

                                                                    {step.level === 3 && (
                                                                        <div className="relative group">
                                                                            <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-gold" />
                                                                            <Input
                                                                                value={address}
                                                                                onChange={(e) => setAddress(e.target.value)}
                                                                                placeholder="Physical Business Address"
                                                                                className="h-12 md:h-14 pl-12 bg-white/50 dark:bg-white/5 border-brand-gold/20 rounded-xl md:rounded-2xl focus:ring-brand-gold/10"
                                                                            />
                                                                        </div>
                                                                    )}

                                                                    <div className="flex items-center gap-2 md:gap-3">
                                                                        <Button
                                                                            onClick={() => handleVerification(step.id, step.type)}
                                                                            disabled={submitVerification.isPending}
                                                                            className="flex-1 h-12 md:h-14 rounded-xl md:rounded-2xl bg-brand-gold px-8 hover:bg-brand-gold/80 text-brand-deep font-bold uppercase tracking-widest hover:brightness-105 active:scale-[0.98] transition-all shadow-lg shadow-brand-gold/10"
                                                                        >
                                                                            {submitVerification.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : "Verify Identity"}
                                                                        </Button>
                                                                        <Button
                                                                            variant="ghost"
                                                                            onClick={() => setActiveLevel(null)}
                                                                            className="h-12 md:h-14 px-4 md:px-6 rounded-xl md:rounded-2xl hover:bg-black/5 dark:hover:bg-white/5"
                                                                        >
                                                                            Cancel
                                                                        </Button>
                                                                    </div>
                                                                </motion.div>
                                                            ) : (
                                                                <Button
                                                                    onClick={() => step.level === 2 ? toast.info("Secure upload portal opening soon") : setActiveLevel(step.level)}
                                                                    disabled={isLocked || isVerified || isPending}
                                                                    className={cn(
                                                                        "w-full md:w-auto h-12 md:h-14 px-8 md:px-10 rounded-xl md:rounded-2xl font-bold uppercase tracking-widest transition-all duration-500 group",
                                                                        isLocked
                                                                            ? "bg-brand-deep/5 text-brand-deep/20 dark:bg-white/5 dark:text-white/20 border-transparent cursor-not-allowed"
                                                                            : isVerified
                                                                                ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20"
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
                                                                </Button>
                                                            )
                                                        )}
                                                    </AnimatePresence>
                                                </div>
                                            </div>
                                        </div>
                                    </GlassCard>
                                </motion.div>
                            </div>
                        )
                    })}
                </div>
            </div>

            {/* Support Footer */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-8 rounded-[32px] bg-brand-deep text-brand-cream overflow-hidden relative">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-brand-gold/10 blur-3xl rounded-full -mr-16 -mt-16" />
                    <ShieldCheck className="w-8 h-8 text-brand-gold mb-4" />
                    <h4 className="text-lg font-serif mb-2">Maximum Compliance</h4>
                    <p className="text-sm text-brand-cream/60 leading-relaxed">
                        Our verification protocols adhere to the highest international standards ensuring your business remains trusted and compliant in every jurisdiction.
                    </p>
                </div>
                <div className="p-8 rounded-[32px] bg-white/50 dark:bg-white/5 border border-brand-green/10 dark:border-white/10">
                    <AlertCircle className="w-8 h-8 text-brand-gold mb-4" />
                    <h4 className="text-lg font-serif mb-2 text-brand-deep dark:text-brand-cream">Need Assistance?</h4>
                    <p className="text-sm text-brand-deep/60 dark:text-brand-cream/60 leading-relaxed mb-6">
                        Having trouble with your documents or BVN authentication? Our compliance specialists are available 24/7 to assist.
                    </p>
                    <Button variant="outline" className="rounded-xl border-brand-gold/30 text-brand-gold hover:bg-brand-gold/5">
                        Speak with Support
                    </Button>
                </div>
            </div>
        </div>
    )
}
