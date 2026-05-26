"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useWhatsAppNumbers } from "@/app/domains/messaging/hooks/useWhatsAppSettings"
import { FlowBuilder } from "@/app/domains/messaging/components/FlowBuilder"
import { GlassCard } from "@/app/components/ui/glass-card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/components/ui/select"
import { formatWhatsAppNumberLabel } from "@/app/domains/messaging/components/FlowsTab"

export default function NewFlowPage() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const numberIdParam = searchParams.get("numberId")

    const { data: numbers } = useWhatsAppNumbers()
    const [selectedNumberId, setSelectedNumberId] = useState(numberIdParam ?? "")

    useEffect(() => {
        if (!selectedNumberId && numbers?.[0]?.id) {
            setSelectedNumberId(numbers[0].id)
        }
    }, [numbers, selectedNumberId])

    // Sync number changes to URL
    const handleNumberChange = (id: string) => {
        setSelectedNumberId(id)
        const params = new URLSearchParams(searchParams.toString())
        params.set("numberId", id)
        router.replace(`/whatsapp/flows/new?${params.toString()}`, { scroll: false })
    }

    if (!numbers?.length) {
        return (
            <GlassCard className="p-8 text-center">
                <p className="text-sm text-muted-foreground">Connect a WhatsApp number first.</p>
            </GlassCard>
        )
    }

    if (!selectedNumberId) {
        return (
            <div className="mx-auto max-w-md pt-12">
                <GlassCard className="p-6 space-y-4">
                    <div>
                        <h2 className="text-sm font-semibold text-foreground">Select a WhatsApp number</h2>
                        <p className="text-xs text-muted-foreground">Choose the number this flow will belong to.</p>
                    </div>
                    <Select value={selectedNumberId} onValueChange={handleNumberChange}>
                        <SelectTrigger>
                            <SelectValue placeholder="Select WhatsApp number" />
                        </SelectTrigger>
                        <SelectContent>
                            {numbers?.map((number) => (
                                <SelectItem key={number.id} value={number.id}>
                                    {formatWhatsAppNumberLabel(number)}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </GlassCard>
            </div>
        )
    }

    return (
        <FlowBuilder
            editingFlow={null}
            selectedNumberId={selectedNumberId}
            onNumberChange={handleNumberChange}
            onSave={() => router.push("/whatsapp?tab=flows")}
            onCancel={() => router.push("/whatsapp?tab=flows")}
        />
    )
}
