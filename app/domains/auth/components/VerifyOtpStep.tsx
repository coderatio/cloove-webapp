"use client"

import { MessageSquare, ArrowRight, Shield } from "lucide-react"
import { motion } from "framer-motion"
import { Button } from "@/app/components/ui/button"
import { GlassCard } from "@/app/components/ui/glass-card"
import { LoginBackButton } from "./LoginBackButton"
import type { useLoginFlow } from "../hooks/useLoginFlow"

interface VerifyOtpStepProps {
    flow: ReturnType<typeof useLoginFlow>
}

export function VerifyOtpStep({ flow }: VerifyOtpStepProps) {
    const { state, actions } = flow

    return (
        <motion.div
            key="verify-otp"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
        >
            <GlassCard className="p-8 border-brand-gold/20 bg-brand-gold/5 shadow-2xl relative overflow-visible">
                {/* Back button */}
                <LoginBackButton onClick={actions.backToIdentifier} />

                {/* Header */}
                <div className="text-center mb-8 pt-6">
                    <div className="h-12 w-12 rounded-full bg-brand-gold/20 flex items-center justify-center text-brand-gold mx-auto mb-4 border border-brand-gold/20">
                        <Shield className="w-6 h-6" />
                    </div>
                    <h2 className="font-serif text-2xl text-brand-gold mb-2">Verify Your Identity</h2>
                    <p className="text-xs text-brand-cream/50 leading-relaxed">
                        We sent a code to your{" "}
                        <span className="text-brand-cream font-semibold">
                            {state.identifier.includes("@") ? "email" : "phone"}
                        </span>
                        . Enter it below to continue.
                    </p>
                </div>

                <form onSubmit={actions.handleOtpSubmit} className="space-y-6">
                    <div className="space-y-3">
                        <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-gold ml-1">
                            Verification Code
                        </label>
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-brand-cream/60 group-focus-within:text-brand-gold transition-colors">
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
                                className="w-full bg-white/10 border border-white/20 rounded-2xl py-4 pl-12 pr-4 text-brand-cream placeholder:text-white/40 outline-none focus:border-brand-gold/40 focus:bg-white/10 transition-all text-center tracking-[0.5em] font-bold text-lg"
                            />
                        </div>
                        <p className="text-[10px] text-brand-cream/40 text-center leading-relaxed">
                            Didn&apos;t receive a code?{" "}
                            <button
                                type="button"
                                onClick={() => actions.handleIdentifierSubmit({ preventDefault: () => { } } as any)}
                                className="text-brand-gold/70 hover:text-brand-gold underline underline-offset-2 transition-colors"
                            >
                                Resend
                            </button>
                        </p>
                    </div>

                    <Button
                        type="submit"
                        disabled={state.isLoading || state.otp.length < 4}
                        className="w-full h-14 rounded-2xl bg-brand-gold text-brand-deep font-bold text-base hover:bg-brand-gold/90 transition-all shadow-xl shadow-brand-gold/10 group"
                    >
                        {state.isLoading ? "Verifying..." : "Confirm & Continue"}
                        <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                    </Button>
                </form>
            </GlassCard>
        </motion.div>
    )
}
