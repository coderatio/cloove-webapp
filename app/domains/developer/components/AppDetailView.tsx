"use client"

import { useMemo, useState } from "react"
import { ArrowLeft, Copy, KeyRound, Settings2, Webhook } from "lucide-react"
import Link from "next/link"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import { ApiKeysPanel } from "@/app/domains/developer/components/ApiKeysPanel"
import { WebhookSettingsPanel } from "@/app/domains/developer/components/WebhookSettingsPanel"
import { WebhookDeliveriesPanel } from "@/app/domains/developer/components/WebhookDeliveriesPanel"
import { WebhookEndpointsPanel } from "@/app/domains/developer/components/WebhookEndpointsPanel"
import {
    useDeveloperApiKeys,
    useDeveloperApps,
} from "@/app/domains/developer/hooks/useDeveloperApiKeys"
import { copy } from "@/app/domains/developer/utils/apiKeyFormat"
import { cn } from "@/app/lib/utils"

type AppTab = "api-keys" | "webhooks" | "settings"

const TABS: { id: AppTab; label: string; icon: typeof KeyRound }[] = [
    { id: "api-keys", label: "API Keys", icon: KeyRound },
    { id: "webhooks", label: "Webhooks", icon: Webhook },
    { id: "settings", label: "Settings", icon: Settings2 },
]

export function AppDetailView() {
    const params = useParams()
    const searchParams = useSearchParams()
    const router = useRouter()
    const appId = params.id as string
    const activeTab: AppTab = (searchParams.get("tab") as AppTab) ?? "api-keys"

    const { data: apps, isLoading: appsLoading } = useDeveloperApps()
    const { data: keys, isLoading: keysLoading } = useDeveloperApiKeys(appId)

    const app = useMemo(() => (apps ?? []).find((a) => a.id === appId), [apps, appId])
    const activeKeys = useMemo(() => (keys ?? []).filter((k) => k.status === "active"), [keys])

    function onTabChange(tab: AppTab) {
        router.replace(`/developer/apps/${appId}?tab=${tab}`)
    }

    if (appsLoading) {
        return (
            <div className="mx-auto max-w-7xl space-y-5 pb-28">
                <div className="h-24 animate-pulse rounded-3xl bg-white/60" />
                <div className="h-64 animate-pulse rounded-3xl bg-white/60" />
            </div>
        )
    }

    if (!app) {
        return (
            <div className="mx-auto max-w-7xl pb-28">
                <Link
                    href="/developer/apps"
                    className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                    <ArrowLeft className="h-4 w-4" /> Back to apps
                </Link>
                <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-brand-deep/10 bg-white/40 p-16 text-center">
                    <h3 className="text-lg font-semibold">App not found</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                        The app you're looking for doesn't exist or has been deleted.
                    </p>
                    <Link
                        href="/developer/apps"
                        className="mt-5 inline-flex h-10 items-center rounded-2xl bg-brand-deep px-5 text-sm font-semibold text-white"
                    >
                        View all apps
                    </Link>
                </div>
            </div>
        )
    }

    return (
        <div className="mx-auto max-w-7xl space-y-5 pb-28">
            {/* Back link */}
            <Link
                href="/developer/apps"
                className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
                <ArrowLeft className="h-4 w-4" /> Apps
            </Link>

            {/* App header */}
            <div className="rounded-3xl border border-brand-deep/6 bg-white/70 p-6 shadow-sm shadow-brand-deep/[0.025] dark:border-white/8 dark:bg-white/[0.035]">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">                        <div className="min-w-0">
                        <div className="flex items-center gap-3">
                            <h1 className="text-2xl font-semibold tracking-tight">{app.name}</h1>
                            <span className="flex items-center gap-1.5">
                                <span className={`h-2 w-2 rounded-full ${
                                    app.environment === "live" ? "bg-emerald-500" : "bg-amber-500"
                                }`} />
                                <span className={`text-xs font-medium ${
                                    app.environment === "live" ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400"
                                }`}>
                                    {app.environment === "live" ? "Live" : "Test"}
                                </span>
                            </span>
                            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                <span className={`h-1.5 w-1.5 rounded-full ${
                                    app.status === "active" ? "bg-emerald-500" : "bg-muted-foreground/50"
                                }`} />
                                {app.status === "active" ? "Active" : "Disabled"}
                            </span>
                        </div>
                        <button
                            type="button"
                            onClick={() => copy(app.id)}
                            className="mt-1.5 inline-flex items-center gap-1.5 rounded-lg text-xs text-muted-foreground transition-colors hover:text-foreground"
                        >
                            <span className="font-mono">{app.id.slice(0, 8)}…</span>
                            <Copy className="h-3 w-3" />
                        </button>
                        <p className="mt-1.5 text-sm text-muted-foreground">
                            {activeKeys.length} active API key{activeKeys.length !== 1 ? "s" : ""}
                            {keysLoading ? "" : ` · ${keys?.length ?? 0} total`}
                        </p>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 rounded-2xl bg-brand-deep/[0.035] p-1 dark:bg-white/[0.05]">
                {TABS.map((tab) => {
                    const isActive = activeTab === tab.id
                    const Icon = tab.icon
                    return (
                        <button
                            key={tab.id}
                            type="button"
                            onClick={() => onTabChange(tab.id)}
                            className={cn(
                                "flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-all",
                                isActive
                                    ? "bg-white text-brand-deep shadow-sm dark:bg-brand-deep/70 dark:text-brand-cream"
                                    : "text-muted-foreground hover:text-foreground",
                            )}
                        >
                            <Icon className="h-4 w-4" />
                            {tab.label}
                        </button>
                    )
                })}
            </div>

            {/* Tab content */}
            {activeTab === "api-keys" && (
                <ApiKeysPanel keys={keys ?? []} isLoading={keysLoading} appId={appId} />
            )}

            {activeTab === "webhooks" && (
                <div className="space-y-4">
                    <WebhookDeliveriesPanel appId={appId} />
                </div>
            )}

            {activeTab === "settings" && (
                <div className="space-y-4">
                    <WebhookSettingsPanel appId={appId} />
                    <WebhookEndpointsPanel appId={appId} />
                </div>
            )}
        </div>
    )
}
