import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { apiClient, ApiResponse } from "@/app/lib/api-client"
import { useFieldAgent } from "../providers/FieldAgentProvider"

export async function resolveFieldAgentBankAccount(
    accountNumber: string,
    bankCode: string
): Promise<{ accountName: string }> {
    const response = await apiClient.get<ApiResponse<{ accountName: string }>>(
        "/field-agent/wallet/resolve-account",
        { accountNumber, bankCode },
        { fullResponse: true }
    )
    return (response as ApiResponse<{ accountName: string }>).data
}

export interface CashoutAccount {
    id: string
    bankName: string
    bankCode: string | null
    accountNumber: string
    accountName: string
    isDefault: boolean
}

export function useFieldAgentCashoutAccounts() {
    const { agentId } = useFieldAgent()

    return useQuery({
        queryKey: ["field-agent", "cashout-accounts"],
        queryFn: () => apiClient.get<CashoutAccount[]>("/field-agent/wallet/cashout-accounts"),
        enabled: !!agentId,
        staleTime: 5 * 60 * 1000,
    })
}

export function useAddCashoutAccount() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (data: { bankName: string; accountNumber: string; accountName: string; bankCode?: string; pin?: string }) =>
            apiClient.post<CashoutAccount>("/field-agent/wallet/cashout-accounts", data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["field-agent", "cashout-accounts"] })
        },
    })
}

export function useRemoveCashoutAccount() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: ({ id, pin }: { id: string; pin?: string }) =>
            apiClient.delete(`/field-agent/wallet/cashout-accounts/${id}`, { body: JSON.stringify({ pin }) }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["field-agent", "cashout-accounts"] })
        },
    })
}
