"use client"

import { AlertTriangle, RefreshCw, AlertCircle } from "lucide-react"
import { Button } from "@/app/components/ui/button"
import { GlassCard } from "@/app/components/ui/glass-card"
import { cn } from "@/app/lib/utils"
import { motion } from "framer-motion"

interface ErrorDisplayProps {
    title?: string
    description?: string
    onRetry?: () => void
    className?: string
}

export function ErrorDisplay({
    title = "Something went wrong",
    description = "We couldn't load the data. Please try again.",
    onRetry,
    className
}: ErrorDisplayProps) {
    return (
        <div className={cn("relative w-full min-h-[300px] flex items-center overflow-hidden rounded-[32px] p-1", className)}>
            {/* Ambient Background Glow - Shifted left */}
            {/* <div className="absolute top-1/2 left-0 -translate-y-1/2 w-[300px] h-[300px] bg-red-500/10 dark:bg-red-500/5 blur-[100px] rounded-full pointer-events-none" /> */}

            <motion.div
                initial={{ opacity: 1, y: 0 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="relative z-10 w-full"
            >
                <GlassCard className="p-8 md:p-10 flex flex-col items-start text-left border-red-500/10 dark:border-red-500/10 bg-white/40 dark:bg-white/5 backdrop-blur-xl shadow-2xl shadow-red-900/5">

                    <div className="flex flex-col md:flex-row items-start md:items-center gap-8 w-full">
                        {/* Icon Container */}
                        <div className="relative group shrink-0">
                            <div className="absolute inset-0 bg-red-500/20 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                            <div className="relative w-16 h-16 rounded-full bg-linear-to-b from-red-500/10 to-transparent border border-red-500/10 flex items-center justify-center p-1">
                                <div className="w-full h-full rounded-full bg-white/50 dark:bg-black/20 flex items-center justify-center border border-white/40 dark:border-white/5 shadow-inner">
                                    <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400 drop-shadow-sm" />
                                </div>
                            </div>

                            {/* Decorative orbits */}
                            <svg className="absolute inset-0 w-16 h-16 animate-[spin_10s_linear_infinite] opacity-30 pointer-events-none" viewBox="0 0 100 100">
                                <circle cx="50" cy="50" r="48" fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="4 6" className="text-red-500/40" />
                            </svg>
                        </div>

                        <div className="flex-1 space-y-2">
                            <h3 className="text-xl font-serif font-medium text-brand-deep dark:text-brand-cream">
                                {title}
                            </h3>

                            <p className="text-sm text-brand-deep/60 dark:text-brand-cream/60 leading-relaxed max-w-xl">
                                {description}
                            </p>

                            {onRetry && (
                                <div className="pt-4">
                                    <Button
                                        onClick={onRetry}
                                        className="h-10 px-6 rounded-full bg-brand-deep text-brand-cream hover:bg-brand-deep/90 shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 border border-white/10"
                                    >
                                        <RefreshCw className="w-3.5 h-3.5 mr-2 animate-[spin_3s_linear_infinite_paused] hover:animate-[spin_3s_linear_infinite]" />
                                        <span className="font-medium tracking-wide text-xs uppercase">Try Again</span>
                                    </Button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Decorative corner accents */}
                    <div className="absolute top-6 left-6 w-8 h-8 border-t border-l border-red-500/10 rounded-tl-2xl pointer-events-none" />
                    <div className="absolute bottom-6 right-6 w-8 h-8 border-b border-r border-red-500/10 rounded-br-2xl pointer-events-none" />
                </GlassCard>
            </motion.div>
        </div>
    )

}
