"use client"

import { TrendingUp, TrendingDown, Wallet, Plus, Send, Sparkles } from "lucide-react"
import { cn } from "@/app/lib/utils"
import { useState, useEffect, useLayoutEffect, useMemo, useRef, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/app/components/ui/button"
import { GlassCard } from "../ui/glass-card"
import { AddFundsDrawer } from "@/app/components/shared/AddFundsDrawer"
import { WithdrawDrawer } from "@/app/domains/finance/components/WithdrawDrawer"
import { useBusiness } from "@/app/components/BusinessProvider"
import { Area, AreaChart, ResponsiveContainer } from "recharts"
import { CurrencyText } from "@/app/components/shared/CurrencyText"

interface DashboardHeroProps {
    sales: {
        value: string
        trend: string
        trendDirection: "up" | "down"
        label: string
        storeName?: string
        periodLabel?: string
        history?: { value: number }[]
    }
    wallet?: {
        balance: string
        isVerified: boolean
        label?: string
    }
    className?: string
}

/** Shared calm-glass backdrop: orbs, veil, and noise — matches single-card hero styling. */
function DashboardHeroBackground() {
    return (
        <>
            <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
                <div className="absolute -top-1/4 -right-1/4 w-[70%] h-[70%] rounded-full bg-brand-gold/10 dark:bg-brand-gold/5 blur-3xl" />
                <div className="absolute -bottom-1/4 -left-1/4 w-[60%] h-[60%] rounded-full bg-brand-green/12 dark:bg-brand-green/8 blur-3xl" />
                <div className="absolute inset-0 bg-brand-deep/5 dark:bg-black/20" />
            </div>
            <div
                className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05] pointer-events-none z-1"
                style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
                }}
            />
        </>
    )
}

/** Base glass shell — no min-height here; desktop / mobile carousels set height separately. */
const heroCardSurfaceClass = cn(
    "rounded-[32px] md:rounded-[40px] relative overflow-hidden border-white/20 dark:border-white/5"
)

export function DashboardHero({ sales, wallet, className }: DashboardHeroProps) {
    const [isAddMoneyOpen, setIsAddMoneyOpen] = useState(false)
    const [isWithdrawOpen, setIsWithdrawOpen] = useState(false)
    const [mobileSlide, setMobileSlide] = useState(0)
    /** Pixel width of the scrollport — flex % basis is unreliable for horizontal scroll on mobile Safari; slides use this explicitly. */
    const [mobileSlideWidthPx, setMobileSlideWidthPx] = useState(0)
    const mobileScrollerRef = useRef<HTMLDivElement>(null)
    const router = useRouter()

    const isWalletVerified = wallet?.isVerified ?? true

    const { activeBusiness } = useBusiness()
    const currencyCode = activeBusiness?.currency || "NGN"

    const walletData = {
        balance: isWalletVerified ? (wallet?.balance ?? "₦0.00") : "₦0.00",
        isVerified: isWalletVerified,
        label: wallet?.label ?? "Wallet Balance",
    }

    const sparklineData = useMemo(
        () =>
            sales.history?.length ? sales.history : [
                { value: 4000 },
                { value: 3000 },
                { value: 5000 },
                { value: 2780 },
                { value: 1890 },
                { value: 2390 },
                { value: 3490 },
            ],
        [sales.history]
    )

    const mobileSlideCount = wallet ? 2 : 1

    const syncSlideFromScroll = useCallback(() => {
        const el = mobileScrollerRef.current
        if (!el || mobileSlideCount <= 1) return
        const w = el.clientWidth || 1
        const i = Math.round(el.scrollLeft / w)
        setMobileSlide(Math.min(Math.max(0, i), mobileSlideCount - 1))
    }, [mobileSlideCount])

    useLayoutEffect(() => {
        const el = mobileScrollerRef.current
        if (!el || !wallet) return

        const measure = () => {
            const w = Math.round(el.getBoundingClientRect().width)
            if (w > 0) setMobileSlideWidthPx(w)
        }
        measure()

        const ro = new ResizeObserver(() => measure())
        ro.observe(el)
        return () => ro.disconnect()
    }, [wallet])

    useEffect(() => {
        const el = mobileScrollerRef.current
        if (!el) return
        syncSlideFromScroll()
        el.addEventListener("scroll", syncSlideFromScroll, { passive: true })
        window.addEventListener("resize", syncSlideFromScroll)
        return () => {
            el.removeEventListener("scroll", syncSlideFromScroll)
            window.removeEventListener("resize", syncSlideFromScroll)
        }
    }, [syncSlideFromScroll])

    const mobileSlideStyle =
        wallet && mobileSlideWidthPx > 0
            ? ({ width: mobileSlideWidthPx, minWidth: mobileSlideWidthPx, flexShrink: 0 } as const)
            : undefined

    const walletSection = wallet ? (
        <div className="flex flex-col items-center md:items-start justify-center text-center md:text-left md:h-full w-full max-w-md mx-auto md:mx-0 md:max-w-none">
            <span className="text-[10px] md:text-xs font-bold tracking-[0.2em] uppercase text-brand-accent/40 dark:text-brand-cream/40 mb-2 md:mb-3 flex items-center justify-center md:justify-start gap-2">
                <Wallet className="w-3 h-3" />
                {walletData.label}
            </span>
            {walletData.isVerified ? (
                <>
                    <h2 className="font-serif text-3xl md:text-4xl lg:text-5xl font-medium text-brand-deep dark:text-brand-cream tracking-tighter mb-3 md:mb-4 select-all tabular-nums">
                        <CurrencyText value={walletData.balance} />
                    </h2>
                    <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5 md:gap-3 justify-center md:justify-start w-full max-md:justify-center">
                        <Button
                            onClick={() => setIsAddMoneyOpen(true)}
                            className="rounded-full bg-brand-deep dark:bg-brand-gold dark:hover:bg-brand-gold/80 text-brand-gold dark:text-brand-deep h-9 md:h-10 px-5 md:px-8 shadow-lg font-bold text-xs md:text-sm transition-transform hover:scale-[1.02] active:scale-95"
                        >
                            <Plus className="w-3.5 h-3.5 mr-1.5" /> Add Money
                        </Button>
                        <Button
                            variant="outline"
                            onClick={() => setIsWithdrawOpen(true)}
                            className="rounded-full border-brand-deep/10 dark:border-white/10 text-brand-deep/70 dark:text-brand-cream/70 h-9 md:h-10 px-5 md:px-8 backdrop-blur-md font-bold text-xs md:text-sm transition-transform hover:scale-[1.02] active:scale-95"
                        >
                            <Send className="w-3.5 h-3.5 mr-1.5" /> Send
                        </Button>
                    </div>
                </>
            ) : (
                <div className="flex flex-col items-center md:items-start max-w-xs mx-auto md:mx-0">
                    <h2 className="font-serif text-2xl md:text-4xl font-medium text-brand-deep/10 dark:text-brand-cream/10 tracking-tighter mb-4 select-none blur-[6px]">
                        <CurrencyText value="₦***,***" />
                    </h2>
                    <Button
                        onClick={() => router.push("/settings?tab=verification")}
                        className="bg-brand-deep dark:bg-brand-gold text-brand-gold dark:text-brand-deep font-bold px-6 h-11 rounded-2xl shadow-lg flex items-center gap-2 text-sm"
                    >
                        <Sparkles className="w-4 h-4" /> Verify Identity
                    </Button>
                    <p className="mt-3 text-[11px] font-bold uppercase tracking-widest text-brand-deep/40 dark:text-brand-cream/40">
                        Unlock your secure virtual account
                    </p>
                </div>
            )}
        </div>
    ) : null

    const salesSection = (
        <div
            className={cn(
                "flex flex-col justify-center relative w-full max-w-md mx-auto md:max-w-none",
                "min-h-[132px] md:min-h-[200px]",
                wallet ? "items-center md:items-end text-center md:text-right" : "items-center text-center"
            )}
        >
            {sparklineData.length > 0 && (
                <div className="absolute inset-x-0 top-6 bottom-auto h-[100px] md:inset-0 md:top-0 md:h-full opacity-20 pointer-events-none overflow-hidden rounded-lg">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={sparklineData}>
                            <defs>
                                <linearGradient id="heroSalesGrad" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="var(--brand-gold)" stopOpacity={0.4} />
                                    <stop offset="95%" stopColor="var(--brand-gold)" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <Area
                                type="monotone"
                                dataKey="value"
                                stroke="var(--brand-gold)"
                                fill="url(#heroSalesGrad)"
                                strokeWidth={2}
                                isAnimationActive={false}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            )}
            <span
                className={cn(
                    "text-md font-bold tracking-[0.2em] uppercase text-brand-accent/40 dark:text-brand-cream/40 relative z-10 block",
                    sales.storeName ? "mb-1" : "mb-3"
                )}
            >
                {sales.label}
            </span>
            {sales.storeName && (
                <span className="text-md -mt-2 text-brand-accent/35 dark:text-brand-cream/35 mb-3 relative z-10 block">
                    {sales.storeName}
                </span>
            )}
            <h2 className="font-serif text-3xl md:text-4xl lg:text-5xl font-medium text-brand-deep dark:text-brand-cream tracking-tighter mb-1.5 md:mb-2 relative z-10 tabular-nums">
                <CurrencyText value={sales.value} />
            </h2>
            {sales.periodLabel && (
                <p className="text-xs text-brand-accent/50 dark:text-brand-cream/50 mb-3 relative z-10">
                    Period: {sales.periodLabel}
                </p>
            )}
            {sales.trend && sales.trend !== "—" && (
                <div
                    className={cn(
                        "inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold backdrop-blur-md relative z-10",
                        sales.trendDirection === "up"
                            ? "bg-brand-green/10 dark:bg-brand-gold/10 text-brand-green dark:text-brand-gold"
                            : "bg-danger/10 text-danger"
                    )}
                >
                    {sales.trendDirection === "up" ? (
                        <TrendingUp className="w-3.5 h-3.5" />
                    ) : (
                        <TrendingDown className="w-3.5 h-3.5" />
                    )}
                    {sales.trend}
                </div>
            )}
        </div>
    )

    return (
        <>
            {/* Mobile: two swipeable cards (snap), each with the same glass + hero layers */}
            <div className={cn("md:hidden w-full min-w-0", className)}>
                <div
                    ref={mobileScrollerRef}
                    role="region"
                    aria-roledescription="carousel"
                    aria-label="Wallet and sales"
                    className={cn(
                        /* Grid row: columns share one row height (max of the two) — flex+overflow-x often fails to stretch */
                        "grid w-full min-w-0 grid-flow-col grid-rows-1 auto-cols-[100%] items-stretch overflow-x-scroll snap-x snap-mandatory overscroll-x-contain scrollbar-none pb-1",
                        "[-webkit-overflow-scrolling:touch] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                    )}
                >
                    {wallet ? (
                        <div
                            className="box-border flex min-h-0 min-w-0 snap-center snap-always flex-col self-stretch"
                            style={mobileSlideStyle}
                        >
                            <GlassCard
                                className={cn(
                                    heroCardSurfaceClass,
                                    "flex h-full min-h-0 flex-1 flex-col p-5 sm:p-6"
                                )}
                            >
                                <DashboardHeroBackground />
                                <div className="relative z-10 flex min-h-0 flex-1 flex-col justify-center py-0.5">
                                    {walletSection}
                                </div>
                            </GlassCard>
                        </div>
                    ) : null}
                    <div
                        className={cn(
                            "box-border flex min-h-0 min-w-0 snap-center snap-always flex-col self-stretch",
                            wallet ? "" : "w-full"
                        )}
                        style={wallet ? mobileSlideStyle : undefined}
                    >
                        <GlassCard
                            className={cn(
                                heroCardSurfaceClass,
                                "flex h-full min-h-0 flex-1 flex-col p-5 sm:p-6"
                            )}
                        >
                            <DashboardHeroBackground />
                            <div className="relative z-10 flex min-h-0 flex-1 flex-col justify-center py-0.5">
                                {salesSection}
                            </div>
                        </GlassCard>
                    </div>
                </div>
                {wallet && mobileSlideCount > 1 ? (
                    <div
                        className="flex justify-center gap-2 pt-2.5"
                        role="tablist"
                        aria-label="Dashboard cards"
                    >
                        {[0, 1].map((i) => (
                            <Button
                                key={i}
                                type="button"
                                variant="ghost"
                                role="tab"
                                aria-selected={mobileSlide === i}
                                aria-label={i === 0 ? "Wallet balance" : "Total sales"}
                                className={cn(
                                    "h-1.5 min-h-0 min-w-0 rounded-full p-0 transition-all duration-300 hover:bg-transparent",
                                    mobileSlide === i
                                        ? "w-6 bg-brand-deep/50 dark:bg-brand-gold/70"
                                        : "w-1.5 bg-brand-deep/15 dark:bg-white/20 hover:bg-brand-deep/25 dark:hover:bg-white/30"
                                )}
                                onClick={() => {
                                    const el = mobileScrollerRef.current
                                    if (!el) return
                                    const w = el.clientWidth
                                    el.scrollTo({ left: i * w, behavior: "smooth" })
                                }}
                            />
                        ))}
                    </div>
                ) : null}
            </div>

            {/* md+: single combined card */}
            <GlassCard
                className={cn(
                    heroCardSurfaceClass,
                    "hidden md:block min-h-[280px] p-6 md:min-h-[320px] md:px-10 md:py-10",
                    className
                )}
            >
                <DashboardHeroBackground />
                <div className="relative z-10 flex flex-col md:flex-row md:items-stretch gap-8 md:gap-10 md:min-h-[200px]">
                    {wallet && (
                        <>
                            <div className="flex-1 flex flex-col justify-center">{walletSection}</div>
                            <div className="hidden md:block w-px bg-brand-deep/10 dark:bg-white/10 shrink-0" aria-hidden />
                        </>
                    )}
                    <div className="flex-1 flex flex-col justify-center">{salesSection}</div>
                </div>
            </GlassCard>

            {wallet && (
                <>
                    <AddFundsDrawer
                        isOpen={isAddMoneyOpen}
                        onOpenChange={setIsAddMoneyOpen}
                        currencyCode={currencyCode}
                    />
                    <WithdrawDrawer
                        isOpen={isWithdrawOpen}
                        onOpenChange={setIsWithdrawOpen}
                        currencyCode={currencyCode}
                    />
                </>
            )}
        </>
    )
}
