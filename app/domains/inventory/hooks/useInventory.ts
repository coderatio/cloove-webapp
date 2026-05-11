import { useCallback } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { apiClient, ApiResponse } from "@/app/lib/api-client"
import { toast } from "sonner"
import { useBusiness } from "@/app/components/BusinessProvider"
import { Product, InventoryStats } from "../types"

export interface ProductFilterParams {
    search?: string
    status?: string[]
    storeIds?: string[]
    categoryId?: string
    categoryIds?: string[]
}

/**
 * Hook for managing product inventory.
 * Pass filters to enable server-side search and status (In Stock / Low Stock) filtering.
 */
export function useInventory(
    storeId?: string,
    page: number = 1,
    limit: number = 10,
    filters?: ProductFilterParams
) {
    const queryClient = useQueryClient()
    const { activeBusiness } = useBusiness()
    const businessId = activeBusiness?.id

    /** Forces refetch so catalog sync/remove updates badges immediately (global staleTime is 60s). */
    const refreshProductLists = useCallback(async () => {
        if (!businessId) return
        await queryClient.refetchQueries({
            predicate: (query) =>
                Array.isArray(query.queryKey) &&
                query.queryKey[0] === "products" &&
                query.queryKey[1] === businessId,
        })
    }, [businessId, queryClient])

    /**
     * White-label catalog sync enqueues a queue job — DB/catalog badges update after the worker runs.
     * Global sync writes synchronously; short follow-ups still help if list aggregation lags slightly.
     */
    const scheduleCatalogSyncFollowUpRefetches = useCallback(
        (scope: "whitelabel" | "global") => {
            const delaysMs =
                scope === "whitelabel"
                    ? [2500, 6000, 12000, 25000]
                    : [1200, 3500]
            delaysMs.forEach((ms) => {
                setTimeout(() => {
                    void refreshProductLists()
                }, ms)
            })
        },
        [refreshProductLists]
    )

    const params: Record<string, string> = {
        page: String(page),
        limit: String(limit),
    }
    if (storeId && storeId !== 'all-stores') params.storeId = storeId
    if (filters?.search) params.search = filters.search
    if (filters?.status && filters.status.length > 0) params.status = filters.status.join(',')
    if (filters?.storeIds && filters.storeIds.length > 0) params.storeIds = filters.storeIds.join(',')
    if (filters?.categoryId) params.categoryId = filters.categoryId
    if (filters?.categoryIds && filters.categoryIds.length > 0) params.categoryIds = filters.categoryIds.join(',')

    const { data: response, isLoading, isFetching, error } = useQuery<ApiResponse<Product[]>>({
        queryKey: ['products', businessId, storeId, page, limit, filters?.search, filters?.status, filters?.storeIds, filters?.categoryId, filters?.categoryIds],
        queryFn: () => apiClient.get<ApiResponse<Product[]>>('/products', params, { fullResponse: true }),
        enabled: !!businessId
    })

    const createProductMutation = useMutation({
        mutationFn: (data: any) => apiClient.post('/products', data),
        onSuccess: async (data: any) => {
            toast.success(data.message || "Product added successfully")
            await refreshProductLists()
        },
        onError: (error: any) => {
            toast.error(error.message || "Failed to add product")
        }
    })

    const updateProductMutation = useMutation({
        mutationFn: ({ id, data }: { id: string, data: any }) =>
            apiClient.patch(`/products/${id}`, data),
        onSuccess: async (data: any) => {
            toast.success(data.message || "Product updated successfully")
            await refreshProductLists()
        },
        onError: (error: any) => {
            toast.error(error.message || "Failed to update product")
        }
    })

    const deleteProductMutation = useMutation({
        mutationFn: (id: string) => apiClient.delete(`/products/${id}`),
        onSuccess: async (data: any) => {
            toast.success(data.message || "Product deleted successfully")
            await refreshProductLists()
        },
        onError: (error: any) => {
            toast.error(error.message || "Failed to delete product")
        }
    })

    const syncProductCatalogMutation = useMutation({
        mutationFn: ({ id, scope }: { id: string, scope: 'whitelabel' | 'global', productName?: string }) =>
            apiClient.post(`/products/${id}/catalog/sync`, { scope }),
        onSuccess: (_data, variables) => {
            scheduleCatalogSyncFollowUpRefetches(variables.scope)
        },
        onSettled: async () => {
            await refreshProductLists()
        },
    })

    const removeProductFromCatalogMutation = useMutation({
        mutationFn: ({ id, scope }: { id: string; scope: 'whitelabel' | 'global' | 'all' }) =>
            apiClient.post(`/products/${id}/remove-from-catalog`, { scope }),
        onSettled: async () => {
            await refreshProductLists()
        },
    })

    const syncProductCatalog = async (input: { id: string, scope: 'whitelabel' | 'global', productName?: string }) => {
        const scopeLabel = input.scope === 'global' ? 'global' : 'white-label'
        const name = input.productName?.trim() ? `"${input.productName.trim()}"` : 'product'
        const promise = syncProductCatalogMutation.mutateAsync(input)
        await toast.promise(promise, {
            loading: `Syncing ${scopeLabel} catalog for ${name}...`,
            success: (data: any) => data?.message || `${name} synced to ${scopeLabel} catalog`,
            error: (error: any) => error?.message || `Failed to sync ${name} to ${scopeLabel} catalog`
        })
        return await promise
    }

    const removeProductFromCatalog = async (
        id: string,
        productName: string | undefined,
        scope: 'whitelabel' | 'global' | 'all'
    ) => {
        const name = productName?.trim() ? `"${productName.trim()}"` : 'product'
        const scopePhrase =
            scope === 'global'
                ? 'global catalog'
                : scope === 'whitelabel'
                  ? 'white-label catalog'
                  : 'WhatsApp catalogs'
        const promise = removeProductFromCatalogMutation.mutateAsync({ id, scope })
        await toast.promise(promise, {
            loading: `Removing ${name} from ${scopePhrase}...`,
            success: (data: any) => data?.message || `${name} removed from ${scopePhrase}`,
            error: (error: any) => error?.message || `Failed to remove ${name} from ${scopePhrase}`,
        })
        return await promise
    }

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
        deleteProduct: deleteProductMutation.mutateAsync,
        syncProductCatalog,
        syncingCatalogState: syncProductCatalogMutation.isPending
            ? {
                productId: syncProductCatalogMutation.variables?.id ?? null,
                scope: syncProductCatalogMutation.variables?.scope ?? null
            }
            : { productId: null, scope: null },
        removeProductFromCatalog,
        removingFromCatalogState: removeProductFromCatalogMutation.isPending
            ? {
                  productId: removeProductFromCatalogMutation.variables?.id ?? null,
                  scope: removeProductFromCatalogMutation.variables?.scope ?? null,
              }
            : { productId: null, scope: null },
    }
}
