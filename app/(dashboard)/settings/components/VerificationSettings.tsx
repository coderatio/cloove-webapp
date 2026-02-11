"use client"

import { useState } from "react"
import useSWR, { mutate } from "swr"
import { GlassCard } from "@/app/components/ui/glass-card"
import { Button } from "@/app/components/ui/button"
import { Input } from "@/app/components/ui/input"
import { CheckCircle2, Circle, Upload, MapPin, ChevronRight, AlertCircle, Loader2 } from "lucide-react"
import { cn } from "@/app/lib/utils"
import { toast } from "sonner"
import { ErrorDisplay } from "@/app/components/shared/ErrorDisplay"

type VerificationLevel = 1 | 2 | 3
type VerificationStatus = "pending" | "verified" | "rejected" | "unverified"
type VerificationType = "BVN" | "GOVT_ID" | "ADDRESS"

interface VerificationStep {
    level: VerificationLevel
    type: VerificationType
    title: string
    description: string
    requirements: string[]
}

const STEPS_CONFIG: VerificationStep[] = [
    {
        level: 1,
        type: "BVN",
        title: "Basic Identity",
        description: "Verify your identity with your Bank Verification Number (BVN).",
        requirements: ["Bank Verification Number (BVN)", "Phone Number Verification"]
    },
    {
        level: 2,
        type: "GOVT_ID",
        title: "Government ID",
        description: "Upload a valid government-issued ID card.",
        requirements: ["International Passport", "Driver’s License", "National ID Card"]
    },
    {
        level: 3,
        type: "ADDRESS",
        title: "Business Address",
        description: "Verify your physical business address.",
        requirements: ["Utility Bill (Lawma, Electricity)", "Tenancy Agreement"]
    }
]

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export function VerificationSettings() {
    const { data, error, isLoading: isFetching } = useSWR('/api/verification', fetcher)
    const [activeLevel, setActiveLevel] = useState<VerificationLevel | null>(null)
    const [isSubmitting, setIsSubmitting] = useState(false)

    // Form States
    const [bvn, setBvn] = useState("")
    const [address, setAddress] = useState("")

    const handleVerification = async (level: VerificationLevel, type: VerificationType) => {
        setIsSubmitting(true)

        let payload = {}
        if (level === 1) {
            if (bvn.length !== 11) {
                toast.error("Please enter a valid 11-digit BVN")
                setIsSubmitting(false)
                return
            }
            payload = { bvn }
        } else if (level === 2) {
            // TODO: Handle file upload
            toast.info("Document upload coming soon")
            setIsSubmitting(false)
            return
        } else if (level === 3) {
            if (!address) {
                toast.error("Please enter your business address")
                setIsSubmitting(false)
                return
            }
            // TODO: Handle file upload for proof
            payload = { address }
        }

        try {
            const res = await fetch('/api/verification', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ level, type, data: payload }),
            })

            const result = await res.json()

            if (!res.ok) {
                throw new Error(result.error || "Verification failed")
            }

            toast.success(result.message || "Verification submitted successfully")
            mutate('/api/verification') // Refresh data
            setActiveLevel(null)
            setBvn("")
            setAddress("")
        } catch (err: any) {
            toast.error(err.message)
        } finally {
            setIsSubmitting(false)
        }
    }

    if (error) return (
        <ErrorDisplay
            title="Unable to load verification status"
            description="We encountered an issue while fetching your verification details. Please check your connection and try again."
            onRetry={() => mutate('/api/verification')}
        />
    )

    if (isFetching) return <div className="flex justify-center p-8"><Loader2 className="w-8 h-8 animate-spin text-brand-deep/20" /></div>

    const verifications = data?.verifications || []

    const getStepStatus = (step: VerificationStep): VerificationStatus => {
        const verification = verifications.find((v: any) => v.type === step.type)
        if (!verification) return "unverified"
        return verification.status.toLowerCase() as VerificationStatus
    }

    return (
        <div className="space-y-8">
            <div className="grid gap-6">
                {STEPS_CONFIG.map((step) => {
                    const status = getStepStatus(step)
                    const isVerified = status === "verified"
                    const isPending = status === "pending"

                    return (
                        <GlassCard
                            key={step.level}
                            className={cn(
                                "relative overflow-hidden transition-all duration-300",
                                isVerified ? "border-emerald-500/20 bg-emerald-500/5" : ""
                            )}
                        >
                            <div className="p-6 md:p-8">
                                <div className="flex items-start justify-between mb-6">
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-3">
                                            <span className={cn(
                                                "flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold",
                                                isVerified
                                                    ? "bg-emerald-500 text-white"
                                                    : "bg-brand-deep/10 dark:bg-white/10 text-brand-deep dark:text-brand-cream"
                                            )}>
                                                {step.level}
                                            </span>
                                            <h3 className="text-lg font-serif text-brand-deep dark:text-brand-cream">
                                                {step.title}
                                            </h3>
                                        </div>
                                        <p className="text-sm text-brand-deep/60 dark:text-brand-cream/60 pl-9">
                                            {step.description}
                                        </p>
                                    </div>
                                    <div className={cn(
                                        "px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1.5",
                                        isVerified
                                            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                                            : isPending
                                                ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                                                : "bg-brand-deep/5 dark:bg-white/5 text-brand-deep/40 dark:text-white/40"
                                    )}>
                                        {isVerified ? (
                                            <><CheckCircle2 className="w-3.5 h-3.5" /> Verified</>
                                        ) : isPending ? (
                                            <><Circle className="w-3.5 h-3.5 animate-pulse" /> Pending</>
                                        ) : (
                                            "Unverified"
                                        )}
                                    </div>
                                </div>

                                {/* Requirements List */}
                                <div className="pl-9 mb-8">
                                    <ul className="space-y-2">
                                        {step.requirements.map((req, i) => (
                                            <li key={i} className="flex items-center gap-2 text-xs text-brand-deep/50 dark:text-brand-cream/50">
                                                <div className="w-1 h-1 rounded-full bg-current opacity-50" />
                                                {req}
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                {/* Action Area */}
                                <div className="pl-9">
                                    {status === "unverified" && (
                                        activeLevel === step.level ? (
                                            <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                                                {step.level === 1 && (
                                                    <div className="space-y-4">
                                                        <div className="space-y-2">
                                                            <label className="text-xs font-bold uppercase tracking-widest text-brand-accent/60 dark:text-white/60">Enter BVN</label>
                                                            <Input
                                                                value={bvn}
                                                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setBvn(e.target.value)}
                                                                placeholder="12345678901"
                                                                maxLength={11}
                                                                className="h-12 bg-white/50 dark:bg-white/5 border-transparent"
                                                            />
                                                        </div>
                                                    </div>
                                                )}

                                                {step.level === 2 && (
                                                    <div className="border-2 border-dashed border-brand-deep/10 dark:border-white/10 rounded-xl p-8 text-center hover:bg-brand-deep/5 dark:hover:bg-white/5 transition-colors cursor-pointer group">
                                                        <Upload className="w-8 h-8 mx-auto mb-3 text-brand-deep/30 dark:text-white/30 group-hover:scale-110 transition-transform" />
                                                        <p className="text-sm font-medium text-brand-deep dark:text-brand-cream">Click to upload document</p>
                                                        <p className="text-xs text-brand-deep/40 dark:text-white/40 mt-1">JPG, PNG or PDF (Max 5MB)</p>
                                                    </div>
                                                )}

                                                {step.level === 3 && (
                                                    <div className="space-y-4">
                                                        <div className="space-y-2">
                                                            <label className="text-xs font-bold uppercase tracking-widest text-brand-accent/60 dark:text-white/60">Business Address</label>
                                                            <div className="relative">
                                                                <MapPin className="absolute left-3 top-3.5 w-4 h-4 text-brand-deep/30 dark:text-white/30" />
                                                                <Input
                                                                    value={address}
                                                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAddress(e.target.value)}
                                                                    placeholder="123 Main Street, Lagos"
                                                                    className="pl-9 h-12 bg-white/50 dark:bg-white/5 border-transparent"
                                                                />
                                                            </div>
                                                        </div>
                                                        <div className="border-2 border-dashed border-brand-deep/10 dark:border-white/10 rounded-xl p-4 text-center cursor-pointer hover:bg-brand-deep/5 dark:hover:bg-white/5 transition-colors flex items-center justify-center gap-3">
                                                            <Upload className="w-4 h-4 text-brand-deep/30 dark:text-white/30" />
                                                            <span className="text-xs font-medium text-brand-deep/60 dark:text-white/60">Upload Proof of Address</span>
                                                        </div>
                                                    </div>
                                                )}

                                                <div className="flex items-center gap-3 pt-2">
                                                    <Button
                                                        onClick={() => handleVerification(step.level, step.type)}
                                                        disabled={isSubmitting}
                                                        className="bg-brand-deep text-brand-gold dark:bg-brand-gold dark:text-brand-deep"
                                                    >
                                                        {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                                        {isSubmitting ? "Verifying..." : "Submit Verification"}
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        onClick={() => setActiveLevel(null)}
                                                        className="hover:bg-red-500/10 hover:text-red-500"
                                                    >
                                                        Cancel
                                                    </Button>
                                                </div>
                                            </div>
                                        ) : (
                                            <Button
                                                onClick={() => setActiveLevel(step.level)}
                                                variant="outline"
                                                className="group border-brand-deep/10 dark:border-white/10 hover:bg-brand-deep/5 dark:hover:bg-white/5"
                                            >
                                                Start Verification
                                                <ChevronRight className="w-4 h-4 ml-2 opacity-50 group-hover:translate-x-1 transition-transform" />
                                            </Button>
                                        )
                                    )}
                                </div>
                            </div>
                        </GlassCard>
                    )
                })}
            </div>

            {/* Help Card */}
            <div className="bg-blue-500/5 border border-blue-500/10 rounded-2xl p-6 flex items-start gap-4">
                <AlertCircle className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                <div className="space-y-1">
                    <h4 className="font-bold text-sm text-blue-600 dark:text-blue-400">Why verification matters?</h4>
                    <p className="text-xs leading-relaxed text-blue-600/80 dark:text-blue-400/80">
                        Verifying your business unlocks higher transaction limits, access to loans, and builds trust with your customers.
                        Level 2 verification is required for international payments.
                    </p>
                </div>
            </div>
        </div>
    )
}
