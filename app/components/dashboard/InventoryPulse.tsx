"use client"

import { GlassCard } from "../ui/glass-card"
import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts"
import { Package, AlertTriangle } from "lucide-react"

interface InventoryPulseProps {
    totalItems: number
    lowStockItems: number
    className?: string
    /** Card heading (preset-aware) */
    title?: string
    /** Word after the total count, e.g. "Items" or "SKU" */
    itemsLabelSuffix?: string
    /** Label for the low-stock alert line */
    lowStockLine?: string
    lowStockHint?: string
    healthyHint?: string
    /** When no low-stock lines (preset-aware, e.g. "Fully Stocked" vs "Lines OK") */
    fullyStockedLabel?: string
}

export function InventoryPulse({
    totalItems,
    lowStockItems,
    title = "Inventory Health",
    itemsLabelSuffix = "Items",
    lowStockLine = "Low Stock",
    lowStockHint = "Items need restocking soon to avoid missed sales.",
    healthyHint = "Your inventory is healthy. No immediate actions needed.",
    fullyStockedLabel = "Fully Stocked",
}: InventoryPulseProps) {
    const safeItems = totalItems - lowStockItems
    const data = [
        { name: 'In Stock', value: safeItems, color: '#115f47ff' }, // Brand Green
        { name: 'Low Stock', value: lowStockItems, color: '#d4af37' }, // Brand Gold
    ]

    const healthPercentage = Math.round((safeItems / (totalItems || 1)) * 100)

    return (
        <GlassCard className="p-6 md:p-8 flex flex-col justify-between h-full relative overflow-hidden group">
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                    <div className="rounded-full bg-primary/10 p-2 text-primary">
                        <Package className="w-4 h-4" />
                    </div>
                    <span className="text-sm font-semibold tracking-wide text-foreground">{title}</span>
                </div>
                <span className="rounded-full bg-muted px-2 py-1 text-xs font-bold text-foreground">
                    {totalItems} {itemsLabelSuffix}
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
                        <span className="text-xs font-bold text-foreground">{healthPercentage}%</span>
                    </div>
                </div>

                <div className="flex flex-col gap-3 flex-1">
                    {lowStockItems > 0 ? (
                        <div className="space-y-1">
                            <div className="flex items-center gap-2 text-warning">
                                <AlertTriangle className="w-4 h-4" />
                                <span className="text-sm font-bold">
                                    {lowStockItems} {lowStockLine}
                                </span>
                            </div>
                            <p className="text-xs leading-tight text-muted-foreground">
                                {lowStockHint}
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-1">
                            <p className="text-sm font-bold text-foreground">{fullyStockedLabel}</p>
                            <p className="text-xs leading-tight text-muted-foreground">
                                {healthyHint}
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </GlassCard>
    )
}
