"use client"

import { useEffect } from "react"
import { usePathname, useRouter } from "next/navigation"
import { useAuth } from "../providers/auth-provider"

const PUBLIC_PATHS = ["/login", "/register", "/forgot-password", "/password-reset", "/pay", "/verify", "/staff-invite", "/sales-mode/login"]
const GUEST_ONLY_PATHS = ["/login", "/register", "/forgot-password", "/password-reset"]

/**
 * Global authentication guard to protect dashboard routes
 */
export function AuthGuard({ children }: { children: React.ReactNode }) {
    const { user, isLoading } = useAuth()
    const pathname = usePathname()
    const router = useRouter()

    useEffect(() => {
        if (isLoading) return

        const isPublicPath = PUBLIC_PATHS.some(path => pathname.startsWith(path))
        const isGuestOnlyPath = GUEST_ONLY_PATHS.some(path => pathname.startsWith(path))
        const isSalesModePath = pathname.startsWith('/sales-mode')
        const isSalesModeLoginPath = pathname.startsWith('/sales-mode/login')

        // If not authenticated and trying to access a protected route
        if (!user && !isPublicPath) {
            // Store the path they were trying to access
            const callbackUrl = encodeURIComponent(pathname)
            router.replace(`/login?callbackUrl=${callbackUrl}`)
            return
        }

        // If authenticated and trying to access a guest-only route (like login)
        if (user && isGuestOnlyPath) {
            router.replace("/")
            return
        }

        if (user?.salesMode && !isSalesModePath) {
            router.replace('/sales-mode/pos')
            return
        }

        if (user?.salesMode && isSalesModeLoginPath) {
            router.replace('/sales-mode/pos')
            return
        }

        if (user && !user.salesMode && isSalesModePath && !isSalesModeLoginPath) {
            router.replace('/')
            return
        }

        // Non-field-agents cannot access field agent pages
        if (user && pathname.startsWith('/field') && !user.fieldAgent) {
            router.replace('/')
            return
        }
    }, [user, isLoading, pathname, router])

    // While checking auth, show nothing or a full-page loader to prevent content flicker
    if (isLoading) {
        return null
    }

    // If no user and not a public path, don't render anything while redirecting
    const isPublicPath = PUBLIC_PATHS.some(path => pathname.startsWith(path))
    if (!user && !isPublicPath) {
        return null
    }

    // Don't render field agent pages for non-agents while redirecting
    if (user && pathname.startsWith('/field') && !user.fieldAgent) {
        return null
    }

    if (user?.salesMode && !pathname.startsWith('/sales-mode')) {
        return null
    }

    if (user && !user.salesMode && pathname.startsWith('/sales-mode') && !pathname.startsWith('/sales-mode/login')) {
        return null
    }

    return <>{children}</>
}
