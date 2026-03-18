"use client"

import { useEffect } from "react"
import { usePathname, useRouter } from "next/navigation"
import { useBusiness } from "../BusinessProvider"
import { useAuth } from "../providers/auth-provider"

const PUBLIC_PATHS = ["/login", "/register", "/select-business", "/onboarding"]

export function BusinessGuard({ children }: { children: React.ReactNode }) {
    const { activeBusiness, isLoading: isBusinessLoading, businesses } = useBusiness()
    const { user, isLoading: isAuthLoading } = useAuth()
    const pathname = usePathname()
    const router = useRouter()

    useEffect(() => {
        if (isBusinessLoading || isAuthLoading) return
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

        if (!isPublicPath && activeBusiness && activeBusiness.businessType === null && pathname !== '/select-business-type') {
            router.replace(`/select-business-type?callbackUrl=${encodeURIComponent(pathname)}`)
        }
    }, [activeBusiness, isBusinessLoading, isAuthLoading, user, pathname, router, businesses.length])

    // While loading, we might want to show a splash screen or just null
    if (isBusinessLoading || isAuthLoading) {
        return null // Or a full screen loader
    }

    return <>{children}</>
}
