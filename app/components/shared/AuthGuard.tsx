"use client"

import { useEffect } from "react"
import { usePathname, useRouter } from "next/navigation"
import { useAuth } from "../providers/auth-provider"

const PUBLIC_PATHS = ["/login", "/register", "/forgot-password", "/reset-password", "/pay", "/verify"]
const GUEST_ONLY_PATHS = ["/login", "/register", "/forgot-password", "/reset-password"]

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

    return <>{children}</>
}
