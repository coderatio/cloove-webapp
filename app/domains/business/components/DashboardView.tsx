"use client"

import { useBusiness } from "@/app/components/BusinessProvider"
import { ALL_STORES_ID } from "@/app/domains/stores/data/storesMocks"
import { useMediaQuery } from "@/app/hooks/useMediaQuery"
import { PageTransition } from "@/app/components/layout/page-transition"
import { motion } from "framer-motion"
import { DashboardHero } from "@/app/components/dashboard/DashboardHero"
import { InsightWhisper } from "@/app/components/dashboard/InsightWhisper"
import { ActionRow } from "@/app/components/dashboard/ActionRow"
import { ActivityStream } from "@/app/components/dashboard/ActivityStream"
import { useState, useEffect, useRef } from "react"
import { DateRange } from "react-day-picker"
import { subDays } from "date-fns"
import { DateRangeFilter } from "@/app/components/dashboard/DateRangeFilter"
import { DashboardSkeleton } from "@/app/components/dashboard/DashboardSkeleton"
import { InventoryPulse } from "@/app/components/dashboard/InventoryPulse"
import { SalesVelocity } from "@/app/components/dashboard/SalesVelocity"
import { StoreContextSelector } from "@/app/components/shared/StoreContextSelector"
import { OrderDetailsDrawer } from "@/app/domains/orders/components/OrderDetailsDrawer"
import { useOrder } from "@/app/domains/orders/hooks/useOrders"
import { useDashboardData } from "../hooks/useDashboardData"
import { toast } from "sonner"
import { useTransaction, useRequeryTransaction } from "@/app/domains/finance/hooks/useFinance"
import { useStores } from "@/app/domains/stores/providers/StoreProvider"
import { TransactionDetailsDrawer } from "@/app/components/shared/TransactionDetailsDrawer"
import { useQueryClient } from "@tanstack/react-query"
import { Can } from "@/app/components/shared/Can"
import { usePermission } from "@/app/hooks/usePermission"

function getTimeBasedGreeting(): string {
    const h = new Date().getHours()
    if (h < 12) return "Good morning,"
    if (h < 17) return "Good afternoon,"
    return "Good evening,"
}

export function DashboardView() {
    const { ownerName, activeBusiness } = useBusiness()
    const isDesktop = useMediaQuery("(min-width: 768px)")
    const queryClient = useQueryClient()
    const { can } = usePermission()
    const { stores } = useStores()
    const [date, setDate] = useState<DateRange | undefined>({
        from: subDays(new Date(), 30),
        to: new Date(),
    })
    const [storeId, setStoreId] = useState<string>(ALL_STORES_ID)
    const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null)
    const [selectedTxId, setSelectedTxId] = useState<string | null>(null)
    const dateRange = { from: date?.from, to: date?.to }
    const { order } = useOrder(selectedOrderId)
    const { transaction, isLoading: transactionLoading } = useTransaction(selectedTxId)
    const { mutateAsync: requeryTx, isPending: isRequerying } = useRequeryTransaction()
    const isRequeryingRef = useRef(false)
    const {
        wallet,
        sales,
        velocityData,
        actions,
        activities,
        inventorySummary,
        insight,
        currency,
        isLoading,
        inventoryLoading,
        activitiesLoading,
        error,
    } = useDashboardData({ dateRange, storeId })

    useEffect(() => {
        if (error) {
            const message = error instanceof Error ? error.message : "Failed to load dashboard data"
            toast.error(message)
        }
    }, [error])

    if (isLoading) {
        return <DashboardSkeleton />
    }

    return (
        <PageTransition>
            <div className="max-w-5xl mx-auto space-y-8 pb-20">
                <header className="pt-1">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.2 }}
                        className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between"
                    >
                        <div className="min-w-0">
                            <p className="text-[10px] md:text-sm text-brand-accent/80 dark:text-brand-cream/80 font-medium mb-0 md:mb-1 capitalize">
                                {isDesktop ? getTimeBasedGreeting() : "Welcome,"}
                            </p>
                            <h1 className="font-serif text-2xl md:text-4xl text-brand-deep dark:text-brand-cream">
                                {ownerName}
                            </h1>
                        </div>
                        <div className="grid w-full grid-cols-[auto_minmax(0,1fr)] items-center gap-2 md:w-auto">
                            <StoreContextSelector value={storeId} onChange={setStoreId} className="w-[180px] sm:w-[200px] shadow-sm border-brand-accent/10 dark:border-white/10 bg-white/50 dark:bg-white/5 hover:bg-white/80 dark:hover:bg-white/10 hover:border-brand-accent/20 dark:hover:border-white/20 transition-all duration-300" />
                            <DateRangeFilter date={date} setDate={setDate} className="min-w-0" buttonClassName="rounded-full" />
                        </div>
                    </motion.div>
                </header>

                <section>
                    <DashboardHero sales={sales} wallet={can("VIEW_FINANCIALS") ? wallet : undefined} />
                </section>

                <section>
                    <InsightWhisper
                        insight={insight}
                        actionLabel="View Report"
                        actionLink="/assistant"
                    />
                </section>

                <section className={`grid grid-cols-1 ${can("VIEW_SALES") && can("VIEW_PRODUCTS") ? "md:grid-cols-2" : ""} gap-6`}>
                    <Can permission="VIEW_SALES">
                        <SalesVelocity
                            data={velocityData}
                            total={sales.value}
                            currencyCode={currency}
                        />
                    </Can>
                    <Can permission="VIEW_PRODUCTS">
                        {inventoryLoading ? (
                            <div className="rounded-2xl border border-brand-accent/10 dark:border-white/10 bg-white/50 dark:bg-white/5 p-6 animate-pulse">
                                <div className="h-4 w-32 bg-brand-accent/10 dark:bg-white/10 rounded mb-4" />
                                <div className="h-8 w-24 bg-brand-accent/10 dark:bg-white/10 rounded mb-2" />
                                <div className="h-4 w-48 bg-brand-accent/10 dark:bg-white/10 rounded" />
                            </div>
                        ) : (
                            <InventoryPulse
                                totalItems={inventorySummary.totalItems}
                                lowStockItems={inventorySummary.lowStockItems}
                            />
                        )}
                    </Can>
                </section>

                {(() => {
                    const permissionMap: Record<string, string> = {
                        "Pending Orders": "VIEW_SALES",
                        "Low Stock": "VIEW_PRODUCTS",
                        "Overdue Debts": "VIEW_FINANCIALS",
                    }
                    const filtered = actions.filter((a) => {
                        const perm = permissionMap[a.label]
                        return !perm || can(perm)
                    })
                    return filtered.length > 0 ? (
                        <section>
                            <h3 className="font-serif text-lg text-brand-deep dark:text-brand-cream mb-4 px-2">
                                Needs Attention
                            </h3>
                            <ActionRow items={filtered} />
                        </section>
                    ) : null
                })()}

                <section>
                    {activitiesLoading ? (
                        <div className="space-y-3 animate-pulse">
                            <div className="h-5 w-40 bg-brand-accent/10 dark:bg-white/10 rounded mb-4" />
                            {[...Array(3)].map((_, i) => (
                                <div key={i} className="rounded-xl border border-brand-accent/10 dark:border-white/10 bg-white/50 dark:bg-white/5 p-4 flex items-center gap-4">
                                    <div className="h-10 w-10 rounded-full bg-brand-accent/10 dark:bg-white/10" />
                                    <div className="flex-1 space-y-2">
                                        <div className="h-4 w-48 bg-brand-accent/10 dark:bg-white/10 rounded" />
                                        <div className="h-3 w-24 bg-brand-accent/10 dark:bg-white/10 rounded" />
                                    </div>
                                    <div className="h-4 w-16 bg-brand-accent/10 dark:bg-white/10 rounded" />
                                </div>
                            ))}
                        </div>
                    ) : (
                        <ActivityStream
                            activities={activities}
                            onOrderClick={(id) => setSelectedOrderId(id)}
                            onFinanceClick={(id) => setSelectedTxId(id)}
                        />
                    )}
                </section>

                <OrderDetailsDrawer
                    order={order ?? null}
                    open={!!selectedOrderId && !!order && order.id === selectedOrderId}
                    onOpenChange={(open) => {
                        if (!open) setSelectedOrderId(null)
                    }}
                />

                <TransactionDetailsDrawer
                    transaction={transaction ?? null}
                    open={!!selectedTxId}
                    onOpenChange={(open) => {
                        if (!open) setSelectedTxId(null)
                    }}
                    currencyCode={activeBusiness?.currency ?? "NGN"}
                    stores={stores}
                    isLoading={transactionLoading}
                    onRequery={
                        selectedTxId
                            ? async () => {
                                if (isRequeryingRef.current) return
                                isRequeryingRef.current = true
                                try {
                                    await requeryTx(selectedTxId)
                                    await queryClient.invalidateQueries({
                                        queryKey: ["finance", "transaction", activeBusiness?.id, selectedTxId],
                                    })
                                } catch {
                                    // toast handled by hook
                                } finally {
                                    isRequeryingRef.current = false
                                }
                            }
                            : undefined
                    }
                    isRequerying={isRequerying}
                />
            </div>
        </PageTransition>
    )
}
