"use client"

import { useState, useEffect, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { motion, AnimatePresence } from "framer-motion"
import { ArrowLeft, ArrowRight, Loader2, Lock, ShieldCheck, AlertCircle, Eye, EyeOff } from "lucide-react"
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

function PasswordResetContent() {
    const searchParams = useSearchParams()
    const token = searchParams.get("token")

    const [password, setPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")
    const [showPassword, setShowPassword] = useState(false)
    const [isValidating, setIsValidating] = useState(true)
    const [isResetting, setIsResetting] = useState(false)
    const [status, setStatus] = useState<"verifying" | "ready" | "success" | "error">("verifying")
    const [error, setError] = useState<string | null>(null)
    const [emailMasked, setEmailMasked] = useState<string | null>(null)

    useEffect(() => {
        if (!token) {
            setStatus("error")
            setError("No reset token provided. Please check the link in your email.")
            setIsValidating(false)
            return
        }

        const validateToken = async () => {
            try {
                const response = await apiClient.get<{ valid: boolean; emailMasked: string }>("/security/password-reset-details", { token })
                setEmailMasked(response.emailMasked)
                setStatus("ready")
            } catch (err) {
                setStatus("error")
                if (err instanceof ApiError) {
                    setError(err.message)
                } else {
                    setError("This link is invalid or has expired. Please request a new one.")
                }
            } finally {
                setIsValidating(false)
            }
        }

        validateToken()
    }, [token])

    const handleReset = async (e: React.FormEvent) => {
        e.preventDefault()
        if (password !== confirmPassword) {
            setError("Passwords do not match.")
            return
        }

        setIsResetting(true)
        setError(null)

        try {
            await apiClient.post("/security/reset-password", {
                token,
                password,
            })
            setStatus("success")
        } catch (err) {
            if (err instanceof ApiError) {
                setError(err.message)
            } else {
                setError("Failed to reset password. Please try again.")
            }
        } finally {
            setIsResetting(false)
        }
    }

    if (isValidating) {
        return (
            <div className="flex flex-col items-center justify-center p-12">
                <Loader2 className="w-8 h-8 animate-spin text-brand-gold mb-4" />
                <p className="text-brand-cream/60 text-sm">Verifying reset token...</p>
            </div>
        )
    }

    return (
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
                            <ShieldCheck className="h-10 w-10" />
                        </div>
                        <h2 className="text-xl font-serif text-brand-cream font-medium mb-3">Password Updated</h2>
                        <p className="text-brand-cream/60 text-sm mb-8 leading-relaxed">
                            Your password has been reset successfully. You can now log in to your account with your new credentials.
                        </p>
                        <Link href="/login" className="block w-full group">
                            <Button className="w-full h-12 rounded-xl bg-brand-gold text-brand-deep font-bold hover:bg-brand-gold/90 transition-all shadow-lg shadow-brand-gold/10 group-active:scale-[0.98]">
                                Back to Login
                            </Button>
                        </Link>
                    </GlassCard>
                </motion.div>
            ) : status === "error" ? (
                <motion.div
                    key="error"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                >
                    <GlassCard className="p-8 text-center border-white/10 bg-white/5 shadow-2xl">
                        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-red-400/20 text-red-400">
                            <AlertCircle className="h-10 w-10" />
                        </div>
                        <h2 className="text-xl font-serif text-brand-cream font-medium mb-3">Link Invalid</h2>
                        <p className="text-brand-cream/60 text-sm mb-8 leading-relaxed">
                            {error || "This reset link is either invalid or has already been used."}
                        </p>
                        <Link href="/forgot-password" suppressHydrationWarning className="block w-full group">
                            <Button className="w-full h-12 rounded-xl bg-white/10 text-brand-cream border border-white/20 hover:bg-white/20 hover:border-white/30 transition-all active:scale-[0.98]">
                                Request New Link
                            </Button>
                        </Link>
                    </GlassCard>
                </motion.div>
            ) : (
                <motion.div
                    key="ready"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                >
                    <GlassCard className="p-8 border-white/10 shadow-2xl bg-white/5">
                        <div className="mb-8 flex items-center justify-between">
                            <div>
                                <h2 className="text-lg font-serif text-brand-cream font-medium">Create New Password</h2>
                                <p className="text-[10px] text-brand-cream/40 uppercase tracking-widest mt-1">
                                    Account: {emailMasked}
                                </p>
                            </div>
                            <div className="h-10 w-10 rounded-xl bg-brand-gold/10 flex items-center justify-center text-brand-gold">
                                <Lock className="w-5 h-5" />
                            </div>
                        </div>

                        <form onSubmit={handleReset} className="space-y-6">
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
                                            type={showPassword ? "text" : "password"}
                                            required
                                            minLength={8}
                                            autoFocus
                                            placeholder="Enter strong password"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            className="w-full bg-white/10 border border-white/20 rounded-2xl py-4 pl-12 pr-12 text-brand-cream placeholder:text-white/40 outline-none focus:border-brand-gold/40 focus:bg-white/10 transition-all text-sm"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute inset-y-0 right-4 flex items-center text-brand-cream/30 hover:text-brand-gold transition-colors"
                                        >
                                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                        </button>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-gold ml-1">
                                        Confirm Password
                                    </label>
                                    <div className="relative group">
                                        <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-brand-cream/60 group-focus-within:text-brand-gold transition-colors">
                                            <Lock className="w-4 h-4" />
                                        </div>
                                        <input
                                            type="password"
                                            required
                                            placeholder="Repeat password"
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            className="w-full bg-white/10 border border-white/20 rounded-2xl py-4 pl-12 pr-4 text-brand-cream placeholder:text-white/40 outline-none focus:border-brand-gold/40 focus:bg-white/10 transition-all text-sm"
                                        />
                                    </div>
                                </div>
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

                            <div className="space-y-4">
                                <Button
                                    type="submit"
                                    disabled={isResetting || !password || password !== confirmPassword}
                                    className="w-full h-14 rounded-2xl bg-brand-gold text-brand-deep font-bold text-base hover:bg-brand-gold/90 transition-all shadow-xl shadow-brand-gold/15 active:scale-[0.98] group"
                                >
                                    {isResetting ? (
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                    ) : (
                                        <>
                                            Reset Password
                                            <ShieldCheck className="w-5 h-5 ml-2 group-hover:scale-110 transition-transform" />
                                        </>
                                    )}
                                </Button>

                                <p className="text-[10px] text-brand-cream/40 text-center px-4 leading-relaxed">
                                    Use a unique password with at least 8 characters, mixing uppercase, lowercase, and numbers.
                                </p>
                            </div>
                        </form>
                    </GlassCard>
                </motion.div>
            )}
        </AnimatePresence>
    )
}

export default function PasswordResetPage() {
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
                    <div className="relative h-12 w-12 mb-4">
                        <Image
                            src="/images/logo-white.png"
                            alt="Cloove"
                            fill
                            className="object-contain"
                            priority
                        />
                    </div>
                    <h1 className="font-serif text-2xl text-brand-cream font-medium tracking-tight text-center">
                        Secure Account Recovery
                    </h1>
                </div>

                <Suspense fallback={
                    <div className="h-[400px] flex items-center justify-center text-brand-cream/20 bg-white/5 rounded-3xl border border-white/10">
                        <Loader2 className="w-8 h-8 animate-spin" />
                    </div>
                }>
                    <PasswordResetContent />
                </Suspense>

                <p className="mt-8 text-center text-[10px] text-brand-cream/30 uppercase tracking-[0.3em] font-medium">
                    Cloove AI &copy; {new Date().getFullYear()}
                </p>
            </div>
        </div>
    )
}
