"use client"

import { Lock, Shield, Eye, EyeOff, ArrowRight } from "lucide-react"
import { motion } from "framer-motion"
import { Button } from "@/app/components/ui/button"
import { GlassCard } from "@/app/components/ui/glass-card"
import { cn } from "@/app/lib/utils"
import type { useLoginFlow } from "../hooks/useLoginFlow"

interface VerifyStepProps {
    flow: ReturnType<typeof useLoginFlow>
}

export function VerifyStep({ flow }: VerifyStepProps) {
    const { state, actions } = flow

    return (
        <motion.div
            key="verify"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
        >
            <GlassCard className="p-8 border-white/10 shadow-2xl relative overflow-hidden bg-white/5">
                <button
                    onClick={actions.backToIdentifier}
                    className="absolute top-8 left-8 text-brand-gold/60 hover:text-brand-gold text-xs font-bold uppercase tracking-widest z-20"
                >
                    Back
                </button>

                <form onSubmit={actions.handleVerifySubmit} className="space-y-6 pt-8">
                    <div className="space-y-3">
                        <div className="flex items-center justify-between ml-1">
                            <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-gold">
                                {state.isPinLogin ? "Transaction PIN" : "Password"}
                            </label>
                            {state.isPinLogin && (
                                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-brand-gold/10 text-brand-gold text-[9px] font-bold uppercase border border-brand-gold/20">
                                    <Shield className="w-3 h-3" /> WhatsApp PIN Login
                                </span>
                            )}
                        </div>
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-brand-cream/60 group-focus-within:text-brand-gold transition-colors">
                                <Lock className="w-4 h-4" />
                            </div>
                            <input
                                type={state.showPassword ? "text" : "password"}
                                autoFocus
                                required
                                maxLength={state.isPinLogin ? 4 : undefined}
                                placeholder={state.isPinLogin ? "• • • •" : "Enter password"}
                                value={state.isPinLogin ? state.pin : state.password}
                                onChange={(e) => state.isPinLogin ? actions.setPin(e.target.value.replace(/\D/g, "")) : actions.setPassword(e.target.value)}
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
                        {state.isPinLogin && (
                            <p className="text-[10px] text-brand-cream/60 text-center px-4 leading-relaxed mt-2">
                                First time login? Use the 4-digit PIN you use for WhatsApp transactions.
                            </p>
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
