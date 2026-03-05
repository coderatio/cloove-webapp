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
export function useCustomers(search?: string) {
    const { activeBusiness } = useBusiness()
    const queryClient = useQueryClient()

    const params: Record<string, string> = {
        page: '1',
        limit: '100',
    }
    if (search) params.search = search

    const { data, isLoading } = useQuery<Customer[]>({
        queryKey: ['customers', activeBusiness?.id, search],
        queryFn: async () => {
            try {
                const response = await apiClient.get<CustomersResponse>('/customers', params, { fullResponse: false })
                const raw = Array.isArray(response) ? response : (response as any)?.data || []
                return raw.map(mapApiCustomer)
            } catch {
                // Gracefully fall back to mock data
                return mockCustomers
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
        customers: data ?? mockCustomers,
        isLoadingCustomers: isLoading,
        createCustomer: createCustomerMutation.mutateAsync,
        isCreatingCustomer: createCustomerMutation.isPending,
    }
}
