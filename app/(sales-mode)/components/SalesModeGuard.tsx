"use client"

import { useEffect } from "react"
import { usePathname, useRouter } from "next/navigation"
import { useAuth } from "@/app/components/providers/auth-provider"

export function SalesModeGuard({ children }: { children: React.ReactNode }) {
    const { user, isLoading } = useAuth()
    const router = useRouter()
    const pathname = usePathname()

    useEffect(() => {
        if (isLoading) return
        if (!user?.salesMode) {
            router.replace("/sales-mode/login")
            return
        }
        if (!pathname.startsWith("/sales-mode")) {
            router.replace("/sales-mode/pos")
        }
    }, [isLoading, pathname, router, user?.salesMode])

    if (isLoading || !user?.salesMode) {
        return null
    }

    return <>{children}</>
}
