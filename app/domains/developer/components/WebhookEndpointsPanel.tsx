"use client"

import { useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { Alert02Icon as AlertTriangle, CheckIcon as Check, GlobeIcon as Globe, Loading03Icon as Loader2, MoreVerticalIcon as MoreVertical, PencilIcon as Pencil, PlusSignIcon as Plus, Delete02Icon as Trash2, WebhookIcon as Webhook } from "@hugeicons/core-free-icons"
import { Badge } from "@/app/components/ui/badge"
import { Button } from "@/app/components/ui/button"
import { Input } from "@/app/components/ui/input"
import { Checkbox } from "@/app/components/ui/checkbox"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/app/components/ui/base-dialog"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/app/components/ui/dropdown-menu"
import {
    DEVELOPER_WEBHOOK_EVENTS,
    type DeveloperWebhookEndpoint,
    type DeveloperApiKeyEnvironment,
    type DeveloperWebhookEvent,
    useDeveloperWebhookEndpoints,
    useCreateDeveloperWebhookEndpoint,
    useUpdateDeveloperWebhookEndpoint,
    useDisableDeveloperWebhookEndpoint,
} from "@/app/domains/developer/hooks/useDeveloperApiKeys"
import { formatDate } from "@/app/domains/developer/utils/apiKeyFormat"

const WEBHOOK_EVENT_LABELS: Record<DeveloperWebhookEvent, string> = {
    "vox.call.started": "Call started",
    "vox.call.completed": "Call completed",
    "vox.call.failed": "Call failed",
    "vox.recording.ready": "Recording ready",
    "vox.agent.updated": "Agent updated",
}

export function WebhookEndpointsPanel({ appId }: { appId?: string | null }) {
    const { data: endpoints, isLoading } = useDeveloperWebhookEndpoints(appId)
    const [showDialog, setShowDialog] = useState(false)
    const [editingEndpoint, setEditingEndpoint] = useState<DeveloperWebhookEndpoint | null>(null)

    function openCreateDialog() {
        setEditingEndpoint(null)
        setShowDialog(true)
    }

    function openEditDialog(endpoint: DeveloperWebhookEndpoint) {
        setEditingEndpoint(endpoint)
        setShowDialog(true)
    }

    function onDialogClose() {
        setShowDialog(false)
        setEditingEndpoint(null)
    }

    return (
        <section className="overflow-hidden rounded-3xl border border-brand-deep/6 bg-white/75 shadow-sm shadow-brand-deep/[0.025] dark:border-white/8 dark:bg-white/[0.035]">
            <div className="flex flex-col gap-3 border-b border-brand-deep/6 px-5 py-4 dark:border-white/8 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h2 className="text-base font-semibold tracking-tight">Webhook callback URLs</h2>
                    <p className="text-sm text-muted-foreground">Configure URLs where Cloove sends event notifications.</p>
                </div>
                <Button className="h-10 rounded-2xl px-4" onClick={openCreateDialog}><HugeiconsIcon icon={Plus} className="mr-2 h-4 w-4" /> Add endpoint</Button>
            </div>

            <WebhookEndpointDialog
                key={editingEndpoint?.id ?? "create"}
                open={showDialog}
                onOpenChange={onDialogClose}
                endpoint={editingEndpoint}
                appId={appId}
            />

            {isLoading ? (
                <div className="flex h-40 items-center justify-center"><HugeiconsIcon icon={Loader2} className="h-5 w-5 animate-spin text-muted-foreground" /></div>
            ) : !endpoints || endpoints.length === 0 ? (
                <div className="p-10 text-center">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-3xl bg-brand-deep/5 text-muted-foreground dark:bg-white/7">
                        <HugeiconsIcon icon={Webhook} className="h-5 w-5" />
                    </div>
                    <p className="mt-3 text-sm font-medium">No webhook endpoints</p>
                    <p className="text-sm text-muted-foreground">Add a callback URL to start receiving webhook events.</p>
                </div>
            ) : (
                <div className="divide-y divide-brand-deep/5 dark:divide-white/7">
                    {endpoints.map((endpoint) => (
                        <EndpointRow
                            key={endpoint.id}
                            endpoint={endpoint}
                            onEdit={() => openEditDialog(endpoint)}
                        />
                    ))}
                </div>
            )}
        </section>
    )
}

function EndpointRow({ endpoint, onEdit }: { endpoint: DeveloperWebhookEndpoint; onEdit: () => void }) {
    const disable = useDisableDeveloperWebhookEndpoint()
    const isActive = endpoint.status === "active"

    return (
        <div className="px-5 py-4 transition-colors hover:bg-brand-deep/[0.015] dark:hover:bg-white/[0.02]">
            <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold">{endpoint.name}</span>
                        <Badge variant={endpoint.environment === "live" ? "success" : "warning"}>
                            {endpoint.environment}
                        </Badge>
                        <Badge variant={isActive ? "secondary" : "outline"}>
                            {isActive ? "Active" : "Disabled"}
                        </Badge>
                    </div>
                    <div className="mt-2 flex items-center gap-2">
                        <HugeiconsIcon icon={Globe} className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                        <code className="block truncate font-mono text-xs text-muted-foreground">{endpoint.url}</code>
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-1.5">
                        {endpoint.events.map((event) => (
                            <Badge key={event} variant="outline" className="text-[10px]">
                                {WEBHOOK_EVENT_LABELS[event] ?? event}
                            </Badge>
                        ))}
                    </div>
                    <p className="mt-1.5 text-xs text-muted-foreground">
                        {endpoint.lastDeliveredAt
                            ? `Last delivery: ${formatDate(endpoint.lastDeliveredAt)}`
                            : "No deliveries yet"}
                        {endpoint.failureCount > 0 && (
                            <span className="ml-2 inline-flex items-center gap-1 text-rose-500">
                                <HugeiconsIcon icon={AlertTriangle} className="h-3 w-3" />
                                {endpoint.failureCount} failure{endpoint.failureCount !== 1 ? "s" : ""}
                            </span>
                        )}
                    </p>
                </div>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0 rounded-2xl text-muted-foreground hover:text-foreground">
                            <HugeiconsIcon icon={MoreVertical} className="h-4 w-4" />
                            <span className="sr-only">Actions</span>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-44 rounded-2xl border-brand-deep/5 bg-white/95 p-2 shadow-2xl dark:border-white/5 dark:bg-[#021a12]/95">
                        <DropdownMenuItem className="cursor-pointer rounded-xl px-3 py-2.5" onSelect={onEdit}>
                            <HugeiconsIcon icon={Pencil} className="mr-3 h-4 w-4 text-muted-foreground" />
                            <span>Edit</span>
                        </DropdownMenuItem>
                        {isActive && (
                            <>
                                <DropdownMenuSeparator className="my-1 bg-brand-deep/5 dark:bg-white/5" />
                                <DropdownMenuItem
                                    className="cursor-pointer rounded-xl px-3 py-2.5 text-rose-600 focus:text-rose-700 dark:text-rose-400 dark:focus:text-rose-300"
                                    disabled={disable.isPending}
                                    onSelect={() => disable.mutate(endpoint.id)}
                                >
                                    <HugeiconsIcon icon={Trash2} className="mr-3 h-4 w-4" />
                                    <span>Disable</span>
                                </DropdownMenuItem>
                            </>
                        )}
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </div>
    )
}

function WebhookEndpointDialog({
    open,
    onOpenChange,
    endpoint,
    appId,
}: {
    open: boolean
    onOpenChange: () => void
    endpoint: DeveloperWebhookEndpoint | null
    appId?: string | null
}) {
    const create = useCreateDeveloperWebhookEndpoint(appId)
    const update = useUpdateDeveloperWebhookEndpoint()

    const [name, setName] = useState(endpoint?.name ?? "")
    const [url, setUrl] = useState(endpoint?.url ?? "")
    const [environment, setEnvironment] = useState<DeveloperApiKeyEnvironment>(endpoint?.environment ?? "test")
    const [selectedEvents, setSelectedEvents] = useState<DeveloperWebhookEvent[]>(endpoint?.events ?? ["vox.call.completed"])

    const isEdit = endpoint !== null
    const isPending = create.isPending || update.isPending

    async function submit() {
        if (!name.trim() || !url.trim() || selectedEvents.length === 0) return

        if (isEdit) {
            await update.mutateAsync({
                id: endpoint.id,
                name: name.trim(),
                url: url.trim(),
                events: selectedEvents,
            })
        } else {
            await create.mutateAsync({
                name: name.trim(),
                developer_app_id: appId,
                url: url.trim(),
                environment,
                events: selectedEvents,
            })
        }
        onOpenChange()
    }

    function toggleEvent(event: DeveloperWebhookEvent) {
        setSelectedEvents((current) =>
            current.includes(event)
                ? current.filter((e) => e !== event)
                : [...current, event]
        )
    }

    const isValid = name.trim().length >= 2 && url.trim().length > 0 && selectedEvents.length > 0

    return (
        <Dialog open={open} onOpenChange={(next) => { if (!next) onOpenChange() }}>
            <DialogContent className="max-w-md gap-0 p-0">
                <DialogHeader className="px-6 pt-6 pb-3 sm:px-7 sm:pt-7">
                    <DialogTitle className="text-xl font-semibold">
                        {isEdit ? "Edit webhook endpoint" : "Add webhook endpoint"}
                    </DialogTitle>
                    <DialogDescription className="max-w-lg text-sm leading-6">
                        {isEdit
                            ? "Update the callback URL or subscribed events for this endpoint."
                            : "Configure a URL to receive webhook events from Cloove."}
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 px-6 py-3 sm:px-7">
                    <Input
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Endpoint name"
                        className="h-11 rounded-xl px-4 text-sm"
                    />
                    <Input
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        placeholder="https://example.com/webhooks"
                        className="h-11 rounded-xl px-4 text-sm font-mono"
                        type="url"
                    />
                    {!isEdit && (
                        <div className="grid grid-cols-2 gap-2 rounded-2xl bg-brand-deep/4 p-1 dark:bg-white/5">
                            {(["test", "live"] as const).map((env) => (
                                <button
                                    key={env}
                                    type="button"
                                    onClick={() => setEnvironment(env)}
                                    className={`h-9 rounded-xl border border-transparent px-3 text-sm font-semibold capitalize transition-colors ${
                                        environment === env
                                            ? "bg-white text-brand-deep shadow-sm dark:bg-brand-deep/70 dark:text-brand-cream"
                                            : "text-muted-foreground hover:text-foreground"
                                    }`}
                                >
                                    {env}
                                </button>
                            ))}
                        </div>
                    )}
                    <div className="space-y-2">
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Subscribed events</p>
                        <div className="grid gap-1.5">
                            {DEVELOPER_WEBHOOK_EVENTS.map((event) => (
                                <label
                                    key={event}
                                    className="flex min-h-9 cursor-pointer items-center gap-3 rounded-xl px-3 text-sm transition-colors hover:bg-brand-deep/[0.03] dark:hover:bg-white/[0.055]"
                                >
                                    <Checkbox
                                        checked={selectedEvents.includes(event as DeveloperWebhookEvent)}
                                        onCheckedChange={() => toggleEvent(event as DeveloperWebhookEvent)}
                                    />
                                    {WEBHOOK_EVENT_LABELS[event as DeveloperWebhookEvent]}
                                </label>
                            ))}
                        </div>
                    </div>
                </div>
                <DialogFooter className="gap-2 border-t border-brand-deep/6 px-6 pt-3 pb-6 dark:border-white/8 sm:px-7">
                    <Button variant="outline" className="h-10 rounded-2xl px-5" onClick={onOpenChange}>Cancel</Button>
                    <Button className="h-10 rounded-2xl px-5" disabled={!isValid || isPending} onClick={() => void submit()}>
                        {isPending ? <HugeiconsIcon icon={Loader2} className="mr-2 h-4 w-4 animate-spin" /> : <HugeiconsIcon icon={Check} className="mr-2 h-4 w-4" />}
                        {isEdit ? "Save" : "Create"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
