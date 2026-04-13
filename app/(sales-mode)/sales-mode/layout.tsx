"use client"

import { useEffect } from "react"
import { storage } from "@/app/lib/storage"
import { useAuth } from "@/app/components/providers/auth-provider"
import { SalesModeGuard } from "../components/SalesModeGuard"
import { SalesModeNavBar } from "../components/SalesModeNavBar"

export default function SalesModeLayout({ children }: { children: React.ReactNode }) {
    const { user } = useAuth()

    useEffect(() => {
        if (user?.salesModeBusinessId) {
            storage.setActiveBusinessId(user.salesModeBusinessId)
        }
    }, [user?.salesModeBusinessId])

    return (
        <SalesModeGuard>
            <SalesModeNavBar>{children}</SalesModeNavBar>
        </SalesModeGuard>
    )
}
