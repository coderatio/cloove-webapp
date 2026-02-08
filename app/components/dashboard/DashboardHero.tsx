"use client"

import { motion } from "framer-motion"
import { TrendingUp, TrendingDown, Wallet, ShieldCheck, Lock, ChevronRight, Plus, Send, Copy } from "lucide-react"
import { cn } from "@/app/lib/utils"

// DashboardHero.tsx
interface DashboardHeroProps {
    sales: {
        value: string
        trend: string
        trendDirection: 'up' | 'down'
        label: string
    }
    wallet?: {
        balance: string
        isVerified: boolean
        label: string
    }
    className?: string
}

import { useState, useEffect } from "react"
import { AnimatePresence } from "framer-motion"
import { Button } from "@/app/components/ui/button"
import { VerificationModal } from "./VerificationModal"

export function DashboardHero({ sales, wallet, className }: DashboardHeroProps) {
    const [currentSlide, setCurrentSlide] = useState(0) // 0: Wallet, 1: Sales
    const [isVerificationOpen, setIsVerificationOpen] = useState(false)
    const [isWalletVerified, setIsWalletVerified] = useState(wallet?.isVerified || false)

    // Auto-slide every 8 seconds, paused when modal is open
    useEffect(() => {
        if (isVerificationOpen) return

        const timer = setInterval(() => {
            setCurrentSlide((prev) => (prev === 0 ? 1 : 0))
        }, 8000)
        return () => clearInterval(timer)
    }, [isVerificationOpen])

    const toggleSlide = () => setCurrentSlide((prev) => (prev === 0 ? 1 : 0))
    const handleVerifySuccess = () => {
        setIsWalletVerified(true)
        setIsVerificationOpen(false)
    }

    // Default mock wallet if not provided (safety)
    const walletData = {
        balance: isWalletVerified ? (wallet?.balance || "₦540,500") : "₦0.00",
        isVerified: isWalletVerified,
        label: "Wallet Balance"
    }

    return (
        <div className={cn("glass-panel rounded-[32px] p-8 md:px-12 md:py-16 text-center relative overflow-hidden group min-h-[480px] md:h-[520px] flex flex-col justify-center transition-[height] duration-500 ease-in-out", className)}>
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
                                    <h2 className="font-serif text-5xl md:text-7xl font-medium text-brand-deep dark:text-brand-cream tracking-tight mb-4">
                                        {walletData.balance}
                                    </h2>

                                    {/* Account Details */}
                                    <div className="mb-8 px-5 py-3 rounded-2xl bg-brand-deep/[0.03] dark:bg-white/[0.03] border border-brand-deep/5 dark:border-white/5 backdrop-blur-sm group/acc hover:border-brand-deep/10 dark:hover:border-white/10 transition-colors">
                                        <p className="text-[10px] uppercase tracking-[0.2em] text-brand-deep/40 dark:text-brand-cream/40 mb-1.5 font-bold">Virtual Account • Wema Bank</p>
                                        <div className="flex items-center justify-center gap-3">
                                            <p className="text-base font-mono font-bold text-brand-deep dark:text-brand-cream tracking-widest">
                                                0123456789
                                            </p>
                                            <button
                                                onClick={() => navigator.clipboard.writeText("0123456789")}
                                                className="p-1.5 rounded-lg hover:bg-brand-deep/5 dark:hover:bg-brand-cream/5 text-brand-deep/30 dark:text-brand-cream/30 hover:text-brand-deep/60 dark:hover:text-brand-cream/60 transition-all"
                                                title="Copy account number"
                                            >
                                                <Copy className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex items-center gap-4">
                                        <Button className="rounded-full bg-brand-deep dark:bg-brand-gold text-brand-gold dark:text-brand-deep h-11 px-8 shadow-lg shadow-brand-deep/10 dark:shadow-brand-gold/10 font-bold active:scale-95 transition-all hover:brightness-110">
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
                                        className="bg-brand-deep text-brand-gold hover:bg-brand-deep/90 dark:bg-brand-gold dark:text-brand-deep font-medium px-6 rounded-full shadow-lg hover:shadow-xl transition-all"
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
                            className="flex flex-col items-center w-full"
                        >
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
        </div>
    )
}
