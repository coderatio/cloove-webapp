import { cn } from "@/app/lib/utils"
import { HTMLAttributes, forwardRef } from "react"

interface GlassCardProps extends HTMLAttributes<HTMLDivElement> {
    hoverEffect?: boolean
}

export const GlassCard = forwardRef<HTMLDivElement, GlassCardProps>(
    ({ className, hoverEffect = false, ...props }, ref) => {
        return (
            <div
                ref={ref}
                className={cn(
                    "relative overflow-hidden rounded-3xl border border-brand-green/10 bg-brand-cream/60 backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,0.08)] transition-all duration-500",
                    "before:absolute before:inset-0 before:p-[1px] before:bg-gradient-to-br before:from-white/30 before:to-transparent before:rounded-3xl before:-z-10",
                    "dark:bg-brand-deep/70 dark:border-white/10 dark:shadow-[0_8px_32px_rgba(0,0,0,0.4)] dark:before:from-white/10",
                    hoverEffect && "hover:bg-brand-cream/80 dark:hover:bg-brand-deep/80 hover:shadow-[0_12px_48px_rgba(0,0,0,0.12)] hover:-translate-y-1",
                    className
                )}
                {...props}
            />
        )
    }
)
GlassCard.displayName = "GlassCard"
