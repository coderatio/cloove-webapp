"use client"

import { motion, AnimatePresence } from "framer-motion"
import { TrendingUp, TrendingDown, Wallet, Lock, Plus, Send } from "lucide-react"
import { cn } from "@/app/lib/utils"
import { useState, useEffect } from "react"
import { Button } from "@/app/components/ui/button"
import { VerificationModal } from "./VerificationModal"
import { GlassCard } from "../ui/glass-card"
import { AddMoneyModal } from "./AddMoneyModal"
import { Area, AreaChart, ResponsiveContainer } from "recharts"

interface DashboardHeroProps {
    sales: {
        value: string
        trend: string
        trendDirection: 'up' | 'down'
        label: string
        history?: { value: number }[] // Added for sparkline
    }
    wallet?: {
        balance: string
        isVerified: boolean
        label?: string
    }
    className?: string
}

export function DashboardHero({ sales, wallet, className }: DashboardHeroProps) {
    const [currentSlide, setCurrentSlide] = useState(0) // 0: Wallet, 1: Sales
    const [isVerificationOpen, setIsVerificationOpen] = useState(false)
    const [isAddMoneyOpen, setIsAddMoneyOpen] = useState(false)
    const [isWalletVerified, setIsWalletVerified] = useState(wallet?.isVerified || false)

    // Auto-slide every 8 seconds, paused when modal is open
    useEffect(() => {
        if (isVerificationOpen || isAddMoneyOpen) return

        const timer = setInterval(() => {
            setCurrentSlide((prev) => (prev === 0 ? 1 : 0))
        }, 8000)
        return () => clearInterval(timer)
    }, [isVerificationOpen, isAddMoneyOpen])

    const handleVerifySuccess = () => {
        setIsWalletVerified(true)
        setIsVerificationOpen(false)
    }

    const walletData = {
        balance: isWalletVerified ? (wallet?.balance || "₦540,500") : "₦0.00",
        isVerified: isWalletVerified,
        label: wallet?.label || "Wallet Balance"
    }

    // Default sparkline data if none provided
    const sparklineData = sales.history || [
        { value: 4000 }, { value: 3000 }, { value: 5000 },
        { value: 2780 }, { value: 1890 }, { value: 2390 }, { value: 3490 }
    ]

    return (
        <GlassCard className={cn("rounded-[32px] p-8 md:px-12 md:py-12 text-center relative overflow-hidden group min-h-[380px] md:h-[420px] flex flex-col justify-center transition-[height] duration-500 ease-in-out", className)}>
            <div className="absolute inset-0 bg-gradient-to-tr from-brand-gold/5 via-transparent to-brand-green/5 opacity-50 pointer-events-none" />

            <div className="relative z-10 w-full mb-8">
                <AnimatePresence mode="wait">
                    {currentSlide === 0 ? (
                        <motion.div
                            key="wallet"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.4, ease: "easeInOut" }}
                            className="flex flex-col items-center w-full"
                        >
                            <span className="text-sm md:text-base font-serif text-brand-accent/80 dark:text-brand-cream/80 tracking-widest uppercase mb-4 inline-flex items-center gap-2">
                                <Wallet className="w-4 h-4" />
                                {walletData.label}
                            </span>

                            {walletData.isVerified ? (
                                <div className="flex flex-col items-center w-full">
                                    <h2 className="font-serif text-5xl md:text-7xl font-medium text-brand-deep dark:text-brand-cream tracking-tight mb-4 select-all">
                                        {walletData.balance}
                                    </h2>

                                    {/* Actions */}
                                    <div className="flex items-center gap-4 mt-8">
                                        <Button
                                            onClick={() => setIsAddMoneyOpen(true)}
                                            className="rounded-full bg-brand-deep dark:bg-brand-gold text-brand-gold dark:text-brand-deep h-11 px-8 shadow-lg shadow-brand-deep/10 dark:shadow-brand-gold/10 font-bold active:scale-95 transition-all hover:bg-brand-deep/90 dark:hover:bg-brand-gold/90 dark:hover:text-brand-deep"
                                        >
                                            <Plus className="w-4 h-4 mr-2" /> Add Money
                                        </Button>
                                        <Button variant="outline" className="rounded-full border-brand-deep/10 dark:border-white/10 text-brand-deep/60 dark:text-brand-cream/60 hover:text-brand-deep dark:hover:text-brand-cream h-11 px-8 backdrop-blur-sm hover:bg-brand-deep/[0.03] dark:hover:bg-white/[0.03] active:scale-95 transition-all">
                                            <Send className="w-4 h-4 mr-2" /> Send
                                        </Button>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center w-full max-w-sm">
                                    <h2 className="font-serif text-5xl md:text-7xl font-medium text-brand-deep/20 dark:text-brand-cream/20 tracking-tight mb-6 select-none blur-sm">
                                        ₦***,***
                                    </h2>
                                    <Button
                                        onClick={() => setIsVerificationOpen(true)}
                                        className="bg-brand-deep text-brand-gold hover:bg-brand-deep/90 dark:bg-brand-gold dark:hover:bg-brand-gold/60 dark:text-brand-deep dark:hover:text-brand-deep font-medium px-6 rounded-full shadow-lg hover:shadow-xl transition-all"
                                    >
                                        <Lock className="w-4 h-4 mr-2" />
                                        Verify Identity
                                    </Button>
                                    <p className="mt-3 text-xs text-brand-deep/60 dark:text-brand-cream/60">
                                        Unlock your virtual account to see balance.
                                    </p>
                                </div>
                            )}
                        </motion.div>
                    ) : (
                        <motion.div
                            key="sales"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.4, ease: "easeInOut" }}
                            className="flex flex-col items-center w-full relative"
                        >
                            {/* Sparkline Background */}
                            <div className="absolute inset-0 -z-10 opacity-20 h-full w-full pointer-events-none scale-110 blur-sm">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={sparklineData}>
                                        <Area
                                            type="monotone"
                                            dataKey="value"
                                            stroke="#0b3d2e"
                                            fill="#0b3d2e"
                                            strokeWidth={4}
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>

                            <span className="text-sm md:text-base font-serif text-brand-accent/80 dark:text-brand-cream/80 tracking-widest uppercase mb-4">
                                {sales.label}
                            </span>

                            <h2 className="font-serif text-5xl md:text-7xl font-medium text-brand-deep dark:text-brand-cream tracking-tight mb-6">
                                {sales.value}
                            </h2>

                            <div className={cn(
                                "inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors",
                                sales.trendDirection === 'up'
                                    ? "bg-brand-green/10 dark:bg-brand-gold/10 text-brand-green dark:text-brand-gold"
                                    : "bg-danger/10 dark:bg-danger/10 text-danger dark:text-danger"
                            )}>
                                {sales.trendDirection === 'up' ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                                {sales.trend}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Slide Indicators */}
            <div className="absolute bottom-6 left-0 right-0 flex justify-center gap-2 z-20">
                {[0, 1].map((index) => (
                    <button
                        key={index}
                        onClick={() => setCurrentSlide(index)}
                        className={cn(
                            "w-2 h-2 rounded-full transition-all duration-300",
                            currentSlide === index
                                ? "bg-brand-deep dark:bg-brand-gold w-6"
                                : "bg-brand-deep/20 dark:bg-brand-cream/20 hover:bg-brand-deep/40 dark:hover:bg-brand-cream/40"
                        )}
                        aria-label={`Go to slide ${index + 1}`}
                    />
                ))}
            </div>

            <VerificationModal
                isOpen={isVerificationOpen}
                onOpenChange={setIsVerificationOpen}
                onComplete={handleVerifySuccess}
            />
            <AddMoneyModal
                isOpen={isAddMoneyOpen}
                onOpenChange={setIsAddMoneyOpen}
                walletData={walletData}
            />
        </GlassCard>
    )
}
