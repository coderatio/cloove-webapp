"use client"

import Link from "next/link"
import { AlertTriangle, CreditCard, FileText, Wallet } from "lucide-react"
import { useAuth } from "@/app/components/providers/auth-provider"
import { cn } from "@/app/lib/utils"

/**
 * Surfaces `user.subscriptionAlert` from GET /security/me when the backend indicates subscription issues.
 */
export function SubscriptionAlertBanner() {
    const { user } = useAuth()
    const alert = user?.subscriptionAlert
    if (!alert?.message) return null

    const isUrgent = alert.type === "expired" || alert.type === "renewal_failed"

    return (
        <div
            role="alert"
            className={cn(
                "mb-6 rounded-2xl border px-4 py-3 flex flex-col sm:flex-row sm:items-start gap-3 shadow-lg backdrop-blur-sm",
                isUrgent
                    ? "border-amber-500/40 bg-amber-500/10 dark:bg-amber-500/15"
                    : "border-brand-gold/30 bg-brand-gold/5 dark:bg-brand-gold/10"
            )}
        >
            <AlertTriangle
                className={cn(
                    "w-5 h-5 shrink-0 mt-0.5",
                    isUrgent ? "text-amber-600 dark:text-amber-400" : "text-brand-gold-600 dark:text-brand-gold-400"
                )}
                aria-hidden
            />
            <div className="min-w-0 flex-1 space-y-2">
                <p className="text-sm font-medium text-brand-deep dark:text-brand-cream leading-snug">
                    {alert.message}
                </p>
                <div className="flex flex-wrap items-center gap-3 text-xs">
                    <Link
                        href="/settings?tab=billing"
                        className="inline-flex items-center gap-1.5 font-semibold text-brand-deep dark:text-brand-gold underline-offset-2 hover:underline"
                    >
                        <CreditCard className="w-3.5 h-3.5" />
                        Billing &amp; plans
                    </Link>
                    {(alert.type === "grace_period" || alert.type === "expired") && (
                        <>
                            <Link
                                href="/settings?tab=billing#plans"
                                className="inline-flex items-center gap-1.5 font-semibold text-brand-deep dark:text-brand-cream/90 underline-offset-2 hover:underline"
                            >
                                <Wallet className="w-3.5 h-3.5" />
                                Renew with wallet
                            </Link>
                            <Link
                                href="/settings?tab=billing#plans"
                                className="inline-flex items-center gap-1.5 font-semibold text-brand-deep dark:text-brand-cream/90 underline-offset-2 hover:underline"
                            >
                                <CreditCard className="w-3.5 h-3.5" />
                                Renew with card / bank
                            </Link>
                        </>
                    )}
                    {alert.invoiceUrl ? (
                        <a
                            href={alert.invoiceUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 font-semibold text-brand-deep dark:text-brand-cream/90 underline-offset-2 hover:underline"
                        >
                            <FileText className="w-3.5 h-3.5" />
                            View invoice
                        </a>
                    ) : null}
                </div>
            </div>
        </div>
    )
}
