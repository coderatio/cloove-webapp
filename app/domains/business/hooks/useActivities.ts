"use client"

import { useQuery } from "@tanstack/react-query"
import { apiClient, ApiResponse } from "@/app/lib/api-client"
import { formatCurrency } from "@/app/lib/formatters"
import type { ActivityItem } from "@/app/components/dashboard/ActivityStream"
import { useBusiness } from "@/app/components/BusinessProvider"

export type TypedActivityDto =
    | OrderActivityDto
    | InventoryActivityDto
    | PaymentActivityDto
    | DebtActivityDto
    | ExpenseActivityDto
    | WithdrawalActivityDto
    | WalletDepositActivityDto
    | CustomerActivityDto

export interface OrderActivityDto {
    id: string
    type: "ORDER_CREATED" | "ORDER_UPDATED" | "ORDER_CANCELLED" | "ORDER_REFUNDED"
    timestamp: string
    orderId: string
    amount: number | null
    currency: string
    customerName: string
    itemCount: number
    storeId: string | null
}

export interface InventoryActivityDto {
    id: string
    type: "INVENTORY_INCREASED" | "INVENTORY_DECREASED"
    timestamp: string
    entityId: string
    productName: string
    change: number
    storeId: string | null
}

export interface PaymentActivityDto {
    id: string
    type: "PAYMENT_RECEIVED" | "PAYMENT_MARKED_PAID" | "PAYMENT_MARKED_PARTIAL"
    timestamp: string
    amount: number | null
    currency: string
    entityId: string
    storeId: string | null
}

export interface DebtActivityDto {
    id: string
    type: "DEBT_CREATED" | "DEBT_REPAYMENT" | "DEBT_CLEARED"
    timestamp: string
    amount: number | null
    currency: string
    customerName: string | null
    entityId: string
    storeId: string | null
}

export interface ExpenseActivityDto {
    id: string
    type: "EXPENSE_RECORDED"
    timestamp: string
    amount: number | null
    currency: string
    category: string
    description: string
    entityId: string
    storeId: string | null
}

export interface WithdrawalActivityDto {
    id: string
    type: "WITHDRAWAL_REQUESTED" | "WITHDRAWAL_COMPLETED" | "WITHDRAWAL_FAILED"
    timestamp: string
    amount: number | null
    currency: string
    entityId: string
    reason?: string | null
}

export interface WalletDepositActivityDto {
    id: string
    type: "WALLET_DEPOSIT"
    timestamp: string
    amount: number | null
    currency: string
    entityId: string
    feeAmount?: number | null
}

export interface CustomerActivityDto {
    id: string
    type: "CUSTOMER_CREATED" | "CUSTOMER_UPDATED"
    timestamp: string
    entityId: string
    customerName: string
}

export interface UseActivitiesParams {
    page: number
    limit: number
    storeId: string | undefined
    type: string[]
    dateRange: { from: Date | undefined; to: Date | undefined }
    limitPerType?: number
}

export interface ActivitiesMeta {
    total: number
    page: number
    limit: number
    lastPage: number
}

function mapTypedDtoToActivityItem(dto: TypedActivityDto): ActivityItem {
    const timeAgo = dto.timestamp
        ? new Date(dto.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
        : ""

    const type = (dto as { type: string }).type

    if ("orderId" in dto && type.startsWith("ORDER_")) {
        const order = dto as OrderActivityDto
        let description = "Activity recorded"
        if (order.type === "ORDER_CREATED") description = `New sale: ${order.itemCount} items`
        else if (order.type === "ORDER_UPDATED") description = "Sale updated"
        else if (order.type === "ORDER_REFUNDED") description = "Order refunded"
        else if (order.type === "ORDER_CANCELLED") description = "Sale cancelled"
        return {
            id: order.id,
            type: "sale",
            description,
            amount: order.amount != null ? formatCurrency(order.amount, { currency: order.currency }) : undefined,
            timeAgo,
            customer: order.customerName,
            href: "/orders",
            orderId: order.orderId,
            timestamp: order.timestamp,
        }
    }

    if ("productName" in dto && "change" in dto) {
        const inv = dto as InventoryActivityDto
        const description =
            inv.type === "INVENTORY_INCREASED"
                ? `Restocked ${inv.productName}`
                : `Reduced stock of ${inv.productName}`
        return {
            id: inv.id,
            type: "inventory",
            description,
            amount: inv.change !== 0 ? (inv.change > 0 ? `+${inv.change}` : `${inv.change}`) : undefined,
            timeAgo,
            timestamp: inv.timestamp,
        }
    }

    if (type === "EXPENSE_RECORDED") {
        const exp = dto as ExpenseActivityDto
        return {
            id: exp.id,
            type: "withdrawal",
            description: exp.description || `Expense: ${exp.category}`,
            amount: exp.amount != null ? formatCurrency(exp.amount, { currency: exp.currency }) : undefined,
            timeAgo,
            txId: exp.entityId,
            href: "/finance",
            timestamp: exp.timestamp,
        }
    }

    if (type.startsWith("WITHDRAWAL_")) {
        const w = dto as WithdrawalActivityDto
        let description = "Withdrawal requested"
        if (w.type === "WITHDRAWAL_COMPLETED") description = "Withdrawal completed"
        else if (w.type === "WITHDRAWAL_FAILED") description = "Withdrawal failed"
        return {
            id: w.id,
            type: "withdrawal",
            description,
            amount: w.amount != null ? formatCurrency(w.amount, { currency: w.currency }) : undefined,
            timeAgo,
            txId: w.entityId,
            href: "/finance",
            timestamp: w.timestamp,
        }
    }

    if (type === "WALLET_DEPOSIT") {
        const d = dto as WalletDepositActivityDto
        return {
            id: d.id,
            type: "deposit",
            description: "Wallet deposit",
            amount: d.amount != null ? formatCurrency(d.amount, { currency: d.currency }) : undefined,
            timeAgo,
            txId: d.entityId,
            href: "/finance",
            timestamp: d.timestamp,
        }
    }

    const payTypes = ["PAYMENT_RECEIVED", "PAYMENT_MARKED_PAID", "PAYMENT_MARKED_PARTIAL"]
    if (payTypes.includes(type)) {
        const pay = dto as PaymentActivityDto
        return {
            id: pay.id,
            type: "payment",
            description: "Payment received",
            amount: pay.amount != null ? formatCurrency(pay.amount, { currency: pay.currency }) : undefined,
            timeAgo,
            txId: pay.entityId,
            href: "/finance",
            timestamp: pay.timestamp,
        }
    }

    if (type.startsWith("DEBT_")) {
        const debt = dto as DebtActivityDto
        let description = "Debt recorded"
        if (debt.type === "DEBT_CLEARED") description = "Debt cleared"
        else if (debt.type === "DEBT_REPAYMENT") description = "Debt repayment"
        return {
            id: debt.id,
            type: "debt",
            description,
            amount: debt.amount != null ? formatCurrency(debt.amount, { currency: debt.currency }) : undefined,
            timeAgo,
            txId: debt.entityId,
            customer: debt.customerName ?? undefined,
            href: "/finance",
            timestamp: debt.timestamp,
        }
    }

    if (type === "CUSTOMER_CREATED" || type === "CUSTOMER_UPDATED") {
        const cust = dto as CustomerActivityDto
        return {
            id: cust.id,
            type: "customer",
            description: type === "CUSTOMER_CREATED"
                ? `New customer: ${cust.customerName}`
                : `Updated customer: ${cust.customerName}`,
            timeAgo,
            customer: cust.customerName,
            href: "/customers",
            timestamp: cust.timestamp,
        }
    }

    // Generic Fallback
    return {
        id: (dto as any).id,
        type: "sale",
        description: `Activity: ${type}`,
        timeAgo,
        timestamp: (dto as any).timestamp,
    }
}

export function useActivities({
    page,
    limit,
    storeId,
    type,
    dateRange,
    limitPerType,
}: UseActivitiesParams) {
    const { currency } = useBusiness()

    const params: Record<string, string> = {
        page: String(page),
        limit: String(limit),
    }
    if (storeId && storeId !== "all-stores") params.storeId = storeId
    if (type.length > 0) params.type = type.join(",")
    if (dateRange.from) params.from = dateRange.from.toISOString().slice(0, 10)
    if (dateRange.to) params.to = dateRange.to.toISOString().slice(0, 10)
    if (limitPerType != null) params.limitPerType = String(limitPerType)

    const {
        data: response,
        isLoading,
        error,
    } = useQuery({
        queryKey: [
            "business-activities",
            page,
            limit,
            storeId,
            type,
            dateRange.from?.toISOString(),
            dateRange.to?.toISOString(),
            limitPerType,
        ],
        queryFn: () =>
            apiClient.get<ApiResponse<TypedActivityDto[]> & { meta: ActivitiesMeta }>(
                "/business/activities",
                params,
                { fullResponse: true }
            ),
    })

    const rawData = response?.data ?? []
    const activities: ActivityItem[] = rawData.map((dto) => mapTypedDtoToActivityItem(dto))
    const meta = response?.meta

    return {
        activities,
        meta,
        isLoading,
        error,
    }
}
