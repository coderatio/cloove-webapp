import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { apiClient } from "@/app/lib/api-client"
import { toast } from "sonner"

export interface BusinessConfigs {
    low_stock_threshold: number
    low_stock_alert_enabled: boolean
    allow_credit_sales: boolean
    debt_reminder_enabled: boolean
    daily_summary_enabled: boolean
    email_summaries_enabled: boolean
    show_wallet_balance: boolean
    [key: string]: any
}

export interface SettingsResponse {
    user: {
        id: string
        fullName: string
        email: string
        phoneNumber: string
        country: string
        socials: {
            whatsapp: string | null
            telegram: string | null
            instagram: string | null
        }
    }
    business: {
        id: string
        name: string
        slug: string
        currency: string
        configs: BusinessConfigs
    }
}

export const useSettings = () => {
    return useQuery({
        queryKey: ["settings"],
        queryFn: () => apiClient.get<SettingsResponse>("/settings"),
    })
}

export const useUpdateBusinessSettings = () => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (variables: Partial<BusinessConfigs> & { quiet?: boolean }) => {
            const { quiet, ...configs } = variables
            return apiClient.patch("/settings/business", { configs })
        },
        onMutate: async (newConfigs) => {
            // Cancel any outgoing refetches
            await queryClient.cancelQueries({ queryKey: ["settings"] })

            // Snapshot the previous value
            const previousSettings = queryClient.getQueryData<SettingsResponse>(["settings"])

            // Optimistically update to the new value
            if (previousSettings) {
                const { quiet, ...configs } = newConfigs
                queryClient.setQueryData<SettingsResponse>(["settings"], {
                    ...previousSettings,
                    business: {
                        ...previousSettings.business,
                        configs: {
                            ...previousSettings.business.configs,
                            ...configs
                        }
                    }
                })
            }

            return { previousSettings }
        },
        onError: (err, newConfigs, context) => {
            if (context?.previousSettings) {
                queryClient.setQueryData(["settings"], context.previousSettings)
            }
            toast.error("Failed to update business settings")
        },
        onSuccess: (data: any, variables) => {
            if (!variables.quiet) {
                toast.success(data.message || "Business settings updated")
            }
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ["settings"] })
        },
    })
}

export interface UpdateProfilePayload {
    fullName?: string
    email?: string
    country?: string
    socials?: {
        whatsapp?: string | null
        telegram?: string | null
        instagram?: string | null
    }
}

export const useUpdateProfile = () => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (payload: UpdateProfilePayload) =>
            apiClient.patch("/settings/profile", payload, { fullResponse: true }),
        onSuccess: (data: any) => {
            toast.success(data.message || "Profile updated successfully")
            queryClient.invalidateQueries({ queryKey: ["settings"] })
        },
        onError: (error: any) => {
            toast.error(error.message || "Failed to update profile")
        },
    })
}
