"use client"

import { motion, AnimatePresence, useMotionValue, useTransform, useSpring } from "framer-motion"
import { TrendingUp, TrendingDown, Wallet, Lock, Plus, Send, Sparkles } from "lucide-react"
import { cn } from "@/app/lib/utils"
import { useState, useEffect, useRef } from "react"
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
        history?: { value: number }[]
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

    // Tilt Effect Refs/Values
    const cardRef = useRef<HTMLDivElement>(null)
    const x = useMotionValue(0)
    const y = useMotionValue(0)

    const mouseXSpring = useSpring(x)
    const mouseYSpring = useSpring(y)

    const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["7deg", "-7deg"])
    const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-7deg", "7deg"])

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!cardRef.current) return
        const rect = cardRef.current.getBoundingClientRect()
        const width = rect.width
        const height = rect.height
        const mouseX = e.clientX - rect.left
        const mouseY = e.clientY - rect.top
        const xPct = mouseX / width - 0.5
        const yPct = mouseY / height - 0.5
        x.set(xPct)
        y.set(yPct)
    }

    const handleMouseLeave = () => {
        x.set(0)
        y.set(0)
    }

    // Auto-slide every 10 seconds
    useEffect(() => {
        if (isVerificationOpen || isAddMoneyOpen) return
        const timer = setInterval(() => {
            setCurrentSlide((prev) => (prev === 0 ? 1 : 0))
        }, 10000)
        return () => clearInterval(timer)
    }, [isVerificationOpen, isAddMoneyOpen])

    const handleVerifySuccess = () => {
        setIsWalletVerified(true)
        setIsVerificationOpen(false)
    }

    const walletData = {
        balance: isWalletVerified ? (wallet?.balance || "₦1,250,500") : "₦0.00",
        isVerified: isWalletVerified,
        label: wallet?.label || "Wallet Balance"
    }

    const sparklineData = sales.history || [
        { value: 4000 }, { value: 3000 }, { value: 5000 },
        { value: 2780 }, { value: 1890 }, { value: 2390 }, { value: 3490 }
    ]

    return (
        <motion.div
            ref={cardRef}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            style={{
                rotateX,
                rotateY,
                transformStyle: "preserve-3d",
            }}
            className="perspective-1000"
        >
            <GlassCard className={cn(
                "rounded-[32px] md:rounded-[40px] p-6 md:px-16 md:py-16 text-center relative overflow-hidden group min-h-[340px] md:min-h-[400px] md:h-[440px] flex flex-col justify-center transition-all duration-700 ease-in-out border-white/20 dark:border-white/5",
                className
            )}>
                {/* 1. Animated Mesh Gradients */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
                    <motion.div
                        animate={{
                            x: [0, 40, 0],
                            y: [0, -30, 0],
                            scale: [1, 1.2, 1],
                        }}
                        transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
                        className="absolute -top-1/4 -right-1/4 w-[80%] h-[80%] rounded-full bg-brand-gold/10 dark:bg-brand-gold/5 blur-[100px]"
                    />
                    <motion.div
                        animate={{
                            x: [0, -50, 0],
                            y: [0, 40, 0],
                            scale: [1.1, 0.9, 1.1],
                        }}
                        transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
                        className="absolute -bottom-1/4 -left-1/4 w-[70%] h-[70%] rounded-full bg-brand-green/15 dark:bg-brand-green/10 blur-[100px]"
                    />
                    {/* Dark Mode Specific depth */}
                    <div className="absolute inset-0 bg-brand-deep/5 dark:bg-black/20" />
                </div>

                {/* 2. Noise Overlay */}
                <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05] pointer-events-none mix-blend-overlay z-1 bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />

                {/* 3. Shine Effect (Holographic) */}
                <motion.div
                    animate={{ x: ["-100%", "200%"] }}
                    transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", repeatDelay: 2 }}
                    className="absolute inset-0 w-1/2 h-full bg-gradient-to-r from-transparent via-white/10 dark:via-white/5 to-transparent skew-x-[-20deg] pointer-events-none z-2"
                />

                <div className="relative z-10 w-full mb-8" style={{ transform: "translateZ(50px)" }}>
                    <AnimatePresence mode="wait">
                        {currentSlide === 0 ? (
                            <motion.div
                                key="wallet"
                                initial={{ opacity: 0, scale: 0.95, y: 10, rotateX: -10 }}
                                animate={{ opacity: 1, scale: 1, y: 0, rotateX: 0 }}
                                exit={{ opacity: 0, scale: 1.05, y: -10, rotateX: 10 }}
                                transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                                className="flex flex-col items-center w-full"
                            >
                                <span className="text-[10px] md:text-sm font-bold tracking-[0.2em] uppercase text-brand-accent/40 dark:text-brand-cream/40 mb-4 md:mb-6 flex items-center justify-center gap-2">
                                    <Wallet className="w-3 md:w-3.5 h-3 md:h-3.5" />
                                    {walletData.label}
                                </span>

                                {walletData.isVerified ? (
                                    <div className="flex flex-col items-center w-full">
                                        <h2 className="font-serif text-3xl sm:text-4xl md:text-8xl font-medium text-brand-deep dark:text-brand-cream tracking-tighter mb-2 md:mb-4 select-all drop-shadow-sm">
                                            {walletData.balance}
                                        </h2>

                                        <div className="flex items-center gap-3 md:gap-4 mt-6 md:mt-8">
                                            <Button
                                                onClick={() => setIsAddMoneyOpen(true)}
                                                className="rounded-full bg-brand-deep dark:bg-brand-gold text-brand-gold dark:text-brand-deep h-10 md:h-12 px-6 md:px-10 shadow-2xl shadow-brand-deep/20 dark:shadow-brand-gold/10 font-bold active:scale-95 transition-all hover:bg-brand-deep/90 dark:hover:bg-brand-gold/80 relative overflow-hidden group/btn text-[10px] md:text-sm"
                                            >
                                                <span className="relative z-10 flex items-center gap-1.5 md:gap-2">
                                                    <Plus className="w-3.5 md:w-4 h-3.5 md:h-4" /> Add Money
                                                </span>
                                                <motion.div
                                                    initial={{ x: "-100%" }}
                                                    whileHover={{ x: "100%" }}
                                                    transition={{ duration: 0.6 }}
                                                    className="absolute inset-0 bg-white/20 skew-x-[-20deg]"
                                                />
                                            </Button>
                                            <Button variant="outline" className="rounded-full border-brand-deep/10 dark:border-white/10 text-brand-deep/60 dark:text-brand-cream/60 hover:text-brand-deep dark:hover:text-brand-cream h-10 md:h-12 px-6 md:px-10 backdrop-blur-md hover:bg-white/40 dark:hover:bg-white/5 active:scale-95 transition-all font-bold text-[10px] md:text-sm">
                                                <Send className="w-3.5 md:w-4 h-3.5 md:h-4 mr-1.5 md:mr-2" /> Send
                                            </Button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center w-full max-w-sm">
                                        <h2 className="font-serif text-3xl sm:text-4xl md:text-8xl font-medium text-brand-deep/10 dark:text-brand-cream/10 tracking-tighter mb-6 md:mb-8 select-none blur-[6px]">
                                            ₦***,***
                                        </h2>
                                        <Button
                                            onClick={() => setIsVerificationOpen(true)}
                                            className="bg-brand-deep dark:bg-brand-gold text-brand-gold dark:text-brand-deep font-bold px-6 md:px-10 h-11 md:h-14 rounded-2xl shadow-2xl hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-2 md:gap-3 relative overflow-hidden group/verify text-[10px] md:text-sm"
                                        >
                                            <motion.div
                                                animate={{
                                                    x: ["-100%", "200%"],
                                                    opacity: [0, 0.5, 0]
                                                }}
                                                transition={{ duration: 3, repeat: Infinity, ease: "linear", repeatDelay: 1 }}
                                                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent skew-x-[-20deg]"
                                            />
                                            <Sparkles className="w-4 md:w-5 h-4 md:h-5 relative z-10" />
                                            <span className="relative z-10">Verify Identity</span>
                                        </Button>
                                        <p className="mt-4 text-[11px] font-bold uppercase tracking-widest text-brand-deep/40 dark:text-brand-cream/40">
                                            Unlock your secure virtual account
                                        </p>
                                    </div>
                                )}
                            </motion.div>
                        ) : (
                            <motion.div
                                key="sales"
                                initial={{ opacity: 0, scale: 0.95, y: 10, rotateX: -10 }}
                                animate={{ opacity: 1, scale: 1, y: 0, rotateX: 0 }}
                                exit={{ opacity: 0, scale: 1.05, y: -10, rotateX: 10 }}
                                transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                                className="flex flex-col items-center w-full relative"
                            >
                                {/* Sparkline Background - Premiumized */}
                                <div className="absolute inset-0 -z-10 opacity-30 h-full w-full pointer-events-none scale-125 blur-[2px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={sparklineData}>
                                            <defs>
                                                <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="var(--brand-gold)" stopOpacity={0.4} />
                                                    <stop offset="95%" stopColor="var(--brand-gold)" stopOpacity={0} />
                                                </linearGradient>
                                            </defs>
                                            <Area
                                                type="monotone"
                                                dataKey="value"
                                                stroke="var(--brand-gold)"
                                                fill="url(#salesGradient)"
                                                strokeWidth={4}
                                                animationDuration={2000}
                                            />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>

                                <span className="text-[10px] md:text-sm font-bold tracking-[0.2em] uppercase text-brand-accent/40 dark:text-brand-cream/40 mb-4 md:mb-6">
                                    {sales.label}
                                </span>

                                <h2 className="font-serif text-3xl sm:text-4xl md:text-8xl font-medium text-brand-deep dark:text-brand-cream tracking-tighter mb-6 md:mb-8 drop-shadow-sm">
                                    {sales.value}
                                </h2>

                                <motion.div
                                    initial={{ scale: 0.8 }}
                                    animate={{ scale: 1 }}
                                    className={cn(
                                        "inline-flex items-center gap-2 px-4 md:px-6 py-2 md:py-2.5 rounded-full text-[10px] md:text-sm font-bold shadow-lg backdrop-blur-md transition-all",
                                        sales.trendDirection === 'up'
                                            ? "bg-brand-green/10 dark:bg-brand-gold/10 text-brand-green dark:text-brand-gold"
                                            : "bg-danger/10 dark:bg-danger/10 text-danger dark:text-danger"
                                    )}
                                >
                                    {sales.trendDirection === 'up' ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                                    {sales.trend}
                                </motion.div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Enhanced Slide Indicators */}
                <div className="absolute bottom-10 left-0 right-0 flex justify-center gap-4 z-20">
                    {[0, 1].map((index) => (
                        <button
                            key={index}
                            onClick={() => setCurrentSlide(index)}
                            className="group p-2 focus:outline-none"
                            aria-label={`Go to slide ${index + 1}`}
                        >
                            <div className={cn(
                                "h-1.5 rounded-full transition-all duration-500",
                                currentSlide === index
                                    ? "bg-brand-deep dark:bg-brand-gold w-10"
                                    : "bg-brand-deep/10 dark:bg-brand-cream/10 w-3 hover:bg-brand-deep/30 dark:hover:bg-brand-cream/30"
                            )} />
                        </button>
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
        </motion.div>
    )
}
