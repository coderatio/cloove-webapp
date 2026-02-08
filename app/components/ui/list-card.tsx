"use client"

import { cn } from "@/app/lib/utils"
import { motion } from "framer-motion"
import { ChevronRight } from "lucide-react"

interface ListCardProps {
    title: string
    subtitle?: string
    status?: string
    statusColor?: "success" | "warning" | "danger" | "neutral"
    meta?: string
    value?: string
    valueLabel?: string
    onClick?: () => void
    delay?: number
}

export function ListCard({
    title,
    subtitle,
    status,
    statusColor = "neutral",
    meta,
    value,
    valueLabel,
    onClick,
    delay = 0
}: ListCardProps) {
    const statusStyles = {
        success: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800",
        warning: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-800",
        danger: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400 border-rose-200 dark:border-rose-800",
        neutral: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700",
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay, duration: 0.3 }}
            whileTap={{ scale: 0.98 }}
            onClick={onClick}
            className={cn(
                "relative overflow-hidden rounded-3xl border border-brand-deep/10 bg-white/60 dark:bg-white/5 p-4 shadow-sm backdrop-blur-md transition-all hover:bg-white/80 dark:hover:bg-white/10",
                onClick && "cursor-pointer"
            )}
        >
            <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0 pr-4">
                    <h3 className="font-semibold text-foreground truncate">{title}</h3>
                    {subtitle && <p className="text-xs text-muted-foreground mt-0.5 truncate">{subtitle}</p>}

                    {meta && <div className="mt-3 text-xs text-muted-foreground font-medium flex items-center gap-2">
                        {meta}
                    </div>}
                </div>

                <div className="flex flex-col items-end gap-2 shrink-0">
                    {status && (
                        <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border", statusStyles[statusColor])}>
                            {status}
                        </span>
                    )}

                    {value && (
                        <div className="text-right mt-1">
                            <div className="font-serif text-lg font-medium text-foreground leading-none">{value}</div>
                            {valueLabel && <div className="text-[10px] text-muted-foreground mt-0.5">{valueLabel}</div>}
                        </div>
                    )}
                </div>
            </div>

            {/* Subtle decorative arrow for interactivity hint */}
            {onClick && (
                <div className="absolute bottom-3 right-3 opacity-0 transition-opacity group-hover:opacity-100">
                    <ChevronRight className="h-4 w-4 text-muted-foreground/50" />
                </div>
            )}
        </motion.div>
    )
}
