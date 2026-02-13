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
        mutationFn: (configs: Partial<BusinessConfigs>) =>
            apiClient.patch("/settings/business", { configs }),
        onSuccess: (data: any) => {
            toast.success(data.message || "Business settings updated")
            queryClient.invalidateQueries({ queryKey: ["settings"] })
        },
        onError: (error: any) => {
            toast.error(error.message || "Failed to update business settings")
        },
    })
}

export interface UpdateProfilePayload {
    fullName?: string
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
            apiClient.patch("/settings/profile", payload),
        onSuccess: (data: any) => {
            toast.success(data.message || "Profile updated successfully")
            queryClient.invalidateQueries({ queryKey: ["settings"] })
        },
        onError: (error: any) => {
            toast.error(error.message || "Failed to update profile")
        },
    })
}
