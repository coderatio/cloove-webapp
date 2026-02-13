import React, { useEffect, useState, useCallback, useRef } from "react"
import { useIdleTracker } from "@/app/hooks/use-idle-tracker"
import { apiClient } from "@/app/lib/api-client"
import { SessionTimeoutDrawer } from "./SessionTimeoutDrawer"
import { storage, STORAGE_KEYS } from "@/app/lib/storage"

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
    const warningDurationSeconds = 60
    const warningThresholdMs = totalIdleTimeoutMs - (warningDurationSeconds * 1000)

    const lastRefreshTime = useRef(Date.now())
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
            setShowWarning(false)
            if (onSessionRefresh) {
                onSessionRefresh(data.token)
            }
        } catch (error) {
            console.error("Failed to refresh session", error)
            apiClient.logout()
        }
    }, [onSessionRefresh])

    const handleLogout = useCallback(() => {
        apiClient.logout()
    }, [])

    useEffect(() => {
        const checkSession = () => {
            const now = Date.now()
            const idleTime = now - lastActivity

            // 1. If active and near refresh interval, refresh token
            // We refresh if active and at least 80% of the interval has passed
            if (idleTime < warningThresholdMs && (now - lastRefreshTime.current) >= (refreshIntervalMs * 0.8)) {
                handleRefresh()
            }

            // 2. If idle time has reached the warning threshold
            if (idleTime >= warningThresholdMs && idleTime < totalIdleTimeoutMs) {
                if (!showWarning) {
                    setShowWarning(true)
                    // Calculate exact remaining seconds based on idle time
                    const remaining = Math.max(0, Math.ceil((totalIdleTimeoutMs - idleTime) / 1000))
                    setRemainingSeconds(remaining)
                }
            } else if (idleTime < warningThresholdMs && showWarning) {
                // If user becomes active again before the timer ends, hide warning
                setShowWarning(false)
            }

            // 3. Fallback: If idle time exceeds total timeout significantly without manual logout
            if (idleTime >= totalIdleTimeoutMs + 5000 && !showWarning) {
                handleLogout()
            }
        }

        const interval = setInterval(checkSession, 1000) // Check every second for better responsiveness
        return () => clearInterval(interval)
    }, [lastActivity, refreshIntervalMs, warningThresholdMs, totalIdleTimeoutMs, showWarning, handleRefresh, handleLogout])

    // Warning countdown timer (visual only)
    useEffect(() => {
        if (showWarning && remainingSeconds > 0) {
            const timer = setInterval(() => {
                setRemainingSeconds(prev => {
                    if (prev <= 1) {
                        handleLogout()
                        return 0
                    }
                    return prev - 1
                })
            }, 1000)
            return () => clearInterval(timer)
        }
    }, [showWarning, remainingSeconds])

    // If user interacts while warning is shown, automatically extend?
    // User requested "actionable" drawer, so maybe let them click the button instead of auto-extending.
    // But if they move the mouse, maybe we should at least reset the idle timer?
    // The requirement says "decision to stay loggedin or allow system to log them out".
    // So I'll keep the drawer open until they click.

    return (
        <SessionTimeoutDrawer
            isOpen={showWarning}
            remainingSeconds={remainingSeconds}
            onExtend={handleRefresh}
            onLogout={handleLogout}
        />
    )
}
