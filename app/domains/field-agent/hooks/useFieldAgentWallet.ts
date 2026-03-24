import { useQuery } from "@tanstack/react-query"
import { apiClient } from "@/app/lib/api-client"
import { useFieldAgent } from "../providers/FieldAgentProvider"

export interface AgentWallet {
    id: string
    currency: string
    balance: number
    availableBalance: number
    pendingWithdrawals: number
    withdrawalThreshold: number
    withdrawalMinimum: number
}

export function useFieldAgentWallet() {
    const { agentId } = useFieldAgent()

    return useQuery({
        queryKey: ["field-agent", "wallet"],
        queryFn: () => apiClient.get<AgentWallet>("/field-agent/wallet"),
        enabled: !!agentId,
        staleTime: 2 * 60 * 1000,
        refetchOnWindowFocus: true,
    })
}
