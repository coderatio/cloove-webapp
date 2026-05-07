"use client"

import { cn } from "@/app/lib/utils"
import { motion } from "framer-motion"
import Image from "next/image"
import { ChevronRight, Package } from "lucide-react"

interface ListCardProps {
    title: string
    subtitle?: React.ReactNode
    status?: string
    statusColor?: "success" | "warning" | "danger" | "neutral"
    meta?: React.ReactNode
    value?: React.ReactNode
    valueLabel?: string
    image?: string
    icon?: React.ElementType
    iconClassName?: string
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
    icon: Icon,
    iconClassName,
    actions,
    onClick,
    delay = 0
}: ListCardProps) {
    const statusStyles = {
        success: "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:border-emerald-400/20 dark:bg-emerald-400/12 dark:text-emerald-200",
        warning: "border-amber-500/20 bg-amber-500/10 text-amber-700 dark:border-amber-400/20 dark:bg-amber-400/12 dark:text-amber-200",
        danger: "border-rose-500/20 bg-rose-500/10 text-rose-700 dark:border-rose-400/20 dark:bg-rose-400/12 dark:text-rose-200",
        neutral: "border-border bg-muted/60 text-muted-foreground",
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay, duration: 0.3 }}
            whileTap={{ scale: 0.98 }}
            onClick={onClick}
            className={cn(
                "group relative overflow-hidden rounded-3xl border border-border bg-card p-4 shadow-sm backdrop-blur-md transition-all hover:bg-muted/20",
                onClick && "cursor-pointer"
            )}
        >
            <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-4 flex-1 min-w-0">
                    <div className="relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-border bg-muted">
                        {image ? (
                            <Image
                                src={image}
                                alt={title}
                                fill
                                className="object-cover"
                            />
                        ) : Icon ? (
                            <Icon className={cn("h-6 w-6", iconClassName || "text-foreground/60")} />
                        ) : (
                            <Package className="h-6 w-6 text-muted-foreground/40" />
                        )}
                    </div>

                    <div className="flex-1 min-w-0">
                        <h3 className="truncate leading-tight text-foreground font-semibold">{title}</h3>
                        {subtitle && <p className="mt-1 truncate text-[12px] font-medium text-muted-foreground">{subtitle}</p>}
                        {meta && <div className="mt-2 flex items-center gap-2 text-[10px] font-mono uppercase tracking-tight text-muted-foreground">
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
                            <div className="text-lg font-semibold leading-none text-foreground">{value}</div>
                            {valueLabel && <div className="mt-0.5 text-[10px] text-muted-foreground">{valueLabel}</div>}
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
