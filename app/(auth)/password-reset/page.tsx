"use client"

import { useState, useEffect, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { Loader2, Lock, ShieldCheck, AlertCircle, Eye, EyeOff } from "lucide-react"
import { apiClient, ApiError } from "@/app/lib/api-client"
import { Button } from "@/app/components/ui/button"
import { GlassCard } from "@/app/components/ui/glass-card"

// Background elements to match login page
function BackgroundDecor() {
    return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(18,87,65,0.28),transparent_42%),linear-gradient(180deg,#061a14_0%,#03100c_100%)]" />
        </div>
    )
}

function PasswordResetContent() {
    const searchParams = useSearchParams()
    const token = searchParams.get("token")

    const [password, setPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")
    const [showPassword, setShowPassword] = useState(false)
    const [isValidating, setIsValidating] = useState(true)
    const [isResetting, setIsResetting] = useState(false)
    const [status, setStatus] = useState<"verifying" | "ready" | "success" | "error">("verifying")
    const [error, setError] = useState<string | null>(null)
    const [emailMasked, setEmailMasked] = useState<string | null>(null)

    useEffect(() => {
        if (!token) {
            setStatus("error")
            setError("No reset token provided. Please check the link in your email.")
            setIsValidating(false)
            return
        }

        const validateToken = async () => {
            try {
                const response = await apiClient.get<{ valid: boolean; emailMasked: string }>("/security/password-reset-details", { token })
                setEmailMasked(response.emailMasked)
                setStatus("ready")
            } catch (err) {
                setStatus("error")
                if (err instanceof ApiError) {
                    setError(err.message)
                } else {
                    setError("This link is invalid or has expired. Please request a new one.")
                }
            } finally {
                setIsValidating(false)
            }
        }

        validateToken()
    }, [token])

    const handleReset = async (e: React.FormEvent) => {
        e.preventDefault()
        if (password !== confirmPassword) {
            setError("Passwords do not match.")
            return
        }

        setIsResetting(true)
        setError(null)

        try {
            await apiClient.post("/security/reset-password", {
                token,
                password,
            })
            setStatus("success")
        } catch (err) {
            if (err instanceof ApiError) {
                setError(err.message)
            } else {
                setError("Failed to reset password. Please try again.")
            }
        } finally {
            setIsResetting(false)
        }
    }

    if (isValidating) {
        return (
            <div className="flex flex-col items-center justify-center p-12">
                <Loader2 className="w-8 h-8 animate-spin text-brand-gold mb-4" />
                <p className="text-brand-cream/60 text-sm">Verifying reset token...</p>
            </div>
        )
    }

    return (
        <>
            {status === "success" ? (
                    <GlassCard className="rounded-[28px] border-white/10 bg-white/[0.045] p-6 text-center shadow-sm">
                        <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-300/10 text-emerald-300">
                            <ShieldCheck className="h-6 w-6" />
                        </div>
                        <h2 className="mb-3 text-xl font-semibold tracking-tight text-white">Password updated</h2>
                        <p className="mb-6 text-sm leading-relaxed text-white/60">
                            Your password has been reset successfully. You can now log in to your account with your new credentials.
                        </p>
                        <Link href="/login" className="block w-full group">
                            <Button className="h-12 w-full rounded-2xl bg-primary text-white font-semibold hover:bg-primary/92 hover:text-white">
                                Back to Login
                            </Button>
                        </Link>
                    </GlassCard>
            ) : status === "error" ? (
                    <GlassCard className="rounded-[28px] border-white/10 bg-white/[0.045] p-6 text-center shadow-sm">
                        <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-red-400/10 text-red-300">
                            <AlertCircle className="h-6 w-6" />
                        </div>
                        <h2 className="mb-3 text-xl font-semibold tracking-tight text-white">Link invalid</h2>
                        <p className="mb-6 text-sm leading-relaxed text-white/60">
                            {error || "This reset link is either invalid or has already been used."}
                        </p>
                        <Link href="/forgot-password" suppressHydrationWarning className="block w-full group">
                            <Button variant="outline" className="h-12 w-full rounded-2xl border-white/10 bg-white/[0.04] text-white/70 hover:bg-white/[0.07] hover:text-white">
                                Request New Link
                            </Button>
                        </Link>
                    </GlassCard>
            ) : (
                    <GlassCard className="rounded-[28px] border-white/10 bg-white/[0.045] p-5 shadow-sm">
                        <div className="mb-8 flex items-center justify-between">
                            <div>
                                <h2 className="text-lg font-semibold tracking-tight text-white">Create new password</h2>
                                <p className="mt-1 text-[10px] uppercase tracking-widest text-white/40">
                                    Account: {emailMasked}
                                </p>
                            </div>
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/[0.04] text-emerald-200">
                                <Lock className="w-5 h-5" />
                            </div>
                        </div>

                        <form onSubmit={handleReset} className="space-y-6">
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="ml-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/55">
                                        New Password
                                    </label>
                                    <div className="relative group">
                                        <div className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-white/45 group-focus-within:text-white/70">
                                            <Lock className="w-4 h-4" />
                                        </div>
                                        <input
                                            type={showPassword ? "text" : "password"}
                                            required
                                            minLength={8}
                                            autoFocus
                                            placeholder="Enter strong password"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            className="h-14 w-full rounded-2xl border border-white/12 bg-white/[0.04] py-0 pl-12 pr-12 text-sm text-white outline-none placeholder:text-white/35 focus:border-white/25 focus:bg-white/[0.06]"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute inset-y-0 right-4 flex items-center text-white/35 hover:text-white/70"
                                        >
                                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                        </button>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="ml-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/55">
                                        Confirm Password
                                    </label>
                                    <div className="relative group">
                                        <div className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-white/45 group-focus-within:text-white/70">
                                            <Lock className="w-4 h-4" />
                                        </div>
                                        <input
                                            type="password"
                                            required
                                            placeholder="Repeat password"
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            className="h-14 w-full rounded-2xl border border-white/12 bg-white/[0.04] py-0 pl-12 pr-4 text-sm text-white outline-none placeholder:text-white/35 focus:border-white/25 focus:bg-white/[0.06]"
                                        />
                                    </div>
                                </div>
                            </div>

                            {error && (
                                <div className="rounded-xl border border-red-400/20 bg-red-400/10 p-3 text-xs text-red-300">
                                    {error}
                                </div>
                            )}

                            <div className="space-y-4">
                                <Button
                                    type="submit"
                                    disabled={isResetting || !password || password !== confirmPassword}
                                    className="h-12 w-full rounded-2xl bg-primary text-white font-semibold hover:bg-primary/92 hover:text-white disabled:opacity-45 [&_svg]:text-white"
                                >
                                    {isResetting ? (
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                    ) : (
                                        <>
                                            Reset Password
                                            <ShieldCheck className="ml-2 h-4 w-4" />
                                        </>
                                    )}
                                </Button>

                                <p className="px-4 text-center text-[10px] leading-relaxed text-white/40">
                                    Use a unique password with at least 8 characters, mixing uppercase, lowercase, and numbers.
                                </p>
                            </div>
                        </form>
                    </GlassCard>
            )}
        </>
    )
}

export default function PasswordResetPage() {
    return (
        <div className="relative flex min-h-dvh w-full flex-col items-center justify-center overflow-hidden bg-brand-deep-950 px-4 py-8">
            <BackgroundDecor />
            <div className="relative z-10 w-full max-w-[420px]">
                <div className="mb-6 flex flex-col items-center">
                    <div className="relative mb-3 h-11 w-11">
                        <Image
                            src="/images/logo-white.png"
                            alt="Cloove"
                            fill
                            className="object-contain"
                            priority
                        />
                    </div>
                    <h1 className="text-center text-2xl font-semibold tracking-tight text-white">
                        Account recovery
                    </h1>
                    <p className="mt-1 text-center text-sm text-white/55">Create a new password.</p>
                </div>

                <Suspense fallback={
                    <div className="flex h-64 items-center justify-center rounded-[28px] border border-white/10 bg-white/[0.04] text-white/40">
                        <Loader2 className="h-5 w-5 animate-spin" />
                    </div>
                }>
                    <PasswordResetContent />
                </Suspense>
            </div>
        </div>
    )
}
