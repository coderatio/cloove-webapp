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
        <div className={cn("relative", className)}>
            <GlassCard
                className={cn(
                    "rounded-3xl p-6 md:p-7"
                )}
            >
                <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
                    <div className="shrink-0">
                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-border bg-muted text-foreground">
                            <Sparkles className="h-5 w-5" />
                        </div>
                    </div>

                    <div className="flex-1">
                        <div className="text-base leading-7 tracking-tight text-foreground md:text-lg">
                            <Markdown content={insight} />
                        </div>
                    </div>

                    {actionLabel && actionLink && (
                        <div className="shrink-0 pt-1">
                            <Link
                                href={actionLink}
                                className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
                            >
                                <span>{actionLabel}</span>
                                <ArrowRight className="h-4 w-4" />
                            </Link>
                        </div>
                    )}
                </div>
            </GlassCard>
        </div>
    )
}
