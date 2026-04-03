"use client"

import { Lock, Shield, Eye, EyeOff, ArrowRight, MessageCircle } from "lucide-react"
import { motion } from "framer-motion"
import Link from "next/link"
import { Button } from "@/app/components/ui/button"
import { GlassCard } from "@/app/components/ui/glass-card"
import { cn } from "@/app/lib/utils"
import { LoginBackButton } from "./LoginBackButton"
import type { useLoginFlow } from "../hooks/useLoginFlow"

interface VerifyStepProps {
    flow: ReturnType<typeof useLoginFlow>
}

export function VerifyStep({ flow }: VerifyStepProps) {
    const { state, actions } = flow

    if (state.phoneActivationRequired) {
        return (
            <motion.div
                key="verify-activate"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
            >
                <GlassCard className="p-8 sm:p-10 text-center border-white/10 bg-white/5 shadow-2xl shadow-black/20">
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.1, duration: 0.3, ease: [0.34, 1.56, 0.64, 1] }}
                        className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-gold/20 text-brand-gold"
                    >
                        <MessageCircle className="h-7 w-7" aria-hidden />
                    </motion.div>
                    <motion.h1
                        className="font-serif text-2xl sm:text-3xl text-brand-cream font-medium tracking-tight mb-2"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.15, duration: 0.25 }}
                    >
                        Activate your number
                    </motion.h1>
                    <motion.p
                        className="text-brand-cream/80 text-sm sm:text-base mb-8 max-w-sm mx-auto leading-relaxed"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.2, duration: 0.25 }}
                    >
                        Send a message to our WhatsApp bot to activate your phone number, then come back here to log in.
                    </motion.p>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.28, duration: 0.25 }}
                    >
                        <Button
                            onClick={actions.backToIdentifier}
                            size="lg"
                            className="w-full min-w-[180px] h-12 rounded-xl bg-brand-gold text-brand-deep font-semibold hover:bg-brand-gold/90 shadow-lg shadow-brand-gold/20 transition-transform hover:scale-[1.02] active:scale-[0.98]"
                        >
                            Back to login
                            <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                    </motion.div>
                </GlassCard>
            </motion.div>
        )
    }

    return (
        <motion.div
            key="verify"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
        >
            <GlassCard className="p-8 border-white/10 shadow-2xl relative overflow-visible bg-white/5">
                <LoginBackButton onClick={actions.backToIdentifier} />

                <form onSubmit={actions.handleVerifySubmit} className="space-y-6 pt-10">
                    <div className="space-y-3">
                        <div className="flex items-center justify-between ml-1">
                            <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-gold">
                                {state.isPinLogin ? "Transaction PIN" : "Password"}
                            </label>
                            {state.isPinLogin ? (
                                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-brand-gold/10 text-brand-gold text-[9px] font-bold uppercase border border-brand-gold/20">
                                    <Shield className="w-3 h-3" /> WhatsApp PIN Login
                                </span>
                            ) : null}
                        </div>
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-brand-cream/60 group-focus-within:text-brand-gold transition-colors">
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
                                    "w-full bg-white/10 border border-white/20 rounded-2xl py-4 pl-12 pr-12 text-brand-cream placeholder:text-white/40 outline-none focus:border-brand-gold/40 focus:bg-white/10 transition-all text-base tracking-widest",
                                    state.isPinLogin && "text-center tracking-[1em] pl-4 font-bold"
                                )}
                            />
                            <button
                                type="button"
                                onClick={() => actions.setShowPassword(!state.showPassword)}
                                className="absolute cursor-pointer inset-y-0 right-4 flex items-center text-brand-cream/30 hover:text-brand-gold transition-colors"
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
                                    className="text-[11px] font-medium text-brand-gold/60 hover:text-brand-gold transition-colors"
                                >
                                    Forgot password?
                                </Link>
                            </div>
                        )}
                    </div>

                    <Button
                        type="submit"
                        disabled={state.isLoading || (state.isPinLogin ? state.pin.length < 4 : !state.password)}
                        className="w-full h-14 rounded-2xl bg-brand-gold text-brand-deep font-bold text-base hover:bg-brand-gold/90 transition-all shadow-xl shadow-brand-gold/10 group"
                    >
                        {state.isLoading ? "Verifying..." : "Verify & Login"}
                        <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                    </Button>
                </form>
            </GlassCard>
        </motion.div>
    )
}
