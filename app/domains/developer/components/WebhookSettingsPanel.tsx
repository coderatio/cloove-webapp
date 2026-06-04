"use client"

import { useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { EyeOffIcon as EyeOff, Key01Icon as KeyRound, Loading03Icon as Loader2 } from "@hugeicons/core-free-icons"
import { Badge } from "@/app/components/ui/badge"
import { Button } from "@/app/components/ui/button"
import {
    type DeveloperApiKeyEnvironment,
    useDeveloperWebhookSettings,
    useRotateDeveloperWebhookSecret,
    useViewDeveloperWebhookSecret,
} from "@/app/domains/developer/hooks/useDeveloperApiKeys"
import { PasswordConfirmDialog } from "@/app/components/shared/PasswordConfirmDialog"
import { copy, formatDate } from "@/app/domains/developer/utils/apiKeyFormat"

export function WebhookSettingsPanel({ appId }: { appId?: string | null }) {
    const settings = useDeveloperWebhookSettings(appId)
    const rotateSecret = useRotateDeveloperWebhookSecret(appId)
    const viewSecretMutation = useViewDeveloperWebhookSecret(appId)
    const [pendingSecret, setPendingSecret] = useState<string | null>(null)
    const [revealedValue, setRevealedValue] = useState<string | null>(null)
    const [showPasswordDialog, setShowPasswordDialog] = useState(false)
    const [dialogAction, setDialogAction] = useState<"rotate" | "view">("rotate")

    async function rotate(environment: DeveloperApiKeyEnvironment) {
        const setting = await rotateSecret.mutateAsync(environment)
        if (setting.signingSecret) {
            setDialogAction("rotate")
            setPendingSecret(setting.signingSecret)
            setRevealedValue(null)
            setShowPasswordDialog(true)
        }
    }

    function onPasswordSuccess() {
        // Move pending secret into revealedValue so the dialog switches to reveal mode
        setRevealedValue(pendingSecret)
    }

    async function viewSecret(environment: DeveloperApiKeyEnvironment) {
        const result = await viewSecretMutation.mutateAsync(environment)
        setDialogAction("view")
        setPendingSecret(result.signingSecret)
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
            <div className="border-b border-brand-deep/6 px-5 py-4 dark:border-white/8">
                <h2 className="text-base font-semibold tracking-tight">Webhook signing secrets</h2>
                <p className="text-sm text-muted-foreground">Use one shared secret per environment to verify Cloove webhook signatures.</p>
            </div>
            <PasswordConfirmDialog
                open={showPasswordDialog}
                onOpenChange={(open) => { if (!open) onPasswordDialogClose() }}
                onSuccess={onPasswordSuccess}
                revealedValue={revealedValue}
                title={dialogAction === "rotate" ? "Confirm to rotate signing secret" : "Confirm to view signing secret"}
                description={dialogAction === "rotate" ? "Enter your password to view the new webhook signing secret. Copy it now — it will not be shown again." : "Enter your password to view this webhook signing secret."}
                revealTitle={dialogAction === "rotate" ? "Signing secret rotated" : "Signing secret"}
                revealDescription="Copy this signing secret now. It will not be shown again after you close this dialog."
            />
            <div className="grid gap-3 p-4 sm:grid-cols-2">
                {(settings.data ?? []).map((setting) => (
                    <div key={setting.id} className="rounded-3xl border border-brand-deep/6 bg-white/50 p-4 dark:border-white/8 dark:bg-white/[0.025]">
                        <div className="flex items-start justify-between gap-3">
                            <div>
                                <span className="flex items-center gap-1.5">
                                    <span className={`h-2 w-2 rounded-full ${setting.environment === "live" ? "bg-emerald-500" : "bg-amber-500"}`} />
                                    <span className={`text-xs font-medium ${setting.environment === "live" ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400"}`}>
                                        {setting.environment === "live" ? "Live" : "Test"}
                                    </span>
                                </span>
                                <p className="mt-3 font-mono text-xs text-muted-foreground">{setting.signingSecretPrefix}...</p>
                                <p className="mt-1 text-xs text-muted-foreground">Rotated {formatDate(setting.lastRotatedAt)}</p>
                            </div>
                            <HugeiconsIcon icon={KeyRound} className="h-5 w-5 text-muted-foreground" />
                        </div>                            <div className="mt-4 flex items-center gap-2">
                                <Button className="rounded-2xl" variant="outline" size="sm" disabled={rotateSecret.isPending} onClick={() => void rotate(setting.environment)}>
                                    Rotate secret
                                </Button>
                                <Button className="rounded-2xl" variant="outline" size="sm" disabled={viewSecretMutation.isPending || !setting.plaintextAvailable} onClick={() => void viewSecret(setting.environment)}>
                                    <HugeiconsIcon icon={EyeOff} className="mr-1.5 h-3.5 w-3.5" />
                                    {viewSecretMutation.isPending ? "Loading..." : setting.plaintextAvailable ? "View secret" : "Unavailable"}
                                </Button>
                            </div>
                    </div>
                ))}
                {settings.isLoading && (
                    <div className="flex items-center justify-center p-8">
                        <HugeiconsIcon icon={Loader2} className="h-5 w-5 animate-spin text-muted-foreground" />
                    </div>
                )}
            </div>
        </section>
    )
}
