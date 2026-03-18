"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
    ShieldCheck, FileText, MapPin, Briefcase, Home, Loader2, AlertCircle,
    ChevronDown, User, Building2, Lock,
} from "lucide-react"
import { Button } from "@/app/components/ui/button"
import { cn } from "@/app/lib/utils"
import { toast } from "sonner"
import { ErrorDisplay } from "@/app/components/shared/ErrorDisplay"
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

const ICON_MAP: Record<string, any> = {
    ShieldCheck, FileText, MapPin, Briefcase, Home,
}

const GROUP_META: Record<VerificationGroupEnum, { label: string; Icon: any; description: string }> = {
    [VerificationGroupEnum.OWNER]: {
        label: "Owner",
        Icon: User,
        description: "Verify the identity of the business owner or director",
    },
    [VerificationGroupEnum.BUSINESS]: {
        label: "Business",
        Icon: Building2,
        description: "Verify your business entity and legal standing",
    },
}

type VerifStatus = "pending" | "verified" | "rejected" | "unverified"

function StatusBadge({ status, isLocked }: { status: VerifStatus; isLocked?: boolean }) {
    const map: Record<VerifStatus, { label: string; className: string }> = {
        verified: { label: "Verified", className: "bg-emerald-500/10 border-emerald-500/20 text-emerald-600" },
        pending: { label: "Reviewing", className: "bg-brand-gold/10 border-brand-gold/30 text-brand-gold animate-pulse" },
        rejected: { label: "Rejected", className: "bg-red-500/10 border-red-500/20 text-red-500" },
        unverified: { label: isLocked ? "Locked" : "Ready", className: isLocked ? "bg-brand-deep/5 border-transparent text-brand-deep/20 dark:text-white/20" : "bg-brand-gold/5 border-brand-gold/20 text-brand-gold" },
    }
    const { label, className } = map[status]
    return (
        <span className={cn("px-3 py-1 rounded-xl text-[9px] font-bold uppercase tracking-widest border shrink-0", className)}>
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
    // form state passed down
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
        <div className={cn(
            "rounded-2xl border transition-colors duration-300",
            isVerified
                ? "border-emerald-500/20 bg-emerald-500/5 dark:bg-emerald-500/5"
                : isOpen
                    ? "border-brand-gold/30 bg-white dark:bg-brand-deep/80"
                    : "border-brand-deep/10 dark:border-white/10 bg-white/60 dark:bg-brand-deep/40",
            isLocked && "opacity-60"
        )}>
            {/* Header */}
            <button
                onClick={onToggle}
                disabled={isLocked}
                className="w-full flex items-center gap-4 p-4 md:p-5 text-left"
            >
                {/* Icon bubble */}
                <div className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
                    isVerified ? "bg-emerald-500/15 text-emerald-600" : "bg-brand-gold/10 text-brand-gold"
                )}>
                    {isLocked ? <Lock className="w-4 h-4 text-brand-deep/30 dark:text-white/20" /> : <Icon className="w-4 h-4" />}
                </div>

                {/* Name + required tag */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-semibold text-brand-deep dark:text-brand-cream truncate">
                            {step.name}
                        </span>
                        <span className={cn(
                            "text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full shrink-0",
                            step.isRequired
                                ? "bg-brand-deep/10 dark:bg-white/10 text-brand-deep/60 dark:text-white/50"
                                : "bg-brand-deep/5 dark:bg-white/5 text-brand-deep/30 dark:text-white/30"
                        )}>
                            {step.isRequired ? "Required" : "Optional"}
                        </span>
                    </div>
                    <p className="text-xs text-brand-deep/50 dark:text-brand-cream/50 mt-0.5 line-clamp-1">
                        {step.description}
                    </p>
                </div>

                {/* Status + chevron */}
                <div className="flex items-center gap-3 shrink-0">
                    <StatusBadge status={status} isLocked={isLocked} />
                    {!isLocked && (
                        <ChevronDown className={cn(
                            "w-4 h-4 text-brand-deep/30 dark:text-white/30 transition-transform duration-300",
                            isOpen && "rotate-180"
                        )} />
                    )}
                </div>
            </button>

            {/* Body */}
            <AnimatePresence initial={false}>
                {isOpen && !isLocked && (
                    <motion.div
                        key="body"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25, ease: "easeInOut" }}
                        className="overflow-hidden"
                    >
                        <div className="px-4 md:px-5 pb-5 space-y-5 border-t border-brand-deep/5 dark:border-white/5 pt-4">
                            {/* Requirements */}
                            <div className="flex flex-wrap gap-2">
                                {step.requirements.map((req, i) => (
                                    <span key={i} className="flex items-center gap-1.5 text-[11px] text-brand-deep/50 dark:text-brand-cream/50 bg-brand-deep/5 dark:bg-white/5 px-3 py-1 rounded-full">
                                        <span className="w-1 h-1 rounded-full bg-brand-gold/60 shrink-0" />
                                        {req}
                                    </span>
                                ))}
                            </div>

                            {/* Rejection notice + audit trail */}
                            {isRejected && (
                                <VerificationAuditTrail
                                    logs={logs}
                                    showHistory={showHistory}
                                    onToggleHistory={() => setShowHistory((p) => !p)}
                                    rejectionReason={logs[0]?.rejectionReason}
                                />
                            )}

                            {/* Form */}
                            {canAct && (
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
                            )}

                            {/* Pending info */}
                            {status === "pending" && (
                                <p className="text-xs text-brand-gold/80 bg-brand-gold/5 border border-brand-gold/15 rounded-xl px-4 py-3 leading-relaxed">
                                    Your submission is under review. We'll notify you once it's processed.
                                </p>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}

export function VerificationSettings() {
    const { data: verificationData, error, isLoading: isFetching, refetch } = useVerifications()
    const { data: levels, isLoading: isLoadingLevels } = useVerificationLevels()
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
            <p className="text-sm font-medium text-brand-deep/40 dark:text-brand-cream/40 animate-pulse">
                Synchronizing Security Status...
            </p>
        </div>
    )

    const verifications = verificationData?.verifications ?? []
    const sortedLevels = levels ? [...levels].sort((a, b) => a.level - b.level) : []

    const getVerification = (step: VerificationLevelConfig) =>
        verifications.find((v) => v.levelId === step.level)

    const getStatus = (step: VerificationLevelConfig): VerifStatus => {
        const v = getVerification(step)
        if (!v) return "unverified"
        return v.status.toLowerCase() as VerifStatus
    }

    // Group levels: OWNER first, then BUSINESS, then ungrouped fallback
    const groupOrder = [VerificationGroupEnum.OWNER, VerificationGroupEnum.BUSINESS]
    const grouped = groupOrder.reduce<Record<VerificationGroupEnum, VerificationLevelConfig[]>>((acc, g) => {
        acc[g] = sortedLevels.filter((l) => l.group === g)
        return acc
    }, {} as Record<VerificationGroupEnum, VerificationLevelConfig[]>)
    // Include any levels with unexpected/null group under a fallback so nothing is lost
    const ungrouped = sortedLevels.filter((l) => !l.group || !groupOrder.includes(l.group))

    const allGroups = groupOrder.filter((g) => grouped[g]?.length > 0)

    if (allGroups.length === 0 && ungrouped.length === 0) {
        return (
            <div className="space-y-10 pb-20">
                <div>
                    <h2 className="text-2xl font-serif text-brand-deep dark:text-brand-cream">Verification</h2>
                    <p className="text-sm text-brand-deep/50 dark:text-brand-cream/50 mt-1">
                        Complete the steps below to unlock higher transaction limits and full platform access.
                    </p>
                </div>

                <div className="relative rounded-3xl border border-brand-deep/10 dark:border-white/10 bg-white/60 dark:bg-brand-deep/40 overflow-hidden">
                    {/* Decorative background */}
                    <div className="absolute inset-0 pointer-events-none">
                        <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full bg-brand-gold/5 blur-3xl" />
                        <div className="absolute -bottom-16 -left-16 w-64 h-64 rounded-full bg-brand-gold/5 blur-3xl" />
                    </div>

                    <div className="relative flex flex-col items-center text-center px-8 py-20 gap-6">
                        {/* Icon stack */}
                        <div className="relative w-20 h-20">
                            <div className="absolute inset-0 rounded-2xl bg-brand-gold/10 rotate-6" />
                            <div className="absolute inset-0 rounded-2xl bg-brand-gold/10 -rotate-3" />
                            <div className="relative w-full h-full rounded-2xl bg-brand-deep dark:bg-brand-gold/20 flex items-center justify-center">
                                <ShieldCheck className="w-9 h-9 text-brand-gold" />
                            </div>
                        </div>

                        <div className="space-y-2 max-w-sm">
                            <h3 className="text-xl font-serif text-brand-deep dark:text-brand-cream">
                                No Verification Steps Yet
                            </h3>
                            <p className="text-sm text-brand-deep/50 dark:text-brand-cream/50 leading-relaxed">
                                Verification requirements for your account are being configured. Check back shortly — this usually takes just a moment.
                            </p>
                        </div>

                        <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-brand-gold/10 border border-brand-gold/20">
                            <div className="w-1.5 h-1.5 rounded-full bg-brand-gold animate-pulse" />
                            <span className="text-[11px] font-bold uppercase tracking-widest text-brand-gold">
                                Configuration in progress
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-10 pb-20">
            {/* Page header */}
            <div>
                <h2 className="text-2xl font-serif text-brand-deep dark:text-brand-cream">Verification</h2>
                <p className="text-sm text-brand-deep/50 dark:text-brand-cream/50 mt-1">
                    Complete the steps below to unlock higher transaction limits and full platform access.
                </p>
            </div>

            {/* Groups */}
            {allGroups.map((groupKey) => {
                const meta = GROUP_META[groupKey]
                const groupLevels = grouped[groupKey]
                const GroupIcon = meta.Icon

                // Determine overall group completion for the header badge
                const allVerified = groupLevels.every((l) => getStatus(l) === "verified")
                const someVerified = groupLevels.some((l) => getStatus(l) === "verified")

                return (
                    <section key={groupKey} className="space-y-3">
                        {/* Group header */}
                        <div className="flex items-center gap-3 pb-1">
                            <div className={cn(
                                "w-8 h-8 rounded-xl flex items-center justify-center",
                                allVerified ? "bg-emerald-500/15 text-emerald-600" : "bg-brand-gold/10 text-brand-gold"
                            )}>
                                <GroupIcon className="w-4 h-4" />
                            </div>
                            <div>
                                <h3 className="text-sm font-bold uppercase tracking-widest text-brand-deep dark:text-brand-cream">
                                    {meta.label}
                                </h3>
                                <p className="text-xs text-brand-deep/40 dark:text-brand-cream/40">{meta.description}</p>
                            </div>
                            {allVerified && (
                                <span className="ml-auto text-[9px] font-bold uppercase tracking-widest px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600">
                                    Complete
                                </span>
                            )}
                        </div>

                        {/* Accordion items */}
                        <div className="space-y-2">
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
                    </section>
                )
            })}

            {/* Ungrouped fallback */}
            {ungrouped.length > 0 && (
                <section className="space-y-2">
                    {ungrouped.map((step) => {
                        const status = getStatus(step)
                        return (
                            <AccordionItem
                                key={step.id}
                                step={step}
                                status={status}
                                isLocked={false}
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
                </section>
            )}

            {/* Footer */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-6 rounded-2xl bg-brand-deep text-brand-cream relative overflow-hidden border border-transparent dark:bg-brand-deep-600 dark:border-brand-gold/20">
                    <div className="absolute top-0 right-0 w-28 h-28 bg-brand-gold/10 blur-3xl rounded-full -mr-12 -mt-12" />
                    <ShieldCheck className="w-6 h-6 text-brand-gold mb-3" />
                    <h4 className="text-sm font-serif mb-1">Maximum Compliance</h4>
                    <p className="text-xs text-brand-cream/60 leading-relaxed">
                        Our verification protocols adhere to the highest international standards ensuring your business remains trusted and compliant.
                    </p>
                </div>
                <div className="p-6 rounded-2xl bg-white/50 dark:bg-brand-deep/40 border border-brand-green/10 dark:border-brand-gold/20 backdrop-blur-sm">
                    <AlertCircle className="w-6 h-6 text-brand-gold mb-3" />
                    <h4 className="text-sm font-serif mb-1 text-brand-deep dark:text-brand-cream">Need Assistance?</h4>
                    <p className="text-xs text-brand-deep/60 dark:text-brand-cream/60 leading-relaxed mb-4">
                        Having trouble with your documents? Our compliance specialists are available 24/7.
                    </p>
                    <Button variant="outline" className="rounded-xl border-brand-gold/30 text-brand-gold hover:bg-brand-gold/5 h-9 text-xs">
                        Speak with Support
                    </Button>
                </div>
            </div>
        </div>
    )
}
