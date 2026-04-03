"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { motion, AnimatePresence } from "framer-motion"
import { ArrowLeft, ArrowRight, Loader2, Mail, Lock, CheckCircle2, Shield } from "lucide-react"
import { apiClient, ApiError } from "@/app/lib/api-client"
import { Button } from "@/app/components/ui/button"
import { GlassCard } from "@/app/components/ui/glass-card"
import { cn } from "@/app/lib/utils"

// Background elements to match login page
function BackgroundDecor() {
    return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
            <div className="absolute -top-1/4 -right-1/4 w-[80%] h-[80%] rounded-full bg-brand-gold/10 blur-[100px] animate-float-slow" />
            <div className="absolute -bottom-1/4 -left-1/4 w-[70%] h-[70%] rounded-full bg-brand-green/15 blur-[100px] animate-float-slower" />
        </div>
    )
}

export default function ForgotPasswordPage() {
    const [identifier, setIdentifier] = useState("")
    const [email, setEmail] = useState("")
    const [pin, setPin] = useState("")
    const [status, setStatus] = useState<"idle" | "email_required" | "success">("idle")
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)
        setError(null)

        try {
            const response = await apiClient.post<{ status: string }>("/security/forgot-password", {
                identifier,
                email: status === "email_required" ? email : undefined,
                pin: status === "email_required" ? pin : undefined,
            }, { fullResponse: true })

            if (response.data?.status === "EMAIL_REQUIRED") {
                setStatus("email_required")
            } else {
                setStatus("success")
            }
        } catch (err) {
            if (err instanceof ApiError) {
                setError(err.message)
            } else {
                setError("An unexpected error occurred. Please try again.")
            }
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="min-h-dvh w-full flex flex-col items-center justify-center p-4 relative overflow-hidden bg-brand-deep-950">
            <BackgroundDecor />

            {/* Noise Overlay */}
            <div
                className="absolute inset-0 opacity-[0.05] pointer-events-none mix-blend-overlay z-1"
                style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}
            />

            <div className="w-full max-w-md relative z-10">
                {/* Logo Section */}
                <div className="flex flex-col items-center mb-8">
                    <Link href="/login" className="relative h-12 w-12 mb-4 hover:scale-105 transition-transform">
                        <Image
                            src="/images/logo-white.png"
                            alt="Cloove"
                            fill
                            className="object-contain"
                            priority
                        />
                    </Link>
                    <h1 className="font-serif text-2xl text-brand-cream font-medium tracking-tight text-center">
                        Secure Password Reset
                    </h1>
                </div>

                <AnimatePresence mode="wait">
                    {status === "success" ? (
                        <motion.div
                            key="success"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                        >
                            <GlassCard className="p-8 text-center border-white/10 bg-white/5 shadow-2xl">
                                <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-brand-green-400/20 text-brand-green-400">
                                    <CheckCircle2 className="h-10 w-10" />
                                </div>
                                <h2 className="text-xl font-serif text-brand-cream font-medium mb-3">Check your messages</h2>
                                <p className="text-brand-cream/60 text-sm mb-8 leading-relaxed">
                                    If an account matches <span className="font-bold text-brand-cream">{identifier}</span>, we&apos;ve sent a secure reset link to your email and WhatsApp (if active).
                                </p>
                                <Link href="/login" className="block w-full group">
                                    <Button className="w-full h-12 rounded-xl bg-brand-gold text-brand-deep font-bold hover:bg-brand-gold/90 transition-all shadow-lg shadow-brand-gold/10 group-active:scale-[0.98]">
                                        Back to Login
                                    </Button>
                                </Link>
                            </GlassCard>
                        </motion.div>
                    ) : (
                        <motion.div
                            key={status}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                        >
                            <GlassCard className="p-8 border-white/10 shadow-2xl bg-white/5">
                                <Link
                                    href="/login"
                                    className="inline-flex items-center text-xs font-medium text-brand-gold/80 hover:text-brand-gold mb-6 transition-colors group"
                                >
                                    <ArrowLeft className="w-3 h-3 mr-1.5 group-hover:-translate-x-0.5 transition-transform" />
                                    Back to login
                                </Link>

                                <form onSubmit={handleSubmit} className="space-y-6">
                                    <div className="space-y-4">
                                        {status === "idle" ? (
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-gold ml-1">
                                                    Your Identifier
                                                </label>
                                                <div className="relative group">
                                                    <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-brand-cream/60 group-focus-within:text-brand-gold transition-colors">
                                                        <Mail className="w-4 h-4" />
                                                    </div>
                                                    <input
                                                        type="text"
                                                        required
                                                        autoFocus
                                                        placeholder="Email address or phone number"
                                                        value={identifier}
                                                        onChange={(e) => setIdentifier(e.target.value)}
                                                        className="w-full bg-white/10 border border-white/20 rounded-2xl py-4 pl-12 pr-4 text-brand-cream placeholder:text-white/40 outline-none focus:border-brand-gold/40 focus:bg-white/10 transition-all text-sm"
                                                    />
                                                </div>
                                                <p className="text-[10px] text-brand-cream/40 px-1 leading-relaxed">
                                                    Enter the email or phone number associated with your account.
                                                </p>
                                            </div>
                                        ) : (
                                            <>
                                                <div className="p-3 rounded-xl bg-brand-gold/10 border border-brand-gold/20 mb-2">
                                                    <p className="text-[11px] text-brand-gold leading-relaxed">
                                                        It looks like you haven&apos;t set an email yet. Please provide one and enter your transaction PIN to continue.
                                                    </p>
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-gold ml-1">
                                                        Recovery Email
                                                    </label>
                                                    <div className="relative group">
                                                        <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-brand-cream/60 group-focus-within:text-brand-gold transition-colors">
                                                            <Mail className="w-4 h-4" />
                                                        </div>
                                                        <input
                                                            type="email"
                                                            required
                                                            autoFocus
                                                            placeholder="Enter your email address"
                                                            value={email}
                                                            onChange={(e) => setEmail(e.target.value)}
                                                            className="w-full bg-white/10 border border-white/20 rounded-2xl py-4 pl-12 pr-4 text-brand-cream placeholder:text-white/40 outline-none focus:border-brand-gold/40 focus:bg-white/10 transition-all text-sm"
                                                        />
                                                    </div>
                                                </div>
                                                <div className="space-y-2">
                                                    <div className="flex items-center justify-between ml-1">
                                                        <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-gold">
                                                            Transaction PIN
                                                        </label>
                                                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-brand-gold/10 text-brand-gold text-[9px] font-bold uppercase border border-brand-gold/20">
                                                            <Shield className="w-3 h-3" /> Identity Verification
                                                        </span>
                                                    </div>
                                                    <div className="relative group">
                                                        <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-brand-cream/60 group-focus-within:text-brand-gold transition-colors">
                                                            <Lock className="w-4 h-4" />
                                                        </div>
                                                        <input
                                                            type="password"
                                                            required
                                                            inputMode="numeric"
                                                            pattern="[0-9]*"
                                                            maxLength={4}
                                                            placeholder="• • • •"
                                                            value={pin}
                                                            onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
                                                            className="w-full bg-white/10 border border-white/20 rounded-2xl py-4 pl-12 pr-4 text-brand-cream placeholder:text-white/40 outline-none focus:border-brand-gold/40 focus:bg-white/10 transition-all text-center tracking-[1em] font-bold text-lg"
                                                        />
                                                    </div>
                                                </div>
                                            </>
                                        )}
                                    </div>

                                    {error && (
                                        <motion.div
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: "auto" }}
                                            className="text-red-400 text-xs bg-red-400/10 border border-red-400/20 p-3 rounded-xl"
                                        >
                                            {error}
                                        </motion.div>
                                    )}

                                    <Button
                                        type="submit"
                                        disabled={isLoading}
                                        className="w-full h-14 rounded-2xl bg-brand-gold text-brand-deep font-bold text-base hover:bg-brand-gold/90 transition-all shadow-xl shadow-brand-gold/15 active:scale-[0.98] group"
                                    >
                                        {isLoading ? (
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                        ) : (
                                            <>
                                                {status === "idle" ? "Request Reset Link" : "Set Email & Verify"}
                                                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                                            </>
                                        )}
                                    </Button>
                                </form>
                            </GlassCard>
                        </motion.div>
                    )}
                </AnimatePresence>

                <p className="mt-8 text-center text-[10px] text-brand-cream/30 uppercase tracking-[0.3em] font-medium">
                    Cloove AI &copy; {new Date().getFullYear()}
                </p>
            </div>
        </div>
    )
}
