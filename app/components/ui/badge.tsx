import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/app/lib/utils"

const badgeVariants = cva(
    "inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider border transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
    {
        variants: {
            variant: {
                default:
                    "border-transparent bg-brand-deep/5 text-brand-deep/60 dark:bg-white/5 dark:text-brand-cream/60",
                secondary:
                    "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
                destructive:
                    "border-rose-500/20 bg-rose-500/10 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400 dark:border-rose-500/30",
                outline: "text-foreground border-brand-deep/5 dark:border-white/5",
                success:
                    "border-brand-green/20 bg-brand-green/10 text-brand-green dark:bg-brand-gold/10 dark:text-brand-gold dark:border-brand-gold/20",
                warning:
                    "border-amber-500/20 bg-amber-500/10 text-amber-600 dark:bg-amber-900/30 dark:text-brand-gold/70 dark:border-brand-gold/20",
                emerald:
                    "border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400 dark:border-emerald-500/30",
                gold:
                    "border-brand-gold/20 bg-brand-gold/10 text-brand-gold dark:bg-brand-gold/20 dark:text-brand-gold/90",
            },
        },
        defaultVariants: {
            variant: "default",
        },
    }
)

export interface BadgeProps
    extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> { }

function Badge({ className, variant, ...props }: BadgeProps) {
    return (
        <div className={cn(badgeVariants({ variant }), className)} {...props} />
    )
}

export { Badge, badgeVariants }
