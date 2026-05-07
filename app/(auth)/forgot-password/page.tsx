"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { ArrowLeft, ArrowRight, Loader2, Mail, Lock, CheckCircle2, Shield } from "lucide-react"
import { apiClient, ApiError, ApiResponse } from "@/app/lib/api-client"
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

export default function ForgotPasswordPage() {
    const [identifier, setIdentifier] = useState("")
    const [email, setEmail] = useState("")
    const [pin, setPin] = useState("")
    const [status, setStatus] = useState<"idle" | "email_required" | "success">("idle")
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)
        setError(null)

        try {
            const response = await apiClient.post<ApiResponse<{ status: string }>>("/security/forgot-password", {
                identifier,
                email: status === "email_required" ? email : undefined,
                pin: status === "email_required" ? pin : undefined,
            }, { fullResponse: true })

            if (response.data?.status === "EMAIL_REQUIRED") {
                setStatus("email_required")
            } else {
                setStatus("success")
            }
        } catch (err) {
            if (err instanceof ApiError) {
                setError(err.message)
            } else {
                setError("An unexpected error occurred. Please try again.")
            }
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="relative flex min-h-dvh w-full flex-col items-center justify-center overflow-hidden bg-brand-deep-950 px-4 py-8">
            <BackgroundDecor />
            <div className="relative z-10 w-full max-w-[420px]">
                <div className="mb-6 flex flex-col items-center">
                    <Link href="/login" className="relative mb-3 h-11 w-11">
                        <Image
                            src="/images/logo-white.png"
                            alt="Cloove"
                            fill
                            className="object-contain"
                            priority
                        />
                    </Link>
                    <h1 className="text-center text-2xl font-semibold tracking-tight text-white">
                        Reset password
                    </h1>
                    <p className="mt-1 text-center text-sm text-white/55">Recover access to your account.</p>
                </div>

                    {status === "success" ? (
                            <GlassCard className="rounded-[28px] border-white/10 bg-white/[0.045] p-6 text-center shadow-sm">
                                <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-300/10 text-emerald-300">
                                    <CheckCircle2 className="h-6 w-6" />
                                </div>
                                <h2 className="mb-3 text-xl font-semibold tracking-tight text-white">Check your messages</h2>
                                <p className="mb-6 text-sm leading-relaxed text-white/60">
                                    If an account matches <span className="font-semibold text-white">{identifier}</span>, we&apos;ve sent a secure reset link.
                                </p>
                                <Link href="/login" className="block w-full group">
                                    <Button className="h-12 w-full rounded-2xl bg-primary text-white font-semibold hover:bg-primary/92 hover:text-white">
                                        Back to Login
                                    </Button>
                                </Link>
                            </GlassCard>
                    ) : (
                            <GlassCard className="rounded-[28px] border-white/10 bg-white/[0.045] p-5 shadow-sm">
                                <Link
                                    href="/login"
                                    className="mb-5 inline-flex items-center text-xs font-medium text-white/55 hover:text-white"
                                >
                                    <ArrowLeft className="mr-1.5 h-3 w-3" />
                                    Back to login
                                </Link>

                                <form onSubmit={handleSubmit} className="space-y-6">
                                    <div className="space-y-4">
                                        {status === "idle" ? (
                                            <div className="space-y-2">
                                                <label className="ml-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/55">
                                                    Your Identifier
                                                </label>
                                                <div className="relative group">
                                                    <div className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-white/45 group-focus-within:text-white/70">
                                                        <Mail className="w-4 h-4" />
                                                    </div>
                                                    <input
                                                        type="text"
                                                        required
                                                        autoFocus
                                                        placeholder="Email address or phone number"
                                                        value={identifier}
                                                        onChange={(e) => setIdentifier(e.target.value)}
                                                        className="h-14 w-full rounded-2xl border border-white/12 bg-white/[0.04] py-0 pl-12 pr-4 text-sm text-white outline-none placeholder:text-white/35 focus:border-white/25 focus:bg-white/[0.06]"
                                                    />
                                                </div>
                                                <p className="px-1 text-xs leading-relaxed text-white/45">
                                                    Enter the email or phone number associated with your account.
                                                </p>
                                            </div>
                                        ) : (
                                            <>
                                                <div className="mb-2 rounded-xl border border-white/10 bg-white/[0.04] p-3">
                                                    <p className="text-[11px] leading-relaxed text-white/60">
                                                        It looks like you haven&apos;t set an email yet. Please provide one and enter your transaction PIN to continue.
                                                    </p>
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="ml-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/55">
                                                        Recovery Email
                                                    </label>
                                                    <div className="relative group">
                                                        <div className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-white/45 group-focus-within:text-white/70">
                                                            <Mail className="w-4 h-4" />
                                                        </div>
                                                        <input
                                                            type="email"
                                                            required
                                                            autoFocus
                                                            placeholder="Enter your email address"
                                                            value={email}
                                                            onChange={(e) => setEmail(e.target.value)}
                                                            className="h-14 w-full rounded-2xl border border-white/12 bg-white/[0.04] py-0 pl-12 pr-4 text-sm text-white outline-none placeholder:text-white/35 focus:border-white/25 focus:bg-white/[0.06]"
                                                        />
                                                    </div>
                                                </div>
                                                <div className="space-y-2">
                                                    <div className="flex items-center justify-between ml-1">
                                                        <label className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/55">
                                                            Transaction PIN
                                                        </label>
                                                        <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-2 py-0.5 text-[9px] font-semibold uppercase text-white/55">
                                                            <Shield className="w-3 h-3" /> Identity Verification
                                                        </span>
                                                    </div>
                                                    <div className="relative group">
                                                        <div className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-white/45 group-focus-within:text-white/70">
                                                            <Lock className="w-4 h-4" />
                                                        </div>
                                                        <input
                                                            type="password"
                                                            required
                                                            inputMode="numeric"
                                                            pattern="[0-9]*"
                                                            maxLength={4}
                                                            placeholder="• • • •"
                                                            value={pin}
                                                            onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
                                                            className="h-14 w-full rounded-2xl border border-white/12 bg-white/[0.04] py-0 pl-12 pr-4 text-center text-lg font-bold tracking-[1em] text-white outline-none placeholder:text-white/35 focus:border-white/25 focus:bg-white/[0.06]"
                                                        />
                                                    </div>
                                                </div>
                                            </>
                                        )}
                                    </div>

                                    {error && (
                                        <div className="rounded-xl border border-red-400/20 bg-red-400/10 p-3 text-xs text-red-300">
                                            {error}
                                        </div>
                                    )}

                                    <Button
                                        type="submit"
                                        disabled={isLoading}
                                        className="h-12 w-full rounded-2xl bg-primary text-white font-semibold hover:bg-primary/92 hover:text-white disabled:opacity-45 [&_svg]:text-white"
                                    >
                                        {isLoading ? (
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                        ) : (
                                            <>
                                                {status === "idle" ? "Request Reset Link" : "Set Email & Verify"}
                                                <ArrowRight className="ml-2 h-4 w-4" />
                                            </>
                                        )}
                                    </Button>
                                </form>
                            </GlassCard>
                    )}
            </div>
        </div>
    )
}
