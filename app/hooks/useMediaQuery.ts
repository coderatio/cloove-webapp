"use client"

import { useSyncExternalStore, useState, useEffect } from 'react'

export function useMediaQuery(query: string): boolean {
    const subscribe = (callback: () => void) => {
        const matchMedia = window.matchMedia(query)
        matchMedia.addEventListener("change", callback)
        return () => matchMedia.removeEventListener("change", callback)
    }

    const getSnapshot = () => {
        return window.matchMedia(query).matches
    }

    const getServerSnapshot = () => {
        return false
    }

    return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}

export function useIsMobile(): boolean {
    const [isMobile, setIsMobile] = useState(false)

    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 768)
        }

        checkMobile()
        window.addEventListener('resize', checkMobile)
        return () => window.removeEventListener('resize', checkMobile)
    }, [])

    return isMobile
}
