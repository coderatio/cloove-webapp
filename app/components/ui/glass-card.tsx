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
                    "relative rounded-3xl border border-border/60 bg-card text-card-foreground shadow-[0_1px_2px_rgb(0_0_0/0.025)]",
                    !allowOverflow && "overflow-hidden",
                    hoverEffect &&
                        "transition-[border-color,background-color] duration-150 ease-out hover:border-border/80 hover:bg-muted/25 motion-reduce:transition-none",
                    className
                )}
                {...props}
            />
        )
    }
)
GlassCard.displayName = "GlassCard"
