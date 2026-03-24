"use client"

import { GlassCard } from "@/app/components/ui/glass-card"
import { cn } from "@/app/lib/utils"
import { LucideIcon } from "lucide-react"

interface AgentStatCardProps {
    title: string
    value: string | number
    icon: LucideIcon
    trend?: {
        value: number
        isPositive: boolean
    }
    className?: string
}

export function AgentStatCard({ title, value, icon: Icon, trend, className }: AgentStatCardProps) {
    return (
        <GlassCard hoverEffect className={cn("p-6 md:p-8 relative overflow-hidden group", className)}>
            {/* Optimized Depth Layers */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-brand-gold/5 blur-xl -mr-16 -mt-16 group-hover:bg-brand-gold/10 transition-colors" />

            <div className="relative flex items-start justify-between mb-8">
                <div className="w-14 h-14 rounded-[20px] bg-brand-deep/5 dark:bg-white/5 border border-brand-deep/10 dark:border-white/10 flex items-center justify-center group-hover:scale-110 group-hover:rotate-3 transition-all duration-500">
                    <Icon className="w-7 h-7 text-brand-gold" />
                </div>
                {trend && (
                    <div className={cn(
                        "text-[10px] font-black tracking-widest px-3 py-1.5 rounded-full uppercase",
                        trend.isPositive ? "bg-green-500/10 text-green-600" : "bg-red-500/10 text-red-600"
                    )}>
                        {trend.isPositive ? "↑" : "↓"} {trend.value}%
                    </div>
                )}
            </div>

            <div className="relative space-y-1">
                <p className="text-[10px] font-black tracking-[0.2em] uppercase text-brand-deep/30 dark:text-brand-cream/30">
                    {title}
                </p>
                <h3 className="text-4xl font-serif font-medium text-brand-deep dark:text-brand-cream">
                    {value}
                </h3>
            </div>
        </GlassCard>
    )
}
