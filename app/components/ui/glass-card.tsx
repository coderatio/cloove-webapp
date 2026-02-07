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
                    "relative overflow-hidden rounded-xl border border-white/10 bg-white/60 dark:bg-black/40 backdrop-blur-xl shadow-sm transition-all duration-300",
                    hoverEffect && "hover:bg-white/70 dark:hover:bg-black/50 hover:shadow-md hover:-translate-y-1",
                    className
                )}
                {...props}
            />
        )
    }
)
GlassCard.displayName = "GlassCard"
