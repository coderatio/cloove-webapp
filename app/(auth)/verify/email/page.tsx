"use client"

import { useState, useEffect, useRef, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { AlertCircle, CheckCircle2, Loader2, Mail, Eye, EyeOff } from "lucide-react"
import { Button } from "@/app/components/ui/button"
import { Input } from "@/app/components/ui/input"
import { Label } from "@/app/components/ui/label"
import { GlassCard } from "@/app/components/ui/glass-card"
import { apiClient } from "@/app/lib/api-client"
import { useAuth } from "@/app/components/providers/auth-provider"
import { toast } from "sonner"

function VerifyEmailContent() {
    const searchParams = useSearchParams()
    const rawToken = searchParams.get("token")
    const token = typeof rawToken === "string" ? rawToken.trim() : null

    const [loading, setLoading] = useState(false)
    const [initializing, setInitializing] = useState(true)
    const [invalid, setInvalid] = useState(false)
    const [success, setSuccess] = useState(false)
    const [emailMasked, setEmailMasked] = useState("")
    const [hasPassword, setHasPassword] = useState(true)
    const [password, setPassword] = useState("")
    const [showPassword, setShowPassword] = useState(false)
    // Persists across React StrictMode double-invocations — prevents a second
    // effect run from overwriting a successful verification with "invalid".
    const verifiedRef = useRef(false)
    const { refreshUser } = useAuth()

    useEffect(() => {
        // `cancelled` is set to true when React unmounts/remounts this effect
        // (e.g. StrictMode double-invocation). Any async callbacks that fire
        // after cleanup become no-ops, preventing stale state updates from a
        // superseded invocation racing with the live one.
        let cancelled = false

        if (!token || token.length === 0) {
            setInitializing(false)
            setInvalid(true)
            return () => { cancelled = true }
        }
        apiClient
            .get<{ valid: boolean; emailMasked?: string; hasPassword?: boolean }>(
                "/security/verify-email-details",
                { token }
            )
            .then((data) => {
                if (cancelled) return
                if (!data.valid) {
                    if (!verifiedRef.current) setInvalid(true)
                    return
                }
                setEmailMasked(data.emailMasked ?? "")
                const needsPasswordSetup = !(data.hasPassword ?? true)
                setHasPassword(!needsPasswordSetup)
                // Auto-verify immediately when no password setup is required
                if (!needsPasswordSetup) {
                    setLoading(true)
                    apiClient.post("/security/verify-email", { token })
                        .then(() => {
                            if (cancelled) return
                            verifiedRef.current = true
                            refreshUser()
                            setSuccess(true)
                        })
                        .catch(() => {
                            if (cancelled) return
                            if (!verifiedRef.current) setInvalid(true)
                        })
                        .finally(() => { if (!cancelled) setLoading(false) })
                }
            })
            .catch(() => {
                if (cancelled) return
                if (!verifiedRef.current) setInvalid(true)
            })
            .finally(() => { if (!cancelled) setInitializing(false) })

        return () => { cancelled = true }
    }, [token, refreshUser])

    const handleVerify = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!token) return
        if (!hasPassword && password.trim().length < 6) {
            toast.error("Password must be at least 6 characters")
            return
        }
        setLoading(true)
        try {
            const payload: Record<string, string> = { token }
            if (!hasPassword && password.trim()) {
                payload.password = password.trim()
            }
            await apiClient.post("/security/verify-email", payload)
            refreshUser()
            setSuccess(true)
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "Verification failed")
        } finally {
            setLoading(false)
        }
    }

    if (initializing) {
        return (
            <div className="flex min-h-dvh flex-col items-center justify-center bg-brand-deep-950 p-4">
                <Loader2 className="h-6 w-6 animate-spin text-emerald-300" />
            </div>
        )
    }

    if (invalid) {
        return (
            <div className="flex min-h-dvh flex-col items-center justify-center bg-brand-deep-950 p-4">
                <GlassCard className="w-full max-w-[420px] rounded-[28px] border-white/10 bg-white/[0.045] p-6 text-center shadow-sm">
                    <AlertCircle className="mx-auto mb-4 h-10 w-10 text-red-300" aria-hidden />
                    <h1 className="mb-2 text-2xl font-semibold tracking-tight text-white">Invalid or expired link</h1>
                    <p className="mb-6 text-sm text-white/60">
                        This verification link is invalid or has expired. Request a new one from the app.
                    </p>
                    <Link href="/login">
                        <Button className="h-12 w-full min-w-[180px] rounded-2xl bg-primary font-semibold text-white hover:bg-primary/92 hover:text-white">
                            Go to login
                        </Button>
                    </Link>
                </GlassCard>
            </div>
        )
    }

    if (success) {
        return (
            <div className="flex min-h-dvh flex-col items-center justify-center bg-brand-deep-950 p-4">
                <GlassCard className="w-full max-w-[420px] rounded-[28px] border-white/10 bg-white/[0.045] p-6 text-center shadow-sm">
                    <CheckCircle2 className="mx-auto mb-4 h-10 w-10 text-emerald-300" />
                    <h1 className="mb-2 text-2xl font-semibold tracking-tight text-white">Email verified</h1>
                    <p className="mb-6 text-sm text-white/60">
                        You can now log in to your dashboard.
                    </p>
                    <Link href="/login">
                        <Button className="h-12 w-full min-w-[180px] rounded-2xl bg-primary font-semibold text-white hover:bg-primary/92 hover:text-white">
                            Log in
                        </Button>
                    </Link>
                </GlassCard>
            </div>
        )
    }

    return (
        <div className="flex min-h-dvh flex-col items-center justify-center bg-brand-deep-950 p-4">
            <GlassCard className="w-full max-w-[420px] rounded-[28px] border-white/10 bg-white/[0.045] p-6 text-center shadow-sm">
                <Mail className="mx-auto mb-4 h-10 w-10 text-emerald-300" />
                <h1 className="mb-2 text-2xl font-semibold tracking-tight text-white">Verify your email</h1>
                {emailMasked ? (
                    <p className="mb-6 text-sm text-white/60">Verifying {emailMasked}</p>
                ) : (
                    <div className="mb-6" />
                )}
                <form onSubmit={handleVerify} className="space-y-4">
                    {!hasPassword && (
                        <div className="space-y-1.5 text-left">
                            <Label className="text-[10px] font-semibold uppercase tracking-widest text-white/55">
                                Set your password
                            </Label>
                            <div className="relative">
                                <Input
                                    type={showPassword ? "text" : "password"}
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    minLength={6}
                                    className="h-12 pr-10 border-white/12 bg-white/[0.04] text-white placeholder:text-white/35 focus-visible:ring-white/20 dark:border-white/12 dark:bg-white/[0.04] sm:h-12"
                                    placeholder="Min 6 characters"
                                />
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => setShowPassword((p) => !p)}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-white/55 hover:bg-transparent hover:text-white"
                                    aria-label={showPassword ? "Hide password" : "Show password"}
                                >
                                    {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                                </Button>
                            </div>
                        </div>
                    )}
                    <Button
                        type="submit"
                        disabled={loading}
                        className="h-12 w-full min-w-[180px] rounded-2xl bg-primary font-semibold text-white hover:bg-primary/92 hover:text-white disabled:opacity-45"
                    >
                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Verify email"}
                    </Button>
                </form>
            </GlassCard>
        </div>
    )
}

export default function VerifyEmailPage() {
    return (
        <Suspense
            fallback={
                <div className="flex min-h-dvh items-center justify-center bg-brand-deep-950">
                    <Loader2 className="h-6 w-6 animate-spin text-emerald-300" />
                </div>
            }
        >
            <VerifyEmailContent />
        </Suspense>
    )
}
