import { useQuery } from "@tanstack/react-query"
import { apiClient, ApiResponse } from "@/app/lib/api-client"
import { useFieldAgent } from "../providers/FieldAgentProvider"
import type { Bank } from "@/app/components/shared/BankSelector"

export function useFieldAgentBanks(provider?: string) {
    const { agentId } = useFieldAgent()

    const params: Record<string, string> = {}
    if (provider) params.provider = provider

    const { data: response, isLoading } = useQuery<ApiResponse<Bank[]>>({
        queryKey: ["field-agent", "banks", provider],
        queryFn: () =>
            apiClient.get<ApiResponse<Bank[]>>("/field-agent/banks", params, { fullResponse: true }),
        enabled: !!agentId,
        staleTime: 60 * 60 * 1000, // 1 hour — bank list rarely changes
    })

    return {
        banks: response?.data ?? [],
        isLoading,
    }
}
