"use client"

import React, { useState } from "react"
import { GlassCard } from "@/app/components/ui/glass-card"
import { Button } from "@/app/components/ui/button"
import {
    Bell,
    Mail,
    MessageSquare,
    Smartphone,
    CreditCard,
} from "lucide-react"
import { cn } from "@/app/lib/utils"
import { apiClient } from "@/app/lib/api-client"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import Link from "next/link"

interface NotificationPrefs {
    email: boolean
    whatsapp: boolean
    push: boolean
}

export default function SettingsPage() {
    const queryClient = useQueryClient()

    const { data: savedPrefs, isLoading } = useQuery<NotificationPrefs>({
        queryKey: ["field-agent-notifications"],
        queryFn: () => apiClient.get<NotificationPrefs>("/field-agent/notifications"),
    })

    const [notifications, setNotifications] = useState<NotificationPrefs>({
        email: true,
        whatsapp: true,
        push: false,
    })

    React.useEffect(() => {
        if (savedPrefs) setNotifications(savedPrefs)
    }, [savedPrefs])

    const { mutate: saveNotifications } = useMutation({
        mutationFn: (prefs: NotificationPrefs) =>
            apiClient.patch("/field-agent/notifications", prefs),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["field-agent-notifications"] })
        },
        onError: (err: any) => {
            toast.error(err.message || "Failed to save settings")
        },
    })

    const toggleNotification = (key: keyof NotificationPrefs) => {
        const updated = { ...notifications, [key]: !notifications[key] }
        setNotifications(updated)
        saveNotifications(updated)
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
                            { id: 'email' as const, title: 'Email Notifications', desc: 'Receive performance reports and updates', icon: Mail },
                            { id: 'whatsapp' as const, title: 'WhatsApp Alerts', desc: 'Get instant alerts for new successful onboards', icon: MessageSquare },
                            { id: 'push' as const, title: 'Push Notifications', desc: 'Real-time updates in your web browser', icon: Smartphone }
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
                                    onClick={() => toggleNotification(item.id)}
                                    disabled={isLoading}
                                    className={cn(
                                        "w-10 h-5 rounded-full p-1 transition-colors duration-300 shrink-0 disabled:opacity-50",
                                        notifications[item.id] ? "bg-brand-gold" : "bg-brand-deep/10 dark:bg-white/10"
                                    )}
                                >
                                    <div className={cn(
                                        "w-3 h-3 rounded-full bg-brand-cream shadow-sm transition-transform duration-300",
                                        notifications[item.id] ? "translate-x-5" : "translate-x-0"
                                    )} />
                                </button>
                            </div>
                        ))}
                    </div>
                </GlassCard>

                {/* Payout Account */}
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
                        <Button variant="outline" className="rounded-2xl h-14 px-8 border-brand-gold/50 text-brand-gold hover:bg-brand-gold/10 transition-all font-bold" asChild>
                            <Link href="/field/wallet">Open Wallet</Link>
                        </Button>
                    </div>
                </GlassCard>
            </div>
        </div>
    )
}
