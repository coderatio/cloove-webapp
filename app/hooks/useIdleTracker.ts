import { useEffect, useState, useCallback, useRef } from "react"
import { storage } from "@/app/lib/storage"

/**
 * Hook to track user activity/idleness across all open tabs
 */
export function useIdleTracker() {
    const [lastActivity, setLastActivity] = useState<number>(0) // Start at 0 for hydration
    const lastUpdateRef = useRef<number>(Date.now())
    const THROTTLE_MS = 2000

    useEffect(() => {
        // Initialize on client
        const initial = storage.getLastActivity()
        setLastActivity(initial)
        lastUpdateRef.current = initial
    }, [])

    const handleActivity = useCallback(() => {
        const now = Date.now()
        setLastActivity(now)

        if (now - lastUpdateRef.current > THROTTLE_MS) {
            storage.setLastActivity(now)
            lastUpdateRef.current = now
        }
    }, [])

    useEffect(() => {
        const events = [
            "mousedown",
            "mousemove",
            "keydown",
            "scroll",
            "touchstart",
            "click",
        ]

        const eventOptions = { passive: true }

        events.forEach((event) => {
            window.addEventListener(event, handleActivity, eventOptions)
        })

        // Listen for activity in other tabs
        const handleStorageChange = (e: StorageEvent) => {
            if (e.key === 'last_activity' && e.newValue) {
                const timestamp = parseInt(e.newValue)
                if (!isNaN(timestamp)) {
                    setLastActivity(timestamp)
                    lastUpdateRef.current = timestamp
                }
            }
        }

        window.addEventListener('storage', handleStorageChange)

        return () => {
            events.forEach((event) => {
                window.removeEventListener(event, handleActivity)
            })
            window.removeEventListener('storage', handleStorageChange)
        }
    }, [handleActivity])

    return {
        lastActivity,
        resetActivity: handleActivity,
    }
}
