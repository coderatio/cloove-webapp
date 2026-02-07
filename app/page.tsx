"use client"

import { GlassCard } from "./components/ui/glass-card"
import Link from 'next/link'
import { useStore } from './components/StoreProvider'
import { useMediaQuery } from './hooks/useMediaQuery'
import { PageTransition } from "./components/layout/page-transition"
import { motion } from "framer-motion"
import { ArrowRight, TrendingUp, AlertTriangle, Package, CheckCircle2 } from "lucide-react"

// Mock data
const mockData = {
  todaySales: '₦45,200',
  orderCount: 12,
  unpaidAmount: '₦28,500',
  unpaidCustomers: 3,
  topProduct: 'Ankara Fabric',
  topProductSales: 8,
  lowStockItems: 2,
}

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
}

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
}

export default function Home() {
  const { currentStore } = useStore()
  const isDesktop = useMediaQuery("(min-width: 768px)")

  return (
    <PageTransition>
      {/* Header */}
      <header className="mb-8 pl-1">
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <p className="text-sm font-medium text-muted-foreground mb-1">
            {isDesktop ? 'Good afternoon,' : currentStore.name}
          </p>
          <h1 className="font-serif text-3xl md:text-4xl font-semibold tracking-tight text-foreground">
            Business Overview
          </h1>
        </motion.div>
      </header>

      {/* Key Metrics */}
      <motion.section
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
      >
        <motion.div variants={item}>
          <GlassCard hoverEffect className="p-5 h-full flex flex-col justify-between group cursor-pointer border-l-4 border-l-emerald-500">
            <div className="flex justify-between items-start mb-2">
              <span className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">Today's Sales</span>
              <TrendingUp className="h-4 w-4 text-emerald-500" />
            </div>
            <div>
              <div className="font-serif text-2xl md:text-3xl font-medium text-foreground group-hover:scale-105 transition-transform origin-left">
                {mockData.todaySales}
              </div>
              <div className="text-xs text-emerald-700 dark:text-emerald-400 mt-1 font-medium bg-emerald-100 dark:bg-emerald-900/30 inline-block px-2 py-0.5 rounded-full">
                +12% vs yesterday
              </div>
            </div>
          </GlassCard>
        </motion.div>

        <motion.div variants={item}>
          <GlassCard hoverEffect className="p-5 h-full flex flex-col justify-between group cursor-pointer border-l-4 border-l-amber-500">
            <div className="flex justify-between items-start mb-2">
              <span className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">Unpaid</span>
              <AlertTriangle className="h-4 w-4 text-amber-500" />
            </div>
            <div>
              <div className="font-serif text-2xl md:text-3xl font-medium text-foreground group-hover:scale-105 transition-transform origin-left">
                {mockData.unpaidAmount}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {mockData.unpaidCustomers} customers owing
              </div>
            </div>
          </GlassCard>
        </motion.div>

        <motion.div variants={item}>
          <GlassCard hoverEffect className="p-5 h-full flex flex-col justify-between group cursor-pointer">
            <div className="flex justify-between items-start mb-2">
              <span className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">Top Product</span>
              <CheckCircle2 className="h-4 w-4 text-blue-500" />
            </div>
            <div>
              <div className="font-serif text-xl md:text-2xl font-medium text-foreground truncate group-hover:scale-105 transition-transform origin-left">
                {mockData.topProduct}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {mockData.topProductSales} units sold today
              </div>
            </div>
          </GlassCard>
        </motion.div>

        <motion.div variants={item}>
          <GlassCard hoverEffect className="p-5 h-full flex flex-col justify-between group cursor-pointer border-l-4 border-l-rose-500 bg-rose-50/50 dark:bg-rose-950/10">
            <div className="flex justify-between items-start mb-2">
              <span className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">Low Stock</span>
              <Package className="h-4 w-4 text-rose-500" />
            </div>
            <div>
              <div className="font-serif text-2xl md:text-3xl font-medium text-foreground group-hover:scale-105 transition-transform origin-left">
                {mockData.lowStockItems}
              </div>
              <div className="text-xs text-rose-600 dark:text-rose-400 mt-1 font-medium">
                Restock needed
              </div>
            </div>
          </GlassCard>
        </motion.div>
      </motion.section>

      {/* AI Insight */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="mb-8"
      >
        <GlassCard className="p-6 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity pointer-events-none">
            <TrendingUp className="h-32 w-32 rotate-12" />
          </div>

          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-3">
              <div className="h-6 w-6 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-md shadow-indigo-500/20">
                <span className="text-[10px] text-white font-bold">AI</span>
              </div>
              <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">Insight</span>
            </div>

            <p className="text-lg md:text-xl text-foreground font-medium leading-relaxed max-w-2xl">
              "You made <span className="text-emerald-600 dark:text-emerald-400 font-bold">23% more sales</span> this week. {isDesktop && 'Ankara Fabric is your bestseller — consider restocking soon.'}"
            </p>

            <Link
              href="/assistant"
              className="inline-flex items-center gap-2 mt-4 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors group/link"
            >
              Detailed report
              <ArrowRight className="h-4 w-4 transition-transform group-hover/link:translate-x-1" />
            </Link>
          </div>
        </GlassCard>
      </motion.section>

      {/* Quick Actions (Desktop only mostly) */}
      {isDesktop && (
        <motion.section
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          <h2 className="text-lg font-semibold mb-4 text-foreground px-1">Quick Actions</h2>
          <div className="flex gap-4">
            <Link href="/orders" className="flex-1 group">
              <GlassCard hoverEffect className="p-4 flex items-center justify-center gap-2 bg-white/40 dark:bg-white/5 border-dashed border-2 border-border/50 group-hover:border-solid hover:border-emerald-500/50">
                <span className="font-medium">View all orders</span>
              </GlassCard>
            </Link>
            <Link href="/customers" className="flex-1 group">
              <GlassCard hoverEffect className="p-4 flex items-center justify-center gap-2 bg-white/40 dark:bg-white/5 border-dashed border-2 border-border/50 group-hover:border-solid hover:border-amber-500/50">
                <span className="font-medium">See who owes you</span>
              </GlassCard>
            </Link>
            <Link href="/inventory" className="flex-1 group">
              <GlassCard hoverEffect className="p-4 flex items-center justify-center gap-2 bg-white/40 dark:bg-white/5 border-dashed border-2 border-border/50 group-hover:border-solid hover:border-rose-500/50">
                <span className="font-medium">Check inventory</span>
              </GlassCard>
            </Link>
          </div>
        </motion.section>
      )}
    </PageTransition>
  )
}
