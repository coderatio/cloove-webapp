"use client"

import { useState, useEffect, useRef, startTransition } from "react"
import { GlassCard } from "@/app/components/ui/glass-card"
import { Input } from "@/app/components/ui/input"
import { Switch } from "@/app/components/ui/switch"
import { Globe, Loader2, Mail } from "lucide-react"
import { useSettings, useUpdateBusinessSettings } from "../hooks/useBusinessSettings"

interface BusinessSettingsProps {
    onDirtyChange?: (isDirty: boolean) => void
    onSavingChange?: (isSaving: boolean) => void
    saveTrigger?: number // Simple counter to trigger save from parent
}

const DEFAULT_LOCAL_CONFIGS = {
    low_stock_alert_enabled: true,
    low_stock_threshold: 5,
    debt_reminder_enabled: true,
    daily_summary_enabled: true,
    email_summaries_enabled: true,
    tx_email_business_sale_payment_enabled: true,
    tx_email_business_wallet_deposit_enabled: true,
    tx_email_business_withdrawal_outcome_enabled: true,
    tx_email_business_withdrawal_reversal_enabled: true,
    tx_email_business_recipient_email: "",
    tx_email_customer_sale_payment_enabled: false,
}

type LocalConfigs = typeof DEFAULT_LOCAL_CONFIGS

function normalizeOptionalEmail(value: unknown): string {
    const normalized = String(value ?? "").trim()
    if (!normalized || normalized === "null" || normalized === "undefined") {
        return ""
    }
    return normalized
}

export function BusinessSettings({ onDirtyChange, onSavingChange, saveTrigger }: BusinessSettingsProps) {
    const { data: settingsData, isLoading } = useSettings()
    const updateSettings = useUpdateBusinessSettings()
    const lastHandledSaveTrigger = useRef<number>(0)

    useEffect(() => {
        onSavingChange?.(updateSettings.isPending)
    }, [updateSettings.isPending, onSavingChange])

    const [localConfigs, setLocalConfigs] = useState<LocalConfigs>(DEFAULT_LOCAL_CONFIGS)

    const [isDirty, setIsDirty] = useState(false)

    // Sync local state when data loads
    useEffect(() => {
        if (settingsData?.business?.configs) {
            const configs = settingsData.business.configs
            startTransition(() => {
                setLocalConfigs({
                    low_stock_alert_enabled: !!configs.low_stock_alert_enabled,
                    low_stock_threshold: Number(configs.low_stock_threshold) || 5,
                    debt_reminder_enabled: !!configs.debt_reminder_enabled,
                    daily_summary_enabled: !!configs.daily_summary_enabled,
                    email_summaries_enabled: !!configs.email_summaries_enabled,
                    tx_email_business_sale_payment_enabled:
                        configs.tx_email_business_sale_payment_enabled !== false,
                    tx_email_business_wallet_deposit_enabled:
                        configs.tx_email_business_wallet_deposit_enabled !== false,
                    tx_email_business_withdrawal_outcome_enabled:
                        configs.tx_email_business_withdrawal_outcome_enabled !== false,
                    tx_email_business_withdrawal_reversal_enabled:
                        configs.tx_email_business_withdrawal_reversal_enabled !== false,
                    tx_email_business_recipient_email: normalizeOptionalEmail(
                        configs.tx_email_business_recipient_email
                    ),
                    tx_email_customer_sale_payment_enabled:
                        !!configs.tx_email_customer_sale_payment_enabled,
                })
                setIsDirty(false)
                onDirtyChange?.(false)
            })
        }
    }, [settingsData, onDirtyChange])

    // Trigger save when parent increments saveTrigger
    useEffect(() => {
        if (
            saveTrigger &&
            saveTrigger > 0 &&
            saveTrigger !== lastHandledSaveTrigger.current &&
            isDirty
        ) {
            lastHandledSaveTrigger.current = saveTrigger
            updateSettings.mutate(localConfigs)
        }
    }, [isDirty, localConfigs, saveTrigger, updateSettings])

    const handleConfigChange = <K extends keyof LocalConfigs>(key: K, value: LocalConfigs[K]) => {
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
                            onChange={(e) => handleConfigChange('low_stock_threshold', Number(e.target.value) || 0)}
                            className="h-10 rounded-xl bg-white/50 dark:bg-white/5 border-brand-deep/10 dark:border-white/10"
                        />
                    </div>
                </GlassCard>
            </section>

            <section className="space-y-4">
                <h2 className="font-serif text-xl text-brand-deep dark:text-brand-cream pl-1">Communications & Reports</h2>
                <GlassCard className="p-6 space-y-6">
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
                    <div className="rounded-2xl border border-brand-deep/10 bg-white/40 p-4 dark:border-white/10 dark:bg-white/5">
                        <div className="mb-4 flex items-start gap-3">
                            <div className="rounded-2xl bg-brand-gold/15 p-2 text-brand-deep dark:text-brand-gold">
                                <Mail className="h-4 w-4" />
                            </div>
                            <div className="space-y-1">
                                <h3 className="font-medium text-brand-deep dark:text-brand-cream">Transaction Email Alerts</h3>
                                <p className="text-xs text-brand-accent/60 dark:text-white/40">
                                    Choose which transaction emails your business receives and whether customers
                                    should get successful payment confirmations.
                                </p>
                            </div>
                        </div>

                        <div className="space-y-5">
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-brand-accent/40 dark:text-white/40">
                                    Business Notification Email
                                </label>
                                <Input
                                    type="email"
                                    value={localConfigs.tx_email_business_recipient_email}
                                    onChange={(e) => handleConfigChange("tx_email_business_recipient_email", e.target.value)}
                                    placeholder="Leave blank to use owner email"
                                    className="h-10 rounded-xl bg-white/50 dark:bg-white/5 border-brand-deep/10 dark:border-white/10"
                                />
                                <p className="text-[11px] text-brand-accent/50 dark:text-white/40">
                                    If blank, transaction alerts go to the business owner&apos;s email.
                                </p>
                            </div>

                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="flex items-center justify-between rounded-2xl border border-brand-deep/10 bg-white/50 p-4 dark:border-white/10 dark:bg-white/5">
                                    <div className="space-y-0.5 pr-4">
                                        <span className="font-medium text-brand-deep dark:text-brand-cream">Sale Payments</span>
                                        <p className="text-xs text-brand-accent/60 dark:text-white/40">Notify the business when a customer payment is received.</p>
                                    </div>
                                    <Switch
                                        checked={localConfigs.tx_email_business_sale_payment_enabled}
                                        onCheckedChange={(checked) => handleConfigChange("tx_email_business_sale_payment_enabled", checked)}
                                    />
                                </div>
                                <div className="flex items-center justify-between rounded-2xl border border-brand-deep/10 bg-white/50 p-4 dark:border-white/10 dark:bg-white/5">
                                    <div className="space-y-0.5 pr-4">
                                        <span className="font-medium text-brand-deep dark:text-brand-cream">Wallet Deposits</span>
                                        <p className="text-xs text-brand-accent/60 dark:text-white/40">Notify the business when wallet deposits land.</p>
                                    </div>
                                    <Switch
                                        checked={localConfigs.tx_email_business_wallet_deposit_enabled}
                                        onCheckedChange={(checked) => handleConfigChange("tx_email_business_wallet_deposit_enabled", checked)}
                                    />
                                </div>
                                <div className="flex items-center justify-between rounded-2xl border border-brand-deep/10 bg-white/50 p-4 dark:border-white/10 dark:bg-white/5">
                                    <div className="space-y-0.5 pr-4">
                                        <span className="font-medium text-brand-deep dark:text-brand-cream">Withdrawal Outcomes</span>
                                        <p className="text-xs text-brand-accent/60 dark:text-white/40">Notify the business when withdrawals succeed or fail.</p>
                                    </div>
                                    <Switch
                                        checked={localConfigs.tx_email_business_withdrawal_outcome_enabled}
                                        onCheckedChange={(checked) => handleConfigChange("tx_email_business_withdrawal_outcome_enabled", checked)}
                                    />
                                </div>
                                <div className="flex items-center justify-between rounded-2xl border border-brand-deep/10 bg-white/50 p-4 dark:border-white/10 dark:bg-white/5">
                                    <div className="space-y-0.5 pr-4">
                                        <span className="font-medium text-brand-deep dark:text-brand-cream">Withdrawal Reversals</span>
                                        <p className="text-xs text-brand-accent/60 dark:text-white/40">Notify the business when a failed withdrawal is reversed.</p>
                                    </div>
                                    <Switch
                                        checked={localConfigs.tx_email_business_withdrawal_reversal_enabled}
                                        onCheckedChange={(checked) => handleConfigChange("tx_email_business_withdrawal_reversal_enabled", checked)}
                                    />
                                </div>
                            </div>

                            <div className="flex items-center justify-between rounded-2xl border border-brand-deep/10 bg-brand-gold/5 p-4 dark:border-white/10 dark:bg-brand-gold/10">
                                <div className="space-y-0.5 pr-4">
                                    <span className="font-medium text-brand-deep dark:text-brand-cream">Customer Payment Confirmations</span>
                                    <p className="text-xs text-brand-accent/60 dark:text-white/40">
                                        Send customers a confirmation email after a successful sale payment, only
                                        when their email address is available.
                                    </p>
                                </div>
                                <Switch
                                    checked={localConfigs.tx_email_customer_sale_payment_enabled}
                                    onCheckedChange={(checked) => handleConfigChange("tx_email_customer_sale_payment_enabled", checked)}
                                />
                            </div>
                        </div>
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
