"use client"

import { Button } from "@/app/components/ui/button"
import {
    Drawer,
    DrawerBody,
    DrawerContent,
    DrawerDescription,
    DrawerStickyHeader,
    DrawerTitle,
} from "@/app/components/ui/drawer"
import { Input } from "@/app/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/components/ui/select"
import { Textarea } from "@/app/components/ui/textarea"
import { useCountries } from "@/app/hooks/useCountries"
import { Loader2, Phone, PhoneIncoming } from "lucide-react"
import { useEffect, useMemo, type ReactNode } from "react"
import type { VoiceProviderOption } from "@/app/domains/voice/hooks/useVoice"

type VoiceNumberRequestForm = {
    provider: string
    label: string
    country_code: string
    notes: string
}

interface VoiceNumberRequestDrawerProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    trigger: ReactNode
    form: VoiceNumberRequestForm
    providerOptions: VoiceProviderOption[]
    isPending: boolean
    onChange: (updater: (prev: VoiceNumberRequestForm) => VoiceNumberRequestForm) => void
    onSubmit: () => void
}

export function VoiceNumberRequestDrawer({
    open,
    onOpenChange,
    trigger,
    form,
    providerOptions,
    isPending,
    onChange,
    onSubmit,
}: VoiceNumberRequestDrawerProps) {
    const { data: countries = [], isLoading: isLoadingCountries } = useCountries()
    const selectedCountry = useMemo(() => {
        return countries.find((country) => country.code === form.country_code) ?? null
    }, [countries, form.country_code])

    useEffect(() => {
        if (form.country_code || !countries.length) return

        const defaultCountry = countries.find((country) => country.isDefault) ?? countries[0]

        if (!defaultCountry) return

        onChange((prev) => ({
            ...prev,
            country_code: defaultCountry.code,
        }))
    }, [countries, form.country_code, onChange])

    return (
        <Drawer open={open} onOpenChange={onOpenChange}>
            {trigger}
            <DrawerContent>
                <DrawerStickyHeader>
                    <DrawerTitle className="font-sans text-xl font-semibold text-foreground">
                        Request a voice number
                    </DrawerTitle>
                    <DrawerDescription>
                        Submit a provisioning request and connect the number once it is approved.
                    </DrawerDescription>
                </DrawerStickyHeader>
                <DrawerBody>
                    <div className="space-y-4">
                        <SectionTitle icon={PhoneIncoming} title="Provisioning request" />
                        <div className="grid gap-3">
                            <div className="space-y-2">
                                <label className="px-1 text-sm font-medium text-foreground">
                                    Provider
                                </label>
                                <Select
                                    value={form.provider}
                                    onValueChange={(value) =>
                                        onChange((prev) => ({ ...prev, provider: value }))
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
                            </div>
                            <div className="space-y-2">
                                <label className="px-1 text-sm font-medium text-foreground">
                                    Internal label
                                </label>
                                <Input
                                    placeholder="e.g. Main support line"
                                    value={form.label}
                                    onChange={(e) =>
                                        onChange((prev) => ({
                                            ...prev,
                                            label: e.target.value,
                                        }))
                                    }
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="px-1 text-sm font-medium text-foreground">
                                    Country
                                </label>
                                <Select
                                    value={form.country_code}
                                    onValueChange={(value) =>
                                        onChange((prev) => ({
                                            ...prev,
                                            country_code: value,
                                        }))
                                    }
                                    disabled={isLoadingCountries}
                                >
                                    <SelectTrigger className="rounded-2xl">
                                        <SelectValue
                                            placeholder={
                                                isLoadingCountries ? "Loading countries..." : "Select country"
                                            }
                                        />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-2xl">
                                        {countries.map((country) => (
                                            <SelectItem key={country.id} value={country.code}>
                                                {country.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <label className="px-1 text-sm font-medium text-foreground">
                                    Notes
                                </label>
                                <Textarea
                                    placeholder={
                                        selectedCountry
                                            ? `Anything we should know about this ${selectedCountry.name} number request`
                                            : "Anything we should know before provisioning this number"
                                    }
                                    rows={4}
                                    value={form.notes}
                                    onChange={(e) =>
                                        onChange((prev) => ({
                                            ...prev,
                                            notes: e.target.value,
                                        }))
                                    }
                                />
                            </div>
                        </div>
                        <Button
                            type="button"
                            className="rounded-full"
                            disabled={isPending}
                            onClick={onSubmit}
                        >
                            {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                            Submit request
                        </Button>
                    </div>
                </DrawerBody>
            </DrawerContent>
        </Drawer>
    )
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
