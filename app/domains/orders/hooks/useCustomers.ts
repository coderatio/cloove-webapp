"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { apiClient } from "@/app/lib/api-client"
import { useBusiness } from "@/app/components/BusinessProvider"
import { mockCustomers, Customer } from "../data/customerMocks"

export type { Customer }

interface CustomersResponse {
    data: Customer[]
    meta?: any
}

interface UseCustomersParams {
    search?: string
    page?: number
    limit?: number
}

function mapApiCustomer(c: any): Customer {
    return {
        id: c.id,
        name: c.name,
        phone: c.phoneNumber || c.whatsappNumber || c.phone || '',
        type: c.type || 'Regular',
        recentPurchases: c.recentPurchases,
    }
}

/**
 * Hook to fetch real customers for the POS customer search.
 * Falls back to mock data if the backend is not yet available.
 */
export function useCustomers(searchOrParams?: string | UseCustomersParams) {
    const { activeBusiness } = useBusiness()
    const queryClient = useQueryClient()
    const paramsInput: UseCustomersParams =
        typeof searchOrParams === "string"
            ? { search: searchOrParams }
            : (searchOrParams ?? {})
    const search = paramsInput.search?.trim() || ""
    const page = paramsInput.page ?? 1
    const limit = paramsInput.limit ?? 100

    const params: Record<string, string> = {
        page: String(page),
        limit: String(limit),
    }
    if (search) params.search = search

    const { data, isLoading, isFetching } = useQuery<CustomersResponse>({
        queryKey: ['customers', activeBusiness?.id, search, page, limit],
        queryFn: async () => {
            try {
                const response = await apiClient.get<CustomersResponse>('/customers', params, { fullResponse: true })
                const raw = Array.isArray(response) ? response : (response as any)?.data || []
                return {
                    data: raw.map(mapApiCustomer),
                    meta: (response as any)?.meta,
                }
            } catch {
                // Gracefully fall back to mock data
                return {
                    data: mockCustomers,
                    meta: { total: mockCustomers.length, currentPage: 1, lastPage: 1 },
                }
            }
        },
        enabled: !!activeBusiness?.id,
        staleTime: 30_000,
    })

    const createCustomerMutation = useMutation({
        mutationFn: (name: string) =>
            apiClient.post<Customer>('/customers', { name }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['customers', activeBusiness?.id] })
        }
    })

    return {
        customers: isLoading ? [] : (data?.data ?? mockCustomers),
        meta: data?.meta,
        isLoadingCustomers: isLoading,
        isFetchingCustomers: isFetching,
        createCustomer: createCustomerMutation.mutateAsync,
        isCreatingCustomer: createCustomerMutation.isPending,
    }
}
