"use client"

import * as React from "react"
import { useState, useEffect, useMemo } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { ChevronRight, Sparkles } from "lucide-react"
import { PageTransition } from "@/app/components/layout/page-transition"
import { ManagementHeader } from "@/app/components/shared/ManagementHeader"
import { FilterPopover } from "@/app/components/shared/FilterPopover"
import { Pagination } from "@/app/components/shared/Pagination"
import { GlassCard } from "@/app/components/ui/glass-card"
import { Button } from "@/app/components/ui/button"
import { StoreContextSelector } from "@/app/components/shared/StoreContextSelector"
import { DateRangeFilter } from "@/app/components/dashboard/DateRangeFilter"
import { ActivityIcon, type ActivityItem } from "@/app/components/dashboard/ActivityStream"
import { useActivities } from "../hooks/useActivities"
import { useOrder } from "@/app/domains/orders/hooks/useOrders"
import { OrderDetailsDrawer } from "@/app/domains/orders/components/OrderDetailsDrawer"
import { ALL_STORES_ID } from "@/app/domains/stores/data/storesMocks"
import { useMediaQuery } from "@/app/hooks/useMediaQuery"
import { DateRange } from "react-day-picker"
import { subDays } from "date-fns"
import { cn } from "@/app/lib/utils"
import { toast } from "sonner"
import {
    useFinanceTransactions,
    useTransaction,
    useRequeryTransaction,
    type FinanceTransactionRow,
} from "@/app/domains/finance/hooks/useFinance"
import { useBusiness } from "@/app/components/BusinessProvider"
import { useStores } from "@/app/domains/stores/providers/StoreProvider"
import { TransactionDetailsDrawer } from "@/app/components/shared/TransactionDetailsDrawer"
import { formatCurrency } from "@/app/lib/formatters"
import { useQueryClient } from "@tanstack/react-query"

const PAGE_SIZE = 20

const ACTIVITY_TYPE_GROUPS = [
    {
        title: "Activity type",
        options: [
            { label: "Sales", value: "Sales" },
            { label: "Payments", value: "Payments" },
            { label: "Inventory", value: "Inventory" },
            { label: "Debt", value: "Debt" },
        ],
    },
] as const

const TYPE_TO_EVENT_TYPES: Record<string, string[]> = {
    Sales: ["ORDER_CREATED", "ORDER_UPDATED", "ORDER_CANCELLED", "ORDER_REFUNDED"],
    Payments: ["PAYMENT_RECEIVED", "PAYMENT_MARKED_PAID", "PAYMENT_MARKED_PARTIAL"],
    Inventory: ["INVENTORY_INCREASED", "INVENTORY_DECREASED"],
    Debt: ["DEBT_CREATED", "DEBT_REPAYMENT", "DEBT_CLEARED"],
}

const ACTIVITY_PAGE_TRANSACTIONS_LIMIT = 15

function transactionToActivityItem(tx: FinanceTransactionRow, currency: string): ActivityItem {
    const amountStr = formatCurrency(tx.amount, { currency })
    let type: ActivityItem["type"]
    let description: string
    if (tx.withdrawal) {
        type = "withdrawal"
        description = tx.withdrawal.accountName
            ? `Withdrawal to ${tx.withdrawal.accountName}`
            : "Withdrawal"
    } else if (tx.type === "Credit") {
        type = tx.sale ? "payment" : "deposit"
        description = tx.sale
            ? `Payment from ${tx.sale.customerName ?? tx.customer}`
            : tx.customer || "Deposit"
    } else {
        type = "debt"
        description = tx.method || tx.customer || "Debit"
    }
    return {
        id: `tx-${tx.id}`,
        type,
        description,
        amount: amountStr,
        timeAgo: tx.dateLabel ?? tx.date ?? "",
        customer: tx.sale?.customerName ?? (type === "deposit" ? undefined : tx.customer),
        txId: tx.id,
        href: "/finance",
        timestamp: tx.createdAt,
    }
}

function ActivityRow({
    item,
    onOrderClick,
    onFinanceClick,
}: {
    item: ActivityItem
    onOrderClick?: (orderId: string) => void
    onFinanceClick?: (txId: string) => void
}) {
    const content = (
        <div className="flex items-center gap-4 p-3 hover:bg-white/60 dark:hover:bg-white/5 rounded-2xl transition-all group">
            <ActivityIcon type={item.type} />
            <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-brand-deep dark:text-brand-cream truncate group-hover:text-brand-green dark:group-hover:text-brand-gold transition-colors">
                    {item.description}
                </p>
                <p className="text-xs text-brand-accent/40 dark:text-brand-cream/40 truncate">
                    {item.customer && (
                        <span className="text-brand-accent/60 dark:text-brand-cream/80 font-medium">
                            {item.customer} •{" "}
                        </span>
                    )}
                    {item.timeAgo}
                </p>
            </div>
            <div className="flex items-center gap-3">
                {item.amount && (
                    <span
                        className={cn(
                            "text-sm font-bold whitespace-nowrap",
                            (item.type === "sale" || item.type === "payment" || item.type === "deposit")
                                ? "text-brand-green dark:text-brand-gold"
                                : item.type === "withdrawal" || item.type === "debt"
                                  ? "text-rose-600 dark:text-rose-400"
                                  : "text-brand-deep dark:text-brand-cream"
                        )}
                    >
                        {item.type === "withdrawal" || item.type === "debt" ? "-" : item.type === "sale" || item.type === "payment" || item.type === "deposit" ? "+" : ""}
                        {item.amount}
                    </span>
                )}
                <ChevronRight className="w-4 h-4 text-brand-accent/20 dark:text-brand-gold/30 group-hover:text-brand-green dark:group-hover:text-brand-gold transition-colors shrink-0" />
            </div>
        </div>
    )

    if (item.type === "sale" && item.orderId && onOrderClick) {
        return (
            <button
                type="button"
                onClick={() => onOrderClick(item.orderId!)}
                className="block w-full text-left"
            >
                {content}
            </button>
        )
    }
    if (item.txId && onFinanceClick) {
        return (
            <button
                type="button"
                onClick={() => onFinanceClick(item.txId!)}
                className="block w-full text-left"
            >
                {content}
            </button>
        )
    }
    if (item.href) {
        return (
            <Link href={item.href} className="block">
                {content}
            </Link>
        )
    }
    return <div>{content}</div>
}

function ActivityTable({
    activities,
    onOrderClick,
    onFinanceClick,
}: {
    activities: ActivityItem[]
    onOrderClick?: (orderId: string) => void
    onFinanceClick?: (txId: string) => void
}) {
    return (
        <div className="overflow-x-auto">
            <table className="w-full min-w-[600px]">
                <thead>
                    <tr className="border-b border-brand-deep/5 dark:border-white/5">
                        <th className="text-left py-3 px-3 text-[10px] font-bold uppercase tracking-widest text-brand-accent/60 dark:text-brand-cream/60 w-14">
                            Type
                        </th>
                        <th className="text-left py-3 px-3 text-[10px] font-bold uppercase tracking-widest text-brand-accent/60 dark:text-brand-cream/60">
                            Description
                        </th>
                        <th className="text-right py-3 px-3 text-[10px] font-bold uppercase tracking-widest text-brand-accent/60 dark:text-brand-cream/60">
                            Amount
                        </th>
                        <th className="text-right py-3 px-3 text-[10px] font-bold uppercase tracking-widest text-brand-accent/60 dark:text-brand-cream/60 w-20">
                            Time
                        </th>
                        <th className="w-10 py-3 px-3" aria-hidden />
                    </tr>
                </thead>
                <tbody>
                    {activities.map((item, index) => {
                        const isOrderClickable = !!(item.orderId && onOrderClick)
                        const isFinanceClickable = !!(item.txId && onFinanceClick)
                        const isClickable = isOrderClickable || isFinanceClickable
                        const handleClick = isOrderClickable
                            ? () => onOrderClick!(item.orderId!)
                            : isFinanceClickable
                              ? () => onFinanceClick!(item.txId!)
                              : undefined
                        return (
                            <motion.tr
                                key={item.id}
                                role={isClickable ? "button" : undefined}
                                tabIndex={isClickable ? 0 : undefined}
                                initial={{ opacity: 0, y: 4 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.02, duration: 0.2 }}
                                className={cn(
                                    "border-b border-brand-deep/5 dark:border-white/5 transition-colors",
                                    isClickable && "cursor-pointer hover:bg-white/40 dark:hover:bg-white/5"
                                )}
                                onClick={handleClick}
                                onKeyDown={
                                    isClickable && handleClick
                                        ? (e) => {
                                              if (e.key === "Enter" || e.key === " ") {
                                                  e.preventDefault()
                                                  handleClick()
                                              }
                                          }
                                        : undefined
                                }
                            >
                                <td className="py-3 px-3">
                                    <ActivityIcon type={item.type} />
                                </td>
                                <td className="py-3 px-3">
                                    <div>
                                        <p className="text-sm font-semibold text-brand-deep dark:text-brand-cream">
                                            {item.description}
                                        </p>
                                        {item.customer && (
                                            <p className="text-xs text-brand-accent/50 dark:text-brand-cream/50">
                                                {item.customer}
                                            </p>
                                        )}
                                    </div>
                                </td>
                                <td className="py-3 px-3 text-right">
                                    {item.amount && (
                                        <span
                                            className={cn(
                                                "text-sm font-bold",
                                                (item.type === "sale" || item.type === "payment" || item.type === "deposit")
                                                    ? "text-brand-green dark:text-brand-gold"
                                                    : (item.type === "withdrawal" || item.type === "debt")
                                                      ? "text-rose-600 dark:text-rose-400"
                                                      : "text-brand-deep dark:text-brand-cream"
                                            )}
                                        >
                                            {(item.type === "withdrawal" || item.type === "debt" ? "-" : item.type === "sale" || item.type === "payment" || item.type === "deposit" ? "+" : "")}
                                            {item.amount}
                                        </span>
                                    )}
                                </td>
                                <td className="py-3 px-3 text-right text-xs text-brand-accent/60 dark:text-brand-cream/60">
                                    {item.timeAgo}
                                </td>
                                <td className="py-3 px-3 text-right w-10">
                                    <ChevronRight className="w-4 h-4 text-brand-accent/20 dark:text-brand-gold/30 inline-block" />
                                </td>
                            </motion.tr>
                        )
                    })}
                </tbody>
            </table>
        </div>
    )
}

function ActivityCards({
    activities,
    onOrderClick,
    onFinanceClick,
}: {
    activities: ActivityItem[]
    onOrderClick?: (orderId: string) => void
    onFinanceClick?: (txId: string) => void
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
                    <ActivityRow
                        item={item}
                        onOrderClick={onOrderClick}
                        onFinanceClick={onFinanceClick}
                    />
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
    const queryClient = useQueryClient()
    const { activeBusiness } = useBusiness()
    const { stores } = useStores()
    const [page, setPage] = useState(1)
    const [storeId, setStoreId] = useState<string>(ALL_STORES_ID)
    const [date, setDate] = useState<DateRange | undefined>({
        from: subDays(new Date(), 30),
        to: new Date(),
    })
    const [selectedTypeFilters, setSelectedTypeFilters] = useState<string[]>([])
    const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null)
    const [selectedTxId, setSelectedTxId] = useState<string | null>(null)

    const dateRange = { from: date?.from, to: date?.to }
    const typeParam = selectedTypeFilters.flatMap((cat) => TYPE_TO_EVENT_TYPES[cat] ?? [])
    const currency = activeBusiness?.currency ?? "NGN"

    const { activities: businessActivities, meta, isLoading, error } = useActivities({
        page,
        limit: PAGE_SIZE,
        storeId,
        type: typeParam,
        dateRange,
        limitPerType: typeParam.length === 0 ? 3 : undefined,
    })

    const { transactions: transactionsList } = useFinanceTransactions(
        storeId === ALL_STORES_ID ? undefined : storeId,
        1,
        ACTIVITY_PAGE_TRANSACTIONS_LIMIT
    )
    const transactions = transactionsList ?? []

    const activities = useMemo(() => {
        if (page !== 1) return businessActivities
        const txItems: ActivityItem[] = transactions.map((tx) =>
            transactionToActivityItem(tx, currency)
        )
        const withSortKey: { sortKey: number; item: ActivityItem }[] = [
            ...businessActivities.map((a) => ({
                sortKey: a.timestamp ? new Date(a.timestamp).getTime() : 0,
                item: a,
            })),
            ...txItems.map((a) => ({
                sortKey: a.timestamp ? new Date(a.timestamp).getTime() : 0,
                item: a,
            })),
        ]
        const merged = withSortKey
            .sort((x, y) => y.sortKey - x.sortKey)
            .map((x) => x.item)
        return merged.slice(0, PAGE_SIZE)
    }, [page, businessActivities, transactions, currency])

    const { order, isLoading: orderLoading } = useOrder(selectedOrderId)
    const { transaction, isLoading: transactionLoading } = useTransaction(selectedTxId)
    const { mutateAsync: requeryTx, isPending: isRequerying } = useRequeryTransaction()

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

                <GlassCard className="rounded-[32px] p-4 md:p-6 overflow-hidden">
                    {isLoading ? (
                        <ActivitySkeleton />
                    ) : activities.length === 0 ? (
                        <ActivityEmptyState hasFilters={!!hasFilters} />
                    ) : isDesktop ? (
                        <ActivityTable
                            activities={activities}
                            onOrderClick={(id) => setSelectedOrderId(id)}
                            onFinanceClick={(id) => setSelectedTxId(id)}
                        />
                    ) : (
                        <ActivityCards
                            activities={activities}
                            onOrderClick={(id) => setSelectedOrderId(id)}
                            onFinanceClick={(id) => setSelectedTxId(id)}
                        />
                    )}

                    {activities.length > 0 && (
                        <Pagination
                            currentPage={page}
                            totalPages={totalPages}
                            onPageChange={setPage}
                            isLoading={isLoading}
                            className="mt-6"
                        />
                    )}
                </GlassCard>
            </div>

            <OrderDetailsDrawer
                order={order ?? null}
                open={!!selectedOrderId}
                onOpenChange={(open) => {
                    if (!open) setSelectedOrderId(null)
                }}
                isLoading={orderLoading}
            />

            <TransactionDetailsDrawer
                transaction={transaction ?? null}
                open={!!selectedTxId}
                onOpenChange={(open) => {
                    if (!open) setSelectedTxId(null)
                }}
                currencyCode={currency}
                stores={stores}
                isLoading={transactionLoading}
                onRequery={
                    selectedTxId
                        ? async () => {
                              try {
                                  await requeryTx(selectedTxId)
                                  await queryClient.invalidateQueries({
                                      queryKey: [
                                          "finance",
                                          "transaction",
                                          activeBusiness?.id,
                                          selectedTxId,
                                      ],
                                  })
                              } catch {
                                  // toast handled by hook
                              }
                          }
                        : undefined
                }
                isRequerying={isRequerying}
            />
        </PageTransition>
    )
}
