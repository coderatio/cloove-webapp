"use client"

import { Button } from "@/app/components/ui/button"
import { Badge } from "@/app/components/ui/badge"
import { cn } from "@/app/lib/utils"
import { type LucideIcon } from "lucide-react"

interface AddonCardProps {
    icon: LucideIcon
    name: string
    description: string | null
    priceLabel: string
    selected: boolean
    quantity: number
    isActive?: boolean
    maxQuantity?: number
    iconClassName?: string
    onToggle: () => void
    onIncrease: () => void
    onDecrease: () => void
}

export function AddonCard({
    icon: Icon,
    name,
    description,
    priceLabel,
    selected,
    quantity,
    isActive,
    maxQuantity = 1,
    iconClassName,
    onToggle,
    onIncrease,
    onDecrease,
}: AddonCardProps) {
    return (
        <div
            className={cn(
                "rounded-3xl border p-5 transition-all duration-300",
                selected
                    ? "border-brand-gold/40 bg-brand-gold/8 shadow-lg shadow-brand-gold/10"
                    : "border-brand-deep/8 bg-white dark:bg-white/5"
            )}
        >
            <div className="flex items-start justify-between gap-3">
                <div className="space-y-2">
                    <div className="flex items-center gap-2">
                        <div className={cn(
                            "flex h-9 w-9 items-center justify-center rounded-2xl bg-brand-deep/8 text-brand-deep dark:bg-white/8 dark:text-brand-cream",
                            iconClassName
                        )}>
                            <Icon className="h-4 w-4" />
                        </div>
                        <div>
                            <h3 className="font-serif text-lg text-brand-deep dark:text-brand-cream">{name}</h3>
                            <p className="text-xs font-semibold text-brand-gold">
                                {priceLabel}
                            </p>
                        </div>
                    </div>
                    <p className="text-sm leading-relaxed text-brand-deep/60 dark:text-brand-cream/60">
                        {description || "Business-scoped paid add-on."}
                    </p>
                </div>
                {isActive ? (
                    <Badge className="rounded-full bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/10 dark:text-emerald-400">
                        Active
                    </Badge>
                ) : null}
            </div>

            <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <Button
                    type="button"
                    variant={selected ? "default" : "outline"}
                    className={cn(
                        "h-11 rounded-2xl px-5",
                        isActive && "cursor-default opacity-100",
                        selected
                            ? "bg-brand-deep text-brand-gold hover:bg-brand-deep/90 dark:bg-brand-gold dark:text-brand-deep"
                            : "border-brand-deep/10 hover:bg-brand-deep/5 dark:border-white/10 dark:hover:bg-white/5"
                    )}
                    onClick={onToggle}
                    disabled={isActive}
                >
                    {isActive ? "Already active" : selected ? "Remove" : "Add to checkout"}
                </Button>

                {maxQuantity > 1 ? (
                    <div className="flex items-center gap-2 self-start rounded-2xl border border-brand-deep/8 bg-brand-deep/3 p-1 dark:border-white/8 dark:bg-white/4 sm:self-auto">
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-9 w-9 rounded-xl text-brand-deep dark:text-brand-cream"
                            onClick={onDecrease}
                            disabled={!selected || quantity <= 1 || isActive}
                        >
                            -
                        </Button>
                        <div className="min-w-10 text-center text-sm font-semibold tabular-nums text-brand-deep dark:text-brand-cream">
                            {selected ? quantity : 0}
                        </div>
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-9 w-9 rounded-xl text-brand-deep dark:text-brand-cream"
                            onClick={onIncrease}
                            disabled={isActive || quantity >= maxQuantity}
                        >
                            +
                        </Button>
                    </div>
                ) : null}
            </div>
        </div>
    )
}
