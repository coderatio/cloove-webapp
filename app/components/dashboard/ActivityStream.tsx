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
            return <div className="p-2 bg-brand-green/10 rounded-full text-brand-green"><ShoppingBag className="w-4 h-4" /></div>
        case 'payment':
            return <div className="p-2 bg-brand-gold/10 rounded-full text-brand-gold"><CreditCard className="w-4 h-4" /></div>
        case 'debt':
            return <div className="p-2 bg-danger/10 rounded-full text-danger"><ArrowDownLeft className="w-4 h-4" /></div>
        case 'customer':
            return <div className="p-2 bg-brand-accent/10 rounded-full text-brand-accent"><UserPlus className="w-4 h-4" /></div>
    }
}

export function ActivityStream({ activities, className }: ActivityStreamProps) {
    return (
        <div className={cn("space-y-4", className)}>
            <div className="flex items-center justify-between px-2">
                <h3 className="font-serif text-lg text-brand-deep">Recent Activity</h3>
                <button className="text-xs font-medium text-muted-foreground hover:text-brand-green transition-colors">
                    View all
                </button>
            </div>

            <div className="glass-panel rounded-2xl p-2 space-y-1">
                {activities.map((item, index) => (
                    <motion.div
                        key={item.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.4 + (index * 0.05) }}
                        className="flex items-center gap-4 p-3 hover:bg-white/40 rounded-xl transition-colors group cursor-default"
                    >
                        <ActivityIcon type={item.type} />

                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-brand-deep truncate">
                                {item.description}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">
                                {item.customer && <span className="text-brand-accent/80 font-medium">{item.customer} • </span>}
                                {item.timeAgo}
                            </p>
                        </div>

                        {item.amount && (
                            <div className={cn(
                                "text-sm font-semibold whitespace-nowrap",
                                item.type === 'sale' || item.type === 'payment' ? "text-brand-green" : "text-brand-deep"
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
