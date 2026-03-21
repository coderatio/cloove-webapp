"use client"

import { useEffect } from "react"
import { usePathname, useRouter } from "next/navigation"
import { useBusiness } from "../BusinessProvider"
import { useAuth } from "../providers/auth-provider"

const PUBLIC_PATHS = ["/login", "/register", "/select-business", "/onboarding"]

export function BusinessGuard({ children }: { children: React.ReactNode }) {
    const { activeBusiness, isLoading: isBusinessLoading, isRefreshing, businesses } = useBusiness()
    const { user, isLoading: isAuthLoading } = useAuth()
    const pathname = usePathname()
    const router = useRouter()

    useEffect(() => {
        // Wait for auth and initial business load
        if (isBusinessLoading || isAuthLoading) return

        // If we don't have an active business yet, wait if we're still refreshing (e.g. initial fetch after login)
        if (!activeBusiness && isRefreshing) return
        if (!user) return // Let AuthGuard handle login redirection

        const isPublicPath = PUBLIC_PATHS.some(path => pathname.startsWith(path))

        if (!isPublicPath && !activeBusiness) {
            if (businesses.length === 0) {
                router.replace(`/onboarding?callbackUrl=${encodeURIComponent(pathname)}`)
            } else {
                router.replace(`/select-business?callbackUrl=${encodeURIComponent(pathname)}`)
            }
            return
        }

    }, [activeBusiness, isBusinessLoading, isAuthLoading, user, pathname, router, businesses.length])

    // While loading, we might want to show a splash screen or just null
    if (isBusinessLoading || isAuthLoading) {
        return null // Or a full screen loader
    }

    return <>{children}</>
}
