import { cn } from "@/app/lib/utils"
import { HTMLAttributes, forwardRef } from "react"

interface GlassCardProps extends HTMLAttributes<HTMLDivElement> {
    hoverEffect?: boolean
    allowOverflow?: boolean
}

export const GlassCard = forwardRef<HTMLDivElement, GlassCardProps>(
    ({ className, hoverEffect = false, allowOverflow = false, ...props }, ref) => {
        return (
            <div
                ref={ref}
                className={cn(
                    "relative rounded-3xl border border-border bg-card text-card-foreground shadow-sm transition-colors duration-200",
                    !allowOverflow && "overflow-hidden",
                    hoverEffect && "hover:border-foreground/12 hover:bg-muted/35",
                    className
                )}
                {...props}
            />
        )
    }
)
GlassCard.displayName = "GlassCard"
