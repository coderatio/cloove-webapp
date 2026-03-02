import { useQuery } from "@tanstack/react-query"
import { apiClient, ApiResponse } from "@/app/lib/api-client"
import { useBusiness } from "@/app/components/BusinessProvider"

export interface FinanceSummary {
    date: string | null
    isToday: boolean
    currency: string
    walletBalance: number
    walletBalanceLabel: string
    salesTotal: number
    salesTotalLabel: string
    pendingOrdersCount: number
    pendingOrdersTotal: number
    pendingOrdersTotalLabel: string
    expensesTotal: number
    expensesTotalLabel: string
    pendingDebtTotal: number
    pendingDebtTotalLabel: string
    creditsTotal?: number
    creditsTotalLabel?: string
    pendingTransactionsCount?: number
}

export interface FinanceTransactionRow {
    id: string
    reference: string
    type: 'Credit' | 'Debit'
    amount: number
    customer: string
    status: 'Cleared' | 'Pending'
    date: string
    method: string
    storeId: string | null
}

const FINANCE_PAGE_SIZE = 10

export function useFinanceSummary(storeId?: string) {
    const { activeBusiness } = useBusiness()
    const businessId = activeBusiness?.id

    const params: Record<string, string> = {}
    if (storeId && storeId !== 'all-stores') params.storeId = storeId

    const { data: response, isLoading, isFetching, error } = useQuery<ApiResponse<FinanceSummary>>({
        queryKey: ['finance', 'summary', businessId, storeId],
        queryFn: () => apiClient.get<ApiResponse<FinanceSummary>>('/finance/summary', params, { fullResponse: true }),
        enabled: !!businessId,
    })

    return {
        summary: response?.data,
        isLoading,
        isFetching,
        error,
    }
}

export function useFinanceTransactions(storeId: string | undefined, page: number = 1, limit: number = FINANCE_PAGE_SIZE) {
    const { activeBusiness } = useBusiness()
    const businessId = activeBusiness?.id

    const params: Record<string, string> = {
        page: String(page),
        limit: String(limit),
    }
    if (storeId && storeId !== 'all-stores') params.storeId = storeId

    const { data: response, isLoading, isFetching, error } = useQuery<ApiResponse<FinanceTransactionRow[]>>({
        queryKey: ['finance', 'transactions', businessId, storeId, page, limit],
        queryFn: () => apiClient.get<ApiResponse<FinanceTransactionRow[]>>('/finance/transactions', params, { fullResponse: true }),
        enabled: !!businessId,
    })

    const meta = response?.meta
    const totalPages = meta ? (meta.lastPage ?? meta.totalPages ?? 1) : 1
    const currentPage = meta ? (meta.currentPage ?? page) : page

    return {
        transactions: response?.data ?? [],
        meta: meta ? { ...meta, totalPages, currentPage } : undefined,
        isLoading,
        isFetching,
        error,
    }
}
