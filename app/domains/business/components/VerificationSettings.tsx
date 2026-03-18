"use client"

import { useState, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
    ShieldCheck, FileText, MapPin, Briefcase, Home, Loader2, AlertCircle,
    ChevronDown, User, Building2, Lock, Sparkles, CheckCircle2,
} from "lucide-react"
import { Button } from "@/app/components/ui/button"
import { cn } from "@/app/lib/utils"
import { toast } from "sonner"
import { ErrorDisplay } from "@/app/components/shared/ErrorDisplay"
import { GlassCard } from "@/app/components/ui/glass-card"
import { InsightWhisper } from "@/app/components/dashboard/InsightWhisper"
import {
    useVerifications,
    useVerificationLevels,
    useSubmitVerification,
    VerificationData,
    VerificationLevelConfig,
} from "@/app/domains/business/hooks/useVerification"
import { VerificationLevelForm, Coordinates } from "./verification/VerificationLevelForm"
import { VerificationAuditTrail } from "./verification/VerificationAuditTrail"
import { VerificationTypeEnum, VerificationGroupEnum } from "../data/type"
import { useSettings } from "../hooks/useBusinessSettings"
import { formatCurrency } from "@/app/lib/formatters"

const ICON_MAP: Record<string, any> = {
    ShieldCheck, FileText, MapPin, Briefcase, Home,
}

const GROUP_META: Record<VerificationGroupEnum, { label: string; Icon: any; description: string }> = {
    [VerificationGroupEnum.OWNER]: {
        label: "Master Identity",
        Icon: User,
        description: "Authentication of the ultimate beneficial owner or director",
    },
    [VerificationGroupEnum.BUSINESS]: {
        label: "Corporate Standing",
        Icon: Building2,
        description: "Legal entity validation and operational proof",
    },
}

type VerifStatus = "pending" | "verified" | "rejected" | "unverified"

function StatusBadge({ status, isLocked }: { status: VerifStatus; isLocked?: boolean }) {
    const map: Record<VerifStatus, { label: string; className: string; Icon: any }> = {
        verified: { label: "Verified", className: "bg-emerald-500/10 border-emerald-500/20 text-emerald-600", Icon: CheckCircle2 },
        pending: { label: "Reviewing", className: "bg-brand-gold/10 border-brand-gold/30 text-brand-gold animate-pulse", Icon: Loader2 },
        rejected: { label: "Declined", className: "bg-red-500/10 border-red-500/20 text-red-500", Icon: AlertCircle },
        unverified: {
            label: isLocked ? "Locked" : "Required",
            className: isLocked
                ? "bg-brand-deep/5 border-transparent text-brand-deep/20 dark:text-white/10"
                : "bg-brand-gold/5 border-brand-gold/20 text-brand-gold",
            Icon: isLocked ? Lock : Sparkles
        },
    }
    const { label, className, Icon } = map[status]
    return (
        <span className={cn("inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border transition-all duration-300", className)}>
            <Icon className={cn("w-3 h-3", status === "pending" && "animate-spin")} />
            {label}
        </span>
    )
}

interface RegDocs { cac: File | null; mermat: File | null; statusReport: File | null }

interface AccordionItemProps {
    step: VerificationLevelConfig
    status: VerifStatus
    isLocked: boolean
    isOpen: boolean
    onToggle: () => void
    bvn: string
    onBvnChange: (v: string) => void
    address: string
    onAddressChange: (v: string) => void
    onFileSelect: (f: File | null) => void
    regDocs: RegDocs
    onRegDocChange: (key: keyof RegDocs, f: File | null) => void
    onCoordinatesChange: (coords: Coordinates | null) => void
    onSubmit: (levelId: number, type: VerificationTypeEnum) => void
    isPending: boolean
    logs?: any[]
}

function AccordionItem({
    step, status, isLocked, isOpen, onToggle,
    bvn, onBvnChange, address, onAddressChange, onFileSelect,
    regDocs, onRegDocChange, onCoordinatesChange, onSubmit, isPending, logs = [],
}: AccordionItemProps) {
    const Icon = ICON_MAP[step.icon] ?? ShieldCheck
    const isVerified = status === "verified"
    const isRejected = status === "rejected"
    const canAct = status === "unverified" || status === "rejected"
    const [showHistory, setShowHistory] = useState(false)

    return (
        <GlassCard
            className={cn(
                "p-0 border transition-all duration-500 group overflow-visible",
                isVerified
                    ? "border-emerald-500/20 bg-emerald-500/2 dark:bg-emerald-500/[0.02]"
                    : isOpen
                        ? "border-brand-gold/40 bg-white dark:bg-brand-deep shadow-xl"
                        : "border-brand-deep/5 dark:border-white/5 bg-white/40 dark:bg-white/[0.02]",
                isLocked && "opacity-40 grayscale pointer-events-none"
            )}
        >
            <button
                onClick={onToggle}
                disabled={isLocked}
                className="w-full flex items-center gap-5 p-5 md:p-6 text-left"
            >
                <div className={cn(
                    "w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 transition-transform duration-500 group-hover:scale-110",
                    isVerified ? "bg-emerald-500/10 text-emerald-600 shadow-[0_0_20px_rgba(16,185,129,0.1)]" : "bg-brand-gold/10 text-brand-gold shadow-[0_0_20px_rgba(212,175,55,0.1)]"
                )}>
                    {isLocked ? <Lock className="w-5 h-5 opacity-40" /> : <Icon className="w-5 h-5 shadow-sm" />}
                </div>

                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 flex-wrap">
                        <span className="text-base font-serif text-brand-deep dark:text-brand-cream transition-colors group-hover:text-brand-gold">
                            {step.name}
                        </span>
                        {step.isRequired && (
                            <span className="text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full bg-brand-deep/5 dark:bg-white/5 text-brand-deep/40 dark:text-white/40 border border-brand-deep/5 dark:border-white/5">
                                Required
                            </span>
                        )}
                    </div>
                    <p className="text-xs text-brand-deep/40 dark:text-brand-cream/40 mt-1 line-clamp-1 font-sans">
                        {step.description}
                    </p>
                </div>

                <div className="flex items-center gap-4 shrink-0">
                    <StatusBadge status={status} isLocked={isLocked} />
                    {!isLocked && (
                        <div className={cn(
                            "w-8 h-8 rounded-full flex items-center justify-center bg-brand-deep/5 dark:bg-white/5 transition-all duration-300",
                            isOpen && "bg-brand-gold/10 text-brand-gold rotate-180"
                        )}>
                            <ChevronDown className="w-4 h-4" />
                        </div>
                    )}
                </div>
            </button>

            <AnimatePresence initial={false}>
                {isOpen && !isLocked && (
                    <motion.div
                        key="body"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                        className="overflow-hidden"
                    >
                        <div className="px-5 md:px-6 pb-6 space-y-6 border-t border-brand-deep/5 dark:border-white/5 pt-6">
                            <div className="flex flex-wrap gap-2">
                                {step.requirements.map((req, i) => (
                                    <span key={i} className="flex items-center gap-2 text-[11px] font-medium text-brand-deep/60 dark:text-brand-cream/60 bg-brand-deep/5 dark:bg-white/5 px-3 py-1.5 rounded-lg border border-transparent hover:border-brand-gold/10 transition-colors">
                                        <div className="w-1 h-1 rounded-full bg-brand-gold" />
                                        {req}
                                    </span>
                                ))}
                            </div>

                            {isRejected && (
                                <VerificationAuditTrail
                                    logs={logs}
                                    showHistory={showHistory}
                                    onToggleHistory={() => setShowHistory((p) => !p)}
                                    rejectionReason={logs[0]?.rejectionReason}
                                />
                            )}

                            {canAct && (
                                <div className="bg-white/50 dark:bg-white/[0.02] p-5 rounded-[24px] border border-brand-deep/5 dark:border-white/5">
                                    <VerificationLevelForm
                                        level={step.level}
                                        type={step.type}
                                        bvn={bvn}
                                        onBvnChange={onBvnChange}
                                        address={address}
                                        onAddressChange={onAddressChange}
                                        onFileSelect={onFileSelect}
                                        regDocs={regDocs}
                                        onRegDocChange={onRegDocChange}
                                        onCoordinatesChange={onCoordinatesChange}
                                        onSubmit={() => onSubmit(step.level, step.type)}
                                        onCancel={onToggle}
                                        isPending={isPending}
                                    />
                                </div>
                            )}

                            {status === "pending" && (
                                <div className="flex items-start gap-4 p-5 rounded-2xl bg-brand-gold/5 border border-brand-gold/20 shadow-inner">
                                    <div className="w-10 h-10 rounded-xl bg-brand-gold/10 flex items-center justify-center shrink-0">
                                        <Loader2 className="w-5 h-5 text-brand-gold animate-spin" />
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-serif text-brand-gold mb-1">Under Review</h4>
                                        <p className="text-xs text-brand-deep/60 dark:text-brand-cream/60 leading-relaxed">
                                            Our compliance team is currently validating your submission. This typically takes 24-48 hours.
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </GlassCard>
    )
}

export function VerificationSettings() {
    const { data: verificationData, error, isLoading: isFetching, refetch } = useVerifications()
    const { data: levels, isLoading: isLoadingLevels } = useVerificationLevels()
    const { data: settings } = useSettings()
    const submitVerification = useSubmitVerification()

    const [openItem, setOpenItem] = useState<string | null>(null)
    const [bvn, setBvn] = useState("")
    const [address, setAddress] = useState("")
    const [file, setFile] = useState<File | null>(null)
    const [regDocs, setRegDocs] = useState<RegDocs>({ cac: null, mermat: null, statusReport: null })
    const [coordinates, setCoordinates] = useState<Coordinates | null>(null)

    const handleVerification = async (levelId: number, type: VerificationTypeEnum) => {
        let payload: VerificationData = {}

        if (type === VerificationTypeEnum.BVN) {
            if (bvn.length !== 11) {
                toast.error("Invalid BVN Format", { description: "Your Bank Verification Number must be exactly 11 digits." })
                return
            }
            payload = { bvn }
        } else if (type === VerificationTypeEnum.GOVT_ID) {
            if (!file) {
                toast.error("Identification Required", { description: "Please upload a clear image of your Government ID to proceed." })
                return
            }
            payload = { fileName: file.name, fileType: file.type, fileSize: file.size, document_uri: URL.createObjectURL(file) }
        } else if (type === VerificationTypeEnum.ADDRESS) {
            if (address.length < 10) {
                toast.error("Address too short", { description: "Please provide a more detailed business address." })
                return
            }
            if (!coordinates) {
                toast.error("Location Required", { description: "Please allow location access so we can capture your coordinates." })
                return
            }
            payload = { address, latitude: coordinates.lat, longitude: coordinates.lng }
        } else if (type === VerificationTypeEnum.OWNER_ADDRESS) {
            if (address.length < 10) {
                toast.error("Address too short", { description: "Please provide your full home address." })
                return
            }
            if (!coordinates) {
                toast.error("Location Required", { description: "Please allow location access so we can capture your coordinates." })
                return
            }
            if (!file) {
                toast.error("Proof of Residence Required", { description: "Please upload a utility bill, bank statement, or tenancy agreement." })
                return
            }
            payload = { address, latitude: coordinates.lat, longitude: coordinates.lng, document_uri: URL.createObjectURL(file) }
        } else if (type === VerificationTypeEnum.REGISTRATION_DOCS) {
            if (!regDocs.cac || !regDocs.mermat || !regDocs.statusReport) {
                toast.error("All Documents Required", { description: "Please upload your CAC Certificate, MEMART, and Status Report." })
                return
            }
            payload = {
                cacCertificateUrl: URL.createObjectURL(regDocs.cac),
                mermatUrl: URL.createObjectURL(regDocs.mermat),
                statusReportUrl: URL.createObjectURL(regDocs.statusReport),
            }
        }

        try {
            await submitVerification.mutateAsync({ levelId, type, data: payload })
            setOpenItem(null)
            setBvn("")
            setAddress("")
            setFile(null)
            setRegDocs({ cac: null, mermat: null, statusReport: null })
            setCoordinates(null)
        } catch {
            // handled in mutation hook
        }
    }

    const verifications = verificationData?.verifications ?? []
    const sortedLevels = levels ? [...levels].sort((a, b) => a.level - b.level) : []

    const getVerification = (step: VerificationLevelConfig) =>
        verifications.find((v) => v.levelId === step.level)

    const getStatus = (step: VerificationLevelConfig): VerifStatus => {
        const v = getVerification(step)
        if (!v) return "unverified"
        return v.status.toLowerCase() as VerifStatus
    }

    const stats = useMemo(() => {
        if (!sortedLevels.length) return { percent: 0, completed: 0, total: 0 }
        const completed = sortedLevels.filter(l => getStatus(l) === "verified").length
        return {
            percent: Math.round((completed / sortedLevels.length) * 100),
            completed,
            total: sortedLevels.length
        }
    }, [sortedLevels, verifications])

    const insightData = useMemo(() => {
        const currency = settings?.business?.currency || 'USD'
        const verifiedLevels = sortedLevels.filter(l => getStatus(l) === 'verified')
        const nextLevel = sortedLevels.find(l => getStatus(l) !== 'verified')

        const currentLimit = verifiedLevels.length > 0
            ? verifiedLevels[verifiedLevels.length - 1].limits.monthlyWithdrawalAmount
            : 0

        if (!nextLevel) {
            return {
                insight: `**Institutional Grade Reached.** Your account has reached the maximum verification tier with a monthly limit of **${formatCurrency(currentLimit, { currency })}**.`
            }
        }

        const nextLimit = nextLevel.limits.monthlyWithdrawalAmount
        return {
            insight: `Your account is currently at a **${formatCurrency(currentLimit, { currency })} monthly limit**. Verifying your **${nextLevel.name}** will upgrade you to a **${formatCurrency(nextLimit, { currency })}** monthly capacity.`
        }
    }, [sortedLevels, verifications, settings])

    if (error) return (
        <ErrorDisplay
            title="Unable to load verification status"
            description="We encountered an issue while fetching your verification details. Please check your connection and try again."
            onRetry={() => refetch()}
        />
    )

    if (isFetching || isLoadingLevels) return (
        <div className="flex flex-col items-center justify-center p-24 space-y-6">
            <div className="relative w-16 h-16">
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    className="absolute inset-0 rounded-full border-t-2 border-brand-gold border-r-2 border-r-transparent"
                />
                <ShieldCheck className="absolute inset-0 m-auto w-6 h-6 text-brand-gold/40" />
            </div>
            <p className="text-sm font-bold uppercase tracking-widest text-brand-gold/60 animate-pulse">
                Establishing Secure Session...
            </p>
        </div>
    )

    const groupOrder = [VerificationGroupEnum.OWNER, VerificationGroupEnum.BUSINESS]
    const grouped = groupOrder.reduce<Record<VerificationGroupEnum, VerificationLevelConfig[]>>((acc, g) => {
        acc[g] = sortedLevels.filter((l) => l.group === g)
        return acc
    }, {} as Record<VerificationGroupEnum, VerificationLevelConfig[]>)
    const ungrouped = sortedLevels.filter((l) => !l.group || !groupOrder.includes(l.group))

    const allGroups = groupOrder.filter((g) => grouped[g]?.length > 0)

    if (allGroups.length === 0 && ungrouped.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[500px] text-center max-w-lg mx-auto px-6">
                <GlassCard className="p-12 w-full">
                    <div className="w-20 h-20 rounded-3xl bg-brand-gold/10 flex items-center justify-center mx-auto mb-8 relative">
                        <div className="absolute inset-0 bg-brand-gold/20 blur-2xl rounded-full" />
                        <ShieldCheck className="w-10 h-10 text-brand-gold relative z-10" />
                    </div>
                    <h2 className="text-3xl font-serif text-brand-deep dark:text-brand-cream mb-4">Secure Configuration</h2>
                    <p className="text-brand-deep/50 dark:text-brand-cream/50 leading-relaxed mb-8 font-sans">
                        Our compliance algorithms are currently tailoring your verification journey based on your corporate profile. This usually concludes in a few moments.
                    </p>
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-gold/5 border border-brand-gold/10">
                        <Loader2 className="w-3 h-3 text-brand-gold animate-spin" />
                        <span className="text-[10px] font-bold uppercase tracking-widest text-brand-gold">Optimizing Protocol</span>
                    </div>
                </GlassCard>
            </div>
        )
    }

    return (
        <div className="max-w-4xl space-y-16 pb-24">
            {/* Editorial Header Section */}
            <section className="relative pt-10">
                <div className="absolute -top-10 -right-20 w-80 h-80 bg-brand-gold/5 blur-[120px] rounded-full pointer-events-none" />
                <div className="absolute -top-10 -left-20 w-80 h-80 bg-brand-deep/5 blur-[120px] rounded-full pointer-events-none" />

                <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-12 items-end">
                    <div className="space-y-4 relative">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-8 h-1 bg-brand-gold rounded-full" />
                            <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-brand-gold">Institutional Trust</span>
                        </div>
                        <h2 className="text-4xl md:text-5xl font-serif text-brand-deep dark:text-brand-cream tracking-tight leading-tight">
                            Identity & <span className="text-brand-gold italic">Compliance</span>
                        </h2>
                        <p className="text-base md:text-lg text-brand-deep/50 dark:text-brand-cream/50 max-w-xl font-sans leading-relaxed">
                            Navigate the verification milestones required to unlock institutional-grade liquidity and premium platform orchestration.
                        </p>
                    </div>

                    <GlassCard className="p-8 border-brand-gold/20 bg-brand-gold/[0.03] flex items-center gap-6 relative group overflow-hidden">
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_100%_0%,rgba(212,175,55,0.1),transparent_70%)]" />
                        <div className="relative shrink-0">
                            <svg className="w-16 h-16 transform -rotate-90">
                                <circle
                                    cx="32" cy="32" r="28"
                                    stroke="currentColor"
                                    strokeWidth="4"
                                    fill="transparent"
                                    className="text-brand-deep/10 dark:text-white/5"
                                />
                                <motion.circle
                                    cx="32" cy="32" r="28"
                                    stroke="currentColor"
                                    strokeWidth="4"
                                    strokeDasharray={175.9}
                                    initial={{ strokeDashoffset: 175.9 }}
                                    animate={{ strokeDashoffset: 175.9 - (175.9 * stats.percent) / 100 }}
                                    transition={{ duration: 1.5, ease: "easeOut" }}
                                    fill="transparent"
                                    className="text-brand-gold"
                                    strokeLinecap="round"
                                />
                            </svg>
                            <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-brand-gold">
                                {stats.percent}%
                            </span>
                        </div>
                        <div className="relative">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-brand-gold mb-1">Status Report</p>
                            <h4 className="text-lg font-serif text-brand-deep dark:text-brand-cream leading-none">
                                {stats.completed}/{stats.total} <span className="text-xs font-sans text-brand-deep/40 dark:text-brand-cream/40 ml-1">Verified</span>
                            </h4>
                        </div>
                    </GlassCard>
                </div>
            </section>

            {/* AI Insight Overlay */}
            <InsightWhisper
                insight={insightData.insight}
                className="my-10"
            />

            {/* Verification Journey */}
            <div className="space-y-16">
                {allGroups.map((groupKey, groupIdx) => {
                    const meta = GROUP_META[groupKey]
                    const groupLevels = grouped[groupKey]
                    const GroupIcon = meta.Icon
                    const allVerified = groupLevels.every((l) => getStatus(l) === "verified")

                    return (
                        <motion.section
                            key={groupKey}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: groupIdx * 0.2 }}
                            className="space-y-6"
                        >
                            <div className="flex items-end justify-between border-b border-brand-deep/5 dark:border-white/5 pb-6">
                                <div className="flex items-center gap-5">
                                    <div className={cn(
                                        "w-14 h-14 rounded-2xl flex items-center justify-center relative",
                                        allVerified ? "bg-emerald-500/10 text-emerald-600" : "bg-brand-gold/10 text-brand-gold"
                                    )}>
                                        <div className="absolute inset-0 bg-current opacity-5 blur-xl rounded-full" />
                                        <GroupIcon className="w-6 h-6 relative z-10" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-serif text-brand-deep dark:text-brand-cream leading-tight">
                                            {meta.label}
                                        </h3>
                                        <p className="text-sm text-brand-deep/40 dark:text-brand-cream/40 font-sans mt-0.5">{meta.description}</p>
                                    </div>
                                </div>
                                {allVerified && (
                                    <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 text-[10px] font-bold uppercase tracking-widest">
                                        <CheckCircle2 className="w-3 h-3" />
                                        Complete
                                    </div>
                                )}
                            </div>

                            <div className="space-y-4">
                                {groupLevels.map((step, index) => {
                                    const status = getStatus(step)
                                    const prevStep = groupLevels[index - 1] ?? sortedLevels.find((l) => l.level === step.level - 1)
                                    const prevStatus = prevStep ? getStatus(prevStep) : "verified"
                                    const isLocked = prevStatus !== "verified" && index > 0

                                    return (
                                        <AccordionItem
                                            key={step.id}
                                            step={step}
                                            status={status}
                                            isLocked={isLocked}
                                            isOpen={openItem === step.id}
                                            onToggle={() => setOpenItem(openItem === step.id ? null : step.id)}
                                            bvn={bvn}
                                            onBvnChange={setBvn}
                                            address={address}
                                            onAddressChange={setAddress}
                                            onFileSelect={setFile}
                                            regDocs={regDocs}
                                            onRegDocChange={(key, f) => setRegDocs((prev) => ({ ...prev, [key]: f }))}
                                            onCoordinatesChange={setCoordinates}
                                            onSubmit={handleVerification}
                                            isPending={submitVerification.isPending}
                                            logs={getVerification(step)?.logs}
                                        />
                                    )
                                })}
                            </div>
                        </motion.section>
                    )
                })}
            </div>

            {/* Enhanced Footer */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-10">
                <GlassCard className="p-8 group">
                    <div className="w-12 h-12 rounded-2xl bg-brand-deep text-brand-gold flex items-center justify-center mb-6 transition-transform duration-500 group-hover:rotate-12">
                        <ShieldCheck className="w-6 h-6" />
                    </div>
                    <h4 className="text-xl font-serif text-brand-deep dark:text-brand-cream mb-2">Uncompromising Security</h4>
                    <p className="text-sm text-brand-deep/50 dark:text-brand-cream/50 leading-relaxed font-sans mb-6">
                        Your corporate data is encrypted via AES-256 at the hardware level. Our verification protocols meet SOC2 Type II and GDPR global standards.
                    </p>
                    <div className="flex items-center gap-4 text-[10px] font-bold uppercase tracking-widest text-brand-deep/30 dark:text-white/20">
                        <span>Encrypted</span>
                        <div className="w-1 h-1 rounded-full bg-brand-gold" />
                        <span>Audited</span>
                        <div className="w-1 h-1 rounded-full bg-brand-gold" />
                        <span>Compliant</span>
                    </div>
                </GlassCard>

                <GlassCard className="p-8 border-brand-green/10 bg-brand-green/5 relative group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-brand-gold/10 blur-3xl -mr-16 -mt-16 rounded-full" />
                    <div className="w-12 h-12 rounded-2xl bg-white/50 dark:bg-white/5 border border-brand-gold/20 flex items-center justify-center mb-6 text-brand-gold">
                        <AlertCircle className="w-6 h-6" />
                    </div>
                    <h4 className="text-xl font-serif text-brand-deep dark:text-brand-cream mb-2">Concierge Support</h4>
                    <p className="text-sm text-brand-deep/50 dark:text-brand-cream/50 leading-relaxed font-sans mb-8">
                        If you encounter systemic friction during your identity transition, our compliance specialists are ready to orchestrate a manual review.
                    </p>
                    <Button
                        variant="outline"
                        className="w-full rounded-2xl border-brand-gold/30 text-brand-gold hover:bg-brand-gold hover:text-brand-deep h-12 font-bold uppercase tracking-widest text-[10px] transition-all"
                    >
                        Initiate Private Consultation
                    </Button>
                </GlassCard>
            </div>
        </div>
    )
}
