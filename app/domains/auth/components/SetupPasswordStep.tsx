"use client"

import { Lock, Sparkles, Shield, CheckCircle2 } from "lucide-react"
import { motion } from "framer-motion"
import { Button } from "@/app/components/ui/button"
import { GlassCard } from "@/app/components/ui/glass-card"
import type { useLoginFlow } from "../hooks/use-login-flow"

interface SetupPasswordStepProps {
    flow: ReturnType<typeof useLoginFlow>
}

export function SetupPasswordStep({ flow }: SetupPasswordStepProps) {
    const { state, actions } = flow

    return (
        <motion.div
            key="setup"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        >
            <GlassCard className="p-8 border-brand-gold/20 bg-brand-gold/5 shadow-2xl relative overflow-hidden bg-white/5">
                <div className="absolute top-0 right-0 p-6 opacity-10 pointer-events-none">
                    <Sparkles className="w-24 h-24 text-brand-gold" />
                </div>

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
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-gold ml-1">
                                New Password
                            </label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-brand-cream/60 group-focus-within:text-brand-gold transition-colors">
                                    <Lock className="w-4 h-4" />
                                </div>
                                <input
                                    type="password"
                                    required
                                    autoFocus
                                    placeholder="Must be at least 8 characters"
                                    value={state.newPassword}
                                    onChange={(e) => actions.setNewPassword(e.target.value)}
                                    className="w-full bg-white/10 border border-white/20 rounded-2xl py-4 pl-12 pr-4 text-brand-cream placeholder:text-white/40 outline-none focus:border-brand-gold/40 focus:bg-white/10 transition-all"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-gold ml-1">
                                Confirm Password
                            </label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-brand-cream/60 group-focus-within:text-brand-gold transition-colors">
                                    <CheckCircle2 className="w-4 h-4" />
                                </div>
                                <input
                                    type="password"
                                    required
                                    placeholder="Repeat password"
                                    value={state.confirmPassword}
                                    onChange={(e) => actions.setConfirmPassword(e.target.value)}
                                    className="w-full bg-white/10 border border-white/20 rounded-2xl py-4 pl-12 pr-4 text-brand-cream placeholder:text-white/40 outline-none focus:border-brand-gold/40 focus:bg-white/10 transition-all"
                                />
                            </div>
                        </div>
                    </div>

                    <Button
                        type="submit"
                        disabled={state.isLoading || !state.newPassword || state.newPassword !== state.confirmPassword || state.newPassword.length < 6}
                        className="w-full h-14 rounded-2xl bg-brand-gold text-brand-deep font-bold text-base hover:bg-brand-gold/90 transition-all shadow-xl shadow-brand-gold/10"
                    >
                        {state.isLoading ? "Setting up..." : "Create Password & Enter"}
                    </Button>
                </form>
            </GlassCard>
        </motion.div>
    )
}
