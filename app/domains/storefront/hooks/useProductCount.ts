import { useQuery } from '@tanstack/react-query'
import { apiClient, ApiResponse } from '@/app/lib/api-client'
import { useBusiness } from '@/app/components/BusinessProvider'

export function useProductCount() {
  const { activeBusiness } = useBusiness()
  return useQuery({
    queryKey: ['storefront', 'productCount', activeBusiness?.id],
    queryFn: async () => {
      const response = await apiClient.get<unknown>('/products', { page: '1', limit: '1' }, { fullResponse: true }) as ApiResponse<unknown>
      const total = (response?.meta as { total?: number })?.total ?? 0
      return total
    },
    enabled: !!activeBusiness?.id,
    staleTime: 60 * 1000,
  })
}
