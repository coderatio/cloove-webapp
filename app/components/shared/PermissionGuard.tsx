"use client"

import { ReactNode } from "react"
import { usePermission } from "@/app/hooks/usePermission"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { Button } from "@/app/components/ui/button"
import { Lock } from "lucide-react"

interface PermissionGuardProps {
    permission?: string
    anyPermission?: string[]
    role?: string
    children: ReactNode
    redirect?: boolean
}

/**
 * Access Denied View
 */
function AccessDenied() {
    const router = useRouter()

    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-6">
                <Lock className="w-8 h-8 text-red-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
            <p className="text-gray-600 mb-8 max-w-md">
                You do not have the required permissions to view this page. If you believe this is an error, please contact your business owner.
            </p>
            <div className="flex gap-4">
                <Button variant="outline" onClick={() => router.back()}>
                    Go Back
                </Button>
                <Button onClick={() => router.push("/dashboard")}>
                    Dashboard
                </Button>
            </div>
        </div>
    )
}

/**
 * Route-level guard for permissions.
 * Wraps page content to prevent unauthorized access.
 */
export function PermissionGuard({
    permission,
    anyPermission,
    role: targetRole,
    children,
    redirect = false
}: PermissionGuardProps) {
    const { can, canAny, hasRole, loading } = usePermission()
    const router = useRouter()

    let allowed = false

    if (permission) {
        allowed = can(permission)
    } else if (anyPermission) {
        allowed = canAny(anyPermission)
    } else if (targetRole) {
        allowed = hasRole(targetRole)
    } else {
        allowed = true
    }

    useEffect(() => {
        if (!loading && !allowed && redirect) {
            router.push("/dashboard")
        }
    }, [loading, allowed, redirect, router])

    if (loading) {
        return null // Or a loading skeleton
    }

    if (!allowed) {
        return redirect ? null : <AccessDenied />
    }

    return <>{children}</>
}
