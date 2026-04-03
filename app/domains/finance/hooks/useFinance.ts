import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { apiClient, ApiResponse } from "@/app/lib/api-client"
import { useBusiness } from "@/app/components/BusinessProvider"
import { toast } from "sonner"

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
    startDate?: string | null
    endDate?: string | null
    periodLabel?: string
    totalDays?: number
}

export interface FinanceTransactionRow {
    id: string
    reference: string
    type: 'Credit' | 'Debit'
    amount: number
    customer: string
    status: 'Cleared' | 'Pending' | 'Failed' | 'Processing'
    date: string
    dateLabel?: string
    fullDate?: string
    createdAt?: string
    method: string
    storeId: string | null
    metadata?: any
    sale?: {
        shortCode: string
        status: string
        customerName?: string
        totalAmount: number
    }
    withdrawal?: {
        bankName: string
        accountNumber: string
        accountName: string
    }
}

export interface WalletBalanceData {
    balance: number
    availableBalance: number
    pendingWithdrawals: number
    currency: string
    minimumWithdrawalAmount?: number
    withdrawalFeeTiers?: { min: number; max: number | null; fee: number }[]
    defaultWithdrawalProvider?: string
}

export interface PayoutAccountOption {
    id: string
    bankName: string
    accountNumber?: string
    accountName: string
    isDefault: boolean
    bankCode?: string
    provider?: string
}

export interface Bank {
    id: string | number
    code: string
    name: string
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

export function useFinanceSummary(storeId?: string, date?: string, enabled = true) {
    const { activeBusiness } = useBusiness()
    const businessId = activeBusiness?.id

    const params: Record<string, string> = {}
    if (storeId && storeId !== 'all-stores') params.storeId = storeId
    if (date) params.date = date

    const { data: response, isLoading, isFetching, error } = useQuery<ApiResponse<FinanceSummary>>({
        queryKey: ['finance', 'summary', businessId, storeId, date],
        queryFn: () => apiClient.get<ApiResponse<FinanceSummary>>('/finance/summary', params, { fullResponse: true }),
        enabled: !!businessId && enabled,
        staleTime: 60 * 1000, // 1 min — summary refreshes on mutation invalidation
    })

    return {
        summary: response?.data,
        isLoading,
        isFetching,
        error,
    }
}

export function useFinancePeriodSummary(from: string, to: string, storeId?: string, enabled = true) {
    const { activeBusiness } = useBusiness()
    const businessId = activeBusiness?.id

    const params: Record<string, string> = { from, to }
    if (storeId && storeId !== 'all-stores') params.storeId = storeId
    const { data: response, isLoading, isFetching, error } = useQuery<ApiResponse<FinanceSummary>>({
        queryKey: ['finance', 'summary', 'period', businessId, from, to, storeId],
        queryFn: () => apiClient.get<ApiResponse<FinanceSummary>>('/finance/summary', params, { fullResponse: true }),
        enabled: !!businessId && !!from && !!to && enabled,
        staleTime: 60 * 1000,
    })

    return {
        summary: response?.data,
        isLoading,
        isFetching,
        error,
    }
}

export interface TransactionFilterParams {
    search?: string
    status?: string[]   // multi-select
    type?: string[]     // multi-select
    category?: string[] // multi-select
}

export function useFinanceTransactions(
    storeId: string | undefined,
    page: number = 1,
    limit: number = FINANCE_PAGE_SIZE,
    filters?: TransactionFilterParams,
    enabled = true
) {
    const { activeBusiness } = useBusiness()
    const businessId = activeBusiness?.id

    const params: Record<string, string> = {
        page: String(page),
        limit: String(limit),
    }
    if (storeId && storeId !== 'all-stores') params.storeId = storeId
    if (filters?.search) params.search = filters.search
    if (filters?.status && filters.status.length > 0) params.status = filters.status.join(',')
    if (filters?.type && filters.type.length > 0) params.type = filters.type.join(',')
    if (filters?.category && filters.category.length > 0) params.category = filters.category.join(',')

    const { data: response, isLoading, isFetching, error } = useQuery<ApiResponse<FinanceTransactionRow[]>>({
        queryKey: ['finance', 'transactions', businessId, storeId, page, limit, filters?.search, filters?.status, filters?.type, filters?.category],
        queryFn: () => apiClient.get<ApiResponse<FinanceTransactionRow[]>>('/finance/transactions', params, { fullResponse: true }),
        enabled: !!businessId && enabled,
        staleTime: 30 * 1000, // 30s — users expect to see recent transactions quickly
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

export function useTransaction(id: string | null) {
    const { activeBusiness } = useBusiness()
    const businessId = activeBusiness?.id

    const { data: response, isLoading, error } = useQuery<ApiResponse<FinanceTransactionRow>>({
        queryKey: ['finance', 'transaction', businessId, id],
        queryFn: () => apiClient.get<ApiResponse<FinanceTransactionRow>>(`/finance/transactions/${id}`, {}, { fullResponse: true }),
        enabled: !!businessId && !!id,
        staleTime: 30 * 1000,
    })

    return {
        transaction: response?.data ?? null,
        isLoading,
        error,
    }
}

export function useWalletBalance(enabled = true) {
    const { activeBusiness } = useBusiness()
    const businessId = activeBusiness?.id

    const { data: response, isLoading, isFetching, error } = useQuery<ApiResponse<WalletBalanceData>>({
        queryKey: ['finance', 'wallet', businessId],
        queryFn: () => apiClient.get<ApiResponse<WalletBalanceData>>('/finance/wallet', {}, { fullResponse: true }),
        enabled: !!businessId && enabled,
        staleTime: 30 * 1000,
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
        staleTime: 2 * 60 * 1000, // 2 min — payout accounts rarely change
    })

    return {
        payoutAccounts: response?.data ?? [],
        isLoading,
        isFetching,
        error,
    }
}

export function useBanks(provider?: string) {
    const { activeBusiness } = useBusiness()
    const businessId = activeBusiness?.id

    const params: Record<string, string> = {}
    if (provider) params.provider = provider

    const { data: response, isLoading, isFetching, error } = useQuery<ApiResponse<Bank[]>>({
        queryKey: ['finance', 'banks', businessId, provider],
        queryFn: () => apiClient.get<ApiResponse<Bank[]>>('/finance/banks', params, { fullResponse: true }),
        enabled: !!businessId,
        staleTime: 1000 * 60 * 60, // 1 hour
    })

    return {
        banks: response?.data ?? [],
        isLoading,
        isFetching,
        error,
    }
}

export function useRecentWithdrawalAccounts() {
    const { activeBusiness } = useBusiness()
    const businessId = activeBusiness?.id

    const { data: response, isLoading, isFetching, error } = useQuery<ApiResponse<PayoutAccountOption[]>>({
        queryKey: ['finance', 'withdraw', 'recents', businessId],
        queryFn: () => apiClient.get<ApiResponse<PayoutAccountOption[]>>('/finance/withdraw/recents', {}, { fullResponse: true }),
        enabled: !!businessId,
        staleTime: 5 * 60 * 1000,
    })

    return {
        recentAccounts: response?.data ?? [],
        isLoading,
        isFetching,
        error,
    }
}

export interface PaymentProviderOption {
    id: string
    name: string
    is_enabled: boolean
    logo_url: string | null
}

export function usePaymentProviders() {
    return useQuery<ApiResponse<PaymentProviderOption[]>>({
        queryKey: ['common', 'payment-providers'],
        queryFn: () => apiClient.get<ApiResponse<PaymentProviderOption[]>>('/payment-providers', {}, { fullResponse: true }),
        staleTime: 1000 * 60 * 60, // 1 hour
    })
}

export interface DepositAccount {
    id: string
    bankName: string
    accountNumber: string
    accountName: string
    qrCodeUrl: string
    provider: string | null
}

export interface DepositAccountsData {
    verificationLevel: number
    isEligible: boolean
    accounts: DepositAccount[]
    requiredLevel: number
    requiredAction: string | null
}

export function useDepositAccounts(enabled = true) {
    const { activeBusiness } = useBusiness()
    const businessId = activeBusiness?.id

    const { data: response, isLoading, isFetching, error } = useQuery<ApiResponse<DepositAccountsData>>({
        queryKey: ['finance', 'deposit-accounts', businessId],
        queryFn: () => apiClient.get<ApiResponse<DepositAccountsData>>('/finance/deposit-accounts', {}, { fullResponse: true }),
        enabled: !!businessId && enabled,
        staleTime: 1000 * 60 * 5, // 5 min cache
    })

    return {
        depositData: response?.data,
        isLoading,
        isFetching,
        error,
    }
}

export function useResolveAccount() {
    return useMutation({
        mutationFn: async (payload: { accountNumber: string; bankCode: string; provider: string }) => {
            return apiClient.get<ApiResponse<{ accountName: string }>>('/finance/payout-accounts/resolve', payload, { fullResponse: true })
        }
    })
}

export function useWithdraw() {
    const queryClient = useQueryClient()
    const { activeBusiness } = useBusiness()
    const businessId = activeBusiness?.id

    return useMutation({
        mutationFn: async (payload: {
            amount: number
            payoutAccountId?: string
            pin: string
            bankCode?: string
            accountNumber?: string
            accountName?: string
            bankName?: string
            provider?: string
            saveToPayoutAccounts?: boolean
        }) => {
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

export function useAddPayoutAccount() {
    const queryClient = useQueryClient()
    const { activeBusiness } = useBusiness()
    const businessId = activeBusiness?.id

    return useMutation({
        mutationFn: async (payload: { bankName: string, accountNumber: string, accountName: string, bankCode?: string, provider: string, pin: string }) => {
            return apiClient.post<ApiResponse<PayoutAccountOption>>('/finance/payout-accounts', payload, { fullResponse: true })
        },
        onSuccess: (response) => {
            toast.success(response.message || "Payout account added")
            if (businessId) {
                queryClient.invalidateQueries({ queryKey: ['finance', 'payout-accounts', businessId] })
            }
        },
        onError: (err: any) => {
            toast.error(err.data?.message || err.message || "Failed to add payout account")
        }
    })
}

export function useUpdatePayoutAccount() {
    const queryClient = useQueryClient()
    const { activeBusiness } = useBusiness()
    const businessId = activeBusiness?.id

    return useMutation({
        mutationFn: async ({ id, ...payload }: { id: string, bankName?: string, accountName?: string, bankCode?: string, pin: string }) => {
            return apiClient.patch<ApiResponse<PayoutAccountOption>>(`/finance/payout-accounts/${id}`, payload, { fullResponse: true })
        },
        onSuccess: (response) => {
            toast.success(response.message || "Payout account updated")
            if (businessId) {
                queryClient.invalidateQueries({ queryKey: ['finance', 'payout-accounts', businessId] })
            }
        },
        onError: (err: any) => {
            toast.error(err.data?.message || err.message || "Failed to update payout account")
        }
    })
}

export function useDeletePayoutAccount() {
    const queryClient = useQueryClient()
    const { activeBusiness } = useBusiness()
    const businessId = activeBusiness?.id

    return useMutation({
        mutationFn: async ({ id, pin }: { id: string, pin: string }) => {
            return apiClient.delete<ApiResponse<void>>(`/finance/payout-accounts/${id}`, { params: { pin }, fullResponse: true })
        },
        onSuccess: (response) => {
            toast.success(response.message || "Payout account removed")
            if (businessId) {
                queryClient.invalidateQueries({ queryKey: ['finance', 'payout-accounts', businessId] })
            }
        },
        onError: (err: any) => {
            toast.error(err.data?.message || err.message || "Failed to remove payout account")
        }
    })
}

export function useSetDefaultPayoutAccount() {
    const queryClient = useQueryClient()
    const { activeBusiness } = useBusiness()
    const businessId = activeBusiness?.id

    return useMutation({
        mutationFn: async ({ id, pin }: { id: string, pin: string }) => {
            return apiClient.post<ApiResponse<void>>(`/finance/payout-accounts/${id}/default`, { pin }, { fullResponse: true })
        },
        onSuccess: (response) => {
            toast.success(response.message || "Default payout account updated")
            if (businessId) {
                queryClient.invalidateQueries({ queryKey: ['finance', 'payout-accounts', businessId] })
            }
        },
        onError: (err: any) => {
            toast.error(err.data?.message || err.message || "Failed to update default payout account")
        }
    })
}

export function useRequeryTransaction() {
    const queryClient = useQueryClient()
    const { activeBusiness } = useBusiness()
    const businessId = activeBusiness?.id

    return useMutation({
        mutationFn: async (id: string) => {
            return apiClient.post<ApiResponse<FinanceTransactionRow>>(`/finance/transactions/${id}/requery`, {}, { fullResponse: true })
        },
        onSuccess: (response) => {
            toast.success(response.message || "Transaction status updated")
            if (businessId) {
                queryClient.invalidateQueries({ queryKey: ['finance', 'transactions', businessId] })
                queryClient.invalidateQueries({ queryKey: ['finance', 'wallet', businessId] })
                queryClient.invalidateQueries({ queryKey: ['finance', 'summary', businessId] })
            }
        },
        onError: (err: any) => {
            toast.error(err.data?.message || err.message || "Failed to requery transaction")
        }
    })
}
export function useTransactionReceipt() {
    return useMutation({
        mutationFn: async (id: string) => {
            return apiClient.post<{ url: string }>(`/finance/transactions/${id}/receipt`, {})
        },
        onError: (err: any) => {
            toast.error(err.data?.message || err.message || "Failed to generate receipt")
        }
    })
}
