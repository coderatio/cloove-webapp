"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { GlassCard } from "@/app/components/ui/glass-card"
import { Switch } from "@/app/components/ui/switch"
import { Input } from "@/app/components/ui/input"
import { Button } from "@/app/components/ui/button"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/app/components/ui/select"
import { Loader2, Plus, Trash2, Wallet } from "lucide-react"
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

const CHECKOUT_FULFILLMENT_OPTIONS = [
    {
        id: "delivery",
        label: "Delivery",
        description: "Send the order to the customer's address.",
    },
    {
        id: "pickup",
        label: "Pickup",
        description: "Customer picks up from the business or nearest branch.",
    },
    {
        id: "dine_in",
        label: "Dine-in",
        description: "Customer will eat at the venue.",
    },
    {
        id: "takeaway",
        label: "Takeaway",
        description: "Pack the order to go.",
    },
] as const

const CHECKOUT_PAYMENT_OPTIONS = [
    {
        id: "bank_transfer",
        label: "Bank transfer",
        description: "Create a transfer account for payment.",
    },
    {
        id: "pay_on_delivery",
        label: "Pay on delivery",
        description: "Collect payment when the order is delivered.",
    },
    {
        id: "cash",
        label: "Cash",
        description: "Customer pays cash to staff.",
    },
    {
        id: "pos",
        label: "POS",
        description: "Customer pays with POS.",
    },
    {
        id: "card",
        label: "Card",
        description: "Customer pays with card where available.",
    },
    {
        id: "pay_after_eating",
        label: "Pay after eating",
        description: "Restaurant dine-in only.",
    },
    {
        id: "pay_at_counter",
        label: "Pay at counter",
        description: "Useful for pickup, takeaway, and dine-in.",
    },
] as const

type CheckoutFulfillmentOptionId = (typeof CHECKOUT_FULFILLMENT_OPTIONS)[number]["id"]
type CheckoutPaymentOptionId = (typeof CHECKOUT_PAYMENT_OPTIONS)[number]["id"]

type DineInLocationOption = {
    id: string
    title: string
    description: string
}

const DEFAULT_RETAIL_FULFILLMENT: CheckoutFulfillmentOptionId[] = ["delivery", "pickup"]
const DEFAULT_RESTAURANT_FULFILLMENT: CheckoutFulfillmentOptionId[] = [
    "dine_in",
    "takeaway",
    "delivery",
    "pickup",
]

const DEFAULT_RETAIL_PAYMENTS: CheckoutPaymentOptionId[] = [
    "pay_on_delivery",
    "bank_transfer",
    "cash",
    "pos",
]

const DEFAULT_RESTAURANT_PAYMENTS: CheckoutPaymentOptionId[] = [
    "pay_after_eating",
    "pay_at_counter",
    "cash",
    "bank_transfer",
    "pos",
]

function parseDineInLocations(value: unknown): DineInLocationOption[] {
    if (!Array.isArray(value)) return []

    return value
        .map((item) => {
            if (!item || typeof item !== "object") return null
            const raw = item as Record<string, unknown>
            const title = String(raw.title ?? "").trim()
            if (!title) return null

            const derivedId =
                String(raw.id ?? "")
                    .trim()
                    .toLowerCase()
                    .replace(/[^a-z0-9]+/g, "_")
                    .replace(/^_+|_+$/g, "") ||
                title.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "")

            return {
                id: derivedId,
                title,
                description: String(raw.description ?? "").trim(),
            }
        })
        .filter((item): item is DineInLocationOption => Boolean(item))
}

function buildDineInLocationId(title: string): string {
    return title.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "")
}

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
        customer_checkout_fulfillment_methods: [] as CheckoutFulfillmentOptionId[],
        customer_checkout_payment_methods: [] as CheckoutPaymentOptionId[],
        customer_checkout_dine_in_locations: [] as DineInLocationOption[],
        customer_checkout_require_confirmation: true,
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

    const layoutPreset = String(settingsData?.business?.configs?.ui_layout_preset || "default")
    const isRestaurant = layoutPreset === "restaurant"

    useEffect(() => {
        if (!settingsData?.business?.configs) return
        const configs = settingsData.business.configs
        const normalizedFulfillment = Array.isArray(configs.customer_checkout_fulfillment_methods)
            ? configs.customer_checkout_fulfillment_methods.filter(
                  (item): item is CheckoutFulfillmentOptionId =>
                      typeof item === "string" &&
                      CHECKOUT_FULFILLMENT_OPTIONS.some((option) => option.id === item)
              )
            : []
        const normalizedPayments = Array.isArray(configs.customer_checkout_payment_methods)
            ? configs.customer_checkout_payment_methods.filter(
                  (item): item is CheckoutPaymentOptionId =>
                      typeof item === "string" &&
                      CHECKOUT_PAYMENT_OPTIONS.some((option) => option.id === item)
              )
            : []
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setLocalConfigs({
            allow_credit_sales: !!configs.allow_credit_sales,
            require_customer_for_sale: !!configs.require_customer_for_sale,
            auto_generate_receipt: !!configs.auto_generate_receipt,
            default_payment_method: String(configs.default_payment_method || "CASH"),
            sales_virtual_account_provider: String(configs.sales_virtual_account_provider || ""),
            customer_checkout_fulfillment_methods: normalizedFulfillment.length
                ? normalizedFulfillment
                : layoutPreset === "restaurant"
                    ? DEFAULT_RESTAURANT_FULFILLMENT
                    : DEFAULT_RETAIL_FULFILLMENT,
            customer_checkout_payment_methods: normalizedPayments.length
                ? normalizedPayments
                : layoutPreset === "restaurant"
                    ? DEFAULT_RESTAURANT_PAYMENTS
                    : DEFAULT_RETAIL_PAYMENTS,
            customer_checkout_dine_in_locations: parseDineInLocations(
                configs.customer_checkout_dine_in_locations
            ),
            customer_checkout_require_confirmation:
                configs.customer_checkout_require_confirmation !== false,
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
        value:
            | boolean
            | string
            | CheckoutFulfillmentOptionId[]
            | CheckoutPaymentOptionId[]
            | DineInLocationOption[]
    ) => {
        setLocalConfigs((prev) => ({ ...prev, [key]: value }))
        setIsDirty(true)
        onDirtyChange?.(true)
    }

    const toggleFulfillmentSelection = (id: CheckoutFulfillmentOptionId) => {
        const current = localConfigs.customer_checkout_fulfillment_methods
        const next = current.includes(id)
            ? current.filter((item) => item !== id)
            : [...current, id]
        handleConfigChange("customer_checkout_fulfillment_methods", next)
    }

    const togglePaymentSelection = (id: CheckoutPaymentOptionId) => {
        const current = localConfigs.customer_checkout_payment_methods
        const next = current.includes(id)
            ? current.filter((item) => item !== id)
            : [...current, id]
        handleConfigChange("customer_checkout_payment_methods", next)
    }

    const addDineInLocation = () => {
        handleConfigChange("customer_checkout_dine_in_locations", [
            ...localConfigs.customer_checkout_dine_in_locations,
            { id: "", title: "", description: "" },
        ])
    }

    const updateDineInLocation = (
        index: number,
        key: "title" | "description",
        value: string
    ) => {
        const next = localConfigs.customer_checkout_dine_in_locations.map((item, itemIndex) => {
            if (itemIndex !== index) return item
            const updated = { ...item, [key]: value }
            return {
                ...updated,
                id: buildDineInLocationId(updated.title),
            }
        })
        handleConfigChange("customer_checkout_dine_in_locations", next)
    }

    const removeDineInLocation = (index: number) => {
        handleConfigChange(
            "customer_checkout_dine_in_locations",
            localConfigs.customer_checkout_dine_in_locations.filter((_, itemIndex) => itemIndex !== index)
        )
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
                <h2 className="pl-1 font-serif text-xl text-brand-deep dark:text-brand-cream">
                    Checkout & Transfers
                </h2>
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

                    <div className="flex items-center justify-between gap-4 rounded-xl border border-brand-deep/10 bg-white/30 p-4 dark:border-white/10 dark:bg-white/[0.03]">
                        <div className="space-y-0.5">
                            <span className="font-medium text-brand-deep dark:text-brand-cream">
                                Require Final Confirmation
                            </span>
                            <p className="text-xs text-brand-accent/60 dark:text-white/40">
                                Ask the customer to confirm before the WhatsApp checkout is submitted as an order.
                            </p>
                        </div>
                        <Switch
                            checked={localConfigs.customer_checkout_require_confirmation}
                            onCheckedChange={(checked) =>
                                handleConfigChange("customer_checkout_require_confirmation", checked)
                            }
                        />
                    </div>
                </GlassCard>
            </section>

            <section className="space-y-4">
                <h2 className="pl-1 font-serif text-xl text-brand-deep dark:text-brand-cream">
                    Customer Checkout Options
                </h2>
                <GlassCard className="space-y-6 p-6">
                    <div className="space-y-3">
                        <div>
                            <label className="text-[10px] font-bold uppercase tracking-widest text-brand-accent/40 dark:text-white/40">
                                Order Types
                            </label>
                            <p className="mt-1 text-xs text-brand-accent/60 dark:text-white/40">
                                Choose the fulfillment types customers can select in WhatsApp checkout.
                            </p>
                        </div>
                        <div className="grid gap-3 md:grid-cols-2">
                            {CHECKOUT_FULFILLMENT_OPTIONS
                                .filter((option) => isRestaurant || !["dine_in", "takeaway"].includes(option.id))
                                .map((option) => (
                                    <label
                                        key={option.id}
                                        className="flex items-center justify-between gap-4 rounded-xl border border-brand-deep/10 bg-white/30 p-4 dark:border-white/10 dark:bg-white/[0.03]"
                                    >
                                        <div className="space-y-0.5">
                                            <div className="font-medium text-brand-deep dark:text-brand-cream">
                                                {option.label}
                                            </div>
                                            <p className="text-xs text-brand-accent/60 dark:text-white/40">
                                                {option.description}
                                            </p>
                                        </div>
                                        <Switch
                                            checked={localConfigs.customer_checkout_fulfillment_methods.includes(option.id)}
                                            onCheckedChange={() => toggleFulfillmentSelection(option.id)}
                                        />
                                    </label>
                                ))}
                        </div>
                    </div>

                    <div className="space-y-3">
                        <div>
                            <label className="text-[10px] font-bold uppercase tracking-widest text-brand-accent/40 dark:text-white/40">
                                Payment Methods
                            </label>
                            <p className="mt-1 text-xs text-brand-accent/60 dark:text-white/40">
                                Choose the payment methods customers can pick during WhatsApp checkout.
                            </p>
                        </div>
                        <div className="grid gap-3 md:grid-cols-2">
                            {CHECKOUT_PAYMENT_OPTIONS
                                .filter((option) =>
                                    isRestaurant ? true : !["pay_after_eating", "pay_at_counter"].includes(option.id)
                                )
                                .map((option) => (
                                    <label
                                        key={option.id}
                                        className="flex items-center justify-between gap-4 rounded-xl border border-brand-deep/10 bg-white/30 p-4 dark:border-white/10 dark:bg-white/[0.03]"
                                    >
                                        <div className="space-y-0.5">
                                            <div className="font-medium text-brand-deep dark:text-brand-cream">
                                                {option.label}
                                            </div>
                                            <p className="text-xs text-brand-accent/60 dark:text-white/40">
                                                {option.description}
                                            </p>
                                        </div>
                                        <Switch
                                            checked={localConfigs.customer_checkout_payment_methods.includes(option.id)}
                                            onCheckedChange={() => togglePaymentSelection(option.id)}
                                        />
                                    </label>
                                ))}
                        </div>
                    </div>

                    {isRestaurant && (
                        <div className="space-y-3">
                            <div className="flex items-center justify-between gap-4">
                                <div>
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-brand-accent/40 dark:text-white/40">
                                        Dine-in Locations
                                    </label>
                                    <p className="mt-1 text-xs text-brand-accent/60 dark:text-white/40">
                                        Add the dine-in areas or table labels customers should choose from.
                                    </p>
                                </div>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="h-9 rounded-xl"
                                    onClick={addDineInLocation}
                                >
                                    <Plus className="mr-2 h-4 w-4" />
                                    Add location
                                </Button>
                            </div>

                            {localConfigs.customer_checkout_dine_in_locations.length === 0 ? (
                                <div className="rounded-xl border border-dashed border-brand-deep/10 bg-white/20 px-4 py-5 text-sm text-brand-accent/60 dark:border-white/10 dark:bg-white/[0.03] dark:text-white/40">
                                    No dine-in locations added yet.
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {localConfigs.customer_checkout_dine_in_locations.map((location, index) => (
                                        <div
                                            key={`${location.id || "new"}-${index}`}
                                            className="grid gap-3 rounded-xl border border-brand-deep/10 bg-white/30 p-4 dark:border-white/10 dark:bg-white/[0.03] md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]"
                                        >
                                            <Input
                                                value={location.title}
                                                onChange={(event) =>
                                                    updateDineInLocation(index, "title", event.target.value)
                                                }
                                                placeholder="Table 1"
                                                className="h-11 rounded-xl border-brand-deep/10 bg-white/50 dark:border-white/10 dark:bg-white/5"
                                            />
                                            <Input
                                                value={location.description}
                                                onChange={(event) =>
                                                    updateDineInLocation(index, "description", event.target.value)
                                                }
                                                placeholder="Patio"
                                                className="h-11 rounded-xl border-brand-deep/10 bg-white/50 dark:border-white/10 dark:bg-white/5"
                                            />
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                className="h-11 w-11 rounded-xl text-brand-accent/70 hover:text-red-600"
                                                onClick={() => removeDineInLocation(index)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </GlassCard>
            </section>

            <section className="space-y-4">
                <h2 className="pl-1 font-serif text-xl text-brand-deep dark:text-brand-cream">
                    Sales Workflow
                </h2>
                <GlassCard className="space-y-6 p-6">
                    <div className="flex items-center justify-between gap-4">
                        <div className="space-y-0.5">
                            <span className="font-medium text-brand-deep dark:text-brand-cream">
                                Allow Credit Sales
                            </span>
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
                            <span className="font-medium text-brand-deep dark:text-brand-cream">
                                Require Customer On Sale
                            </span>
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
                            <span className="font-medium text-brand-deep dark:text-brand-cream">
                                Auto-generate Receipt
                            </span>
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

        </div>
    )
}
