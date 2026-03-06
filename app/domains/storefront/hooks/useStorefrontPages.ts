import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/app/lib/api-client'
import { toast } from 'sonner'

export interface StorefrontPageListItem {
  id: string
  title: string
  slug: string
  isHome: boolean
  isPublished: boolean
  updatedAt: string
}

export interface StorefrontPageFull {
  id: string
  title: string
  slug: string
  isHome: boolean
  isPublished: boolean
  content: { sections: unknown[] }
  metaTitle: string | null
  metaDescription: string | null
  metaImageUrl: string | null
  updatedAt: string
}

export function useStorefrontPages() {
  return useQuery<StorefrontPageListItem[]>({
    queryKey: ['storefront', 'pages'],
    queryFn: async () => {
      const data = await apiClient.get<StorefrontPageListItem[]>('storefront/pages')
      return Array.isArray(data) ? data : []
    },
    staleTime: 60 * 1000,
  })
}

export function useStorefrontPage(slug: string | null) {
  return useQuery<StorefrontPageFull | null>({
    queryKey: ['storefront', 'page', slug],
    queryFn: async () => {
      if (!slug) return null
      const data = await apiClient.get<StorefrontPageFull>(`storefront/pages/${encodeURIComponent(slug)}`)
      return data
    },
    enabled: !!slug,
    staleTime: 0,
  })
}

export function useCreateStorefrontPage() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (body: {
      title: string
      slug: string
      isHome?: boolean
      isPublished?: boolean
      content?: { sections: unknown[] }
    }) => {
      return apiClient.post<StorefrontPageListItem>('storefront/pages', body)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['storefront', 'pages'] })
      toast.success('Page created successfully')
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Failed to create page')
    },
  })
}

export function useUpdateStorefrontPage(slug: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (body: {
      title?: string
      isHome?: boolean
      isPublished?: boolean
      content?: { sections: unknown[] }
    }) => {
      return apiClient.patch<StorefrontPageListItem>(
        `storefront/pages/${encodeURIComponent(slug)}`,
        body
      )
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['storefront', 'pages'] })
      queryClient.invalidateQueries({ queryKey: ['storefront', 'page', slug] })
      toast.success('Page updated successfully')
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Failed to update page')
    },
  })
}

export function useDeleteStorefrontPage() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (slug: string) => {
      await apiClient.delete(`storefront/pages/${encodeURIComponent(slug)}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['storefront', 'pages'] })
      toast.success('Page deleted successfully')
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Failed to delete page')
    },
  })
}
