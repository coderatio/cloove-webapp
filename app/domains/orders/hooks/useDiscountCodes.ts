import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { apiClient, type ApiResponse } from "@/app/lib/api-client"
import { toast } from "sonner"
import { useBusiness } from "@/app/components/BusinessProvider"

export type DiscountCodeType = "PERCENTAGE" | "FIXED"

export interface DiscountCode {
    id: string
    businessId: string
    code: string
    name: string | null
    type: DiscountCodeType
    value: number
    isActive: boolean
    firstOrderOnly: boolean
    usageLimit: number | null
    usageCount: number
    minimumSubtotal: number | null
    maximumDiscountAmount: number | null
    startsAt: string | null
    endsAt: string | null
    createdAt: string
    updatedAt: string
}

export interface DiscountCodeInput {
    code: string
    name?: string | null
    type: DiscountCodeType
    value: number
    isActive?: boolean
    firstOrderOnly?: boolean
    usageLimit?: number | null
    minimumSubtotal?: number | null
    maximumDiscountAmount?: number | null
    startsAt?: string | null
    endsAt?: string | null
}

export interface DiscountCodeUsage {
    id: string
    businessId: string
    promotionId: string
    saleId: string | null
    customerId: string | null
    code: string | null
    subtotalAmount: number
    discountAmount: number
    source: string
    metadata: Record<string, unknown> | null
    createdAt: string
    customer?: { name?: string | null; phoneNumber?: string | null } | null
    sale?: { shortCode?: string | null; totalAmount?: number | null } | null
}

const QUERY_KEYS = {
    discountCodes: (businessId?: string) => ["promotions", "discount-codes", businessId].filter(Boolean),
    promotions: (businessId?: string) => ["promotions", businessId].filter(Boolean),
}

function extractMessage(error: unknown, fallback: string) {
    return error instanceof Error ? error.message : fallback
}

export function useDiscountCodes() {
    const { activeBusiness } = useBusiness()
    const businessId = activeBusiness?.id

    return useQuery({
        queryKey: QUERY_KEYS.discountCodes(businessId),
        queryFn: async () => {
            const response = await apiClient.get<ApiResponse<DiscountCode[]>>("/promotions", {}, { fullResponse: true })
            const promotions = Array.isArray(response.data) ? response.data : []
            return promotions.filter((promotion) => Boolean(promotion.code))
        },
        enabled: !!businessId,
    })
}

export function useDiscountCodeUsages(discountCodeId: string | null) {
    const { activeBusiness } = useBusiness()
    const businessId = activeBusiness?.id

    return useQuery({
        queryKey: ["promotions", discountCodeId, "usages", businessId].filter(Boolean),
        queryFn: async () => {
            const response = await apiClient.get<ApiResponse<DiscountCodeUsage[]>>(
                `/promotions/${discountCodeId}/usages`,
                {},
                { fullResponse: true }
            )
            return Array.isArray(response.data) ? response.data : []
        },
        enabled: !!businessId && !!discountCodeId,
    })
}

export function useCreateDiscountCode() {
    const queryClient = useQueryClient()
    const { activeBusiness } = useBusiness()
    const businessId = activeBusiness?.id

    return useMutation({
        mutationFn: (payload: DiscountCodeInput) =>
            apiClient.post<ApiResponse<DiscountCode>>(
                "/promotions",
                {
                    ...payload,
                    name: payload.name?.trim() || payload.code,
                    scope: "specific_products",
                },
                { fullResponse: true }
            ),
        onSuccess: (response) => {
            toast.success(response.message || "Discount code created")
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.discountCodes(businessId) })
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.promotions(businessId) })
        },
        onError: (error) => {
            toast.error(extractMessage(error, "Failed to create discount code"))
        },
    })
}

export function useUpdateDiscountCode() {
    const queryClient = useQueryClient()
    const { activeBusiness } = useBusiness()
    const businessId = activeBusiness?.id

    return useMutation({
        mutationFn: ({ id, payload }: { id: string; payload: Partial<DiscountCodeInput> }) =>
            apiClient.put<ApiResponse<DiscountCode>>(`/promotions/${id}`, payload, { fullResponse: true }),
        onSuccess: (response) => {
            toast.success(response.message || "Discount code updated")
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.discountCodes(businessId) })
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.promotions(businessId) })
        },
        onError: (error) => {
            toast.error(extractMessage(error, "Failed to update discount code"))
        },
    })
}

export function useDeleteDiscountCode() {
    const queryClient = useQueryClient()
    const { activeBusiness } = useBusiness()
    const businessId = activeBusiness?.id

    return useMutation({
        mutationFn: (id: string) =>
            apiClient.delete<ApiResponse<void>>(`/promotions/${id}`, { fullResponse: true }),
        onSuccess: (response) => {
            toast.success(response.message || "Discount code deleted")
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.discountCodes(businessId) })
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.promotions(businessId) })
        },
        onError: (error) => {
            toast.error(extractMessage(error, "Failed to delete discount code"))
        },
    })
}
