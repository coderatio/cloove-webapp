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
import { useState, useEffect } from "react"
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
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
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
                    <DashboardHero sales={sales} wallet={wallet} />
                </section>

                <section>
                    <InsightWhisper
                        insight={insight}
                        actionLabel="View Report"
                        actionLink="/assistant"
                    />
                </section>

                <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <SalesVelocity
                        data={velocityData}
                        total={sales.value}
                        currencyCode={currency}
                    />
                    <InventoryPulse
                        totalItems={inventorySummary.totalItems}
                        lowStockItems={inventorySummary.lowStockItems}
                    />
                </section>

                {actions.length > 0 && (
                    <section>
                        <h3 className="font-serif text-lg text-brand-deep dark:text-brand-cream mb-4 px-2">
                            Needs Attention
                        </h3>
                        <ActionRow items={actions} />
                    </section>
                )}

                <section>
                    <ActivityStream
                        activities={activities}
                        onOrderClick={(id) => setSelectedOrderId(id)}
                        onFinanceClick={(id) => setSelectedTxId(id)}
                    />
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
                                try {
                                    await requeryTx(selectedTxId)
                                    await queryClient.invalidateQueries({
                                        queryKey: ["finance", "transaction", activeBusiness?.id, selectedTxId],
                                    })
                                } catch {
                                    // toast handled by hook
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
