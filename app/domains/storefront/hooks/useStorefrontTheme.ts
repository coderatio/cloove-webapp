import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/app/lib/api-client'
import { toast } from 'sonner'

export interface StorefrontThemeData {
  schemaVersion?: number
  layout: string
  themeMode?: string
  colors: { primary: string; secondary: string; background: string; text: string }
  colorsDark?: { primary: string; secondary: string; background: string; text: string }
  fonts?: { heading: string; body: string }
  components?: Record<string, unknown>
  welcomeMessage?: string
  [key: string]: unknown
}

export function useStorefrontTheme() {
  return useQuery<StorefrontThemeData>({
    queryKey: ['storefront', 'theme'],
    queryFn: async () => {
      const data = await apiClient.get<StorefrontThemeData>('storefront/theme')
      return data
    },
    staleTime: 60 * 1000,
  })
}

export function useUpdateStorefrontTheme() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (theme: StorefrontThemeData) => {
      return apiClient.patch<{ theme: StorefrontThemeData; version: number }>(
        'storefront/theme',
        theme
      )
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['storefront', 'theme'] })
      toast.success('Theme updated successfully')
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Failed to update theme')
    },
  })
}
