"use client"

import { GlassCard } from "../ui/glass-card"
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis } from "recharts"
import { TrendingUp, TrendingDown } from "lucide-react"

interface SalesVelocityProps {
    data: { date: string; value: number }[]
    total: string
    trend: string
    className?: string
}

export function SalesVelocity({ data, total, trend, className }: SalesVelocityProps) {
    const isPositive = trend.startsWith("+")

    return (
        <GlassCard className="rounded-[24px] p-6 md:p-8 flex flex-col h-full relative overflow-hidden">
            <div className="flex items-center justify-between mb-6 z-10">
                <div className="space-y-1">
                    <span className="text-sm font-semibold text-brand-deep dark:text-brand-cream tracking-wide flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-brand-green dark:text-brand-gold" />
                        Sales Velocity
                    </span>
                    <h3 className="text-2xl font-serif text-brand-deep dark:text-brand-cream font-medium">
                        {total}
                    </h3>
                </div>
                <div className={`
                    px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1
                    ${isPositive
                        ? 'bg-brand-green/10 text-brand-green dark:bg-brand-green/20 dark:text-brand-gold'
                        : 'bg-red-500/10 text-red-600 dark:bg-red-500/20 dark:text-red-400'}
                `}>
                    {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                    {trend}
                </div>
            </div>

            <div className="h-32 -mx-4 -mb-4">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data}>
                        <defs>
                            <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#d4af37" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#d4af37" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <Tooltip
                            contentStyle={{
                                background: 'rgba(255, 255, 255, 0.8)',
                                borderRadius: '12px',
                                border: 'none',
                                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                                fontSize: '12px'
                            }}
                            cursor={{ stroke: '#d4af37', strokeWidth: 1, strokeDasharray: '3 3' }}
                        />
                        <Area
                            type="monotone"
                            dataKey="value"
                            stroke="#d4af37"
                            strokeWidth={2}
                            fillOpacity={1}
                            fill="url(#colorSales)"
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </GlassCard>
    )
}
