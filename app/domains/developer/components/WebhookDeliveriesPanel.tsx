"use client"

import { HugeiconsIcon } from "@hugeicons/react"
import { Loading03Icon as Loader2, ReloadIcon as RotateCcw, SentIcon as Send } from "@hugeicons/core-free-icons"
import { Badge } from "@/app/components/ui/badge"
import { Button } from "@/app/components/ui/button"
import {
    useDeveloperWebhookDeliveries,
    useResendDeveloperWebhookDelivery,
} from "@/app/domains/developer/hooks/useDeveloperApiKeys"
import { WEBHOOK_EVENT_LABELS } from "@/app/domains/developer/utils/apiKeyConfig"
import { formatDate } from "@/app/domains/developer/utils/apiKeyFormat"

export function WebhookDeliveriesPanel({ appId }: { appId?: string | null }) {
    const deliveries = useDeveloperWebhookDeliveries(appId)
    const resend = useResendDeveloperWebhookDelivery(appId)
    const rows = deliveries.data ?? []

    return (
        <section className="overflow-hidden rounded-3xl border border-brand-deep/6 bg-white/75 shadow-sm shadow-brand-deep/[0.025] dark:border-white/8 dark:bg-white/[0.035]">
            <div className="border-b border-brand-deep/6 px-5 py-4 dark:border-white/8">
                <h2 className="text-base font-semibold tracking-tight">Webhook deliveries</h2>
                <p className="text-sm text-muted-foreground">Track webhook events Cloove has sent to your callback URLs.</p>
            </div>
            {deliveries.isLoading ? (
                <div className="flex h-40 items-center justify-center"><HugeiconsIcon icon={Loader2} className="h-5 w-5 animate-spin" /></div>
            ) : rows.length === 0 ? (
                <div className="p-10 text-center">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-3xl bg-brand-deep/5 text-muted-foreground dark:bg-white/7">
                        <HugeiconsIcon icon={Send} className="h-5 w-5" />
                    </div>
                    <p className="mt-3 text-sm font-medium">No webhook deliveries yet</p>
                    <p className="text-sm text-muted-foreground">Deliveries will appear here when subscribed events are sent to your callback URLs.</p>
                </div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[820px] text-left text-sm">
                        <thead className="border-b border-brand-deep/6 bg-brand-deep/[0.015] text-[11px] uppercase tracking-wide text-muted-foreground dark:border-white/8 dark:bg-white/[0.025]">
                            <tr>
                                <th className="px-5 py-3">Event</th>
                                <th className="px-4 py-3">URL</th>
                                <th className="px-4 py-3">Env</th>
                                <th className="px-4 py-3">Status</th>
                                <th className="px-4 py-3">Attempts</th>
                                <th className="px-4 py-3">Response</th>
                                <th className="px-5 py-3">Sent</th>
                                <th className="px-5 py-3 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {rows.map((delivery) => (
                                <tr key={delivery.id} className="border-b border-brand-deep/5 last:border-0 dark:border-white/7">
                                    <td className="px-5 py-3 font-medium">{WEBHOOK_EVENT_LABELS[delivery.eventType] ?? delivery.eventType}</td>
                                    <td className="max-w-[320px] truncate px-4 py-3 font-mono text-xs">{delivery.url}</td>
                                    <td className="px-4 py-3"><Badge variant={delivery.environment === "live" ? "success" : "warning"}>{delivery.environment}</Badge></td>
                                    <td className="px-4 py-3"><Badge variant={delivery.status === "delivered" ? "success" : delivery.status === "failed" ? "destructive" : "secondary"}>{delivery.status}</Badge></td>
                                    <td className="px-4 py-3">{delivery.attempts}</td>
                                    <td className="px-4 py-3 text-muted-foreground">{delivery.responseStatus ?? delivery.errorMessage ?? "Pending"}</td>
                                    <td className="px-5 py-3 text-muted-foreground">{formatDate(delivery.deliveredAt ?? delivery.createdAt)}</td>
                                    <td className="px-5 py-3 text-right">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="rounded-2xl"
                                            disabled={delivery.status === "pending" || resend.isPending}
                                            onClick={() => resend.mutate(delivery.id)}
                                        >
                                            <HugeiconsIcon icon={RotateCcw} className="mr-2 h-4 w-4" /> Resend
                                        </Button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </section>
    )
}
