"use client"

import { useBusiness, ALL_STORES_ID } from './components/BusinessProvider'
import { useMediaQuery } from './hooks/useMediaQuery'
import { PageTransition } from "./components/layout/page-transition"
import { motion } from "framer-motion"
import { DashboardHero } from "./components/dashboard/DashboardHero"
import { InsightWhisper } from "./components/dashboard/InsightWhisper"
import { ActionRow } from "./components/dashboard/ActionRow"
import { ActivityStream, ActivityItem } from "./components/dashboard/ActivityStream"
import { Package, Clock, AlertCircle } from "lucide-react"
import { useState, useEffect } from 'react'
import { DateRange } from 'react-day-picker'
import { subDays } from 'date-fns'
import { DateRangeFilter } from './components/dashboard/DateRangeFilter'
import { DashboardSkeleton } from './components/dashboard/DashboardSkeleton'
import { InventoryPulse } from './components/dashboard/InventoryPulse'
import { SalesVelocity } from './components/dashboard/SalesVelocity'

// Mock Data structure per store
const storeData: Record<string, any> = {
  '1': { // Main Store
    sales: { value: "₦850,000", trend: "+15% vs last week", trendDirection: "up", label: "Total Sales (Main Store)" },
    actions: [
      { label: "Pending Orders", count: 2, type: "urgent", href: "/orders", icon: <Clock className="w-4 h-4" /> },
      { label: "Low Stock", count: 1, type: "warning", href: "/inventory", icon: <Package className="w-4 h-4" /> },
    ],
    activities: [
      { id: "s1-1", type: "sale", description: "Rice Bag (50kg)", amount: "₦12,000", timeAgo: "2m ago", customer: "Walk-in", href: "/orders" },
      { id: "s1-2", type: "payment", description: "Debt Payment", amount: "₦5,000", timeAgo: "1h ago", customer: "Johnson", href: "/finance" },
    ],
    insight: "You sold more **rice** this week significantly in Main Store."
  },
  '2': { // Ikeja Branch
    sales: { value: "₦320,000", trend: "+8% vs last week", trendDirection: "up", label: "Total Sales (Ikeja)" },
    actions: [
      { label: "Pending Orders", count: 1, type: "urgent", href: "/orders", icon: <Clock className="w-4 h-4" /> },
      { label: "Low Stock", count: 4, type: "warning", href: "/inventory", icon: <Package className="w-4 h-4" /> },
    ],
    activities: [
      { id: "s2-1", type: "sale", description: "Vegetable Oil", amount: "₦8,500", timeAgo: "15m ago", customer: "Bode", href: "/orders" },
    ],
    insight: "Ikeja branch is seeing a **40% increase** in foot traffic today."
  },
  '3': { // Abuja Store
    sales: { value: "₦180,000", trend: "-5% vs last week", trendDirection: "down", label: "Total Sales (Abuja)" },
    actions: [
      { label: "Overdue Debts", count: 3, type: "urgent", href: "/customers", icon: <AlertCircle className="w-4 h-4" /> },
    ],
    activities: [
      { id: "s3-1", type: "debt", description: "New Debt Recorded", amount: "₦2,500", timeAgo: "3h ago", customer: "Mama Nkechi", href: "/finance" },
    ],
    insight: "Abuja store has **3 unpaid debts** that are over a week old."
  }
}

// Global business-level data
const businessData = {
  wallet: {
    balance: "₦1,250,000.00",
    isVerified: false,
    label: "Wallet Balance"
  },
  insight: "Your overall business performance is **up by 12%**. Consider restocking in Ikeja soon."
}

export default function Dashboard() {
  const { currentStore, ownerName, businessName } = useBusiness()
  const isDesktop = useMediaQuery("(min-width: 768px)")
  const [date, setDate] = useState<DateRange | undefined>({
    from: subDays(new Date(), 7),
    to: new Date(),
  })
  const [isLoading, setIsLoading] = useState(true)

  // Simulate loading state for "Calm" feeling
  useEffect(() => {
    setIsLoading(true)
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 1500) // 1.5s delay to show skeleton
    return () => clearTimeout(timer)
  }, [currentStore.id, date]) // Reload when store varies

  // Aggregate or Filter Data
  const isAll = currentStore.id === ALL_STORES_ID

  const displaySales = isAll
    ? {
      value: "₦1,350,000", // Sum of all
      trend: "+12% vs last week",
      trendDirection: "up",
      label: "Total Sales (All Stores)"
    }
    : storeData[currentStore.id]?.sales || { value: "₦0", trend: "0%", trendDirection: "up", label: "Total Sales" }

  const displayActions = isAll
    ? [
      { label: "Pending Orders", count: 3, type: "urgent", href: "/orders", icon: <Clock className="w-4 h-4" /> },
      { label: "Low Stock", count: 5, type: "warning", href: "/inventory", icon: <Package className="w-4 h-4" /> },
      { label: "Overdue Debts", count: 3, type: "urgent", href: "/customers", icon: <AlertCircle className="w-4 h-4" /> },
    ]
    : storeData[currentStore.id]?.actions || []

  const displayActivities = isAll
    ? Object.values(storeData).flatMap(s => s.activities)
    : storeData[currentStore.id]?.activities || []

  const displayInsight = isAll
    ? businessData.insight
    : storeData[currentStore.id]?.insight || "No specific insights for this store yet."

  // Mock data for new widgets
  const velocityData = [
    { date: 'Mon', value: 120000 },
    { date: 'Tue', value: 154000 },
    { date: 'Wed', value: 110000 },
    { date: 'Thu', value: 180000 },
    { date: 'Fri', value: 240000 },
    { date: 'Sat', value: 310000 },
    { date: 'Sun', value: 215000 },
  ]

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
            className="flex flex-col md:flex-row md:items-end justify-between gap-4"
          >
            <div>
              <p className="text-sm text-brand-accent/80 dark:text-brand-cream/80 font-medium mb-1 capitalize">
                {isDesktop ? 'Good afternoon,' : 'Welcome,'}
              </p>
              <h1 className="font-serif text-3xl md:text-4xl text-brand-deep dark:text-brand-cream">
                {ownerName}
              </h1>
            </div>

            {/* Date Filter & Business Badge */}
            <div className="flex flex-col md:items-end gap-3">
              <div className="hidden md:flex flex-col items-end">
                <span className="text-[10px] font-bold uppercase tracking-widest text-brand-accent/40 dark:text-white/50 mb-1">Current Business</span>
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
            lowStockItems={isAll ? 12 : 3} // Mock logic
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
