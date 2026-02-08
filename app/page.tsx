"use client"

import { useStore, ALL_STORES_ID } from './components/StoreProvider'
import { useMediaQuery } from './hooks/useMediaQuery'
import { PageTransition } from "./components/layout/page-transition"
import { motion } from "framer-motion"
import { DashboardHero } from "./components/dashboard/DashboardHero"
import { InsightWhisper } from "./components/dashboard/InsightWhisper"
import { ActionRow } from "./components/dashboard/ActionRow"
import { ActivityStream, ActivityItem } from "./components/dashboard/ActivityStream"
import { Package, Clock, AlertCircle } from "lucide-react"

// Mock Data structure per store
const storeData: Record<string, any> = {
  '1': { // Main Store
    sales: { value: "₦850,000", trend: "+15% vs last week", trendDirection: "up", label: "Total Sales (Main Store)" },
    actions: [
      { label: "Pending Orders", count: 2, type: "urgent", href: "/orders", icon: <Clock className="w-4 h-4" /> },
      { label: "Low Stock", count: 1, type: "warning", href: "/inventory", icon: <Package className="w-4 h-4" /> },
    ],
    activities: [
      { id: "s1-1", type: "sale", description: "Rice Bag (50kg)", amount: "₦12,000", timeAgo: "2m ago", customer: "Walk-in" },
      { id: "s1-2", type: "payment", description: "Debt Payment", amount: "₦5,000", timeAgo: "1h ago", customer: "Johnson" },
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
      { id: "s2-1", type: "sale", description: "Vegetable Oil", amount: "₦8,500", timeAgo: "15m ago", customer: "Bode" },
    ],
    insight: "Ikeja branch is seeing a **40% increase** in foot traffic today."
  },
  '3': { // Abuja Store
    sales: { value: "₦180,000", trend: "-5% vs last week", trendDirection: "down", label: "Total Sales (Abuja)" },
    actions: [
      { label: "Overdue Debts", count: 3, type: "urgent", href: "/customers", icon: <AlertCircle className="w-4 h-4" /> },
    ],
    activities: [
      { id: "s3-1", type: "debt", description: "New Debt Recorded", amount: "₦2,500", timeAgo: "3h ago", customer: "Mama Nkechi" },
    ],
    insight: "Abuja store has **3 unpaid debts** that are over a week old."
  }
}

// Global business-level data
const businessData = {
  wallet: {
    balance: "₦0.00",
    isVerified: false,
    label: "Wallet Balance"
  },
  insight: "Your overall business performance is **up by 12%**. Consider restocking in Ikeja soon."
}

export default function Home() {
  const { currentStore } = useStore()
  const isDesktop = useMediaQuery("(min-width: 768px)")

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

  return (
    <PageTransition>
      <div className="max-w-3xl mx-auto space-y-8 pb-20">

        {/* Header - Simple & Clean */}
        <header className="pt-4 px-2">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-baseline justify-between"
          >
            <div>
              <p className="text-sm text-brand-accent/80 dark:text-brand-cream/80 font-medium">
                {isDesktop ? 'Good afternoon,' : 'Welcome,'}
              </p>
              <h1 className="font-serif text-3xl md:text-3xl text-brand-deep dark:text-brand-cream">
                {currentStore.name}
              </h1>
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
