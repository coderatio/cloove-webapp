"use client"

import { useLayoutEffect, useRef, useState, type ElementType } from "react"
import Link from "next/link"
import { AlertTriangle, ChevronRight, CreditCard, FileText, Wallet } from "lucide-react"
import { useAuth } from "@/app/components/providers/auth-provider"
import { Button } from "@/app/components/ui/button"
import {
    Drawer,
    DrawerBody,
    DrawerClose,
    DrawerContent,
    DrawerDescription,
    DrawerStickyHeader,
    DrawerTitle,
} from "@/app/components/ui/drawer"
import { cn } from "@/app/lib/utils"

const BILLING_HREF = "/settings?tab=billing"
const PLANS_HREF = "/settings?tab=billing#plans"

type OptionRowProps = {
    href: string
    external?: boolean
    icon: ElementType
    title: string
    description: string
    iconClassName?: string
}

function RenewalOptionRow({ href, external, icon: Icon, title, description, iconClassName }: OptionRowProps) {
    const className = cn(
        "group flex w-full items-center gap-4 rounded-3xl border border-brand-deep/8 p-4 text-left shadow-sm backdrop-blur-sm transition-all duration-300",
        "bg-white/75 hover:border-brand-deep/12 hover:bg-white/90 dark:border-white/10 dark:bg-white/[0.06] dark:hover:border-white/15 dark:hover:bg-white/10",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold/40 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-brand-deep-900"
    )

    const inner = (
        <>
            <div
                className={cn(
                    "flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-brand-deep/6 dark:bg-white/8",
                    iconClassName
                )}
            >
                <Icon className="h-5 w-5 text-brand-deep/80 dark:text-brand-gold/90" aria-hidden />
            </div>
            <div className="min-w-0 flex-1 py-0.5">
                <p className="font-semibold text-brand-deep dark:text-brand-cream">{title}</p>
                <p className="mt-1 text-xs leading-relaxed text-brand-deep/55 dark:text-brand-cream/55">
                    {description}
                </p>
            </div>
            <div className="flex h-11 w-9 shrink-0 items-center justify-center">
                <ChevronRight
                    className="h-5 w-5 text-brand-deep/30 transition-transform duration-300 group-hover:translate-x-0.5 dark:text-white/35"
                    aria-hidden
                />
            </div>
        </>
    )

    if (external) {
        return (
            <DrawerClose asChild>
                <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={className}
                >
                    {inner}
                </a>
            </DrawerClose>
        )
    }

    return (
        <DrawerClose asChild>
            <Link href={href} className={className}>
                {inner}
            </Link>
        </DrawerClose>
    )
}

/**
 * Surfaces `user.subscriptionAlert` from GET /security/me when the backend indicates subscription issues.
 * Single CTA opens a drawer — renewal paths stay in one calm, scannable surface (Calm Intelligence).
 */
export function SubscriptionAlertBanner() {
    const { user } = useAuth()
    const [drawerOpen, setDrawerOpen] = useState(false)
    const alert = user?.subscriptionAlert
    const bannerRef = useRef<HTMLDivElement>(null)

    /**
     * Mobile: banner is `position:fixed` and stacks message + CTA — height is not a fixed rem value.
     * Sync measured height to `--subscription-banner-offset` so the fixed header sits below the banner (not under it).
     */
    useLayoutEffect(() => {
        const clear = () => {
            document.documentElement.style.removeProperty("--subscription-banner-offset")
        }
        if (!alert?.message) {
            clear()
            return
        }

        const mq = window.matchMedia("(max-width: 767px)")

        const publishHeight = () => {
            if (!mq.matches) {
                clear()
                return
            }
            const node = bannerRef.current
            if (!node) return
            const h = Math.ceil(node.getBoundingClientRect().height)
            if (h > 0) {
                document.documentElement.style.setProperty("--subscription-banner-offset", `${h}px`)
            }
        }

        publishHeight()
        const raf = requestAnimationFrame(publishHeight)

        const ro = new ResizeObserver(publishHeight)
        const node = bannerRef.current
        if (node) ro.observe(node)

        mq.addEventListener("change", publishHeight)

        return () => {
            cancelAnimationFrame(raf)
            ro.disconnect()
            mq.removeEventListener("change", publishHeight)
            clear()
        }
    }, [alert?.message])

    if (!alert?.message) return null

    const isUrgent = alert.type === "expired" || alert.type === "renewal_failed"
    const showPaymentPaths =
        alert.type === "grace_period" ||
        alert.type === "expired" ||
        alert.type === "renewal_failed"

    const ctaLabel =
        alert.type === "renewal_success"
            ? "View billing"
            : isUrgent
              ? "Renew subscription"
              : "Renewal options"

    const drawerTitle =
        alert.type === "renewal_success"
            ? "Subscription active"
            : "Renew your subscription"

    const drawerDescription =
        alert.type === "renewal_success"
            ? "Manage plans, payment methods, and invoices from billing settings."
            : "Pick how you want to pay or review your invoice. You can change plans anytime in billing."

    return (
        <>
            <div
                ref={bannerRef}
                role="alert"
                className={cn(
                    "mb-6 flex flex-col gap-4 rounded-3xl border px-4 py-4 shadow-lg backdrop-blur-sm sm:flex-row sm:items-center sm:justify-between sm:gap-6",
                    // Mobile: pin below status bar so renewal notice stays visible while scrolling
                    "max-md:fixed max-md:inset-x-0 max-md:top-0 max-md:z-[45] max-md:mb-0 max-md:rounded-none max-md:border-x-0 max-md:border-t-0 max-md:rounded-b-3xl max-md:px-4 max-md:py-3 max-md:pt-[max(0.75rem,env(safe-area-inset-top))] max-md:shadow-xl",
                    "md:relative md:mb-6",
                    isUrgent
                        ? "border-amber-500/40 bg-amber-500/10 dark:bg-amber-500/15"
                        : "border-brand-gold/30 bg-brand-gold/5 dark:bg-brand-gold/10"
                )}
            >
                <div className="flex min-w-0 flex-1 gap-3">
                    <AlertTriangle
                        className={cn(
                            "mt-0.5 h-5 w-5 shrink-0",
                            isUrgent
                                ? "text-amber-600 dark:text-amber-400"
                                : "text-brand-gold-600 dark:text-brand-gold-400"
                        )}
                        aria-hidden
                    />
                    <p className="text-sm font-medium leading-snug text-brand-deep dark:text-brand-cream">
                        {alert.message}
                    </p>
                </div>
                <Button
                    type="button"
                    variant="base"
                    className={cn(
                        "h-11 shrink-0 rounded-2xl px-5 font-semibold transition-all duration-300 sm:min-w-44",
                        isUrgent &&
                            "border-amber-500/25 bg-amber-500/15 text-brand-deep hover:bg-amber-500/25 dark:border-amber-400/30 dark:bg-amber-500/20 dark:text-brand-cream dark:hover:bg-amber-500/30"
                    )}
                    onClick={() => setDrawerOpen(true)}
                >
                    {ctaLabel}
                </Button>
            </div>

            <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
                <DrawerContent className="mx-auto flex max-h-[92vh] max-w-2xl flex-col rounded-t-[32px] border border-brand-deep/5 bg-brand-cream shadow-2xl dark:border-white/10 dark:bg-brand-deep-900">
                    <div className="pointer-events-none absolute left-0 right-0 top-0 h-px bg-linear-to-r from-transparent via-brand-gold/40 to-transparent" />
                    <DrawerStickyHeader className="border-b border-brand-deep/5 pb-4 dark:border-white/5">
                        <div className="w-full space-y-2 pr-10 text-center">
                            <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-brand-deep/35 dark:text-brand-cream/35">
                                Subscription
                            </p>
                            <DrawerTitle className="text-2xl font-serif font-medium tracking-tight text-brand-deep dark:text-brand-cream">
                                {drawerTitle}
                            </DrawerTitle>
                            <DrawerDescription className="mx-auto max-w-md text-sm leading-relaxed text-brand-deep/55 dark:text-brand-cream/55">
                                {drawerDescription}
                            </DrawerDescription>
                        </div>
                    </DrawerStickyHeader>

                    <DrawerBody className="space-y-3 px-6 pb-8 pt-4 md:px-8">
                        {alert.type === "renewal_success" ? (
                            <RenewalOptionRow
                                href={BILLING_HREF}
                                icon={CreditCard}
                                title="Billing & plans"
                                description="View your plan, usage, and next renewal date."
                            />
                        ) : (
                            <>
                                <RenewalOptionRow
                                    href={BILLING_HREF}
                                    icon={CreditCard}
                                    title="Billing & plans"
                                    description="Compare plans, update payment method, and manage renewal preferences."
                                />
                                {showPaymentPaths ? (
                                    <>
                                        <RenewalOptionRow
                                            href={PLANS_HREF}
                                            icon={Wallet}
                                            title="Pay from wallet"
                                            description="Use your business wallet balance if you have a transaction PIN set."
                                        />
                                        <RenewalOptionRow
                                            href={PLANS_HREF}
                                            icon={CreditCard}
                                            title="Pay with card or bank"
                                            description="Checkout securely with our payment partner."
                                        />
                                    </>
                                ) : null}
                                {alert.invoiceUrl ? (
                                    <RenewalOptionRow
                                        href={alert.invoiceUrl}
                                        external
                                        icon={FileText}
                                        title="Download invoice PDF"
                                        description="Open the generated invoice in a new tab."
                                    />
                                ) : null}
                            </>
                        )}
                    </DrawerBody>
                </DrawerContent>
            </Drawer>
        </>
    )
}
