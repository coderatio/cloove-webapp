"use client"

import React from "react"
import { motion } from "framer-motion"
import { useFieldAgentStats } from "@/app/domains/field-agent/hooks/useFieldAgentStats"
import { useFieldAgentBusinesses } from "@/app/domains/field-agent/hooks/useFieldAgentBusinesses"
import { useFieldAgentWallet } from "@/app/domains/field-agent/hooks/useFieldAgentWallet"
import { formatCurrency, formatDate } from "@/app/lib/formatters"
import { AgentStatCard } from "./AgentStatCard"
import { cn } from "@/app/lib/utils"
import {
    Users,
    TrendingUp,
    Wallet,
    ArrowUpRight,
    Building2,
    CheckCircle2,
    Clock,
    UserPlus,
    Sparkles
} from "lucide-react"
import { GlassCard } from "@/app/components/ui/glass-card"
import { Button } from "@/app/components/ui/button"
import Link from "next/link"
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer
} from "recharts"

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/app/components/ui/select"
import { useTheme } from "next-themes"

export function DashboardView() {
    const { data: stats, isLoading: isLoadingStats } = useFieldAgentStats()
    const { data: businesses = [], isLoading: isLoadingBusinesses } = useFieldAgentBusinesses()
    const { data: wallet } = useFieldAgentWallet()
    const isLoading = isLoadingStats || isLoadingBusinesses
    const currency = wallet?.currency ?? 'NGN'
    const { resolvedTheme } = useTheme()
    const isDark = resolvedTheme === "dark"
    const axisTickColor = isDark ? "rgba(255,255,255,0.3)" : "rgba(10,61,49,0.3)"
    const gridColor = isDark ? "rgba(255,255,255,0.04)" : "rgba(10,61,49,0.03)"

    if (isLoading) {
        return <div className="animate-pulse space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[1, 2, 3].map(i => <div key={i} className="h-44 bg-brand-deep/5 dark:bg-white/5 rounded-[32px] border border-brand-deep/5 dark:border-white/5" />)}
            </div>
            <div className="h-[450px] bg-brand-deep/5 dark:bg-white/5 rounded-[40px] border border-brand-deep/5 dark:border-white/5" />
        </div>
    }

    const fmt = (val: number) => formatCurrency(val, { currency })

    // Compute month-over-month trend for earnings (current vs previous month)
    const earningsTrend = (() => {
        const monthly = stats?.monthlyEarnings ?? []
        if (monthly.length < 2) return undefined
        const current = monthly[monthly.length - 1].amount
        const previous = monthly[monthly.length - 2].amount
        if (previous === 0) return current > 0 ? { value: 100, isPositive: true } : undefined
        const pct = Math.abs(((current - previous) / previous) * 100)
        return { value: Math.round(pct * 10) / 10, isPositive: current >= previous }
    })()

    return (
        <div className="space-y-10 pb-20">
            {/* Command Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 px-2">
                <div>
                    <p className="text-[10px] font-black tracking-[0.4em] uppercase text-brand-gold mb-2">Agent Dashboard</p>
                    <h1 className="text-4xl md:text-5xl font-serif font-medium text-brand-deep dark:text-brand-cream leading-tight">Merchant Overview</h1>
                </div>
                <div className="hidden sm:flex items-center gap-3 bg-brand-deep/3 dark:bg-white/5 p-1.5 rounded-2xl border border-brand-deep/5 dark:border-white/5 backdrop-blur-xl">
                    <div className="px-4 py-2 bg-white dark:bg-white/5 rounded-xl shadow-sm border border-brand-deep/5 dark:border-white/5">
                        <p className="text-[10px] font-black text-brand-deep/30 dark:text-brand-cream/30 uppercase tracking-widest mb-0.5">System Status</p>
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                            <span className="text-xs font-bold text-brand-deep dark:text-brand-cream">Operational</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Elite Stats Cluster */}
            <div className="flex gap-4 overflow-x-auto py-3 lg:grid lg:grid-cols-3 lg:overflow-visible lg:pb-0 scrollbar-none">
                <div className="min-w-[300px] lg:min-w-0 shrink-0 lg:shrink">
                    <AgentStatCard
                        title="Gross Commissions"
                        value={fmt(stats?.totalEarned ?? 0)}
                        icon={TrendingUp}
                        trend={earningsTrend}
                    />
                </div>
                <div className="min-w-[300px] lg:min-w-0 shrink-0 lg:shrink">
                    <AgentStatCard
                        title="Activated Portfolio"
                        value={stats?.activeMerchants ?? 0}
                        icon={Building2}
                    />
                </div>
                <div className="min-w-[300px] lg:min-w-0 shrink-0 lg:shrink">
                    <AgentStatCard
                        title="Liquidity Reserve"
                        value={fmt(stats?.pendingPayout ?? 0)}
                        icon={Wallet}
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Performance Intelligence */}
                <GlassCard className="lg:col-span-2 p-6 md:p-10 border-none shadow-2xl shadow-brand-deep/5 overflow-hidden group content-visibility-auto contain-intrinsic-size-[0_500px]">
                    <div className="absolute top-0 right-0 w-96 h-96 bg-brand-gold/5 blur-xl -mr-48 -mt-48 transition-opacity opacity-50 group-hover:opacity-100" />

                    <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-12">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <TrendingUp className="w-5 h-5 text-brand-gold" />
                                <h3 className="text-2xl font-serif font-medium text-brand-deep dark:text-brand-cream">Earnings Performance</h3>
                            </div>
                            <p className="text-sm text-brand-deep/40 dark:text-brand-cream/40 font-medium">Your monthly commission earnings and growth.</p>
                        </div>
                        <div className="w-full sm:w-48">
                            <Select defaultValue="6months">
                                <SelectTrigger className="h-12 sm:h-12 bg-brand-deep/3 dark:bg-white/5 border-brand-deep/5 dark:border-white/5 rounded-2xl text-[11px] font-black uppercase tracking-widest">
                                    <SelectValue placeholder="Timeframe" />
                                </SelectTrigger>
                                <SelectContent className="rounded-2xl border-brand-deep/5 shadow-2xl">
                                    <SelectItem value="6months" className="rounded-xl my-1 focus:bg-brand-gold/10">Past 6 Cycles</SelectItem>
                                    <SelectItem value="year" className="rounded-xl my-1 focus:bg-brand-gold/10">Annual Review</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="h-[350px] w-full relative">
                        {(!stats?.monthlyEarnings || stats.monthlyEarnings.length === 0 || stats.monthlyEarnings.every(e => e.amount === 0)) ? (
                            <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center bg-brand-deep/2 dark:bg-white/2 rounded-[32px] border border-dashed border-brand-deep/10 dark:border-white/10">
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="w-16 h-16 bg-brand-gold/10 rounded-full flex items-center justify-center mb-6"
                                >
                                    <TrendingUp className="w-8 h-8 text-brand-gold/40" />
                                </motion.div>
                                <h4 className="text-xl font-serif font-medium text-brand-deep/60 dark:text-brand-cream/60 mb-2">Awaiting Performance Data</h4>
                                <p className="text-sm text-brand-deep/30 dark:text-brand-cream/30 max-w-sm mx-auto font-medium leading-relaxed">
                                    Your monthly yield metrics will appear here once your merchants begin processing transactions.
                                </p>
                            </div>
                        ) : (
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={stats?.monthlyEarnings ?? []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="colorEarnings" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#d4af37" stopOpacity={0.4} />
                                            <stop offset="95%" stopColor="#d4af37" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="8 8" vertical={false} stroke={gridColor} />
                                    <XAxis
                                        dataKey="month"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fontSize: 10, fill: axisTickColor, fontWeight: 900 }}
                                        dy={10}
                                    />
                                    <YAxis
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fontSize: 11, fill: axisTickColor, fontWeight: 700, fontFamily: "serif" }}
                                        tickFormatter={(val) => formatCurrency(val, { currency, notation: 'compact' })}
                                    />
                                    <Tooltip
                                        cursor={{ stroke: '#d4af37', strokeWidth: 1, strokeDasharray: '4 4' }}
                                        content={({ active, payload }) => {
                                            if (active && payload && payload.length) {
                                                return (
                                                    <div className="bg-brand-deep text-white p-4 rounded-2xl shadow-2xl border border-white/10 backdrop-blur-xl">
                                                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 mb-1">{payload[0].payload.month}</p>
                                                        <p className="text-xl font-serif text-brand-gold">{fmt(payload[0].value as number)}</p>
                                                        <div className="mt-2 flex items-center gap-2">
                                                            <Sparkles className="w-3 h-3 text-brand-gold animate-pulse" />
                                                            <span className="text-[10px] font-bold uppercase text-white/30 tracking-wider">Acquisition Peak</span>
                                                        </div>
                                                    </div>
                                                )
                                            }
                                            return null
                                        }}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="amount"
                                        stroke="#d4af37"
                                        strokeWidth={4}
                                        fillOpacity={1}
                                        fill="url(#colorEarnings)"
                                        animationDuration={2000}
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                </GlassCard>

                {/* Recent Activity */}
                <GlassCard className="p-6 md:p-8 border-none shadow-2xl shadow-brand-deep/5 flex flex-col content-visibility-auto contain-intrinsic-size-[0_450px]">
                    <div className="flex items-center justify-between mb-10 px-1">
                        <h3 className="text-2xl font-serif font-medium text-brand-deep dark:text-brand-cream">Recent Activity</h3>
                        <div className="p-2 bg-brand-deep/5 dark:bg-white/5 rounded-xl">
                            <Clock className="w-4 h-4 text-brand-deep/30 dark:text-brand-cream/30" />
                        </div>
                    </div>

                    <div className="space-y-4 flex-1 relative min-h-[300px]">
                        {businesses.length === 0 ? (
                            <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-brand-deep/2 dark:bg-white/2 rounded-[32px] border border-dashed border-brand-deep/10 dark:border-white/10">
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="w-14 h-14 bg-brand-gold/10 rounded-full flex items-center justify-center mb-6"
                                >
                                    <Building2 className="w-7 h-7 text-brand-gold/40" />
                                </motion.div>
                                <h4 className="text-xl font-serif font-medium text-brand-deep/60 dark:text-brand-cream/60 mb-2">Awaiting Your First Merchant</h4>
                                <p className="text-[11px] text-brand-deep/30 dark:text-brand-cream/30 max-w-[200px] mx-auto font-medium leading-relaxed">
                                    Your portfolio's activity will be tracked here once you onboard your first business.
                                </p>
                            </div>
                        ) : (
                            businesses.slice(0, 4).map((biz) => (
                                <div key={biz.id} className="group relative flex items-center gap-4 p-4 rounded-2xl border border-transparent hover:border-brand-deep/5 hover:bg-brand-deep/2 hover:shadow-lg transition-all active:scale-[0.98]">
                                    <div className={cn(
                                        "w-12 h-12 rounded-xl flex items-center justify-center transition-all group-hover:scale-110 shadow-lg shadow-black/5",
                                        biz.status === 'active' ? "bg-green-500/10 text-green-600" : "bg-brand-gold/10 text-brand-gold"
                                    )}>
                                        {biz.status === 'active' ? <CheckCircle2 className="w-5 h-5" /> : <Clock className="w-5 h-5" />}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-bold text-brand-deep dark:text-brand-cream truncate group-hover:text-brand-gold transition-colors">{biz.name}</p>
                                        <p className="text-[10px] text-brand-deep/30 dark:text-brand-cream/30 uppercase tracking-widest font-black mt-0.5 whitespace-nowrap">
                                            {formatDate(biz.onboardedAt, 'd MMM, h:mm a')}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-serif font-medium text-brand-deep dark:text-brand-cream">{fmt(biz.earnings)}</p>
                                        <div className="flex items-center justify-end gap-1 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <div className="w-1 h-1 rounded-full bg-brand-gold" />
                                            <span className="text-[9px] font-black uppercase text-brand-gold">Yield</span>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {businesses.length > 0 && (
                        <Button variant="outline" className="w-full mt-10 rounded-2xl h-14 border-brand-deep/5 dark:border-white/10 bg-white dark:bg-white/5 hover:bg-brand-deep/5 dark:hover:bg-white/10 transition-all font-bold text-brand-deep/60 dark:text-brand-cream/60 group shadow-sm active:translate-y-1" asChild>
                            <Link href="/field/businesses">
                                {businesses.length < 4 ? "View Portfolio Details" : "Review All Merchants"}
                                <ArrowUpRight className="w-5 h-5 ml-2 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                            </Link>
                        </Button>
                    )}
                </GlassCard>
            </div>

            {/* Strategic Intervention: CTA */}
            <div className="relative group overflow-hidden rounded-[40px] shadow-2xl shadow-brand-deep/10">
                <div className="absolute inset-0 bg-brand-deep" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_50%,rgba(212,175,55,0.15),transparent)] opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />

                <div className="relative p-8 md:p-14 flex flex-col lg:flex-row items-center justify-between gap-12">
                    <div className="max-w-2xl text-center lg:text-left">
                        <div className="inline-flex items-center gap-3 px-4 py-2 bg-brand-gold/10 rounded-full border border-brand-gold/20 mb-6">
                            <Sparkles className="w-4 h-4 text-brand-gold animate-pulse" />
                            <span className="text-[10px] font-black uppercase text-brand-gold tracking-[0.2em]">Daily Goal</span>
                        </div>
                        <h2 className="text-3xl md:text-5xl font-serif font-medium text-white mb-6 leading-tight">Onboard a New <span className="text-brand-gold">Merchant</span></h2>
                        <p className="text-brand-cream/40 text-lg font-medium leading-relaxed max-w-xl mx-auto lg:mx-0">
                            Grow the Cloove ecosystem by adding high-quality merchants. Earn commissions for every successful activation.
                        </p>
                    </div>

                    <Button
                        size="lg"
                        className="shrink-0 w-full sm:w-auto bg-brand-gold text-brand-deep hover:bg-white hover:scale-105 rounded-[24px] px-8 md:px-14 h-16 md:h-20 text-sm md:text-lg font-black uppercase tracking-[0.2em] shadow-[0_20px_50px_rgba(212,175,55,0.3)] transition-all flex items-center justify-center"
                        asChild
                    >
                        <Link href="/field/onboard">
                            <UserPlus className="w-5 h-5 md:w-6 md:h-6 mr-3 md:mr-4" />
                            Start Onboarding
                        </Link>
                    </Button>
                </div>

                {/* Decorative Elements */}
                <div className="absolute bottom-0 right-0 w-64 h-64 border-r-4 border-b-4 border-brand-gold/10 rounded-br-[40px] pointer-events-none" />
                <div className="absolute top-0 left-0 w-32 h-32 border-l-4 border-t-4 border-brand-gold/10 rounded-tl-[40px] pointer-events-none" />
            </div>
        </div>
    )
}
