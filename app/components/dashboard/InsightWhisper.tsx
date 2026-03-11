"use client"

import { motion, Variants, useInView, useReducedMotion } from "framer-motion"
import { Sparkles, ArrowRight } from "lucide-react"
import Link from "next/link"
import { cn } from "@/app/lib/utils"
import { useRef } from "react"

import { Markdown } from "../ui/markdown"
import { GlassCard } from "../ui/glass-card"

interface InsightWhisperProps {
    insight: string
    actionLabel?: string
    actionLink?: string
    className?: string
}

const containerVariants: Variants = {
    hidden: { opacity: 0, y: 10 },
    visible: {
        opacity: 1,
        y: 0,
        transition: {
            duration: 0.6,
            ease: [0.22, 1, 0.36, 1],
            staggerChildren: 0.12
        } as any
    }
}

const itemVariants: Variants = {
    hidden: { opacity: 0, x: -10 },
    visible: {
        opacity: 1,
        x: 0,
        transition: { duration: 0.5, ease: "easeOut" }
    }
}

export function InsightWhisper({ insight, actionLabel, actionLink, className }: InsightWhisperProps) {
    const wrapperRef = useRef<HTMLDivElement>(null)
    const reducedMotion = useReducedMotion()
    const isInView = useInView(wrapperRef, { margin: "-10% 0px -10% 0px", once: false })

    return (
        <motion.div
            ref={wrapperRef}
            initial="hidden"
            animate={isInView ? "visible" : "hidden"}
            variants={containerVariants}
            className={cn("relative group", className)}
        >
            <GlassCard
                className={cn(
                    "rounded-[32px] p-6 md:p-8 relative overflow-hidden transition-all duration-500",
                    "border-l-0 border-white/5",
                    "hover:shadow-[0_20px_50px_rgba(212,175,55,0.05)] hover:-translate-y-0.5",
                    "before:absolute before:inset-0 before:bg-[radial-gradient(circle_at_0%_0%,rgba(212,175,55,0.08)_0%,transparent_50%)]",
                    "after:absolute after:inset-y-0 after:left-0 after:w-1 after:bg-linear-to-b after:from-brand-gold/0 after:via-brand-gold after:to-brand-gold/0"
                )}
            >
                {/* Decorative mesh-like glow */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-brand-gold/5 blur-[100px] -mr-32 -mt-32 pointer-events-none" />

                <div className="flex flex-col md:flex-row md:items-center gap-6 md:gap-10 relative z-10">
                    <motion.div variants={itemVariants} className="shrink-0">
                        <div className="relative">
                            <motion.div
                                animate={
                                    reducedMotion || !isInView
                                        ? { scale: 1, opacity: 0.5 }
                                        : {
                                            scale: [1, 1.08, 1],
                                            opacity: [0.45, 0.75, 0.45],
                                        }
                                }
                                transition={{
                                    duration: reducedMotion ? 0.01 : 5,
                                    repeat: reducedMotion ? 0 : Infinity,
                                    ease: "easeInOut",
                                }}
                                className="absolute inset-0 bg-brand-gold/20 blur-lg rounded-full will-change-transform"
                            />
                            <div className="w-12 h-12 rounded-2xl bg-brand-gold/10 border border-brand-gold/20 flex items-center justify-center text-brand-gold backdrop-blur-sm shadow-inner overflow-hidden relative group/icon">
                                <Sparkles className="w-6 h-6 transition-transform duration-500 group-hover/icon:scale-110 group-hover/icon:rotate-12" />
                                <div className="absolute inset-0 bg-linear-to-tr from-transparent via-brand-gold/5 to-transparent -translate-x-full group-hover/icon:translate-x-full transition-transform duration-1000" />
                            </div>
                        </div>
                    </motion.div>

                    <motion.div variants={itemVariants} className="flex-1">
                        <div className="text-xl md:text-2xl text-brand-deep dark:text-brand-cream/90 leading-relaxed font-sans tracking-tight transition-all">
                            <Markdown content={insight} />
                        </div>
                    </motion.div>

                    {actionLabel && actionLink && (
                        <motion.div variants={itemVariants} className="shrink-0 pt-2 md:pt-0">
                            <Link
                                href={actionLink}
                                className="inline-flex items-center gap-3 px-5 py-2.5 rounded-full text-sm font-medium bg-brand-deep/5 dark:bg-brand-cream/5 text-brand-deep dark:text-brand-cream hover:text-brand-gold dark:hover:text-brand-gold border border-transparent hover:border-brand-gold/20 transition-all duration-300 group/link overflow-hidden relative"
                            >
                                <span className="relative z-10">{actionLabel}</span>
                                <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover/link:translate-x-1.5 relative z-10" />
                                <div className="absolute inset-0 bg-brand-gold/5 translate-y-full group-hover/link:translate-y-0 transition-transform duration-300" />
                            </Link>
                        </motion.div>
                    )}
                </div>
            </GlassCard>
        </motion.div>
    )
}
