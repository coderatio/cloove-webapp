"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import { useIdleTracker } from "@/app/hooks/useIdleTracker"
import { apiClient } from "@/app/lib/api-client"
import { SessionTimeoutDrawer } from "./SessionTimeoutDrawer"

const CHECK_INTERVAL_MS = 1000

/** Show the warning this many ms before the session actually expires.
 *  Capped at 5 minutes but scales down with the refresh interval so short
 *  TTLs (e.g. AUTH_TOKEN_TTL=5m with SESSION_REFRESH_INTERVAL=1m) don't
 *  trigger the warning immediately on login. */
function getWarningBeforeMs(refreshIntervalMs: number): number {
    return Math.min(5 * 60 * 1000, refreshIntervalMs * 2)
}

interface SessionManagerProps {
    sessionMetadata?: {
        expiresAt?: string
        refreshInterval?: string
    }
    onSessionRefresh?: () => void
}

function parseDuration(duration: string): number {
    const value = parseInt(duration)
    if (duration.endsWith('s')) return value * 1000
    if (duration.endsWith('m')) return value * 60 * 1000
    if (duration.endsWith('h')) return value * 60 * 60 * 1000
    return value || 5 * 60 * 1000
}

export function SessionManager({ sessionMetadata, onSessionRefresh }: SessionManagerProps) {
    const { lastActivity, resetActivity } = useIdleTracker()
    const [showWarning, setShowWarning] = useState(false)
    const [remainingSeconds, setRemainingSeconds] = useState(0)

    const refreshIntervalMs = parseDuration(sessionMetadata?.refreshInterval || "5m")
    const warningBeforeMs = getWarningBeforeMs(refreshIntervalMs)

    // Source of truth for when the session expires — updated after each successful refresh
    const effectiveExpiresAtRef = useRef<number | null>(null)
    const lastActivityRef = useRef(lastActivity)
    const isRefreshingRef = useRef(false)
    // Tracks when we last called refresh so we can fire it on a schedule
    const lastRefreshTimeRef = useRef<number>(Date.now())
    // Mirror of showWarning readable inside the stable interval callback
    const showWarningRef = useRef(false)

    // Keep lastActivity readable inside the stable interval callback
    useEffect(() => {
        lastActivityRef.current = lastActivity
    }, [lastActivity])

    // Keep showWarning ref in sync so the interval can read it without being in its deps
    useEffect(() => {
        showWarningRef.current = showWarning
    }, [showWarning])

    // Seed the expiry from session metadata on first load and when it changes
    // (e.g. after a server-side token rotation that updates the user object).
    // Falls back to an estimate when expiresAt is absent so the interval always runs.
    useEffect(() => {
        if (sessionMetadata?.expiresAt) {
            const parsed = new Date(sessionMetadata.expiresAt).getTime()
            if (!Number.isNaN(parsed) && parsed > Date.now()) {
                effectiveExpiresAtRef.current = parsed
                lastRefreshTimeRef.current = Date.now()
                // New valid session — dismiss any lingering warning from previous session
                setShowWarning(false)
                setRemainingSeconds(0)
                return
            }
        }
        // Fallback: if the backend didn't return expiresAt, estimate using
        // refresh interval × 5 (a common TTL:refresh ratio).
        // Once the user refreshes, we'll get the real expiresAt from the API.
        if (effectiveExpiresAtRef.current === null) {
            effectiveExpiresAtRef.current = Date.now() + refreshIntervalMs * 5
        }
    }, [sessionMetadata?.expiresAt, refreshIntervalMs])

    const handleLogout = useCallback((reason: 'timeout' | 'manual' = 'manual') => {
        // Close the drawer immediately — don't wait for navigation
        setShowWarning(false)
        setRemainingSeconds(0)
        const redirectTo = reason === 'timeout' ? '/login?reason=session_expired' : '/login'
        apiClient.logout(redirectTo)
    }, [])

    const handleRefresh = useCallback(async () => {
        if (isRefreshingRef.current) return
        isRefreshingRef.current = true
        try {
            const result = await apiClient.refresh()
            const now = Date.now()
            lastRefreshTimeRef.current = now

            // Update the tracked expiry from the server response
            let newExpiry: number | null = null
            if (result?.expiresAt) {
                const parsed = new Date(result.expiresAt).getTime()
                if (!Number.isNaN(parsed)) newExpiry = parsed
            }
            // Always extend — fall back to estimated full TTL if response was missing or unparseable
            effectiveExpiresAtRef.current = newExpiry ?? (now + refreshIntervalMs * 5)

            // Dismiss the warning immediately — sync the ref so the interval
            // won't race with the React state update and re-show the drawer
            setShowWarning(false)
            setRemainingSeconds(0)
            showWarningRef.current = false
            resetActivity()
            onSessionRefresh?.()
        } catch (error: any) {
            if (error?.statusCode === 401) {
                // Backend already expired the session — log out immediately
                handleLogout('timeout')
            }
            // Other errors: leave warning open so user can retry
        } finally {
            isRefreshingRef.current = false
        }
    }, [refreshIntervalMs, resetActivity, onSessionRefresh, handleLogout])

    // Use refs for the callbacks so the interval never needs to be recreated
    const handleRefreshRef = useRef(handleRefresh)
    const handleLogoutRef = useRef(handleLogout)
    useEffect(() => { handleRefreshRef.current = handleRefresh }, [handleRefresh])
    useEffect(() => { handleLogoutRef.current = handleLogout }, [handleLogout])

    useEffect(() => {
        const checkSession = () => {
            const expiresAt = effectiveExpiresAtRef.current
            if (!expiresAt) return

            const now = Date.now()
            const remainingMs = expiresAt - now

            // Session has fully expired
            if (remainingMs <= 0) {
                setShowWarning(true)
                setRemainingSeconds(0)
                handleLogoutRef.current('timeout')
                return
            }

            const remainingSecs = Math.ceil(remainingMs / 1000)
            const idleTimeMs = now - lastActivityRef.current

            // Proactive refresh: fire on a schedule (every refreshInterval) while
            // the user is actively using the app (idle < refreshInterval).
            // This keeps the session alive for active users without touching it for idle ones.
            const isActive = idleTimeMs < refreshIntervalMs
            const isDueForRefresh = (now - lastRefreshTimeRef.current) >= refreshIntervalMs
            if (!isRefreshingRef.current && !showWarningRef.current && isActive && isDueForRefresh) {
                handleRefreshRef.current()
                return
            }

            // Show/update warning when approaching expiry
            if (remainingMs <= warningBeforeMs) {
                setShowWarning(true)
                setRemainingSeconds(remainingSecs)
            } else {
                // Dismiss warning if session was extended (e.g. another tab refreshed)
                setShowWarning(false)
            }
        }

        const interval = setInterval(checkSession, CHECK_INTERVAL_MS)
        return () => clearInterval(interval)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [refreshIntervalMs, warningBeforeMs])

    return (
        <SessionTimeoutDrawer
            isOpen={showWarning}
            onOpenChange={setShowWarning}
            remainingSeconds={remainingSeconds}
            onExtend={handleRefresh}
            onLogout={() => handleLogout('manual')}
        />
    )
}
