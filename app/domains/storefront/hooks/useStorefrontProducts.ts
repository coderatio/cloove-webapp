import { useQuery } from "@tanstack/react-query"
import { apiClient } from "@/app/lib/api-client"

export interface StorefrontProductItem {
  id: string
  name: string
  description: string | null
  price: number
  salePrice?: number
  promotionLabel?: string | null
  isFeatured?: boolean
  images: Array<{ id?: string; url: string; isPrimary?: boolean }> | string[]
  stock: number
}

function normalizeImages(images: unknown): string[] {
  if (!Array.isArray(images)) return []
  return images.map((img) => (typeof img === "string" ? img : (img as { url?: string })?.url ?? "")).filter(Boolean)
}

export function useStorefrontProducts(
  slug: string | undefined,
  options: {
    limit?: number;
    page?: number;
    categoryIds?: string[];
    search?: string;
    minPrice?: number;
    maxPrice?: number;
    sortBy?: string;
  } = {}
) {
  const { limit = 8, page = 1, categoryIds, search, minPrice, maxPrice, sortBy } = options
  return useQuery({
    queryKey: ["storefront", "products", slug, limit, page, categoryIds, search, minPrice, maxPrice, sortBy],
    queryFn: async () => {
      const params: Record<string, string> = {
        limit: String(limit),
        page: String(page)
      }

      if (categoryIds?.length) params.categoryIds = categoryIds.join(',')
      if (search) params.search = search
      if (minPrice !== undefined) params.minPrice = String(minPrice)
      if (maxPrice !== undefined) params.maxPrice = String(maxPrice)
      if (sortBy) params.sortBy = sortBy

      const data = await apiClient.get<{ products?: unknown[] }>(
        `storefronts/${slug}/products`,
        params
      )
      const products = (data?.products ?? (Array.isArray(data) ? data : [])) as StorefrontProductItem[]
      return products.map((p) => ({ ...p, images: normalizeImages(p.images) }))
    },
    enabled: !!slug,
    staleTime: 60 * 1000,
  })
}

export function useStorefrontFeatured(slug: string | undefined, options: { limit?: number; page?: number } = {}) {
  const { limit = 8, page = 1 } = options
  return useQuery({
    queryKey: ["storefront", "featured", slug, limit, page],
    queryFn: async () => {
      const data = await apiClient.get<{ products?: unknown[] }>(
        `storefronts/${slug}/featured`,
        { limit: String(limit), page: String(page) }
      )
      const products = (data?.products ?? (Array.isArray(data) ? data : [])) as StorefrontProductItem[]
      return products.map((p) => ({ ...p, images: normalizeImages(p.images) }))
    },
    enabled: !!slug,
    staleTime: 60 * 1000,
  })
}

export function useStorefrontOnSale(
  slug: string | undefined,
  options: { limit?: number; page?: number; promotionId?: string } = {}
) {
  const { limit = 8, page = 1, promotionId } = options
  return useQuery({
    queryKey: ["storefront", "on-sale", slug, limit, page, promotionId],
    queryFn: async () => {
      const params: Record<string, string> = {
        limit: String(limit),
        page: String(page)
      }
      if (promotionId) params.promotionId = promotionId
      const data = await apiClient.get<{ products?: unknown[] }>(
        `storefronts/${slug}/on-sale`,
        params
      )
      const products = (data?.products ?? (Array.isArray(data) ? data : [])) as StorefrontProductItem[]
      return products.map((p) => ({ ...p, images: normalizeImages(p.images) }))
    },
    enabled: !!slug,
    staleTime: 60 * 1000,
  })
}
