"use client"

import { Button } from "@/app/components/ui/button"
import { Check, Loader2 } from "lucide-react"
import { cn } from "@/app/lib/utils"

interface PlanCardProps {
    name: string
    description: string
    price: number
    currency: string
    interval: "month" | "year"
    features: string[]
    isCurrent?: boolean
    isRecommended?: boolean
    currentPlanPrice: number
    onSelect: () => void
    isLoading?: boolean
}

export function PlanCard({
    name,
    description,
    price,
    interval,
    features,
    isCurrent,
    isRecommended,
    currentPlanPrice,
    onSelect,
    isLoading,
    currency
}: PlanCardProps) {
    const formattedPrice = new Intl.NumberFormat('en-NG', {
        style: 'currency',
        currency: currency === "₦" ? 'NGN' : currency,
        minimumFractionDigits: 0,
    }).format(price).replace('NGN', '₦')

    const getButtonText = () => {
        if (isLoading) return <Loader2 className="w-4 h-4 animate-spin" />
        if (isCurrent) return "Current Plan"

        const planPrice = Number(price)
        const activePlanPrice = Number(currentPlanPrice)

        // If it's the same price but not current, it's likely an interval switch
        if (planPrice === activePlanPrice && planPrice > 0) {
            return `Switch to ${interval === 'year' ? 'Yearly' : 'Monthly'}`
        }

        if (planPrice > activePlanPrice || (activePlanPrice === 0 && planPrice > 0)) {
            return "Upgrade"
        }

        return "Downgrade"
    }

    return (
        <div className={cn(
            "relative p-6 rounded-3xl border transition-all duration-300 flex flex-col h-full",
            isRecommended
                ? "bg-brand-gold/10 dark:bg-brand-gold/5 border-brand-gold/50 shadow-xl shadow-brand-gold/5 scale-[1.02] z-10"
                : "bg-white dark:bg-white/5 border-brand-deep/5 dark:border-white/5 hover:border-brand-deep/20 dark:hover:border-white/20",
            isCurrent && "border-brand-deep dark:border-brand-cream bg-brand-deep/5 dark:bg-white/5"
        )}>
            {isRecommended && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-brand-gold text-brand-deep text-[10px] font-bold uppercase tracking-wider shadow-sm">
                    Recommended
                </div>
            )}

            <div className="mb-6 space-y-2">
                <h3 className="font-serif text-xl text-brand-deep dark:text-brand-cream">{name}</h3>
                <p className="text-sm text-brand-deep/60 dark:text-brand-cream/60 leading-relaxed min-h-[40px]">
                    {description}
                </p>
            </div>

            <div className="mb-8">
                <div className="flex items-baseline gap-1">
                    <span className="font-serif text-4xl text-brand-deep dark:text-brand-cream">
                        {price === 0 ? "Free" : formattedPrice}
                    </span>
                    {price > 0 && (
                        <span className="text-sm text-brand-deep/60 dark:text-brand-cream/60 font-medium lowercase">
                            /{interval}
                        </span>
                    )}
                </div>
            </div>

            <div className="space-y-4 flex-1 mb-8">
                {features.map((feature, i) => (
                    <div key={i} className="flex items-start gap-3 text-sm">
                        <div className={cn(
                            "mt-0.5 w-4 h-4 rounded-full flex items-center justify-center shrink-0",
                            isRecommended ? "bg-brand-gold/20 text-brand-gold" : "bg-brand-deep/10 dark:bg-white/10 text-brand-deep dark:text-brand-cream"
                        )}>
                            <Check className="w-2.5 h-2.5" strokeWidth={3} />
                        </div>
                        <span className="text-brand-deep/80 dark:text-brand-cream/80">{feature}</span>
                    </div>
                ))}
            </div>

            <Button
                onClick={onSelect}
                disabled={isCurrent || isLoading}
                variant={isRecommended ? "default" : "outline"}
                className={cn(
                    "w-full h-12 rounded-xl text-sm font-bold transition-all",
                    isRecommended
                        ? "bg-brand-deep hover:bg-brand-deep/90 text-brand-gold shadow-lg shadow-brand-deep/10 dark:bg-brand-gold dark:text-brand-deep dark:hover:bg-brand-gold/90"
                        : "border-brand-deep/10 hover:bg-brand-deep/5 dark:border-white/10 dark:hover:bg-white/5",
                    isCurrent && "opacity-100 bg-transparent border-brand-deep/20 text-brand-deep dark:text-brand-cream cursor-default hover:bg-transparent"
                )}
            >
                {getButtonText()}
            </Button>
        </div>
    )
}
