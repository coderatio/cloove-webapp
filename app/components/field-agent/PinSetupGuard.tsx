"use client"

import React, { useState } from "react"
import { ShieldAlert, ShieldCheck, Loader2 } from "lucide-react"
import { useAuth } from "@/app/components/providers/auth-provider"
import { apiClient } from "@/app/lib/api-client"
import { toast } from "sonner"
import { Input } from "@/app/components/ui/input"
import { Button } from "@/app/components/ui/button"
import Image from "next/image"

export function PinSetupGuard({ children }: { children: React.ReactNode }) {
    const { user, isLoading, refreshUser } = useAuth()
    const [pin, setPin] = useState("")
    const [isSubmitting, setIsSubmitting] = useState(false)

    if (isLoading) return null
    if (!user || user.hasTransactionPin) return <>{children}</>

    const handleSetPin = async () => {
        if (pin.length !== 4 || !/^\d{4}$/.test(pin)) {
            toast.error("PIN must be exactly 4 digits")
            return
        }

        setIsSubmitting(true)
        try {
            await apiClient.patch("/security/pin", { newPin: pin })
            toast.success("Transaction PIN set successfully")
            setPin("")
            await refreshUser()
        } catch (error: any) {
            toast.error(error.message || "Failed to set PIN")
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <div className="min-h-screen bg-brand-cream dark:bg-brand-deep-950 flex items-center justify-center p-4">
            <div className="w-full max-w-md space-y-8 text-center">
                {/* Logo */}
                <div className="flex justify-center">
                    <Image
                        src="/images/logo-green.png"
                        alt="Cloove"
                        width={40}
                        height={40}
                        className="dark:hidden"
                        priority
                    />
                    <Image
                        src="/images/logo-white.png"
                        alt="Cloove"
                        width={40}
                        height={40}
                        className="hidden dark:block"
                        priority
                    />
                </div>

                {/* Icon */}
                <div className="flex justify-center">
                    <div className="w-20 h-20 rounded-2xl bg-brand-gold/10 flex items-center justify-center">
                        <ShieldAlert className="w-10 h-10 text-brand-gold" />
                    </div>
                </div>

                {/* Heading */}
                <div className="space-y-2">
                    <h1 className="text-2xl font-serif font-medium text-brand-deep dark:text-brand-cream">
                        Set Up Your Transaction PIN
                    </h1>
                    <p className="text-sm text-brand-deep/60 dark:text-brand-cream/60">
                        A 4-digit PIN is required to access your dashboard. It protects your payouts and account actions.
                    </p>
                </div>

                {/* PIN Input */}
                <div className="space-y-3">
                    <label className="block text-xs font-bold uppercase tracking-widest text-brand-deep/40 dark:text-brand-cream/40">
                        Choose a 4-digit PIN
                    </label>
                    <Input
                        type="password"
                        inputMode="numeric"
                        placeholder="••••"
                        maxLength={4}
                        value={pin}
                        onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
                        className="h-16 sm:h-16 rounded-2xl border-brand-deep/10 dark:border-white/10 bg-white/50 dark:bg-white/5 font-mono text-2xl tracking-[1em] text-center"
                    />
                </div>

                {/* Submit */}
                <Button
                    onClick={handleSetPin}
                    disabled={isSubmitting || pin.length !== 4}
                    className="w-full h-14 rounded-2xl bg-brand-gold text-brand-deep hover:text-brand-cream font-black uppercase tracking-widest shadow-xl shadow-brand-gold/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50"
                >
                    {isSubmitting ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                        <>
                            <ShieldCheck className="w-4 h-4 mr-2" />
                            Activate Dashboard
                        </>
                    )}
                </Button>

                {/* Security note */}
                <p className="text-[11px] text-brand-deep/40 dark:text-brand-cream/40">
                    Cloove will never ask for your PIN via chat or phone call.
                </p>
            </div>
        </div>
    )
}
