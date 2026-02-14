import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { apiClient, ApiResponse } from "@/app/lib/api-client"
import { toast } from "sonner"
import { useBusiness } from "@/app/components/BusinessProvider"

export interface ProductImage {
    id: string
    url: string
    isPrimary: boolean
    alt?: string
}

export interface StoreInventory {
    id: string
    storeId: string
    productId: string
    variantId: string
    stockQuantity: number
    store?: {
        id: string
        name: string
    }
}

export interface ProductVariant {
    id: string
    productId: string
    name: string | null
    sku: string | null
    price: number | null
    inventories: StoreInventory[]
}

export interface Product {
    id: string
    businessId: string
    name: string
    description: string | null
    basePrice: number
    images: ProductImage[]
    variants: ProductVariant[]
}

export interface InventoryStats {
    totalValue: number
    totalProducts: number
    totalStockUnits: number
    lowStockItems: number
}

/**
 * Hook for managing product inventory
 */
export function useInventory(storeId?: string) {
    const queryClient = useQueryClient()
    const { activeBusiness } = useBusiness()
    const businessId = activeBusiness?.id

    const { data: response, isLoading, error } = useQuery<ApiResponse<Product[]>>({
        queryKey: ['products', businessId, storeId],
        queryFn: () => apiClient.get<ApiResponse<Product[]>>('/products', { storeId: storeId || '' }, { fullResponse: true }),
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
        meta: response?.meta,
        summary: response?.summary as InventoryStats | undefined,
        isLoading,
        error,
        createProduct: createProductMutation.mutateAsync,
        updateProduct: updateProductMutation.mutateAsync,
        deleteProduct: deleteProductMutation.mutateAsync
    }
}
