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
    return useMediaQuery('(max-width: 767px)')
}

export function useIsTablet(): boolean {
    return useMediaQuery('(min-width: 768px) and (max-width: 1279px)')
}

