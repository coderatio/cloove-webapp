"use client"

import React, { useState } from "react"
import { GlassCard } from "@/app/components/ui/glass-card"
import { Button } from "@/app/components/ui/button"
import { Input } from "@/app/components/ui/input"
import {
    Key,
    ShieldAlert,
    ShieldCheck,
    Loader2
} from "lucide-react"
import { useAuth } from "@/app/components/providers/auth-provider"
import { apiClient } from "@/app/lib/api-client"
import { toast } from "sonner"

export default function SecurityPage() {
    const { user, refreshUser } = useAuth()
    const [isSubmittingPin, setIsSubmittingPin] = useState(false)
    const [pinData, setPinData] = useState({
        currentPin: "",
        newPin: ""
    })

    const handleUpdatePin = async () => {
        if (!pinData.newPin || pinData.newPin.length !== 4) {
            toast.error('PIN must be exactly 4 digits')
            return
        }

        if (pinData.currentPin === pinData.newPin) {
            toast.error('New PIN cannot be the same as current PIN')
            return
        }

        setIsSubmittingPin(true)
        try {
            await apiClient.patch('/security/pin', {
                currentPin: pinData.currentPin,
                newPin: pinData.newPin
            })

            toast.success(user?.hasTransactionPin ? 'PIN updated successfully' : 'Transaction PIN set successfully')
            setPinData({ currentPin: "", newPin: "" })
            refreshUser()
        } catch (error: any) {
            toast.error(error.message || 'Failed to update PIN')
        } finally {
            setIsSubmittingPin(false)
        }
    }

    return (
        <div className="max-w-4xl mx-auto space-y-8 pb-12">
            <div className="space-y-2">
                <h2 className="text-3xl font-serif font-medium">Security</h2>
                <p className="text-brand-deep/50 dark:text-brand-cream/50">Ensure your account remains secure and private.</p>
            </div>

            {/* Change Password */}
            <GlassCard className="p-8">
                <div className="flex items-center gap-3 mb-8">
                    <div className="w-10 h-10 rounded-xl bg-brand-gold/10 text-brand-gold flex items-center justify-center">
                        <Key className="w-5 h-5" />
                    </div>
                    <h3 className="text-xl font-serif font-medium">Change Password</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-widest text-brand-deep/40 dark:text-brand-cream/40">Current Password</label>
                        <Input type="password" placeholder="••••••••" className="h-16 sm:h-12 rounded-2xl" />
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-widest text-brand-deep/40 dark:text-brand-cream/40">New Password</label>
                        <Input type="password" placeholder="••••••••" className="h-16 sm:h-12 rounded-2xl" />
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-widest text-brand-deep/40 dark:text-brand-cream/40">Confirm New Password</label>
                        <Input type="password" placeholder="••••••••" className="h-16 sm:h-12 rounded-2xl" />
                    </div>
                </div>

                <div className="mt-8 flex justify-end">
                    <Button className="w-full md:w-auto rounded-2xl px-12 h-12 bg-brand-deep text-brand-cream dark:bg-brand-gold dark:text-brand-deep font-bold">Update Password</Button>
                </div>
            </GlassCard>

            {/* Transaction PIN */}
            <GlassCard className="p-8">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-brand-gold/10 text-brand-gold flex items-center justify-center">
                            <ShieldCheck className="w-5 h-5" />
                        </div>
                        <h3 className="text-xl font-serif font-medium">Transaction PIN</h3>
                    </div>
                    {user?.hasTransactionPin && (
                        <span className="text-[10px] hidden sm:block font-black uppercase tracking-widest text-green-600 bg-green-500/10 px-3 py-1.5 rounded-full border border-green-500/20">
                            Active & Secure
                        </span>
                    )}
                </div>

                <div className="bg-brand-gold/5 border border-brand-gold/10 rounded-2xl p-6 mb-8 flex items-start gap-4">
                    <div className="w-8 h-8 rounded-lg bg-brand-deep flex items-center justify-center text-brand-gold shrink-0">
                        <ShieldAlert className="w-4 h-4" />
                    </div>
                    <div>
                        <p className="text-xs font-bold text-brand-deep leading-relaxed">
                            {user?.hasTransactionPin
                                ? "Update your transaction PIN periodically to ensure maximum security for your payouts and account modifications."
                                : "A transaction PIN is required to authorize critical actions such as requesting payouts or linking new payout channels."}
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {user?.hasTransactionPin ? (
                        <>
                            <div className="space-y-4">
                                <label className="text-xs font-bold uppercase tracking-widest text-brand-deep/40 dark:text-brand-cream/40 ml-1">Current PIN</label>
                                <Input
                                    type="password"
                                    placeholder="••••"
                                    maxLength={4}
                                    value={pinData.currentPin}
                                    onChange={(e) => setPinData(p => ({ ...p, currentPin: e.target.value }))}
                                    className="h-16 sm:h-16 rounded-2xl border-brand-deep/10 dark:border-white/10 bg-white/50 dark:bg-white/5 font-mono text-2xl tracking-[1em] text-center"
                                />
                            </div>
                            <div className="space-y-4">
                                <label className="text-xs font-bold uppercase tracking-widest text-brand-deep/40 dark:text-brand-cream/40 ml-1">New PIN</label>
                                <Input
                                    type="password"
                                    placeholder="••••"
                                    maxLength={4}
                                    value={pinData.newPin}
                                    onChange={(e) => setPinData(p => ({ ...p, newPin: e.target.value }))}
                                    className="h-16 sm:h-16 rounded-2xl border-brand-deep/10 dark:border-white/10 bg-white/50 dark:bg-white/5 font-mono text-2xl tracking-[1em] text-center"
                                />
                            </div>
                        </>
                    ) : (
                        <div className="md:col-span-2 space-y-4 max-w-sm">
                            <label className="text-xs font-bold uppercase tracking-widest text-brand-deep/40 dark:text-brand-cream/40 ml-1">Choose a 4-digit PIN</label>
                            <Input
                                type="password"
                                placeholder="••••"
                                maxLength={4}
                                value={pinData.newPin}
                                onChange={(e) => setPinData(p => ({ ...p, newPin: e.target.value }))}
                                className="h-16 sm:h-16 rounded-2xl border-brand-deep/10 dark:border-white/10 bg-white/50 dark:bg-white/5 font-mono text-2xl tracking-[1em] text-center"
                            />
                        </div>
                    )}
                </div>

                <div className="mt-10 flex justify-end">
                    <Button
                        onClick={handleUpdatePin}
                        disabled={isSubmittingPin || !pinData.newPin || (user?.hasTransactionPin && !pinData.currentPin)}
                        className="w-full md:w-auto rounded-2xl px-12 h-14 bg-brand-gold text-brand-deep font-black uppercase tracking-widest shadow-xl shadow-brand-gold/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50"
                    >
                        {isSubmittingPin ? <Loader2 className="w-5 h-5 animate-spin" /> : (user?.hasTransactionPin ? "Change PIN" : "Set Transaction PIN")}
                    </Button>
                </div>
            </GlassCard>

            <GlassCard className="p-8 border-brand-deep/5 dark:border-white/5 bg-brand-deep/5 dark:bg-white/5">
                <div className="flex items-center gap-6">
                    <div className="w-12 h-12 rounded-xl bg-brand-deep/10 dark:bg-white/10 flex items-center justify-center text-brand-deep/40 dark:text-brand-cream/40">
                        <ShieldAlert className="w-6 h-6" />
                    </div>
                    <div>
                        <h4 className="font-bold text-sm">Security Policy</h4>
                        <p className="text-xs text-brand-deep/50 dark:text-brand-cream/50">Cloove will never ask for your PIN via chat or phone call. Always use secure links for identity verification.</p>
                    </div>
                </div>
            </GlassCard>
        </div>
    )
}
