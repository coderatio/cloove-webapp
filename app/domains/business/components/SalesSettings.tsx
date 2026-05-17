"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { GlassCard } from "@/app/components/ui/glass-card"
import { Switch } from "@/app/components/ui/switch"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/app/components/ui/select"
import { Loader2, Receipt, Wallet } from "lucide-react"
import { useSettings, useUpdateBusinessSettings } from "../hooks/useBusinessSettings"
import { usePaymentProviders } from "@/app/domains/finance/hooks/useFinance"

interface SalesSettingsProps {
    onDirtyChange?: (isDirty: boolean) => void
    onSavingChange?: (isSaving: boolean) => void
    saveTrigger?: number
}

const PAYMENT_METHOD_OPTIONS = [
    { value: "CASH", label: "Cash" },
    { value: "TRANSFER", label: "Bank transfer" },
    { value: "POS", label: "POS" },
    { value: "CARD", label: "Card" },
]

export function SalesSettings({ onDirtyChange, onSavingChange, saveTrigger }: SalesSettingsProps) {
    const { data: settingsData, isLoading } = useSettings()
    const updateSettings = useUpdateBusinessSettings()
    const { data: providersResponse, isLoading: providersLoading } = usePaymentProviders()
    const lastHandledSaveTrigger = useRef<number>(0)

    useEffect(() => {
        onSavingChange?.(updateSettings.isPending)
    }, [updateSettings.isPending, onSavingChange])

    const [localConfigs, setLocalConfigs] = useState({
        allow_credit_sales: true,
        require_customer_for_sale: false,
        auto_generate_receipt: true,
        default_payment_method: "CASH",
        sales_virtual_account_provider: "",
    })
    const [isDirty, setIsDirty] = useState(false)

    const eligibleProviders = useMemo(() => {
        const providers = providersResponse?.data ?? []
        return providers.filter((provider) => {
            if (provider.is_enabled === false) return false
            if (provider.dynamic_account_enabled === false) return false
            if (
                provider.virtual_account_mode === "pool" &&
                provider.static_account_enabled === false
            ) {
                return false
            }
            return true
        })
    }, [providersResponse?.data])

    useEffect(() => {
        if (!settingsData?.business?.configs) return
        const configs = settingsData.business.configs
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setLocalConfigs({
            allow_credit_sales: !!configs.allow_credit_sales,
            require_customer_for_sale: !!configs.require_customer_for_sale,
            auto_generate_receipt: !!configs.auto_generate_receipt,
            default_payment_method: String(configs.default_payment_method || "CASH"),
            sales_virtual_account_provider: String(configs.sales_virtual_account_provider || ""),
        })
        setIsDirty(false)
        onDirtyChange?.(false)
    }, [settingsData, onDirtyChange])

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

    const handleConfigChange = (
        key: keyof typeof localConfigs,
        value: boolean | string
    ) => {
        setLocalConfigs((prev) => ({ ...prev, [key]: value }))
        setIsDirty(true)
        onDirtyChange?.(true)
    }

    if (isLoading || providersLoading) {
        return (
            <div className="flex items-center justify-center p-12">
                <Loader2 className="h-8 w-8 animate-spin text-brand-gold" />
            </div>
        )
    }

    return (
        <div className="space-y-8">
            <section className="space-y-4">
                <h2 className="pl-1 font-serif text-xl text-brand-deep dark:text-brand-cream">Checkout & Transfers</h2>
                <GlassCard className="space-y-6 p-6">
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-brand-accent/40 dark:text-white/40">
                            Virtual Account Provider
                        </label>
                        <Select
                            value={localConfigs.sales_virtual_account_provider || "__auto__"}
                            onValueChange={(value) =>
                                handleConfigChange(
                                    "sales_virtual_account_provider",
                                    value === "__auto__" ? "" : value
                                )
                            }
                        >
                            <SelectTrigger className="h-12 rounded-xl border-brand-deep/10 bg-white/50 dark:border-white/10 dark:bg-white/5">
                                <SelectValue placeholder="Choose a provider" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="__auto__">Automatic (workspace default)</SelectItem>
                                {eligibleProviders.map((provider) => (
                                    <SelectItem key={provider.id} value={provider.id}>
                                        {provider.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <p className="text-xs text-brand-accent/60 dark:text-white/40">
                            This provider will be used when generating storefront and checkout bank-transfer accounts for this business.
                        </p>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-brand-accent/40 dark:text-white/40">
                                Default Payment Method
                            </label>
                            <Select
                                value={localConfigs.default_payment_method}
                                onValueChange={(value) =>
                                    handleConfigChange("default_payment_method", value)
                                }
                            >
                                <SelectTrigger className="h-12 rounded-xl border-brand-deep/10 bg-white/50 dark:border-white/10 dark:bg-white/5">
                                    <SelectValue placeholder="Choose a payment method" />
                                </SelectTrigger>
                                <SelectContent>
                                    {PAYMENT_METHOD_OPTIONS.map((option) => (
                                        <SelectItem key={option.value} value={option.value}>
                                            {option.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="rounded-xl border border-brand-deep/10 bg-white/40 p-4 dark:border-white/10 dark:bg-white/[0.03]">
                            <div className="flex items-start gap-3">
                                <Wallet className="mt-0.5 h-4 w-4 text-brand-deep/50 dark:text-brand-cream/60" />
                                <div className="space-y-1">
                                    <p className="text-sm font-medium text-brand-deep dark:text-brand-cream">
                                        Provider eligibility is enforced
                                    </p>
                                    <p className="text-xs text-brand-accent/60 dark:text-white/40">
                                        Only enabled providers that support checkout virtual accounts show up here.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </GlassCard>
            </section>

            <section className="space-y-4">
                <h2 className="pl-1 font-serif text-xl text-brand-deep dark:text-brand-cream">Sales Workflow</h2>
                <GlassCard className="space-y-6 p-6">
                    <div className="flex items-center justify-between gap-4">
                        <div className="space-y-0.5">
                            <span className="font-medium text-brand-deep dark:text-brand-cream">Allow Credit Sales</span>
                            <p className="text-xs text-brand-accent/60 dark:text-white/40">
                                Enable deferred payment workflows for customers.
                            </p>
                        </div>
                        <Switch
                            checked={localConfigs.allow_credit_sales}
                            onCheckedChange={(checked) => handleConfigChange("allow_credit_sales", checked)}
                        />
                    </div>

                    <div className="flex items-center justify-between gap-4">
                        <div className="space-y-0.5">
                            <span className="font-medium text-brand-deep dark:text-brand-cream">Require Customer On Sale</span>
                            <p className="text-xs text-brand-accent/60 dark:text-white/40">
                                Force every new sale to be attached to a customer record.
                            </p>
                        </div>
                        <Switch
                            checked={localConfigs.require_customer_for_sale}
                            onCheckedChange={(checked) => handleConfigChange("require_customer_for_sale", checked)}
                        />
                    </div>

                    <div className="flex items-center justify-between gap-4">
                        <div className="space-y-0.5">
                            <span className="font-medium text-brand-deep dark:text-brand-cream">Auto-generate Receipt</span>
                            <p className="text-xs text-brand-accent/60 dark:text-white/40">
                                Prepare a receipt immediately after each completed sale.
                            </p>
                        </div>
                        <Switch
                            checked={localConfigs.auto_generate_receipt}
                            onCheckedChange={(checked) => handleConfigChange("auto_generate_receipt", checked)}
                        />
                    </div>
                </GlassCard>
            </section>

            <section className="space-y-4">
                <h2 className="pl-1 font-serif text-xl text-brand-deep dark:text-brand-cream">Output</h2>
                <GlassCard className="space-y-4 p-6">
                    <div className="flex items-start gap-3">
                        <Receipt className="mt-0.5 h-4 w-4 text-brand-deep/50 dark:text-brand-cream/60" />
                        <div className="space-y-1">
                            <p className="text-sm font-medium text-brand-deep dark:text-brand-cream">
                                Receipts and transfer details follow this tab
                            </p>
                            <p className="text-xs text-brand-accent/60 dark:text-white/40">
                                These settings control the default payment behavior used during direct sales and customer bank-transfer checkout.
                            </p>
                        </div>
                    </div>
                </GlassCard>
            </section>
        </div>
    )
}
