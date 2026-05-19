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
import { Loader2, Phone, PhoneIncoming } from "lucide-react"
import type { ReactNode } from "react"
import type { VoiceProviderOption } from "@/app/domains/voice/hooks/useVoice"

type VoiceNumberRequestForm = {
    provider: string
    label: string
    country_code: string
    desired_area: string
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
                            <Input
                                placeholder="Internal label"
                                value={form.label}
                                onChange={(e) =>
                                    onChange((prev) => ({
                                        ...prev,
                                        label: e.target.value,
                                    }))
                                }
                            />
                            <div className="grid gap-3 sm:grid-cols-2">
                                <Input
                                    placeholder="Country code"
                                    value={form.country_code}
                                    onChange={(e) =>
                                        onChange((prev) => ({
                                            ...prev,
                                            country_code: e.target.value.toUpperCase(),
                                        }))
                                    }
                                />
                                <Input
                                    placeholder="Preferred area or city"
                                    value={form.desired_area}
                                    onChange={(e) =>
                                        onChange((prev) => ({
                                            ...prev,
                                            desired_area: e.target.value,
                                        }))
                                    }
                                />
                            </div>
                            <Textarea
                                placeholder="Any routing or provisioning notes"
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
