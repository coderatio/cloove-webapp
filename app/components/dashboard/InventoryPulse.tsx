"use client"

import { GlassCard } from "../ui/glass-card"
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts"
import { Package, AlertTriangle } from "lucide-react"

interface InventoryPulseProps {
    totalItems: number
    lowStockItems: number
    className?: string
}

export function InventoryPulse({ totalItems, lowStockItems, className }: InventoryPulseProps) {
    const safeItems = totalItems - lowStockItems
    const data = [
        { name: 'In Stock', value: safeItems, color: '#115f47ff' }, // Brand Green
        { name: 'Low Stock', value: lowStockItems, color: '#d4af37' }, // Brand Gold
    ]

    const healthPercentage = Math.round((safeItems / (totalItems || 1)) * 100)

    return (
        <GlassCard className="rounded-[24px] p-6 md:p-8 flex flex-col justify-between h-full relative overflow-hidden group">
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                    <div className="p-2 bg-brand-green/10 text-brand-green dark:bg-brand-green/20 dark:text-brand-cream rounded-full">
                        <Package className="w-4 h-4" />
                    </div>
                    <span className="text-sm font-semibold text-brand-deep dark:text-brand-cream tracking-wide">Inventory Health</span>
                </div>
                <span className="text-xs font-bold bg-brand-deep/5 dark:bg-white/10 px-2 py-1 rounded-full text-brand-deep dark:text-brand-cream">
                    {totalItems} Items
                </span>
            </div>

            <div className="flex items-center gap-6">
                <div className="h-24 w-24 relative flex-shrink-0">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={data}
                                cx="50%"
                                cy="50%"
                                innerRadius={35}
                                outerRadius={45}
                                paddingAngle={5}
                                dataKey="value"
                                stroke="none"
                            >
                                {data.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Pie>
                        </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex items-center justify-center flex-col">
                        <span className="text-xs font-bold text-brand-deep dark:text-brand-cream">{healthPercentage}%</span>
                    </div>
                </div>

                <div className="flex flex-col gap-3 flex-1">
                    {lowStockItems > 0 ? (
                        <div className="space-y-1">
                            <div className="flex items-center gap-2 text-warning">
                                <AlertTriangle className="w-4 h-4" />
                                <span className="text-sm font-bold">{lowStockItems} Low Stock</span>
                            </div>
                            <p className="text-xs text-brand-accent/60 dark:text-brand-cream/60 leading-tight">
                                Items need restocking soon to avoid missed sales.
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-1">
                            <p className="text-sm font-bold text-brand-green dark:text-brand-gold">Fully Stocked</p>
                            <p className="text-xs text-brand-accent/60 dark:text-brand-cream/60 leading-tight">
                                Your inventory is healthy. No immediate actions needed.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </GlassCard>
    )
}
