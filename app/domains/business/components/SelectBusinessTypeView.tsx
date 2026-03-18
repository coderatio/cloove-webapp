"use client"

import { useState, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { motion } from "framer-motion"
import { toast } from "sonner"
import Image from "next/image"
import { Loader2 } from "lucide-react"
import { BusinessTypeSelector, type BusinessType } from "./BusinessTypeSelector"
import { Button } from "@/app/components/ui/button"
import { apiClient } from "@/app/lib/api-client"
import { useBusiness } from "@/app/components/BusinessProvider"

function SelectBusinessTypeContent() {
    const [businessType, setBusinessType] = useState<BusinessType | null>(null)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const { refreshBusinesses } = useBusiness()
    const router = useRouter()
    const searchParams = useSearchParams()
    const callbackUrl = searchParams.get('callbackUrl') || '/'

    const handleSubmit = async () => {
        if (!businessType) return

        setIsSubmitting(true)
        try {
            await apiClient.patch('/settings/business-type', { businessType })
            await refreshBusinesses()
            toast.success('Business type saved')
            router.replace(callbackUrl)
        } catch {
            toast.error('Failed to save business type. Please try again.')
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <div className="min-h-screen bg-brand-cream dark:bg-background flex flex-col items-center justify-center p-6 sm:p-12 relative overflow-hidden">
            <div className="fixed inset-0 z-0 pointer-events-none opacity-40 dark:opacity-20">
                <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] rounded-full bg-brand-green/20 blur-3xl filter animate-pulse" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] rounded-full bg-brand-gold/20 blur-3xl filter animate-pulse" />
            </div>

            <div className="relative z-10 w-full max-w-2xl space-y-10">
                <div className="text-center space-y-4">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="relative h-20 w-20 bg-brand-green rounded-[2.5rem] p-4 mx-auto shadow-2xl shadow-brand-green/20 mb-8 overflow-hidden"
                    >
                        <Image
                            src="/images/logo-white.png"
                            alt="Cloove"
                            fill
                            className="object-contain p-4"
                        />
                    </motion.div>

                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="font-serif text-4xl sm:text-5xl text-brand-deep dark:text-brand-cream tracking-tight"
                    >
                        One quick step
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-brand-accent/60 dark:text-brand-cream/60 text-lg max-w-md mx-auto"
                    >
                        Tell us what kind of business this is. This helps us show the right verification requirements.
                    </motion.p>
                </div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                >
                    <BusinessTypeSelector value={businessType} onChange={setBusinessType} />
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="flex justify-center"
                >
                    <Button
                        onClick={handleSubmit}
                        disabled={!businessType || isSubmitting}
                        className="h-14 rounded-2xl px-12 bg-brand-deep text-brand-gold hover:bg-brand-deep/90 dark:bg-brand-gold dark:text-brand-deep dark:hover:bg-brand-gold/90 font-bold text-base shadow-xl disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Saving...
                            </>
                        ) : (
                            'Continue'
                        )}
                    </Button>
                </motion.div>
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
