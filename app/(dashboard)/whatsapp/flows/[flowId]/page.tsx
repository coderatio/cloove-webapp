"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useWhatsAppNumbers } from "@/app/domains/messaging/hooks/useWhatsAppSettings"
import { useWhatsAppFlows } from "@/app/domains/messaging/hooks/useWhatsAppInbox"
import { FlowBuilder } from "@/app/domains/messaging/components/FlowBuilder"
import { GlassCard } from "@/app/components/ui/glass-card"
import { Loader2 } from "lucide-react"

export default function EditFlowPage({ params }: { params: Promise<{ flowId: string }> }) {
    const router = useRouter()
    const searchParams = useSearchParams()
    const numberIdParam = searchParams.get("numberId")

    const { data: numbers } = useWhatsAppNumbers()
    const [selectedNumberId, setSelectedNumberId] = useState(numberIdParam ?? "")
    const [flowId, setFlowId] = useState<string | null>(null)

    useEffect(() => {
        params.then((p) => setFlowId(p.flowId))
    }, [params])

    const { data: flowResults, isLoading: flowsLoading } = useWhatsAppFlows(selectedNumberId || null)
    const flows = flowResults?.data ?? []

    useEffect(() => {
        if (!selectedNumberId && numbers?.[0]?.id && !numberIdParam) {
            setSelectedNumberId(numbers[0].id)
        }
    }, [numbers, selectedNumberId, numberIdParam])

    const editingFlow = flowId ? flows.find((f) => f.id === flowId) ?? null : null

    const handleNumberChange = (id: string) => {
        setSelectedNumberId(id)
        const params = new URLSearchParams(searchParams.toString())
        params.set("numberId", id)
        router.replace(`/whatsapp/flows/${flowId}?${params.toString()}`, { scroll: false })
    }

    if (!flowId) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
        )
    }

    if (selectedNumberId && flowsLoading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
        )
    }

    if (selectedNumberId && !flowsLoading && flows.length > 0 && !editingFlow) {
        return (
            <GlassCard className="p-8 text-center">
                <p className="text-sm text-muted-foreground">Flow not found.</p>
            </GlassCard>
        )
    }

    if (!selectedNumberId) {
        return (
            <GlassCard className="p-8 text-center">
                <p className="text-sm text-muted-foreground">Select a WhatsApp number to view flows.</p>
            </GlassCard>
        )
    }

    return (
        <FlowBuilder
            editingFlow={editingFlow}
            selectedNumberId={selectedNumberId}
            onNumberChange={handleNumberChange}
            onSave={() => router.push("/whatsapp?tab=flows")}
            onCancel={() => router.push("/whatsapp?tab=flows")}
        />
    )
}
