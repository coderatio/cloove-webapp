import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { apiClient } from "@/app/lib/api-client"
import { useFieldAgent } from "../providers/FieldAgentProvider"

export interface WalletTransaction {
    id: string
    amount: number
    currency: string
    status: string
    type: string
    description: string | null
    bankName: string | null
    accountNumber: string | null
    accountName: string | null
    createdAt: string
}

export function useFieldAgentTransactions() {
    const { agentId } = useFieldAgent()

    return useQuery({
        queryKey: ["field-agent", "transactions"],
        queryFn: () => apiClient.get<WalletTransaction[]>("/field-agent/wallet/transactions"),
        enabled: !!agentId,
        staleTime: 2 * 60 * 1000,
        refetchOnWindowFocus: true,
    })
}

export function useWithdraw() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (data: { amount: number; cashoutAccountId: string; pin?: string }) =>
            apiClient.post<{ transactionId: string }>("/field-agent/wallet/withdraw", data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["field-agent", "wallet"] })
            queryClient.invalidateQueries({ queryKey: ["field-agent", "transactions"] })
            queryClient.invalidateQueries({ queryKey: ["field-agent", "stats"] })
        },
    })
}
