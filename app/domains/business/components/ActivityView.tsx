"use client"

import * as React from "react"
import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { ChevronRight, Sparkles } from "lucide-react"
import { PageTransition } from "@/app/components/layout/page-transition"
import { ManagementHeader } from "@/app/components/shared/ManagementHeader"
import { FilterPopover } from "@/app/components/shared/FilterPopover"
import { Pagination } from "@/app/components/shared/Pagination"
import { GlassCard } from "@/app/components/ui/glass-card"
import { StoreContextSelector } from "@/app/components/shared/StoreContextSelector"
import { DateRangeFilter } from "@/app/components/dashboard/DateRangeFilter"
import { ActivityIcon, type ActivityItem } from "@/app/components/dashboard/ActivityStream"
import { useActivities } from "../hooks/useActivities"
import { ALL_STORES_ID } from "@/app/domains/stores/data/storesMocks"
import { useMediaQuery } from "@/app/hooks/useMediaQuery"
import { DateRange } from "react-day-picker"
import { subDays } from "date-fns"
import { cn } from "@/app/lib/utils"
import { toast } from "sonner"
import { ActivityDetailsDrawer } from "@/app/components/shared/ActivityDetailsDrawer"

const PAGE_SIZE = 15

const ACTIVITY_TYPE_GROUPS = [
    {
        title: "Activity type",
        options: [
            { label: "Sales", value: "Sales" },
            { label: "Payments", value: "Payments" },
            { label: "Inventory", value: "Inventory" },
            { label: "Debt", value: "Debt" },
            { label: "Customers", value: "Customers" },
            { label: "Withdrawals", value: "Withdrawals" },
            { label: "Deposits", value: "Deposits" },
            { label: "Expenses", value: "Expenses" },
        ],
    },
] as const

const TYPE_TO_EVENT_TYPES: Record<string, string[]> = {
    Sales: ["ORDER_CREATED", "ORDER_UPDATED", "ORDER_CANCELLED", "ORDER_REFUNDED"],
    Payments: ["PAYMENT_RECEIVED", "PAYMENT_MARKED_PAID", "PAYMENT_MARKED_PARTIAL"],
    Inventory: ["INVENTORY_INCREASED", "INVENTORY_DECREASED"],
    Debt: ["DEBT_CREATED", "DEBT_REPAYMENT", "DEBT_CLEARED"],
    Customers: ["CUSTOMER_CREATED", "CUSTOMER_UPDATED"],
    Withdrawals: ["WITHDRAWAL_REQUESTED", "WITHDRAWAL_COMPLETED", "WITHDRAWAL_FAILED"],
    Deposits: ["WALLET_DEPOSIT"],
    Expenses: ["EXPENSE_RECORDED"],
}

function ActivityRow({
    item,
    onClick,
}: {
    item: ActivityItem
    onClick?: (item: ActivityItem) => void
}) {
    return (
        <button
            type="button"
            onClick={() => onClick?.(item)}
            className="block w-full text-left"
        >
            <div className="flex items-center gap-3.5 p-3 hover:bg-white/50 dark:hover:bg-white/[0.03] rounded-2xl transition-all duration-300 group cursor-pointer">
                <ActivityIcon type={item.type} />
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-brand-deep dark:text-brand-cream truncate group-hover:text-brand-green dark:group-hover:text-brand-gold transition-colors duration-300">
                        {item.description}
                    </p>
                    <p className="text-xs text-brand-accent/40 dark:text-brand-cream/40 truncate mt-0.5">
                        {item.customer && (
                            <span className="text-brand-accent/60 dark:text-brand-cream/60 font-medium">
                                {item.customer} •{" "}
                            </span>
                        )}
                        {item.timeAgo}
                    </p>
                </div>
                <div className="flex items-center gap-2.5">
                    {item.amount && (
                        <span
                            className={cn(
                                "text-sm font-bold whitespace-nowrap tabular-nums",
                                (item.type === "sale" || item.type === "payment" || item.type === "deposit")
                                    ? "text-brand-green dark:text-brand-gold"
                                    : (item.type === "withdrawal" || item.type === "debt")
                                      ? "text-rose-600 dark:text-rose-400"
                                      : "text-brand-deep dark:text-brand-cream"
                            )}
                        >
                            {(item.type === "withdrawal" || item.type === "debt") ? "-" : (item.type === "sale" || item.type === "payment" || item.type === "deposit") ? "+" : ""}
                            {item.amount}
                        </span>
                    )}
                    <ChevronRight className="w-3.5 h-3.5 text-brand-accent/15 dark:text-brand-gold/20 group-hover:text-brand-green dark:group-hover:text-brand-gold group-hover:translate-x-0.5 transition-all duration-300 shrink-0" />
                </div>
            </div>
        </button>
    )
}

function ActivityTable({
    activities,
    onActivityClick,
}: {
    activities: ActivityItem[]
    onActivityClick?: (item: ActivityItem) => void
}) {
    return (
        <div className="overflow-x-auto">
            <table className="w-full min-w-[600px]">
                <thead>
                    <tr className="border-b border-brand-deep/8 dark:border-white/5">
                        <th className="text-left py-3.5 px-4 text-[10px] font-bold uppercase tracking-[0.12em] text-brand-accent/50 dark:text-brand-cream/40 w-14" />
                        <th className="text-left py-3.5 px-4 text-[10px] font-bold uppercase tracking-[0.12em] text-brand-accent/50 dark:text-brand-cream/40">
                            Activity
                        </th>
                        <th className="text-left py-3.5 px-4 text-[10px] font-bold uppercase tracking-[0.12em] text-brand-accent/50 dark:text-brand-cream/40">
                            Amount
                        </th>
                        <th className="text-left py-3.5 px-4 text-[10px] font-bold uppercase tracking-[0.12em] text-brand-accent/50 dark:text-brand-cream/40 w-28">
                            When
                        </th>
                        <th className="w-12 py-3.5 px-4" aria-hidden />
                    </tr>
                </thead>
                <tbody className="divide-y divide-brand-deep/[0.04] dark:divide-white/[0.04]">
                    {activities.map((item, index) => (
                        <motion.tr
                            key={item.id}
                            role="button"
                            tabIndex={0}
                            initial={{ opacity: 0, y: 4 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.02, duration: 0.3, ease: "easeOut" }}
                            className="group cursor-pointer transition-all duration-300 hover:bg-white/50 dark:hover:bg-white/[0.03]"
                            onClick={() => onActivityClick?.(item)}
                            onKeyDown={(e) => {
                                if (e.key === "Enter" || e.key === " ") {
                                    e.preventDefault()
                                    onActivityClick?.(item)
                                }
                            }}
                        >
                            <td className="py-3.5 px-4">
                                <ActivityIcon type={item.type} />
                            </td>
                            <td className="py-3.5 px-4">
                                <div>
                                    <p className="text-sm font-semibold text-brand-deep dark:text-brand-cream group-hover:text-brand-green dark:group-hover:text-brand-gold transition-colors duration-300">
                                        {item.description}
                                    </p>
                                    {item.customer && (
                                        <p className="text-xs text-brand-accent/40 dark:text-brand-cream/40 mt-0.5">
                                            {item.customer}
                                        </p>
                                    )}
                                </div>
                            </td>
                            <td className="py-3.5 px-4">
                                {item.amount && (
                                    <span
                                        className={cn(
                                            "text-sm font-bold tabular-nums",
                                            (item.type === "sale" || item.type === "payment" || item.type === "deposit")
                                                ? "text-brand-green dark:text-brand-gold"
                                                : (item.type === "withdrawal" || item.type === "debt")
                                                  ? "text-rose-600 dark:text-rose-400"
                                                  : "text-brand-deep dark:text-brand-cream"
                                        )}
                                    >
                                        {(item.type === "withdrawal" || item.type === "debt") ? "-" : (item.type === "sale" || item.type === "payment" || item.type === "deposit") ? "+" : ""}
                                        {item.amount}
                                    </span>
                                )}
                            </td>
                            <td className="py-3.5 px-4">
                                <span className="text-xs text-brand-accent/50 dark:text-brand-cream/40 whitespace-nowrap">
                                    {item.timeAgo}
                                </span>
                            </td>
                            <td className="py-3.5 px-4 w-12">
                                <ChevronRight className="w-3.5 h-3.5 text-brand-accent/15 dark:text-brand-gold/20 group-hover:text-brand-green dark:group-hover:text-brand-gold group-hover:translate-x-0.5 transition-all duration-300 inline-block" />
                            </td>
                        </motion.tr>
                    ))}
                </tbody>
            </table>
        </div>
    )
}

function ActivityCards({
    activities,
    onActivityClick,
}: {
    activities: ActivityItem[]
    onActivityClick?: (item: ActivityItem) => void
}) {
    return (
        <div className="space-y-2">
            {activities.map((item, index) => (
                <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.03, duration: 0.2 }}
                >
                    <ActivityRow item={item} onClick={onActivityClick} />
                </motion.div>
            ))}
        </div>
    )
}

function ActivityEmptyState({ hasFilters }: { hasFilters: boolean }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="flex flex-col items-center justify-center py-16 px-8 text-center"
        >
            <div className="h-20 w-20 rounded-full bg-brand-deep/5 dark:bg-white/5 flex items-center justify-center mb-6">
                <Sparkles className="w-10 h-10 text-brand-gold/50" />
            </div>
            <h3 className="font-serif text-xl text-brand-deep dark:text-brand-cream mb-2">
                {hasFilters ? "No activities match your filters" : "No activity yet"}
            </h3>
            <p className="text-sm text-brand-accent/60 dark:text-brand-cream/40 max-w-sm">
                {hasFilters
                    ? "Try adjusting the date range, store, or activity type."
                    : "Sales, inventory changes, and payments will appear here."}
            </p>
        </motion.div>
    )
}

function ActivitySkeleton() {
    return (
        <div className="space-y-2">
            {Array.from({ length: 8 }).map((_, i) => (
                <div
                    key={i}
                    className="flex items-center gap-4 p-3 rounded-2xl bg-white/30 dark:bg-white/5 animate-pulse"
                >
                    <div className="h-10 w-10 rounded-full bg-brand-deep/10 dark:bg-white/10" />
                    <div className="flex-1 space-y-2">
                        <div className="h-4 w-32 rounded bg-brand-deep/10 dark:bg-white/10" />
                        <div className="h-3 w-24 rounded bg-brand-deep/5 dark:bg-white/5" />
                    </div>
                    <div className="h-4 w-16 rounded bg-brand-deep/10 dark:bg-white/10" />
                </div>
            ))}
        </div>
    )
}

export function ActivityView() {
    const isDesktop = useMediaQuery("(min-width: 768px)")
    const [page, setPage] = useState(1)
    const [storeId, setStoreId] = useState<string>(ALL_STORES_ID)
    const [date, setDate] = useState<DateRange | undefined>({
        from: subDays(new Date(), 30),
        to: new Date(),
    })
    const [selectedTypeFilters, setSelectedTypeFilters] = useState<string[]>([])
    const [selectedActivity, setSelectedActivity] = useState<ActivityItem | null>(null)

    const dateRange = { from: date?.from, to: date?.to }
    const typeParam = selectedTypeFilters.flatMap((cat) => TYPE_TO_EVENT_TYPES[cat] ?? [])

    const { activities, meta, isLoading, error } = useActivities({
        page,
        limit: PAGE_SIZE,
        storeId,
        type: typeParam,
        dateRange,
    })

    useEffect(() => {
        if (error) {
            const msg = error instanceof Error ? error.message : "Failed to load activities"
            toast.error(msg)
        }
    }, [error])

    const totalPages = meta?.lastPage ?? 1
    const hasFilters = selectedTypeFilters.length > 0 || date?.from || date?.to || (storeId && storeId !== ALL_STORES_ID)

    return (
        <PageTransition>
            <div className="max-w-5xl mx-auto space-y-8 pb-20">
                <ManagementHeader
                    title="Activity"
                    description="All sales, inventory, and payment events across your business."
                    extraActions={
                        <div className="ml-auto w-fit flex flex-wrap md:flex-nowrap items-center gap-3">
                            <StoreContextSelector
                                value={storeId}
                                onChange={(id) => {
                                    setStoreId(id)
                                    setPage(1)
                                }}
                                className="w-full sm:w-[180px] md:w-[200px] shrink-0"
                            />
                            <DateRangeFilter
                                date={date}
                                setDate={(range) => {
                                    setDate(range)
                                    setPage(1)
                                }}
                                className="min-w-0 shrink-0"
                            />
                            <FilterPopover
                                groups={ACTIVITY_TYPE_GROUPS.map((g) => ({ title: g.title, options: [...g.options] }))}
                                selectedValues={selectedTypeFilters}
                                onSelectionChange={(values) => {
                                    setSelectedTypeFilters(values)
                                    setPage(1)
                                }}
                                onClear={() => {
                                    setSelectedTypeFilters([])
                                    setPage(1)
                                }}
                                iconOnly
                            />
                        </div>
                    }
                />

                <GlassCard className="rounded-[32px] py-4 md:py-6 overflow-hidden">
                    {isLoading ? (
                        <ActivitySkeleton />
                    ) : activities.length === 0 ? (
                        <ActivityEmptyState hasFilters={!!hasFilters} />
                    ) : isDesktop ? (
                        <ActivityTable
                            activities={activities}
                            onActivityClick={setSelectedActivity}
                        />
                    ) : (
                        <ActivityCards
                            activities={activities}
                            onActivityClick={setSelectedActivity}
                        />
                    )}

                    {activities.length > 0 && (
                        <Pagination
                            currentPage={page}
                            totalPages={totalPages}
                            onPageChange={setPage}
                            isLoading={isLoading}
                            className="mt-6 px-4 md:px-6"
                        />
                    )}
                </GlassCard>
            </div>

            <ActivityDetailsDrawer
                activity={selectedActivity}
                open={!!selectedActivity}
                onOpenChange={(open) => {
                    if (!open) setSelectedActivity(null)
                }}
            />
        </PageTransition>
    )
}
