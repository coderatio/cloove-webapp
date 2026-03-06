import { useQuery } from '@tanstack/react-query'
import { apiClient, ApiResponse } from '@/app/lib/api-client'

export interface StorefrontMe {
  id: string
  slug: string
  url: string
  businessName: string
}

export function useStorefront() {
  return useQuery<StorefrontMe>({
    queryKey: ['storefront', 'me'],
    queryFn: async () => {
      const data = await apiClient.get<StorefrontMe>('storefront/me')
      return data
    },
    staleTime: 2 * 60 * 1000,
  })
}
