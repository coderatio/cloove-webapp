import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { apiClient, ApiResponse } from "@/app/lib/api-client"
import { toast } from "sonner"
import { useBusiness } from "@/app/components/BusinessProvider"

export interface SupplyCategoryRow {
    id: string
    name: string
    slug: string
    parentId?: string | null
    sortOrder?: number | null
}

export function useSupplyCategories() {
    const queryClient = useQueryClient()
    const { activeBusiness } = useBusiness()
    const businessId = activeBusiness?.id

    const { data: response, isLoading, error } = useQuery<ApiResponse<SupplyCategoryRow[]>>({
        queryKey: ["supply-categories", businessId],
        queryFn: () =>
            apiClient.get<ApiResponse<SupplyCategoryRow[]>>("/supplies/categories", {}, { fullResponse: true }),
        enabled: !!businessId,
    })

    const createCategoryMutation = useMutation({
        mutationFn: (data: { name: string; slug?: string; parentId?: string; sortOrder?: number }) =>
            apiClient.post("/supplies/categories", data),
        onSuccess: (data: any) => {
            toast.success(data?.message ?? "Category created")
            queryClient.invalidateQueries({ queryKey: ["supply-categories", businessId] })
        },
        onError: (err: any) => toast.error(err?.message ?? "Failed to create category"),
    })

    const updateCategoryMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: { name?: string; slug?: string; parentId?: string; sortOrder?: number } }) =>
            apiClient.patch(`/supplies/categories/${id}`, data),
        onSuccess: (data: any) => {
            toast.success(data?.message ?? "Category updated")
            queryClient.invalidateQueries({ queryKey: ["supply-categories", businessId] })
        },
        onError: (err: any) => toast.error(err?.message ?? "Failed to update category"),
    })

    const deleteCategoryMutation = useMutation({
        mutationFn: (id: string) => apiClient.delete(`/supplies/categories/${id}`),
        onSuccess: (data: any) => {
            toast.success(data?.message ?? "Category deleted")
            queryClient.invalidateQueries({ queryKey: ["supply-categories", businessId] })
        },
        onError: (err: any) => toast.error(err?.message ?? "Failed to delete category"),
    })

    const categories = response?.data ?? []
    const options: { label: string; value: string }[] = categories.map((c) => ({
        label: c.name,
        value: c.id,
    }))

    return {
        categories,
        options,
        isLoading,
        error,
        createCategory: createCategoryMutation.mutateAsync,
        updateCategory: updateCategoryMutation.mutateAsync,
        deleteCategory: deleteCategoryMutation.mutateAsync,
    }
}
