"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import { useIdleTracker } from "@/app/hooks/useIdleTracker"
import { apiClient } from "@/app/lib/api-client"
import { SessionTimeoutDrawer } from "./SessionTimeoutDrawer"

/** Show the warning this many ms before the session actually expires */
const WARNING_BEFORE_MS = 5 * 60 * 1000 // 5 minutes
const CHECK_INTERVAL_MS = 1000

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

    // Source of truth for when the session expires — updated after each successful refresh
    const effectiveExpiresAtRef = useRef<number | null>(null)
    const lastActivityRef = useRef(lastActivity)
    const isRefreshingRef = useRef(false)

    // Keep lastActivity readable inside the stable interval callback
    useEffect(() => {
        lastActivityRef.current = lastActivity
    }, [lastActivity])

    // Seed the expiry from session metadata on first load and when it changes
    // (e.g. after a server-side token rotation that updates the user object)
    useEffect(() => {
        if (sessionMetadata?.expiresAt) {
            const parsed = new Date(sessionMetadata.expiresAt).getTime()
            if (!Number.isNaN(parsed)) {
                effectiveExpiresAtRef.current = parsed
            }
        }
    }, [sessionMetadata?.expiresAt])

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
            // Update the tracked expiry from the server response
            if (result?.expiresAt) {
                const parsed = new Date(result.expiresAt).getTime()
                if (!Number.isNaN(parsed)) {
                    effectiveExpiresAtRef.current = parsed
                }
            } else {
                // Fallback: optimistically extend by one refresh interval
                effectiveExpiresAtRef.current = Date.now() + refreshIntervalMs
            }
            setShowWarning(false)
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
        if (!sessionMetadata?.expiresAt) return

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

            // Proactive refresh: user is actively using the app and token is within
            // one refresh window of expiry — extend silently before the warning appears
            const isActive = idleTimeMs < refreshIntervalMs * 0.5
            const isNearExpiry = remainingMs <= refreshIntervalMs * 1.1
            if (!isRefreshingRef.current && isActive && isNearExpiry) {
                handleRefreshRef.current()
                return
            }

            // Show/update warning when approaching expiry
            if (remainingMs <= WARNING_BEFORE_MS) {
                setShowWarning(true)
                setRemainingSeconds(remainingSecs)
            } else {
                // Dismiss warning if session was extended (e.g. another tab refreshed)
                setShowWarning(false)
            }
        }

        const interval = setInterval(checkSession, CHECK_INTERVAL_MS)
        return () => clearInterval(interval)
        // Intentionally stable: only recreate if the session itself changes
        // (new login). refreshIntervalMs is a config value that doesn't change at runtime.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [sessionMetadata?.expiresAt, refreshIntervalMs])

    return (
        <SessionTimeoutDrawer
            isOpen={showWarning}
            remainingSeconds={remainingSeconds}
            onExtend={handleRefresh}
            onLogout={() => handleLogout('manual')}
        />
    )
}
