"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { apiClient, ApiResponse } from "@/app/lib/api-client"
import { useBusiness } from "@/app/components/BusinessProvider"
import { toast } from "sonner"

interface PaymentLinkResponse {
  id: string
  reference: string
  amount: number | null
  status: string
  targetType: string
  isReusable: boolean
  isStatic: boolean
  title: string | null
  slug: string | null
  description?: string | null
  customerName?: string | null
  customerEmail?: string | null
  createdAt: string
  expiresAt?: string | null
  [key: string]: unknown
}

export function useCreatePaymentLink() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: { targetType: 'SALE' | 'DEBT'; targetId: string; description?: string; recordAsSale?: boolean; expiresAt?: string }) =>
      apiClient.post<PaymentLinkResponse>('/payment-links', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment-links'] })
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Failed to generate payment link')
    },
  })
}

export function useCreateWalletPaymentLink() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: { slug: string; title?: string; description?: string; amount?: number }) =>
      apiClient.post<PaymentLinkResponse>('/payment-links/wallet', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment-links'] })
      queryClient.invalidateQueries({ queryKey: ['payment-links', 'wallet'] })
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Failed to create wallet payment link')
    },
  })
}

export function useWalletPaymentLink() {
  const { activeBusiness } = useBusiness()
  const businessId = activeBusiness?.id

  return useQuery<PaymentLinkResponse | null>({
    queryKey: ['payment-links', 'wallet', businessId],
    queryFn: async () => {
      try {
        return await apiClient.get<PaymentLinkResponse>('/payment-links/wallet')
      } catch {
        return null
      }
    },
    enabled: !!businessId,
  })
}

export function usePaymentLinks(page = 1, limit = 20, search?: string, status?: string, targetType?: string) {
  const { activeBusiness } = useBusiness()
  const businessId = activeBusiness?.id

  const params: Record<string, string> = { page: String(page), limit: String(limit) }
  if (search?.trim()) params.search = search.trim()
  if (status && status !== 'ALL') params.status = status
  if (targetType && targetType !== 'ALL') params.targetType = targetType

  return useQuery<ApiResponse<PaymentLinkResponse[]>>({
    queryKey: ['payment-links', businessId, page, limit, search, status, targetType],
    queryFn: () => apiClient.get<ApiResponse<PaymentLinkResponse[]>>('/payment-links', params, { fullResponse: true }),
    enabled: !!businessId,
  })
}

export function usePaymentLinkStats() {
  const { activeBusiness } = useBusiness()
  const businessId = activeBusiness?.id

  return useQuery<ApiResponse<{
    total: number
    active: number
    paid: number
    expired: number
  }>>({
    queryKey: ['payment-links-stats', businessId],
    queryFn: () => apiClient.get('/payment-links/stats', undefined, { fullResponse: true }),
    enabled: !!businessId,
  })
}

export function useCreateDynamicWalletLink() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: { title: string; description?: string; amount: number; expiresAt?: string }) =>
      apiClient.post<PaymentLinkResponse>('/payment-links/wallet/dynamic', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment-links'] })
      queryClient.invalidateQueries({ queryKey: ['payment-links-stats'] })
      toast.success('Payment link created')
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Failed to create payment link')
    },
  })
}

export function useCancelPaymentLink() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => apiClient.delete(`/payment-links/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment-links'] })
      queryClient.invalidateQueries({ queryKey: ['payment-links-stats'] })
      toast.success('Payment link cancelled')
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Failed to cancel payment link')
    },
  })
}
export function useUpdatePaymentLink() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: { title?: string; description?: string; amount?: number; expiresAt?: string } }) =>
      apiClient.patch<PaymentLinkResponse>(`/payment-links/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment-links'] })
      queryClient.invalidateQueries({ queryKey: ['payment-links-stats'] })
      toast.success('Payment link updated')
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Failed to update payment link')
    },
  })
}
