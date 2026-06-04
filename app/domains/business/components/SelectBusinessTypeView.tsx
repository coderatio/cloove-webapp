"use client"

import { useState, Suspense, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { toast } from "sonner"
import Image from "next/image"
import { HugeiconsIcon } from "@hugeicons/react"
import { Loading03Icon as Loader2, AlertCircleIcon as AlertCircle } from "@hugeicons/core-free-icons"
import { BusinessTypeSelector, type BusinessType } from "./BusinessTypeSelector"
import { Button } from "@/app/components/ui/button"
import { apiClient } from "@/app/lib/api-client"
import { useBusiness } from "@/app/components/BusinessProvider"

function SelectBusinessTypeContent() {
    const [businessType, setBusinessType] = useState<BusinessType | null>(null)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const { activeBusiness, isLoading, refreshBusinesses, role } = useBusiness()
    const router = useRouter()
    const searchParams = useSearchParams()
    const callbackUrl = searchParams.get('callbackUrl') || '/'

    useEffect(() => {
        if (isLoading) return
        if (activeBusiness?.businessType != null) {
            router.replace(callbackUrl)
        }
    }, [activeBusiness?.businessType, isLoading, callbackUrl, router])

    const handleSubmit = async () => {
        if (!businessType) return

        setIsSubmitting(true)
        try {
            await apiClient.patch('/settings/business-type', { businessType })
            await refreshBusinesses()
            toast.success('Business type saved')
            // Redirect is handled by the useEffect watching activeBusiness.businessType
        } catch {
            toast.error('Failed to save business type. Please try again.')
        } finally {
            setIsSubmitting(false)
        }
    }

    if (!isLoading && role !== 'OWNER') {
        return (
            <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-background p-6 text-center sm:p-10">
                <div className="relative z-10 w-full max-w-md">
                    <div className="space-y-6 rounded-[28px] border border-border bg-card p-6 shadow-sm sm:p-8">
                        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-red-500/10">
                            <HugeiconsIcon icon={AlertCircle} className="h-8 w-8 text-red-500" />
                        </div>
                        <h2 className="text-2xl font-semibold tracking-tight text-foreground">Setup incomplete</h2>
                        <p className="text-muted-foreground">
                            This business setup hasn&apos;t been completed yet. Please contact the business owner to finalize the configuration.
                        </p>
                        <Button
                            onClick={() => router.push('/')}
                            className="h-12 w-full rounded-2xl bg-primary font-semibold text-white hover:bg-primary/92 hover:text-white"
                        >
                            Back to Dashboard
                        </Button>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-background p-6 sm:p-10">
            <div className="relative z-10 flex w-full max-w-2xl flex-col items-center space-y-8">
                <div className="max-w-lg space-y-5 text-center">
                        <div className="relative mx-auto h-14 w-14 overflow-hidden rounded-2xl border border-border bg-primary p-3">
                            <Image
                                src="/images/logo-white.png"
                                alt="Cloove"
                                fill
                                className="object-contain p-3"
                            />
                        </div>

                    <div className="space-y-4">
                        <h1 className="text-3xl font-semibold leading-tight tracking-tight text-foreground sm:text-4xl">
                            Business identity
                        </h1>

                        <p className="text-base leading-relaxed text-muted-foreground">
                            Choose the business type that best matches your operation.
                        </p>
                    </div>
                </div>

                <div className="w-full">
                    <div className="rounded-[28px] border border-border bg-card p-5 shadow-sm sm:p-6">
                        <BusinessTypeSelector value={businessType} onChange={setBusinessType} />
                    </div>
                </div>

                <div className="flex flex-col items-center gap-4">
                    <Button
                        onClick={handleSubmit}
                        disabled={!businessType || isSubmitting}
                        className="h-12 rounded-2xl bg-primary px-10 text-base font-semibold text-white hover:bg-primary/92 hover:text-white disabled:cursor-not-allowed disabled:opacity-45"
                    >
                        {isSubmitting ? (
                            <div className="flex items-center gap-3">
                                <HugeiconsIcon icon={Loader2} className="w-5 h-5 animate-spin" />
                                <span className="tracking-wide">Saving...</span>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2">
                                <span className="tracking-wide text-lg">Continue</span>
                                <span>→</span>
                            </div>
                        )}
                    </Button>
                </div>
            </div>
        </div>
    )
}

export function SelectBusinessTypeView() {
    return (
        <Suspense fallback={null}>
            <SelectBusinessTypeContent />
        </Suspense>
    )
}
