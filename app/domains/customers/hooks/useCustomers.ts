import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { apiClient, ApiResponse } from "@/app/lib/api-client"
import { useBusiness } from "@/app/components/BusinessProvider"
import { toast } from "sonner"

export interface CustomerListItemApi {
    id: string
    name: string
    phoneNumber: string | null
    email: string | null
    isBlacklisted: boolean
    visits: number
    ltv: string
    lastSeen: string
    debt: string
}

export interface Customer {
    id: string
    name: string
    orders: number
    totalSpent: string
    lastOrder: string
    owing: string
    phoneNumber: string
    email: string
    isBlacklisted: boolean
}

function mapApiItemToCustomer(item: CustomerListItemApi): Customer {
    return {
        id: item.id,
        name: item.name,
        orders: item.visits,
        totalSpent: item.ltv,
        lastOrder: item.lastSeen,
        owing: item.debt,
        phoneNumber: item.phoneNumber ?? "",
        email: item.email ?? "",
        isBlacklisted: item.isBlacklisted,
    }
}

export interface CreateCustomerPayload {
    name: string
    phoneNumber?: string
    email?: string
    whatsappNumber?: string
    isBlacklisted?: boolean
}

export interface UpdateCustomerPayload {
    name?: string
    phoneNumber?: string
    email?: string
    whatsappNumber?: string
    isBlacklisted?: boolean
}

const CUSTOMERS_PAGE_SIZE = 20

export function useCustomers(
    page: number = 1,
    limit: number = CUSTOMERS_PAGE_SIZE,
    search?: string,
    storeIds?: string[]
) {
    const queryClient = useQueryClient()
    const { activeBusiness } = useBusiness()
    const businessId = activeBusiness?.id

    const params: Record<string, string> = {
        page: String(page),
        limit: String(limit),
    }
    if (search?.trim()) params.search = search.trim()
    if (storeIds && storeIds.length > 0) params.storeIds = storeIds.join(",")

    const {
        data: response,
        isPending,
        isFetching,
        error,
    } = useQuery<ApiResponse<CustomerListItemApi[]>>({
        queryKey: ["customers", businessId, page, limit, search, storeIds],
        queryFn: () =>
            apiClient.get<ApiResponse<CustomerListItemApi[]>>("/customers", params, {
                fullResponse: true,
            }),
        enabled: !!businessId,
    })

    const customers: Customer[] = (response?.data ?? []).map(mapApiItemToCustomer)
    const meta = response?.meta as { total?: number; currentPage?: number; lastPage?: number } | undefined
    const totalPages = meta?.lastPage ?? meta?.total ?? 1
    const currentPage = meta?.currentPage ?? page

    const createCustomerMutation = useMutation({
        mutationFn: (payload: CreateCustomerPayload) => apiClient.post("/customers", payload),
        onSuccess: () => {
            toast.success("Customer added")
            queryClient.invalidateQueries({ queryKey: ["customers", businessId] })
        },
        onError: (err: any) => {
            toast.error(err.message ?? "Failed to add customer")
        },
    })

    const updateCustomerMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: UpdateCustomerPayload }) =>
            apiClient.patch(`/customers/${id}`, data),
        onSuccess: () => {
            toast.success("Customer updated")
            queryClient.invalidateQueries({ queryKey: ["customers", businessId] })
        },
        onError: (err: any) => {
            toast.error(err.message ?? "Failed to update customer")
        },
    })

    const deleteCustomerMutation = useMutation({
        mutationFn: (id: string) => apiClient.delete(`/customers/${id}`),
        onSuccess: () => {
            toast.success("Customer removed")
            queryClient.invalidateQueries({ queryKey: ["customers", businessId] })
        },
        onError: (err: any) => {
            toast.error(err.message ?? "Failed to remove customer")
        },
    })

    return {
        customers,
        meta: meta ? { ...meta, totalPages, currentPage } : undefined,
        isPending,
        isFetching,
        error,
        createCustomer: createCustomerMutation.mutateAsync,
        updateCustomer: updateCustomerMutation.mutateAsync,
        deleteCustomer: deleteCustomerMutation.mutateAsync,
        isCreating: createCustomerMutation.isPending,
        isUpdating: updateCustomerMutation.isPending,
        isDeleting: deleteCustomerMutation.isPending,
    }
}
