import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { apiClient, ApiResponse } from "@/app/lib/api-client"
import { toast } from "sonner"
import { useBusiness } from "@/app/components/BusinessProvider"
import { Product, InventoryStats } from "../types"

/**
 * Hook for managing product inventory
 */
export function useInventory(storeId?: string, page: number = 1, limit: number = 10) {
    const queryClient = useQueryClient()
    const { activeBusiness } = useBusiness()
    const businessId = activeBusiness?.id

    const { data: response, isLoading, isFetching, error } = useQuery<ApiResponse<Product[]>>({
        queryKey: ['products', businessId, storeId, page, limit],
        queryFn: () => apiClient.get<ApiResponse<Product[]>>('/products', {
            storeId: storeId || '',
            page: String(page),
            limit: String(limit)
        }, { fullResponse: true }),
        enabled: !!businessId
    })

    const createProductMutation = useMutation({
        mutationFn: (data: any) => apiClient.post('/products', data),
        onSuccess: (data: any) => {
            toast.success(data.message || "Product added successfully")
            queryClient.invalidateQueries({ queryKey: ['products', businessId] })
        },
        onError: (error: any) => {
            toast.error(error.message || "Failed to add product")
        }
    })

    const updateProductMutation = useMutation({
        mutationFn: ({ id, data }: { id: string, data: any }) =>
            apiClient.patch(`/products/${id}`, data),
        onSuccess: (data: any) => {
            toast.success(data.message || "Product updated successfully")
            queryClient.invalidateQueries({ queryKey: ['products', businessId] })
        },
        onError: (error: any) => {
            toast.error(error.message || "Failed to update product")
        }
    })

    const deleteProductMutation = useMutation({
        mutationFn: (id: string) => apiClient.delete(`/products/${id}`),
        onSuccess: (data: any) => {
            toast.success(data.message || "Product deleted successfully")
            queryClient.invalidateQueries({ queryKey: ['products', businessId] })
        },
        onError: (error: any) => {
            toast.error(error.message || "Failed to delete product")
        }
    })

    return {
        products: response?.data || [],
        meta: response?.meta ? {
            ...response.meta,
            totalPages: (response.meta as any).lastPage || 1
        } : undefined,
        summary: response?.summary as InventoryStats | undefined,
        isLoading,
        isFetching,
        error,
        createProduct: createProductMutation.mutateAsync,
        updateProduct: updateProductMutation.mutateAsync,
        deleteProduct: deleteProductMutation.mutateAsync
    }
}
