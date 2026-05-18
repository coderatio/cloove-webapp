"use client"

import { useState } from "react"
import { GlassCard } from "@/app/components/ui/glass-card"
import { Button } from "@/app/components/ui/button"
import { Input } from "@/app/components/ui/input"
import {
    Lock,
    ExternalLink,
    Loader2,
    Eye,
    EyeOff,
    ChevronRight,
    Clock3,
} from "lucide-react"
import { toast } from "sonner"
import {
    Drawer,
    DrawerContent,
    DrawerStickyHeader,
    DrawerBody,
    DrawerFooter,
    DrawerTitle,
    DrawerDescription,
} from "@/app/components/ui/drawer"

import { formatDistanceToNow } from "date-fns"
import { useAuth } from "@/app/components/providers/auth-provider"
import { usePermission } from "@/app/hooks/usePermission"
import { apiClient } from "@/app/lib/api-client"
import { useChangePassword, useChangePin, useSecurityStatus } from "../hooks/useSecurity"
import { useSettings, useUpdateBusinessSettings } from "../hooks/useBusinessSettings"

type SessionExpirationMode = "default" | "custom" | "never"

export function SecuritySettings() {
    const [isChangingPin, setIsChangingPin] = useState(false)
    const [isChangingPassword, setIsChangingPassword] = useState(false)

    const { user, refreshUser } = useAuth()
    const { can } = usePermission()
    const changePassword = useChangePassword()
    const changePin = useChangePin()
    const { data: securityStatus } = useSecurityStatus()
    const { data: settings } = useSettings()
    const updateBusinessSettings = useUpdateBusinessSettings()
    const canManageSessionPolicy = can("MANAGE_BUSINESS_CONFIG")
    const persistedSessionExpirationMode =
        settings?.business?.configs?.session_expiration_mode === "custom" ||
            settings?.business?.configs?.session_expiration_mode === "never"
            ? settings.business.configs.session_expiration_mode
            : "default"
    const effectiveSessionExpirationMode =
        user?.session?.expirationMode === "custom" || user?.session?.expirationMode === "never"
            ? user.session.expirationMode
            : "default"
    const backendSessionTtlMinutes = Number(user?.session?.ttlMinutes)
    const persistedSessionTtlMinutes = Number(settings?.business?.configs?.session_expiration_ttl_minutes)
    const savedSessionTtlMinutes = String(
        effectiveSessionExpirationMode === "default" && Number.isFinite(backendSessionTtlMinutes) && backendSessionTtlMinutes > 0
            ? backendSessionTtlMinutes
            : Number.isFinite(persistedSessionTtlMinutes) && persistedSessionTtlMinutes > 0
            ? persistedSessionTtlMinutes
            : 30
    )

    const formatLastChanged = (dateString: string | null | undefined) => {
        if (!dateString) return "Not set yet"
        try {
            return `Last changed ${formatDistanceToNow(new Date(dateString), { addSuffix: true })}`
        } catch {
            return "Recently changed"
        }
    }

    // PIN State
    const [pinData, setPinData] = useState({ current: "", new: "", confirm: "" })
    const [showCurrentPin, setShowCurrentPin] = useState(false)
    const [showNewPin, setShowNewPin] = useState(false)
    const [showConfirmPin, setShowConfirmPin] = useState(false)

    // Password State
    const [passData, setPassData] = useState({ current: "", new: "", confirm: "" })
    const [showCurrentPass, setShowCurrentPass] = useState(false)
    const [showNewPass, setShowNewPass] = useState(false)
    const [showConfirmPass, setShowConfirmPass] = useState(false)
    const [sessionConfigDraft, setSessionConfigDraft] = useState<{
        mode?: SessionExpirationMode
        ttlMinutes?: string
    }>({})

    const sessionExpirationMode = sessionConfigDraft.mode ?? persistedSessionExpirationMode
    const sessionTtlMinutes = sessionConfigDraft.ttlMinutes ?? savedSessionTtlMinutes

    const handlePinSave = () => {
        if (pinData.new !== pinData.confirm) {
            toast.error("New PINs do not match")
            return
        }
        if (pinData.new.length !== 4) {
            toast.error("PIN must be 4 digits")
            return
        }

        changePin.mutate({
            currentPin: pinData.current || undefined,
            newPin: pinData.new
        }, {
            onSuccess: () => {
                setIsChangingPin(false)
                setPinData({ current: "", new: "", confirm: "" })
            }
        })
    }

    const handlePassSave = () => {
        if (passData.new !== passData.confirm) {
            toast.error("New passwords do not match")
            return
        }
        if (passData.new.length < 6) {
            toast.error("Password must be at least 6 characters")
            return
        }

        changePassword.mutate({
            currentPassword: passData.current,
            newPassword: passData.new
        }, {
            onSuccess: () => {
                setIsChangingPassword(false)
                setPassData({ current: "", new: "", confirm: "" })
            }
        })
    }

    const handleSessionConfigSave = () => {
        if (!canManageSessionPolicy) {
            toast.error("You do not have permission to update session policy")
            return
        }

        const parsedTtl = Number(sessionTtlMinutes)

        if (sessionExpirationMode === "custom" && (!Number.isFinite(parsedTtl) || parsedTtl < 1)) {
            toast.error("Session TTL must be at least 1 minute")
            return
        }

        updateBusinessSettings.mutate({
            session_expiration_mode: sessionExpirationMode,
            ...(sessionExpirationMode === "custom"
                ? { session_expiration_ttl_minutes: parsedTtl }
                : {}),
        }, {
            onSuccess: async () => {
                await apiClient.refresh()
                await refreshUser()
                setSessionConfigDraft({})
            },
        })
    }

    return (
        <div className="space-y-8">
            <section className="space-y-4">
                <h2 className="font-serif text-xl text-brand-deep dark:text-brand-cream pl-1">Access Control</h2>
                <GlassCard className="p-6 space-y-6">
                    <div className="flex items-center justify-between">
                        <div className="space-y-1">
                            <div className="flex items-center gap-2">
                                <Lock className="w-4 h-4 text-brand-deep dark:text-brand-cream" />
                                <span className="font-medium text-brand-deep dark:text-brand-cream">Transaction PIN</span>
                                <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 text-[10px] font-bold uppercase">Active</span>
                            </div>
                            <p className="text-xs text-brand-accent/60 dark:text-white/40">
                                {formatLastChanged(securityStatus?.lastPinChange)}
                            </p>
                        </div>
                        <Button
                            onClick={() => setIsChangingPin(true)}
                            variant="outline"
                            className="rounded-xl px-4 text-xs font-bold border-brand-deep/20 hover:bg-brand-deep/5 dark:border-white/10 dark:hover:bg-white/5"
                        >
                            Change PIN
                            <ChevronRight className="w-4 h-4 ml-2 text-brand-deep/30 dark:text-brand-cream/40" />
                        </Button>
                    </div>
                    <div className="h-px bg-brand-deep/5 dark:bg-white/5" />
                    <div className="flex items-center justify-between">
                        <div className="space-y-1">
                            <span className="font-medium text-brand-deep dark:text-brand-cream">Password</span>
                            <p className="text-xs text-brand-accent/60 dark:text-white/40">
                                {formatLastChanged(securityStatus?.lastPasswordChange)}
                            </p>
                        </div>
                        <Button
                            onClick={() => setIsChangingPassword(true)}
                            variant="outline"
                            className="rounded-xl px-4 text-xs font-bold border-brand-deep/20 hover:bg-brand-deep/5 dark:border-white/10 dark:hover:bg-white/5"
                        >
                            Update Password
                            <ChevronRight className="w-4 h-4 ml-2 text-brand-deep/30 dark:text-brand-cream/40" />
                        </Button>
                    </div>
                </GlassCard>
            </section>

            <section className="space-y-4">
                <h2 className="font-serif text-xl text-brand-deep dark:text-brand-cream pl-1">Session Policy</h2>
                <GlassCard className="p-6 space-y-6">
                    <div className="flex items-start justify-between gap-4">
                        <div className="space-y-1">
                            <div className="flex items-center gap-2">
                                <Clock3 className="w-4 h-4 text-brand-deep dark:text-brand-cream" />
                                <span className="font-medium text-brand-deep dark:text-brand-cream">Session expiration</span>
                            </div>
                            <p className="text-xs text-brand-accent/60 dark:text-white/40">
                                Choose whether this business uses the platform default, a custom idle TTL, or a non-expiring session.
                            </p>
                        </div>
                    </div>

                    <div className="grid gap-2 sm:grid-cols-3">
                        {(["default", "custom", "never"] as SessionExpirationMode[]).map((mode) => {
                            const isActive = sessionExpirationMode === mode
                            const label =
                                mode === "default" ? "Use default" : mode === "custom" ? "Custom TTL" : "Never expire"

                            return (
                                <Button
                                    key={mode}
                                    type="button"
                                    variant={isActive ? "base" : "ghost"}
                                    disabled={!canManageSessionPolicy}
                                    onClick={() => setSessionConfigDraft((current) => ({ ...current, mode }))}
                                    className="justify-center rounded-xl"
                                >
                                    {label}
                                </Button>
                            )
                        })}
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-brand-accent/40 dark:text-white/40">
                            Session TTL (minutes)
                        </label>
                        <Input
                            type="number"
                            min={1}
                            step={1}
                            value={sessionTtlMinutes}
                            disabled={sessionExpirationMode !== "custom" || !canManageSessionPolicy}
                            onChange={(e) => setSessionConfigDraft((current) => ({ ...current, ttlMinutes: e.target.value }))}
                            className="h-10 rounded-xl bg-white/50 dark:bg-white/5 border-brand-deep/10 dark:border-white/10 disabled:opacity-60"
                        />
                        <p className="text-[11px] text-brand-accent/50 dark:text-white/35">
                            `default` uses the platform policy. `custom` logs out idle users after the configured window. `never` issues a non-expiring session for this business.
                        </p>
                        {!canManageSessionPolicy && (
                            <p className="text-[11px] text-amber-600/80 dark:text-amber-400/80">
                                Only users with business configuration access can change this policy.
                            </p>
                        )}
                    </div>

                    <Button
                        onClick={handleSessionConfigSave}
                        disabled={updateBusinessSettings.isPending || !canManageSessionPolicy}
                        className="w-full sm:w-auto rounded-xl"
                    >
                        {updateBusinessSettings.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Session Policy"}
                    </Button>
                </GlassCard>
            </section>

            <section className="space-y-4">
                <h2 className="font-serif text-xl text-brand-deep dark:text-brand-cream pl-1">Audit & Devices</h2>
                <GlassCard className="p-6 space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                        <div className="flex items-center justify-between text-sm p-4 bg-white/50 dark:bg-white/5 rounded-xl border border-brand-deep/5 dark:border-white/5">
                            <span className="text-brand-deep/60 dark:text-brand-cream/60">Current Session</span>
                            <span className="font-medium text-brand-deep dark:text-brand-cream">Lagos, Nigeria</span>
                        </div>
                        <div className="flex items-center justify-between text-sm p-4 bg-white/50 dark:bg-white/5 rounded-xl border border-brand-deep/5 dark:border-white/5">
                            <span className="text-brand-deep/60 dark:text-brand-cream/60">Browser</span>
                            <span className="font-medium text-brand-deep dark:text-brand-cream">Chrome on MacOS</span>
                        </div>
                    </div>
                    <Button variant="ghost" className="w-full text-brand-deep dark:text-brand-gold text-xs font-bold mt-2">
                        View All Activity <ExternalLink className="w-3 h-3 ml-2" />
                    </Button>
                </GlassCard>
            </section>

            {/* PIN Change Drawer */}
            <Drawer open={isChangingPin} onOpenChange={setIsChangingPin}>
                <DrawerContent className="max-w-sm">
                    <DrawerStickyHeader>
                        <DrawerTitle>Change PIN</DrawerTitle>
                        <DrawerDescription>Update your 4-digit transaction PIN.</DrawerDescription>
                    </DrawerStickyHeader>
                    <DrawerBody>
                        <div className="space-y-4 w-full">
                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase tracking-widest text-brand-accent/60 dark:text-white/60">Current PIN</label>
                                <div className="relative">
                                    <Input
                                        type={showCurrentPin ? "text" : "password"}
                                        maxLength={4}
                                        className="h-14 rounded-2xl text-2xl tracking-[0.5em] font-mono bg-transparent border-brand-deep/10 dark:border-white/10 dark:text-brand-cream pr-12"
                                        value={pinData.current}
                                        onChange={(e) => setPinData({ ...pinData, current: e.target.value })}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowCurrentPin(!showCurrentPin)}
                                        className="absolute cursor-pointer right-4 top-1/2 -translate-y-1/2 text-brand-accent/40 hover:text-brand-accent/60 transition-colors"
                                    >
                                        {showCurrentPin ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                    </button>
                                </div>
                            </div>
                            <div className="h-px bg-brand-deep/5 dark:bg-white/5 my-4" />
                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase tracking-widest text-brand-accent/60 dark:text-white/60">New PIN</label>
                                <div className="relative">
                                    <Input
                                        type={showNewPin ? "text" : "password"}
                                        maxLength={4}
                                        className="h-14 rounded-2xl text-2xl tracking-[0.5em] font-mono bg-transparent border-brand-deep/10 dark:border-white/10 dark:text-brand-cream pr-12"
                                        value={pinData.new}
                                        onChange={(e) => setPinData({ ...pinData, new: e.target.value })}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowNewPin(!showNewPin)}
                                        className="absolute cursor-pointer right-4 top-1/2 -translate-y-1/2 text-brand-accent/40 hover:text-brand-accent/60 transition-colors"
                                    >
                                        {showNewPin ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                    </button>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase tracking-widest text-brand-accent/60 dark:text-white/60">Confirm New PIN</label>
                                <div className="relative">
                                    <Input
                                        type={showConfirmPin ? "text" : "password"}
                                        maxLength={4}
                                        className="h-14 rounded-2xl text-2xl tracking-[0.5em] font-mono bg-transparent border-brand-deep/10 dark:border-white/10 dark:text-brand-cream pr-12"
                                        value={pinData.confirm}
                                        onChange={(e) => setPinData({ ...pinData, confirm: e.target.value })}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowConfirmPin(!showConfirmPin)}
                                        className="absolute cursor-pointer right-4 top-1/2 -translate-y-1/2 text-brand-accent/40 hover:text-brand-accent/60 transition-colors"
                                    >
                                        {showConfirmPin ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </DrawerBody>
                    <DrawerFooter>
                        <Button
                            onClick={handlePinSave}
                            disabled={changePin.isPending}
                            className="w-full h-14 rounded-2xl bg-brand-deep text-brand-gold dark:bg-brand-gold dark:text-brand-deep font-bold text-lg shadow-xl hover:scale-[1.02] active:scale-95 transition-all"
                        >
                            {changePin.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : "Update PIN"}
                        </Button>
                    </DrawerFooter>
                </DrawerContent>
            </Drawer>

            {/* Password Change Drawer */}
            <Drawer open={isChangingPassword} onOpenChange={setIsChangingPassword}>
                <DrawerContent className="max-w-md">
                    <DrawerStickyHeader>
                        <DrawerTitle>Update Password</DrawerTitle>
                        <DrawerDescription>Secure your account with a strong password.</DrawerDescription>
                    </DrawerStickyHeader>
                    <DrawerBody>
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase tracking-widest text-brand-accent/60 dark:text-white/60">Current Password</label>
                                <div className="relative">
                                    <Input
                                        type={showCurrentPass ? "text" : "password"}
                                        className="h-14 rounded-2xl text-lg bg-transparent border-brand-deep/10 dark:border-white/10 dark:text-brand-cream pr-12"
                                        value={passData.current}
                                        onChange={(e) => setPassData({ ...passData, current: e.target.value })}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowCurrentPass(!showCurrentPass)}
                                        className="absolute cursor-pointer right-4 top-1/2 -translate-y-1/2 text-brand-accent/40 hover:text-brand-accent/60 transition-colors"
                                    >
                                        {showCurrentPass ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                    </button>
                                </div>
                            </div>
                            <div className="h-px bg-brand-deep/5 dark:bg-white/5 my-4" />
                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase tracking-widest text-brand-accent/60 dark:text-white/60">New Password</label>
                                <div className="relative">
                                    <Input
                                        type={showNewPass ? "text" : "password"}
                                        className="h-14 rounded-2xl text-lg bg-transparent border-brand-deep/10 dark:border-white/10 dark:text-brand-cream pr-12"
                                        value={passData.new}
                                        onChange={(e) => setPassData({ ...passData, new: e.target.value })}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowNewPass(!showNewPass)}
                                        className="absolute cursor-pointer right-4 top-1/2 -translate-y-1/2 text-brand-accent/40 hover:text-brand-accent/60 transition-colors"
                                    >
                                        {showNewPass ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                    </button>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase tracking-widest text-brand-accent/60 dark:text-white/60">Confirm New Password</label>
                                <div className="relative">
                                    <Input
                                        type={showConfirmPass ? "text" : "password"}
                                        className="h-14 rounded-2xl text-lg bg-transparent border-brand-deep/10 dark:border-white/10 dark:text-brand-cream pr-12"
                                        value={passData.confirm}
                                        onChange={(e) => setPassData({ ...passData, confirm: e.target.value })}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowConfirmPass(!showConfirmPass)}
                                        className="absolute cursor-pointer right-4 top-1/2 -translate-y-1/2 text-brand-accent/40 hover:text-brand-accent/60 transition-colors"
                                    >
                                        {showConfirmPass ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </DrawerBody>
                    <DrawerFooter>
                        <Button
                            onClick={handlePassSave}
                            disabled={changePassword.isPending}
                            className="w-full h-14 rounded-2xl bg-brand-deep text-brand-gold dark:bg-brand-gold dark:text-brand-deep font-bold text-lg shadow-xl hover:scale-[1.02] active:scale-95 transition-all"
                        >
                            {changePassword.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : "Update Password"}
                        </Button>
                    </DrawerFooter>
                </DrawerContent>
            </Drawer>
        </div >
    )
}
