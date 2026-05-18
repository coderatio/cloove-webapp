import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { apiClient } from "@/app/lib/api-client"
import { toast } from "sonner"

export interface BusinessConfigs {
    low_stock_threshold: number
    low_stock_alert_enabled: boolean
    allow_credit_sales: boolean
    require_customer_for_sale: boolean
    auto_generate_receipt: boolean
    default_payment_method: string
    sales_virtual_account_provider?: string
    customer_checkout_fulfillment_methods?: string[]
    customer_checkout_payment_methods?: string[]
    customer_checkout_dine_in_locations?: Array<{
        id?: string
        title?: string
        description?: string
    }>
    customer_checkout_require_confirmation?: boolean
    debt_reminder_enabled: boolean
    daily_summary_enabled: boolean
    email_summaries_enabled: boolean
    show_wallet_balance: boolean
    ui_layout_preset?: string
    session_expiration_mode?: "default" | "custom" | "never"
    session_expiration_ttl_minutes?: number
    /** School preset: UUID of default academic term for new fee sales */
    school_active_academic_term_id?: string
    /** School preset: fee label/amount presets (JSON array or parsed) */
    school_fee_templates?: unknown
    feature_flags?: Record<string, boolean>
    [key: string]: unknown
}

interface MutationResponse {
    message?: string
}

function stripQuietFlag(variables: Partial<BusinessConfigs> & { quiet?: boolean }): Partial<BusinessConfigs> {
    return Object.fromEntries(Object.entries(variables).filter(([key]) => key !== "quiet")) as Partial<BusinessConfigs>
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
            const configs = stripQuietFlag(variables)
            return apiClient.patch<MutationResponse>("/settings/business", { configs })
        },
        onMutate: async (newConfigs) => {
            // Cancel any outgoing refetches
            await queryClient.cancelQueries({ queryKey: ["settings"] })

            // Snapshot the previous value
            const previousSettings = queryClient.getQueryData<SettingsResponse>(["settings"])

            // Optimistically update to the new value
            if (previousSettings) {
                const configs = stripQuietFlag(newConfigs)
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
        onError: (_err, _newConfigs, context) => {
            if (context?.previousSettings) {
                queryClient.setQueryData(["settings"], context.previousSettings)
            }
            toast.error("Failed to update business settings")
        },
        onSuccess: (data: MutationResponse, variables) => {
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
            apiClient.patch<MutationResponse>("/settings/profile", payload, { fullResponse: true }),
        onSuccess: (data) => {
            toast.success(data.message || "Profile updated successfully")
            queryClient.invalidateQueries({ queryKey: ["settings"] })
        },
        onError: (error: unknown) => {
            const message = error instanceof Error ? error.message : "Failed to update profile"
            toast.error(message)
        },
    })
}
