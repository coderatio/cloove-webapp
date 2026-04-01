"use client"

import { useQueries } from "@tanstack/react-query"
import { useMemo } from "react"
import { format, isSameDay } from "date-fns"
import { Clock, Package, AlertCircle } from "lucide-react"
import { useBusiness } from "@/app/components/BusinessProvider"
import { usePermission } from "@/app/hooks/usePermission"
import { useStores } from "@/app/domains/stores/providers/StoreProvider"
import { useFinanceSummary, useFinancePeriodSummary, useWalletBalance, useDepositAccounts, useFinanceTransactions } from "@/app/domains/finance/hooks/useFinance"
import { useInventory } from "@/app/domains/inventory/hooks/useInventory"
import { useDashboardInsights } from "./useDashboardInsights"
import { apiClient, ApiResponse } from "@/app/lib/api-client"
import { formatCurrency } from "@/app/lib/formatters"
import type { ActivityItem } from "@/app/components/dashboard/ActivityStream"

const ALL_STORES_ID = "all-stores"
const ACTIVITIES_MERGE_LIMIT = 10
const DASHBOARD_TRANSACTIONS_LIMIT = 5

export interface DashboardWallet {
    balance: string
    isVerified: boolean
    label?: string
}

export interface DashboardSales {
    value: string
    trend: string
    trendDirection: "up" | "down"
    label: string
    storeName?: string
    periodLabel?: string
    history?: { value: number }[]
}

export interface DashboardActionItem {
    label: string
    count: number
    type: "urgent" | "warning" | "info"
    href: string
    icon?: React.ReactNode
}

export interface DashboardInventorySummary {
    totalItems: number
    lowStockItems: number
}

export interface UseDashboardDataParams {
    dateRange: { from: Date | undefined; to: Date | undefined }
    storeId: string | undefined
}

export function useDashboardData({ dateRange, storeId }: UseDashboardDataParams) {
    const { activeBusiness } = useBusiness()
    const { can } = usePermission()
    const canViewFinancials = can("VIEW_FINANCIALS")
    const { stores } = useStores()
    const from = dateRange.from
    const to = dateRange.to ?? from
    const fromStr = from ? format(from, "yyyy-MM-dd") : ""
    const toStr = to ? format(to, "yyyy-MM-dd") : ""
    const isSingleDay = !from || !to || isSameDay(from, to)
    const dateStr = (to ?? from) ? format(to ?? from!, "yyyy-MM-dd") : ""

    const storeIdForApi = storeId && storeId !== ALL_STORES_ID ? storeId : undefined
    const effectiveStoreId = storeId ?? ALL_STORES_ID

    const { summary: dailySummary, isLoading: dailyLoading, error: dailyError } = useFinanceSummary(
        effectiveStoreId,
        isSingleDay ? dateStr : undefined,
        isSingleDay
    )
    const { summary: periodSummary, isLoading: periodLoading, error: periodError } = useFinancePeriodSummary(
        fromStr,
        toStr,
        effectiveStoreId,
        !isSingleDay && !!fromStr && !!toStr
    )

    const usePeriod = !isSingleDay && fromStr && toStr
    const summary = usePeriod ? periodSummary : dailySummary
    const financeLoading = usePeriod ? periodLoading : dailyLoading
    const financeError = usePeriod ? periodError : dailyError

    const { wallet, isLoading: walletLoading } = useWalletBalance(canViewFinancials)
    const { depositData } = useDepositAccounts(canViewFinancials)
    const { summary: inventorySummary, isLoading: inventoryLoading } = useInventory(
        effectiveStoreId,
        1,
        1
    )
    const { actions: insightActions, isLoading: insightsLoading } = useDashboardInsights()

    const realStoreIds = useMemo(
        () => stores.filter((s) => s.id !== ALL_STORES_ID).map((s) => s.id),
        [stores]
    )
    const activityStoreIds = storeIdForApi ? [storeIdForApi] : realStoreIds

    const activityQueries = useQueries({
        queries: activityStoreIds.map((sid) => ({
            queryKey: ["store-activities", activeBusiness?.id, sid, 10] as const,
            queryFn: () =>
                apiClient.get<ApiResponse<any[]>>(`/stores/${sid}/activities`, { limit: '10' }, { fullResponse: true }),
            enabled: !!activeBusiness?.id && activityStoreIds.length > 0 && stores.some(s => s.id === sid),
            staleTime: 30 * 1000,
        })),
    })

    const { transactions: transactionsList, isLoading: transactionsLoading } = useFinanceTransactions(undefined, 1, DASHBOARD_TRANSACTIONS_LIMIT, undefined, canViewFinancials)
    const transactions = transactionsList ?? []
    const currency = summary?.currency ?? wallet?.currency ?? "NGN"

    const activities: ActivityItem[] = useMemo(() => {
        const withSortKey: { sortKey: number; item: ActivityItem }[] = []

        const storeResults = activityQueries.map((q) => q.data?.data ?? []).flat()
        for (const event of storeResults) {
            const metadata = event.metadata || {}
            let type: ActivityItem["type"] = "sale"
            let description = "Activity recorded"
            let amount: string | undefined
            let customer: string | undefined

            switch (event.type) {
                case "ORDER_CREATED":
                    type = "sale"
                    description = `New sale: ${metadata.itemCount ?? "?"} items`
                    amount = metadata.totalAmount != null ? formatCurrency(metadata.totalAmount, { currency }) : undefined
                    customer = metadata.customerName || "Walk-in"
                    break
                case "INVENTORY_INCREASED":
                    type = "inventory"
                    description = `Restocked ${metadata.productName ?? "item"}`
                    amount = metadata.change != null ? `+${metadata.change}` : undefined
                    break
                case "INVENTORY_DECREASED":
                    type = "inventory"
                    description = `Reduced stock of ${metadata.productName ?? "item"}`
                    amount = metadata.change != null ? `-${metadata.change}` : undefined
                    break
                case "PAYMENT_RECEIVED":
                    type = "payment"
                    description = "Payment received"
                    amount = metadata.amount != null ? formatCurrency(metadata.amount, { currency }) : undefined
                    break
            }
            const sortKey = event.timestamp ? new Date(event.timestamp).getTime() : 0
            withSortKey.push({
                sortKey,
                item: {
                    id: event.id,
                    type,
                    description,
                    amount,
                    timeAgo: event.timestamp
                        ? new Date(event.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                        : "",
                    customer,
                    href: type === "sale" && event.entityId ? `/orders` : undefined,
                    orderId: type === "sale" && event.entityId ? event.entityId : undefined,
                },
            })
        }

        for (const tx of transactions) {
            const sortKey = tx.createdAt ? new Date(tx.createdAt).getTime() : 0
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
                description = tx.sale ? `Payment from ${tx.sale.customerName ?? tx.customer}` : tx.customer || "Deposit"
            } else {
                type = "debt"
                description = tx.method || tx.customer || "Debit"
            }

            withSortKey.push({
                sortKey,
                item: {
                    id: `tx-${tx.id}`,
                    type,
                    description,
                    amount: amountStr,
                    timeAgo: tx.dateLabel ?? tx.date ?? "",
                    customer: tx.sale?.customerName ?? (type === "deposit" ? undefined : tx.customer),
                    txId: tx.id,
                    href: "/finance",
                },
            })
        }

        return withSortKey
            .sort((a, b) => b.sortKey - a.sortKey)
            .slice(0, ACTIVITIES_MERGE_LIMIT)
            .map((x) => x.item)
    }, [activityQueries, transactions, currency])

    const activitiesLoading = activityQueries.some((q) => q.isLoading) || transactionsLoading

    const isVerified = useMemo(() => {
        if (!depositData) return true
        const { verificationLevel = 0, requiredLevel = 0 } = depositData
        return verificationLevel >= requiredLevel
    }, [depositData])

    const walletDisplay: DashboardWallet = useMemo(() => {
        const balance = wallet?.balance ?? 0
        const currency = wallet?.currency ?? "NGN"
        return {
            balance: formatCurrency(balance, { currency }),
            isVerified,
            label: "Wallet Balance",
        }
    }, [wallet, isVerified])

    const salesLabel = "Total Sales"
    const storeNameForSales =
        effectiveStoreId === ALL_STORES_ID
            ? "All Stores"
            : (stores.find((s) => s.id === effectiveStoreId)?.name ?? "")

    const salesDisplay: DashboardSales = useMemo(() => {
        const total = summary?.salesTotal ?? 0
        const currency = summary?.currency ?? "NGN"
        const value = summary?.salesTotalLabel ?? formatCurrency(total, { currency })
        return {
            value,
            trend: "—",
            trendDirection: "up" as const,
            label: salesLabel,
            storeName: storeNameForSales,
            periodLabel: summary?.periodLabel,
            history: [],
        }
    }, [summary, salesLabel, storeNameForSales])

    const actions: DashboardActionItem[] = useMemo(() => {
        const items: DashboardActionItem[] = []
        const pendingCount = summary?.pendingOrdersCount ?? 0
        if (pendingCount > 0) {
            items.push({
                label: "Pending Orders",
                count: pendingCount,
                type: "urgent",
                href: "/orders",
                icon: <Clock className="w-4 h-4" />,
            })
        }
        const lowStock = inventorySummary?.lowStockItems ?? 0
        if (lowStock > 0) {
            items.push({
                label: "Low Stock",
                count: lowStock,
                type: "warning",
                href: "/inventory",
                icon: <Package className="w-4 h-4" />,
            })
        }
        const hasDebt = (summary?.pendingDebtTotal ?? 0) > 0
        if (hasDebt) {
            items.push({
                label: "Overdue Debts",
                count: 1,
                type: "urgent",
                href: "/finance",
                icon: <AlertCircle className="w-4 h-4" />,
            })
        }

        // Add backend insights/recommendations
        items.push(...insightActions)

        // Sort by priority: urgent > warning > info
        const priorityScore = { urgent: 3, warning: 2, info: 1 }
        items.sort((a, b) => priorityScore[b.type] - priorityScore[a.type])

        return items.slice(0, 4)
    }, [summary, inventorySummary, insightActions])

    const velocityData = useMemo(() => {
        return (summary as any)?.velocityData || []
    }, [summary])

    const inventory: DashboardInventorySummary = useMemo(
        () => ({
            totalItems: inventorySummary?.totalProducts ?? 0,
            lowStockItems: inventorySummary?.lowStockItems ?? 0,
        }),
        [inventorySummary]
    )

    const isLoading = financeLoading || walletLoading
    const error = financeError ?? null

    return {
        wallet: walletDisplay,
        sales: salesDisplay,
        velocityData,
        actions,
        activities,
        inventorySummary: inventory,
        insight: "View your assistant for tailored insights and reports.",
        currency,
        isLoading,
        inventoryLoading,
        activitiesLoading,
        error,
    }
}
