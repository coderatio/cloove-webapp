"use client"

import { ReactNode } from "react"
import { usePermission } from "@/app/hooks/usePermission"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { Button } from "@/app/components/ui/button"
import { GlassCard } from "@/app/components/ui/glass-card"
import { ShieldOff } from "lucide-react"
import Link from "next/link"
import { motion } from "framer-motion"
import { cn } from "@/app/lib/utils"

interface PermissionGuardProps {
    permission?: string
    anyPermission?: string[]
    role?: string
    children: ReactNode
    redirect?: boolean
}

/**
 * Access denied — subscription notices stay in SubscriptionAlertBanner only (no duplicate here).
 */
function AccessDenied({ permission }: { permission?: string }) {
    const router = useRouter()
    const { canUseStaffFeature } = usePermission()
    const staffBlockedByPlan =
        (permission === "MANAGE_STAFF" || permission === "VIEW_STAFF") && !canUseStaffFeature()

    return (
        <div className="flex min-h-[min(70vh,720px)] flex-col items-center justify-center px-4 py-16">
            <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
                className="w-full max-w-lg"
            >
                <GlassCard className="p-1 sm:p-2">
                    <div
                        className={cn(
                            "rounded-[1.5rem] bg-white/90 px-6 py-10 text-center shadow-inner",
                            "dark:bg-brand-deep/40 dark:shadow-none"
                        )}
                    >
                        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl border border-brand-gold/25 bg-brand-gold/10 shadow-[0_8px_32px_rgba(212,175,55,0.12)] dark:bg-brand-gold/5">
                            <ShieldOff
                                className="h-8 w-8 text-brand-gold dark:text-brand-gold"
                                strokeWidth={1.5}
                                aria-hidden
                            />
                        </div>

                        <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.2em] text-brand-accent/70 dark:text-brand-cream/50">
                            Restricted
                        </p>
                        <h1 className="font-serif text-3xl font-medium tracking-tight text-brand-deep dark:text-brand-cream sm:text-4xl">
                            Access denied
                        </h1>

                        <p className="mx-auto mt-4 max-w-sm text-sm leading-relaxed text-brand-accent/80 dark:text-brand-cream/65">
                            {staffBlockedByPlan
                                ? "Team staff isn’t available on your current plan. Upgrade billing to invite and manage staff."
                                : "You don’t have permission to open this page. Ask your business owner if you need access."}
                        </p>

                        <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:justify-center">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => router.back()}
                                className="h-12 rounded-2xl border-brand-deep/10 bg-white/80 text-brand-deep hover:bg-brand-cream dark:border-white/10 dark:bg-white/5 dark:text-brand-cream dark:hover:bg-white/10"
                            >
                                Go back
                            </Button>
                            <Button
                                type="button"
                                onClick={() => router.push("/")}
                                className="h-12 rounded-2xl bg-brand-deep font-semibold text-brand-gold shadow-lg shadow-brand-deep/20 hover:bg-brand-deep/90 dark:bg-brand-gold dark:text-brand-deep dark:hover:bg-brand-gold/90"
                            >
                                Home
                            </Button>
                            {staffBlockedByPlan && (
                                <Button
                                    type="button"
                                    variant="ghost"
                                    asChild
                                    className="h-12 rounded-2xl text-brand-deep/80 underline-offset-4 hover:underline dark:text-brand-gold/90"
                                >
                                    <Link href="/settings?tab=billing">Billing &amp; plans</Link>
                                </Button>
                            )}
                        </div>
                    </div>
                </GlassCard>
            </motion.div>
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
        return redirect ? null : <AccessDenied permission={permission} />
    }

    return <>{children}</>
}
