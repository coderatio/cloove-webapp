"use client"

import { useEffect, useMemo, useState } from "react"
import { Loader2, Plus, Save, Trash2, Truck } from "lucide-react"
import { ManagementHeader } from "@/app/components/shared/ManagementHeader"
import { PageTransition } from "@/app/components/layout/page-transition"
import { GlassCard } from "@/app/components/ui/glass-card"
import { Button } from "@/app/components/ui/button"
import { Input } from "@/app/components/ui/input"
import { MoneyInput } from "@/app/components/ui/money-input"
import { Switch } from "@/app/components/ui/switch"
import { Badge } from "@/app/components/ui/badge"
import { useBusiness } from "@/app/components/BusinessProvider"
import { usePermission } from "@/app/hooks/usePermission"
import { useGoSettings, useUpdateGoSettings } from "@/app/domains/messaging/hooks/useWhatsAppSettings"
import { toast } from "sonner"

const DEFAULT_DELIVERY_FEE = {
    enabled: false,
    flat_fee: 0,
    free_delivery_threshold: null as number | null,
    label: "Delivery fee",
    area_fees_enabled: false,
    areas: [] as DeliveryAreaFee[],
}

interface DeliveryAreaFee {
    id: string
    name: string
    fee: number
    enabled: boolean
    sort_order: number
}

function formatAmount(value: number, currency: string) {
    return new Intl.NumberFormat(undefined, {
        style: "currency",
        currency,
        maximumFractionDigits: 2,
    }).format(Number.isFinite(value) ? value : 0)
}

function createAreaId() {
    if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
        return crypto.randomUUID()
    }
    return `area_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

export function DeliveryFeesSettings() {
    const { activeBusiness, currency: currencySymbol } = useBusiness()
    const { can } = usePermission()
    const canManage = can("MANAGE_STORES")
    const { data: goSettings, isLoading } = useGoSettings()
    const updateGoSettings = useUpdateGoSettings()
    const currency = activeBusiness?.currency || "NGN"

    const [deliveryFee, setDeliveryFee] = useState(DEFAULT_DELIVERY_FEE)
    const [isDirty, setIsDirty] = useState(false)

    useEffect(() => {
        if (!goSettings) return
        const fee = goSettings.checkout_delivery_fee ?? DEFAULT_DELIVERY_FEE
        setDeliveryFee({
            enabled: !!fee.enabled,
            flat_fee: Number(fee.flat_fee ?? 0),
            free_delivery_threshold:
                fee.free_delivery_threshold === null || fee.free_delivery_threshold === undefined
                    ? null
                    : Number(fee.free_delivery_threshold),
            label: String(fee.label ?? "Delivery fee"),
            area_fees_enabled: !!fee.area_fees_enabled,
            areas: Array.isArray(fee.areas)
                ? fee.areas.map((area, index) => ({
                    id: String(area.id || createAreaId()),
                    name: String(area.name ?? ""),
                    fee: Number(area.fee ?? 0),
                    enabled: area.enabled !== false,
                    sort_order: Number(area.sort_order ?? index),
                }))
                : [],
        })
        setIsDirty(false)
    }, [goSettings])

    const previewRows = useMemo(() => {
        const fee = Number(deliveryFee.flat_fee || 0)
        const threshold = deliveryFee.free_delivery_threshold
        return [
            {
                label: "Small delivery order",
                subtotal: 3_500,
                fee: deliveryFee.enabled && (threshold === null || 3_500 < threshold) ? fee : 0,
            },
            {
                label: "Large delivery order",
                subtotal: threshold ?? 15_000,
                fee: deliveryFee.enabled && threshold !== null ? 0 : fee,
            },
        ]
    }, [deliveryFee.enabled, deliveryFee.flat_fee, deliveryFee.free_delivery_threshold])

    const activeAreas = useMemo(
        () => deliveryFee.areas.filter((area) => area.enabled && area.name.trim()),
        [deliveryFee.areas]
    )

    const updateField = <K extends keyof typeof deliveryFee>(
        key: K,
        value: (typeof deliveryFee)[K]
    ) => {
        if (!canManage) return
        setDeliveryFee((prev) => ({ ...prev, [key]: value }))
        setIsDirty(true)
    }

    const updateArea = <K extends keyof DeliveryAreaFee>(
        id: string,
        key: K,
        value: DeliveryAreaFee[K]
    ) => {
        if (!canManage) return
        setDeliveryFee((prev) => ({
            ...prev,
            areas: prev.areas.map((area) => (area.id === id ? { ...area, [key]: value } : area)),
        }))
        setIsDirty(true)
    }

    const addArea = () => {
        if (!canManage) return
        setDeliveryFee((prev) => ({
            ...prev,
            areas: [
                ...prev.areas,
                {
                    id: createAreaId(),
                    name: "",
                    fee: 0,
                    enabled: true,
                    sort_order: prev.areas.length,
                },
            ],
        }))
        setIsDirty(true)
    }

    const removeArea = (id: string) => {
        if (!canManage) return
        setDeliveryFee((prev) => ({
            ...prev,
            areas: prev.areas.filter((area) => area.id !== id),
        }))
        setIsDirty(true)
    }

    const validateAreas = () => {
        const names = deliveryFee.areas.map((area) => area.name.trim().toLowerCase()).filter(Boolean)
        const duplicate = names.find((name, index) => names.indexOf(name) !== index)
        if (duplicate) return "Delivery area names must be unique."
        if (deliveryFee.areas.some((area) => area.name.trim().length === 0)) {
            return "Every delivery area needs a name."
        }
        if (deliveryFee.areas.some((area) => Number(area.fee) < 0)) {
            return "Delivery area fees cannot be negative."
        }
        if (deliveryFee.area_fees_enabled && activeAreas.length === 0) {
            return "Add at least one active delivery area before enabling area-based fees."
        }
        return null
    }

    const handleSave = async () => {
        if (!canManage) return
        const validationError = validateAreas()
        if (validationError) {
            toast.error(validationError)
            return
        }
        await updateGoSettings.mutateAsync({
            checkout_delivery_fee: {
                enabled: deliveryFee.enabled,
                flat_fee: Number(deliveryFee.flat_fee || 0),
                free_delivery_threshold:
                    deliveryFee.free_delivery_threshold === null
                        ? null
                        : Number(deliveryFee.free_delivery_threshold),
                label: deliveryFee.label.trim() || "Delivery fee",
                area_fees_enabled: deliveryFee.area_fees_enabled,
                areas: deliveryFee.areas.map((area, index) => ({
                    id: area.id,
                    name: area.name.trim(),
                    fee: Number(area.fee || 0),
                    enabled: area.enabled,
                    sort_order: index,
                })),
            },
        })
        setIsDirty(false)
    }

    if (isLoading) {
        return (
            <PageTransition>
                <div className="flex min-h-[320px] items-center justify-center">
                    <Loader2 className="h-6 w-6 animate-spin text-brand-gold" />
                </div>
            </PageTransition>
        )
    }

    return (
        <PageTransition>
            <div className="mx-auto max-w-6xl space-y-6 pb-24">
                <ManagementHeader
                    title="Delivery Fees"
                    description="Configure the fee customers pay on delivery orders across checkout surfaces."
                />

                {!canManage ? (
                    <GlassCard className="border-amber-500/20 bg-amber-500/10 p-4 text-sm text-amber-700 dark:text-amber-200">
                        You can view delivery fee settings, but you need store management permission to edit them.
                    </GlassCard>
                ) : null}

                <div className="grid gap-5 lg:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.65fr)]">
                    <GlassCard className="space-y-6 p-4 sm:p-6">
                        <div className="flex flex-col gap-4 border-b border-brand-deep/8 pb-5 dark:border-white/10 sm:flex-row sm:items-start sm:justify-between">
                            <div className="min-w-0 space-y-1">
                                <div className="flex items-center gap-2">
                                    <Truck className="h-5 w-5 text-brand-gold" />
                                    <h2 className="text-lg font-semibold text-brand-deep dark:text-brand-cream">
                                        Delivery fee rule
                                    </h2>
                                </div>
                                <p className="max-w-2xl text-sm text-brand-accent/60 dark:text-white/45">
                                    This fee is applied only when the customer chooses delivery. Pickup and dine-in orders are not charged.
                                </p>
                            </div>
                            <Badge variant={deliveryFee.enabled ? "success" : "secondary"}>
                                {deliveryFee.enabled ? "Enabled" : "Disabled"}
                            </Badge>
                        </div>

                        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-x-4 gap-y-2 rounded-2xl border border-brand-deep/10 bg-white/35 p-4 dark:border-white/10 dark:bg-white/[0.04]">
                            <div className="min-w-0 space-y-1">
                                <p className="font-medium text-brand-deep dark:text-brand-cream">
                                    Charge delivery fee
                                </p>
                                <p className="text-sm text-brand-accent/60 dark:text-white/45">
                                    Turn this off when delivery should be free for every order.
                                </p>
                            </div>
                            <Switch
                                checked={deliveryFee.enabled}
                                disabled={!canManage}
                                onCheckedChange={(checked) => updateField("enabled", checked)}
                            />
                        </div>

                        <div className="grid gap-4 md:grid-cols-3">
                            <div className="space-y-2 md:col-span-1">
                                <label className="text-sm font-medium text-brand-deep/75 dark:text-brand-cream/75">
                                    Customer label
                                </label>
                                <Input
                                    value={deliveryFee.label}
                                    disabled={!canManage}
                                    onChange={(event) => updateField("label", event.target.value)}
                                    placeholder="Delivery fee"
                                    className="h-11 rounded-xl bg-white/70 dark:bg-white/5"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-brand-deep/75 dark:text-brand-cream/75">
                                    Flat fee
                                </label>
                                <MoneyInput
                                    value={deliveryFee.flat_fee}
                                    disabled={!canManage || !deliveryFee.enabled}
                                    onChange={(value) => updateField("flat_fee", Number(value || 0))}
                                    currencySymbol={currencySymbol}
                                    placeholder="0"
                                    className="h-11 rounded-xl bg-white/70 dark:bg-white/5"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-brand-deep/75 dark:text-brand-cream/75">
                                    Free above
                                </label>
                                <MoneyInput
                                    value={deliveryFee.free_delivery_threshold ?? ""}
                                    disabled={!canManage || !deliveryFee.enabled}
                                    onChange={(value) => updateField("free_delivery_threshold", value > 0 ? value : null)}
                                    currencySymbol={currencySymbol}
                                    placeholder="No threshold"
                                    className="h-11 rounded-xl bg-white/70 dark:bg-white/5"
                                />
                            </div>
                        </div>

                        <div className="space-y-4 rounded-2xl border border-brand-deep/10 bg-white/35 p-4 dark:border-white/10 dark:bg-white/[0.04]">
                            <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-4">
                                <div className="min-w-0 space-y-1">
                                    <p className="font-medium text-brand-deep dark:text-brand-cream">
                                        Area-based delivery fees
                                    </p>
                                    <p className="text-sm text-brand-accent/60 dark:text-white/45">
                                        Customers choose a delivery area and the selected area fee replaces the flat fee.
                                    </p>
                                </div>
                                <Switch
                                    checked={deliveryFee.area_fees_enabled}
                                    disabled={!canManage || !deliveryFee.enabled}
                                    onCheckedChange={(checked) => updateField("area_fees_enabled", checked)}
                                />
                            </div>

                            <div className="space-y-3">
                                {deliveryFee.areas.map((area) => (
                                    <div
                                        key={area.id}
                                        className="grid items-center gap-3 rounded-xl border border-brand-deep/10 bg-white/60 p-3 dark:border-white/10 dark:bg-white/[0.04] md:grid-cols-[minmax(0,1fr)_160px_auto_auto]"
                                    >
                                        <Input
                                            value={area.name}
                                            disabled={!canManage}
                                            onChange={(event) => updateArea(area.id, "name", event.target.value)}
                                            placeholder="Lekki Phase 1"
                                            className="h-10 rounded-xl bg-white/80 dark:bg-white/5"
                                        />
                                        <MoneyInput
                                            value={area.fee}
                                            disabled={!canManage}
                                            onChange={(value) => updateArea(area.id, "fee", Number(value || 0))}
                                            currencySymbol={currencySymbol}
                                            placeholder="0"
                                            className="h-10 rounded-xl bg-white/80 dark:bg-white/5"
                                        />
                                        <div className="flex items-center justify-between gap-2 rounded-xl border border-brand-deep/10 px-3 py-2 dark:border-white/10">
                                            <span className="text-sm text-brand-accent/65 dark:text-white/50">Active</span>
                                            <Switch
                                                checked={area.enabled}
                                                disabled={!canManage}
                                                onCheckedChange={(checked) => updateArea(area.id, "enabled", checked)}
                                            />
                                        </div>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            disabled={!canManage}
                                            onClick={() => removeArea(area.id)}
                                            className="h-10 w-10 self-center rounded-xl text-red-600 hover:bg-red-500/10 hover:text-red-700"
                                            aria-label={`Remove ${area.name || "delivery area"}`}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ))}
                            </div>

                            <Button
                                type="button"
                                variant="outline"
                                disabled={!canManage || deliveryFee.areas.length >= 50}
                                onClick={addArea}
                                className="h-10 rounded-full"
                            >
                                <Plus className="mr-2 h-4 w-4" />
                                Add area
                            </Button>
                        </div>
                    </GlassCard>

                    <GlassCard className="space-y-4 p-4 sm:p-6">
                        <div>
                            <h2 className="text-lg font-semibold text-brand-deep dark:text-brand-cream">
                                Checkout preview
                            </h2>
                            <p className="mt-1 text-sm text-brand-accent/60 dark:text-white/45">
                                Quick check of how the rule will appear before you save.
                            </p>
                        </div>

                        <div className="space-y-3">
                            {previewRows.map((row) => (
                                <div
                                    key={row.label}
                                    className="rounded-2xl border border-brand-deep/10 bg-white/45 p-4 dark:border-white/10 dark:bg-white/[0.04]"
                                >
                                    <div className="flex items-center justify-between gap-3 text-sm">
                                        <span className="text-brand-accent/70 dark:text-white/50">{row.label}</span>
                                        <span className="font-medium text-brand-deep dark:text-brand-cream">
                                            {formatAmount(row.subtotal, currency)}
                                        </span>
                                    </div>
                                    <div className="mt-3 flex items-center justify-between gap-3 border-t border-brand-deep/8 pt-3 text-sm dark:border-white/10">
                                        <span className="text-brand-accent/70 dark:text-white/50">
                                            {deliveryFee.label || "Delivery fee"}
                                        </span>
                                        <span className="font-semibold text-brand-deep dark:text-brand-cream">
                                            {row.fee > 0 ? formatAmount(row.fee, currency) : "Free"}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {deliveryFee.area_fees_enabled && activeAreas.length > 0 ? (
                            <div className="rounded-2xl border border-brand-deep/10 bg-white/45 p-4 dark:border-white/10 dark:bg-white/[0.04]">
                                <p className="text-sm font-medium text-brand-deep dark:text-brand-cream">
                                    Area label preview
                                </p>
                                <p className="mt-2 text-sm text-brand-accent/70 dark:text-white/50">
                                    {(deliveryFee.label || "Delivery fee")} - {activeAreas[0].name}(
                                    {formatAmount(activeAreas[0].fee, currency)})
                                </p>
                            </div>
                        ) : null}
                    </GlassCard>
                </div>

                {canManage && isDirty ? (
                    <div className="sticky bottom-0 z-40 -mx-4 border-t border-brand-deep/10 bg-brand-cream/90 px-4 py-3 shadow-[0_-12px_30px_rgba(0,0,0,0.08)] backdrop-blur dark:border-white/10 dark:bg-brand-deep/90 sm:-mx-6 sm:px-6 lg:mx-0 lg:rounded-t-2xl lg:border-x">
                        <div className="mx-auto flex max-w-6xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <p className="text-sm font-medium text-brand-deep dark:text-brand-cream">
                                Unsaved delivery fee changes
                            </p>
                            <Button
                                type="button"
                                disabled={updateGoSettings.isPending}
                                onClick={handleSave}
                                className="h-10 rounded-full sm:min-w-40"
                            >
                                {updateGoSettings.isPending ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                    <Save className="mr-2 h-4 w-4" />
                                )}
                                Save changes
                            </Button>
                        </div>
                    </div>
                ) : null}
            </div>
        </PageTransition>
    )
}
