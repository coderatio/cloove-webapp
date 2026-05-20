import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { apiClient } from "@/app/lib/api-client"
import { toast } from "sonner"
import { storage } from "@/app/lib/storage"
import { useAuth } from "@/app/components/providers/auth-provider"
import { useBusiness } from "@/app/components/BusinessProvider"

export interface Plan {
    id: string
    slug: string
    name: string
    description: string
    monthlyPrice: number
    yearlyPrice: number
    currency: string
    benefits: Record<string, unknown>
    features: string[]
}

export interface BillingAddon {
    id: string
    slug: string
    name: string
    description: string | null
    monthlyPrice: number
    yearlyPrice: number
    currency: string
    featureKey: string
    metadata?: Record<string, unknown> | null
    isActive: boolean
}

export interface ActiveAddon {
    id: string
    slug: string
    name: string
    featureKey: string
    status: string
    interval: "monthly" | "yearly"
    quantity: number
    amount: number
    currency: string
    startsAt: string
    endsAt: string | null
}

export interface BillingAddonSelection {
    slug: string
    businessId: string
    quantity?: number
}

export interface QuoteLineItem {
    kind: "plan" | "addon"
    interval: "monthly" | "yearly"
    currency: string
    totalAmount: number
    unitAmount?: number
    quantity?: number
    planId?: string
    planSlug?: string
    planName?: string
    businessId?: string
    slug?: string
    name?: string
    featureKey?: string
    description?: string | null
}

export interface Subscription {
    id: string
    planId: string
    status: string
    interval: "monthly" | "yearly"
    amount: number
    currency: string
    startsAt: string
    endsAt: string | null
    trialEndsAt: string | null
    plan?: Plan
}

export interface SubscriptionResponse {
    currentPlan: Plan | null
    subscription: Subscription | null
    activeAddons: ActiveAddon[]
    paymentMethod?: {
        type: string
        last4: string
        brand: string
    } | null
    wallet?: {
        balance: number
        currency: string
    } | null
    renewalPreference?: {
        walletDeductionEnabled: boolean
        autoRenewalMode: "wallet" | "gateway_only"
    }
}

export interface SubscriptionQuote {
    baseAmount: number
    addonAmount: number
    totalAmount: number
    currency: string
    planLine: QuoteLineItem | null
    addonLines: QuoteLineItem[]
    wallet: {
        businessId: string
        balance: number
        currency: string
        sufficient: boolean
    } | null
}

export interface SubscriptionPlansResponse {
    plans: Plan[]
    addons: BillingAddon[]
}

export const useSubscriptionPlans = (billingBusinessId?: string | null) => {
    const effectiveId = billingBusinessId ?? storage.getActiveBusinessId()
    return useQuery({
        queryKey: ["subscription-plans", effectiveId ?? ""],
        queryFn: () =>
            apiClient.get<SubscriptionPlansResponse>("/subscriptions/plans", undefined, {
                businessIdOverride: effectiveId ?? undefined,
            }),
        enabled: !!effectiveId,
    })
}

export const useCurrentSubscription = (billingBusinessId?: string | null) => {
    const effectiveId = billingBusinessId ?? storage.getActiveBusinessId()
    return useQuery({
        queryKey: ["current-subscription", effectiveId ?? ""],
        queryFn: () =>
            apiClient.get<SubscriptionResponse>("/subscriptions", undefined, {
                businessIdOverride: effectiveId ?? undefined,
            }),
        enabled: !!effectiveId,
        staleTime: 0,
        refetchOnMount: true,
    })
}

export interface InitiateSubscriptionPayload {
    planSlug?: string | null
    interval: "monthly" | "yearly"
    addons?: BillingAddonSelection[]
    channel?: string
    metadata?: Record<string, unknown>
    businessIdOverride?: string | null
}

export const useInitiateSubscription = () => {
    return useMutation({
        mutationFn: (payload: InitiateSubscriptionPayload) => {
            const { businessIdOverride, ...body } = payload
            return apiClient.post<{ paymentLink: string; transactionReference: string }>(
                "/subscriptions/initiate",
                { channel: "web", ...body },
                { businessIdOverride: businessIdOverride ?? undefined }
            )
        },
        onSuccess: (data) => {
            if (data.paymentLink) {
                window.location.href = data.paymentLink
            }
        },
        onError: (error: Error) => {
            toast.error(error.message || "Failed to initiate subscription")
        },
    })
}

export const useSubscriptionQuote = (
    planSlug: string | null,
    interval: "monthly" | "yearly" | null,
    addons: BillingAddonSelection[] = [],
    billingBusinessId?: string | null,
    enabled = true
) => {
    const effectiveId = billingBusinessId ?? storage.getActiveBusinessId()
    return useQuery({
        queryKey: ["subscription-quote", effectiveId ?? "", planSlug ?? "", interval ?? "", JSON.stringify(addons)],
        queryFn: () =>
            apiClient.get<SubscriptionQuote>(
                "/subscriptions/quote",
                {
                    ...(planSlug ? { planSlug } : {}),
                    ...(interval ? { interval } : {}),
                    ...(addons.length ? { addons: JSON.stringify(addons) } : {}),
                },
                { businessIdOverride: effectiveId ?? undefined }
            ),
        enabled: !!effectiveId && (!!planSlug || addons.length > 0) && !!interval && enabled,
    })
}

export const usePaySubscriptionFromWallet = () => {
    const queryClient = useQueryClient()
    const { refreshUser } = useAuth()
    const { refreshBusinesses } = useBusiness()
    return useMutation({
        mutationFn: (payload: {
            planSlug?: string | null
            interval: "monthly" | "yearly"
            addons?: BillingAddonSelection[]
            pin: string
            businessIdOverride?: string | null
        }) => {
            const { businessIdOverride, pin, ...body } = payload
            return apiClient.post<{ subscription: Subscription; changeType: string }>(
                "/subscriptions/pay-with-wallet",
                { ...body, pin },
                { businessIdOverride: businessIdOverride ?? undefined }
            )
        },
        onSuccess: async (_data, variables) => {
            toast.success("Subscription updated")
            const id = variables.businessIdOverride ?? storage.getActiveBusinessId()
            queryClient.invalidateQueries({ queryKey: ["current-subscription", id] })
            queryClient.invalidateQueries({ queryKey: ["billing-history", id ?? ""] })
            queryClient.invalidateQueries({ queryKey: ["subscription-quote"] })
            await refreshUser()
            await refreshBusinesses()
        },
        onError: (error: Error) => {
            toast.error(error.message || "Wallet payment failed")
        },
    })
}

export const useUpdateRenewalPreference = () => {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: (payload: {
            autoRenewalMode?: "wallet" | "gateway_only"
            walletDeductionEnabled?: boolean
            businessIdOverride?: string | null
        }) => {
            const { businessIdOverride, ...body } = payload
            return apiClient.post("/subscriptions/renewal-preference", body, {
                businessIdOverride: businessIdOverride ?? undefined,
            })
        },
        onSuccess: (_data, variables) => {
            toast.success("Renewal preferences saved")
            const id = variables.businessIdOverride ?? storage.getActiveBusinessId()
            queryClient.invalidateQueries({ queryKey: ["current-subscription", id] })
        },
        onError: (error: Error) => {
            toast.error(error.message || "Could not save preferences")
        },
    })
}

export const useCancelSubscription = () => {
    const queryClient = useQueryClient()
    const businessId = storage.getActiveBusinessId()

    return useMutation({
        mutationFn: () =>
            apiClient.post<{ message?: string }>("/subscriptions/cancel", {}),
        onSuccess: (data: { message?: string }) => {
            toast.success(data.message || "Subscription canceled")
            queryClient.invalidateQueries({ queryKey: ["current-subscription", businessId] })
        },
        onError: (error: Error) => {
            toast.error(error.message || "Failed to cancel subscription")
        },
    })
}
export interface UsageStats {
    products: number
    staffAccounts: number
    conversations: number
    businesses: number
}

export const useUsageStats = () => {
    const businessId = storage.getActiveBusinessId() as string
    return useQuery({
        queryKey: ["subscription-usage", businessId],
        queryFn: () => apiClient.get<UsageStats>("/subscriptions/usage"),
        enabled: !!businessId,
    })
}

export const useDowngradeSubscription = () => {
    const queryClient = useQueryClient()
    const businessId = storage.getActiveBusinessId()
    const { refreshBusinesses } = useBusiness()

    return useMutation({
        mutationFn: (
            payload: string | { planSlug: string; businessIdOverride?: string | null }
        ) => {
            const planSlug = typeof payload === "string" ? payload : payload.planSlug
            const businessIdOverride =
                typeof payload === "string" ? undefined : payload.businessIdOverride
            return apiClient.post<{ message: string }>(
                "/subscriptions/downgrade",
                { planSlug },
                { businessIdOverride: businessIdOverride ?? undefined }
            )
        },
        onSuccess: async (data, variables) => {
            toast.success(data.message || "Plan changed successfully")
            const effectiveId =
                typeof variables === "string"
                    ? businessId
                    : variables.businessIdOverride ?? businessId
            queryClient.invalidateQueries({ queryKey: ["current-subscription", effectiveId] })
            await refreshBusinesses()
        },
        onError: (error: Error) => {
            toast.error(error.message || "Failed to change plan")
        },
    })
}

export interface BillingHistoryItem {
    id: string
    date: string
    amount: number
    currency: string
    description: string
    status: 'Paid' | 'Pending' | 'Failed'
    reference: string
    lineItems: QuoteLineItem[]
}

export const useBillingHistory = (billingBusinessId?: string | null) => {
    const effectiveId = billingBusinessId ?? storage.getActiveBusinessId()
    return useQuery({
        queryKey: ["billing-history", effectiveId ?? ""],
        queryFn: () =>
            apiClient.get<BillingHistoryItem[]>("/subscriptions/history", undefined, {
                businessIdOverride: effectiveId ?? undefined,
            }),
        enabled: !!effectiveId,
    })
}

export const useDownloadReceipt = () => {
    return useMutation({
        mutationFn: (
            arg:
                | string
                | { transactionId: string; businessIdOverride?: string | null }
        ) => {
            const params =
                typeof arg === "string"
                    ? { transactionId: arg }
                    : arg
            return apiClient.get<{ url: string }>(
                "/subscriptions/receipt",
                { transactionId: params.transactionId },
                { businessIdOverride: params.businessIdOverride ?? undefined }
            )
        },
        onSuccess: (data) => {
            if (data.url) {
                window.open(data.url, "_blank")
            }
        },
        onError: (error: Error) => {
            toast.error(error.message || "Failed to download receipt")
        },
    })
}

export const useVerifyPayment = () => {
    return useMutation({
        mutationFn: (params: { transaction_id: string, tx_ref: string }) =>
            apiClient.get<{ success: boolean, message: string }>("/subscriptions/verify", params as any),
    })
}
