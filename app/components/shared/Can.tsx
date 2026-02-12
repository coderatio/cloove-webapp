"use client"

import { ReactNode } from "react"
import { usePermission } from "@/app/hooks/usePermission"

interface CanProps {
    permission?: string
    anyPermission?: string[]
    role?: string
    children: ReactNode
    fallback?: ReactNode
}

/**
 * Component for conditional rendering based on permissions or roles.
 * 
 * Usage:
 * <Can permission="VIEW_SALES">
 *   <SalesTable />
 * </Can>
 */
export function Can({
    permission,
    anyPermission,
    role: targetRole,
    children,
    fallback = null
}: CanProps) {
    const { can, canAny, hasRole } = usePermission()

    let allowed = false

    if (permission) {
        allowed = can(permission)
    } else if (anyPermission) {
        allowed = canAny(anyPermission)
    } else if (targetRole) {
        allowed = hasRole(targetRole)
    } else {
        // If no props provided, default to allowed (unrestricted)
        allowed = true
    }

    if (!allowed) {
        return <>{fallback}</>
    }

    return <>{children}</>
}
