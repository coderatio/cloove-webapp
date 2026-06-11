import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { apiClient, ApiResponse } from "@/app/lib/api-client"
import { toast } from "sonner"
import { useBusiness } from "@/app/components/BusinessProvider"
import { PRODUCT_UNITS as DEFAULT_UNITS, type UnitOption } from "@/app/lib/units"

export interface Unit {
    id: string
    code: string
    label: string
    sortOrder?: number | null
    isSystem?: boolean
}

/**
 * Business-configurable units of measure, shared by products and supplies.
 * Falls back to the static default list (app/lib/units.ts) until the API responds,
 * so unit dropdowns never block or break offline.
 */
export function useUnits() {
    const queryClient = useQueryClient()
    const { activeBusiness } = useBusiness()
    const businessId = activeBusiness?.id

    const { data, isLoading } = useQuery<ApiResponse<Unit[]>>({
        queryKey: ["units", businessId],
        queryFn: () => apiClient.get<ApiResponse<Unit[]>>("/units", {}, { fullResponse: true }),
        enabled: !!businessId,
        staleTime: Infinity,
    })

    const units = data?.data ?? []

    /** {value,label} options for Select inputs — API units, or the static defaults until loaded. */
    const options: UnitOption[] = units.length
        ? units.map((u) => ({ value: u.code, label: u.label }))
        : DEFAULT_UNITS

    const invalidate = () =>
        queryClient.invalidateQueries({ queryKey: ["units", businessId] })

    const createUnit = useMutation({
        mutationFn: (payload: { label: string; code?: string }) => apiClient.post("/units", payload),
        onSuccess: (res: any) => {
            toast.success(res?.message ?? "Unit added")
            invalidate()
        },
        onError: (err: any) => toast.error(err?.message ?? "Failed to add unit"),
    }).mutateAsync

    const updateUnit = useMutation({
        mutationFn: ({ id, data: payload }: { id: string; data: { label?: string; code?: string } }) =>
            apiClient.patch(`/units/${id}`, payload),
        onSuccess: (res: any) => {
            toast.success(res?.message ?? "Unit updated")
            invalidate()
        },
        onError: (err: any) => toast.error(err?.message ?? "Failed to update unit"),
    }).mutateAsync

    const deleteUnit = useMutation({
        mutationFn: (id: string) => apiClient.delete(`/units/${id}`),
        onSuccess: (res: any) => {
            toast.success(res?.message ?? "Unit deleted")
            invalidate()
        },
        onError: (err: any) => toast.error(err?.message ?? "Failed to delete unit"),
    }).mutateAsync

    return { units, options, isLoading, createUnit, updateUnit, deleteUnit }
}
