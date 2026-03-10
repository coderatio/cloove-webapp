import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { apiClient, ApiResponse } from "@/app/lib/api-client"
import { useBusiness } from "@/app/components/BusinessProvider"
import { toast } from "sonner"

export interface SupplierApi {
    id: string
    name: string
    phoneNumber: string | null
    email: string | null
    address: string | null
    notes: string | null
    outstanding: number
    createdAt: string
}

export interface Vendor {
    id: string
    name: string
    phoneNumber: string
    email: string
    address: string
    notes: string
    outstanding: number
    createdAt: string
}

function mapApiToVendor(item: SupplierApi): Vendor {
    return {
        id: item.id,
        name: item.name,
        phoneNumber: item.phoneNumber ?? "",
        email: item.email ?? "",
        address: item.address ?? "",
        notes: item.notes ?? "",
        outstanding: item.outstanding ?? 0,
        createdAt: item.createdAt,
    }
}

export interface PayableApi {
    id: string
    supplierId: string
    amount: number
    remainingAmount: number
    status: string
    description: string | null
    dueAt: string | null
    createdAt: string
}

export interface Payable {
    id: string
    supplierId: string
    amount: number
    remainingAmount: number
    status: string
    description: string
    dueAt: string
    createdAt: string
}

function mapApiToPayable(item: PayableApi): Payable {
    return {
        id: item.id,
        supplierId: item.supplierId,
        amount: item.amount,
        remainingAmount: item.remainingAmount,
        status: item.status,
        description: item.description ?? "",
        dueAt: item.dueAt ?? "",
        createdAt: item.createdAt,
    }
}

export interface CreateVendorPayload {
    name: string
    phoneNumber?: string
    email?: string
    address?: string
    notes?: string
}

export interface UpdateVendorPayload {
    name?: string
    phoneNumber?: string
    email?: string
    address?: string
    notes?: string
}

export interface CreatePayablePayload {
    amount: number
    description?: string
    dueAt?: string
}

export interface PayPayablePayload {
    amount: number
}

const PAGE_SIZE = 20

export function useVendors(
    page: number = 1,
    limit: number = PAGE_SIZE,
    search?: string
) {
    const queryClient = useQueryClient()
    const { activeBusiness } = useBusiness()
    const businessId = activeBusiness?.id

    const params: Record<string, string> = {
        page: String(page),
        limit: String(limit),
    }
    if (search?.trim()) params.search = search.trim()

    const {
        data: response,
        isPending,
        isFetching,
        error,
    } = useQuery<ApiResponse<SupplierApi[]>>({
        queryKey: ["vendors", businessId, page, limit, search],
        queryFn: () =>
            apiClient.get<ApiResponse<SupplierApi[]>>("/suppliers", params, {
                fullResponse: true,
            }),
        enabled: !!businessId,
    })

    const vendors: Vendor[] = (response?.data ?? []).map(mapApiToVendor)
    const meta = response?.meta as { total?: number; currentPage?: number; lastPage?: number } | undefined
    const totalPages = meta?.lastPage ?? meta?.total ?? 1
    const currentPage = meta?.currentPage ?? page

    const createMutation = useMutation({
        mutationFn: (payload: CreateVendorPayload) => apiClient.post("/suppliers", payload),
        onSuccess: () => {
            toast.success("Vendor added")
            queryClient.invalidateQueries({ queryKey: ["vendors", businessId] })
            queryClient.invalidateQueries({ queryKey: ["vendors-stats", businessId] })
        },
        onError: (err: { message?: string }) => {
            toast.error(err.message ?? "Failed to add vendor")
        },
    })

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: UpdateVendorPayload }) =>
            apiClient.patch(`/suppliers/${id}`, data),
        onSuccess: () => {
            toast.success("Vendor updated")
            queryClient.invalidateQueries({ queryKey: ["vendors", businessId] })
            queryClient.invalidateQueries({ queryKey: ["vendors-stats", businessId] })
        },
        onError: (err: { message?: string }) => {
            toast.error(err.message ?? "Failed to update vendor")
        },
    })

    const deleteMutation = useMutation({
        mutationFn: (id: string) => apiClient.delete(`/suppliers/${id}`),
        onSuccess: () => {
            toast.success("Vendor removed")
            queryClient.invalidateQueries({ queryKey: ["vendors", businessId] })
            queryClient.invalidateQueries({ queryKey: ["vendors-stats", businessId] })
        },
        onError: (err: { message?: string }) => {
            toast.error(err.message ?? "Failed to remove vendor")
        },
    })

    return {
        vendors,
        meta: meta ? { ...meta, totalPages, currentPage } : undefined,
        isPending,
        isFetching,
        error,
        createVendor: createMutation.mutateAsync,
        updateVendor: updateMutation.mutateAsync,
        deleteVendor: deleteMutation.mutateAsync,
        isCreating: createMutation.isPending,
        isUpdating: updateMutation.isPending,
        isDeleting: deleteMutation.isPending,
    }
}

export function useVendorStats() {
    const { activeBusiness } = useBusiness()
    const businessId = activeBusiness?.id

    return useQuery<ApiResponse<{
        totalVendors: number
        activeSuppliers: number
        outstandingPayables: number
    }>>({
        queryKey: ["vendors-stats", businessId],
        queryFn: () =>
            apiClient.get("/suppliers/stats", undefined, { fullResponse: true }),
        enabled: !!businessId,
    })
}

export function useVendorPayables(vendorId: string) {
    const { activeBusiness } = useBusiness()
    const businessId = activeBusiness?.id

    return useQuery<ApiResponse<PayableApi[]>>({
        queryKey: ["vendor-payables", businessId, vendorId],
        queryFn: () =>
            apiClient.get<ApiResponse<PayableApi[]>>(`/suppliers/${vendorId}/payables`, undefined, { fullResponse: true }),
        enabled: !!businessId && !!vendorId,
    })
}

export function usePayableMutations() {
    const queryClient = useQueryClient()
    const { activeBusiness } = useBusiness()
    const businessId = activeBusiness?.id

    const createPayableMutation = useMutation({
        mutationFn: ({ vendorId, data }: { vendorId: string; data: CreatePayablePayload }) =>
            apiClient.post(`/suppliers/${vendorId}/payables`, data),
        onSuccess: () => {
            toast.success("Payable recorded")
            queryClient.invalidateQueries({ queryKey: ["vendors", businessId] })
            queryClient.invalidateQueries({ queryKey: ["vendors-stats", businessId] })
            queryClient.invalidateQueries({ queryKey: ["vendor-payables", businessId] })
        },
        onError: (err: { message?: string }) => {
            toast.error(err.message ?? "Failed to record payable")
        },
    })

    const payPayableMutation = useMutation({
        mutationFn: ({ payableId, data }: { payableId: string; data: PayPayablePayload }) =>
            apiClient.post(`/payables/${payableId}/payment`, data),
        onSuccess: () => {
            toast.success("Payment recorded")
            queryClient.invalidateQueries({ queryKey: ["vendors", businessId] })
            queryClient.invalidateQueries({ queryKey: ["vendors-stats", businessId] })
            queryClient.invalidateQueries({ queryKey: ["vendor-payables", businessId] })
        },
        onError: (err: { message?: string }) => {
            toast.error(err.message ?? "Failed to record payment")
        },
    })

    return {
        createPayable: createPayableMutation.mutateAsync,
        payPayable: payPayableMutation.mutateAsync,
        isCreatingPayable: createPayableMutation.isPending,
        isPayingPayable: payPayableMutation.isPending,
    }
}
