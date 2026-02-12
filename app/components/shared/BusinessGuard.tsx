"use client"

import { useEffect } from "react"
import { usePathname, useRouter } from "next/navigation"
import { useBusiness } from "../BusinessProvider"

const PUBLIC_PATHS = ["/login", "/register", "/select-business", "/onboarding"]

export function BusinessGuard({ children }: { children: React.ReactNode }) {
    const { activeBusiness, isLoading, businesses } = useBusiness()
    const pathname = usePathname()
    const router = useRouter()

    useEffect(() => {
        if (isLoading) return

        const isPublicPath = PUBLIC_PATHS.some(path => pathname.startsWith(path))

        if (!isPublicPath && !activeBusiness) {
            if (businesses.length === 0) {
                // If we know they have no businesses, maybe send to onboarding
                // For now, just let it be or send to a 'no-business' page
                // router.replace("/onboarding/create")
            } else {
                router.replace(`/select-business?callbackUrl=${encodeURIComponent(pathname)}`)
            }
        }
    }, [activeBusiness, isLoading, pathname, router, businesses.length])

    // While loading, we might want to show a splash screen or just null
    if (isLoading) {
        return null // Or a full screen loader
    }

    return <>{children}</>
}
