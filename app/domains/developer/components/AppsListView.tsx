"use client"

import { useState } from "react"
import { ChevronRight, Code2, Copy, KeyRound, Plus, Webhook } from "lucide-react"
import Link from "next/link"
import { ManagementHeader } from "@/app/components/shared/ManagementHeader"
import { Button } from "@/app/components/ui/button"
import { Input } from "@/app/components/ui/input"

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/app/components/ui/base-dialog"
import {
    type DeveloperApiKeyEnvironment,
    useCreateDeveloperApp,
    useDeveloperApps,
} from "@/app/domains/developer/hooks/useDeveloperApiKeys"
import { copy, formatDate } from "@/app/domains/developer/utils/apiKeyFormat"

export function AppsListView() {
    const { data: apps, isLoading } = useDeveloperApps()
    const [search, setSearch] = useState("")
    const [open, setOpen] = useState(false)

    const filtered = (apps ?? []).filter(
        (app) => app.name.toLowerCase().includes(search.toLowerCase()),
    )

    return (
        <div className="mx-auto max-w-7xl space-y-5 pb-28">
            <ManagementHeader
                title="Apps"
                description="Create and manage developer apps. Each app has its own API keys, webhook endpoints, and settings."
                searchValue={search}
                onSearchChange={setSearch}
                searchPlaceholder="Search apps..."
                addButtonLabel="New app"
                onAddClick={() => setOpen(true)}
                className="rounded-3xl"
            />

            {isLoading ? (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {Array.from({ length: 3 }).map((_, i) => (
                        <div
                            key={i}
                            className="animate-pulse rounded-3xl border border-brand-deep/6 bg-white/60 p-5"
                        >
                            <div className="mb-3 h-5 w-32 rounded-lg bg-brand-deep/8" />
                            <div className="mb-2 h-4 w-20 rounded-lg bg-brand-deep/5" />
                            <div className="h-4 w-40 rounded-lg bg-brand-deep/5" />
                        </div>
                    ))}
                </div>
            ) : filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-brand-deep/10 bg-white/40 p-16 text-center">
                    <div className="flex h-14 w-14 items-center justify-center rounded-3xl bg-brand-deep/5 text-brand-deep dark:bg-white/7 dark:text-brand-cream">
                        <Code2 className="h-7 w-7" />
                    </div>
                    <h3 className="mt-4 text-lg font-semibold">No apps yet</h3>
                    <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                        {search ? "No apps match your search." : "Create your first developer app to start integrating Cloove APIs."}
                    </p>
                    {!search && (
                        <Button className="mt-5 rounded-2xl" onClick={() => setOpen(true)}>
                            <Plus className="mr-2 h-4 w-4" /> Create your first app
                        </Button>
                    )}
                </div>
            ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {filtered.map((app) => (
                        <Link
                            key={app.id}
                            href={`/developer/apps/${app.id}`}
                            className="group relative rounded-3xl border border-brand-deep/6 bg-white/70 p-5 shadow-sm shadow-brand-deep/[0.025] transition-all hover:border-brand-deep/15 hover:shadow-md hover:shadow-brand-deep/[0.04] dark:border-white/8 dark:bg-white/[0.035]"
                        >
                            <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                    <h3 className="truncate text-base font-semibold">{app.name}</h3>
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.preventDefault()
                                            e.stopPropagation()
                                            copy(app.id)
                                        }}
                                        className="mt-1 inline-flex items-center gap-1.5 rounded-lg text-xs text-muted-foreground transition-colors hover:text-foreground"
                                    >
                                        <span className="font-mono">{app.id.slice(0, 8)}…</span>
                                        <Copy className="h-3 w-3" />
                                    </button>
                                    <p className="mt-1 text-xs text-muted-foreground">
                                        Created {formatDate(app.createdAt)}
                                    </p>
                                </div>
                                <span className="flex shrink-0 items-center gap-1.5">
                                    <span className={`h-2 w-2 rounded-full ${
                                        app.environment === "live" ? "bg-emerald-500" : "bg-amber-500"
                                    }`} />
                                    <span className={`text-xs font-medium ${
                                        app.environment === "live" ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400"
                                    }`}>
                                        {app.environment === "live" ? "Live" : "Test"}
                                    </span>
                                </span>
                            </div>

                            <div className="mt-4 flex items-center gap-4 text-sm text-muted-foreground">
                                <span className="flex items-center gap-1.5">
                                    <KeyRound className="h-3.5 w-3.5" />
                                    <span>Keys</span>
                                </span>
                                <span className="flex items-center gap-1.5">
                                    <Webhook className="h-3.5 w-3.5" />
                                    <span>Webhooks</span>
                                </span>
                            </div>

                            <div className="mt-5 flex items-center justify-between border-t border-brand-deep/5 pt-3 dark:border-white/7">
                                <span className={`flex items-center gap-1.5 text-xs ${app.status === "active" ? "text-emerald-600" : "text-muted-foreground"}`}>
                                    <span className={`h-1.5 w-1.5 rounded-full ${app.status === "active" ? "bg-emerald-500" : "bg-muted-foreground/50"}`} />
                                    {app.status === "active" ? "Active" : "Disabled"}
                                </span>
                                <ChevronRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                            </div>
                        </Link>
                    ))}
                </div>
            )}

            <CreateAppDialog open={open} onOpenChange={setOpen} />
        </div>
    )
}

function CreateAppDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
    const createApp = useCreateDeveloperApp()
    const [name, setName] = useState("")
    const [environment, setEnvironment] = useState<DeveloperApiKeyEnvironment>("test")

    async function submit() {
        await createApp.mutateAsync({ name, environment })
        setName("")
        setEnvironment("test")
        onOpenChange(false)
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md gap-0 p-0">
                <DialogHeader className="px-6 pt-6 pb-3">
                    <DialogTitle>Create developer app</DialogTitle>
                    <DialogDescription>
                        Use separate apps to isolate API keys, webhooks, and settings per integration or environment.
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 px-6 py-3">
                    <Input
                        value={name}
                        onChange={(event) => setName(event.target.value)}
                        placeholder="e.g. Production integration"
                        className="h-11 rounded-xl"
                    />
                    <div className="grid grid-cols-2 gap-2 rounded-2xl bg-brand-deep/4 p-1 dark:bg-white/5">
                        {(["test", "live"] as const).map((env) => (
                            <button
                                key={env}
                                type="button"
                                onClick={() => setEnvironment(env)}
                                className={`h-9 rounded-xl px-3 text-sm font-semibold capitalize transition-colors ${
                                    environment === env
                                        ? "bg-white text-brand-deep shadow-sm dark:bg-brand-deep/70 dark:text-brand-cream"
                                        : "text-muted-foreground hover:text-foreground"
                                }`}
                            >
                                {env}
                            </button>
                        ))}
                    </div>
                </div>
                <DialogFooter className="gap-2 border-t border-brand-deep/6 px-6 pt-3 pb-6 dark:border-white/8">
                    <Button variant="outline" className="rounded-2xl" onClick={() => onOpenChange(false)}>
                        Cancel
                    </Button>
                    <Button
                        className="rounded-2xl"
                        disabled={!name.trim() || createApp.isPending}
                        onClick={() => void submit()}
                    >
                        {createApp.isPending ? (
                            <span className="flex items-center gap-2">
                                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                                Creating...
                            </span>
                        ) : (
                            <span className="flex items-center gap-2">
                                <Plus className="h-4 w-4" /> Create app
                            </span>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
