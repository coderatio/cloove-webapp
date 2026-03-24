import { useMutation, useQueryClient } from "@tanstack/react-query"
import { apiClient } from "@/app/lib/api-client"
import { toast } from "sonner"

export interface OnboardBusinessPayload {
    businessName: string
    merchantName: string
    phoneNumber: string
    country: string
    categoryId?: string
    businessType?: 'INDIVIDUAL' | 'REGISTERED'
}

export function useOnboardBusiness() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (payload: OnboardBusinessPayload) =>
            apiClient.post("/field-agent/onboard", payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["field-agent", "businesses"] })
            queryClient.invalidateQueries({ queryKey: ["field-agent", "stats"] })
        },
        onError: (error: Error) => {
            toast.error(error.message || "Failed to onboard business")
        },
    })
}
