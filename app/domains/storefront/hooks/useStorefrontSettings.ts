import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/app/lib/api-client'
import { toast } from 'sonner'

export interface StorefrontSettingsData {
  slug: string
  metaTitle: string | null
  metaDescription: string | null
  metaImageUrl: string | null
  faviconUrl: string | null
  logoUrl: string | null
  contactEmail: string | null
  contactPhone: string | null
  contactWhatsapp: string | null
  socialLinks: Record<string, string>
  announcement: { text: string; link?: string; active: boolean }
  businessName: string
  businessDescription: string | null
}

export function useStorefrontSettings() {
  return useQuery<StorefrontSettingsData>({
    queryKey: ['storefront', 'settings'],
    queryFn: async () => {
      const data = await apiClient.get<StorefrontSettingsData>('storefront/settings')
      return data
    },
    staleTime: 60 * 1000,
  })
}

export function useUpdateStorefrontSettings() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (body: Partial<StorefrontSettingsData>) => {
      return apiClient.patch<Partial<StorefrontSettingsData>>('storefront/settings', body)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['storefront', 'settings'] })
      queryClient.invalidateQueries({ queryKey: ['storefront', 'me'] })
      toast.success('Settings updated successfully')
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Failed to update settings')
    },
  })
}
