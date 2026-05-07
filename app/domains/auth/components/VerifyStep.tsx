"use client"

import { Lock, Shield, Eye, EyeOff, ArrowRight, MessageCircle, ExternalLink } from "lucide-react"
import Link from "next/link"
import { Button } from "@/app/components/ui/button"
import { GlassCard } from "@/app/components/ui/glass-card"
import { cn } from "@/app/lib/utils"
import { LoginBackButton } from "./LoginBackButton"
import type { useLoginFlow } from "../hooks/useLoginFlow"

const BOT_NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_BOT_NUMBER?.replace(/\D/g, "") ?? ""
const BOT_DISPLAY = process.env.NEXT_PUBLIC_WHATSAPP_BOT_NUMBER ?? ""
const WHATSAPP_URL = BOT_NUMBER ? `https://wa.me/${BOT_NUMBER}?text=${encodeURIComponent("Hi")}` : ""

interface VerifyStepProps {
    flow: ReturnType<typeof useLoginFlow>
}

export function VerifyStep({ flow }: VerifyStepProps) {
    const { state, actions } = flow

    if (state.phoneActivationRequired) {
        return (
                <GlassCard className="rounded-[28px] border-white/10 bg-white/[0.045] p-6 text-center shadow-sm sm:p-8">
                    <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/20 text-emerald-200">
                        <MessageCircle className="h-7 w-7" aria-hidden />
                    </div>
                    <h1 className="mb-2 text-2xl font-semibold tracking-tight text-white">
                        Activate your number
                    </h1>
                    <p className="mx-auto mb-6 max-w-sm text-sm leading-relaxed text-white/60">
                        Send a message to our WhatsApp bot to activate your phone number, then come back here to log in.
                    </p>
                    {WHATSAPP_URL && (
                        <div className="mb-6">
                            <a
                                href={WHATSAPP_URL}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex w-full items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 hover:bg-white/[0.07]"
                            >
                                <div className="text-left">
                                    <p className="mb-0.5 text-[10px] font-semibold uppercase tracking-widest text-white/45">
                                        WhatsApp bot number
                                    </p>
                                    <p className="text-base font-semibold tracking-wide text-white">
                                        {BOT_DISPLAY}
                                    </p>
                                </div>
                                <ExternalLink className="h-4 w-4 shrink-0 text-white/45" />
                            </a>
                        </div>
                    )}
                    <div className="space-y-3">
                        {WHATSAPP_URL && (
                            <Button
                                asChild
                                size="lg"
                                className="h-12 w-full rounded-2xl bg-[#25D366] text-white font-semibold hover:bg-[#22c55e]"
                            >
                                <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer">
                                    <MessageCircle className="w-4 h-4 mr-2" />
                                    Open in WhatsApp
                                </a>
                            </Button>
                        )}
                        <Button
                            onClick={actions.backToIdentifier}
                            variant="ghost"
                            size="lg"
                            className="h-12 w-full rounded-2xl text-white/60 hover:bg-white/[0.06] hover:text-white"
                        >
                            Back to login
                            <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                    </div>
                </GlassCard>
        )
    }

    return (
            <GlassCard className="relative overflow-visible rounded-[28px] border-white/10 bg-white/[0.045] p-5 shadow-sm">
                <LoginBackButton onClick={actions.backToIdentifier} />

                <form onSubmit={actions.handleVerifySubmit} className="space-y-5 pt-10">
                    <div className="space-y-3">
                        <div className="flex items-center justify-between ml-1">
                            <label className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/55">
                                {state.isPinLogin ? "Transaction PIN" : "Password"}
                            </label>
                            {state.isPinLogin ? (
                                <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-2 py-0.5 text-[9px] font-semibold uppercase text-white/55">
                                    <Shield className="w-3 h-3" /> WhatsApp PIN Login
                                </span>
                            ) : null}
                        </div>
                        <div className="relative group">
                            <div className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-white/45 group-focus-within:text-white/70">
                                <Lock className="w-4 h-4" />
                            </div>
                            <input
                                type={state.showPassword ? "text" : "password"}
                                autoFocus
                                required
                                autoComplete="current-password"
                                // PIN-specific: numeric keyboard on mobile, digit-only, 4-char max
                                inputMode={state.isPinLogin ? "numeric" : "text"}
                                pattern={state.isPinLogin ? "[0-9]*" : undefined}
                                maxLength={state.isPinLogin ? 4 : undefined}
                                placeholder={state.isPinLogin ? "• • • •" : "Enter password"}
                                value={state.isPinLogin ? state.pin : state.password}
                                onChange={(e) =>
                                    state.isPinLogin
                                        ? actions.setPin(e.target.value.replace(/\D/g, ""))
                                        : actions.setPassword(e.target.value)
                                }
                                className={cn(
                                    "h-14 w-full rounded-2xl border border-white/12 bg-white/[0.04] py-0 pl-12 pr-12 text-base tracking-widest text-white outline-none placeholder:text-white/35 focus:border-white/25 focus:bg-white/[0.06]",
                                    state.isPinLogin && "text-center tracking-[1em] pl-4 font-bold"
                                )}
                            />
                            <button
                                type="button"
                                onClick={() => actions.setShowPassword(!state.showPassword)}
                                className="absolute inset-y-0 right-4 flex cursor-pointer items-center text-white/35 hover:text-white/70"
                            >
                                {state.showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                        </div>
                        {state.isPinLogin ? (
                            <p className="text-[10px] text-brand-cream/60 text-center px-4 leading-relaxed mt-2">
                                First time login? Use the 4-digit PIN you use for WhatsApp transactions.
                            </p>
                        ) : (
                            <div className="flex justify-end pr-1">
                                <Link
                                    href="/forgot-password"
                                    className="text-[11px] font-medium text-emerald-300/70 hover:text-white"
                                >
                                    Forgot password?
                                </Link>
                            </div>
                        )}
                    </div>

                    <Button
                        type="submit"
                        disabled={state.isLoading || (state.isPinLogin ? state.pin.length < 4 : !state.password)}
                        className="h-12 w-full rounded-2xl bg-primary text-white font-semibold hover:bg-primary/92 hover:text-white disabled:opacity-45 [&_svg]:text-white"
                    >
                        {state.isLoading ? "Verifying..." : "Verify & Login"}
                        <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                </form>
            </GlassCard>
    )
}
