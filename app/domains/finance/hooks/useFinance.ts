import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
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
    status: 'Cleared' | 'Pending' | 'Failed' | 'Processing'
    date: string
    method: string
    storeId: string | null
}

export interface WalletBalanceData {
    balance: number
    availableBalance: number
    pendingWithdrawals: number
    currency: string
    minimumWithdrawalAmount?: number
    withdrawalFeeTiers?: { min: number; max: number | null; fee: number }[]
}

export interface PayoutAccountOption {
    id: string
    bankName: string
    accountNumber?: string
    accountName: string
    isDefault: boolean
}

export interface WithdrawalResponse {
    withdrawal: {
        id: string
        amount: number
        status: string
        [key: string]: unknown
    }
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

export function useWalletBalance() {
    const { activeBusiness } = useBusiness()
    const businessId = activeBusiness?.id

    const { data: response, isLoading, isFetching, error } = useQuery<ApiResponse<WalletBalanceData>>({
        queryKey: ['finance', 'wallet', businessId],
        queryFn: () => apiClient.get<ApiResponse<WalletBalanceData>>('/finance/wallet', {}, { fullResponse: true }),
        enabled: !!businessId,
    })

    return {
        wallet: response?.data,
        isLoading,
        isFetching,
        error,
    }
}

export function usePayoutAccounts() {
    const { activeBusiness } = useBusiness()
    const businessId = activeBusiness?.id

    const { data: response, isLoading, isFetching, error } = useQuery<ApiResponse<PayoutAccountOption[]>>({
        queryKey: ['finance', 'payout-accounts', businessId],
        queryFn: () => apiClient.get<ApiResponse<PayoutAccountOption[]>>('/finance/payout-accounts', {}, { fullResponse: true }),
        enabled: !!businessId,
    })

    return {
        payoutAccounts: response?.data ?? [],
        isLoading,
        isFetching,
        error,
    }
}

export function useWithdraw() {
    const queryClient = useQueryClient()
    const { activeBusiness } = useBusiness()
    const businessId = activeBusiness?.id

    return useMutation({
        mutationFn: async (payload: { amount: number; payoutAccountId: string; pin: string }) => {
            return apiClient.post<WithdrawalResponse>('/finance/withdraw', payload)
        },
        onSuccess: () => {
            if (businessId) {
                queryClient.invalidateQueries({ queryKey: ['finance', 'wallet', businessId] })
                queryClient.invalidateQueries({ queryKey: ['finance', 'transactions', businessId] })
                queryClient.invalidateQueries({ queryKey: ['finance', 'summary', businessId] })
                queryClient.invalidateQueries({ queryKey: ['finance', 'withdrawals', businessId] })
            }
        },
    })
}
