"use client"

import { Sparkles, ArrowRight } from "lucide-react"
import Link from "next/link"
import { cn } from "@/app/lib/utils"
import { Markdown } from "../ui/markdown"
import { GlassCard } from "../ui/glass-card"

interface InsightWhisperProps {
    insight: string
    actionLabel?: string
    actionLink?: string
    className?: string
}

export function InsightWhisper({ insight, actionLabel, actionLink, className }: InsightWhisperProps) {
    return (
        <div className={cn("relative group", className)}>
            <GlassCard
                className={cn(
                    "rounded-[32px] p-6 md:p-8 relative overflow-hidden transition-all duration-500",
                    "border-l-0 border-white/5",
                    "hover:shadow-[0_20px_50px_rgba(212,175,55,0.05)] hover:-translate-y-0.5",
                    "before:absolute before:inset-0 before:bg-[radial-gradient(circle_at_0%_0%,rgba(212,175,55,0.08)_0%,transparent_50%)]",
                    "after:absolute after:inset-y-0 after:left-0 after:w-1 after:bg-linear-to-b after:from-brand-gold/0 after:via-brand-gold after:to-brand-gold/0"
                )}
            >
                <div className="flex flex-col md:flex-row md:items-center gap-6 md:gap-10 relative z-10">
                    <div className="shrink-0">
                        <div className="w-12 h-12 rounded-2xl bg-brand-gold/10 border border-brand-gold/20 flex items-center justify-center text-brand-gold backdrop-blur-sm shadow-inner overflow-hidden relative group/icon">
                            <Sparkles className="w-6 h-6 transition-transform duration-500 group-hover/icon:scale-110 group-hover/icon:rotate-12" />
                            <div className="absolute inset-0 bg-linear-to-tr from-transparent via-brand-gold/5 to-transparent -translate-x-full group-hover/icon:translate-x-full transition-transform duration-1000" />
                        </div>
                    </div>

                    <div className="flex-1">
                        <div className="text-lg md:text-xl text-brand-deep dark:text-brand-cream/90 leading-relaxed font-sans tracking-tight">
                            <Markdown content={insight} />
                        </div>
                    </div>

                    {actionLabel && actionLink && (
                        <div className="shrink-0 pt-2 md:pt-0">
                            <Link
                                href={actionLink}
                                className="inline-flex items-center gap-3 px-5 py-2.5 rounded-full text-sm font-medium bg-brand-deep/5 dark:bg-brand-cream/5 text-brand-deep dark:text-brand-cream hover:text-brand-gold dark:hover:text-brand-gold border border-transparent hover:border-brand-gold/20 transition-all duration-300 group/link overflow-hidden relative"
                            >
                                <span className="relative z-10">{actionLabel}</span>
                                <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover/link:translate-x-1.5 relative z-10" />
                                <div className="absolute inset-0 bg-brand-gold/5 translate-y-full group-hover/link:translate-y-0 transition-transform duration-300" />
                            </Link>
                        </div>
                    )}
                </div>
            </GlassCard>
        </div>
    )
}
