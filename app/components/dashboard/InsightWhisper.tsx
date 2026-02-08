"use client"

import { motion } from "framer-motion"
import { Sparkles, ArrowRight } from "lucide-react"
import Link from "next/link"
import { cn } from "@/app/lib/utils"

import { Markdown } from "../ui/markdown"

interface InsightWhisperProps {
    insight: string
    actionLabel?: string
    actionLink?: string
    className?: string
}

export function InsightWhisper({ insight, actionLabel, actionLink, className }: InsightWhisperProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className={cn("glass-panel rounded-2xl p-6 md:p-8 border-l-4 border-l-brand-gold relative", className)}
        >
            <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-8">
                <div className="flex-shrink-0">
                    <div className="w-10 h-10 rounded-full bg-brand-gold/10 flex items-center justify-center text-brand-gold">
                        <Sparkles className="w-5 h-5" />
                    </div>
                </div>

                <div className="flex-1">
                    <div className="text-lg md:text-xl text-brand-deep dark:text-brand-cream/90 leading-relaxed font-medium transition-all">
                        <Markdown content={insight} />
                    </div>
                </div>

                {actionLabel && actionLink && (
                    <div className="flex-shrink-0 pt-2 md:pt-0">
                        <Link
                            href={actionLink}
                            className="inline-flex items-center gap-2 text-sm font-medium text-brand-accent hover:text-brand-deep dark:text-brand-cream dark:hover:text-brand-gold transition-colors group"
                        >
                            {actionLabel}
                            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                        </Link>
                    </div>
                )}
            </div>
        </motion.div>
    )
}
