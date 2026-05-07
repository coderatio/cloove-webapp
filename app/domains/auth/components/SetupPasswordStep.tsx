"use client"

import { useMemo } from "react"
import { Lock, Shield, CheckCircle2, Eye, EyeOff } from "lucide-react"
import { Button } from "@/app/components/ui/button"
import { GlassCard } from "@/app/components/ui/glass-card"
import { LoginBackButton } from "./LoginBackButton"
import type { useLoginFlow } from "../hooks/useLoginFlow"

// ─── Password strength helper ─────────────────────────────────────────────────

type StrengthLevel = 'weak' | 'medium' | 'strong'

function getPasswordStrength(password: string): StrengthLevel {
    if (password.length < 8) return 'weak'
    const hasUpper = /[A-Z]/.test(password)
    const hasLower = /[a-z]/.test(password)
    const hasDigit = /\d/.test(password)
    const hasSpecial = /[^A-Za-z0-9]/.test(password)
    const score = [hasUpper, hasLower, hasDigit, hasSpecial].filter(Boolean).length
    if (score >= 3 && password.length >= 12) return 'strong'
    if (score >= 2 && password.length >= 8) return 'medium'
    return 'weak'
}

const STRENGTH_CONFIG: Record<StrengthLevel, { label: string; bars: number; color: string }> = {
    weak: { label: 'Weak', bars: 1, color: 'bg-red-400' },
    medium: { label: 'Good', bars: 2, color: 'bg-brand-gold' },
    strong: { label: 'Strong', bars: 3, color: 'bg-emerald-400' },
}

function PasswordStrengthBar({ password }: { password: string }) {
    const strength = useMemo(() => getPasswordStrength(password), [password])
    const config = STRENGTH_CONFIG[strength]

    if (!password) return null

    return (
        <div className="space-y-1.5 mt-2">
            <div className="flex gap-1.5">
                {[1, 2, 3].map((bar) => (
                    <div
                        key={bar}
                        className={`h-1 flex-1 rounded-full ${bar <= config.bars ? config.color : 'bg-white/10'}`}
                    />
                ))}
            </div>
            <p className={`text-[10px] font-semibold uppercase tracking-widest ml-0.5 ${strength === 'weak' ? 'text-red-400' : strength === 'medium' ? 'text-emerald-300' : 'text-emerald-400'}`}>
                {config.label}
            </p>
        </div>
    )
}

// ─── Component ────────────────────────────────────────────────────────────────

interface SetupPasswordStepProps {
    flow: ReturnType<typeof useLoginFlow>
}

export function SetupPasswordStep({ flow }: SetupPasswordStepProps) {
    const { state, actions } = flow

    const passwordsMatch = state.newPassword === state.confirmPassword
    const isValid = state.newPassword.length >= 8 && passwordsMatch

    return (
            <GlassCard className="relative overflow-visible rounded-[28px] border-white/10 bg-white/[0.045] p-5 shadow-sm">
                <LoginBackButton onClick={actions.backToOtp} />

                <div className="mb-6 pt-10 text-center">
                    <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-emerald-200">
                        <Shield className="w-6 h-6" />
                    </div>
                    <h2 className="mb-2 text-2xl font-semibold tracking-tight text-white">Secure your account</h2>
                    <p className="text-xs font-semibold uppercase tracking-widest text-white/40">
                        Set a dashboard password to continue
                    </p>
                </div>

                <form onSubmit={actions.handleSetupSubmit} className="space-y-5">
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
                                    type={state.showPassword ? "text" : "password"}
                                    required
                                    autoFocus
                                    autoComplete="new-password"
                                    minLength={8}
                                    placeholder="At least 8 characters"
                                    value={state.newPassword}
                                    onChange={(e) => actions.setNewPassword(e.target.value)}
                                    className="h-14 w-full rounded-2xl border border-white/12 bg-white/[0.04] py-0 pl-12 pr-12 text-white outline-none placeholder:text-white/35 focus:border-white/25 focus:bg-white/[0.06]"
                                />
                                <button
                                    type="button"
                                    onClick={() => actions.setShowPassword(!state.showPassword)}
                                    className="absolute inset-y-0 right-4 flex cursor-pointer items-center text-white/35 hover:text-white/70"
                                >
                                    {state.showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                            <PasswordStrengthBar password={state.newPassword} />
                        </div>

                        <div className="space-y-2">
                            <label className="ml-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/55">
                                Confirm Password
                            </label>
                            <div className="relative group">
                                <div className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-white/45 group-focus-within:text-white/70">
                                    <CheckCircle2 className="w-4 h-4" />
                                </div>
                                <input
                                    type={state.showPassword ? "text" : "password"}
                                    required
                                    autoComplete="new-password"
                                    placeholder="Repeat password"
                                    value={state.confirmPassword}
                                    onChange={(e) => actions.setConfirmPassword(e.target.value)}
                                    className="h-14 w-full rounded-2xl border border-white/12 bg-white/[0.04] py-0 pl-12 pr-12 text-white outline-none placeholder:text-white/35 focus:border-white/25 focus:bg-white/[0.06]"
                                />
                                <button
                                    type="button"
                                    onClick={() => actions.setShowPassword(!state.showPassword)}
                                    className="absolute inset-y-0 right-4 flex cursor-pointer items-center text-white/35 hover:text-white/70"
                                >
                                    {state.showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                            {state.confirmPassword && !passwordsMatch ? (
                                <p className="text-[10px] text-red-400 font-bold uppercase tracking-widest ml-0.5">
                                    Passwords don&apos;t match
                                </p>
                            ) : null}
                        </div>
                    </div>

                    <Button
                        type="submit"
                        disabled={state.isLoading || !isValid}
                        className="h-12 w-full rounded-2xl bg-primary text-white font-semibold hover:bg-primary/92 hover:text-white disabled:opacity-45"
                    >
                        {state.isLoading ? "Setting up..." : "Create Password & Enter"}
                    </Button>
                </form>
            </GlassCard>
    )
}
