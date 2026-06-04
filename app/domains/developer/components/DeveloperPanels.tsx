"use client"

import { useState } from "react"
import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react"
import { Calendar03Icon as CalendarIcon, CheckIcon as Check, CopyIcon as Copy, ExternalLinkIcon as ExternalLink, Loading03Icon as Loader2, UserIcon as User, Cancel01Icon as X } from "@hugeicons/core-free-icons"
import { useDeveloperEvents, useDeveloperUsage } from "@/app/domains/developer/hooks/useDeveloperApiKeys"
import type { DeveloperApiKeyEvent } from "@/app/domains/developer/hooks/useDeveloperApiKeys"
import { copy, formatDate } from "@/app/domains/developer/utils/apiKeyFormat"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/app/components/ui/base-dialog"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/app/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/app/components/ui/popover"
import { Calendar } from "@/app/components/ui/calendar"
import { Button } from "@/app/components/ui/button"
import { cn } from "@/app/lib/utils"

const EVENT_TYPE_OPTIONS = [
    { value: "all", label: "All events" },
    { value: "api_key.created", label: "API Key Created" },
    { value: "api_key.updated", label: "API Key Updated" },
    { value: "api_key.rotated", label: "API Key Rotated" },
    { value: "api_key.revoked", label: "API Key Revoked" },
    { value: "api_key.deleted", label: "API Key Deleted" },
    { value: "webhook_endpoint.created", label: "Webhook Created" },
    { value: "webhook_endpoint.updated", label: "Webhook Updated" },
    { value: "webhook_endpoint.disabled", label: "Webhook Disabled" },
    { value: "webhook_secret.rotated", label: "Signing Secret Rotated" },
    { value: "webhook_delivery.resend_requested", label: "Webhook Resend Requested" },
]

export function Metric({ icon: Icon, label, value }: { icon: IconSvgElement; label: string; value: string }) {
    return (
        <div className="rounded-3xl border border-brand-deep/6 bg-white/70 p-4 shadow-sm shadow-brand-deep/[0.025] dark:border-white/8 dark:bg-white/[0.035]">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <span className="flex h-8 w-8 items-center justify-center rounded-2xl bg-brand-deep/5 text-brand-deep dark:bg-white/7 dark:text-brand-cream">
                    <HugeiconsIcon icon={Icon} className="h-4 w-4" />
                </span>
                {label}
            </div>
            <div className="mt-3 text-xl font-semibold text-foreground">{value}</div>
        </div>
    )
}

export function UsagePanel() {
    const usage = useDeveloperUsage(30)
    const rows = usage.data ?? []
    return (
        <section className="overflow-hidden rounded-3xl border border-brand-deep/6 bg-white/75 shadow-sm shadow-brand-deep/[0.025] dark:border-white/8 dark:bg-white/[0.035]">
            <div className="px-5 pt-5">
                <h2 className="text-base font-semibold tracking-tight">Usage</h2>
            </div>
            <div className="mt-4 overflow-x-auto">
                <table className="w-full min-w-[680px] text-left text-sm">
                    <thead className="border-b border-brand-deep/6 text-[11px] uppercase tracking-wide text-muted-foreground dark:border-white/8">
                        <tr><th className="px-5 py-3">Date</th><th className="px-3">Env</th><th className="px-3">Endpoint</th><th className="px-3">Status</th><th className="px-3">Requests</th><th className="px-5">Errors</th></tr>
                    </thead>
                    <tbody>{rows.map((row, index) => (
                        <tr key={`${row.date}-${row.endpoint}-${index}`} className="border-b border-brand-deep/5 last:border-0 dark:border-white/7">
                            <td className="px-5 py-3">{formatDate(row.date)}</td><td className="px-3"><EnvironmentBadge env={row.environment} /></td><td className="px-3 font-mono text-xs">{row.method} {row.endpoint}</td><td className="px-3">{row.statusFamily}</td><td className="px-3">{row.requestCount}</td><td className="px-5">{row.errorCount}</td>
                        </tr>
                    ))}</tbody>
                </table>
                {usage.isLoading && <div className="py-10 text-center"><HugeiconsIcon icon={Loader2} className="mx-auto h-5 w-5 animate-spin" /></div>}
                {!usage.isLoading && rows.length === 0 && <p className="py-10 text-center text-sm text-muted-foreground">Usage appears after API requests are made.</p>}
            </div>
        </section>
    )
}

export function EventDetailDialog({
    event: eventProp,
    open,
    onOpenChange,
}: {
    event: DeveloperApiKeyEvent | null
    open: boolean
    onOpenChange: (open: boolean) => void
}) {
    const [copied, setCopied] = useState(false)

    if (!eventProp) return null
    const event = eventProp

    function handleCopyJson() {
        if (!event.metadata) return
        copy(JSON.stringify(event.metadata, null, 2))
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-h-[84vh] max-w-lg gap-0 p-0 sm:max-h-[86vh]">
                <DialogHeader className="shrink-0 px-6 pt-6 pb-3">
                    <DialogTitle>{event.title}</DialogTitle>
                    <DialogDescription>
                        <span className="font-mono text-xs text-muted-foreground">{event.eventType}</span>
                    </DialogDescription>
                </DialogHeader>

                <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-6 py-3">
                    {/* Description */}
                    {event.description && (
                        <div>
                            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Description</p>
                            <p className="mt-1 text-sm">{event.description}</p>
                        </div>
                    )}

                    {/* Actor */}
                    <div>
                        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Performed by</p>
                        <div className="mt-1 flex items-center gap-2 text-sm">
                            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-deep/5 text-brand-deep dark:bg-white/7 dark:text-brand-cream">
                                <HugeiconsIcon icon={User} className="h-3.5 w-3.5" />
                            </span>
                            {event.actorName ? (
                                <span>{event.actorName}</span>
                            ) : event.actorUserId ? (
                                <span className="font-mono text-xs text-muted-foreground">{event.actorUserId}</span>
                            ) : (
                                <span className="text-muted-foreground">System / API key</span>
                            )}
                        </div>
                    </div>

                    {/* IP */}
                    <div>
                        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">IP address</p>
                        <p className="mt-1 text-sm font-mono text-muted-foreground">{event.ipAddress ?? "—"}</p>
                    </div>

                    {/* Timestamp */}
                    <div>
                        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Timestamp</p>
                        <p className="mt-1 text-sm text-muted-foreground">{formatDate(event.createdAt)}</p>
                    </div>

                    {/* Metadata */}
                    {event.metadata && Object.keys(event.metadata).length > 0 && (
                        <div className="pb-6">
                            <div className="flex items-center justify-between">
                                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Event data</p>
                                <button
                                    type="button"
                                    onClick={handleCopyJson}
                                    className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-brand-deep/5 hover:text-brand-deep dark:hover:bg-white/[0.07] dark:hover:text-brand-cream"
                                >
                                    {copied ? (
                                        <>
                                            <HugeiconsIcon icon={Check} className="h-3 w-3 text-emerald-500" />
                                            <span className="text-emerald-600 dark:text-emerald-400">Copied</span>
                                        </>
                                    ) : (
                                        <>
                                            <HugeiconsIcon icon={Copy} className="h-3 w-3" />
                                            Copy
                                        </>
                                    )}
                                </button>
                            </div>
                            <pre className="mt-2 max-h-48 overflow-auto rounded-xl bg-brand-deep/[0.035] p-3 font-mono text-xs leading-relaxed text-brand-deep dark:bg-white/[0.055] dark:text-brand-cream [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-brand-deep/15 [&::-webkit-scrollbar-thumb]:dark:bg-white/15 [&::-webkit-scrollbar-track]:bg-transparent">
                                {JSON.stringify(event.metadata, null, 2)}
                            </pre>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    )
}

export function EventsPanel() {
    const [selectedEvent, setSelectedEvent] = useState<DeveloperApiKeyEvent | null>(null)
    const [eventType, setEventType] = useState<string | null>(null)
    const [startDate, setStartDate] = useState<Date | undefined>()
    const [endDate, setEndDate] = useState<Date | undefined>()

    const events = useDeveloperEvents({
        eventType: eventType ?? undefined,
        startDate: startDate?.toISOString(),
        endDate: endDate?.toISOString(),
    })

    function clearFilters() {
        setEventType(null)
        setStartDate(undefined)
        setEndDate(undefined)
    }

    const hasActiveFilters = eventType !== null || startDate || endDate

    return (
        <section className="rounded-3xl border border-brand-deep/6 bg-white/75 shadow-sm shadow-brand-deep/[0.025] dark:border-white/8 dark:bg-white/[0.035]">
            <div className="p-5 pb-0">
                <div className="flex items-center justify-between">
                    <h2 className="text-base font-semibold tracking-tight">Events</h2>
                    {hasActiveFilters && (
                        <button
                            type="button"
                            onClick={clearFilters}
                            className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
                        >
                            <HugeiconsIcon icon={X} className="h-3 w-3" />
                            Clear filters
                        </button>
                    )}
                </div>

                {/* Filters */}
                <div className="mt-3 flex flex-wrap items-center gap-2">
                    <Select value={eventType ?? "all"} onValueChange={(v) => setEventType(v === "all" ? null : v)}>
                        <SelectTrigger className="h-9 w-[180px] rounded-xl text-xs">
                            <SelectValue placeholder="All events" />
                        </SelectTrigger>
                        <SelectContent>
                            {EVENT_TYPE_OPTIONS.map((opt) => (
                                <SelectItem key={opt.value} value={opt.value}>
                                    {opt.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Popover>
                        <PopoverTrigger asChild>
                            <Button
                                variant="glass"
                                size="sm"
                                className={cn(
                                    "h-9 rounded-xl text-xs font-normal",
                                    !startDate && "text-muted-foreground"
                                )}
                            >
                                <HugeiconsIcon icon={CalendarIcon} className="mr-1.5 h-3.5 w-3.5" />
                                {startDate ? formatDate(startDate.toISOString()) : "Start date"}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                                mode="single"
                                selected={startDate}
                                onSelect={setStartDate}
                                initialFocus
                            />
                        </PopoverContent>
                    </Popover>

                    <span className="text-xs text-muted-foreground">→</span>

                    <Popover>
                        <PopoverTrigger asChild>
                            <Button
                                variant="glass"
                                size="sm"
                                className={cn(
                                    "h-9 rounded-xl text-xs font-normal",
                                    !endDate && "text-muted-foreground"
                                )}
                            >
                                <HugeiconsIcon icon={CalendarIcon} className="mr-1.5 h-3.5 w-3.5" />
                                {endDate ? formatDate(endDate.toISOString()) : "End date"}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                                mode="single"
                                selected={endDate}
                                onSelect={setEndDate}
                                initialFocus
                            />
                        </PopoverContent>
                    </Popover>
                </div>
            </div>

            <div className="mt-4 space-y-3 px-5 pb-5">
                {events.data?.pages.flatMap((page) => page.events).map((event) => (
                    <button
                        key={event.id}
                        type="button"
                        onClick={() => setSelectedEvent(event)}
                        className="w-full rounded-2xl border border-brand-deep/6 bg-white/50 p-3 text-left transition-colors hover:bg-white/80 dark:border-white/8 dark:bg-white/[0.025] dark:hover:bg-white/[0.055]"
                    >
                        <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                                <p className="truncate text-sm font-medium">{event.title}</p>
                                <p className="mt-0.5 text-xs text-muted-foreground">
                                    {event.eventType} · {formatDate(event.createdAt)} · {event.ipAddress ?? "No IP"}
                                </p>
                            </div>
                            <HugeiconsIcon icon={ExternalLink} className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                        </div>
                    </button>
                ))}
                {events.isLoading && <div className="py-10 text-center"><HugeiconsIcon icon={Loader2} className="mx-auto h-5 w-5 animate-spin" /></div>}
                {!events.isLoading && (events.data?.pages.flatMap((p) => p.events).length ?? 0) === 0 && (
                    <p className="py-10 text-center text-sm text-muted-foreground">
                        {hasActiveFilters ? "No events match your filters." : "No developer events yet."}
                    </p>
                )}

                {/* Load more */}
                {events.hasNextPage && (
                    <div className="flex justify-center pt-2">
                        <button
                            type="button"
                            onClick={() => events.fetchNextPage()}
                            disabled={events.isFetchingNextPage}
                            className="inline-flex items-center gap-2 rounded-xl border border-brand-deep/8 bg-white/60 px-4 py-2 text-xs font-medium text-muted-foreground transition-all hover:bg-white hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/10 dark:bg-white/[0.04] dark:hover:bg-white/[0.07]"
                        >
                            {events.isFetchingNextPage ? (
                                <>
                                    <HugeiconsIcon icon={Loader2} className="h-3.5 w-3.5 animate-spin" />
                                    Loading…
                                </>
                            ) : (
                                "Load more"
                            )}
                        </button>
                    </div>
                )}
            </div>

            <EventDetailDialog
                event={selectedEvent}
                open={selectedEvent !== null}
                onOpenChange={(open) => { if (!open) setSelectedEvent(null) }}
            />
        </section>
    )
}

function EnvironmentBadge({ env }: { env: "test" | "live" }) {
    return (
        <span className="inline-flex items-center gap-1.5">
            <span className={`h-1.5 w-1.5 rounded-full ${env === "live" ? "bg-emerald-500" : "bg-amber-500"}`} />
            <span className={`text-xs font-medium ${env === "live" ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400"}`}>
                {env === "live" ? "Live" : "Test"}
            </span>
        </span>
    )
}
