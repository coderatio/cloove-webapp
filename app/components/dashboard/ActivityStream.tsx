"use client"

import { motion } from "framer-motion"
import { ArrowDownLeft, ShoppingBag, CreditCard, UserPlus, ChevronRight } from "lucide-react"
import { cn } from "@/app/lib/utils"
import { GlassCard } from "../ui/glass-card"
import Link from "next/link"

export interface ActivityItem {
    id: string
    type: 'sale' | 'payment' | 'debt' | 'customer'
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
    }
}

export function ActivityStream({ activities, className }: ActivityStreamProps) {
    return (
        <div className={cn("space-y-4", className)}>
            <div className="flex items-center justify-between px-2">
                <h3 className="font-serif text-lg text-brand-deep dark:text-brand-cream font-medium">Recent Activity</h3>
                <Link href="/activity" className="text-xs font-semibold text-brand-accent/60 hover:text-brand-green dark:text-brand-cream/60 dark:hover:text-brand-gold transition-colors">
                    View all
                </Link>
            </div>

            <GlassCard className="rounded-[32px] p-2 space-y-1">
                {activities.map((item, index) => {
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
                })}
            </GlassCard>
        </div>
    )
}
