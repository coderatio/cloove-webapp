/**
 * AbortSignal for fetch when the connection stalls (common when the network drops
 * but `navigator.onLine` is still true).
 */
export function fetchTimeoutSignal(ms = 30_000): AbortSignal {
    if (typeof AbortSignal !== "undefined" && typeof AbortSignal.timeout === "function") {
        return AbortSignal.timeout(ms)
    }
    const c = new AbortController()
    globalThis.setTimeout(() => c.abort(), ms)
    return c.signal
}
