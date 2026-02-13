"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import { useIdleTracker } from "@/app/hooks/use-idle-tracker"
import { apiClient } from "@/app/lib/api-client"
import { SessionTimeoutDrawer } from "./SessionTimeoutDrawer"

interface SessionManagerProps {
    sessionMetadata?: {
        expiresAt?: string
        refreshInterval?: string
    }
    onSessionRefresh?: (token: string) => void
}

/**
 * Manages the session lifecycle, inactivity tracking, and token rotation
 */
export function SessionManager({ sessionMetadata, onSessionRefresh }: SessionManagerProps) {
    const { lastActivity } = useIdleTracker()
    const [showWarning, setShowWarning] = useState(false)
    const [remainingSeconds, setRemainingSeconds] = useState(60) // 1 minute warning

    // Configurable thresholds (defaults)
    const refreshIntervalMs = parseDuration(sessionMetadata?.refreshInterval || "5m")
    const totalIdleTimeoutMs = refreshIntervalMs
    const proactiveRefreshThresholdMs = refreshIntervalMs * 0.6 // Refresh at 3 mins if 5 min TTL
    const warningThresholdMs = refreshIntervalMs * 0.8 // Warn at 4 mins if 5 min TTL


    const lastRefreshTime = useRef(Date.now())
    const warningStartedAtRef = useRef<number | null>(null)
    const timerRef = useRef<NodeJS.Timeout | null>(null)

    // Function to parse Adonis-style duration strings (e.g., "5m", "1h")
    function parseDuration(duration: string): number {
        const value = parseInt(duration)
        if (duration.endsWith('s')) return value * 1000
        if (duration.endsWith('m')) return value * 60 * 1000
        if (duration.endsWith('h')) return value * 60 * 60 * 1000
        return value || 5 * 60 * 1000 // Default 5 mins
    }

    const handleRefresh = useCallback(async () => {
        try {
            const data = await apiClient.refresh()
            lastRefreshTime.current = Date.now()
            warningStartedAtRef.current = null
            setShowWarning(false)
            if (onSessionRefresh) {
                onSessionRefresh(data.token)
            }
        } catch (error: any) {
            // If it's a 401, we might have already expired on backend
            // Instead of instant logout, show the warning to give one last chance
            if (error.statusCode === 401) {
                setShowWarning(true)
                setRemainingSeconds(30) // Give short grace period
            } else {
                // For other errors, logout to be safe
                apiClient.logout()
            }
        }
    }, [onSessionRefresh])

    const handleLogout = useCallback(() => {
        apiClient.logout()
    }, [])

    const lastActivityRef = useRef(lastActivity)
    useEffect(() => {
        lastActivityRef.current = lastActivity
    }, [lastActivity])

    useEffect(() => {
        const checkSession = () => {
            const now = Date.now()
            const currentLastActivity = lastActivityRef.current
            const idleTime = now - currentLastActivity


            // 1. Proactive Refresh logic (only if active and NO warning shown)
            // If user is active (idleTime is small) but token is getting old
            if (!showWarning && idleTime < proactiveRefreshThresholdMs && (now - lastRefreshTime.current) >= proactiveRefreshThresholdMs) {
                handleRefresh()
                return
            }

            // 2. Warning logic (Once triggered, stay until explicit decision by user)
            if (showWarning || idleTime >= warningThresholdMs) {
                if (!showWarning) {
                    setShowWarning(true)
                    warningStartedAtRef.current = now
                }

                // Use fixed start time for warning to ignore subsequent activity
                const warningStartedAt = warningStartedAtRef.current || now
                const warningDurationMs = totalIdleTimeoutMs - warningThresholdMs
                const totalTimeoutAt = warningStartedAt + warningDurationMs

                const remaining = Math.max(0, Math.ceil((totalTimeoutAt - now) / 1000))
                setRemainingSeconds(remaining)

                // 3. LOGOUT: Trigger if time is officially up
                if (remaining === 0) {
                    handleLogout()
                    return
                }

                // 4. Fallback: Security logout if way past everything (safety)
                if (idleTime >= totalIdleTimeoutMs + (5 * 60 * 1000)) {
                    handleLogout()
                }
            }
        }

        const interval = setInterval(checkSession, 1000)
        return () => clearInterval(interval)
    }, [proactiveRefreshThresholdMs, warningThresholdMs, totalIdleTimeoutMs, showWarning, handleRefresh, handleLogout])

    return (
        <SessionTimeoutDrawer
            isOpen={showWarning}
            remainingSeconds={remainingSeconds}
            onExtend={handleRefresh}
            onLogout={handleLogout}
        />
    )
}
