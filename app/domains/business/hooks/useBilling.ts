import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { apiClient } from "@/app/lib/api-client"
import { toast } from "sonner"
import { storage } from "@/app/lib/storage"

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
    paymentMethod?: {
        type: string
        last4: string
        brand: string
    } | null
    wallet?: {
        balance: number
        currency: string
    } | null
}

export const useSubscriptionPlans = () => {
    return useQuery({
        queryKey: ["subscription-plans"],
        queryFn: () => apiClient.get<Plan[]>("/subscriptions/plans"),
    })
}

export const useCurrentSubscription = () => {
    const businessId = storage.getActiveBusinessId() as string
    return useQuery({
        queryKey: ["current-subscription", businessId],
        queryFn: () => apiClient.get<SubscriptionResponse>("/subscriptions"),
        enabled: !!businessId,
    })
}

export interface InitiateSubscriptionPayload {
    planSlug: string
    interval: "monthly" | "yearly"
    channel?: string
    metadata?: Record<string, unknown>
}

export const useInitiateSubscription = () => {
    return useMutation({
        mutationFn: (payload: InitiateSubscriptionPayload) =>
            apiClient.post<{ paymentLink: string, transactionReference: string }>("/subscriptions/initiate", payload),
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

    return useMutation({
        mutationFn: (planSlug: string) =>
            apiClient.post<{ message: string }>("/subscriptions/downgrade", {
                planSlug,
            }),
        onSuccess: (data) => {
            toast.success(data.message || "Plan changed successfully")
            queryClient.invalidateQueries({ queryKey: ["current-subscription", businessId] })
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
}

export const useBillingHistory = () => {
    const businessId = storage.getActiveBusinessId() as string
    return useQuery({
        queryKey: ["billing-history", businessId],
        queryFn: () => apiClient.get<BillingHistoryItem[]>("/subscriptions/history"),
        enabled: !!businessId,
    })
}

export const useDownloadReceipt = () => {
    return useMutation({
        mutationFn: (transactionId: string) =>
            apiClient.get<{ url: string }>("/subscriptions/receipt", {
                transactionId,
            }),
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
