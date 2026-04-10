import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { apiClient, ApiResponse } from "@/app/lib/api-client"
import { useBusiness } from "@/app/components/BusinessProvider"
import { Order } from "../../orders/types"
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
    isVip: boolean
    joinedAt: string
    joined_at?: string
    createdAt?: string
    created_at?: string
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
    whatsappNumber?: string
    isBlacklisted: boolean
    isVip: boolean
    joinedAt: string
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
        isVip: item.isVip,
        joinedAt: item.joinedAt || item.joined_at || item.createdAt || item.created_at || "",
    }
}

export interface CreateCustomerPayload {
    name: string
    phoneNumber?: string
    email?: string
    whatsappNumber?: string
    isBlacklisted?: boolean
    isVip?: boolean
}

export interface UpdateCustomerPayload {
    name?: string
    phoneNumber?: string
    email?: string
    whatsappNumber?: string
    isBlacklisted?: boolean
    isVip?: boolean
}

const CUSTOMERS_PAGE_SIZE = 20

export function useCustomers(
    page: number = 1,
    limit: number = CUSTOMERS_PAGE_SIZE,
    search?: string,
    storeIds?: string[],
    toastCopy?: {
        added: string
        updated: string
        removed: string
        addFailed: string
        updateFailed: string
        removeFailed: string
    }
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
        mutationFn: (payload: CreateCustomerPayload) =>
            apiClient.post<CustomerListItemApi>("/customers", payload),
        onSuccess: () => {
            toast.success(toastCopy?.added ?? "Customer added")
            queryClient.invalidateQueries({ queryKey: ["customers", businessId] })
        },
        onError: (err: { message?: string }) => {
            toast.error(err.message ?? toastCopy?.addFailed ?? "Failed to add customer")
        },
    })

    const updateCustomerMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: UpdateCustomerPayload }) =>
            apiClient.patch(`/customers/${id}`, data),
        onMutate: async ({ id, data }) => {
            // Cancel any outgoing refetches (so they don't overwrite our optimistic update)
            await queryClient.cancelQueries({ queryKey: ["customers", businessId] })

            // Snapshot the previous value
            const previousResponse = queryClient.getQueryData<ApiResponse<CustomerListItemApi[]>>(["customers", businessId, page, limit, search, storeIds])

            // Optimistically update to the new value
            if (previousResponse) {
                queryClient.setQueryData(["customers", businessId, page, limit, search, storeIds], {
                    ...previousResponse,
                    data: previousResponse.data.map((customer) =>
                        customer.id === id ? { ...customer, ...data } : customer
                    ),
                })
            }

            return { previousResponse }
        },
        onSuccess: () => {
            toast.success(toastCopy?.updated ?? "Customer updated")
        },
        onError: (err: { message?: string }, _variables, context) => {
            toast.error(err.message ?? toastCopy?.updateFailed ?? "Failed to update customer")
            // Rollback to the previous value if mutation fails
            if (context?.previousResponse) {
                queryClient.setQueryData(["customers", businessId, page, limit, search, storeIds], context.previousResponse)
            }
        },
        onSettled: () => {
            // Always refetch after error or success to ensure we are in sync with the server
            queryClient.invalidateQueries({ queryKey: ["customers", businessId] })
        },
    })

    const deleteCustomerMutation = useMutation({
        mutationFn: (id: string) => apiClient.delete(`/customers/${id}`),
        onSuccess: () => {
            toast.success(toastCopy?.removed ?? "Customer removed")
            queryClient.invalidateQueries({ queryKey: ["customers", businessId] })
        },
        onError: (err: { message?: string }) => {
            toast.error(err.message ?? toastCopy?.removeFailed ?? "Failed to remove customer")
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

export function useCustomerStats() {
    const { activeBusiness } = useBusiness()
    const businessId = activeBusiness?.id

    return useQuery<ApiResponse<{
        totalCustomers: number
        activeCustomers: number
        newCustomers: number
        totalDebt: number
    }>>({
        queryKey: ["customers-stats", businessId],
        queryFn: () =>
            apiClient.get<ApiResponse<{
                totalCustomers: number
                activeCustomers: number
                newCustomers: number
                totalDebt: number
            }>>("/customers/stats", undefined, { fullResponse: true }),
        enabled: !!businessId,
    })
}

export function useCustomerTransactions(customerId: string) {
    const { activeBusiness } = useBusiness()
    const businessId = activeBusiness?.id

    return useQuery<ApiResponse<Order[]>>({
        queryKey: ["customer-transactions", businessId, customerId],
        queryFn: () =>
            apiClient.get<ApiResponse<Order[]>>("/sales", { customerId, limit: "10" }, { fullResponse: true }),
        enabled: !!businessId && !!customerId,
    })
}
