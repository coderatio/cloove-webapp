"use client"

import { useState, useEffect } from "react"
import { GlassCard } from "@/app/components/ui/glass-card"
import { Input } from "@/app/components/ui/input"
import { Switch } from "@/app/components/ui/switch"
import { Globe, Loader2 } from "lucide-react"
import { useSettings, useUpdateBusinessSettings } from "../hooks/useBusinessSettings"

interface BusinessSettingsProps {
    onDirtyChange?: (isDirty: boolean) => void
    onSavingChange?: (isSaving: boolean) => void
    saveTrigger?: number // Simple counter to trigger save from parent
}

export function BusinessSettings({ onDirtyChange, onSavingChange, saveTrigger }: BusinessSettingsProps) {
    const { data: settingsData, isLoading } = useSettings()
    const updateSettings = useUpdateBusinessSettings()

    useEffect(() => {
        onSavingChange?.(updateSettings.isPending)
    }, [updateSettings.isPending, onSavingChange])

    const [localConfigs, setLocalConfigs] = useState({
        low_stock_alert_enabled: true,
        low_stock_threshold: 5,
        allow_credit_sales: true,
        debt_reminder_enabled: true,
        daily_summary_enabled: true,
        email_summaries_enabled: true,
    })

    const [isDirty, setIsDirty] = useState(false)

    // Sync local state when data loads
    useEffect(() => {
        if (settingsData?.business?.configs) {
            const configs = settingsData.business.configs
            setLocalConfigs({
                low_stock_alert_enabled: !!configs.low_stock_alert_enabled,
                low_stock_threshold: Number(configs.low_stock_threshold) || 5,
                allow_credit_sales: !!configs.allow_credit_sales,
                debt_reminder_enabled: !!configs.debt_reminder_enabled,
                daily_summary_enabled: !!configs.daily_summary_enabled,
                email_summaries_enabled: !!configs.email_summaries_enabled,
            })
            setIsDirty(false)
            onDirtyChange?.(false)
        }
    }, [settingsData, onDirtyChange])

    // Trigger save when parent increments saveTrigger
    useEffect(() => {
        if (saveTrigger && saveTrigger > 0 && isDirty) {
            updateSettings.mutate(localConfigs)
        }
    }, [saveTrigger])

    const handleConfigChange = (key: keyof typeof localConfigs, value: any) => {
        setLocalConfigs(prev => ({ ...prev, [key]: value }))
        setIsDirty(true)
        onDirtyChange?.(true)
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-center p-12">
                <Loader2 className="w-8 h-8 animate-spin text-brand-gold" />
            </div>
        )
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
                            checked={localConfigs.low_stock_alert_enabled}
                            onCheckedChange={(checked) => handleConfigChange('low_stock_alert_enabled', checked)}
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-brand-accent/40 dark:text-white/40">Default Threshold</label>
                        <Input
                            type="number"
                            value={localConfigs.low_stock_threshold}
                            onChange={(e) => handleConfigChange('low_stock_threshold', e.target.value)}
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
                            checked={localConfigs.allow_credit_sales}
                            onCheckedChange={(checked) => handleConfigChange('allow_credit_sales', checked)}
                        />
                    </div>
                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <span className="font-medium text-brand-deep dark:text-brand-cream">Automated Debt Reminders</span>
                            <p className="text-xs text-brand-accent/60 dark:text-white/40">Send WhatsApp reminders for overdue payments.</p>
                        </div>
                        <Switch
                            checked={localConfigs.debt_reminder_enabled}
                            onCheckedChange={(checked) => handleConfigChange('debt_reminder_enabled', checked)}
                        />
                    </div>
                </GlassCard>
            </section>

            <section className="space-y-4">
                <h2 className="font-serif text-xl text-brand-deep dark:text-brand-cream pl-1">Communications & Reports</h2>
                <GlassCard className="p-6 space-y-6">
                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <span className="font-medium text-brand-deep dark:text-brand-cream">Email Summaries</span>
                            <p className="text-xs text-brand-accent/60 dark:text-white/40">Receive important business notifications via email.</p>
                        </div>
                        <Switch
                            checked={localConfigs.email_summaries_enabled}
                            onCheckedChange={(checked) => handleConfigChange('email_summaries_enabled', checked)}
                        />
                    </div>
                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <span className="font-medium text-brand-deep dark:text-brand-cream">Daily Performance Reports</span>
                            <p className="text-xs text-brand-accent/60 dark:text-white/40">Get a summary of sales and inventory every evening.</p>
                        </div>
                        <Switch
                            checked={localConfigs.daily_summary_enabled}
                            onCheckedChange={(checked) => handleConfigChange('daily_summary_enabled', checked)}
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
                            <span className="font-medium text-brand-deep dark:text-brand-cream">{settingsData?.business?.currency || 'Nigerian Naira (NGN)'}</span>
                            <Globe className="w-4 h-4 text-brand-deep/30 dark:text-brand-cream/30" />
                        </div>
                        <p className="text-[10px] text-brand-accent/40 dark:text-brand-cream/40 mt-2">Currency is based on your registration country and cannot be changed here.</p>
                    </div>
                </GlassCard>
            </section>
        </div>
    )
}
