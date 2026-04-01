"use client"

import { TrendingUp, TrendingDown, Wallet, Plus, Send, Sparkles } from "lucide-react"
import { cn } from "@/app/lib/utils"
import { useState, useEffect, useMemo } from "react"
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

export function DashboardHero({ sales, wallet, className }: DashboardHeroProps) {
    const [isAddMoneyOpen, setIsAddMoneyOpen] = useState(false)
    const [isWithdrawOpen, setIsWithdrawOpen] = useState(false)
    const [isWalletVerified, setIsWalletVerified] = useState(wallet?.isVerified ?? true)
    const router = useRouter()

    useEffect(() => {
        setIsWalletVerified(wallet?.isVerified ?? true)
    }, [wallet?.isVerified])

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

    return (
        <GlassCard
            className={cn(
                "rounded-[32px] md:rounded-[40px] p-6 md:px-10 md:py-10 relative overflow-hidden border-white/20 dark:border-white/5",
                "min-h-[320px] md:min-h-[280px]",
                className
            )}
        >
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

            <div className="relative z-10 flex flex-col md:flex-row md:items-stretch gap-8 md:gap-10 md:min-h-[200px]">
                {wallet && (
                    <>
                        <div className="flex-1 flex flex-col items-center md:items-start justify-center text-center md:text-left">
                            <span className="text-[10px] md:text-xs font-bold tracking-[0.2em] uppercase text-brand-accent/40 dark:text-brand-cream/40 mb-3 flex items-center gap-2">
                                <Wallet className="w-3 h-3" />
                                {walletData.label}
                            </span>
                            {walletData.isVerified ? (
                                <>
                                    <h2 className="font-serif text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-medium text-brand-deep dark:text-brand-cream tracking-tighter mb-4 select-all">
                                        <CurrencyText value={walletData.balance} />
                                    </h2>
                                    <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 md:gap-3 justify-center md:justify-start">
                                        <Button
                                            onClick={() => setIsAddMoneyOpen(true)}
                                            className="rounded-full bg-brand-deep dark:bg-brand-gold text-brand-gold dark:text-brand-deep h-9 md:h-10 px-5 md:px-8 shadow-lg font-bold text-xs md:text-sm transition-transform hover:scale-[1.02] active:scale-95"
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
                                <div className="flex flex-col items-center md:items-start max-w-xs">
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

                        <div className="hidden md:block w-px bg-brand-deep/10 dark:bg-white/10 shrink-0" aria-hidden />
                    </>
                )}

                <div
                    className={cn(
                        "flex-1 flex flex-col justify-center relative",
                        wallet
                            ? "items-center md:items-end text-center md:text-right"
                            : "items-center text-center"
                    )}
                >
                    {sparklineData.length > 0 && (
                        <div className="absolute inset-0 opacity-20 pointer-events-none overflow-hidden rounded-lg">
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
                    <h2 className="font-serif text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-medium text-brand-deep dark:text-brand-cream tracking-tighter mb-2 relative z-10">
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
            </div>

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
        </GlassCard>
    )
}
