import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { apiClient, ApiResponse } from "@/app/lib/api-client"
import { toast } from "sonner"
import { useBusiness } from "@/app/components/BusinessProvider"
import { Order, OrderFilterParams, OrdersResponse } from "../types"

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
    if (filters?.status && filters.status !== 'ALL') params.status = filters.status
    if (filters?.storeId && filters.storeId !== 'all-stores') params.storeId = filters.storeId
    if (filters?.storeIds && filters.storeIds.length > 0) params.storeIds = filters.storeIds.join(',')

    const { data: response, isLoading, isFetching, error, refetch } = useQuery<OrdersResponse>({
        queryKey: ['sales', businessId, page, limit, filters?.search, filters?.status, filters?.storeId, filters?.storeIds],
        queryFn: () => apiClient.get<OrdersResponse>('/sales', params, { fullResponse: true }),
        enabled: !!businessId,
        staleTime: 30000, // 30 seconds
    })

    const deleteOrderMutation = useMutation({
        mutationFn: (id: string) => apiClient.delete(`/sales/${id}`),
        onSuccess: (data: any) => {
            toast.success(data.message || "Order deleted successfully")
            queryClient.invalidateQueries({ queryKey: ['sales', businessId] })
        },
        onError: (error: any) => {
            toast.error(error.message || "Failed to delete order")
        }
    })

    const updateOrderMutation = useMutation({
        mutationFn: ({ id, updates }: { id: string, updates: Partial<Order> }) =>
            apiClient.patch(`/sales/${id}`, updates),
        onSuccess: (data: any) => {
            toast.success(data.message || "Order updated successfully")
            queryClient.invalidateQueries({ queryKey: ['sales', businessId] })
        },
        onError: (error: any) => {
            toast.error(error.message || "Failed to update order")
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
        isUpdating: updateOrderMutation.isPending
    }
}
