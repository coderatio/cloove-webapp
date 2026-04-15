import type { QueryClient } from "@tanstack/react-query"
import { apiClient, ApiError } from "@/app/lib/api-client"
import { fetchTimeoutSignal } from "@/app/lib/fetch-timeout-signal"
import type { RecordSalePayload, RecordedSale, RecordSaleResult } from "@/app/domains/orders/types/record-sale"

const DB_NAME = "cloove-sales-outbox"
const STORE = "entries"
const DB_VERSION = 1
const DB_OPEN_TIMEOUT_MS = 2500
const DB_TX_TIMEOUT_MS = 2500

export type SalesOutboxEntry = {
    idempotencyKey: string
    businessId: string
    payload: RecordSalePayload
    createdAt: number
    attempts: number
    lastError?: string
}

function openDb(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
        const req = indexedDB.open(DB_NAME, DB_VERSION)
        const timeoutId = globalThis.setTimeout(() => {
            reject(new Error("IndexedDB open timed out"))
        }, DB_OPEN_TIMEOUT_MS)

        req.onerror = () => {
            globalThis.clearTimeout(timeoutId)
            reject(req.error ?? new Error("IndexedDB open failed"))
        }
        req.onblocked = () => {
            globalThis.clearTimeout(timeoutId)
            reject(new Error("IndexedDB open blocked"))
        }
        req.onsuccess = () => {
            globalThis.clearTimeout(timeoutId)
            resolve(req.result)
        }
        req.onupgradeneeded = () => {
            const db = req.result
            if (!db.objectStoreNames.contains(STORE)) {
                db.createObjectStore(STORE, { keyPath: "idempotencyKey" })
            }
        }
    })
}

export async function enqueueSalesOutboxEntry(
    entry: Omit<SalesOutboxEntry, "attempts" | "createdAt">
): Promise<void> {
    const full: SalesOutboxEntry = {
        ...entry,
        createdAt: Date.now(),
        attempts: 0,
    }
    const db = await openDb()
    await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(STORE, "readwrite")
        const store = tx.objectStore(STORE)
        const r = store.put(full)
        const timeoutId = globalThis.setTimeout(() => {
            tx.abort()
            reject(new Error("IndexedDB write timed out"))
        }, DB_TX_TIMEOUT_MS)
        tx.oncomplete = () => resolve()
        tx.onerror = () => reject(tx.error ?? r.error ?? new Error("IndexedDB write failed"))
        tx.onabort = () => reject(tx.error ?? new Error("IndexedDB write aborted"))
        r.onerror = () => reject(r.error ?? new Error("IndexedDB put failed"))
        tx.addEventListener("complete", () => globalThis.clearTimeout(timeoutId), { once: true })
        tx.addEventListener("error", () => globalThis.clearTimeout(timeoutId), { once: true })
        tx.addEventListener("abort", () => globalThis.clearTimeout(timeoutId), { once: true })
    })
}

export async function getAllOutboxEntries(): Promise<SalesOutboxEntry[]> {
    const db = await openDb()
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE, "readonly")
        const store = tx.objectStore(STORE)
        const r = store.getAll()
        let rows: SalesOutboxEntry[] = []
        const timeoutId = globalThis.setTimeout(() => {
            reject(new Error("IndexedDB read timed out"))
        }, DB_TX_TIMEOUT_MS)
        r.onsuccess = () => {
            rows = (r.result as SalesOutboxEntry[]) ?? []
        }
        tx.oncomplete = () => resolve(rows)
        tx.onerror = () => reject(tx.error ?? r.error ?? new Error("IndexedDB read failed"))
        tx.onabort = () => reject(tx.error ?? new Error("IndexedDB read aborted"))
        r.onerror = () => reject(r.error ?? new Error("IndexedDB getAll failed"))
        tx.addEventListener("complete", () => globalThis.clearTimeout(timeoutId), { once: true })
        tx.addEventListener("error", () => globalThis.clearTimeout(timeoutId), { once: true })
        tx.addEventListener("abort", () => globalThis.clearTimeout(timeoutId), { once: true })
    })
}

export async function getOutboxEntryCount(): Promise<number> {
    const entries = await getAllOutboxEntries()
    return entries.length
}

async function deleteOutboxEntry(idempotencyKey: string): Promise<void> {
    const db = await openDb()
    await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(STORE, "readwrite")
        const store = tx.objectStore(STORE)
        const r = store.delete(idempotencyKey)
        const timeoutId = globalThis.setTimeout(() => {
            tx.abort()
            reject(new Error("IndexedDB delete timed out"))
        }, DB_TX_TIMEOUT_MS)
        tx.oncomplete = () => resolve()
        tx.onerror = () => reject(tx.error ?? r.error ?? new Error("IndexedDB delete failed"))
        tx.onabort = () => reject(tx.error ?? new Error("IndexedDB delete aborted"))
        r.onerror = () => reject(r.error ?? new Error("IndexedDB delete request failed"))
        tx.addEventListener("complete", () => globalThis.clearTimeout(timeoutId), { once: true })
        tx.addEventListener("error", () => globalThis.clearTimeout(timeoutId), { once: true })
        tx.addEventListener("abort", () => globalThis.clearTimeout(timeoutId), { once: true })
    })
}

export async function removeSalesOutboxEntry(idempotencyKey: string): Promise<void> {
    await deleteOutboxEntry(idempotencyKey)
}

async function updateOutboxAttempt(key: string, err: string): Promise<void> {
    const db = await openDb()
    await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(STORE, "readwrite")
        const store = tx.objectStore(STORE)
        const r = store.get(key)
        const timeoutId = globalThis.setTimeout(() => {
            tx.abort()
            reject(new Error("IndexedDB update timed out"))
        }, DB_TX_TIMEOUT_MS)
        r.onsuccess = () => {
            const e = r.result as SalesOutboxEntry | undefined
            if (!e) {
                return
            }
            e.attempts += 1
            e.lastError = err
            const w = store.put(e)
            w.onerror = () => reject(w.error ?? new Error("IndexedDB update put failed"))
        }
        tx.oncomplete = () => resolve()
        tx.onerror = () => reject(tx.error ?? r.error ?? new Error("IndexedDB update failed"))
        tx.onabort = () => reject(tx.error ?? new Error("IndexedDB update aborted"))
        r.onerror = () => reject(r.error ?? new Error("IndexedDB update get failed"))
        tx.addEventListener("complete", () => globalThis.clearTimeout(timeoutId), { once: true })
        tx.addEventListener("error", () => globalThis.clearTimeout(timeoutId), { once: true })
        tx.addEventListener("abort", () => globalThis.clearTimeout(timeoutId), { once: true })
    })
}

function estimateSaleTotal(payload: RecordSalePayload): number {
    return payload.items.reduce((sum, item) => {
        const unit = item.customPrice ?? 0
        return sum + unit * item.quantity
    }, 0)
}

export function buildOfflineRecordedSale(
    payload: RecordSalePayload,
    idempotencyKey: string
): RecordSaleResult {
    const total = estimateSaleTotal(payload)
    const paid = payload.amountPaid ?? total
    return {
        saleId: `local-${idempotencyKey}`,
        shortCode: "······",
        totalAmount: total,
        amountPaid: paid,
        remainingAmount: Math.max(0, total - paid),
        paymentMethod: payload.paymentMethod,
        status: "PENDING_SYNC",
        date: new Date().toISOString(),
        customer: payload.customerName ?? "Walk-in",
        items: payload.items.map((item) => ({
            productName: item.productName,
            quantity: item.quantity,
            price: item.customPrice ?? 0,
            total: (item.customPrice ?? 0) * item.quantity,
        })),
        offlineQueued: true,
        idempotencyKey,
    }
}

export function shouldQueueFailedSaleRequest(error: unknown): boolean {
    if (typeof navigator !== "undefined" && !navigator.onLine) return true
    if (error instanceof ApiError) {
        // Keep sale intent on auth expiry; it can sync after re-login.
        if (error.statusCode === 401) return true
        if (error.statusCode >= 400 && error.statusCode < 500) {
            if (error.statusCode === 408 || error.statusCode === 429) return true
            return false
        }
        if (error.statusCode >= 500) return true
        return true
    }
    return true
}

/**
 * POST queued sales in order. Stops on first failure; retries on a later flush.
 */
export async function flushSalesOutbox(queryClient: QueryClient): Promise<void> {
    if (typeof window === "undefined" || !navigator.onLine) return

    const entries = (await getAllOutboxEntries()).sort((a, b) => a.createdAt - b.createdAt)

    for (const entry of entries) {
        try {
            await apiClient.post<RecordedSale>("/sales", entry.payload, {
                headers: { "Idempotency-Key": entry.idempotencyKey },
                businessIdOverride: entry.businessId,
                signal: fetchTimeoutSignal(),
            })
            await deleteOutboxEntry(entry.idempotencyKey)
            queryClient.invalidateQueries({ queryKey: ["sales", entry.businessId] })
            window.dispatchEvent(new CustomEvent("sales-outbox:changed"))
        } catch (error) {
            if (error instanceof ApiError && error.statusCode === 401) {
                break
            }
            const msg = error instanceof Error ? error.message : "Sync failed"
            await updateOutboxAttempt(entry.idempotencyKey, msg)
            break
        }
    }
}

export function notifyOutboxChanged(): void {
    if (typeof window === "undefined") return
    window.dispatchEvent(new CustomEvent("sales-outbox:changed"))
}
