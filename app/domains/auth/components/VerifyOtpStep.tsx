"use client"

import { MessageSquare, ArrowRight, Shield } from "lucide-react"
import { Button } from "@/app/components/ui/button"
import { GlassCard } from "@/app/components/ui/glass-card"
import { LoginBackButton } from "./LoginBackButton"
import type { useLoginFlow } from "../hooks/useLoginFlow"

interface VerifyOtpStepProps {
    flow: ReturnType<typeof useLoginFlow>
}

export function VerifyOtpStep({ flow }: VerifyOtpStepProps) {
    const { state, actions } = flow
    const useEmailLink = state.setupVia === "email_link"
    const showOtpForm = state.setupVia === "otp"
    const useWhatsappOtp = state.setupVia === "whatsapp_otp"
    const otpChannel = state.isEmail ? "email" : "WhatsApp"

    return (
            <GlassCard className="relative overflow-visible rounded-[28px] border-white/10 bg-white/[0.045] p-5 shadow-sm">
                <LoginBackButton onClick={actions.backToIdentifier} />

                {showOtpForm ? (
                    <>
                        <div className="mb-6 pt-10 text-center">
                            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-emerald-200">
                                <Shield className="w-6 h-6" />
                            </div>
                            <h2 className="mb-2 text-2xl font-semibold tracking-tight text-white">Verify your identity</h2>
                            <p className="text-xs leading-relaxed text-white/50">
                                We sent a code to your{" "}
                                <span className="font-semibold text-white">
                                    {otpChannel}
                                </span>
                                . Enter it below to continue.
                            </p>
                        </div>

                        <form onSubmit={actions.handleOtpSubmit} className="space-y-6">
                            <div className="space-y-3">
                                <label className="ml-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/55">
                                    Verification Code
                                </label>
                                <div className="relative group">
                                    <div className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-white/45 group-focus-within:text-white/70">
                                        <MessageSquare className="w-4 h-4" />
                                    </div>
                                    <input
                                        type="text"
                                        required
                                        inputMode="numeric"
                                        pattern="[0-9]*"
                                        maxLength={6}
                                        placeholder="• • • • • •"
                                        value={state.otp}
                                        onChange={(e) => actions.setOtp(e.target.value.replace(/\D/g, ""))}
                                        onFocus={(e) => e.target.select()}
                                        className="h-14 w-full rounded-2xl border border-white/12 bg-white/[0.04] py-0 pl-12 pr-4 text-center text-lg font-bold tracking-[0.5em] text-white outline-none placeholder:text-white/35 focus:border-white/25 focus:bg-white/[0.06]"
                                    />
                                </div>
                                <p className="text-center text-[10px] leading-relaxed text-white/40">
                                    Didn&apos;t receive a code?{" "}
                                    <button
                                        type="button"
                                        disabled={state.isLoading}
                                        onClick={() => actions.resendOtp()}
                                        className="text-emerald-300/70 underline underline-offset-2 hover:text-white disabled:opacity-40"
                                    >
                                        Resend
                                    </button>
                                </p>
                            </div>

                            <Button
                                type="submit"
                                disabled={state.isLoading || state.otp.length < 4}
                                className="h-12 w-full rounded-2xl bg-primary text-white font-semibold hover:bg-primary/92 hover:text-white disabled:opacity-45 [&_svg]:text-white"
                            >
                                {state.isLoading ? "Verifying..." : "Confirm & Continue"}
                                <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                        </form>
                    </>
                ) : useEmailLink ? (
                    <div className="mb-6 pt-10 text-center">
                        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-emerald-200">
                            <Shield className="w-6 h-6" />
                        </div>
                        <h2 className="mb-2 text-2xl font-semibold tracking-tight text-white">Set your password</h2>
                        <p className="mx-auto max-w-sm text-sm leading-relaxed text-white/60">
                            Use the verification link we sent to your email to set your password. Check your inbox (and spam), then open the link to continue.
                        </p>
                    </div>
                ) : useWhatsappOtp ? (
                    <div className="mb-6 pt-10 text-center">
                        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-emerald-200">
                            <Shield className="w-6 h-6" />
                        </div>
                        <h2 className="mb-2 text-2xl font-semibold tracking-tight text-white">One quick step</h2>
                        <p className="mx-auto mb-6 max-w-sm text-sm leading-relaxed text-white/60">
                            Your number is already verified. Send any message to our WhatsApp bot to open a chat, then come back and tap <span className="font-semibold text-emerald-300">Try again</span> — we&apos;ll send your login code there.
                        </p>
                        <Button
                            onClick={actions.backToIdentifier}
                            size="lg"
                            className="h-12 w-full rounded-2xl bg-primary text-white font-semibold hover:bg-primary/92 hover:text-white"
                        >
                            Try again
                            <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                    </div>
                ) : (
                    <div className="mb-6 pt-10 text-center">
                        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-emerald-200">
                            <Shield className="w-6 h-6" />
                        </div>
                        <h2 className="mb-2 text-2xl font-semibold tracking-tight text-white">Activate your number</h2>
                        <p className="mx-auto max-w-sm text-sm leading-relaxed text-white/60">
                            Send a WhatsApp message to our bot to activate your phone number. Once you&apos;ve done that, return here and log in with your phone number.
                        </p>
                    </div>
                )}
            </GlassCard>
    )
}
