"use client"

import React, { useState } from "react"
import { GlassCard } from "@/app/components/ui/glass-card"
import { Button } from "@/app/components/ui/button"
import { 
    Bell, 
    Mail, 
    MessageSquare, 
    Smartphone,
    CreditCard
} from "lucide-react"
import { cn } from "@/app/lib/utils"

export default function SettingsPage() {
    const [notifications, setNotifications] = useState({
        email: true,
        whatsapp: true,
        push: false
    })

    const toggleNotification = (key: keyof typeof notifications) => {
        setNotifications(p => ({ ...p, [key]: !p[key] }))
    }

    return (
        <div className="max-w-4xl mx-auto space-y-8 pb-12">
            <div className="space-y-2">
                <h2 className="text-3xl font-serif font-medium">Settings</h2>
                <p className="text-brand-deep/50 dark:text-brand-cream/50">Manage your account preferences and notification settings.</p>
            </div>

            <div className="grid grid-cols-1 gap-8">
                {/* Notification Settings */}
                <GlassCard className="p-8">
                    <div className="flex items-center gap-3 mb-8">
                        <div className="w-10 h-10 rounded-xl bg-brand-gold/10 text-brand-gold flex items-center justify-center">
                            <Bell className="w-5 h-5" />
                        </div>
                        <h3 className="text-xl font-serif font-medium">Notifications</h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
                        {[
                            { id: 'email', title: 'Email Notifications', desc: 'Receive performance reports and updates', icon: Mail },
                            { id: 'whatsapp', title: 'WhatsApp Alerts', desc: 'Get instant alerts for new successful onboards', icon: MessageSquare },
                            { id: 'push', title: 'Push Notifications', desc: 'Real-time updates in your web browser', icon: Smartphone }
                        ].map((item) => (
                            <div key={item.id} className="flex items-center justify-between group">
                                <div className="flex gap-4">
                                    <div className="w-8 h-8 rounded-lg bg-brand-deep/5 dark:bg-white/5 flex items-center justify-center text-brand-deep/40 group-hover:text-brand-gold transition-colors">
                                        <item.icon className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold">{item.title}</p>
                                        <p className="text-xs text-brand-deep/40 dark:text-brand-cream/40">{item.desc}</p>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => toggleNotification(item.id as any)}
                                    className={cn(
                                        "w-10 h-5 rounded-full p-1 transition-colors duration-300 shrink-0",
                                        notifications[item.id as keyof typeof notifications] ? "bg-brand-gold" : "bg-brand-deep/10 dark:bg-white/10"
                                    )}
                                >
                                    <div className={cn(
                                        "w-3 h-3 rounded-full bg-brand-cream shadow-sm transition-transform duration-300",
                                        notifications[item.id as keyof typeof notifications] ? "translate-x-5" : "translate-x-0"
                                    )} />
                                </button>
                            </div>
                        ))}
                    </div>
                </GlassCard>

                {/* Payout Summary (Linked to Wallet but useful here) */}
                <GlassCard className="p-8 bg-brand-deep dark:bg-brand-gold/10 border-none">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-8">
                        <div className="flex items-center gap-6">
                            <div className="w-16 h-16 rounded-[24px] bg-brand-gold/20 flex items-center justify-center">
                                <CreditCard className="w-8 h-8 text-brand-gold" />
                            </div>
                            <div>
                                <h3 className="text-xl font-serif font-medium text-brand-gold">Payout Account</h3>
                                <p className="text-sm text-brand-cream/60">Manage where your commissions are deposited.</p>
                            </div>
                        </div>
                        <Button variant="outline" className="rounded-2xl h-14 px-8 border-brand-gold/50 text-brand-gold hover:bg-brand-gold/10 transition-all font-bold">
                            Open Wallet
                        </Button>
                    </div>
                </GlassCard>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4">
                <Button className="rounded-2xl px-12 h-12 bg-brand-deep text-brand-cream dark:bg-brand-gold dark:text-brand-deep font-bold">Save Changes</Button>
            </div>
        </div>
    )
}
