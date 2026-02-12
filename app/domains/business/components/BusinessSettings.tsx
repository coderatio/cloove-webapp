"use client"

import { useState } from "react"
import { GlassCard } from "@/app/components/ui/glass-card"
import { Input } from "@/app/components/ui/input"
import { Switch } from "@/app/components/ui/switch"
import { Globe } from "lucide-react"
import { toast } from "sonner"

export function BusinessSettings() {
    const [settings, setSettings] = useState({
        lowStockAlerts: true,
        defaultThreshold: "5",
        creditSales: true,
        debtReminders: true,
        emailSummaries: true
    })

    const handleToggle = (key: keyof typeof settings) => {
        setSettings(prev => {
            const newState = { ...prev, [key]: !prev[key] }
            toast.success(`${key === 'lowStockAlerts' ? 'Inventory alerts' :
                key === 'creditSales' ? 'Credit sales' :
                    key === 'debtReminders' ? 'Debt reminders' : 'Settings'} updated`)
            return newState
        })
    }

    const handleThresholdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSettings({ ...settings, defaultThreshold: e.target.value })
    }

    return (
        <div className="space-y-8">
            <section className="space-y-4">
                <h2 className="font-serif text-xl text-brand-deep dark:text-brand-cream pl-1">Inventory Management</h2>
                <GlassCard className="p-6 space-y-6">
                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <span className="font-medium text-brand-deep dark:text-brand-cream">Low Stock Alerts</span>
                            <p className="text-xs text-brand-accent/60 dark:text-white/40">Notify me when products are running low.</p>
                        </div>
                        <Switch
                            checked={settings.lowStockAlerts}
                            onCheckedChange={() => handleToggle('lowStockAlerts')}
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-brand-accent/40 dark:text-white/40">Default Threshold</label>
                        <Input
                            type="number"
                            value={settings.defaultThreshold}
                            onChange={handleThresholdChange}
                            className="h-10 rounded-xl bg-white/50 dark:bg-white/5 border-brand-deep/10 dark:border-white/10"
                        />
                    </div>
                </GlassCard>
            </section>

            <section className="space-y-4">
                <h2 className="font-serif text-xl text-brand-deep dark:text-brand-cream pl-1">Sales & Credit</h2>
                <GlassCard className="p-6 space-y-6">
                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <span className="font-medium text-brand-deep dark:text-brand-cream">Allow Credit Sales</span>
                            <p className="text-xs text-brand-accent/60 dark:text-white/40">Enable "Buy Now Pay Later" for customers.</p>
                        </div>
                        <Switch
                            checked={settings.creditSales}
                            onCheckedChange={() => handleToggle('creditSales')}
                        />
                    </div>
                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <span className="font-medium text-brand-deep dark:text-brand-cream">Automated Debt Reminders</span>
                            <p className="text-xs text-brand-accent/60 dark:text-white/40">Send WhatsApp reminders for overdue payments.</p>
                        </div>
                        <Switch
                            checked={settings.debtReminders}
                            onCheckedChange={() => handleToggle('debtReminders')}
                        />
                    </div>
                </GlassCard>
            </section>

            <section className="space-y-4">
                <h2 className="font-serif text-xl text-brand-deep dark:text-brand-cream pl-1">Localization</h2>
                <GlassCard className="p-6 space-y-6">
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-brand-accent/40 dark:text-white/40">Business Currency</label>
                        <div className="flex items-center justify-between p-3 bg-white dark:bg-white/5 rounded-xl border border-brand-deep/5 dark:border-white/10 max-w-md">
                            <span className="font-medium text-brand-deep dark:text-brand-cream">Nigerian Naira (NGN)</span>
                            <Globe className="w-4 h-4 text-brand-deep/30 dark:text-brand-cream/30" />
                        </div>
                        <p className="text-[10px] text-brand-accent/40 dark:text-brand-cream/40 mt-2">Currency is based on your registration country and cannot be changed here.</p>
                    </div>
                </GlassCard>
            </section>
        </div>
    )
}
