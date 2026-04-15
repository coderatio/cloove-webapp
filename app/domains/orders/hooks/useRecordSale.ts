"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { apiClient, ApiError } from "@/app/lib/api-client"
import { useBusiness } from "@/app/components/BusinessProvider"
import { toast } from "sonner"
import { storage } from "@/app/lib/storage"
import {
    buildOfflineRecordedSale,
    enqueueSalesOutboxEntry,
    flushSalesOutbox,
    notifyOutboxChanged,
    removeSalesOutboxEntry,
    shouldQueueFailedSaleRequest,
} from "@/app/lib/offline/sales-outbox"
import type {
    RecordSalePayload,
    RecordedSale,
    RecordSaleResult,
} from "@/app/domains/orders/types/record-sale"
import { fetchTimeoutSignal } from "@/app/lib/fetch-timeout-signal"

export type { RecordSaleItem, RecordSalePayload, RecordedSale, RecordSaleResult } from "@/app/domains/orders/types/record-sale"
const SALE_REQUEST_FAIL_FAST_MS = 2500

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
    return new Promise<T>((resolve, reject) => {
        const timeoutId = globalThis.setTimeout(() => {
            reject(new ApiError("Request timed out", 408))
        }, ms)

        promise
            .then((value) => {
                globalThis.clearTimeout(timeoutId)
                resolve(value)
            })
            .catch((error) => {
                globalThis.clearTimeout(timeoutId)
                reject(error)
            })
    })
}

/**
 * Hook to record a new sale via the API.
 * Follows the same pattern as useOrders.ts (apiClient + React Query).
 * When offline or the network fails, the sale is stored locally and synced when online.
 */
export function useRecordSale() {
    const queryClient = useQueryClient()
    const { activeBusiness } = useBusiness()

    const mutation = useMutation({
        networkMode: "always",
        mutationFn: async (payload: RecordSalePayload): Promise<RecordSaleResult> => {
            const idempotencyKey = crypto.randomUUID()
            const businessId = storage.getActiveBusinessId() ?? activeBusiness?.id ?? null

            if (!businessId) {
                throw new ApiError("No business selected", 400)
            }

            // Fast offline path: return immediately so the UI is never blocked.
            // The IndexedDB write runs in the background so the intent is still persisted.
            if (typeof navigator !== "undefined" && !navigator.onLine) {
                void enqueueSalesOutboxEntry({ idempotencyKey, businessId, payload }).then(() => {
                    notifyOutboxChanged()
                }).catch(() => {
                    // Best-effort: if the write fails the sale will be lost, but we
                    // still give the user a success response rather than hanging.
                })
                notifyOutboxChanged()
                return buildOfflineRecordedSale(payload, idempotencyKey)
            }

            // Online path: queue-first strategy — persist intent before any network call
            // so the sale survives a crash or sudden disconnection.
            try {
                await enqueueSalesOutboxEntry({ idempotencyKey, businessId, payload })
                notifyOutboxChanged()
            } catch {
                // If IndexedDB is unavailable we still attempt the API call.
                // The sale won't be auto-retried on failure, but it won't hang either.
            }

            try {
                const result = await withTimeout(
                    apiClient.post<RecordedSale>("/sales", payload, {
                        headers: { "Idempotency-Key": idempotencyKey },
                        signal: fetchTimeoutSignal(),
                    }),
                    SALE_REQUEST_FAIL_FAST_MS
                )
                await removeSalesOutboxEntry(idempotencyKey).catch(() => {})
                notifyOutboxChanged()
                return result
            } catch (error) {
                if (shouldQueueFailedSaleRequest(error)) {
                    void flushSalesOutbox(queryClient)
                    return buildOfflineRecordedSale(payload, idempotencyKey)
                }
                await removeSalesOutboxEntry(idempotencyKey).catch(() => {})
                notifyOutboxChanged()
                throw error
            }
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ["sales", activeBusiness?.id] })
            if (!data.offlineQueued) {
                void flushSalesOutbox(queryClient)
            }
        },
        onError: (error: unknown) => {
            const message = error instanceof Error ? error.message : "Failed to record sale"
            toast.error(message)
        },
    })

    return {
        recordSale: mutation.mutateAsync,
        isRecording: mutation.isPending,
        recordError: mutation.error,
        reset: mutation.reset,
    }
}
