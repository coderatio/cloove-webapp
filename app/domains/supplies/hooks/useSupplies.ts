import { useCallback } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { apiClient, ApiResponse } from "@/app/lib/api-client"
import { toast } from "sonner"
import { useBusiness } from "@/app/components/BusinessProvider"
import {
    Supply,
    SupplyStats,
    CreateSupplyPayload,
    AdjustStockPayload,
} from "../types"

export interface SupplyFilterParams {
    search?: string
    status?: string[]
    categoryIds?: string[]
}

/**
 * Hook for managing internal stock / supplies.
 * Fully separate from products — no catalog sync, embeddings, or ordering.
 */
export function useSupplies(
    storeId?: string,
    page: number = 1,
    limit: number = 10,
    filters?: SupplyFilterParams
) {
    const queryClient = useQueryClient()
    const { activeBusiness } = useBusiness()
    const businessId = activeBusiness?.id

    const refreshLists = useCallback(async () => {
        if (!businessId) return
        await queryClient.refetchQueries({
            predicate: (query) =>
                Array.isArray(query.queryKey) &&
                query.queryKey[0] === "supplies" &&
                query.queryKey[1] === businessId,
        })
    }, [businessId, queryClient])

    const params: Record<string, string> = {
        page: String(page),
        limit: String(limit),
    }
    if (storeId && storeId !== "all-stores") params.storeId = storeId
    if (filters?.search) params.search = filters.search
    if (filters?.status && filters.status.length > 0) params.status = filters.status.join(",")
    if (filters?.categoryIds && filters.categoryIds.length > 0) params.categoryIds = filters.categoryIds.join(",")

    const { data: response, isLoading, isFetching, error } = useQuery<ApiResponse<Supply[]>>({
        queryKey: ["supplies", businessId, storeId, page, limit, filters?.search, filters?.status, filters?.categoryIds],
        queryFn: () =>
            apiClient.get<ApiResponse<Supply[]>>("/supplies", params, { fullResponse: true }),
        enabled: !!businessId,
    })

    const createMutation = useMutation({
        mutationFn: (data: CreateSupplyPayload) => apiClient.post("/supplies", data),
        onSuccess: async (data: any) => {
            toast.success(data.message || "Supply added successfully")
            await refreshLists()
        },
        onError: (err: any) => {
            toast.error(err.message || "Failed to add supply")
        },
    })

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<CreateSupplyPayload> }) =>
            apiClient.patch(`/supplies/${id}`, data),
        onSuccess: async (data: any) => {
            toast.success(data.message || "Supply updated successfully")
            await refreshLists()
        },
        onError: (err: any) => {
            toast.error(err.message || "Failed to update supply")
        },
    })

    const deleteMutation = useMutation({
        mutationFn: (id: string) => apiClient.delete(`/supplies/${id}`),
        onSuccess: async (data: any) => {
            toast.success(data.message || "Supply deleted successfully")
            await refreshLists()
        },
        onError: (err: any) => {
            toast.error(err.message || "Failed to delete supply")
        },
    })

    const adjustStockMutation = useMutation({
        mutationFn: ({ id, storeId: targetStore, adjustment, mode }: AdjustStockPayload) =>
            apiClient.post(`/supplies/${id}/adjust-stock`, {
                storeId: targetStore,
                adjustment,
                mode,
            }),
        onSuccess: async (data: any) => {
            toast.success(data.message || "Stock adjusted successfully")
            await refreshLists()
        },
        onError: (err: any) => {
            toast.error(err.message || "Failed to adjust stock")
        },
    })

    return {
        supplies: response?.data || [],
        meta: response?.meta
            ? { ...response.meta, totalPages: (response.meta as any).lastPage || 1 }
            : undefined,
        summary: response?.summary as SupplyStats | undefined,
        isLoading,
        isFetching,
        error,
        createSupply: createMutation.mutateAsync,
        updateSupply: updateMutation.mutateAsync,
        deleteSupply: deleteMutation.mutateAsync,
        adjustStock: adjustStockMutation.mutateAsync,
        isAdjustingStock: adjustStockMutation.isPending,
    }
}
