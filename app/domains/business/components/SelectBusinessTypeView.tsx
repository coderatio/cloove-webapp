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
        <div className="min-h-screen bg-brand-cream dark:bg-brand-deep flex flex-col items-center justify-center p-6 sm:p-12 relative overflow-hidden">
            {/* Academic Luxury Background */}
            <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
                {/* Texture Overlay */}
                <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05] bg-[url('/images/noise.png')] mix-blend-overlay" />

                {/* Subtle Grid */}
                <div className="absolute inset-0 opacity-[0.05] dark:opacity-[0.1]"
                    style={{ backgroundImage: 'radial-gradient(var(--brand-gold) 0.5px, transparent 0.5px)', backgroundSize: '32px 32px' }} />

                {/* Ambient Intelligence Blobs */}
                <motion.div
                    animate={{
                        scale: [1, 1.2, 1],
                        x: [0, 50, 0],
                        y: [0, -30, 0]
                    }}
                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                    className="absolute top-[-10%] left-[-10%] w-[70%] h-[70%] rounded-full bg-brand-green/20 blur-[120px] filter"
                />
                <motion.div
                    animate={{
                        scale: [1, 1.1, 1],
                        x: [0, -40, 0],
                        y: [0, 60, 0]
                    }}
                    transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
                    className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] rounded-full bg-brand-gold/15 blur-[100px] filter"
                />
            </div>

            <div className="relative z-10 w-full max-w-2xl flex flex-col items-center space-y-12">
                <div className="text-center space-y-8 max-w-lg">
                    {/* Perspective Logo */}
                    <motion.div
                        initial={{ opacity: 0, y: -20, rotateX: 30 }}
                        animate={{ opacity: 1, y: 0, rotateX: 0 }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                        className="relative group cursor-default"
                    >
                        <div className="absolute inset-0 bg-brand-gold/20 blur-2xl rounded-full scale-50 group-hover:scale-100 transition-transform duration-700" />
                        <div className="relative h-16 w-16 bg-brand-green rounded-2xl p-3 mx-auto shadow-2xl shadow-brand-green/30 overflow-hidden ring-1 ring-white/10">
                            <Image
                                src="/images/logo-white.png"
                                alt="Cloove"
                                fill
                                className="object-contain p-3"
                            />
                        </div>
                    </motion.div>

                    <div className="space-y-4">
                        <motion.h1
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="font-serif text-5xl sm:text-6xl text-brand-deep dark:text-brand-cream tracking-tight leading-tight"
                        >
                            Business <span className="text-brand-deep/40 dark:text-brand-cream/30">Identity</span>
                        </motion.h1>

                        <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4 }}
                            className="text-brand-accent/70 dark:text-brand-cream/60 text-lg leading-relaxed font-sans"
                        >
                            To provide an experience tailored to your unique journey, we first need to understand the scale of your operation.
                        </motion.p>
                    </div>
                </div>

                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5, duration: 0.6 }}
                    className="w-full"
                >
                    <div className="bg-white/40 dark:bg-white/[0.03] backdrop-blur-xl border border-white/20 dark:border-white/10 rounded-[2.5rem] p-8 sm:p-10 shadow-2xl shadow-brand-deep/5">
                        <BusinessTypeSelector value={businessType} onChange={setBusinessType} />
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.7 }}
                    className="flex flex-col items-center gap-6"
                >
                    <Button
                        onClick={handleSubmit}
                        disabled={!businessType || isSubmitting}
                        className="h-16 rounded-[2rem] px-16 bg-brand-deep text-brand-gold hover:bg-brand-deep/95 hover:scale-[1.02] active:scale-[0.98] dark:bg-brand-gold dark:text-brand-deep dark:hover:bg-brand-gold/90 font-bold text-base shadow-2xl shadow-brand-deep/20 dark:shadow-brand-gold/10 transition-all duration-300 disabled:opacity-30 disabled:grayscale disabled:cursor-not-allowed group"
                    >
                        {isSubmitting ? (
                            <div className="flex items-center gap-3">
                                <Loader2 className="w-5 h-5 animate-spin" />
                                <span className="tracking-wide">Saving...</span>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2">
                                <span className="tracking-wide text-lg">Continue</span>
                                <motion.span
                                    animate={{ x: [0, 5, 0] }}
                                    transition={{ duration: 1.5, repeat: Infinity }}
                                >
                                    →
                                </motion.span>
                            </div>
                        )}
                    </Button>

                    {/* <p className="text-[10px] uppercase tracking-[0.2em] text-brand-accent/40 dark:text-brand-cream/30 font-bold">
                        Secure Encryption Active
                    </p> */}
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
