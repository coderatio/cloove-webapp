"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { apiClient } from "@/app/lib/api-client"
import { useBusiness } from "@/app/components/BusinessProvider"
import { toast } from "sonner"

export interface BusinessServiceItem {
    id: string
    slug: string
    name: string
    summary: string | null
    description: string | null
    audience: string | null
    deliverables: string[] | null
    durationLabel: string | null
    priceLabel: string | null
    priceMin: number | null
    priceMax: number | null
    currency: string | null
    isActive: boolean
    sortOrder: number
    images: Array<{ id: string; url: string; isPrimary: boolean; alt?: string }>
    catalogSyncEnabled: boolean
    createdAt: string
    updatedAt: string | null
}

export interface CreateBusinessServicePayload {
    name: string
    slug?: string
    summary?: string | null
    description?: string | null
    audience?: string | null
    deliverables?: string[] | null
    durationLabel?: string | null
    priceLabel?: string | null
    priceMin?: number | null
    priceMax?: number | null
    currency?: string | null
    isActive?: boolean
    sortOrder?: number
    images?: Array<{ id: string; url: string; isPrimary: boolean; alt?: string }>
    catalogSyncEnabled?: boolean
}

export type UpdateBusinessServicePayload = Partial<CreateBusinessServicePayload>

export function useBusinessServices(activeOnly: boolean = false) {
    const queryClient = useQueryClient()
    const { activeBusiness } = useBusiness()
    const businessId = activeBusiness?.id

    const query = useQuery<BusinessServiceItem[]>({
        queryKey: ["services", businessId, { activeOnly }],
        queryFn: () =>
            apiClient.get<BusinessServiceItem[]>("/services", {
                ...(activeOnly ? { activeOnly: "true" } : {}),
            }),
        enabled: !!businessId,
    })

    const createMutation = useMutation({
        mutationFn: (payload: CreateBusinessServicePayload) =>
            apiClient.post<BusinessServiceItem>("/services", payload),
        onSuccess: () => {
            toast.success("Service added")
            void queryClient.invalidateQueries({ queryKey: ["services", businessId] })
        },
        onError: (err: { message?: string }) => {
            toast.error(err.message ?? "Failed to add service")
        },
    })

    const updateMutation = useMutation({
        mutationFn: ({ id, payload }: { id: string; payload: UpdateBusinessServicePayload }) =>
            apiClient.patch<BusinessServiceItem>(`/services/${id}`, payload),
        onMutate: async ({ id, payload }) => {
            await queryClient.cancelQueries({ queryKey: ["services", businessId] })
            const previous = queryClient.getQueryData<BusinessServiceItem[]>([
                "services",
                businessId,
                { activeOnly },
            ])
            if (previous) {
                queryClient.setQueryData<BusinessServiceItem[]>(
                    ["services", businessId, { activeOnly }],
                    previous.map((service) =>
                        service.id === id
                            ? ({ ...service, ...payload } as BusinessServiceItem)
                            : service
                    )
                )
            }
            return { previous }
        },
        onError: (err: { message?: string }, _vars, context) => {
            if (context?.previous) {
                queryClient.setQueryData(
                    ["services", businessId, { activeOnly }],
                    context.previous
                )
            }
            toast.error(err.message ?? "Failed to update service")
        },
        onSuccess: () => {
            toast.success("Service updated")
            void queryClient.invalidateQueries({ queryKey: ["services", businessId] })
        },
    })

    const deleteMutation = useMutation({
        mutationFn: (id: string) => apiClient.delete(`/services/${id}`),
        onSuccess: () => {
            toast.success("Service removed")
            void queryClient.invalidateQueries({ queryKey: ["services", businessId] })
        },
        onError: (err: { message?: string }) => {
            toast.error(err.message ?? "Failed to remove service")
        },
    })

    return {
        services: query.data ?? [],
        isLoading: query.isPending,
        error: query.error,
        createService: createMutation.mutateAsync,
        updateService: updateMutation.mutateAsync,
        removeService: deleteMutation.mutateAsync,
        isCreating: createMutation.isPending,
        isUpdating: updateMutation.isPending,
        isRemoving: deleteMutation.isPending,
    }
}
