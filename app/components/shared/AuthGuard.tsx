"use client"

import { useEffect } from "react"
import { usePathname, useRouter } from "next/navigation"
import { useAuth } from "../providers/auth-provider"

const PUBLIC_PATHS = ["/login", "/register", "/forgot-password", "/reset-password"]

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

        if (!user && !isPublicPath) {
            // Store the path they were trying to access
            const callbackUrl = encodeURIComponent(pathname)
            router.replace(`/login?callbackUrl=${callbackUrl}`)
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

    return <>{children}</>
}
