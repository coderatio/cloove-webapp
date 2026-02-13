"use client"

import { useBusiness } from '@/app/components/BusinessProvider'
import { useStores } from '@/app/domains/stores/providers/StoreProvider'
import { ALL_STORES_ID } from '@/app/domains/stores/data/storesMocks'
import { useMediaQuery } from '@/app/hooks/useMediaQuery'
import { PageTransition } from "@/app/components/layout/page-transition"
import { motion } from "framer-motion"
import { DashboardHero } from "@/app/components/dashboard/DashboardHero"
import { InsightWhisper } from "@/app/components/dashboard/InsightWhisper"
import { ActionRow } from "@/app/components/dashboard/ActionRow"
import { ActivityStream } from "@/app/components/dashboard/ActivityStream"
import { useState, useEffect } from 'react'
import { DateRange } from 'react-day-picker'
import { subDays } from 'date-fns'
import { DateRangeFilter } from '@/app/components/dashboard/DateRangeFilter'
import { DashboardSkeleton } from '@/app/components/dashboard/DashboardSkeleton'
import { InventoryPulse } from '@/app/components/dashboard/InventoryPulse'
import { SalesVelocity } from '@/app/components/dashboard/SalesVelocity'
import { storeData, businessData, velocityData } from '../data/dashboardMocks'

export function DashboardView() {
    const { ownerName, businessName, activeBusiness } = useBusiness()
    const { currentStore } = useStores()
    const isDesktop = useMediaQuery("(min-width: 768px)")
    const [date, setDate] = useState<DateRange | undefined>({
        from: subDays(new Date(), 7),
        to: new Date(),
    })
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        setIsLoading(true)
        const timer = setTimeout(() => {
            setIsLoading(false)
        }, 1500)
        return () => clearTimeout(timer)
    }, [currentStore.id, activeBusiness?.id, date])

    // Aggregate or Filter Data
    const isAll = currentStore.id === ALL_STORES_ID

    const displaySales = isAll
        ? {
            value: "₦1,350,000",
            trend: "+12% vs last week",
            trendDirection: "up",
            label: "Total Sales (All Stores)"
        }
        : storeData[currentStore.id]?.sales || { value: "₦0", trend: "0%", trendDirection: "up", label: "Total Sales" }

    const displayActions = isAll
        ? [
            ...storeData['1'].actions.map((a: any) => ({ ...a, icon: a.icon })),
            ...storeData['2'].actions.map((a: any) => ({ ...a, icon: a.icon })),
            ...(storeData['3']?.actions || []).map((a: any) => ({ ...a, icon: a.icon }))
        ].slice(0, 4) // Simplified aggregation for display
        : storeData[currentStore.id]?.actions || []

    const displayActivities = isAll
        ? Object.values(storeData).flatMap(s => s.activities)
        : storeData[currentStore.id]?.activities || []

    const displayInsight = isAll
        ? businessData.insight
        : storeData[currentStore.id]?.insight || "No specific insights for this store yet."

    if (isLoading) {
        return <DashboardSkeleton />
    }

    return (
        <PageTransition>
            <div className="max-w-5xl mx-auto space-y-8 pb-20">

                {/* Header - Simple & Clean */}
                <header className="pt-1">
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex flex-row items-center md:items-end justify-between gap-4"
                    >
                        <div>
                            <p className="text-[10px] md:text-sm text-brand-accent/80 dark:text-brand-cream/80 font-medium mb-0 md:mb-1 capitalize">
                                {isDesktop ? 'Good afternoon,' : 'Welcome,'}
                            </p>
                            <h1 className="font-serif text-2xl md:text-4xl text-brand-deep dark:text-brand-cream">
                                {ownerName}
                            </h1>
                        </div>

                        {/* Date Filter & Business Badge */}
                        <div className="flex flex-col items-end gap-2 md:gap-3">
                            <div className="hidden md:flex flex-col items-end">
                                <span className="text-[10px] font-bold uppercase tracking-widest text-brand-accent/40 dark:text-brand-cream/40 mb-1">Current Business</span>
                                <div className="px-3 py-1 rounded-full bg-brand-green/5 dark:bg-brand-gold/10 border border-brand-green/10 dark:border-brand-gold/10">
                                    <span className="text-xs font-semibold text-brand-green dark:text-brand-gold">{businessName}</span>
                                </div>
                            </div>
                            <DateRangeFilter date={date} setDate={setDate} />
                        </div>
                    </motion.div>
                </header>

                {/* Hero Section - The "Pulse" */}
                <section>
                    <DashboardHero
                        sales={displaySales}
                        wallet={businessData.wallet}
                    />
                </section>

                {/* Insight Whisper - The "Intelligence" */}
                <section>
                    <InsightWhisper
                        insight={displayInsight}
                        actionLabel="View Report"
                        actionLink="/assistant"
                    />
                </section>

                {/* Widgets Grid */}
                <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <SalesVelocity
                        data={velocityData}
                        total="₦1,350,000"
                        trend="+12% growth"
                    />
                    <InventoryPulse
                        totalItems={450}
                        lowStockItems={isAll ? 12 : 3}
                    />
                </section>

                {/* Quick Actions - The "Control" */}
                {displayActions.length > 0 && (
                    <section>
                        <h3 className="font-serif text-lg text-brand-deep dark:text-brand-cream mb-4 px-2">Needs Attention</h3>
                        <ActionRow items={displayActions} />
                    </section>
                )}

                {/* Activity Stream - The "Truth" */}
                <section>
                    <ActivityStream activities={displayActivities} />
                </section>

            </div>
        </PageTransition>
    )
}
