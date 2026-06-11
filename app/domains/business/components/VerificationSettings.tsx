"use client"

import { useState, useMemo, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { HugeiconsIcon } from "@hugeicons/react"
import { SecurityCheckIcon as ShieldCheck, File01Icon as FileText, MapPinIcon as MapPin, Briefcase01Icon as Briefcase, Home01Icon as Home, Loading03Icon as Loader2, AlertCircleIcon as AlertCircle, ChevronDownIcon as ChevronDown, UserIcon as User, Building02Icon as Building2, LockIcon as Lock, SparklesIcon as Sparkles, CheckmarkCircle02Icon as CheckCircle2, Mail01Icon as Mail, ArrowRight01Icon as ArrowRight } from "@hugeicons/core-free-icons"
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
    VerificationResponse,
} from "@/app/domains/business/hooks/useVerification"
import { VerificationLevelForm, Coordinates, RegDocs } from "./verification/VerificationLevelForm"
import { VerificationAuditTrail } from "./verification/VerificationAuditTrail"
import { VerificationTypeEnum, VerificationGroupEnum } from "../data/type"
import { useSettings } from "../hooks/useBusinessSettings"
import { formatCurrency } from "@/app/lib/formatters"
import { useAuth } from "@/app/components/providers/auth-provider"
import { apiClient } from "@/app/lib/api-client"
import { useRouter } from "next/navigation"

type VerifStatus = "pending" | "verified" | "rejected" | "unverified"
type VerificationRecord = VerificationResponse["verifications"][number]

const ICON_MAP: Record<string, typeof ShieldCheck> = {
    ShieldCheck, FileText, MapPin, Briefcase, Home,
}

const GROUP_META: Record<VerificationGroupEnum, { label: string; Icon: typeof ShieldCheck; description: string }> = {
    [VerificationGroupEnum.OWNER]: {
        label: "Your identity",
        Icon: User,
        description: "Confirm the owner or director's details.",
    },
    [VerificationGroupEnum.BUSINESS]: {
        label: "Your business",
        Icon: Building2,
        description: "Confirm your company's registration and address.",
    },
}

/** Pure status lookup so it can be used safely inside memoized values. */
function statusOf(step: VerificationLevelConfig, verifications: VerificationRecord[]): VerifStatus {
    const v = verifications.find((x) => x.levelId === step.level)
    if (!v) return "unverified"
    return v.status.toLowerCase() as VerifStatus
}

// ─────────────────────────────────────────────────────────────────────────────
// Email prerequisite — shown above the steps when the account email is missing
// or unverified. Blocks the first step until resolved.
// ─────────────────────────────────────────────────────────────────────────────

function EmailPrerequisiteCard() {
    const { user } = useAuth()
    const router = useRouter()
    const pendingRef = useRef(false)
    const [sent, setSent] = useState(false)

    const hasEmail = !!user?.email
    const isVerified = user?.emailVerified === true

    if (isVerified) return null

    const handleResend = () => {
        if (pendingRef.current) return
        pendingRef.current = true
        toast.promise(
            apiClient.post("/security/resend-verification-email", {}).then(() => {
                setSent(true)
            }).finally(() => { pendingRef.current = false }),
            {
                loading: "Sending verification email…",
                success: "Check your inbox for the verification link.",
                error: (err) => err?.message || "Failed to send. Try again.",
                position: "top-center",
            }
        )
    }

    return (
        <GlassCard className="border-brand-gold/30 bg-brand-gold/[0.04] p-5 sm:p-6">
            <div className="flex items-start gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-brand-gold/15 text-brand-gold-700">
                    <HugeiconsIcon icon={Mail} className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-foreground">
                        {hasEmail ? "Verify your email to continue" : "Add an email address to continue"}
                    </p>
                    <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                        {hasEmail
                            ? "A verified email is required before you can verify your identity. We use it to keep you updated and to set up your payout account."
                            : "You need an email address on your account before you can verify your identity."}
                    </p>
                    <div className="mt-4">
                        {hasEmail ? (
                            sent ? (
                                <span className="text-sm font-medium text-emerald-600">
                                    Verification email sent. Check your inbox.
                                </span>
                            ) : (
                                <Button size="sm" className="h-9 rounded-xl px-4 text-sm font-semibold" onClick={handleResend}>
                                    Resend verification email
                                </Button>
                            )
                        ) : (
                            <Button
                                size="sm"
                                className="h-9 rounded-xl px-4 text-sm font-semibold"
                                onClick={() => router.push("/settings?tab=profile")}
                            >
                                Add email in settings
                                <HugeiconsIcon icon={ArrowRight} className="ml-1.5 h-3.5 w-3.5" />
                            </Button>
                        )}
                    </div>
                </div>
            </div>
        </GlassCard>
    )
}

function StatusBadge({ status, isLocked }: { status: VerifStatus; isLocked?: boolean }) {
    const map: Record<VerifStatus, { label: string; className: string; Icon: typeof ShieldCheck }> = {
        verified: { label: "Verified", className: "bg-emerald-500/10 border-emerald-500/20 text-emerald-600", Icon: CheckCircle2 },
        pending: { label: "In review", className: "bg-brand-gold/10 border-brand-gold/20 text-brand-gold-700", Icon: Loader2 },
        rejected: { label: "Declined", className: "bg-red-500/10 border-red-500/20 text-red-600", Icon: AlertCircle },
        unverified: {
            label: isLocked ? "Locked" : "Action needed",
            className: isLocked
                ? "bg-muted border-transparent text-muted-foreground/60"
                : "bg-brand-gold/5 border-brand-gold/20 text-brand-gold-700",
            Icon: isLocked ? Lock : Sparkles,
        },
    }
    const { label, className, Icon } = map[status]
    return (
        <span className={cn("inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide", className)}>
            <HugeiconsIcon icon={Icon} className={cn("h-3 w-3", status === "pending" && "animate-spin")} />
            {label}
        </span>
    )
}

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
    onFileUrlChange: (url: string | null) => void
    regDocs: RegDocs
    onRegDocChange: (key: keyof RegDocs, url: string | null) => void
    onCoordinatesChange: (coords: Coordinates | null) => void
    onSubmit: (levelId: number, type: VerificationTypeEnum) => void
    isPending: boolean
    logs?: VerificationRecord["logs"]
}

function AccordionItem({
    step, status, isLocked, isOpen, onToggle,
    bvn, onBvnChange, address, onAddressChange, onFileUrlChange,
    regDocs, onRegDocChange, onCoordinatesChange, onSubmit, isPending, logs = [],
}: AccordionItemProps) {
    const Icon = ICON_MAP[step.icon] ?? ShieldCheck
    const isVerified = status === "verified"
    const isRejected = status === "rejected"
    const canAct = status === "unverified" || status === "rejected"
    const [showHistory, setShowHistory] = useState(false)

    return (
        <GlassCard
            allowOverflow
            className={cn(
                "p-0 transition-colors duration-300",
                isVerified
                    ? "border-emerald-500/25 bg-emerald-500/[0.03]"
                    : isOpen
                        ? "border-brand-gold/40 shadow-md"
                        : "hover:border-foreground/12",
                isLocked && "opacity-55"
            )}
        >
            <button
                onClick={onToggle}
                disabled={isLocked}
                className="flex w-full items-center gap-4 p-5 text-left"
            >
                <div className={cn(
                    "flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl",
                    isVerified ? "bg-emerald-500/10 text-emerald-600" : "bg-brand-gold/10 text-brand-gold-700"
                )}>
                    <HugeiconsIcon icon={isLocked ? Lock : Icon} className="h-5 w-5" />
                </div>

                <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="font-serif text-base text-foreground">
                            {step.name}
                        </span>
                        {step.isRequired && !isVerified && (
                            <span className="rounded-full border border-border bg-muted px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-muted-foreground">
                                Required
                            </span>
                        )}
                    </div>
                    <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
                        {step.description}
                    </p>
                </div>

                <div className="flex shrink-0 items-center gap-3">
                    <StatusBadge status={status} isLocked={isLocked} />
                    {!isLocked && (
                        <div className={cn(
                            "flex h-8 w-8 items-center justify-center rounded-full bg-muted text-muted-foreground transition-all duration-300",
                            isOpen && "rotate-180 bg-brand-gold/10 text-brand-gold-700"
                        )}>
                            <HugeiconsIcon icon={ChevronDown} className="h-4 w-4" />
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
                        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                        className="overflow-hidden"
                    >
                        <div className="space-y-5 border-t border-border px-5 pb-6 pt-5">
                            <div>
                                <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                                    {"What you'll need"}
                                </p>
                                <div className="flex flex-wrap gap-2">
                                    {step.requirements.map((req, i) => (
                                        <span key={i} className="inline-flex items-center gap-1.5 rounded-lg bg-muted px-2.5 py-1 text-[11px] text-muted-foreground">
                                            <span className="h-1 w-1 rounded-full bg-brand-gold-700" />
                                            {req}
                                        </span>
                                    ))}
                                </div>
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
                                <div className="rounded-2xl border border-border bg-muted/40 p-5">
                                    <VerificationLevelForm
                                        level={step.level}
                                        type={step.type}
                                        bvn={bvn}
                                        onBvnChange={onBvnChange}
                                        address={address}
                                        onAddressChange={onAddressChange}
                                        onFileUrlChange={onFileUrlChange}
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
                                <div className="flex items-start gap-3 rounded-2xl border border-brand-gold/20 bg-brand-gold/5 p-4">
                                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-gold/10 text-brand-gold-700">
                                        <HugeiconsIcon icon={Loader2} className="h-4 w-4 animate-spin" />
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-semibold text-foreground">In review</h4>
                                        <p className="mt-0.5 text-sm leading-relaxed text-muted-foreground">
                                            {"We're checking your submission. This usually takes 24 to 48 hours."}
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
    const { user } = useAuth()
    const { data: verificationData, error, isLoading: isFetching, refetch } = useVerifications()
    const { data: levels, isLoading: isLoadingLevels } = useVerificationLevels()
    const { data: settings } = useSettings()
    const submitVerification = useSubmitVerification()

    const emailVerified = user?.emailVerified === true

    const [openItem, setOpenItem] = useState<string | null>(null)
    const [bvn, setBvn] = useState("")
    const [address, setAddress] = useState("")
    const [fileUrl, setFileUrl] = useState<string | null>(null)
    const [regDocs, setRegDocs] = useState<RegDocs>({ cac: null, mermat: null, statusReport: null })
    const [coordinates, setCoordinates] = useState<Coordinates | null>(null)

    const handleVerification = async (levelId: number, type: VerificationTypeEnum) => {
        let payload: VerificationData = {}

        if (type === VerificationTypeEnum.BVN) {
            if (bvn.length !== 11) {
                toast.error("Invalid BVN", { description: "Your Bank Verification Number must be exactly 11 digits." })
                return
            }
            payload = { bvn }
        } else if (type === VerificationTypeEnum.GOVT_ID) {
            if (!fileUrl) {
                toast.error("ID required", { description: "Please upload a clear image of your government ID to continue." })
                return
            }
            payload = { document_uri: fileUrl }
        } else if (type === VerificationTypeEnum.ADDRESS) {
            if (address.length < 10) {
                toast.error("Address too short", { description: "Please provide a more detailed business address." })
                return
            }
            if (!coordinates) {
                toast.error("Location needed", { description: "Please allow location access so we can capture your coordinates." })
                return
            }
            payload = { address, latitude: coordinates.lat, longitude: coordinates.lng }
        } else if (type === VerificationTypeEnum.OWNER_ADDRESS) {
            if (address.length < 10) {
                toast.error("Address too short", { description: "Please provide your full home address." })
                return
            }
            if (!coordinates) {
                toast.error("Location needed", { description: "Please allow location access so we can capture your coordinates." })
                return
            }
            if (!fileUrl) {
                toast.error("Proof of residence required", { description: "Please upload a utility bill, bank statement, or tenancy agreement." })
                return
            }
            payload = { address, latitude: coordinates.lat, longitude: coordinates.lng, document_uri: fileUrl }
        } else if (type === VerificationTypeEnum.REGISTRATION_DOCS) {
            if (!regDocs.cac || !regDocs.mermat || !regDocs.statusReport) {
                toast.error("All documents required", { description: "Please upload your CAC certificate, MEMART, and status report." })
                return
            }
            payload = { cacCertificateUrl: regDocs.cac, mermatUrl: regDocs.mermat, statusReportUrl: regDocs.statusReport }
        }

        try {
            await submitVerification.mutateAsync({ levelId, type, data: payload })
            setOpenItem(null)
            setBvn("")
            setAddress("")
            setFileUrl(null)
            setRegDocs({ cac: null, mermat: null, statusReport: null })
            setCoordinates(null)
        } catch {
            // handled in mutation hook
        }
    }

    const verifications = useMemo(
        () => verificationData?.verifications ?? [],
        [verificationData]
    )
    const sortedLevels = useMemo(
        () => (levels ? [...levels].sort((a, b) => a.level - b.level) : []),
        [levels]
    )

    const getVerification = (step: VerificationLevelConfig) =>
        verifications.find((v) => v.levelId === step.level)

    const getStatus = (step: VerificationLevelConfig): VerifStatus => statusOf(step, verifications)

    const stats = useMemo(() => {
        if (!sortedLevels.length) return { percent: 0, completed: 0, total: 0 }
        const completed = sortedLevels.filter((l) => statusOf(l, verifications) === "verified").length
        return {
            percent: Math.round((completed / sortedLevels.length) * 100),
            completed,
            total: sortedLevels.length,
        }
    }, [sortedLevels, verifications])

    const insightData = useMemo(() => {
        const currency = settings?.business?.currency || "USD"
        const verifiedLevels = sortedLevels.filter((l) => statusOf(l, verifications) === "verified")
        const nextLevel = sortedLevels.find((l) => statusOf(l, verifications) !== "verified")

        const currentLimit = verifiedLevels.length > 0
            ? verifiedLevels[verifiedLevels.length - 1].limits.monthlyWithdrawalAmount
            : 0

        if (!nextLevel) {
            return {
                insight: `**You're fully verified.** Your account is at the highest tier, with a monthly limit of **${formatCurrency(currentLimit, { currency })}**.`,
            }
        }

        const nextLimit = nextLevel.limits.monthlyWithdrawalAmount
        return {
            insight: `Your monthly limit is **${formatCurrency(currentLimit, { currency })}**. Verifying your **${nextLevel.name}** raises it to **${formatCurrency(nextLimit, { currency })}**.`,
        }
    }, [sortedLevels, verifications, settings])

    if (error) return (
        <ErrorDisplay
            title="Unable to load verification status"
            description="We ran into a problem loading your verification details. Please check your connection and try again."
            onRetry={() => refetch()}
        />
    )

    if (isFetching || isLoadingLevels) return (
        <div className="flex flex-col items-center justify-center gap-5 py-24">
            <div className="relative h-12 w-12">
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                    className="absolute inset-0 rounded-full border-2 border-brand-gold border-r-transparent"
                />
                <HugeiconsIcon icon={ShieldCheck} className="absolute inset-0 m-auto h-5 w-5 text-brand-gold/50" />
            </div>
            <p className="text-sm text-muted-foreground">Loading your verification status…</p>
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
            <div className="mx-auto flex min-h-[420px] max-w-lg flex-col items-center justify-center px-6 text-center">
                <GlassCard className="w-full p-10">
                    <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-3xl bg-brand-gold/10 text-brand-gold-700">
                        <HugeiconsIcon icon={ShieldCheck} className="h-8 w-8" />
                    </div>
                    <h2 className="mb-2 font-serif text-2xl text-foreground">Setting up your steps</h2>
                    <p className="mb-6 leading-relaxed text-muted-foreground">
                        {"We're preparing your verification steps based on your business. This usually takes a moment."}
                    </p>
                    <div className="inline-flex items-center gap-2 rounded-full border border-brand-gold/15 bg-brand-gold/5 px-4 py-2">
                        <HugeiconsIcon icon={Loader2} className="h-3 w-3 animate-spin text-brand-gold-700" />
                        <span className="text-xs font-semibold text-brand-gold-700">Preparing</span>
                    </div>
                </GlassCard>
            </div>
        )
    }

    return (
        <div className="max-w-3xl space-y-10 pb-20">
            {/* Header */}
            <header className="space-y-6">
                <div className="space-y-2">
                    <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-brand-gold-700">
                        Verification
                    </span>
                    <h2 className="font-serif text-3xl tracking-tight text-foreground md:text-4xl">
                        Verify your identity
                    </h2>
                    <p className="max-w-xl leading-relaxed text-muted-foreground">
                        Complete each step to confirm your identity and raise your transaction limits. Most reviews finish within 24 to 48 hours.
                    </p>
                </div>

                <GlassCard className="p-5 sm:p-6">
                    <div className="flex items-center justify-between gap-4">
                        <div>
                            <p className="text-sm font-semibold text-foreground">Verification progress</p>
                            <p className="mt-0.5 text-sm text-muted-foreground">
                                {stats.completed} of {stats.total} steps complete
                            </p>
                        </div>
                        <span className="font-serif text-2xl text-brand-gold-700">{stats.percent}%</span>
                    </div>
                    <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-muted">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${stats.percent}%` }}
                            transition={{ duration: 0.8, ease: "easeOut" }}
                            className="h-full rounded-full bg-brand-gold-700"
                        />
                    </div>
                </GlassCard>
            </header>

            {/* Email prerequisite — blocks the first step until email is verified */}
            <EmailPrerequisiteCard />

            {/* Limit insight */}
            <InsightWhisper insight={insightData.insight} />

            {/* Steps */}
            <div className="space-y-10">
                {allGroups.map((groupKey, groupIdx) => {
                    const meta = GROUP_META[groupKey]
                    const groupLevels = grouped[groupKey]
                    const GroupIcon = meta.Icon
                    const allVerified = groupLevels.every((l) => getStatus(l) === "verified")

                    return (
                        <motion.section
                            key={groupKey}
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: groupIdx * 0.12 }}
                            className="space-y-4"
                        >
                            <div className="flex items-center justify-between gap-4 border-b border-border pb-4">
                                <div className="flex items-center gap-3">
                                    <div className={cn(
                                        "flex h-10 w-10 items-center justify-center rounded-xl",
                                        allVerified ? "bg-emerald-600 text-white" : "bg-brand-deep text-brand-gold-300"
                                    )}>
                                        <HugeiconsIcon icon={GroupIcon} className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <h3 className="font-serif text-base text-foreground">{meta.label}</h3>
                                        <p className="text-xs text-muted-foreground">{meta.description}</p>
                                    </div>
                                </div>
                                {allVerified && (
                                    <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-wide text-emerald-600">
                                        <HugeiconsIcon icon={CheckCircle2} className="h-3 w-3" />
                                        All done
                                    </span>
                                )}
                            </div>

                            <div className="space-y-3">
                                {groupLevels.map((step, index) => {
                                    const status = getStatus(step)
                                    const prevStep = groupLevels[index - 1] ?? sortedLevels.find((l) => l.level === step.level - 1)
                                    const prevStatus = prevStep ? getStatus(prevStep) : "verified"
                                    // The first step is also locked until email is verified.
                                    const isLocked = (prevStatus !== "verified" && index > 0) || (!emailVerified && step.level === 1)

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
                                            onFileUrlChange={setFileUrl}
                                            regDocs={regDocs}
                                            onRegDocChange={(key, url) => setRegDocs((prev) => ({ ...prev, [key]: url }))}
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

            {/* Reassurance footer */}
            <GlassCard className="p-6 sm:p-7">
                <div className="flex items-start gap-4">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-brand-deep text-brand-gold-300">
                        <HugeiconsIcon icon={ShieldCheck} className="h-5 w-5" />
                    </div>
                    <div>
                        <h4 className="font-serif text-base text-foreground">Your information is protected</h4>
                        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                            {"Everything you submit is encrypted and used only to verify your account. If a step is declined, we'll tell you exactly what to fix so you can resubmit."}
                        </p>
                    </div>
                </div>
            </GlassCard>
        </div>
    )
}
