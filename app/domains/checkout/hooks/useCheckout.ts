"use client"

import { useQuery, useMutation } from "@tanstack/react-query"
import { useEffect, useRef } from "react"
import type { CheckoutData, BankTransferData, PaymentProviderInfo } from "../types"

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || ""

function getApiUrl(path: string): string {
  if (API_BASE.startsWith('http')) return `${API_BASE}${path}`
  return `/api${path}`
}

async function checkoutFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(getApiUrl(path), {
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    ...options,
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.message || 'Request failed')
  return json.data ?? json
}

/**
 * The bank-transfer response includes sessionId at the top level
 */
interface BankTransferResponse {
  accountName: string
  bankName: string
  accountNumber: string
  amount: number
  subtotal: number
  fee: number
  reference: string
  expiresAt: string
}

export function useCheckoutData(reference: string) {
  return useQuery<CheckoutData>({
    queryKey: ['checkout', reference],
    queryFn: () => checkoutFetch<CheckoutData>(`/checkout/${reference}`),
    retry: 1,
  })
}

export function usePaymentProviders() {
  return useQuery<PaymentProviderInfo[]>({
    queryKey: ['payment-providers'],
    queryFn: () => checkoutFetch<PaymentProviderInfo[]>('/payment-providers'),
    staleTime: 5 * 60 * 1000,
  })
}

export function useInitiateBankTransfer(reference: string) {
  return useMutation<
    BankTransferData & { sessionId?: string },
    Error,
    { customerName: string; email: string; phoneNumber?: string; amount?: number; provider?: string }
  >({
    mutationFn: async (data) => {
      const res = await fetch(getApiUrl(`/checkout/${reference}/bank-transfer`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.message || 'Request failed')
      // sessionId is at the top level, data is the VA details
      return { ...(json.data ?? {}), sessionId: json.sessionId }
    },
  })
}

export function useCheckPayment(reference: string, sessionId?: string) {
  const params = sessionId ? `?session=${sessionId}` : ''
  return useQuery({
    queryKey: ['checkout-payment', reference, sessionId],
    queryFn: () => checkoutFetch<{ status: string; verified: boolean }>(`/checkout/${reference}/check-payment${params}`),
    enabled: false,
  })
}

export function useCheckoutSSE(reference: string, onPaid: () => void, sessionId?: string) {
  const eventSourceRef = useRef<EventSource | null>(null)

  useEffect(() => {
    if (!reference) return

    const params = sessionId ? `?session=${sessionId}` : ''
    const url = getApiUrl(`/checkout/${reference}/events${params}`)
    const es = new EventSource(url)
    eventSourceRef.current = es

    es.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        if (data.status === 'PAID') {
          onPaid()
          es.close()
        }
      } catch {
        // Ignore parse errors
      }
    }

    es.onerror = () => {
      // SSE will auto-reconnect
    }

    return () => {
      es.close()
      eventSourceRef.current = null
    }
  }, [reference, sessionId, onPaid])

  return eventSourceRef
}
