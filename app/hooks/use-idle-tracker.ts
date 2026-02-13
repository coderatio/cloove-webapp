import { useEffect, useState, useCallback } from "react"

/**
 * Hook to track user activity/idleness
 */
export function useIdleTracker() {
    const [lastActivity, setLastActivity] = useState(Date.now())

    const handleActivity = useCallback(() => {
        setLastActivity(Date.now())
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

        return () => {
            events.forEach((event) => {
                window.removeEventListener(event, handleActivity)
            })
        }
    }, [handleActivity])

    return {
        lastActivity,
        resetActivity: handleActivity,
    }
}
