import { useQuery } from "@tanstack/react-query"
import { apiClient } from "@/app/lib/api-client"
import { useFieldAgent } from "../providers/FieldAgentProvider"

export interface AgentStats {
    totalEarned: number
    activeMerchants: number
    pendingPayout: number
    monthlyEarnings: { month: string; amount: number }[]
    actionCommissions: number
    subscriptionCommissions: number
    availableBalance: number
}

export function useFieldAgentStats() {
    const { agentId } = useFieldAgent()

    return useQuery({
        queryKey: ["field-agent", "stats"],
        queryFn: async () => {
            const raw = await apiClient.get<{
                totalBusinesses: number
                grossCommissions: number
                actionCommissions: number
                subscriptionCommissions: number
                totalEarnings: number
                availableBalance: number
                pendingWithdrawals: number
                monthlyEarnings: { month: string; amount: number }[]
            }>("/field-agent/stats")

            return {
                totalEarned: raw.grossCommissions,
                activeMerchants: raw.totalBusinesses,
                pendingPayout: raw.pendingWithdrawals,
                monthlyEarnings: raw.monthlyEarnings ?? [],
                actionCommissions: raw.actionCommissions,
                subscriptionCommissions: raw.subscriptionCommissions,
                availableBalance: raw.availableBalance,
            } satisfies AgentStats
        },
        enabled: !!agentId,
        staleTime: 5 * 60 * 1000,
        refetchOnWindowFocus: true,
    })
}
