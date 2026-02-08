"use client"

import { motion } from "framer-motion"
import { TrendingUp, TrendingDown } from "lucide-react"
import { cn } from "@/app/lib/utils"

interface DashboardHeroProps {
    value: string
    trend: string
    trendDirection: 'up' | 'down'
    label: string
    className?: string
}

export function DashboardHero({ value, trend, trendDirection, label, className }: DashboardHeroProps) {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className={cn("glass-panel rounded-[32px] p-8 md:p-12 text-center relative overflow-hidden group", className)}
        >
            <div className="absolute inset-0 bg-gradient-to-tr from-brand-gold/5 via-transparent to-brand-green/5 opacity-50 pointer-events-none" />

            <div className="relative z-10 flex flex-col items-center">
                <span className="text-sm md:text-base font-serif text-brand-accent/80 tracking-widest uppercase mb-4">
                    {label}
                </span>

                <h2 className="font-serif text-5xl md:text-7xl font-medium text-brand-deep tracking-tight mb-6">
                    {value}
                </h2>

                <div className={cn(
                    "inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors",
                    trendDirection === 'up'
                        ? "bg-brand-green/10 text-brand-green"
                        : "bg-danger/10 text-danger"
                )}>
                    {trendDirection === 'up' ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                    {trend}
                </div>
            </div>
        </motion.div>
    )
}
