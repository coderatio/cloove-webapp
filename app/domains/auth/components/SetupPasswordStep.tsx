"use client"

import { useMemo } from "react"
import { Lock, Sparkles, Shield, CheckCircle2, Eye, EyeOff } from "lucide-react"
import { motion } from "framer-motion"
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
                        className={`h-1 flex-1 rounded-full transition-all duration-500 ${bar <= config.bars ? config.color : 'bg-white/10'}`}
                    />
                ))}
            </div>
            <p className={`text-[10px] font-bold uppercase tracking-widest ml-0.5 transition-colors ${strength === 'weak' ? 'text-red-400' : strength === 'medium' ? 'text-brand-gold' : 'text-emerald-400'}`}>
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
        <motion.div
            key="setup"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        >
            <GlassCard className="p-8 border-brand-gold/20 bg-brand-gold/5 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-6 opacity-10 pointer-events-none">
                    <Sparkles className="w-24 h-24 text-brand-gold" />
                </div>

                {/* Back button */}
                <LoginBackButton onClick={actions.backToOtp} />

                <div className="text-center mb-8">
                    <div className="h-12 w-12 rounded-full bg-brand-gold/20 flex items-center justify-center text-brand-gold mx-auto mb-4 border border-brand-gold/20">
                        <Shield className="w-6 h-6" />
                    </div>
                    <h2 className="font-serif text-2xl text-brand-gold mb-2">Secure Your Account</h2>
                    <p className="text-xs text-brand-cream/40 leading-relaxed uppercase tracking-widest font-bold">
                        Set a dashboard password to continue
                    </p>
                </div>

                <form onSubmit={actions.handleSetupSubmit} className="space-y-6">
                    <div className="space-y-4">
                        {/* New password */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-gold ml-1">
                                New Password
                            </label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-brand-cream/60 group-focus-within:text-brand-gold transition-colors">
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
                                    className="w-full bg-white/10 border border-white/20 rounded-2xl py-4 pl-12 pr-12 text-brand-cream placeholder:text-white/40 outline-none focus:border-brand-gold/40 focus:bg-white/10 transition-all"
                                />
                                <button
                                    type="button"
                                    onClick={() => actions.setShowPassword(!state.showPassword)}
                                    className="absolute cursor-pointer inset-y-0 right-4 flex items-center text-brand-cream/30 hover:text-brand-gold transition-colors"
                                >
                                    {state.showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                            {/* Real-time strength indicator */}
                            <PasswordStrengthBar password={state.newPassword} />
                        </div>

                        {/* Confirm password */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-gold ml-1">
                                Confirm Password
                            </label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-brand-cream/60 group-focus-within:text-brand-gold transition-colors">
                                    <CheckCircle2 className="w-4 h-4" />
                                </div>
                                <input
                                    type={state.showPassword ? "text" : "password"}
                                    required
                                    autoComplete="new-password"
                                    placeholder="Repeat password"
                                    value={state.confirmPassword}
                                    onChange={(e) => actions.setConfirmPassword(e.target.value)}
                                    className="w-full bg-white/10 border border-white/20 rounded-2xl py-4 pl-12 pr-12 text-brand-cream placeholder:text-white/40 outline-none focus:border-brand-gold/40 focus:bg-white/10 transition-all"
                                />
                                <button
                                    type="button"
                                    onClick={() => actions.setShowPassword(!state.showPassword)}
                                    className="absolute cursor-pointer inset-y-0 right-4 flex items-center text-brand-cream/30 hover:text-brand-gold transition-colors"
                                >
                                    {state.showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                            {/* Mismatch hint */}
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
                        className="w-full h-14 rounded-2xl bg-brand-gold text-brand-deep font-bold text-base hover:bg-brand-gold/90 transition-all shadow-xl shadow-brand-gold/10"
                    >
                        {state.isLoading ? "Setting up..." : "Create Password & Enter"}
                    </Button>
                </form>
            </GlassCard>
        </motion.div>
    )
}
