"use client"

import { cn } from "@/app/lib/utils"
import { motion } from "framer-motion"
import Image from "next/image"
import { ChevronRight, Package } from "lucide-react"

interface ListCardProps {
    title: string
    subtitle?: string
    status?: string
    statusColor?: "success" | "warning" | "danger" | "neutral"
    meta?: string
    value?: string
    valueLabel?: string
    image?: string
    actions?: React.ReactNode
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
    image,
    actions,
    onClick,
    delay = 0
}: ListCardProps) {
    const statusStyles = {
        success: "bg-emerald-100 text-emerald-700 dark:bg-brand-gold/10 dark:text-brand-gold border-emerald-200 dark:border-brand-gold/20",
        warning: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-brand-gold/70 border-amber-200 dark:border-amber-800/30",
        danger: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400 border-rose-200 dark:border-rose-800/30",
        neutral: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-brand-cream/60 border-zinc-200 dark:border-zinc-700",
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay, duration: 0.3 }}
            whileTap={{ scale: 0.98 }}
            onClick={onClick}
            className={cn(
                "relative overflow-hidden rounded-3xl border border-brand-deep/10 bg-white/60 dark:bg-white/5 p-4 shadow-sm backdrop-blur-md transition-all hover:bg-white/80 dark:hover:bg-white/10 group",
                onClick && "cursor-pointer"
            )}
        >
            <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-4 flex-1 min-w-0">
                    <div className="w-12 h-12 rounded-2xl bg-brand-deep/5 dark:bg-white/5 border border-brand-deep/5 dark:border-white/5 flex items-center justify-center overflow-hidden shrink-0 relative">
                        {image ? (
                            <Image
                                src={image}
                                alt={title}
                                fill
                                className="object-cover"
                            />
                        ) : (
                            <Package className="w-6 h-6 text-brand-deep/20 dark:text-white/20" />
                        )}
                    </div>

                    <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-foreground dark:text-brand-cream truncate leading-none pt-1">{title}</h3>
                        {subtitle && <p className="text-[11px] text-muted-foreground dark:text-brand-cream/60 mt-1.5 truncate">{subtitle}</p>}
                        {meta && <div className="mt-3 text-xs text-muted-foreground font-medium flex items-center gap-2">
                            {meta}
                        </div>}
                    </div>
                </div>

                <div className="flex flex-col items-end gap-2 shrink-0">
                    <div className="flex items-center gap-2">
                        {status && (
                            <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border shrink-0", statusStyles[statusColor])}>
                                {status}
                            </span>
                        )}
                        {actions && <div className="-mr-2">{actions}</div>}
                    </div>

                    {value && (
                        <div className="text-right mt-1">
                            <div className="font-serif text-lg font-medium text-foreground dark:text-brand-cream leading-none">{value}</div>
                            {valueLabel && <div className="text-[10px] text-muted-foreground dark:text-brand-cream/40 mt-0.5">{valueLabel}</div>}
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
