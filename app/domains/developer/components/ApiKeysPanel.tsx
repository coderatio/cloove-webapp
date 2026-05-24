"use client"

import { useState } from "react"
import { Copy as CopyIcon, Eye, KeyRound, MoreVertical, RotateCcw, XCircle, EyeOff } from "lucide-react"
import { Badge } from "@/app/components/ui/badge"
import { Button } from "@/app/components/ui/button"
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
    type DeveloperApiKey,
    type DeveloperApiKeyEnvironment,
    type DeveloperApiKeyScope,
    useRevokeDeveloperApiKey,
    useRotateDeveloperApiKey,
    useViewDeveloperApiKeySecret,
} from "@/app/domains/developer/hooks/useDeveloperApiKeys"
import { CreateKeyButton } from "@/app/domains/developer/components/CreateKeyDialog"
import { PasswordConfirmDialog } from "@/app/components/shared/PasswordConfirmDialog"
import { copy, formatDate } from "@/app/domains/developer/utils/apiKeyFormat"

export function ApiKeysPanel({ keys, isLoading, compact = false, appId }: { keys: DeveloperApiKey[]; isLoading?: boolean; compact?: boolean; appId?: string | null }) {
    const rotate = useRotateDeveloperApiKey()
    const revoke = useRevokeDeveloperApiKey()
    const viewSecretMutation = useViewDeveloperApiKeySecret()
    const [viewingKey, setViewingKey] = useState<DeveloperApiKey | null>(null)
    const [pendingSecret, setPendingSecret] = useState<string | null>(null)
    const [revealedValue, setRevealedValue] = useState<string | null>(null)
    const [showPasswordDialog, setShowPasswordDialog] = useState(false)
    const [dialogAction, setDialogAction] = useState<"rotate" | "view">("rotate")

    async function rotateKey(key: DeveloperApiKey) {
        const result = await rotate.mutateAsync(key.id)
        setDialogAction("rotate")
        // For rotation, skip password — show the new secret directly
        setRevealedValue(result.plaintext)
        setShowPasswordDialog(true)
    }

    function onPasswordSuccess() {
        // Move pending secret into revealedValue so the dialog switches to reveal mode
        setRevealedValue(pendingSecret)
    }

    async function viewSecret(key: DeveloperApiKey) {
        const result = await viewSecretMutation.mutateAsync(key.id)
        setDialogAction("view")
        setPendingSecret(result.plaintext)
        setRevealedValue(null)
        setShowPasswordDialog(true)
    }

    function onPasswordDialogClose() {
        setShowPasswordDialog(false)
        setRevealedValue(null)
        setPendingSecret(null)
    }

    return (
        <section className="overflow-hidden rounded-3xl border border-brand-deep/6 bg-white/75 shadow-sm shadow-brand-deep/[0.025] dark:border-white/8 dark:bg-white/[0.035]">
            <div className="flex flex-col gap-3 border-b border-brand-deep/6 px-5 py-4 dark:border-white/8 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h2 className="text-base font-semibold tracking-tight">API keys</h2>
                    <p className="text-sm text-muted-foreground">Create and manage scoped credentials for Cloove APIs.</p>
                </div>
                <CreateKeyButton appId={appId} />
            </div>
            <PasswordConfirmDialog
                open={showPasswordDialog}
                onOpenChange={(open) => { if (!open) onPasswordDialogClose() }}
                onSuccess={onPasswordSuccess}
                revealedValue={revealedValue}
                title={dialogAction === "rotate" ? "Confirm to rotate API key" : "Confirm to view API key"}
                description={dialogAction === "rotate" ? "Enter your password to view the new API key. Copy it now — it will not be shown again." : "Enter your password to view this API key secret."}
                revealTitle={dialogAction === "rotate" ? "API key rotated" : "API key secret"}
                revealDescription="Copy this API key now. It will not be shown again after you close this dialog."
            />
            {isLoading ? (
                <div className="flex h-40 items-center justify-center">Loading API keys...</div>
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
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-2">
                                            <span className="font-mono text-xs">{key.publicKey.slice(0, 22)}…{key.lastFour}</span>
                                            <button
                                                type="button"
                                                onClick={() => copy(key.publicKey)}
                                                className="shrink-0 rounded-md p-0.5 text-muted-foreground/50 transition-colors hover:text-foreground"
                                                title="Copy public key"
                                            >
                                                <CopyIcon className="h-3 w-3" />
                                            </button>
                                        </div>
                                    </td>
                                    {!compact && <td className="px-4 py-3"><ScopeSummary scopes={key.scopes} /></td>}
                                    {!compact && <td className="px-4 py-3"><RestrictionSummary keyData={key} /></td>}
                                    <td className="px-4 py-3 text-muted-foreground">{formatDate(key.lastUsedAt)}</td>
                                    <td className="px-4 py-3">
                                        <span className="flex items-center gap-1.5">
                                            <span className={`h-1.5 w-1.5 rounded-full ${key.status === "active" ? "bg-emerald-500" : "bg-red-500"}`} />
                                            <span className={`text-xs font-medium ${key.status === "active" ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}>{key.status}</span>
                                        </span>
                                    </td>
                                    <td className="px-5 py-3">
                                        <div className="flex justify-end">
                                            <ApiKeyActions                                                    apiKey={key}
                                                isRotating={rotate.isPending}
                                                isRevoking={revoke.isPending}
                                                isViewingSecret={viewSecretMutation.isPending}
                                                onView={() => setViewingKey(key)}
                                                onViewSecret={() => void viewSecret(key)}
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

function ApiKeyActions({ apiKey, isRotating, isRevoking, isViewingSecret, onView, onViewSecret, onRotate, onRevoke }: { apiKey: DeveloperApiKey; isRotating: boolean; isRevoking: boolean; isViewingSecret: boolean; onView: () => void; onViewSecret: () => void; onRotate: () => void; onRevoke: () => void }) {
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
                    <span>View details</span>
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer rounded-xl px-3 py-2.5" disabled={disabled || isViewingSecret || !apiKey.plaintextAvailable} onSelect={onViewSecret}>
                    <EyeOff className="mr-3 h-4 w-4 text-muted-foreground" />
                    <span>{isViewingSecret ? "Loading..." : apiKey.plaintextAvailable ? "View secret" : "Secret unavailable"}</span>
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer rounded-xl px-3 py-2.5" disabled={disabled || isRotating} onSelect={onRotate}>
                    <RotateCcw className="mr-3 h-4 w-4 text-muted-foreground" />
                    <span>Rotate</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="my-1 bg-brand-deep/5 dark:bg-white/5" />
                <DropdownMenuItem className="cursor-pointer rounded-xl px-3 py-2.5 text-rose-600 focus:text-rose-700 dark:text-rose-400 dark:focus:text-rose-300" disabled={disabled || isRevoking} onSelect={onRevoke}>
                    <XCircle className="mr-3 h-4 w-4" />
                    <span>Revoke</span>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
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
                            <button
                                type="button"
                                onClick={() => copy(apiKey.publicKey)}
                                className="mt-1 inline-flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
                            >
                                <span className="font-mono">{apiKey.publicKey.slice(0, 26)}…{apiKey.lastFour}</span>
                                <CopyIcon className="h-2.5 w-2.5" />
                            </button>
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

function EnvironmentBadge({ env }: { env: DeveloperApiKeyEnvironment }) {
    return (
        <span className="flex items-center gap-1.5">
            <span className={`h-1.5 w-1.5 rounded-full ${env === "live" ? "bg-emerald-500" : "bg-amber-500"}`} />
            <span className={`text-xs font-medium ${env === "live" ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400"}`}>
                {env === "live" ? "Live" : "Test"}
            </span>
        </span>
    )
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
    if (origins.length === 0 && ipRanges.length === 0) return <span className="text-sm text-muted-foreground">Unrestricted</span>

    const parts = [
        origins.length > 0 ? `${origins.length} domain${origins.length === 1 ? "" : "s"}` : null,
        ipRanges.length > 0 ? `${ipRanges.length} IP rule${ipRanges.length === 1 ? "" : "s"}` : null,
    ].filter(Boolean)

    return <span className="text-sm text-muted-foreground">{parts.join(", ")}</span>
}
