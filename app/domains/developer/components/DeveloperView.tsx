"use client"

import { useMemo, useState } from "react"
import {
    BarChart3,
    CalendarIcon,
    Check,
    ChevronDown,
    Clipboard,
    Code2,
    Eye,
    KeyRound,
    Loader2,
    MoreVertical,
    Plus,
    RotateCcw,
    Shield,
    Webhook,
    XCircle,
} from "lucide-react"
import { format } from "date-fns"
import { toast } from "sonner"
import { ManagementHeader } from "@/app/components/shared/ManagementHeader"
import { Button } from "@/app/components/ui/button"
import { Badge } from "@/app/components/ui/badge"
import { Input } from "@/app/components/ui/input"
import { Textarea } from "@/app/components/ui/textarea"
import { Checkbox } from "@/app/components/ui/checkbox"
import { Calendar } from "@/app/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/app/components/ui/popover"
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
import { cn } from "@/app/lib/utils"
import {
    type CreateDeveloperApiKeyPayload,
    type DeveloperApiKey,
    type DeveloperApiKeyEnvironment,
    type DeveloperApiKeyScope,
    useCreateDeveloperApiKey,
    useDeveloperApiKeys,
    useDeveloperEvents,
    useDeveloperUsage,
    useRevokeDeveloperApiKey,
    useRotateDeveloperApiKey,
} from "@/app/domains/developer/hooks/useDeveloperApiKeys"

type Section = "overview" | "api-keys" | "usage" | "events" | "vox" | "webhooks" | "settings"
type ExpiryPreset = "60-days" | "never" | "custom"

const SCOPE_LABELS: Record<DeveloperApiKeyScope, string> = {
    "vox:read": "Vox read",
    "vox:calls:read": "Read calls",
    "vox:calls:create": "Make calls",
    "vox:agents:read": "Read agents",
    "vox:numbers:read": "Read numbers",
    "webhooks:read": "Read webhook destinations",
    "webhooks:write": "Manage webhook destinations",
}

const SCOPE_GROUPS: Array<{
    id: string
    title: string
    description: string
    scopes: DeveloperApiKeyScope[]
}> = [
    {
        id: "vox",
        title: "Vox",
        description: "Voice engine access for calls, agents, and numbers.",
        scopes: [
            "vox:read",
            "vox:calls:read",
            "vox:calls:create",
            "vox:agents:read",
            "vox:numbers:read",
        ],
    },
    {
        id: "webhooks",
        title: "Webhooks",
        description: "Manage webhook destinations and feature event subscriptions.",
        scopes: [
            "webhooks:read",
            "webhooks:write",
        ],
    },
]

const DEFAULT_API_KEY_SCOPES: DeveloperApiKeyScope[] = [
    "vox:read",
    "vox:calls:read",
    "vox:agents:read",
    "vox:numbers:read",
    "webhooks:read",
]

function formatDate(value: string | null | undefined) {
    if (!value) return "Never"
    return new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric" }).format(new Date(value))
}

function copy(value: string) {
    void navigator.clipboard.writeText(value)
    toast.success("Copied")
}

function splitLines(value: string) {
    return value
        .split(/\r?\n|,/)
        .map((item) => item.trim())
        .filter(Boolean)
}

function expiryFromPreset(preset: ExpiryPreset, customDate: string) {
    if (preset === "never") return null
    if (preset === "custom") return customDate ? new Date(`${customDate}T23:59:59.000Z`).toISOString() : null
    const date = new Date()
    date.setDate(date.getDate() + 60)
    return date.toISOString()
}

export function DeveloperView({ section = "overview" }: { section?: Section }) {
    const apiKeys = useDeveloperApiKeys()
    const usage = useDeveloperUsage(30)
    const events = useDeveloperEvents()
    const activeKeys = (apiKeys.data ?? []).filter((key) => key.status === "active")
    const requestsToday = (usage.data ?? [])
        .filter((row) => row.date?.slice(0, 10) === new Date().toISOString().slice(0, 10))
        .reduce((sum, row) => sum + row.requestCount, 0)
    const lastUsed = activeKeys
        .map((key) => key.lastUsedAt)
        .filter(Boolean)
        .sort()
        .at(-1)

    return (
        <div className="mx-auto max-w-7xl space-y-5 pb-28">
            <ManagementHeader
                title="Developer"
                description="Issue business-owned API keys for Cloove integrations."
                extraActions={section !== "api-keys" ? <CreateKeyButton /> : undefined}
                className="rounded-3xl"
            />

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <Metric icon={KeyRound} label="Active keys" value={String(activeKeys.length)} />
                <Metric icon={Shield} label="Live keys" value={String(activeKeys.filter((key) => key.environment === "live").length)} />
                <Metric icon={BarChart3} label="Requests today" value={String(requestsToday)} />
                <Metric icon={Code2} label="Last used" value={formatDate(lastUsed)} />
            </div>

            {section === "overview" && <Overview keys={apiKeys.data ?? []} />}
            {section === "api-keys" && <ApiKeysPanel keys={apiKeys.data ?? []} isLoading={apiKeys.isLoading} />}
            {section === "usage" && <UsagePanel />}
            {section === "events" && <EventsPanel />}
            {section === "vox" && <VoxApiPanel />}
            {section === "webhooks" && <ComingSoonPanel icon={Webhook} title="Webhooks" text="Webhook destinations will use the same key and environment model when event delivery is enabled." />}
            {section === "settings" && <ComingSoonPanel icon={Shield} title="Developer settings" text="Workspace-level limits, default expiry, and alert preferences will live here." />}
            {events.isError && <p className="text-sm text-rose-600">Could not load developer events.</p>}
        </div>
    )
}

function Metric({ icon: Icon, label, value }: { icon: typeof KeyRound; label: string; value: string }) {
    return (
        <div className="rounded-3xl border border-brand-deep/6 bg-white/70 p-4 shadow-sm shadow-brand-deep/[0.025] dark:border-white/8 dark:bg-white/[0.035]">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <span className="flex h-8 w-8 items-center justify-center rounded-2xl bg-brand-deep/5 text-brand-deep dark:bg-white/7 dark:text-brand-cream">
                    <Icon className="h-4 w-4" />
                </span>
                {label}
            </div>
            <div className="mt-3 text-xl font-semibold text-foreground">{value}</div>
        </div>
    )
}

function Overview({ keys }: { keys: DeveloperApiKey[] }) {
    return (
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1.25fr)_minmax(320px,0.75fr)]">
            <ApiKeysPanel keys={keys.slice(0, 5)} compact />
            <VoxApiPanel compact />
        </div>
    )
}

function ApiKeysPanel({ keys, isLoading, compact = false }: { keys: DeveloperApiKey[]; isLoading?: boolean; compact?: boolean }) {
    const rotate = useRotateDeveloperApiKey()
    const revoke = useRevokeDeveloperApiKey()
    const [revealed, setRevealed] = useState<string | null>(null)
    const [viewingKey, setViewingKey] = useState<DeveloperApiKey | null>(null)

    async function rotateKey(key: DeveloperApiKey) {
        const result = await rotate.mutateAsync(key.id)
        setRevealed(result.plaintext)
    }

    return (
        <section className="overflow-hidden rounded-3xl border border-brand-deep/6 bg-white/75 shadow-sm shadow-brand-deep/[0.025] dark:border-white/8 dark:bg-white/[0.035]">
            <div className="flex flex-col gap-3 border-b border-brand-deep/6 px-5 py-4 dark:border-white/8 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h2 className="text-base font-semibold tracking-tight">API keys</h2>
                    <p className="text-sm text-muted-foreground">Create and manage scoped credentials for Cloove APIs.</p>
                </div>
                <CreateKeyButton />
            </div>
            {revealed && <SecretReveal value={revealed} onClose={() => setRevealed(null)} />}
            {isLoading ? (
                <div className="flex h-40 items-center justify-center"><Loader2 className="h-5 w-5 animate-spin" /></div>
            ) : keys.length === 0 ? (
                <div className="p-10 text-center">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-3xl bg-brand-deep/5 text-muted-foreground dark:bg-white/7">
                        <KeyRound className="h-5 w-5" />
                    </div>
                    <p className="mt-3 text-sm font-medium">No API keys yet</p>
                    <p className="text-sm text-muted-foreground">Create a test key to start integrating with Cloove APIs.</p>
                </div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[840px] text-left text-sm">
                        <thead className="border-b border-brand-deep/6 bg-brand-deep/[0.015] text-[11px] uppercase tracking-wide text-muted-foreground dark:border-white/8 dark:bg-white/[0.025]">
                            <tr>
                                <th className="px-5 py-3">Name</th>
                                <th className="px-4 py-3">Environment</th>
                                <th className="px-4 py-3">Key</th>
                                {!compact && <th className="px-4 py-3">Scopes</th>}
                                {!compact && <th className="px-4 py-3">Restrictions</th>}
                                <th className="px-4 py-3">Last used</th>
                                <th className="px-4 py-3">Status</th>
                                <th className="px-5 py-3 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {keys.map((key) => (
                                <tr key={key.id} className="border-b border-brand-deep/5 last:border-0 dark:border-white/7">
                                    <td className="px-5 py-3 font-medium">{key.name}</td>
                                    <td className="px-4 py-3"><EnvironmentBadge env={key.environment} /></td>
                                    <td className="px-4 py-3 font-mono text-xs">{key.prefix}...{key.lastFour}</td>
                                    {!compact && <td className="px-4 py-3"><ScopeSummary scopes={key.scopes} /></td>}
                                    {!compact && <td className="px-4 py-3"><RestrictionSummary keyData={key} /></td>}
                                    <td className="px-4 py-3 text-muted-foreground">{formatDate(key.lastUsedAt)}</td>
                                    <td className="px-4 py-3"><Badge variant={key.status === "active" ? "success" : "destructive"}>{key.status}</Badge></td>
                                    <td className="px-5 py-3">
                                        <div className="flex justify-end">
                                            <ApiKeyActions
                                                apiKey={key}
                                                isRotating={rotate.isPending}
                                                isRevoking={revoke.isPending}
                                                onView={() => setViewingKey(key)}
                                                onRotate={() => void rotateKey(key)}
                                                onRevoke={() => revoke.mutate(key.id)}
                                            />
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
            <ApiKeyDetailsDialog apiKey={viewingKey} onOpenChange={(open) => !open && setViewingKey(null)} />
        </section>
    )
}

function ApiKeyActions({
    apiKey,
    isRotating,
    isRevoking,
    onView,
    onRotate,
    onRevoke,
}: {
    apiKey: DeveloperApiKey
    isRotating: boolean
    isRevoking: boolean
    onView: () => void
    onRotate: () => void
    onRevoke: () => void
}) {
    const disabled = apiKey.status !== "active"

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-9 w-9 rounded-2xl text-muted-foreground hover:text-foreground">
                    <MoreVertical className="h-4 w-4" />
                    <span className="sr-only">Open API key actions</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52 rounded-2xl border-brand-deep/5 bg-white/95 p-2 shadow-2xl dark:border-white/5 dark:bg-[#021a12]/95">
                <DropdownMenuItem className="cursor-pointer rounded-xl px-3 py-2.5" onSelect={onView}>
                    <Eye className="mr-3 h-4 w-4 text-muted-foreground" />
                    <span>View</span>
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer rounded-xl px-3 py-2.5" disabled={disabled || isRotating} onSelect={onRotate}>
                    <RotateCcw className="mr-3 h-4 w-4 text-muted-foreground" />
                    <span>Rotate</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="my-1 bg-brand-deep/5 dark:bg-white/5" />
                <DropdownMenuItem
                    className="cursor-pointer rounded-xl px-3 py-2.5 text-rose-600 focus:text-rose-700 dark:text-rose-400 dark:focus:text-rose-300"
                    disabled={disabled || isRevoking}
                    onSelect={onRevoke}
                >
                    <XCircle className="mr-3 h-4 w-4" />
                    <span>Revoke</span>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}

function CreateKeyButton() {
    const [open, setOpen] = useState(false)
    return (
        <>
            <Button className="h-10 rounded-2xl px-4" onClick={() => setOpen(true)}><Plus className="mr-2 h-4 w-4" /> Create key</Button>
            <CreateKeyDialog open={open} onOpenChange={setOpen} />
        </>
    )
}

function ApiKeyDetailsDialog({ apiKey, onOpenChange }: { apiKey: DeveloperApiKey | null; onOpenChange: (open: boolean) => void }) {
    return (
        <Dialog open={!!apiKey} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-lg gap-0 p-0">
                <DialogHeader className="px-6 pt-6 pb-3 sm:px-7 sm:pt-7">
                    <DialogTitle className="text-xl font-semibold">API key details</DialogTitle>
                    <DialogDescription className="text-sm leading-6">Review the key metadata, access level, and request restrictions.</DialogDescription>
                </DialogHeader>
                {apiKey && (
                    <div className="space-y-4 px-6 py-3 sm:px-7">
                        <div>
                            <p className="text-sm font-semibold">{apiKey.name}</p>
                            <p className="mt-1 font-mono text-xs text-muted-foreground">{apiKey.prefix}...{apiKey.lastFour}</p>
                        </div>
                        <div className="grid gap-3 sm:grid-cols-2">
                            <DetailItem label="Environment" value={apiKey.environment} />
                            <DetailItem label="Status" value={apiKey.status} />
                            <DetailItem label="Last used" value={formatDate(apiKey.lastUsedAt)} />
                            <DetailItem label="Expires" value={formatDate(apiKey.expiresAt)} />
                        </div>
                        <div className="rounded-2xl border border-brand-deep/6 bg-white/50 p-3 dark:border-white/8 dark:bg-white/[0.025]">
                            <p className="text-xs font-semibold text-muted-foreground">Scopes</p>
                            <div className="mt-2 flex flex-wrap gap-1.5">
                                {apiKey.scopes.map((scope) => <Badge key={scope} variant="outline">{scope}</Badge>)}
                            </div>
                        </div>
                        <div className="grid gap-3 sm:grid-cols-2">
                            <RestrictionDetail title="Allowed domains" values={apiKey.allowedOrigins ?? []} empty="Any domain" />
                            <RestrictionDetail title="Allowed IPs" values={apiKey.allowedIpRanges ?? []} empty="Any IP address" />
                        </div>
                    </div>
                )}
                <DialogFooter className="border-t border-brand-deep/6 px-6 pt-3 pb-6 dark:border-white/8 sm:px-7">
                    <Button className="h-10 rounded-2xl px-5" onClick={() => onOpenChange(false)}>Done</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

function DetailItem({ label, value }: { label: string; value: string }) {
    return (
        <div className="rounded-2xl border border-brand-deep/6 bg-white/50 p-3 dark:border-white/8 dark:bg-white/[0.025]">
            <p className="text-xs font-semibold text-muted-foreground">{label}</p>
            <p className="mt-1 text-sm font-medium capitalize">{value}</p>
        </div>
    )
}

function RestrictionDetail({ title, values, empty }: { title: string; values: string[]; empty: string }) {
    return (
        <div className="rounded-2xl border border-brand-deep/6 bg-white/50 p-3 dark:border-white/8 dark:bg-white/[0.025]">
            <p className="text-xs font-semibold text-muted-foreground">{title}</p>
            <div className="mt-2 space-y-1">
                {values.length === 0 ? (
                    <p className="text-sm text-muted-foreground">{empty}</p>
                ) : (
                    values.map((value) => <p key={value} className="break-all font-mono text-xs">{value}</p>)
                )}
            </div>
        </div>
    )
}

function CreateKeyDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
    const createKey = useCreateDeveloperApiKey()
    const [name, setName] = useState("")
    const [environment, setEnvironment] = useState<DeveloperApiKeyEnvironment>("test")
    const [scopes, setScopes] = useState<DeveloperApiKeyScope[]>(DEFAULT_API_KEY_SCOPES)
    const [openScopeGroup, setOpenScopeGroup] = useState(SCOPE_GROUPS[0]?.id ?? "")
    const [expiryPreset, setExpiryPreset] = useState<ExpiryPreset>("60-days")
    const [customExpiryDate, setCustomExpiryDate] = useState("")
    const selectedCustomExpiryDate = customExpiryDate ? new Date(`${customExpiryDate}T00:00:00`) : undefined
    const [allowedOrigins, setAllowedOrigins] = useState("")
    const [allowedIpRanges, setAllowedIpRanges] = useState("")
    const [createdSecret, setCreatedSecret] = useState<string | null>(null)
    const [hasCopiedSecret, setHasCopiedSecret] = useState(false)

    function resetForm() {
        setName("")
        setEnvironment("test")
        setScopes(DEFAULT_API_KEY_SCOPES)
        setExpiryPreset("60-days")
        setCustomExpiryDate("")
        setAllowedOrigins("")
        setAllowedIpRanges("")
        setCreatedSecret(null)
        setHasCopiedSecret(false)
    }

    function requestOpenChange(nextOpen: boolean) {
        if (!nextOpen && createdSecret && !hasCopiedSecret) {
            toast.error("Copy and confirm the API key before closing")
            return
        }
        if (!nextOpen) resetForm()
        onOpenChange(nextOpen)
    }

    async function submit() {
        const payload: CreateDeveloperApiKeyPayload = {
            name,
            environment,
            scopes,
            allowed_origins: splitLines(allowedOrigins),
            allowed_ip_ranges: splitLines(allowedIpRanges),
            expires_at: expiryFromPreset(expiryPreset, customExpiryDate),
        }
        const result = await createKey.mutateAsync(payload)
        if (result.plaintext) setCreatedSecret(result.plaintext)
    }

    function copyCreatedSecret() {
        if (!createdSecret) return
        copy(createdSecret)
        setHasCopiedSecret(true)
    }

    function finishCreatedSecret() {
        resetForm()
        onOpenChange(false)
    }

    return (
        <Dialog open={open} onOpenChange={requestOpenChange}>
            <DialogContent className="max-h-[84vh] max-w-xl gap-0 p-0 sm:max-h-[86vh]">
                <DialogHeader className="shrink-0 px-6 pt-6 pb-3 sm:px-7 sm:pt-7">
                    <DialogTitle className="text-xl font-semibold">{createdSecret ? "Copy API key" : "Create API key"}</DialogTitle>
                    <DialogDescription className="max-w-lg text-sm leading-6">
                        {createdSecret
                            ? "Copy this secret now. It will not be shown again after you close this modal."
                            : "Create a business API key. Vox scopes are available now; more Cloove API scopes can be added later. The secret is shown once."}
                    </DialogDescription>
                </DialogHeader>
                {createdSecret ? (
                    <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-6 py-3 sm:px-7">
                        <div className="rounded-3xl border border-amber-500/25 bg-amber-500/8 p-4">
                            <p className="text-sm font-semibold">Your API key was created</p>
                            <code className="mt-3 block break-all rounded-2xl bg-background p-3 text-xs">{createdSecret}</code>
                            <Button className="mt-3 h-10 rounded-2xl px-4" variant="outline" onClick={copyCreatedSecret}>
                                <Clipboard className="mr-2 h-4 w-4" /> Copy key
                            </Button>
                        </div>
                        <label className="flex cursor-pointer items-center gap-3 rounded-2xl border border-brand-deep/8 bg-white/60 p-3 text-sm dark:border-white/10 dark:bg-white/[0.035]">
                            <Checkbox checked={hasCopiedSecret} onCheckedChange={(checked) => setHasCopiedSecret(Boolean(checked))} />
                            I have copied and stored this API key securely.
                        </label>
                    </div>
                ) : (
                    <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-6 py-3 sm:px-7">
                    <Input
                        value={name}
                        onChange={(event) => setName(event.target.value)}
                        placeholder="Key name"
                        className="h-11 rounded-xl px-4 text-sm"
                    />
                    <div className="grid grid-cols-2 gap-2 rounded-2xl bg-brand-deep/4 p-1 dark:bg-white/5">
                        {(["test", "live"] as const).map((env) => (
                            <button
                                key={env}
                                type="button"
                                onClick={() => setEnvironment(env)}
                                className={cn(
                                    "h-9 rounded-xl border border-transparent px-3 text-sm font-semibold capitalize transition-colors",
                                    environment === env
                                        ? "bg-white text-brand-deep shadow-sm dark:bg-brand-deep/70 dark:text-brand-cream"
                                        : "text-muted-foreground hover:text-foreground"
                                )}
                            >
                                {env}
                            </button>
                        ))}
                    </div>
                    <div className="space-y-2">
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Available scope groups</p>
                        <div className="space-y-2">
                            {SCOPE_GROUPS.map((group) => {
                                const isOpen = openScopeGroup === group.id
                                const selectedCount = group.scopes.filter((scope) => scopes.includes(scope)).length

                                return (
                                    <div key={group.id} className="overflow-hidden rounded-2xl border border-brand-deep/8 bg-white/60 dark:border-white/10 dark:bg-white/[0.035]">
                                        <button
                                            type="button"
                                            className="flex w-full items-center justify-between gap-3 px-3 py-3 text-left transition-colors hover:bg-white/70 dark:hover:bg-white/[0.045]"
                                            aria-expanded={isOpen}
                                            onClick={() => setOpenScopeGroup(isOpen ? "" : group.id)}
                                        >
                                            <span>
                                                <span className="block text-sm font-semibold text-foreground">{group.title}</span>
                                                <span className="block text-xs text-muted-foreground">{group.description}</span>
                                            </span>
                                            <span className="flex shrink-0 items-center gap-2">
                                                <Badge variant="outline">{selectedCount}/{group.scopes.length}</Badge>
                                                <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform", isOpen && "rotate-180")} />
                                            </span>
                                        </button>
                                        {isOpen && (
                                            <div className="grid gap-2 border-t border-brand-deep/6 p-2 dark:border-white/8 sm:grid-cols-2">
                                                {group.scopes.map((scope) => (
                                                    <label
                                                        key={scope}
                                                        className="flex min-h-10 cursor-pointer items-center gap-3 rounded-xl px-2.5 py-2 text-sm transition-colors hover:bg-white dark:hover:bg-white/[0.055]"
                                                    >
                                                        <Checkbox
                                                            checked={scopes.includes(scope)}
                                                            onCheckedChange={(checked) => {
                                                                setScopes((current) =>
                                                                    checked
                                                                        ? [...current, scope]
                                                                        : current.filter((item) => item !== scope)
                                                                )
                                                            }}
                                                        />
                                                        {SCOPE_LABELS[scope]}
                                                    </label>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                    <div className="space-y-2">
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Key expiry</p>
                        <div className="grid grid-cols-3 gap-2 rounded-2xl bg-brand-deep/4 p-1 dark:bg-white/5">
                            {([
                                ["60-days", "60 days"],
                                ["never", "Never"],
                                ["custom", "Custom"],
                            ] as const).map(([value, label]) => (
                                <button
                                    key={value}
                                    type="button"
                                    onClick={() => setExpiryPreset(value)}
                                    className={cn(
                                        "h-9 rounded-xl border border-transparent px-3 text-sm font-semibold transition-colors",
                                        expiryPreset === value
                                            ? "bg-white text-brand-deep shadow-sm dark:bg-brand-deep/70 dark:text-brand-cream"
                                            : "text-muted-foreground hover:text-foreground"
                                    )}
                                >
                                    {label}
                                </button>
                            ))}
                        </div>
                        {expiryPreset === "custom" && (
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        className={cn(
                                            "h-11 w-full justify-start rounded-xl px-4 text-left text-sm font-normal",
                                            !selectedCustomExpiryDate && "text-muted-foreground"
                                        )}
                                    >
                                        <CalendarIcon className="mr-2 h-4 w-4 opacity-50" />
                                        {selectedCustomExpiryDate ? format(selectedCustomExpiryDate, "MMM d, yyyy") : "Select expiry date"}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar
                                        mode="single"
                                        selected={selectedCustomExpiryDate}
                                        onSelect={(date) => setCustomExpiryDate(date ? format(date, "yyyy-MM-dd") : "")}
                                        disabled={{ before: new Date() }}
                                        initialFocus
                                    />
                                </PopoverContent>
                            </Popover>
                        )}
                    </div>
                    <div className="space-y-2">
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Request restrictions</p>
                        <div className="grid gap-3 sm:grid-cols-2">
                            <label className="space-y-1.5">
                                <span className="text-sm font-medium">Allowed domains <span className="font-normal text-muted-foreground">(optional)</span></span>
                                <Textarea
                                    value={allowedOrigins}
                                    onChange={(event) => setAllowedOrigins(event.target.value)}
                                    placeholder={"app.example.com\n*.example.com"}
                                    className="min-h-24 resize-none rounded-xl"
                                />
                                <span className="block text-xs text-muted-foreground">Matches Origin or Referer host.</span>
                            </label>
                            <label className="space-y-1.5">
                                <span className="text-sm font-medium">Allowed IPs <span className="font-normal text-muted-foreground">(optional)</span></span>
                                <Textarea
                                    value={allowedIpRanges}
                                    onChange={(event) => setAllowedIpRanges(event.target.value)}
                                    placeholder={"203.0.113.10\n198.51.100.0/24"}
                                    className="min-h-24 resize-none rounded-xl"
                                />
                                <span className="block text-xs text-muted-foreground">Supports IPv4 and IPv4 CIDR ranges.</span>
                            </label>
                        </div>
                    </div>
                </div>
                )}
                <DialogFooter className="shrink-0 gap-2 border-t border-brand-deep/6 bg-white/95 px-6 pt-3 pb-6 dark:border-white/8 dark:bg-[#121417]/95 sm:px-7">
                    {createdSecret ? (
                        <Button className="h-10 rounded-2xl px-5" disabled={!hasCopiedSecret} onClick={finishCreatedSecret}>
                            <Check className="mr-2 h-4 w-4" />
                            Done
                        </Button>
                    ) : (
                        <>
                            <Button variant="outline" className="h-10 rounded-2xl px-5" onClick={() => requestOpenChange(false)}>Cancel</Button>
                            <Button className="h-10 rounded-2xl px-5" disabled={createKey.isPending || !name.trim() || scopes.length === 0 || (expiryPreset === "custom" && !customExpiryDate)} onClick={() => void submit()}>
                                {createKey.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}
                                Create
                            </Button>
                        </>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

function SecretReveal({ value, onClose }: { value: string; onClose: () => void }) {
    return (
        <div className="m-4 rounded-3xl border border-amber-500/25 bg-amber-500/8 p-4">
            <div className="flex items-start justify-between gap-3">
                <div>
                    <p className="text-sm font-semibold">Copy this key now. It will not be shown again.</p>
                    <code className="mt-3 block break-all rounded-2xl bg-background p-3 text-xs">{value}</code>
                </div>
                <Button variant="outline" size="sm" onClick={() => copy(value)}><Clipboard className="mr-2 h-4 w-4" /> Copy</Button>
            </div>
            <Button className="mt-3" variant="outline" size="sm" onClick={onClose}>Done</Button>
        </div>
    )
}

function UsagePanel() {
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
                {usage.isLoading && <div className="py-10 text-center"><Loader2 className="mx-auto h-5 w-5 animate-spin" /></div>}
                {!usage.isLoading && rows.length === 0 && <p className="py-10 text-center text-sm text-muted-foreground">Usage appears after API requests are made.</p>}
            </div>
        </section>
    )
}

function EventsPanel() {
    const events = useDeveloperEvents()
    return (
        <section className="rounded-3xl border border-brand-deep/6 bg-white/75 p-5 shadow-sm shadow-brand-deep/[0.025] dark:border-white/8 dark:bg-white/[0.035]">
            <h2 className="text-base font-semibold tracking-tight">Events</h2>
            <div className="mt-4 space-y-3">
                {(events.data ?? []).map((event) => (
                    <div key={event.id} className="rounded-2xl border border-brand-deep/6 bg-white/50 p-3 dark:border-white/8 dark:bg-white/[0.025]">
                        <p className="text-sm font-medium">{event.title}</p>
                        <p className="text-xs text-muted-foreground">{event.eventType} · {formatDate(event.createdAt)} · {event.ipAddress ?? "No IP"}</p>
                    </div>
                ))}
                {events.isLoading && <Loader2 className="h-5 w-5 animate-spin" />}
                {!events.isLoading && (events.data ?? []).length === 0 && <p className="text-sm text-muted-foreground">No developer events yet.</p>}
            </div>
        </section>
    )
}

function VoxApiPanel({ compact = false }: { compact?: boolean }) {
    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "https://api.cloove.com"
    const endpoints = useMemo(() => [
        ["GET", "/v1/vox/health", "vox:read"],
        ["GET", "/v1/vox/calls", "vox:calls:read"],
        ["POST", "/v1/vox/calls", "vox:calls:create"],
        ["GET", "/v1/vox/numbers", "vox:numbers:read"],
        ["GET", "/v1/vox/agents", "vox:agents:read"],
    ], [])
    return (
        <section className="rounded-3xl border border-brand-deep/6 bg-white/75 p-5 shadow-sm shadow-brand-deep/[0.025] dark:border-white/8 dark:bg-white/[0.035]">
            <h2 className="text-base font-semibold tracking-tight">Vox API</h2>
            <p className="mt-1 text-sm text-muted-foreground">Use bearer-token auth with a test or live key.</p>
            <code className="mt-4 block overflow-x-auto rounded-2xl bg-brand-deep/[0.035] p-3 text-xs text-brand-deep dark:bg-white/[0.055] dark:text-brand-cream">
                {`curl ${baseUrl}/v1/vox/health -H "Authorization: Bearer clv_test_..."`}
            </code>
            {!compact && <div className="mt-4 grid gap-2">
                {endpoints.map(([method, path, scope]) => (
                    <div key={path} className="flex items-center justify-between rounded-2xl border border-brand-deep/6 bg-white/50 p-3 text-sm dark:border-white/8 dark:bg-white/[0.025]">
                        <span className="font-mono">{method} {path}</span>
                        <Badge>{scope}</Badge>
                    </div>
                ))}
            </div>}
        </section>
    )
}

function ComingSoonPanel({ icon: Icon, title, text }: { icon: typeof Webhook; title: string; text: string }) {
    return (
        <section className="rounded-3xl border border-brand-deep/6 bg-white/75 p-10 text-center shadow-sm shadow-brand-deep/[0.025] dark:border-white/8 dark:bg-white/[0.035]">
            <Icon className="mx-auto h-8 w-8 text-muted-foreground" />
            <h2 className="mt-3 text-base font-semibold">{title}</h2>
            <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">{text}</p>
        </section>
    )
}

function EnvironmentBadge({ env }: { env: DeveloperApiKeyEnvironment }) {
    return <Badge variant={env === "live" ? "success" : "warning"}>{env}</Badge>
}

function ScopeSummary({ scopes }: { scopes: DeveloperApiKeyScope[] }) {
    const writeScopes = scopes.filter((scope) => scope.endsWith(":create") || scope.endsWith(":write")).length
    return (
        <div className="space-y-1">
            <p className="text-sm font-medium">{scopes.length} scopes</p>
            <p className="text-xs text-muted-foreground">{writeScopes > 0 ? `${writeScopes} write access` : "Read-only"}</p>
        </div>
    )
}

function RestrictionSummary({ keyData }: { keyData: DeveloperApiKey }) {
    const origins = keyData.allowedOrigins ?? []
    const ipRanges = keyData.allowedIpRanges ?? []
    if (origins.length === 0 && ipRanges.length === 0) {
        return <span className="text-sm text-muted-foreground">Unrestricted</span>
    }

    const parts = [
        origins.length > 0 ? `${origins.length} domain${origins.length === 1 ? "" : "s"}` : null,
        ipRanges.length > 0 ? `${ipRanges.length} IP rule${ipRanges.length === 1 ? "" : "s"}` : null,
    ].filter(Boolean)

    return (
        <span className="text-sm text-muted-foreground">{parts.join(", ")}</span>
    )
}
