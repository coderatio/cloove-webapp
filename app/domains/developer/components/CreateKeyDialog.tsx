"use client"

import { useState } from "react"
import { format } from "date-fns"
import { HugeiconsIcon } from "@hugeicons/react"
import { Calendar03Icon as CalendarIcon, CheckIcon as Check, ChevronDownIcon as ChevronDown, Loading03Icon as Loader2, PlusSignIcon as Plus } from "@hugeicons/core-free-icons"
import { Badge } from "@/app/components/ui/badge"
import { Button } from "@/app/components/ui/button"
import { Calendar } from "@/app/components/ui/calendar"
import { Checkbox } from "@/app/components/ui/checkbox"
import { Input } from "@/app/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/app/components/ui/popover"
import { Textarea } from "@/app/components/ui/textarea"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/app/components/ui/base-dialog"
import { cn } from "@/app/lib/utils"
import {
    type CreateDeveloperApiKeyPayload,
    type DeveloperApiKeyEnvironment,
    type DeveloperApiKeyScope,
    useCreateDeveloperApiKey,
} from "@/app/domains/developer/hooks/useDeveloperApiKeys"
import {
    DEFAULT_API_KEY_SCOPES,
    type ExpiryPreset,
    SCOPE_GROUPS,
    SCOPE_LABELS,
} from "@/app/domains/developer/utils/apiKeyConfig"
import { PasswordConfirmDialog } from "@/app/components/shared/PasswordConfirmDialog"
import { copy, expiryFromPreset, splitLines } from "@/app/domains/developer/utils/apiKeyFormat"

export function CreateKeyButton({ appId }: { appId?: string | null }) {
    const [open, setOpen] = useState(false)
    return (
        <>
            <Button className="h-10 rounded-2xl px-4" onClick={() => setOpen(true)}><HugeiconsIcon icon={Plus} className="mr-2 h-4 w-4" /> Create key</Button>
            <CreateKeyDialog open={open} onOpenChange={setOpen} appId={appId} />
        </>
    )
}

function CreateKeyDialog({ open, onOpenChange, appId }: { open: boolean; onOpenChange: (open: boolean) => void; appId?: string | null }) {
    const createKey = useCreateDeveloperApiKey(appId)
    const [name, setName] = useState("")
    const [environment, setEnvironment] = useState<DeveloperApiKeyEnvironment>("test")
    const [scopes, setScopes] = useState<DeveloperApiKeyScope[]>(DEFAULT_API_KEY_SCOPES)
    const [openScopeGroup, setOpenScopeGroup] = useState(SCOPE_GROUPS[0]?.id ?? "")
    const [expiryPreset, setExpiryPreset] = useState<ExpiryPreset>("60-days")
    const [customExpiryDate, setCustomExpiryDate] = useState("")
    const selectedCustomExpiryDate = customExpiryDate ? new Date(`${customExpiryDate}T00:00:00`) : undefined
    const [allowedOrigins, setAllowedOrigins] = useState("")
    const [allowedIpRanges, setAllowedIpRanges] = useState("")
    const [revealedValue, setRevealedValue] = useState<string | null>(null)
    const [showRevealDialog, setShowRevealDialog] = useState(false)

    function resetForm() {
        setName("")
        setEnvironment("test")
        setScopes(DEFAULT_API_KEY_SCOPES)
        setExpiryPreset("60-days")
        setCustomExpiryDate("")
        setAllowedOrigins("")
        setAllowedIpRanges("")
        setRevealedValue(null)
    }

    function requestOpenChange(nextOpen: boolean) {
        if (!nextOpen) resetForm()
        onOpenChange(nextOpen)
    }

    async function submit() {
        const payload: CreateDeveloperApiKeyPayload = {
            name,
            developer_app_id: appId,
            environment,
            scopes,
            allowed_origins: splitLines(allowedOrigins),
            allowed_ip_ranges: splitLines(allowedIpRanges),
            expires_at: expiryFromPreset(expiryPreset, customExpiryDate),
        }
        const result = await createKey.mutateAsync(payload)
        if (result.plaintext) {
            setRevealedValue(result.plaintext)
            setShowRevealDialog(true)
        }
    }

    function onRevealDialogClose() {
        setShowRevealDialog(false)
        setRevealedValue(null)
        resetForm()
        onOpenChange(false)
    }

    return (
        <>
            <Dialog open={open && !showRevealDialog} onOpenChange={requestOpenChange}>
                <DialogContent className="max-h-[84vh] max-w-xl gap-0 p-0 sm:max-h-[86vh]">
                    <DialogHeader className="shrink-0 px-6 pt-6 pb-3 sm:px-7 sm:pt-7">
                        <DialogTitle className="text-xl font-semibold">Create API key</DialogTitle>
                        <DialogDescription className="max-w-lg text-sm leading-6">
                            Create a business API key. Vox scopes are available now; more Cloove API scopes can be added later. The secret is shown once.
                        </DialogDescription>
                    </DialogHeader>
                    <CreateKeyForm
                        name={name}
                        environment={environment}
                        scopes={scopes}
                        openScopeGroup={openScopeGroup}
                        expiryPreset={expiryPreset}
                        customExpiryDate={customExpiryDate}
                        selectedCustomExpiryDate={selectedCustomExpiryDate}
                        allowedOrigins={allowedOrigins}
                        allowedIpRanges={allowedIpRanges}
                        onNameChange={setName}
                        onEnvironmentChange={setEnvironment}
                        onScopesChange={setScopes}
                        onOpenScopeGroupChange={setOpenScopeGroup}
                        onExpiryPresetChange={setExpiryPreset}
                        onCustomExpiryDateChange={setCustomExpiryDate}
                        onAllowedOriginsChange={setAllowedOrigins}
                        onAllowedIpRangesChange={setAllowedIpRanges}
                    />
                    <DialogFooter className="shrink-0 gap-2 border-t border-brand-deep/6 bg-white/95 px-6 pt-3 pb-6 dark:border-white/8 dark:bg-[#121417]/95 sm:px-7">
                        <Button variant="outline" className="h-10 rounded-2xl px-5" onClick={() => requestOpenChange(false)}>Cancel</Button>
                        <Button className="h-10 rounded-2xl px-5" disabled={createKey.isPending || !name.trim() || scopes.length === 0 || (expiryPreset === "custom" && !customExpiryDate)} onClick={() => void submit()}>
                            {createKey.isPending ? <HugeiconsIcon icon={Loader2} className="mr-2 h-4 w-4 animate-spin" /> : <HugeiconsIcon icon={Check} className="mr-2 h-4 w-4" />}
                            Create
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
            <PasswordConfirmDialog
                open={showRevealDialog && revealedValue !== null}
                onOpenChange={(isOpen) => {
                    if (!isOpen) onRevealDialogClose()
                }}
                onSuccess={() => {}}
                revealedValue={revealedValue}
                title="Confirm to reveal API key"
                description="Enter your password to view the new API key."
                revealTitle="API key created"
                revealDescription="Copy these values now. The secret key will not be shown again after you close this dialog."
            />
        </>
    )
}

function CreateKeyForm(props: {
    name: string
    environment: DeveloperApiKeyEnvironment
    scopes: DeveloperApiKeyScope[]
    openScopeGroup: string
    expiryPreset: ExpiryPreset
    customExpiryDate: string
    selectedCustomExpiryDate?: Date
    allowedOrigins: string
    allowedIpRanges: string
    onNameChange: (name: string) => void
    onEnvironmentChange: (environment: DeveloperApiKeyEnvironment) => void
    onScopesChange: React.Dispatch<React.SetStateAction<DeveloperApiKeyScope[]>>
    onOpenScopeGroupChange: (group: string) => void
    onExpiryPresetChange: (preset: ExpiryPreset) => void
    onCustomExpiryDateChange: (date: string) => void
    onAllowedOriginsChange: (value: string) => void
    onAllowedIpRangesChange: (value: string) => void
}) {
    return (
        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-6 py-3 sm:px-7">
            <Input value={props.name} onChange={(event) => props.onNameChange(event.target.value)} placeholder="Key name" className="h-11 rounded-xl px-4 text-sm" />
            <EnvironmentSelector environment={props.environment} onChange={props.onEnvironmentChange} />
            <ScopeSelector scopes={props.scopes} openScopeGroup={props.openScopeGroup} onScopesChange={props.onScopesChange} onOpenScopeGroupChange={props.onOpenScopeGroupChange} />
            <ExpirySelector preset={props.expiryPreset} customDate={props.customExpiryDate} selectedDate={props.selectedCustomExpiryDate} onPresetChange={props.onExpiryPresetChange} onCustomDateChange={props.onCustomExpiryDateChange} />
            <RequestRestrictions allowedOrigins={props.allowedOrigins} allowedIpRanges={props.allowedIpRanges} onAllowedOriginsChange={props.onAllowedOriginsChange} onAllowedIpRangesChange={props.onAllowedIpRangesChange} />
        </div>
    )
}

function EnvironmentSelector({ environment, onChange }: { environment: DeveloperApiKeyEnvironment; onChange: (environment: DeveloperApiKeyEnvironment) => void }) {
    return (
        <div className="grid grid-cols-2 gap-2 rounded-2xl bg-brand-deep/4 p-1 dark:bg-white/5">
            {(["test", "live"] as const).map((env) => (
                <button
                    key={env}
                    type="button"
                    onClick={() => onChange(env)}
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
    )
}

function ScopeSelector({
    scopes,
    openScopeGroup,
    onScopesChange,
    onOpenScopeGroupChange,
}: {
    scopes: DeveloperApiKeyScope[]
    openScopeGroup: string
    onScopesChange: React.Dispatch<React.SetStateAction<DeveloperApiKeyScope[]>>
    onOpenScopeGroupChange: (group: string) => void
}) {
    return (
        <div className="space-y-2">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Available scope groups</p>
            <div className="space-y-2">
                {SCOPE_GROUPS.map((group) => {
                    const isOpen = openScopeGroup === group.id
                    const selectedCount = group.scopes.filter((scope) => scopes.includes(scope)).length

                    return (
                        <div key={group.id} className="overflow-hidden rounded-2xl border border-brand-deep/8 bg-white/60 dark:border-white/10 dark:bg-white/[0.035]">
                            <button type="button" className="flex w-full items-center justify-between gap-3 px-3 py-3 text-left transition-colors hover:bg-white/70 dark:hover:bg-white/[0.045]" aria-expanded={isOpen} onClick={() => onOpenScopeGroupChange(isOpen ? "" : group.id)}>
                                <span>
                                    <span className="block text-sm font-semibold text-foreground">{group.title}</span>
                                    <span className="block text-xs text-muted-foreground">{group.description}</span>
                                </span>
                                <span className="flex shrink-0 items-center gap-2">
                                    <Badge variant="outline">{selectedCount}/{group.scopes.length}</Badge>
                                    <HugeiconsIcon icon={ChevronDown} className={cn("h-4 w-4 text-muted-foreground transition-transform", isOpen && "rotate-180")} />
                                </span>
                            </button>
                            {isOpen && (
                                <div className="grid gap-2 border-t border-brand-deep/6 p-2 dark:border-white/8 sm:grid-cols-2">
                                    {group.scopes.map((scope) => (
                                        <label key={scope} className="flex min-h-10 cursor-pointer items-center gap-3 rounded-xl px-2.5 py-2 text-sm transition-colors hover:bg-white dark:hover:bg-white/[0.055]">
                                            <Checkbox
                                                checked={scopes.includes(scope)}
                                                onCheckedChange={(checked) => {
                                                    onScopesChange((current) =>
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
    )
}

function ExpirySelector({ preset, selectedDate, onPresetChange, onCustomDateChange }: { preset: ExpiryPreset; customDate: string; selectedDate?: Date; onPresetChange: (preset: ExpiryPreset) => void; onCustomDateChange: (date: string) => void }) {
    return (
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
                        onClick={() => onPresetChange(value)}
                        className={cn(
                            "h-9 rounded-xl border border-transparent px-3 text-sm font-semibold transition-colors",
                            preset === value
                                ? "bg-white text-brand-deep shadow-sm dark:bg-brand-deep/70 dark:text-brand-cream"
                                : "text-muted-foreground hover:text-foreground"
                        )}
                    >
                        {label}
                    </button>
                ))}
            </div>
            {preset === "custom" && (
                <Popover>
                    <PopoverTrigger asChild>
                        <Button type="button" variant="outline" className={cn("h-11 w-full justify-start rounded-xl px-4 text-left text-sm font-normal", !selectedDate && "text-muted-foreground")}>
                            <HugeiconsIcon icon={CalendarIcon} className="mr-2 h-4 w-4 opacity-50" />
                            {selectedDate ? format(selectedDate, "MMM d, yyyy") : "Select expiry date"}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                        <Calendar mode="single" selected={selectedDate} onSelect={(date) => onCustomDateChange(date ? format(date, "yyyy-MM-dd") : "")} disabled={{ before: new Date() }} initialFocus />
                    </PopoverContent>
                </Popover>
            )}
        </div>
    )
}

function RequestRestrictions({ allowedOrigins, allowedIpRanges, onAllowedOriginsChange, onAllowedIpRangesChange }: { allowedOrigins: string; allowedIpRanges: string; onAllowedOriginsChange: (value: string) => void; onAllowedIpRangesChange: (value: string) => void }) {
    return (
        <div className="space-y-2">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Request restrictions</p>
            <div className="grid gap-3 sm:grid-cols-2">
                <label className="space-y-1.5">
                    <span className="text-sm font-medium">Allowed domains <span className="font-normal text-muted-foreground">(optional)</span></span>
                    <Textarea value={allowedOrigins} onChange={(event) => onAllowedOriginsChange(event.target.value)} placeholder={"app.example.com\n*.example.com"} className="min-h-24 resize-none rounded-xl" />
                    <span className="block text-xs text-muted-foreground">Matches Origin or Referer host.</span>
                </label>
                <label className="space-y-1.5">
                    <span className="text-sm font-medium">Allowed IPs <span className="font-normal text-muted-foreground">(optional)</span></span>
                    <Textarea value={allowedIpRanges} onChange={(event) => onAllowedIpRangesChange(event.target.value)} placeholder={"203.0.113.10\n198.51.100.0/24"} className="min-h-24 resize-none rounded-xl" />
                    <span className="block text-xs text-muted-foreground">Supports IPv4 and IPv4 CIDR ranges.</span>
                </label>
            </div>
        </div>
    )
}
