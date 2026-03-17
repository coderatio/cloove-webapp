"use client"

import { motion } from "framer-motion"
import { GlassCard } from "@/app/components/ui/glass-card"

function Shimmer({ className }: { className?: string }) {
    return (
        <motion.div
            className={`rounded-lg bg-brand-deep/5 dark:bg-white/5 ${className ?? ""}`}
            animate={{ opacity: [0.4, 0.7, 0.4] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
        />
    )
}

export function ProposalSkeleton() {
    return (
        <GlassCard className="mt-4 overflow-hidden border-brand-green/20 bg-brand-green/5">
            <div className="p-5">
                <div className="flex items-center gap-3 mb-4">
                    <Shimmer className="h-10 w-10 rounded-xl" />
                    <div className="flex-1 space-y-2">
                        <Shimmer className="h-4 w-40" />
                        <Shimmer className="h-2.5 w-24" />
                    </div>
                </div>
                <div className="space-y-3 mb-5">
                    <div className="flex justify-between">
                        <Shimmer className="h-3 w-16" />
                        <Shimmer className="h-3 w-28" />
                    </div>
                    <div className="rounded-xl p-3 border border-brand-green/10 space-y-2">
                        <Shimmer className="h-3 w-20" />
                        <Shimmer className="h-3 w-full" />
                        <Shimmer className="h-3 w-3/4" />
                    </div>
                </div>
                <div className="flex gap-2">
                    <Shimmer className="h-8 flex-1 rounded-lg" />
                    <Shimmer className="h-8 w-20 rounded-lg" />
                </div>
            </div>
        </GlassCard>
    )
}

export function InvoiceSkeleton() {
    return (
        <GlassCard className="mt-4 overflow-hidden border-brand-gold/20 bg-brand-gold/5">
            <div className="p-5">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <Shimmer className="h-10 w-10 rounded-xl" />
                        <div className="space-y-2">
                            <Shimmer className="h-4 w-28" />
                            <Shimmer className="h-2.5 w-16" />
                        </div>
                    </div>
                    <div className="text-right space-y-1">
                        <Shimmer className="h-2.5 w-10 ml-auto" />
                        <Shimmer className="h-4 w-20 ml-auto" />
                    </div>
                </div>
                <div className="space-y-2 mb-5">
                    <div className="flex justify-between">
                        <Shimmer className="h-3 w-16" />
                        <Shimmer className="h-3 w-24" />
                    </div>
                    <div className="flex justify-between">
                        <Shimmer className="h-3 w-16" />
                        <Shimmer className="h-3 w-20" />
                    </div>
                    <div className="pt-2 border-t border-brand-gold/10 space-y-1.5">
                        <div className="flex justify-between">
                            <Shimmer className="h-3 w-32" />
                            <Shimmer className="h-3 w-16" />
                        </div>
                        <div className="flex justify-between">
                            <Shimmer className="h-3 w-28" />
                            <Shimmer className="h-3 w-14" />
                        </div>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Shimmer className="h-8 flex-1 rounded-lg" />
                    <Shimmer className="h-8 w-24 rounded-lg" />
                </div>
            </div>
        </GlassCard>
    )
}

export function GenericToolSkeleton() {
    return (
        <div className="flex items-center gap-2 py-2">
            <motion.div
                className="h-3.5 w-3.5 rounded-full bg-brand-gold/40"
                animate={{ scale: [1, 1.2, 1], opacity: [0.4, 1, 0.4] }}
                transition={{ duration: 1, repeat: Infinity, ease: "easeInOut" }}
            />
            <span className="text-xs text-brand-deep/40 dark:text-brand-cream/40">
                Processing your request…
            </span>
        </div>
    )
}
