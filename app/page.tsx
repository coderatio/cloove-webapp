"use client"

import { useStore } from './components/StoreProvider'
import { useMediaQuery } from './hooks/useMediaQuery'
import { PageTransition } from "./components/layout/page-transition"
import { motion } from "framer-motion"
import { DashboardHero } from "./components/dashboard/DashboardHero"
import { InsightWhisper } from "./components/dashboard/InsightWhisper"
import { ActionRow } from "./components/dashboard/ActionRow"
import { ActivityStream, ActivityItem } from "./components/dashboard/ActivityStream"
import { Package, Clock, AlertCircle } from "lucide-react"

// Mock Data
const dashboardData = {
  totalSales: "₦1,250,000",
  trend: "+12% vs last week",
  trendDirection: "up" as const,
  insight: (
    <>
      You sold more <span className="text-brand-green font-bold">rice</span> this week significantly. Great job.
    </>
  ),
  actions: [
    { label: "Pending Orders", count: 3, type: "urgent" as const, href: "/orders", icon: <Clock className="w-4 h-4" /> },
    { label: "Low Stock", count: 2, type: "warning" as const, href: "/inventory", icon: <Package className="w-4 h-4" /> },
    { label: "Overdue Debts", count: 5, type: "urgent" as const, href: "/customers", icon: <AlertCircle className="w-4 h-4" /> },
  ],
  activities: [
    {
      id: "1",
      type: "sale" as const,
      description: "Rice Bag (50kg)",
      amount: "₦12,000",
      timeAgo: "2m ago",
      customer: "Walk-in"
    },
    {
      id: "2",
      type: "payment" as const,
      description: "Debt Payment",
      amount: "₦5,000",
      timeAgo: "1h ago",
      customer: "Johnson"
    },
    {
      id: "3",
      type: "debt" as const,
      description: "New Debt Recorded",
      amount: "₦2,500",
      timeAgo: "3h ago",
      customer: "Mama Nkechi"
    },
    {
      id: "4",
      type: "customer" as const,
      description: "New Customer Added",
      timeAgo: "5h ago",
      customer: "Chinedu Okeke"
    }
  ] as ActivityItem[]
}

export default function Home() {
  const { currentStore } = useStore()
  const isDesktop = useMediaQuery("(min-width: 768px)")

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
              <p className="text-sm text-brand-accent/80 font-medium">
                {isDesktop ? 'Good afternoon,' : 'Welcome,'}
              </p>
              <h1 className="font-serif text-3xl md:text-3xl text-brand-deep">
                {currentStore.name}
              </h1>
            </div>
          </motion.div>
        </header>

        {/* Hero Section - The "Pulse" */}
        <section>
          <DashboardHero
            value={dashboardData.totalSales}
            trend={dashboardData.trend}
            trendDirection={dashboardData.trendDirection}
            label="Total Sales (This Week)"
          />
        </section>

        {/* Insight Whisper - The "Intelligence" */}
        <section>
          <InsightWhisper
            insight={dashboardData.insight}
            actionLabel="View Report"
            actionLink="/assistant"
          />
        </section>

        {/* Quick Actions - The "Control" */}
        <section>
          <h3 className="font-serif text-lg text-brand-deep mb-4 px-2">Needs Attention</h3>
          <ActionRow items={dashboardData.actions} />
        </section>

        {/* Activity Stream - The "Truth" */}
        <section>
          <ActivityStream activities={dashboardData.activities} />
        </section>

      </div>
    </PageTransition>
  )
}
