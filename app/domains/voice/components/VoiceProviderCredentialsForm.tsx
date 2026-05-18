"use client"

import { Button } from "@/app/components/ui/button"
import { Input } from "@/app/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/components/ui/select"
import { GlassCard } from "@/app/components/ui/glass-card"
import { Switch } from "@/app/components/ui/switch"
import { Headphones, Loader2, Phone } from "lucide-react"
import type { VoiceProviderOption } from "@/app/domains/voice/hooks/useVoice"

type NumberForm = {
    provider: string
    label: string
    phone_number: string
    provider_credentials: Record<string, string>
    use_system_credentials: boolean
    is_default: boolean
}

interface VoiceProviderCredentialsFormProps {
    form: NumberForm
    providerOptions: VoiceProviderOption[]
    selectedProvider?: VoiceProviderOption
    isPending: boolean
    mode?: "create" | "update"
    onChange: (updater: (prev: NumberForm) => NumberForm) => void
    onSubmit: () => void
    framed?: boolean
}

export function VoiceProviderCredentialsForm({
    form,
    providerOptions,
    selectedProvider,
    isPending,
    mode = "create",
    onChange,
    onSubmit,
    framed = true,
}: VoiceProviderCredentialsFormProps) {
    const isUpdateMode = mode === "update"
    const hasCredentialInput = Object.values(form.provider_credentials).some((value) => value.trim().length > 0)
    const canSubmit = isUpdateMode
        ? form.label.trim().length > 0 || hasCredentialInput
        : form.phone_number.trim().length > 0

    const content = (
        <div className="space-y-4">
            <SectionTitle icon={Headphones} title="Number connection" />
            <div className="grid gap-3">
                <Select
                    value={form.provider}
                    onValueChange={(value) =>
                        onChange((prev) => {
                            const provider = providerOptions.find((item) => item.id === value)
                            return {
                                ...prev,
                                provider: value,
                                provider_credentials: {},
                                use_system_credentials: provider?.system_credentials_enabled
                                    ? prev.use_system_credentials
                                    : false,
                            }
                        })
                    }
                >
                    <SelectTrigger className="rounded-2xl">
                        <SelectValue placeholder="Select provider" />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl">
                        {providerOptions.map((provider) => (
                            <SelectItem key={provider.id} value={provider.id}>
                                {provider.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                <Input
                    placeholder="Label"
                    value={form.label}
                    onChange={(e) => onChange((prev) => ({ ...prev, label: e.target.value }))}
                />
                <Input
                    placeholder="Phone number"
                    value={form.phone_number}
                    onChange={(e) => onChange((prev) => ({ ...prev, phone_number: e.target.value }))}
                    disabled={isUpdateMode}
                    className={isUpdateMode ? "bg-slate-50 text-slate-500 dark:bg-slate-900/50 dark:text-slate-400" : undefined}
                />

                {selectedProvider?.system_credentials_enabled && (
                    <ToggleRow
                        label="Use managed credentials"
                        checked={form.use_system_credentials}
                        onCheckedChange={(value) =>
                            onChange((prev) => ({ ...prev, use_system_credentials: value }))
                        }
                    />
                )}

                {!form.use_system_credentials && selectedProvider?.custom_credentials_enabled !== false && (
                    <>
                        {(selectedProvider?.credential_fields ?? []).map((field) => (
                            <div key={field.key} className="space-y-2">
                                <p className="text-sm font-medium">
                                    {field.label}
                                    {field.required ? " *" : ""}
                                </p>
                                <Input
                                    placeholder={field.placeholder ?? field.label}
                                    type={field.type === "password" ? "password" : "text"}
                                    value={form.provider_credentials[field.key] ?? ""}
                                    onChange={(e) =>
                                        onChange((prev) => ({
                                            ...prev,
                                            provider_credentials: {
                                                ...prev.provider_credentials,
                                                [field.key]: e.target.value,
                                            },
                                        }))
                                    }
                                />
                                {field.help_text ? (
                                    <p className="text-xs text-muted-foreground">{field.help_text}</p>
                                ) : null}
                            </div>
                        ))}
                    </>
                )}
            </div>

            <p className="text-sm text-muted-foreground">
                {isUpdateMode
                    ? "Update the label or credentials for this line. The phone number stays linked to your provider account."
                    : "Connect a calling provider, assign the number, and decide whether Cloove manages credentials or the business brings its own."}
            </p>

            <Button
                onClick={onSubmit}
                disabled={isPending || !canSubmit}
                className="rounded-full"
            >
                {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                {isUpdateMode ? "Save changes" : "Save number"}
            </Button>
        </div>
    )

    if (!framed) return content

    return <GlassCard className="p-6 space-y-4">{content}</GlassCard>
}

function SectionTitle({ icon: Icon, title }: { icon: typeof Phone; title: string }) {
    return (
        <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-black/5 dark:bg-white/5">
                <Icon className="h-5 w-5" />
            </div>
            <h2 className="text-lg font-semibold">{title}</h2>
        </div>
    )
}

function ToggleRow({
    label,
    checked,
    onCheckedChange,
}: {
    label: string
    checked: boolean
    onCheckedChange: (value: boolean) => void
}) {
    return (
        <label className="flex items-center justify-between rounded-2xl border border-black/5 px-4 py-3 text-sm dark:border-white/10">
            <span>{label}</span>
            <Switch checked={checked} onCheckedChange={onCheckedChange} />
        </label>
    )
}
