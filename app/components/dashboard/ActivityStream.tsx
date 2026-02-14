"use client"

import { motion } from "framer-motion"
import { ArrowDownLeft, ShoppingBag, CreditCard, UserPlus, ChevronRight, PackageSearch, Sparkles } from "lucide-react"
import { cn } from "@/app/lib/utils"
import { GlassCard } from "../ui/glass-card"
import Link from "next/link"

export interface ActivityItem {
    id: string
    type: 'sale' | 'payment' | 'debt' | 'customer' | 'inventory'
    description: string
    amount?: string
    timeAgo: string
    customer?: string
    href?: string
}

interface ActivityStreamProps {
    activities: ActivityItem[]
    className?: string
}

const ActivityIcon = ({ type }: { type: ActivityItem['type'] }) => {
    switch (type) {
        case 'sale':
            return <div className="p-2 bg-brand-green/10 text-brand-green dark:bg-brand-green/20 dark:text-brand-cream rounded-full"><ShoppingBag className="w-4 h-4" /></div>
        case 'payment':
            return <div className="p-2 bg-brand-gold/10 text-brand-gold dark:bg-brand-gold/20 dark:text-brand-gold rounded-full"><CreditCard className="w-4 h-4" /></div>
        case 'debt':
            return <div className="p-2 bg-danger/10 text-danger dark:bg-danger/20 dark:text-red-400 rounded-full"><ArrowDownLeft className="w-4 h-4" /></div>
        case 'customer':
            return <div className="p-2 bg-brand-accent/10 text-brand-accent dark:bg-brand-gold/10 dark:text-brand-gold rounded-full"><UserPlus className="w-4 h-4" /></div>
        case 'inventory':
            return <div className="p-2 bg-brand-blue/10 text-brand-blue dark:bg-brand-gold/10 dark:text-brand-gold rounded-full"><PackageSearch className="w-4 h-4" /></div>
    }
}

const ActivityEmptyState = () => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="flex flex-col items-center justify-center py-12 px-8 text-center"
        >
            <div className="relative mb-6">
                {/* Animated Ambient Glow */}
                <motion.div
                    animate={{
                        scale: [1, 1.15, 1],
                        opacity: [0.05, 0.12, 0.05],
                    }}
                    transition={{
                        duration: 6,
                        repeat: Infinity,
                        ease: "linear",
                    }}
                    className="absolute -inset-8 bg-brand-gold blur-3xl rounded-full"
                />

                {/* Floating "Pulse" Container */}
                <motion.div
                    animate={{ y: [0, -12, 0] }}
                    transition={{
                        duration: 4,
                        repeat: Infinity,
                        ease: "easeInOut",
                    }}
                    className="relative h-20 w-20 rounded-[28px] bg-white/40 dark:bg-brand-deep/40 border border-brand-deep/5 dark:border-white/5 backdrop-blur-md shadow-[0_20px_50px_rgba(0,0,0,0.05)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.2)] flex items-center justify-center group"
                >
                    <div className="absolute inset-0 rounded-[28px] bg-linear-to-tr from-brand-gold/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                    <Sparkles className="w-8 h-8 text-brand-gold transition-transform duration-700 group-hover:scale-110 group-hover:rotate-12" />

                    {/* Orbiting micro-dots */}
                    <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                        className="absolute -inset-2 pointer-events-none"
                    >
                        <div className="absolute top-0 left-1/2 w-1.5 h-1.5 rounded-full bg-brand-gold/40" />
                    </motion.div>
                </motion.div>
            </div>

            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3, duration: 1 }}
                className="space-y-3"
            >
                <h4 className="font-serif text-2xl text-brand-deep dark:text-brand-cream tracking-tight">
                    The Pulse of Potential
                </h4>
                <p className="text-sm text-brand-accent/60 dark:text-brand-cream/40 max-w-[280px] leading-relaxed mx-auto">
                    Your store's narrative is just beginning. Once you record sales or adjust stock, your activity stream will bloom.
                </p>

                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.8 }}
                    className="pt-4"
                >
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-deep/5 dark:bg-white/5 border border-brand-deep/5 dark:border-white/5">
                        <div className="w-1 h-1 rounded-full bg-brand-gold animate-pulse" />
                        <span className="text-[10px] uppercase tracking-widest font-bold text-brand-accent/40 dark:text-brand-cream/40">Awakening System</span>
                    </div>
                </motion.div>
            </motion.div>
        </motion.div>
    )
}

export function ActivityStream({ activities, className }: ActivityStreamProps) {
    return (
        <div className={cn("space-y-4", className)}>
            <div className="flex items-center justify-between px-2">
                <h3 className="font-serif text-lg text-brand-deep dark:text-brand-cream font-medium">Recent Activity</h3>
                {activities.length > 0 && (
                    <Link href="/activity" className="text-xs font-semibold text-brand-accent/60 hover:text-brand-green dark:text-brand-cream/60 dark:hover:text-brand-gold transition-colors">
                        View all
                    </Link>
                )}
            </div>

            <GlassCard className="rounded-[32px] p-2 space-y-1 overflow-hidden">
                {activities.length > 0 ? (
                    activities.map((item, index) => {
                        const Content = (
                            <motion.div
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.4 + (index * 0.05) }}
                                whileHover={{ x: 4 }}
                                className="flex items-center gap-4 p-3 hover:bg-white/60 dark:hover:bg-white/5 rounded-2xl transition-all group cursor-pointer"
                            >
                                <ActivityIcon type={item.type} />

                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold text-brand-deep dark:text-brand-cream truncate group-hover:text-brand-green dark:group-hover:text-brand-gold transition-colors">
                                        {item.description}
                                    </p>
                                    <p className="text-xs text-brand-accent/40 dark:text-brand-cream/40 truncate">
                                        {item.customer && <span className="text-brand-accent/60 dark:text-brand-cream/80 font-medium">{item.customer} • </span>}
                                        {item.timeAgo}
                                    </p>
                                </div>

                                <div className="flex items-center gap-3">
                                    {item.amount && (
                                        <div className={cn(
                                            "text-sm font-bold whitespace-nowrap",
                                            item.type === 'sale' || item.type === 'payment' ? "text-brand-green dark:text-brand-gold" : "text-brand-deep dark:text-brand-cream"
                                        )}>
                                            {item.type === 'sale' ? '+' : ''}{item.amount}
                                        </div>
                                    )}
                                    <ChevronRight className="w-4 h-4 text-brand-accent/20 dark:text-brand-gold/30 group-hover:text-brand-green dark:group-hover:text-brand-gold transition-colors" />
                                </div>
                            </motion.div>
                        )

                        return item.href ? (
                            <Link key={item.id} href={item.href} className="block">
                                {Content}
                            </Link>
                        ) : (
                            <div key={item.id}>
                                {Content}
                            </div>
                        )
                    })
                ) : (
                    <ActivityEmptyState />
                )}
            </GlassCard>
        </div>
    )
}
