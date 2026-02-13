"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { ShieldCheck, FileText, MapPin, Sparkles, Loader2, AlertCircle } from "lucide-react"
import { Button } from "@/app/components/ui/button"
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
} from "@/app/domains/business/hooks/useVerification"

// Sub-components
import { VerificationJourneyHeader } from "./verification/VerificationJourneyHeader"
import { VerificationStepCard } from "./verification/VerificationStepCard"
import { VerificationTypeEnum } from "../data/type"

const ICON_MAP: Record<string, any> = {
    'ShieldCheck': ShieldCheck,
    'FileText': FileText,
    'MapPin': MapPin,
    'Briefcase': Sparkles
}

export function VerificationSettings() {
    const { data: verificationData, error, isLoading: isFetching, refetch } = useVerifications()
    const { data: levels, isLoading: isLoadingLevels } = useVerificationLevels()
    const submitVerification = useSubmitVerification()

    const [activeLevel, setActiveLevel] = useState<string | null>(null)
    const [showHistory, setShowHistory] = useState<string | null>(null)
    const [bvn, setBvn] = useState('')
    const [address, setAddress] = useState('')
    const [file, setFile] = useState<File | null>(null)

    const handleVerification = async (levelId: number, type: VerificationTypeEnum) => {
        let payload: VerificationData = {}

        if (type === VerificationTypeEnum.BVN) {
            if (bvn.length !== 11) {
                toast.error('Invalid BVN Format', {
                    description: 'Your Bank Verification Number must be exactly 11 digits.'
                })
                return
            }
            payload = { bvn }
        } else if (type === VerificationTypeEnum.GOVT_ID) {
            if (!file) {
                toast.error('Identification Required', {
                    description: 'Please upload a clear image of your Government ID to proceed.'
                })
                return
            }
            // In a real scenario, we would upload the file to a CDN first
            // For now, we follow the pattern of the service expecting data
            payload = {
                fileName: file.name,
                fileType: file.type,
                fileSize: file.size,
                // Placeholder for document verification
                document_uri: URL.createObjectURL(file)
            }
        } else if (type === VerificationTypeEnum.ADDRESS) {
            if (address.length < 10) {
                toast.error('Address too short', {
                    description: 'Please provide a more detailed business address.'
                })
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
            setBvn('')
            setAddress('')
            setFile(null)
            toast.success('Verification Submitted', {
                description: `Your ${type} details have been received and are being processed.`
            })
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
        return verifications.find((v) => v.levelId === levelConfig.level)
    }

    const getStepStatus = (levelConfig: VerificationLevelConfig): "pending" | "verified" | "rejected" | "unverified" => {
        const verification = getVerification(levelConfig)
        if (!verification) return "unverified"
        return verification.status.toLowerCase() as "pending" | "verified" | "rejected" | "unverified"
    }

    return (
        <div className="relative space-y-12 pb-20">
            <VerificationJourneyHeader />

            <div className="relative isolate">
                {/* Background Track Layer */}
                <div className="absolute inset-0 pointer-events-none z-0">
                    <div className="relative h-full w-full">
                        <div
                            className="absolute top-8 bottom-8 w-[4px] bg-linear-to-b from-brand-gold via-brand-gold/20 to-transparent dark:from-brand-gold/60 dark:via-brand-gold/10 rounded-full hidden md:block"
                            style={{ left: '54px' }}
                        />
                        <div
                            className="absolute top-8 bottom-8 w-[2px] bg-linear-to-b from-brand-gold via-brand-gold/20 to-transparent rounded-full md:hidden left-1/2 -translate-x-1/2"
                        />
                    </div>
                </div>

                {/* Journey Component Loop */}
                <div className="relative z-10 space-y-20 md:space-y-12">
                    {sortedLevels.map((step, index) => {
                        const status = getStepStatus(step)
                        const isVerified = status === "verified"
                        const prevStep = sortedLevels[index - 1]
                        const isLocked = prevStep && getStepStatus(prevStep) !== "verified"
                        const Icon = step.icon && ICON_MAP[step.icon] ? ICON_MAP[step.icon] : ShieldCheck

                        return (
                            <div key={step.id} className="relative flex flex-col md:block">
                                {/* Journey Node Dot */}
                                <div className={cn(
                                    "absolute left-1/2 -translate-x-1/2 md:translate-x-0 md:left-9 top-0 md:top-6 w-[40px] h-[40px] rounded-full border-2 z-20 transition-all duration-700 flex items-center justify-center overflow-hidden",
                                    isVerified
                                        ? "bg-brand-gold border-brand-gold shadow-[0_0_25px_rgba(212,175,55,0.4)]"
                                        : isLocked
                                            ? "bg-brand-cream dark:bg-brand-deep border-brand-deep/10 dark:border-white/10"
                                            : "bg-brand-cream border-brand-gold dark:bg-brand-deep shadow-[0_4px_12px_rgba(0,0,0,0.1)]"
                                )}>
                                    {isVerified ? <ShieldCheck className="w-5 h-5 text-brand-deep" /> : (
                                        <span className={cn(
                                            "font-serif text-xl font-bold leading-none mt-[2px]",
                                            isLocked ? "text-brand-deep/20 dark:text-white/20" : "text-brand-gold"
                                        )}>
                                            {step.level}
                                        </span>
                                    )}
                                </div>

                                <div className="pt-14 md:pt-0 md:pl-28">
                                    <VerificationStepCard
                                        step={step}
                                        status={status}
                                        isActive={activeLevel === step.id}
                                        isLocked={isLocked}
                                        icon={Icon}
                                        onBegin={() => setActiveLevel(step.id)}
                                        onCancel={() => setActiveLevel(null)}
                                        onSubmit={handleVerification}
                                        bvn={bvn}
                                        onBvnChange={setBvn}
                                        address={address}
                                        onAddressChange={setAddress}
                                        onFileSelect={setFile}
                                        isPending={submitVerification.isPending}
                                        showHistory={showHistory === step.id}
                                        onToggleHistory={() => setShowHistory(showHistory === step.id ? null : step.id)}
                                        rejectionReason={getVerification(step)?.logs[0]?.rejectionReason}
                                        logs={getVerification(step)?.logs}
                                    />
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>

            {/* Support Footer */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-8 rounded-[32px] bg-brand-deep text-brand-cream overflow-hidden relative border border-transparent dark:bg-brand-deep-600 dark:border-brand-gold/20">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-brand-gold/10 blur-3xl rounded-full -mr-16 -mt-16" />
                    <ShieldCheck className="w-8 h-8 text-brand-gold mb-4" />
                    <h4 className="text-lg font-serif mb-2">Maximum Compliance</h4>
                    <p className="text-sm text-brand-cream/60 leading-relaxed">
                        Our verification protocols adhere to the highest international standards ensuring your business remains trusted and compliant in every jurisdiction.
                    </p>
                </div>
                <div className="p-8 rounded-[32px] bg-white/50 dark:bg-brand-deep/40 border border-brand-green/10 dark:border-brand-gold/20 backdrop-blur-sm">
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
