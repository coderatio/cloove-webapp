import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { apiClient, ApiResponse } from "@/app/lib/api-client"
import { toast } from "sonner"
import { useBusiness } from "@/app/components/BusinessProvider"
import { Order, OrderFilterParams, OrdersResponse } from "../types"

export function useOrder(orderId: string | null) {
    const { activeBusiness } = useBusiness()
    const businessId = activeBusiness?.id

    const { data: response, isLoading, error, refetch } = useQuery<ApiResponse<Order>>({
        queryKey: ['sales', 'detail', businessId, orderId],
        queryFn: () => apiClient.get<ApiResponse<Order>>(`/sales/${orderId}`, {}, { fullResponse: true }),
        enabled: !!businessId && !!orderId,
    })

    return {
        order: response?.data ?? null,
        isLoading,
        error,
        refetch,
    }
}

/**
 * Hook for managing orders/sales.
 * Supports server-side search, filtering and pagination.
 */
export function useOrders(
    page: number = 1,
    limit: number = 50,
    filters?: OrderFilterParams
) {
    const queryClient = useQueryClient()
    const { activeBusiness } = useBusiness()
    const businessId = activeBusiness?.id

    const params: Record<string, string> = {
        page: String(page),
        limit: String(limit),
    }

    if (filters?.search) params.search = filters.search
    if (filters?.status && filters.status.length > 0) {
        params.status = filters.status.map(s => s.startsWith('S:') ? s.slice(2) : s).join(',')
    }

    if (filters?.paymentStatus && filters.paymentStatus.length > 0) {
        params.paymentStatus = filters.paymentStatus.map(p => p.startsWith('P:') ? p.slice(2) : p).join(',')
    }

    if (filters?.isAutomated !== undefined) {
        params.isAutomated = String(filters.isAutomated)
    } else if (filters?.automation) {
        if (filters.automation.includes('A:AUTOMATED') && !filters.automation.includes('A:MANUAL')) {
            params.isAutomated = 'true'
        } else if (filters.automation.includes('A:MANUAL') && !filters.automation.includes('A:AUTOMATED')) {
            params.isAutomated = 'false'
        }
    }

    if (filters?.startDate) params.startDate = filters.startDate
    if (filters?.endDate) params.endDate = filters.endDate

    if (filters?.storeId && filters.storeId !== 'all-stores') params.storeId = filters.storeId
    if (filters?.storeIds && filters.storeIds.length > 0) params.storeIds = filters.storeIds.join(',')
    if (filters?.customerId) params.customerId = filters.customerId

    const { data: response, isLoading, isFetching, error, refetch } = useQuery<OrdersResponse>({
        queryKey: ['sales', businessId, page, limit, filters?.search, filters?.status, filters?.paymentStatus, filters?.automation, filters?.isAutomated, filters?.startDate, filters?.endDate, filters?.storeId, filters?.storeIds],
        queryFn: () => apiClient.get<OrdersResponse>('/sales', params, { fullResponse: true }),
        enabled: !!businessId,
        staleTime: 30000, // 30 seconds
    })

    const deleteOrderMutation = useMutation({
        mutationFn: (id: string) => apiClient.delete(`/sales/${id}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['sales', businessId] })
        }
    })

    const updateOrderMutation = useMutation({
        mutationFn: ({ id, updates }: { id: string, updates: Partial<Order> }) =>
            apiClient.patch(`/sales/${id}`, updates),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['sales', businessId] })
        }
    })

    const requeryOrderMutation = useMutation({
        mutationFn: (id: string) => apiClient.post(`/sales/${id}/requery`, {}),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['sales', businessId] })
        }
    })

    const getPrintTokenMutation = useMutation({
        mutationFn: (id: string) => apiClient.post<{ url: string }>(`/sales/${id}/print-token`, {}),
    })

    const generateReceiptMutation = useMutation({
        mutationFn: (id: string) => apiClient.post(`/invoices/receipt`, { saleId: id, businessId }),
        onSuccess: async (data: any, id: string) => {
            // apiClient unwraps the response, so data IS the inner { url: "..." } object
            const receiptUrl = data?.url
            if (receiptUrl) {
                try {
                    // Fetch the blob to bypass popup blockers and force a download
                    const response = await fetch(receiptUrl)
                    const blob = await response.blob()
                    const blobUrl = window.URL.createObjectURL(blob)

                    const link = document.createElement('a')
                    link.href = blobUrl
                    link.download = `receipt-${id.slice(0, 8)}.pdf`
                    document.body.appendChild(link)
                    link.click()

                    // Cleanup
                    document.body.removeChild(link)
                    window.URL.revokeObjectURL(blobUrl)
                } catch (error) {
                    console.error("Failed to download receipt:", error)
                    // Fallback: open in new tab if blob fetch fails (e.g. CORS)
                    window.open(receiptUrl, '_blank')
                }
            }
        }
    })

    return {
        orders: response?.data || [],
        meta: response?.meta,
        summary: response?.summary,
        isLoading,
        isFetching,
        error: error as any,
        refetch,
        deleteOrder: deleteOrderMutation.mutateAsync,
        isDeleting: deleteOrderMutation.isPending,
        updateOrder: updateOrderMutation.mutateAsync,
        isUpdating: updateOrderMutation.isPending,
        requeryOrder: requeryOrderMutation.mutateAsync,
        isRequerying: requeryOrderMutation.isPending,
        generateReceipt: generateReceiptMutation.mutateAsync,
        isGeneratingReceipt: generateReceiptMutation.isPending,
        getPrintToken: getPrintTokenMutation.mutateAsync,
        isGettingPrintToken: getPrintTokenMutation.isPending,
    }
}
