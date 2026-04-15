"use client"

import { useCallback, useMemo, useState } from "react"
import { CalendarDays, ChevronLeft, ChevronRight, Clock3, Loader2, Receipt } from "lucide-react"
import { format, isSameDay, isToday } from "date-fns"
import type { DateRange } from "react-day-picker"
import { useAuth } from "@/app/components/providers/auth-provider"
import {
    DateRangeFilter,
    type DateRangeQuickPreset,
} from "@/app/components/dashboard/DateRangeFilter"
import { useOrders } from "@/app/domains/orders/hooks/useOrders"
import { formatCurrency, formatDate } from "@/app/lib/formatters"
import { CurrencyText } from "@/app/components/shared/CurrencyText"
import { Button } from "@/app/components/ui/button"
import { OrderDetailsDrawer } from "@/app/domains/orders/components/OrderDetailsDrawer"
import type { Order } from "@/app/domains/orders/types"

const PAGE_SIZE = 20

const SALES_JOURNAL_QUICK_PRESETS: DateRangeQuickPreset[] = [
    "last24h",
    "today",
    "rolling7d",
    "rolling30d",
]

function formatJournalRangeLabel(range: DateRange | undefined): string {
    if (!range?.from) return "Last 24 hours"
    const from = range.from
    const to = range.to ?? range.from
    const spanMs = to.getTime() - from.getTime()
    if (spanMs >= 23 * 60 * 60 * 1000 && spanMs <= 25 * 60 * 60 * 1000) {
        return "Last 24 hours"
    }
    if (to.getTime() === from.getTime()) {
        return format(from, "LLL d, y")
    }
    if (isSameDay(from, to) && isToday(to)) {
        return "Today"
    }
    if (isSameDay(from, to)) {
        return format(from, "LLL d, y")
    }
    return `${format(from, "LLL d, y")} – ${format(to, "LLL d, y")}`
}

export default function SalesModeHistoryPage() {
    const { user } = useAuth()
    const [page, setPage] = useState(1)
    const [date, setDate] = useState<DateRange | undefined>(() => {
        const now = new Date()
        return { from: new Date(now.getTime() - 24 * 60 * 60 * 1000), to: now }
    })
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)

    const setDateAndResetPage = useCallback((next: DateRange | undefined) => {
        setDate(next)
        setPage(1)
    }, [])

    const dateRange = useMemo(() => {
        const now = new Date()
        if (!date?.from) {
            return {
                startDate: new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString(),
                endDate: now.toISOString(),
                label: "Last 24 hours",
            }
        }
        const from = date.from
        const to = date.to ?? date.from
        return {
            startDate: from.toISOString(),
            endDate: to.toISOString(),
            label: formatJournalRangeLabel(date),
        }
    }, [date])

    const { orders, meta, summary, isLoading } = useOrders(page, PAGE_SIZE, {
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
        recordedById: user?.id,
    })

    const totalPages = meta?.lastPage || 1

    return (
        <div className="h-full overflow-auto p-3 md:p-4">
            <div className="mx-auto max-w-6xl space-y-4">
                <div className="rounded-3xl border border-black/10 dark:border-white/10 bg-background/70 backdrop-blur p-4 md:p-5">
                    <div className="flex items-center gap-2 text-brand-accent/70 dark:text-brand-cream/70 text-[11px]">
                        <Clock3 className="h-4 w-4" />
                        <p className="font-bold uppercase tracking-[0.16em]">{dateRange.label}</p>
                    </div>
                    <div className="mt-2">
                        <div>
                            <h1 className="text-xl md:text-2xl font-serif text-brand-deep dark:text-brand-cream">
                                Sales Journal
                            </h1>
                            <p className="mt-1 text-xs md:text-sm text-brand-accent/60 dark:text-brand-cream/60">
                                Showing only sales recorded by {user?.fullName ?? "this staff"}.
                            </p>
                        </div>
                    </div>

                    <div className="mt-4 grid grid-cols-1 md:grid-cols-[1fr_auto] gap-3 md:items-center">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                            <div className="rounded-xl border border-black/10 dark:border-white/10 bg-white/60 dark:bg-white/5 p-3">
                                <p className="text-[10px] uppercase tracking-[0.16em] text-brand-accent/50 dark:text-brand-cream/50 font-bold">
                                    Sales
                                </p>
                                <p className="mt-1 text-lg font-semibold text-brand-deep dark:text-brand-cream">
                                    {summary?.totalOrders ?? meta?.total ?? 0}
                                </p>
                            </div>
                            <div className="rounded-xl border border-black/10 dark:border-white/10 bg-white/60 dark:bg-white/5 p-3">
                                <p className="text-[10px] uppercase tracking-[0.16em] text-brand-accent/50 dark:text-brand-cream/50 font-bold">
                                    Revenue
                                </p>
                                <p className="mt-1 text-lg font-semibold text-brand-deep dark:text-brand-cream">
                                    <CurrencyText value={formatCurrency(summary?.totalRevenue ?? 0)} />
                                </p>
                            </div>
                            <div className="rounded-xl border border-black/10 dark:border-white/10 bg-white/60 dark:bg-white/5 p-3">
                                <p className="text-[10px] uppercase tracking-[0.16em] text-brand-accent/50 dark:text-brand-cream/50 font-bold">
                                    Avg Sale
                                </p>
                                <p className="mt-1 text-lg font-semibold text-brand-deep dark:text-brand-cream">
                                    <CurrencyText value={formatCurrency(summary?.averageOrderValue ?? 0)} />
                                </p>
                            </div>
                        </div>

                        <div className="flex flex-wrap items-end md:items-center gap-2">
                            <div className="min-w-0 w-full sm:w-auto sm:min-w-[280px] md:max-w-md">
                                <label className="text-[10px] uppercase tracking-[0.14em] font-bold text-brand-accent/50 dark:text-brand-cream/50 block mb-1">
                                    Date range
                                </label>
                                <DateRangeFilter
                                    date={date}
                                    setDate={setDateAndResetPage}
                                    quickPresets={SALES_JOURNAL_QUICK_PRESETS}
                                    quickFilterPlaceholder="Quick filter"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="rounded-2xl border border-black/10 dark:border-white/10 bg-background/70 backdrop-blur overflow-hidden">
                    <div className="px-4 md:px-5 py-2.5 border-b border-black/5 dark:border-white/10 flex items-center gap-2 text-[11px] uppercase tracking-[0.14em] font-bold text-brand-accent/45 dark:text-brand-cream/45">
                        <CalendarDays className="h-3.5 w-3.5" />
                        Sales Entries
                    </div>

                    {isLoading ? (
                        <div className="h-44 flex items-center justify-center text-brand-accent/60 dark:text-brand-cream/60">
                            <Loader2 className="h-5 w-5 animate-spin mr-2" />
                            Loading sales...
                        </div>
                    ) : orders.length === 0 ? (
                        <div className="h-44 flex flex-col items-center justify-center text-center px-4">
                            <Receipt className="h-8 w-8 text-brand-accent/30 dark:text-brand-cream/30 mb-2" />
                            <p className="text-sm text-brand-accent/60 dark:text-brand-cream/60">
                                No sales found for the selected period.
                            </p>
                        </div>
                    ) : (
                        <div className="divide-y divide-black/5 dark:divide-white/10">
                            {orders.map((order) => (
                                <button
                                    key={order.id}
                                    type="button"
                                    onClick={() => setSelectedOrder(order)}
                                    className="w-full text-left px-4 py-3 md:px-5 md:py-3.5 flex items-center justify-between gap-3 hover:bg-black/3 dark:hover:bg-white/4 transition-colors"
                                >
                                    <div className="min-w-0">
                                        <p className="text-sm font-semibold text-brand-deep dark:text-brand-cream truncate">
                                            {order.customer}
                                        </p>
                                        <p className="text-xs text-brand-accent/55 dark:text-brand-cream/55 truncate">
                                            #{order.shortCode ?? order.id.slice(0, 6)} · {order.summary}
                                        </p>
                                    </div>
                                    <div className="text-right shrink-0">
                                        <p className="text-sm font-semibold text-brand-deep dark:text-brand-cream">
                                            <CurrencyText value={formatCurrency(order.totalAmount, { currency: order.currency || "NGN" })} />
                                        </p>
                                        <p className="text-[11px] text-brand-accent/55 dark:text-brand-cream/55">
                                            {formatDate(order.date, "MMM d, h:mm a")}
                                        </p>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {totalPages > 1 && (
                    <div className="flex items-center justify-center gap-2 pb-2">
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={page === 1}
                            onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                        >
                            <ChevronLeft className="h-4 w-4 mr-1" />
                            Previous
                        </Button>
                        <span className="text-xs text-brand-accent/60 dark:text-brand-cream/60 px-2">
                            Page {page} of {totalPages}
                        </span>
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={page >= totalPages}
                            onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                        >
                            Next
                            <ChevronRight className="h-4 w-4 ml-1" />
                        </Button>
                    </div>
                )}
            </div>

            <OrderDetailsDrawer
                order={selectedOrder}
                open={!!selectedOrder}
                onOpenChange={(open) => {
                    if (!open) setSelectedOrder(null)
                }}
            />
        </div>
    )
}
