"use client"

import { GlassCard } from "../ui/glass-card"
import { Area, AreaChart, ResponsiveContainer, Tooltip } from "recharts"
import { TrendingUp, TrendingDown } from "lucide-react"
import { formatCurrency } from "@/app/lib/formatters"

interface SalesVelocityProps {
    data: { date: string; value: number }[]
    total: string
    trend: string
    currencyCode?: string
    className?: string
}

function ChartTooltip({
    active,
    payload,
    label,
    currencyCode,
}: {
    active?: boolean
    payload?: ReadonlyArray<{ value?: unknown }>
    label?: string | number
    currencyCode: string
}) {
    if (!active || !payload?.length) return null
    const raw = payload[0]
    const value = typeof raw?.value === 'number' ? raw.value : Number(raw?.value) || 0
    return (
        <div className="rounded-xl border border-brand-deep/10 dark:border-white/10 bg-white/95 dark:bg-brand-deep/95 px-3 py-2 shadow-lg backdrop-blur-sm">
            {label != null && (
                <p className="text-[10px] font-bold uppercase tracking-wider text-brand-accent/60 dark:text-brand-cream/60">
                    {label}
                </p>
            )}
            <p className="text-sm font-semibold text-brand-deep dark:text-brand-cream">
                {formatCurrency(value, { currency: currencyCode })}
            </p>
        </div>
    )
}

export function SalesVelocity({ data, total, trend, currencyCode = "NGN", className }: SalesVelocityProps) {
    const isPositive = trend.startsWith("+")

    return (
        <GlassCard className="p-6 md:p-8 flex flex-col h-full relative overflow-hidden">
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
                            content={({ active, payload, label }) => (
                                <ChartTooltip
                                    active={active}
                                    payload={payload}
                                    label={label}
                                    currencyCode={currencyCode}
                                />
                            )}
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
