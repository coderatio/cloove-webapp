"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Phone, Mail, Lock, ArrowRight, Sparkles, Shield, Eye, EyeOff, CheckCircle2 } from "lucide-react"
import { Button } from "@/app/components/ui/button"
import { GlassCard } from "@/app/components/ui/glass-card"
import { cn } from "@/app/lib/utils"
import Image from "next/image"

type LoginStep = 'identifier' | 'verify' | 'setup-password' | 'success'

export default function LoginPage() {
    const [step, setStep] = useState<LoginStep>('identifier')
    const [identifier, setIdentifier] = useState("") // Phone or Email
    const [password, setPassword] = useState("")
    const [pin, setPin] = useState("")
    const [newPassword, setNewPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")
    const [showPassword, setShowPassword] = useState(false)
    const [isPinLogin, setIsPinLogin] = useState(false) // If true, password isn't set yet

    // Detection logic for Identifier
    const isEmail = identifier.includes("@")
    const isPhone = /^\d+$/.test(identifier.replace(/\+/g, "")) && identifier.length >= 7

    const handleIdentifierSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (!identifier) return

        // Mock logic: assume phone numbers need PIN first (WhatsApp registration)
        // and emails have passwords already.
        if (isPhone) {
            setIsPinLogin(true)
        } else {
            setIsPinLogin(false)
        }
        setStep('verify')
    }

    const handleVerifySubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (isPinLogin) {
            setStep('setup-password')
        } else {
            setStep('success')
        }
    }

    const handleSetupSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        setStep('success')
    }

    return (
        <div className="min-h-[100dvh] w-full flex flex-col items-center justify-center p-4 relative overflow-hidden bg-brand-deep">
            {/* 1. Animated Mesh Gradients (Optimized) */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
                <motion.div
                    animate={{
                        x: [0, 40, 0],
                        y: [0, -30, 0],
                        scale: [1, 1.1, 1],
                    }}
                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                    className="absolute -top-1/4 -right-1/4 w-[80%] h-[80%] rounded-full bg-brand-gold/10 blur-[100px] will-change-transform"
                />
                <motion.div
                    animate={{
                        x: [0, -50, 0],
                        y: [0, 40, 0],
                        scale: [1.05, 0.95, 1.05],
                    }}
                    transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
                    className="absolute -bottom-1/4 -left-1/4 w-[70%] h-[70%] rounded-full bg-brand-green/15 blur-[100px] will-change-transform"
                />
            </div>

            {/* 2. Noise Overlay */}
            <div
                className="absolute inset-0 opacity-[0.05] pointer-events-none mix-blend-overlay z-1"
                style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}
            />

            <div className="w-full max-w-md relative z-10">
                {/* Logo Section */}
                <div className="flex flex-col items-center mb-12">
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="relative h-16 w-16 mb-4"
                    >
                        <Image
                            src="/images/logo-white.png"
                            alt="Cloove"
                            fill
                            className="object-contain"
                        />
                    </motion.div>
                    <motion.h1
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className="font-serif text-3xl md:text-4xl text-brand-cream font-medium tracking-tight text-center"
                    >
                        Welcome Back
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.3 }}
                        className="text-brand-cream/60 text-sm mt-3 tracking-wide uppercase font-bold text-center"
                    >
                        Your calm intelligence partner
                    </motion.p>
                </div>

                <AnimatePresence mode="wait">
                    {/* STEP 1: IDENTIFIER */}
                    {step === 'identifier' && (
                        <motion.div
                            key="identifier"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.4, ease: "easeOut" }}
                        >
                            <GlassCard className="p-8 border-white/10 shadow-2xl bg-white/5">
                                <form onSubmit={handleIdentifierSubmit} className="space-y-6">
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-gold ml-1">
                                            Phone or Email
                                        </label>
                                        <div className="relative group">
                                            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-brand-cream/60 group-focus-within:text-brand-gold transition-colors">
                                                {isEmail ? <Mail className="w-4 h-4" /> : <Phone className="w-4 h-4" />}
                                            </div>
                                            <input
                                                type="text"
                                                autoFocus
                                                required
                                                placeholder="e.g. 08123456789"
                                                value={identifier}
                                                onChange={(e) => setIdentifier(e.target.value)}
                                                className="w-full bg-white/10 border border-white/20 rounded-2xl py-4 pl-12 pr-4 text-brand-cream placeholder:text-white/40 outline-none focus:border-brand-gold/40 focus:bg-white/10 transition-all text-base"
                                            />
                                        </div>
                                        <p className="text-[10px] text-brand-cream/60 ml-1">
                                            Register via WhatsApp? Use your phone number to start.
                                        </p>
                                    </div>

                                    <Button
                                        type="submit"
                                        disabled={!identifier || (!isEmail && !isPhone)}
                                        className="w-full h-14 rounded-2xl bg-brand-gold text-brand-deep font-bold text-base hover:bg-brand-gold/90 transition-all shadow-xl shadow-brand-gold/10 group"
                                    >
                                        Continue
                                        <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                                    </Button>
                                </form>
                            </GlassCard>
                        </motion.div>
                    )}

                    {/* STEP 2: VERIFY (Password or PIN) */}
                    {step === 'verify' && (
                        <motion.div
                            key="verify"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.4, ease: "easeOut" }}
                        >
                            <GlassCard className="p-8 border-white/10 shadow-2xl relative overflow-hidden bg-white/5">
                                <button
                                    onClick={() => setStep('identifier')}
                                    className="absolute top-8 left-8 text-brand-gold/60 hover:text-brand-gold text-xs font-bold uppercase tracking-widest z-20"
                                >
                                    Back
                                </button>

                                <form onSubmit={handleVerifySubmit} className="space-y-6 pt-8">
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between ml-1">
                                            <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-gold">
                                                {isPinLogin ? "Transaction PIN" : "Password"}
                                            </label>
                                            {isPinLogin && (
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
                                                type={showPassword ? "text" : (isPinLogin ? "tel" : "password")}
                                                autoFocus
                                                required
                                                maxLength={isPinLogin ? 4 : undefined}
                                                placeholder={isPinLogin ? "• • • •" : "Enter password"}
                                                value={isPinLogin ? pin : password}
                                                onChange={(e) => isPinLogin ? setPin(e.target.value.replace(/\D/g, "")) : setPassword(e.target.value)}
                                                className={cn(
                                                    "w-full bg-white/10 border border-white/20 rounded-2xl py-4 pl-12 pr-12 text-brand-cream placeholder:text-white/40 outline-none focus:border-brand-gold/40 focus:bg-white/10 transition-all text-base tracking-widest",
                                                    isPinLogin && "text-center tracking-[1em] pl-4 font-bold"
                                                )}
                                            />
                                            {!isPinLogin && (
                                                <button
                                                    type="button"
                                                    onClick={() => setShowPassword(!showPassword)}
                                                    className="absolute inset-y-0 right-4 flex items-center text-brand-cream/30 hover:text-brand-gold transition-colors"
                                                >
                                                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                                </button>
                                            )}
                                        </div>
                                        {isPinLogin && (
                                            <p className="text-[10px] text-brand-cream/60 text-center px-4 leading-relaxed mt-2">
                                                First time login? Use the 4-digit PIN you use for WhatsApp transactions.
                                            </p>
                                        )}
                                    </div>

                                    <Button
                                        type="submit"
                                        disabled={isPinLogin ? pin.length < 4 : !password}
                                        className="w-full h-14 rounded-2xl bg-brand-gold text-brand-deep font-bold text-base hover:bg-brand-gold/90 transition-all shadow-xl shadow-brand-gold/10 group"
                                    >
                                        Verify & Login
                                        <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                                    </Button>
                                </form>
                            </GlassCard>
                        </motion.div>
                    )}

                    {/* STEP 3: SETUP PASSWORD */}
                    {step === 'setup-password' && (
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

                                <form onSubmit={handleSetupSubmit} className="space-y-6">
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
                                                    value={newPassword}
                                                    onChange={(e) => setNewPassword(e.target.value)}
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
                                                    value={confirmPassword}
                                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                                    className="w-full bg-white/10 border border-white/20 rounded-2xl py-4 pl-12 pr-4 text-brand-cream placeholder:text-white/40 outline-none focus:border-brand-gold/40 focus:bg-white/10 transition-all"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <Button
                                        type="submit"
                                        disabled={!newPassword || newPassword !== confirmPassword || newPassword.length < 6}
                                        className="w-full h-14 rounded-2xl bg-brand-gold text-brand-deep font-bold text-base hover:bg-brand-gold/90 transition-all shadow-xl shadow-brand-gold/10"
                                    >
                                        Create Password & Enter
                                    </Button>
                                </form>
                            </GlassCard>
                        </motion.div>
                    )}

                    {/* SUCCESS STATE */}
                    {step === 'success' && (
                        <motion.div
                            key="success"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="text-center"
                        >
                            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-brand-green/20 text-brand-green mb-6 border border-brand-green/20 relative">
                                <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ type: "spring", damping: 12, stiffness: 200, delay: 0.2 }}
                                >
                                    <CheckCircle2 className="w-10 h-10" />
                                </motion.div>
                                <motion.div
                                    animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
                                    transition={{ duration: 2, repeat: Infinity }}
                                    className="absolute inset-0 rounded-full border border-brand-green"
                                />
                            </div>
                            <h2 className="font-serif text-3xl text-brand-cream mb-2">Welcome Home</h2>
                            <p className="text-brand-cream/60 text-sm mb-8">Accessing your business dashboard...</p>
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: "100%" }}
                                transition={{ duration: 1.5 }}
                                className="h-1 bg-brand-gold rounded-full max-w-[200px] mx-auto opacity-50"
                                onAnimationComplete={() => window.location.href = '/'}
                            />
                        </motion.div>
                    )}
                </AnimatePresence>

                <p className="mt-12 text-center text-[10px] text-brand-cream/30 uppercase tracking-[0.3em] font-medium">
                    Cloove &copy; {new Date().getFullYear()}
                </p>
            </div>
        </div>
    )
}
