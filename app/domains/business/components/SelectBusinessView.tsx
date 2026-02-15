"use client"

import { useBusiness, type Business } from "@/app/components/BusinessProvider"
import { useAuth } from "@/app/components/providers/auth-provider"
import { useRouter, useSearchParams } from "next/navigation"
import { motion } from "framer-motion"
import { LayoutGrid, ArrowRight, LogOut } from "lucide-react"
import { cn } from "@/app/lib/utils"
import { GlassCard } from "@/app/components/ui/glass-card"
import { Button } from "@/app/components/ui/button"
import { Suspense } from "react"
import Image from "next/image"

function SelectBusinessContent() {
    const {
        businesses,
        setActiveBusiness,
        activeBusiness,
        isLoading
    } = useBusiness()
    const { logout } = useAuth()
    const router = useRouter()
    const searchParams = useSearchParams()
    const callbackUrl = searchParams.get('callbackUrl') || '/'

    const handleSelect = (business: Business) => {
        // Use 'Selected' wording on this page (handled by BusinessProvider's context awareness)
        setActiveBusiness(business)
        router.push(callbackUrl)
    }

    if (isLoading) return null

    return (
        <div className="min-h-screen bg-brand-cream dark:bg-brand-deep flex flex-col items-center justify-center p-6 sm:p-12 relative overflow-hidden">
            {/* Background Effects */}
            <div className="fixed inset-0 z-0 pointer-events-none opacity-40 dark:opacity-20">
                <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] rounded-full bg-brand-green/20 blur-3xl filter animate-pulse" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] rounded-full bg-brand-gold/20 blur-3xl filter animate-pulse" />
            </div>

            <div className="relative z-10 w-full max-w-2xl space-y-12">
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
                        Welcome back
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-brand-accent/60 dark:text-brand-cream/60 text-lg max-w-md mx-auto"
                    >
                        Select a business to continue to your dashboard.
                    </motion.p>
                </div>

                <div className="grid gap-6">
                    {businesses.length === 0 ? (
                        <GlassCard className="p-12 text-center space-y-6">
                            <div className="h-16 w-16 bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                <LayoutGrid className="h-8 w-8 text-brand-cream/20" />
                            </div>
                            <div className="space-y-2">
                                <h3 className="text-xl font-bold text-brand-cream">No businesses found</h3>
                                <p className="text-brand-cream/60">It looks like you haven't created any businesses yet.</p>
                            </div>
                            <Button
                                onClick={() => router.push('/onboarding')}
                                className="h-14 rounded-2xl px-12 bg-brand-gold text-brand-deep font-bold hover:scale-[1.02] active:scale-[0.98] transition-all"
                            >
                                Create your first Business
                            </Button>
                        </GlassCard>
                    ) : (
                        businesses.map((business: Business, index: number) => (
                            <motion.div
                                key={business.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.1 }}
                            >
                                <button
                                    onClick={() => handleSelect(business)}
                                    className="group cursor-pointer w-full block text-left outline-none"
                                >
                                    <GlassCard className={cn(
                                        "p-4 sm:p-6 flex items-center gap-4 sm:gap-6 transition-all duration-300 group-hover:bg-white/10 group-hover:scale-[1.01] active:scale-[0.99] border-white/5",
                                        activeBusiness?.id === business.id && "bg-white/10 border-brand-gold/30 ring-1 ring-brand-gold/10"
                                    )}>
                                        <div className="h-12 w-12 sm:h-16 sm:w-16 shrink-0 rounded-2xl sm:rounded-3xl bg-linear-to-br from-brand-gold/20 to-brand-gold/5 flex items-center justify-center text-brand-gold shadow-inner border border-white/5">
                                            <LayoutGrid className="h-6 w-6 sm:h-8 sm:w-8" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="text-base sm:text-xl font-bold text-brand-deep dark:text-brand-cream group-hover:text-brand-gold transition-colors truncate">
                                                {business.name}
                                            </h3>
                                            <p className="text-brand-accent/50 dark:text-brand-cream/40 font-medium uppercase tracking-widest text-[10px] mt-1 truncate">
                                                Managed Business • {business.currency}
                                            </p>
                                        </div>
                                        <div className="h-8 w-8 sm:h-12 sm:w-12 shrink-0 rounded-full border border-brand-gold/30 sm:border-white/10 dark:sm:border-transparent flex items-center justify-center text-brand-gold sm:text-brand-cream/20 dark:sm:text-transparent sm:group-hover:text-brand-gold sm:group-hover:border-brand-gold/30 transition-all">
                                            <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5" />
                                        </div>
                                    </GlassCard>
                                </button>
                            </motion.div>
                        ))
                    )}
                </div>

                <div className="flex justify-center pt-8">
                    <button
                        onClick={() => logout()}
                        className="flex items-center gap-2 text-sm font-bold text-red-500/60 dark:text-red-400 hover:text-red-500 transition-colors uppercase tracking-widest"
                    >
                        <LogOut className="h-4 w-4" />
                        Sign Out
                    </button>
                </div>
            </div>
        </div>
    )
}

export function SelectBusinessView() {
    return (
        <Suspense fallback={null}>
            <SelectBusinessContent />
        </Suspense>
    )
}
