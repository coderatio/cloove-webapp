"use client"

import { useMemo, useState } from "react"
import { Activity, BarChart3, ChevronRight, Code2, Copy, ExternalLink, KeyRound, Terminal, Zap, Sparkles } from "lucide-react"
import Link from "next/link"
import { ManagementHeader } from "@/app/components/shared/ManagementHeader"
import { Button } from "@/app/components/ui/button"

import {
    useDeveloperApiKeys,
    useDeveloperApps,
    useDeveloperEvents,
    useDeveloperUsage,
} from "@/app/domains/developer/hooks/useDeveloperApiKeys"
import { copy, formatDate } from "@/app/domains/developer/utils/apiKeyFormat"
import type { DeveloperApiKeyEvent } from "@/app/domains/developer/hooks/useDeveloperApiKeys"
import { EventDetailDialog } from "@/app/domains/developer/components/DeveloperPanels"

export function DeveloperView() {
    const { data: apps, isLoading: appsLoading } = useDeveloperApps()
    const { data: keys, isLoading: keysLoading } = useDeveloperApiKeys()
    const events = useDeveloperEvents()
    const { data: usage } = useDeveloperUsage(7)
    const [selectedEvent, setSelectedEvent] = useState<DeveloperApiKeyEvent | null>(null)

    const activeKeys = useMemo(() => (keys ?? []).filter((k) => k.status === "active"), [keys])
    const recentEvents = useMemo(
        () => (events.data?.pages.flatMap((p) => p.events) ?? []).slice(0, 5),
        [events.data],
    )
    const requestsToday = useMemo(
        () =>
            (usage ?? [])
                .filter((row) => row.date?.slice(0, 10) === new Date().toISOString().slice(0, 10))
                .reduce((sum, row) => sum + row.requestCount, 0),
        [usage],
    )
    const lastUsed = useMemo(
        () =>
            activeKeys
                .map((key) => key.lastUsedAt)
                .filter(Boolean)
                .sort()
                .at(-1),
        [activeKeys],
    )

    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "https://api.clooveai.com"

    return (
        <div className="mx-auto max-w-7xl space-y-5 pb-28">
            <ManagementHeader
                title="Developer"
                description="Build with Cloove APIs. Manage your apps, keys, and integrations."
                className="rounded-3xl"
            />

            {/* Quick Stats */}
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <MetricCard
                    icon={Code2}
                    label="Total apps"
                    value={String(apps?.length ?? 0)}
                    loading={appsLoading}
                />
                <MetricCard
                    icon={KeyRound}
                    label="Active keys"
                    value={String(activeKeys.length)}
                    loading={keysLoading}
                />
                <MetricCard
                    icon={BarChart3}
                    label="Requests today"
                    value={String(requestsToday)}
                    loading={false}
                />
                <MetricCard
                    icon={Zap}
                    label="Last API activity"
                    value={formatDate(lastUsed)}
                    loading={false}
                />
            </div>

            {/* Quick Start Guide */}
            <section className="rounded-3xl border border-brand-deep/6 bg-white/70 p-6 shadow-sm shadow-brand-deep/[0.025] dark:border-white/8 dark:bg-white/[0.035]">
                <div className="flex items-center gap-2.5">
                    <span className="flex h-8 w-8 items-center justify-center rounded-2xl bg-brand-deep/5 text-brand-deep dark:bg-white/7 dark:text-brand-cream">
                        <Terminal className="h-4 w-4" />
                    </span>
                    <h2 className="text-base font-semibold tracking-tight">Quick start</h2>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                    Authenticate with a bearer token. Create an app and generate an API key to get started.
                </p>
                <div className="mt-4 overflow-hidden rounded-2xl bg-brand-deep/[0.035] dark:bg-white/[0.055]">
                    <div className="flex items-center gap-2 border-b border-brand-deep/6 px-4 py-2.5 dark:border-white/8">
                        <span className="text-xs font-semibold text-muted-foreground">cURL</span>
                        <span className="ml-auto flex items-center gap-1.5 text-xs text-muted-foreground">
                            <span className="h-2 w-2 rounded-full bg-emerald-500" />
                            {baseUrl}
                        </span>
                    </div>
                    <code className="block overflow-x-auto p-4 text-xs leading-relaxed text-brand-deep dark:text-brand-cream">
                        curl {baseUrl}/v1/vox/health \<br />
                        {"  "}-H &quot;Authorization: Bearer clv_test_...&quot;
                    </code>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                    <Link href="/developer/apps">
                        <Button className="rounded-2xl" size="sm">
                            <KeyRound className="mr-2 h-4 w-4" /> Create API key
                        </Button>
                    </Link>
                    <Link href="/developer/usage">
                        <Button variant="outline" className="rounded-2xl" size="sm">
                            View API usage
                        </Button>
                    </Link>
                </div>
            </section>

            <div className="grid gap-4 lg:grid-cols-[minmax(0,1.25fr)_minmax(320px,1fr)]">
                {/* Apps overview */}
                <section className="rounded-3xl border border-brand-deep/6 bg-white/70 p-6 shadow-sm shadow-brand-deep/[0.025] dark:border-white/8 dark:bg-white/[0.035]">
                    <div className="flex items-center justify-between">
                        <h2 className="text-base font-semibold tracking-tight">Your apps</h2>
                        <Link
                            href="/developer/apps"
                            className="flex items-center gap-1 text-sm font-medium text-brand-deep transition-colors hover:text-brand-deep/70"
                        >
                            View all <ChevronRight className="h-3.5 w-3.5" />
                        </Link>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                        {apps?.length
                            ? `${apps.length} app${apps.length !== 1 ? "s" : ""} — manage API keys and webhooks per app.`
                            : "Create an app to start integrating."}
                    </p>

                    {appsLoading ? (
                        <div className="mt-4 space-y-3">
                            {Array.from({ length: 2 }).map((_, i) => (
                                <div
                                    key={i}
                                    className="h-16 animate-pulse rounded-2xl bg-brand-deep/5"
                                />
                            ))}
                        </div>
                    ) : (apps ?? []).length === 0 ? (
                        <div className="mt-6 flex flex-col items-center gap-3 rounded-2xl border border-dashed border-brand-deep/8 bg-white/40 p-6 text-center dark:border-white/10">
                            <Code2 className="h-8 w-8 text-muted-foreground" />
                            <div>
                                <p className="text-sm font-medium">No apps yet</p>
                                <p className="text-xs text-muted-foreground">
                                    Create your first developer app to get API keys.
                                </p>
                            </div>
                            <Link href="/developer/apps">
                                <Button size="sm" className="rounded-2xl">
                                    Create app
                                </Button>
                            </Link>
                        </div>
                    ) : (
                        <div className="mt-4 space-y-2">
                            {(apps ?? []).slice(0, 5).map((app) => (
                                <Link
                                    key={app.id}
                                    href={`/developer/apps/${app.id}`}
                                    className="group flex items-center justify-between rounded-2xl border border-brand-deep/5 bg-white/50 p-3.5 transition-colors hover:bg-white/80 dark:border-white/7 dark:bg-white/[0.02]"
                                >
                                    <div className="min-w-0">
                                        <p className="truncate text-sm font-medium">{app.name}</p>
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.preventDefault()
                                                e.stopPropagation()
                                                copy(app.id)
                                            }}
                                            className="mt-0.5 inline-flex items-center gap-1 rounded-lg text-xs text-muted-foreground transition-colors hover:text-foreground"
                                        >
                                            <span className="font-mono">{app.id.slice(0, 8)}…</span>
                                            <Copy className="h-2.5 w-2.5" />
                                        </button>
                                        <p className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                                            <span className={`h-1.5 w-1.5 rounded-full ${app.environment === "live" ? "bg-emerald-500" : "bg-amber-500"}`} />
                                            {app.environment === "live" ? "Live" : "Test"} environment
                                        </p>
                                    </div>
                                    <div className="flex shrink-0 items-center gap-2">
                                        <ChevronRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                                    </div>
                                </Link>
                            ))}
                            {(apps ?? []).length > 5 && (
                                <Link
                                    href="/developer/apps"
                                    className="block pt-1 text-center text-sm font-medium text-brand-deep transition-colors hover:text-brand-deep/70"
                                >
                                    + {(apps ?? []).length - 5} more app{(apps ?? []).length - 5 !== 1 ? "s" : ""}
                                </Link>
                            )}
                        </div>
                    )}
                </section>

                {/* Recent activity */}
                <section className="rounded-3xl border border-brand-deep/6 bg-white/70 p-6 shadow-sm shadow-brand-deep/[0.025] dark:border-white/8 dark:bg-white/[0.035]">
                    <div className="flex items-center justify-between">
                        <h2 className="text-base font-semibold tracking-tight">Recent activity</h2>
                        <Link
                            href="/developer/events"
                            className="flex items-center gap-1 text-sm font-medium text-brand-deep transition-colors hover:text-brand-deep/70"
                        >
                            View all <ChevronRight className="h-3.5 w-3.5" />
                        </Link>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">Latest developer events across all apps.</p>

                    <div className="mt-4 space-y-2">
                        {events.isLoading ? (
                            Array.from({ length: 3 }).map((_, i) => (
                                <div key={i} className="h-14 animate-pulse rounded-2xl bg-brand-deep/5" />
                            ))
                        ) : recentEvents.length === 0 ? (
                            <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-brand-deep/8 bg-white/40 p-6 text-center dark:border-white/10">
                                <Activity className="h-8 w-8 text-muted-foreground" />
                                <div>
                                    <p className="text-sm font-medium">No activity yet</p>
                                    <p className="text-xs text-muted-foreground">
                                        Events will appear here when you make API calls or manage keys.
                                    </p>
                                </div>
                            </div>
                        ) : (
                            recentEvents.map((event) => (
                                <button
                                    key={event.id}
                                    type="button"
                                    onClick={() => setSelectedEvent(event)}
                                    className="w-full rounded-2xl border border-brand-deep/5 bg-white/50 p-3 text-left transition-colors hover:bg-white/80 dark:border-white/7 dark:bg-white/[0.02]"
                                >
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="min-w-0">
                                            <p className="truncate text-sm font-medium">{event.title}</p>
                                            <p className="mt-0.5 text-xs text-muted-foreground">
                                                {event.eventType} &middot; {formatDate(event.createdAt)}
                                                {event.ipAddress ? ` · ${event.ipAddress}` : ""}
                                            </p>
                                        </div>
                                        <ExternalLink className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                                    </div>
                                </button>
                            ))
                        )}
                    </div>
                </section>
            </div>
            <EventDetailDialog
                event={selectedEvent}
                open={selectedEvent !== null}
                onOpenChange={(open) => { if (!open) setSelectedEvent(null) }}
            />
        </div>
    )
}

function MetricCard({
    icon: Icon,
    label,
    value,
    loading,
}: {
    icon: typeof Code2
    label: string
    value: string
    loading: boolean
}) {
    return (
        <div className="rounded-3xl border border-brand-deep/6 bg-white/70 p-4 shadow-sm shadow-brand-deep/[0.025] dark:border-white/8 dark:bg-white/[0.035]">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <span className="flex h-8 w-8 items-center justify-center rounded-2xl bg-brand-deep/5 text-brand-deep dark:bg-white/7 dark:text-brand-cream">
                    <Icon className="h-4 w-4" />
                </span>
                {label}
            </div>
            <div className="mt-3 text-xl font-semibold text-foreground">
                {loading ? (
                    <span className="inline-block h-6 w-12 animate-pulse rounded-lg bg-brand-deep/5" />
                ) : (
                    value
                )}
            </div>
        </div>
    )
}
