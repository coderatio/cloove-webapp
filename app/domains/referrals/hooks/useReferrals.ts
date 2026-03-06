"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { apiClient, ApiResponse } from "@/app/lib/api-client"
import { useBusiness } from "@/app/components/BusinessProvider"
import { toast } from "sonner"
import type {
    ReferralStats,
    ReferralWalletBalance,
    ReferralBankAccount,
    ReferralPayout,
    ReferralListItem,
    PaginationMeta,
} from "../types"

const REFERRAL_QUERY_KEY = "referrals"

export function useReferralStats() {
    const { activeBusiness } = useBusiness()
    const businessId = activeBusiness?.id

    const { data: response, isPending, error } = useQuery<ApiResponse<ReferralStats>>({
        queryKey: [REFERRAL_QUERY_KEY, businessId],
        queryFn: () =>
            apiClient.get<ApiResponse<ReferralStats>>("/referrals", undefined, {
                fullResponse: true,
            }),
        enabled: !!businessId,
    })

    return {
        stats: response?.data ?? null,
        isLoading: isPending,
        error,
    }
}

export function useReferralWallet() {
    const { activeBusiness } = useBusiness()
    const businessId = activeBusiness?.id

    const { data: response, isPending, error } = useQuery<ApiResponse<ReferralWalletBalance>>({
        queryKey: [REFERRAL_QUERY_KEY, "wallet", businessId],
        queryFn: () =>
            apiClient.get<ApiResponse<ReferralWalletBalance>>("/referrals/wallet", undefined, {
                fullResponse: true,
            }),
        enabled: !!businessId,
    })

    return {
        wallet: response?.data ?? null,
        isLoading: isPending,
        error,
    }
}

export function useReferralBankAccounts() {
    const queryClient = useQueryClient()
    const { activeBusiness } = useBusiness()
    const businessId = activeBusiness?.id

    const { data: response, isPending, error } = useQuery<ApiResponse<ReferralBankAccount[]>>({
        queryKey: [REFERRAL_QUERY_KEY, "bank-accounts", businessId],
        queryFn: () =>
            apiClient.get<ApiResponse<ReferralBankAccount[]>>("/referrals/bank-accounts", undefined, {
                fullResponse: true,
            }),
        enabled: !!businessId,
    })

    const banks = response?.data ?? []

    const addBankMutation = useMutation({
        mutationFn: (payload: {
            bankName: string
            accountNumber: string
            accountName: string
            bankCode?: string
            pin: string
        }) =>
            apiClient.post<ReferralBankAccount>("/referrals/bank-accounts", {
                ...payload,
                provider: "flutterwave",
            }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [REFERRAL_QUERY_KEY, "bank-accounts", businessId] })
            toast.success("Bank account added")
        },
        onError: (err: { message?: string }) => {
            toast.error(err.message ?? "Failed to add bank account")
        },
    })

    const deleteBankMutation = useMutation({
        mutationFn: ({ id, pin }: { id: string; pin: string }) =>
            apiClient.delete(`/referrals/bank-accounts/${id}`, {
                params: { pin },
            } as any),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [REFERRAL_QUERY_KEY, "bank-accounts", businessId] })
            toast.success("Bank account removed")
        },
        onError: (err: { message?: string }) => {
            toast.error(err.message ?? "Failed to remove bank account")
        },
    })

    return {
        banks,
        isLoading: isPending,
        error,
        addBank: addBankMutation.mutateAsync,
        isAddingBank: addBankMutation.isPending,
        deleteBank: deleteBankMutation.mutateAsync,
        isDeletingBank: deleteBankMutation.isPending,
    }
}

export function useReferralPayouts(page: number = 1, limit: number = 20) {
    const { activeBusiness } = useBusiness()
    const businessId = activeBusiness?.id

    const params: Record<string, string> = { page: String(page), limit: String(limit) }

    const { data: response, isPending, error } = useQuery<
        ApiResponse<ReferralPayout[]> & { meta?: PaginationMeta }
    >({
        queryKey: [REFERRAL_QUERY_KEY, "payouts", businessId, page, limit],
        queryFn: () =>
            apiClient.get("/referrals/payouts", params, { fullResponse: true }) as Promise<
                ApiResponse<ReferralPayout[]> & { meta?: PaginationMeta }
            >,
        enabled: !!businessId,
    })

    const payouts = response?.data ?? []
    const meta = response?.meta

    return {
        payouts,
        meta,
        isLoading: isPending,
        error,
    }
}

export function useReferralList(page: number = 1, limit: number = 20) {
    const { activeBusiness } = useBusiness()
    const businessId = activeBusiness?.id

    const params: Record<string, string> = { page: String(page), limit: String(limit) }

    const { data: response, isPending, error } = useQuery<
        ApiResponse<ReferralListItem[]> & { meta?: PaginationMeta }
    >({
        queryKey: [REFERRAL_QUERY_KEY, "list", businessId, page, limit],
        queryFn: () =>
            apiClient.get("/referrals/list", params, { fullResponse: true }) as Promise<
                ApiResponse<ReferralListItem[]> & { meta?: PaginationMeta }
            >,
        enabled: !!businessId,
    })

    const list = response?.data ?? []
    const meta = response?.meta

    return {
        list,
        meta,
        isLoading: isPending,
        error,
    }
}

export function useReferralWithdraw() {
    const queryClient = useQueryClient()
    const { activeBusiness } = useBusiness()
    const businessId = activeBusiness?.id

    const mutation = useMutation({
        mutationFn: (payload: { amount: number; bankAccountId: string; pin: string }) =>
            apiClient.post("/referrals/withdraw", payload),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: [REFERRAL_QUERY_KEY, businessId] })
            queryClient.invalidateQueries({ queryKey: [REFERRAL_QUERY_KEY, "wallet", businessId] })
            queryClient.invalidateQueries({ queryKey: [REFERRAL_QUERY_KEY, "payouts", businessId] })
            toast.success(`Withdrawal of ₦${variables.amount.toLocaleString()} initiated`)
        },
        onError: (err: { message?: string }) => {
            toast.error(err.message ?? "Withdrawal failed")
        },
    })

    return {
        withdraw: mutation.mutateAsync,
        isWithdrawing: mutation.isPending,
    }
}

export async function resolveReferralBankAccount(
    accountNumber: string,
    bankCode: string
): Promise<{ accountName: string }> {
    const response = await apiClient.get<ApiResponse<{ accountName: string }>>(
        "/referrals/bank-accounts/resolve",
        { accountNumber, bankCode },
        { fullResponse: true }
    )
    return (response as ApiResponse<{ accountName: string }>).data
}
