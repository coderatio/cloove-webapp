"use client"

import { cn } from "@/app/lib/utils"
import { Loader2, Sparkles } from "lucide-react"
import { GlassCard } from "@/app/components/ui/glass-card"
import { Button } from "@/app/components/ui/button"
import { CurrencyText } from "@/app/components/shared/CurrencyText"
import type {
    AddToolResultFn,
    AssistantMessagePart,
    InventoryItem,
    ToolApprovalPart,
    ToolSalesChartPart,
} from "../types"

interface ToolRendererProps {
    part: AssistantMessagePart
    addToolResult: AddToolResultFn
}

export function ToolRenderer({ part, addToolResult }: ToolRendererProps) {
    // ─── Inventory Table ─────────────────────────────────────────────────
    if (part.type === "tool-listInventory" && part.state === "output-available") {
        const items = part.output as InventoryItem[]
        return (
            <div className="mt-4 overflow-hidden rounded-2xl border border-brand-accent/10 dark:border-white/10 bg-white/50 dark:bg-black/20 backdrop-blur-sm">
                <table className="w-full text-left text-xs">
                    <thead className="bg-brand-accent/5 dark:bg-white/5">
                        <tr>
                            <th className="p-3 text-brand-deep/40 dark:text-brand-cream/40 font-bold uppercase tracking-wider">
                                Product
                            </th>
                            <th className="p-3 text-brand-deep/40 dark:text-brand-cream/40 font-bold uppercase tracking-wider">
                                Stock
                            </th>
                            <th className="p-3 text-brand-deep/40 dark:text-brand-cream/40 font-bold uppercase tracking-wider text-right">
                                Price
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-brand-accent/5 dark:divide-white/5">
                        {items.map((item) => (
                            <tr
                                key={item.id}
                                className="hover:bg-brand-accent/5 dark:hover:bg-white/5 transition-colors duration-300"
                            >
                                <td className="p-3 font-medium text-brand-deep dark:text-brand-cream">
                                    {item.name}
                                </td>
                                <td className="p-3">
                                    <span
                                        className={cn(
                                            "px-2 py-0.5 rounded-full text-[10px] font-bold",
                                            item.stock > 10
                                                ? "bg-green-500/10 text-green-600 dark:text-green-400"
                                                : item.stock > 0
                                                    ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                                                    : "bg-red-500/10 text-red-600 dark:text-red-400"
                                        )}
                                    >
                                        {item.stock > 0 ? `${item.stock} in stock` : "Out of stock"}
                                    </span>
                                </td>
                                <td className="p-3 text-right font-mono text-brand-gold">
                                    <CurrencyText value={`₦${item.price.toLocaleString()}`} />
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        )
    }

    // ─── Approval Request ────────────────────────────────────────────────
    if (part.type === "tool-requestApproval") {
        const approvalPart = part as ToolApprovalPart
        const isResolved = approvalPart.state === "output-available"
        const approved = isResolved && approvalPart.output?.approved === true
        return (
            <GlassCard className="mt-4 border-brand-gold/20 bg-brand-gold/5 overflow-hidden">
                <div className="p-4">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="h-8 w-8 rounded-full bg-brand-gold/20 flex items-center justify-center text-brand-gold">
                            <Sparkles className="w-4 h-4" />
                        </div>
                        <h4 className="text-sm font-serif font-medium text-brand-gold">
                            {isResolved
                                ? approved
                                    ? "Approved"
                                    : "Declined"
                                : "Approval Required"}
                        </h4>
                    </div>
                    <p className="text-xs text-brand-deep/60 dark:text-brand-cream/60 leading-relaxed mb-4">
                        {approvalPart.input.message}
                    </p>
                    {!isResolved && (
                        <div className="flex gap-2">
                            <Button
                                size="sm"
                                className="flex-1 bg-brand-gold text-brand-deep font-bold hover:bg-brand-gold/90 transition-all duration-300"
                                onClick={() =>
                                    addToolResult({
                                        toolCallId: approvalPart.toolCallId,
                                        tool: "requestApproval",
                                        output: { approved: true },
                                    })
                                }
                            >
                                Approve
                            </Button>
                            <Button
                                size="sm"
                                variant="ghost"
                                className="flex-1 border border-brand-accent/10 dark:border-white/10 text-brand-deep dark:text-brand-cream transition-all duration-300"
                                onClick={() =>
                                    addToolResult({
                                        toolCallId: approvalPart.toolCallId,
                                        tool: "requestApproval",
                                        output: { approved: false },
                                    })
                                }
                            >
                                Decline
                            </Button>
                        </div>
                    )}
                    {isResolved && (
                        <div
                            className={cn(
                                "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium",
                                approved
                                    ? "bg-green-500/10 text-green-600 dark:text-green-400"
                                    : "bg-red-500/10 text-red-600 dark:text-red-400"
                            )}
                        >
                            {approved ? "✓ Approved" : "✗ Declined"}
                        </div>
                    )}
                </div>
            </GlassCard>
        )
    }

    // ─── Sales Chart (visual bar chart) ──────────────────────────────────
    if (part.type === "tool-salesChart" && part.state === "output-available") {
        const chartPart = part as ToolSalesChartPart
        const { title, data, currency } = chartPart.output
        const maxValue = Math.max(...data.map((d) => d.value))
        return (
            <GlassCard className="mt-4 p-4 overflow-hidden">
                <h4 className="text-xs font-bold uppercase tracking-wider text-brand-deep/40 dark:text-brand-cream/40 mb-4">
                    {title}
                </h4>
                <div className="flex items-end gap-2 h-32">
                    {data.map((d) => {
                        const heightPercent = maxValue > 0 ? (d.value / maxValue) * 100 : 0
                        return (
                            <div key={d.label} className="flex-1 flex flex-col items-center gap-1.5">
                                <span className="text-[9px] font-mono text-brand-deep/40 dark:text-brand-cream/40">
                                    <CurrencyText value={`${currency === "NGN" ? "₦" : "$"}${(d.value / 1000).toFixed(0)}k`} />
                                </span>
                                <div className="w-full relative" style={{ height: "80px" }}>
                                    <div
                                        className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[70%] rounded-t-lg bg-linear-to-t from-brand-gold/60 to-brand-gold/30 transition-all duration-500"
                                        style={{ height: `${heightPercent}%` }}
                                    />
                                </div>
                                <span className="text-[10px] font-medium text-brand-deep/50 dark:text-brand-cream/50">
                                    {d.label}
                                </span>
                            </div>
                        )
                    })}
                </div>
            </GlassCard>
        )
    }

    // ─── Generic Tool Fallback ──────────────────────────────────────────
    if (part.type.startsWith("tool-")) {
        const toolPart = part as { type: string; toolCallId: string; state: string; input?: any; output?: any }
        const isLoading = toolPart.state === "loading" || toolPart.state === "pending"

        // Only show a subtle loading indicator while tools are running
        // Don't show tool names or raw output — the AI's text response handles presentation
        if (isLoading) {
            return (
                <div className="flex items-center gap-2 py-2">
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-brand-gold" />
                    <span className="text-xs text-brand-deep/40 dark:text-brand-cream/40">
                        Looking up your data…
                    </span>
                </div>
            )
        }

        // Once complete, render nothing — the AI's text response contains the formatted result
        return null
    }

    return null
}
