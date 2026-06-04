"use client"

import { useBusiness, type Business } from "@/app/components/BusinessProvider"
import { useAuth } from "@/app/components/providers/auth-provider"
import { useRouter, useSearchParams } from "next/navigation"
import { HugeiconsIcon } from "@hugeicons/react"
import { LayoutGridIcon as LayoutGrid, ArrowRight01Icon as ArrowRight, Logout01Icon as LogOut, LockIcon as Lock, SparklesIcon as Sparkles } from "@hugeicons/core-free-icons"
import { cn } from "@/app/lib/utils"
import { GlassCard } from "@/app/components/ui/glass-card"
import { Button } from "@/app/components/ui/button"
import { Suspense } from "react"
import Image from "next/image"

function SelectBusinessContent() {
    const {
        businesses,
        setActiveBusiness,
        activeBusiness,
        isLoading,
        isRefreshing,
        refreshBusinesses,
        businessesLoadFailed,
        isMultiBusinessRestricted,
        primaryBusinessId,
        isBusinessSelectable,
    } = useBusiness()
    const { logout } = useAuth()
    const router = useRouter()
    const searchParams = useSearchParams()
    const callbackUrl = searchParams.get('callbackUrl') || '/'

    const primaryBusiness = businesses.find((b) => b.id === primaryBusinessId) ?? businesses[0] ?? null

    const handleSelect = (business: Business) => {
        if (!isBusinessSelectable(business)) return
        setActiveBusiness(business)
        router.push(callbackUrl)
    }

    if (isLoading) return null

    return (
        <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-background p-6 sm:p-10">
            <div className="relative z-10 w-full max-w-xl space-y-8">
                <div className="space-y-3 text-center">
                    <div className="relative mx-auto mb-5 h-14 w-14 overflow-hidden rounded-2xl border border-border bg-primary p-3">
                        <Image
                            src="/images/logo-white.png"
                            alt="Cloove"
                            fill
                            className="object-contain p-4"
                        />
                    </div>

                    <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
                        Welcome back
                    </h1>
                    <p className="mx-auto max-w-md text-base text-muted-foreground">
                        Select a business to continue to your dashboard.
                    </p>
                </div>

                {/* Plan restriction banner */}
                {isMultiBusinessRestricted && (
                    <div className="flex items-start gap-3 rounded-2xl border border-amber-500/20 bg-amber-500/10 p-4 text-amber-700 dark:text-amber-400">
                        <HugeiconsIcon icon={Lock} className="h-4 w-4 shrink-0 mt-0.5" />
                        <div className="space-y-1 min-w-0">
                            <p className="text-sm font-bold">Multiple businesses require a paid plan</p>
                            <p className="text-xs opacity-80 leading-relaxed">
                                Your current plan only allows access to one business. Select your primary business below, or{" "}
                                <button
                                    onClick={() => {
                                        if (primaryBusiness) {
                                            setActiveBusiness(primaryBusiness, { quiet: true })
                                        }
                                        router.push('/settings?tab=billing')
                                    }}
                                    className="underline font-semibold hover:opacity-100"
                                >
                                    upgrade your plan
                                </button>{" "}
                                to access all your businesses.
                            </p>
                        </div>
                    </div>
                )}

                <div className="grid gap-6">
                    {businesses.length === 0 && businessesLoadFailed ? (
                        <GlassCard className="space-y-5 rounded-[28px] border-border bg-card p-6 text-center shadow-sm sm:p-8">
                            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/10">
                                <HugeiconsIcon icon={LayoutGrid} className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                            </div>
                            <div className="space-y-2">
                                <h3 className="text-xl font-semibold text-foreground">Couldn&apos;t load businesses</h3>
                                <p className="mx-auto max-w-sm text-sm leading-relaxed text-muted-foreground">
                                    The server may be busy or limiting requests. Your session is still active — try again in a few seconds.
                                </p>
                            </div>
                            <Button
                                type="button"
                                disabled={isRefreshing}
                                onClick={() => void refreshBusinesses()}
                                className="h-12 rounded-2xl bg-primary px-8 font-semibold text-white hover:bg-primary/92 hover:text-white disabled:opacity-60"
                            >
                                {isRefreshing ? 'Retrying…' : 'Try again'}
                            </Button>
                        </GlassCard>
                    ) : businesses.length === 0 ? (
                        <GlassCard className="space-y-5 rounded-[28px] border-border bg-card p-6 text-center shadow-sm sm:p-8">
                            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10">
                                <HugeiconsIcon icon={LayoutGrid} className="h-6 w-6 text-primary" />
                            </div>
                            <div className="space-y-2">
                                <h3 className="text-xl font-semibold text-foreground">No businesses found</h3>
                                <p className="text-sm text-muted-foreground">It looks like you haven&apos;t created any businesses yet.</p>
                            </div>
                            <Button
                                onClick={() => router.push('/onboarding')}
                                className="h-12 rounded-2xl bg-primary px-8 font-semibold text-white hover:bg-primary/92 hover:text-white"
                            >
                                Create your first Business
                            </Button>
                        </GlassCard>
                    ) : (
                        businesses.map((business: Business) => {
                            const locked = !isBusinessSelectable(business)
                            return (
                                <div key={business.id}>
                                    <button
                                        onClick={() => handleSelect(business)}
                                        disabled={locked}
                                        className={cn(
                                            "group w-full block text-left outline-none",
                                            locked ? "cursor-not-allowed" : "cursor-pointer"
                                        )}
                                    >
                                        <GlassCard className={cn(
                                            "flex items-center gap-4 rounded-[24px] border-border bg-card p-4 sm:gap-5 sm:p-5",
                                            !locked && "group-hover:bg-muted/50",
                                            locked && "opacity-50 grayscale",
                                            activeBusiness?.id === business.id && "border-primary/25 bg-primary/8 ring-1 ring-primary/10"
                                        )}>
                                            <div className={cn(
                                                "h-12 w-12 sm:h-16 sm:w-16 shrink-0 rounded-2xl sm:rounded-3xl flex items-center justify-center shadow-inner border border-white/5",
                                                locked
                                                    ? "bg-white/5"
                                                    : "bg-primary/10 text-primary"
                                            )}>
                                                {locked
                                                    ? <HugeiconsIcon icon={Lock} className="h-5 w-5 sm:h-6 sm:w-6 text-white/30" />
                                                    : <HugeiconsIcon icon={LayoutGrid} className="h-6 w-6 sm:h-8 sm:w-8" />
                                                }
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h3 className={cn(
                                                    "truncate text-base font-semibold sm:text-lg",
                                                    locked
                                                        ? "text-muted-foreground"
                                                        : "text-foreground"
                                                )}>
                                                    {business.name}
                                                </h3>
                                                <p className={cn(
                                                    "font-medium uppercase tracking-widest text-[10px] mt-1 truncate",
                                                    locked ? "text-muted-foreground/50" : "text-muted-foreground"
                                                )}>
                                                    {locked ? "Upgrade required" : `Managed Business • ${business.currency}`}
                                                </p>
                                            </div>
                                            <div className={cn(
                                                "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border sm:h-10 sm:w-10",
                                                locked
                                                    ? "border-border text-muted-foreground/40"
                                                    : "border-primary/20 text-primary"
                                            )}>
                                                {locked
                                                    ? <HugeiconsIcon icon={Sparkles} className="h-4 w-4" />
                                                    : <HugeiconsIcon icon={ArrowRight} className="h-4 w-4 sm:h-5 sm:w-5" />
                                                }
                                            </div>
                                        </GlassCard>
                                    </button>
                                </div>
                            )
                        })
                    )}
                </div>

                <div className="flex justify-center pt-8">
                    <button
                        onClick={() => logout()}
                        className="flex items-center gap-2 text-sm font-bold text-red-500/60 dark:text-red-400 hover:text-red-500 transition-colors uppercase tracking-widest"
                    >
                        <HugeiconsIcon icon={LogOut} className="h-4 w-4" />
                        Sign Out
                    </button>
                </div>
            </div>
        </div>
    )
}

export function SelectBusinessView() {
    return (
        <Suspense fallback={null}>
            <SelectBusinessContent />
        </Suspense>
    )
}
