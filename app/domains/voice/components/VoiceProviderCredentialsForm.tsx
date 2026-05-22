"use client"

import { Button } from "@/app/components/ui/button"
import { Input } from "@/app/components/ui/input"
import { Label } from "@/app/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/components/ui/select"
import { GlassCard } from "@/app/components/ui/glass-card"
import { Switch } from "@/app/components/ui/switch"
import { Headphones, Loader2, Phone } from "lucide-react"
import type { VoiceProviderOption } from "@/app/domains/voice/hooks/useVoice"

type NumberForm = {
    provider: string
    label: string
    phone_number: string
    voice_number_request_id: string | null
    provider_credentials: Record<string, string>
    use_system_credentials: boolean
    is_default: boolean
    country_code: string
    number_type: "local" | "mobile" | "toll_free" | "national"
}

const NUMBER_TYPE_OPTIONS: Array<{ value: NumberForm["number_type"]; label: string }> = [
    { value: "local", label: "Local" },
    { value: "mobile", label: "Mobile" },
    { value: "toll_free", label: "Toll-free" },
    { value: "national", label: "National" },
]

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
    const isRequestBackedNumber = Boolean(form.voice_number_request_id)
    const hasCredentialInput = Object.values(form.provider_credentials).some((value) => value.trim().length > 0)
    const supportedCountries = selectedProvider?.supported_countries ?? []
    const selectedCountry = supportedCountries.find((c) => c.code === form.country_code)
    const dialCode = selectedCountry?.phoneCode ?? ""
    const canSubmit = isUpdateMode
        ? form.label.trim().length > 0 || hasCredentialInput
        : form.phone_number.trim().length > 0

    const content = (
        <div className="space-y-4">
            <SectionTitle icon={Headphones} title="Number connection" />
            <div className="grid gap-4">
                <div className="space-y-1.5">
                    <Label htmlFor="voice-number-provider">Provider</Label>
                    <Select
                        value={form.provider}
                        disabled={isRequestBackedNumber}
                        onValueChange={(value) =>
                            onChange((prev) => {
                                const provider = providerOptions.find((item) => item.id === value)
                                const supported = provider?.supported_countries ?? []
                                const stillValid = supported.some((c) => c.code === prev.country_code)
                                const nextCountry = stillValid
                                    ? prev.country_code
                                    : (supported.find((c) => c.isDefault) ?? supported[0])?.code ??
                                      prev.country_code
                                return {
                                    ...prev,
                                    provider: value,
                                    provider_credentials: {},
                                    use_system_credentials: provider?.system_credentials_enabled
                                        ? prev.use_system_credentials
                                        : false,
                                    country_code: nextCountry,
                                }
                            })
                        }
                    >
                        <SelectTrigger id="voice-number-provider" className="rounded-2xl">
                            <SelectValue placeholder="Select a voice plan" />
                        </SelectTrigger>
                        <SelectContent className="rounded-2xl">
                            {providerOptions.map((provider) => (
                                <SelectItem key={provider.id} value={provider.id}>
                                    {provider.display_name || provider.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-1.5">
                    <Label htmlFor="voice-number-label">Label</Label>
                    <Input
                        id="voice-number-label"
                        placeholder="e.g. Sales line"
                        value={form.label}
                        onChange={(e) => onChange((prev) => ({ ...prev, label: e.target.value }))}
                    />
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                        <Label htmlFor="voice-number-country">Country</Label>
                        <Select
                            value={form.country_code}
                            disabled={isRequestBackedNumber || supportedCountries.length === 0}
                            onValueChange={(value) =>
                                onChange((prev) => ({ ...prev, country_code: value }))
                            }
                        >
                            <SelectTrigger id="voice-number-country" className="rounded-2xl">
                                <SelectValue
                                    placeholder={
                                        supportedCountries.length
                                            ? "Select a country"
                                            : "No countries available"
                                    }
                                />
                            </SelectTrigger>
                            <SelectContent className="rounded-2xl">
                                {supportedCountries.map((country) => (
                                    <SelectItem key={country.code} value={country.code}>
                                        {country.name} (+{country.phoneCode})
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-1.5">
                        <Label htmlFor="voice-number-type">Number type</Label>
                        <Select
                            value={form.number_type}
                            disabled={isRequestBackedNumber}
                            onValueChange={(value) =>
                                onChange((prev) => ({
                                    ...prev,
                                    number_type: value as NumberForm["number_type"],
                                }))
                            }
                        >
                            <SelectTrigger id="voice-number-type" className="rounded-2xl">
                                <SelectValue placeholder="Select a type" />
                            </SelectTrigger>
                            <SelectContent className="rounded-2xl">
                                {NUMBER_TYPE_OPTIONS.map((option) => (
                                    <SelectItem key={option.value} value={option.value}>
                                        {option.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <div className="space-y-1.5">
                    <Label htmlFor="voice-number-phone">Phone number</Label>
                    <div
                        className={`flex items-stretch gap-0 rounded-2xl border border-input bg-background focus-within:ring-2 focus-within:ring-ring/50 ${
                            isUpdateMode || isRequestBackedNumber
                                ? "bg-slate-50 dark:bg-slate-900/50"
                                : ""
                        }`}
                    >
                        <div className="flex items-center px-3 text-sm text-muted-foreground border-r border-input">
                            {dialCode ? `+${dialCode}` : "—"}
                        </div>
                        <Input
                            id="voice-number-phone"
                            placeholder="8012345678"
                            inputMode="tel"
                            value={form.phone_number}
                            onChange={(e) =>
                                onChange((prev) => ({
                                    ...prev,
                                    phone_number: e.target.value.replace(/[^\d]/g, ""),
                                }))
                            }
                            disabled={isUpdateMode || isRequestBackedNumber}
                            className={`border-0 rounded-l-none rounded-r-2xl focus-visible:ring-0 focus-visible:ring-offset-0 ${
                                isUpdateMode || isRequestBackedNumber
                                    ? "text-slate-500 dark:text-slate-400"
                                    : ""
                            }`}
                        />
                    </div>
                    <p className="text-xs text-muted-foreground">
                        Enter the local part only — the country dial code is prefixed automatically.
                    </p>
                </div>

                {selectedProvider?.system_credentials_enabled && (
                    <ToggleRow
                        label="Use managed credentials"
                        checked={form.use_system_credentials}
                        onCheckedChange={(value) =>
                            onChange((prev) => ({ ...prev, use_system_credentials: value }))
                        }
                        disabled={isRequestBackedNumber}
                    />
                )}

                {!form.use_system_credentials && selectedProvider?.custom_credentials_enabled !== false && (
                    <>
                        {(selectedProvider?.credential_fields ?? []).map((field) => (
                            <div key={field.key} className="space-y-1.5">
                                <Label htmlFor={`voice-number-cred-${field.key}`}>
                                    {field.label}
                                    {field.required ? " *" : ""}
                                </Label>
                                <Input
                                    id={`voice-number-cred-${field.key}`}
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
                    : isRequestBackedNumber
                        ? "This number came from an approved provisioning request. Review the label and save to connect it."
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
    disabled = false,
}: {
    label: string
    checked: boolean
    onCheckedChange: (value: boolean) => void
    disabled?: boolean
}) {
    return (
        <label className="flex items-center justify-between rounded-2xl border border-black/5 px-4 py-3 text-sm dark:border-white/10">
            <span>{label}</span>
            <Switch checked={checked} onCheckedChange={onCheckedChange} disabled={disabled} />
        </label>
    )
}
