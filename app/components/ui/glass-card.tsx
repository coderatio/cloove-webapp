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
                    "relative overflow-hidden rounded-[32px] border border-brand-green/10 bg-brand-cream/40 backdrop-blur-2xl shadow-[0_8px_32px_rgba(6,44,33,0.04)] transition-all duration-500",
                    "before:absolute before:inset-0 before:bg-gradient-to-b before:from-white/20 before:to-transparent before:rounded-[32px] before:pointer-events-none before:-z-10",
                    "dark:bg-white/[0.03] dark:border-white/10 dark:shadow-[0_8px_24px_rgba(0,0,0,0.2)] dark:before:from-white/5 dark:backdrop-blur-3xl",
                    hoverEffect && "hover:bg-brand-cream/60 dark:hover:bg-white/[0.05] hover:shadow-[0_16px_64px_rgba(6,44,33,0.08)] hover:-translate-y-1 hover:border-brand-green/20 dark:hover:border-white/20",
                    className
                )}
                {...props}
            />
        )
    }
)
GlassCard.displayName = "GlassCard"
