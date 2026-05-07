"use client"

import { useBusiness } from "@/app/components/BusinessProvider"
import { ALL_STORES_ID } from "@/app/domains/stores/data/storesMocks"
import { PageTransition } from "@/app/components/layout/page-transition"
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
import { usePresetPageCopy } from "@/app/domains/workspace/hooks/usePresetPageCopy"
import { PresetDashboardModules } from "@/app/domains/workspace/components/preset-feature-modules/PresetDashboardModules"
import type { DashboardActionKind } from "@/app/domains/workspace/copy/preset-page-copy"

function getTimeBasedGreeting(): string {
    const h = new Date().getHours()
    if (h < 12) return "Good morning,"
    if (h < 17) return "Good afternoon,"
    return "Good evening,"
}

export function DashboardView() {
    const { ownerName, activeBusiness } = useBusiness()
    const queryClient = useQueryClient()
    const { can } = usePermission()
    const pageCopy = usePresetPageCopy()
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
            <div className="mx-auto max-w-6xl space-y-8 pb-20">
                <header className="pt-1">
                    <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                        {/* Mobile: one row — greeting + grouped filters (store + icon date) */}
                        <div className="flex w-full min-w-0 items-center justify-between gap-2 md:hidden">
                            <div className="min-w-0 flex-1 pr-1">
                                <p className="text-[11px] font-medium capitalize leading-none text-muted-foreground">
                                    Welcome,
                                </p>
                                <h1 className="mt-1 truncate text-2xl font-semibold leading-tight tracking-tight text-foreground">
                                    {ownerName}
                                </h1>
                            </div>
                            <div
                                className="inline-flex shrink-0 items-center gap-1 rounded-full border border-border bg-background p-1 shadow-sm"
                                role="toolbar"
                                aria-label="Dashboard filters"
                            >
                                <StoreContextSelector
                                    compact
                                    value={storeId}
                                    onChange={setStoreId}
                                    className="max-w-[118px] border-0 bg-transparent shadow-none"
                                />
                                <span
                                    className="mx-0.5 h-6 w-px shrink-0 bg-border"
                                    aria-hidden
                                />
                                <DateRangeFilter
                                    iconOnly
                                    date={date}
                                    setDate={setDate}
                                    className="min-w-0"
                                    buttonClassName="border-0 bg-transparent shadow-none dark:bg-transparent"
                                />
                            </div>
                        </div>

                        {/* Desktop */}
                        <div className="hidden min-w-0 md:block">
                            <p className="mb-1 text-sm font-medium capitalize text-muted-foreground">
                                {getTimeBasedGreeting()}
                            </p>
                            <h1 className="text-4xl font-semibold tracking-tight text-foreground">
                                {ownerName}
                            </h1>
                        </div>
                        <div className="hidden w-full grid-cols-[auto_minmax(0,1fr)] items-center gap-2 md:grid md:w-auto">
                            <StoreContextSelector
                                value={storeId}
                                onChange={setStoreId}
                                className="w-[180px] sm:w-[200px] border-border bg-background shadow-sm"
                            />
                            <DateRangeFilter
                                date={date}
                                setDate={setDate}
                                className="min-w-0"
                                buttonClassName="rounded-full"
                            />
                        </div>
                    </div>
                </header>

                <section>
                    <DashboardHero sales={sales} wallet={can("VIEW_FINANCIALS") ? wallet : undefined} />
                </section>

                <section>
                    <InsightWhisper
                        insight={insight}
                        actionLabel={pageCopy.dashboard.insightViewReportLabel}
                        actionLink="/assistant"
                    />
                </section>

                <section>
                    <PresetDashboardModules />
                </section>

                <section className={`grid grid-cols-1 gap-6 ${can("VIEW_SALES") && can("VIEW_PRODUCTS") ? "md:grid-cols-2" : ""}`}>
                    <Can permission="VIEW_SALES">
                        <SalesVelocity
                            data={velocityData}
                            total={sales.value}
                            currencyCode={currency}
                        />
                    </Can>
                    <Can permission="VIEW_PRODUCTS">
                        {inventoryLoading ? (
                            <div className="rounded-3xl border border-border bg-background p-6">
                                <div className="mb-4 h-4 w-32 rounded bg-muted" />
                                <div className="mb-2 h-8 w-24 rounded bg-muted" />
                                <div className="h-4 w-48 rounded bg-muted" />
                            </div>
                        ) : (
                            <InventoryPulse
                                totalItems={inventorySummary.totalItems}
                                lowStockItems={inventorySummary.lowStockItems}
                                title={pageCopy.dashboard.inventoryPulseTitle}
                                itemsLabelSuffix={pageCopy.dashboard.inventoryPulseItemsSuffix}
                                lowStockLine={pageCopy.dashboard.inventoryLowStockLine}
                                lowStockHint={pageCopy.dashboard.inventoryLowStockHint}
                                healthyHint={pageCopy.dashboard.inventoryFullyStockedHint}
                                fullyStockedLabel={pageCopy.dashboard.inventoryFullyStockedHeading}
                            />
                        )}
                    </Can>
                </section>

                {(() => {
                    const permissionByKind: Record<DashboardActionKind, string> = {
                        pending_orders: "VIEW_SALES",
                        low_stock: "VIEW_PRODUCTS",
                        overdue_debts: "VIEW_FINANCIALS",
                    }
                    const filtered = actions.filter((a) => {
                        if (a.actionKind) {
                            const perm = permissionByKind[a.actionKind]
                            return !perm || can(perm)
                        }
                        return true
                    })
                    return filtered.length > 0 ? (
                        <section>
                            <h3 className="mb-4 px-1 text-lg font-semibold tracking-tight text-foreground">
                                {pageCopy.dashboard.needsAttentionTitle}
                            </h3>
                            <ActionRow items={filtered} />
                        </section>
                    ) : null
                })()}

                <section>
                    {activitiesLoading ? (
                        <div className="space-y-3">
                            <div className="mb-4 h-5 w-40 rounded bg-muted" />
                            {[...Array(3)].map((_, i) => (
                                <div key={i} className="flex items-center gap-4 rounded-2xl border border-border bg-background p-4">
                                    <div className="h-10 w-10 rounded-full bg-muted" />
                                    <div className="flex-1 space-y-2">
                                        <div className="h-4 w-48 rounded bg-muted" />
                                        <div className="h-3 w-24 rounded bg-muted" />
                                    </div>
                                    <div className="h-4 w-16 rounded bg-muted" />
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
