"use client"

import { useEffect, useState } from "react"
import {
    Drawer,
    DrawerContent,
    DrawerStickyHeader,
    DrawerTitle,
    DrawerDescription,
    DrawerFooter,
    DrawerClose,
} from "@/app/components/ui/drawer"
import { Input } from "@/app/components/ui/input"
import { Textarea } from "@/app/components/ui/textarea"
import { Button } from "@/app/components/ui/button"
import { Switch } from "@/app/components/ui/switch"
import { Label } from "@/app/components/ui/label"
import type {
    BusinessServiceItem,
    CreateBusinessServicePayload,
} from "@/app/domains/services/hooks/useServices"

interface ServiceFormDrawerProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    initial: BusinessServiceItem | null
    onSubmit: (payload: CreateBusinessServicePayload) => Promise<void> | void
    submitting: boolean
}

interface FormState {
    name: string
    summary: string
    description: string
    audience: string
    deliverables: string
    durationLabel: string
    priceLabel: string
    isActive: boolean
}

const EMPTY: FormState = {
    name: "",
    summary: "",
    description: "",
    audience: "",
    deliverables: "",
    durationLabel: "",
    priceLabel: "",
    isActive: true,
}

function fromService(service: BusinessServiceItem | null): FormState {
    if (!service) return EMPTY
    return {
        name: service.name,
        summary: service.summary ?? "",
        description: service.description ?? "",
        audience: service.audience ?? "",
        deliverables: (service.deliverables ?? []).join("\n"),
        durationLabel: service.durationLabel ?? "",
        priceLabel: service.priceLabel ?? "",
        isActive: service.isActive,
    }
}

export function ServiceFormDrawer({
    open,
    onOpenChange,
    initial,
    onSubmit,
    submitting,
}: ServiceFormDrawerProps) {
    const [form, setForm] = useState<FormState>(fromService(initial))

    useEffect(() => {
        setForm(fromService(initial))
    }, [initial, open])

    const isEditing = !!initial

    function update<K extends keyof FormState>(key: K, value: FormState[K]) {
        setForm((prev) => ({ ...prev, [key]: value }))
    }

    async function handleSubmit() {
        const payload: CreateBusinessServicePayload = {
            name: form.name.trim(),
            summary: form.summary.trim() || null,
            description: form.description.trim() || null,
            audience: form.audience.trim() || null,
            deliverables: form.deliverables
                .split("\n")
                .map((line) => line.trim())
                .filter(Boolean),
            durationLabel: form.durationLabel.trim() || null,
            priceLabel: form.priceLabel.trim() || null,
            isActive: form.isActive,
        }
        await onSubmit(payload)
    }

    const canSubmit = form.name.trim().length >= 2 && !submitting

    return (
        <Drawer open={open} onOpenChange={onOpenChange}>
            <DrawerContent className="max-h-[90vh]">
                <DrawerStickyHeader>
                    <DrawerTitle className="font-serif text-2xl text-brand-deep dark:text-brand-cream">
                        {isEditing ? "Edit service" : "Add a service"}
                    </DrawerTitle>
                    <DrawerDescription>
                        Only services listed here can be discussed by the white-label assistant.
                    </DrawerDescription>
                </DrawerStickyHeader>

                <div className="overflow-y-auto px-6 py-6 space-y-6">
                    <div className="space-y-2">
                        <Label htmlFor="service-name">Name</Label>
                        <Input
                            id="service-name"
                            value={form.name}
                            onChange={(event) => update("name", event.target.value)}
                            placeholder="e.g. Brand strategy sprint"
                            maxLength={200}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="service-summary">One-line summary</Label>
                        <Input
                            id="service-summary"
                            value={form.summary}
                            onChange={(event) => update("summary", event.target.value)}
                            placeholder="What it is, in one sentence"
                            maxLength={500}
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="service-price">Price label</Label>
                            <Input
                                id="service-price"
                                value={form.priceLabel}
                                onChange={(event) => update("priceLabel", event.target.value)}
                                placeholder="e.g. From ₦1.5M / 4 weeks"
                                maxLength={100}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="service-duration">Duration</Label>
                            <Input
                                id="service-duration"
                                value={form.durationLabel}
                                onChange={(event) => update("durationLabel", event.target.value)}
                                placeholder="e.g. 4 weeks, 90 minutes"
                                maxLength={100}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="service-audience">Audience</Label>
                        <Input
                            id="service-audience"
                            value={form.audience}
                            onChange={(event) => update("audience", event.target.value)}
                            placeholder="Who it's for"
                            maxLength={200}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="service-description">Description</Label>
                        <Textarea
                            id="service-description"
                            value={form.description}
                            onChange={(event) => update("description", event.target.value)}
                            placeholder="What's the engagement, the process, the outcome?"
                            rows={5}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="service-deliverables">Deliverables (one per line)</Label>
                        <Textarea
                            id="service-deliverables"
                            value={form.deliverables}
                            onChange={(event) => update("deliverables", event.target.value)}
                            placeholder={`Brand audit\nCompetitor matrix\nPositioning workshop`}
                            rows={5}
                        />
                    </div>

                    <div className="flex items-center justify-between rounded-2xl border border-brand-deep/5 dark:border-white/5 bg-white/40 dark:bg-white/5 px-4 py-3">
                        <div>
                            <p className="text-sm font-medium text-brand-deep dark:text-brand-cream">
                                Active
                            </p>
                            <p className="text-xs text-brand-accent/60 dark:text-brand-cream/60">
                                Hidden services are excluded from the assistant catalog.
                            </p>
                        </div>
                        <Switch
                            checked={form.isActive}
                            onCheckedChange={(value) => update("isActive", value)}
                        />
                    </div>
                </div>

                <DrawerFooter>
                    <DrawerClose asChild>
                        <Button variant="outline">Cancel</Button>
                    </DrawerClose>
                    <Button
                        onClick={handleSubmit}
                        disabled={!canSubmit}
                        className="bg-brand-deep text-brand-gold-300 dark:bg-brand-gold dark:text-brand-deep"
                    >
                        {submitting ? "Saving..." : isEditing ? "Save changes" : "Add service"}
                    </Button>
                </DrawerFooter>
            </DrawerContent>
        </Drawer>
    )
}
