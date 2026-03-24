import { useQuery } from "@tanstack/react-query"
import { apiClient } from "@/app/lib/api-client"
import { useFieldAgent } from "../providers/FieldAgentProvider"

export interface BusinessMilestones {
    countrySet: boolean
    pinSet: boolean
    productsAdded: boolean
    subscribed: boolean
    minProductsRequired: number
}

export interface OnboardedBusiness {
    id: string
    businessId: string
    name: string
    shortCode: string
    ownerName: string
    phone: string
    onboardedAt: string
    status: "active" | "pending"
    earnings: number
    milestones: BusinessMilestones
}

export function useFieldAgentBusinesses() {
    const { agentId } = useFieldAgent()

    return useQuery({
        queryKey: ["field-agent", "businesses"],
        queryFn: () => apiClient.get<OnboardedBusiness[]>("/field-agent/businesses"),
        enabled: !!agentId,
        staleTime: 10 * 60 * 1000,
        refetchOnWindowFocus: false,
    })
}
