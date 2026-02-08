"use client"

import { motion } from "framer-motion"
import { ArrowDownLeft, ShoppingBag, CreditCard, UserPlus } from "lucide-react"
import { cn } from "@/app/lib/utils"

export interface ActivityItem {
    id: string
    type: 'sale' | 'payment' | 'debt' | 'customer'
    description: string
    amount?: string
    timeAgo: string
    customer?: string
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
            return <div className="p-2 bg-brand-accent/10 text-brand-accent dark:bg-brand-accent/20 dark:text-brand-cream rounded-full"><UserPlus className="w-4 h-4" /></div>
    }
}

export function ActivityStream({ activities, className }: ActivityStreamProps) {
    return (
        <div className={cn("space-y-4", className)}>
            <div className="flex items-center justify-between px-2">
                <h3 className="font-serif text-lg text-brand-deep dark:text-brand-cream">Recent Activity</h3>
                <button className="text-xs font-medium text-muted-foreground hover:text-brand-green dark:hover:text-brand-cream transition-colors">
                    View all
                </button>
            </div>

            <div className="glass-panel rounded-[30px] p-2 space-y-1">
                {activities.map((item, index) => (
                    <motion.div
                        key={item.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.4 + (index * 0.05) }}
                        className="flex items-center gap-4 p-3 hover:bg-white/40 dark:hover:bg-white/5 rounded-2xl transition-colors group cursor-default"
                    >
                        <ActivityIcon type={item.type} />

                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-brand-deep dark:text-brand-cream truncate">
                                {item.description}
                            </p>
                            <p className="text-xs text-muted-foreground dark:text-brand-cream/60 truncate">
                                {item.customer && <span className="text-brand-accent/80 dark:text-brand-cream/80 font-medium">{item.customer} • </span>}
                                {item.timeAgo}
                            </p>
                        </div>

                        {item.amount && (
                            <div className={cn(
                                "text-sm font-semibold whitespace-nowrap",
                                item.type === 'sale' || item.type === 'payment' ? "text-brand-green dark:text-brand-gold" : "text-brand-deep dark:text-brand-cream"
                            )}>
                                {item.type === 'sale' ? '+' : ''}{item.amount}
                            </div>
                        )}
                    </motion.div>
                ))}
            </div>
        </div>
    )
}
