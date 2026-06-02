import * as React from "react"
import { cn } from "@/app/lib/utils"

export type DotBadgeTone = "success" | "warning" | "danger" | "info" | "neutral"

const TONE_STYLES: Record<DotBadgeTone, { dot: string; text: string }> = {
    success: { dot: "bg-emerald-500", text: "text-emerald-600 dark:text-emerald-400" },
    warning: { dot: "bg-amber-500", text: "text-amber-600 dark:text-amber-400" },
    danger: { dot: "bg-rose-500", text: "text-rose-600 dark:text-rose-400" },
    info: { dot: "bg-sky-500", text: "text-sky-600 dark:text-sky-400" },
    neutral: {
        dot: "bg-brand-deep/40 dark:bg-brand-cream/40",
        text: "text-brand-deep/60 dark:text-brand-cream/60",
    },
}

interface DotBadgeProps {
    children: React.ReactNode
    tone?: DotBadgeTone
    /** Gently pulse the dot — useful for live/active states. */
    pulse?: boolean
    className?: string
}

/**
 * Minimal status indicator: a small coloured dot next to a label. No pill
 * background, no uppercase tracking — a calmer, more premium take on a status
 * badge. Reuse anywhere a status needs to read clearly without shouting.
 */
export function DotBadge({ children, tone = "neutral", pulse = false, className }: DotBadgeProps) {
    const styles = TONE_STYLES[tone]
    return (
        <span className={cn("inline-flex items-center gap-1.5 text-xs font-medium", styles.text, className)}>
            <span className="relative flex h-1.5 w-1.5">
                {pulse && (
                    <span
                        className={cn(
                            "absolute inline-flex h-full w-full animate-ping rounded-full opacity-60",
                            styles.dot
                        )}
                    />
                )}
                <span className={cn("relative inline-flex h-1.5 w-1.5 rounded-full", styles.dot)} />
            </span>
            {children}
        </span>
    )
}
