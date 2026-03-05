import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/app/lib/api-client'
import { useBusiness } from '@/app/components/BusinessProvider'

export interface Promotion {
    id: string
    businessId: string
    name: string
    description: string | null
    type: 'PERCENTAGE' | 'FIXED'
    value: number
    scope: 'specific_products' | 'all_stores' | 'specific_stores'
    badgeLabel: string | null
    isActive: boolean
    startsAt: string | null
    endsAt: string | null
    status: 'active' | 'scheduled' | 'expired' | 'inactive'
}

/**
 * Hook to fetch promotions for the active business.
 */
export function usePromotions() {
    const { activeBusiness } = useBusiness()

    return useQuery<Promotion[]>({
        queryKey: ['promotions', activeBusiness?.id],
        queryFn: async () => {
            const response = await apiClient.get<any>('/promotions', {}, { fullResponse: true })
            // Assuming the API returns the array directly or in response.data
            return Array.isArray(response?.data)
                ? response.data
                : (Array.isArray(response) ? response : [])
        },
        enabled: !!activeBusiness?.id,
        staleTime: 5 * 60 * 1000, // 5 minutes
    })
}
