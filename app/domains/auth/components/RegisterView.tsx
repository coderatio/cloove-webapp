"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { Mail, Phone, ArrowRight, Loader2, Eye, EyeOff, CheckCircle2, Sparkles, MessageCircle, ExternalLink } from "lucide-react"
import { Button } from "@/app/components/ui/button"
import { Input } from "@/app/components/ui/input"
import { Label } from "@/app/components/ui/label"
import { GlassCard } from "@/app/components/ui/glass-card"
import { CountrySelector } from "@/app/components/ui/country-selector"
import { apiClient } from "@/app/lib/api-client"
import { useCountries } from "@/app/hooks/useCountries"
import type { CountryDetail } from "@/app/components/ui/country-selector"
import { toast } from "sonner"
import { cn } from "@/app/lib/utils"
import { motion, AnimatePresence } from "framer-motion"
import { Briefcase, Users, ShieldCheck, Zap, Globe, Sparkle } from "lucide-react"

const NOISE_BG = `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`

const BOT_NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_BOT_NUMBER?.replace(/\D/g, "") ?? ""
const BOT_DISPLAY = process.env.NEXT_PUBLIC_WHATSAPP_BOT_NUMBER ?? ""
const WHATSAPP_URL = BOT_NUMBER ? `https://wa.me/${BOT_NUMBER}?text=${encodeURIComponent("Hi")}` : ""

interface SignupConfig {
    signupEnabled: boolean
}

function RegisterBackdrop() {
    return (
        <>
            <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
                <div
                    className="absolute inset-0 opacity-[0.45]"
                    style={{
                        background:
                            "radial-gradient(ellipse 120% 80% at 100% 0%, rgba(212, 175, 55, 0.15) 0%, transparent 55%), radial-gradient(ellipse 90% 70% at 0% 100%, rgba(11, 61, 46, 0.4) 0%, transparent 50%), linear-gradient(165deg, var(--color-brand-deep-primary) 0%, #031510 45%, var(--color-brand-deep-secondary) 100%)",
                    }}
                />
                <motion.div 
                    animate={{ 
                        scale: [1, 1.1, 1],
                        opacity: [0.08, 0.12, 0.08]
                    }}
                    transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute -top-1/4 -right-1/4 w-[85%] h-[85%] rounded-full bg-brand-gold blur-[120px]" 
                />
                <motion.div 
                    animate={{ 
                        scale: [1, 1.2, 1],
                        opacity: [0.2, 0.3, 0.2]
                    }}
                    transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute -bottom-1/4 -left-1/4 w-[75%] h-[75%] rounded-full bg-brand-accent/30 blur-[110px]" 
                />
                <div
                    className="absolute top-[18%] left-[8%] w-px h-32 bg-linear-to-b from-brand-gold/40 to-transparent opacity-40 hidden lg:block"
                    aria-hidden
                />
            </div>
            <div
                className="absolute inset-0 opacity-[0.03] pointer-events-none mix-blend-overlay z-1"
                style={{ backgroundImage: NOISE_BG }}
            />
        </>
    )
}

export function RegisterView() {
    const { data: countries = [], isLoading: isLoadingCountries } = useCountries()
    const [signupEnabled, setSignupEnabled] = useState<boolean | null>(null)
    const [identifierType, setIdentifierType] = useState<"email" | "phone">("email")
    const [firstName, setFirstName] = useState("")
    const [middleName, setMiddleName] = useState("")
    const [lastName, setLastName] = useState("")
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [phone, setPhone] = useState("")
    const [country, setCountry] = useState<CountryDetail | null>(null)
    const [showPassword, setShowPassword] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [success, setSuccess] = useState<{ channel: "email" | "phone"; message: string } | null>(null)
    const [step, setStep] = useState<0 | 1>(0)
    const [intendedRole, setIntendedRole] = useState<"business_owner" | "field_agent" | null>(null)
    const [termsAccepted, setTermsAccepted] = useState(false)

    useEffect(() => {
        apiClient
            .get<SignupConfig>("/security/signup-config")
            .then((data) => setSignupEnabled(data.signupEnabled))
            .catch(() => setSignupEnabled(false))
    }, [])

    useEffect(() => {
        if (countries.length && !country) {
            const defaultCountry = countries.find((c) => c.isDefault) ?? countries[0] ?? null
            setCountry(defaultCountry)
        }
    }, [countries, country])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (identifierType === "email" && !email.trim()) {
            toast.error("Email is required")
            return
        }
        if (identifierType === "phone" && (!phone.trim() || !country?.id)) {
            toast.error("Phone and country are required")
            return
        }
        if (!firstName.trim()) {
            toast.error("First name is required")
            return
        }
        if (!termsAccepted) {
            toast.error("Please accept the Terms of Service and Privacy Policy to continue")
            return
        }
        setIsSubmitting(true)
        try {
            const payload: Record<string, unknown> = {
                identifierType,
                firstName: firstName.trim(),
                middleName: middleName.trim() || undefined,
                lastName: lastName.trim() || undefined,
                intendedRole: intendedRole!,
            }
            payload.termsAccepted = true
            if (identifierType === "email") {
                payload.email = email.trim().toLowerCase()
                if (password) payload.password = password
                if (country?.id) payload.country = country.id
            } else {
                payload.phone = phone.trim()
                payload.country = country?.id ?? ""
                if (password) payload.password = password
            }
            const data = await apiClient.post<{ success: boolean; channel: "email" | "phone" }>(
                "/security/register",
                payload
            )
            setSuccess({
                channel: data.channel,
                message:
                    data.channel === "email"
                        ? "Check your email to verify your account."
                        : "Send your first WhatsApp message to our bot to verify your number, then you can set your dashboard password.",
            })
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : "Registration failed"
            toast.error(msg)
        } finally {
            setIsSubmitting(false)
        }
    }

    if (signupEnabled === null || isLoadingCountries) {
        return (
            <div className="min-h-dvh w-full flex flex-col items-center justify-center p-6 relative overflow-hidden bg-brand-deep-950">
                <RegisterBackdrop />
                <div className="relative z-10 flex flex-col items-center gap-4 animate-in fade-in duration-500">
                    <div className="relative h-12 w-12 opacity-90">
                        <Image src="/images/logo-white.png" alt="Cloove" fill className="object-contain" priority />
                    </div>
                    <Loader2 className="w-9 h-9 animate-spin text-brand-gold" aria-label="Loading" />
                    <p className="text-[11px] uppercase tracking-[0.35em] text-brand-cream/40 font-medium">
                        Preparing registration
                    </p>
                </div>
            </div>
        )
    }

    if (!signupEnabled) {
        return (
            <div className="min-h-dvh w-full flex flex-col items-center justify-center p-6 relative overflow-hidden bg-brand-deep-950">
                <RegisterBackdrop />
                <GlassCard className="relative z-10 p-10 max-w-md text-center border-white/10 animate-in fade-in zoom-in-95 duration-500 shadow-2xl shadow-black/30">
                    <div className="mx-auto mb-6 flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/5">
                        <Sparkles className="h-5 w-5 text-brand-gold/80" aria-hidden />
                    </div>
                    <h1 className="font-serif text-2xl sm:text-3xl text-brand-cream font-medium tracking-tight mb-3">
                        Signup is paused
                    </h1>
                    <p className="text-brand-cream/65 text-sm leading-relaxed mb-8">
                        New account registration is not available at this time. We will open the waitlist again soon.
                    </p>
                    <Link href="/login">
                        <Button
                            variant="outline"
                            className="border-brand-gold/35 text-brand-cream hover:bg-brand-gold/10 hover:border-brand-gold/50 transition-all duration-300"
                        >
                            Back to login
                        </Button>
                    </Link>
                </GlassCard>
            </div>
        )
    }

    if (success) {
        const isEmail = success.channel === "email"
        return (
            <div className="min-h-dvh w-full flex flex-col items-center justify-center p-6 bg-brand-deep-950 relative overflow-hidden">
                <RegisterBackdrop />
                <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{ type: "spring", damping: 25, stiffness: 200 }}
                    className="relative z-10 w-full max-w-lg"
                >
                    <GlassCard className="p-10 sm:p-14 border-brand-gold/20 shadow-[0_32px_80px_rgba(0,0,0,0.6)] backdrop-blur-3xl text-center bg-white/[0.03]">
                        <div className="flex justify-center mb-10">
                            <div className="relative">
                                <motion.div 
                                    animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
                                    transition={{ duration: 3, repeat: Infinity }}
                                    className="absolute inset-0 bg-brand-gold/20 blur-2xl rounded-full"
                                />
                                <div className="relative size-24 rounded-[2rem] bg-brand-gold/10 border border-brand-gold/25 flex items-center justify-center overflow-hidden">
                                    <AnimatePresence mode="wait">
                                        <motion.div
                                            key={isEmail ? "mail" : "check"}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -10 }}
                                        >
                                            {isEmail ? 
                                                <Mail className="size-10 text-brand-gold" /> : 
                                                <CheckCircle2 className="size-10 text-brand-gold" />
                                            }
                                        </motion.div>
                                    </AnimatePresence>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4 mb-10">
                            <motion.p
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.3 }}
                                className="text-[10px] font-bold uppercase tracking-[0.5em] text-brand-gold"
                            >
                                {isEmail ? "Transmission Sent" : "One step left"}
                            </motion.p>
                            <h2 className="font-serif text-[2.5rem] leading-[1.1] text-brand-cream tracking-tight">
                                {isEmail ? <>Check your <span className="italic font-normal text-brand-gold/90">inbox.</span></> : <>Message our <span className="italic font-normal text-brand-gold/90">bot.</span></>}
                            </h2>
                            <p className="text-brand-cream/60 leading-relaxed max-w-sm mx-auto font-sans">
                                {success.message}
                            </p>
                        </div>

                        {!isEmail && WHATSAPP_URL && (
                            <motion.div
                                initial={{ opacity: 0, y: 6 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.4 }}
                                className="mb-6 space-y-3"
                            >
                                <a
                                    href={WHATSAPP_URL}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center justify-between gap-3 w-full px-5 py-4 rounded-2xl bg-brand-gold/8 border border-brand-gold/20 hover:bg-brand-gold/12 hover:border-brand-gold/35 transition-all duration-200 group"
                                >
                                    <div className="text-left">
                                        <p className="text-[10px] font-bold uppercase tracking-widest text-brand-gold/55 mb-0.5">
                                            WhatsApp bot number
                                        </p>
                                        <p className="text-lg font-semibold text-brand-cream tracking-wide">
                                            {BOT_DISPLAY}
                                        </p>
                                    </div>
                                    <ExternalLink className="w-4 h-4 text-brand-gold/50 group-hover:text-brand-gold transition-colors shrink-0" />
                                </a>
                                <Button
                                    asChild
                                    className="w-full h-14 rounded-2xl bg-[#25D366] text-white font-bold hover:bg-[#22c55e] transition-all duration-300 shadow-2xl shadow-black/20"
                                >
                                    <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer">
                                        <MessageCircle className="size-5 mr-2" />
                                        Open in WhatsApp
                                    </a>
                                </Button>
                            </motion.div>
                        )}

                        <Button
                            asChild
                            className={isEmail
                                ? "w-full h-14 rounded-2xl bg-brand-gold text-brand-deep font-bold hover:bg-brand-gold/90 transition-all duration-300 shadow-2xl shadow-brand-gold/20"
                                : "w-full h-12 rounded-2xl bg-white/5 border border-white/10 text-brand-cream/70 font-semibold hover:bg-white/8 hover:text-brand-cream transition-all duration-300"
                            }
                        >
                            <Link href="/login" className="flex items-center gap-2 justify-center">
                                {isEmail ? "Enter Workspace" : "I'll do this later — go to login"}
                                <ArrowRight className="size-4" />
                            </Link>
                        </Button>
                    </GlassCard>
                </motion.div>
            </div>
        )
    }

    return (
        <div className="min-h-dvh w-full relative overflow-hidden bg-brand-deep-950 flex flex-col selection:bg-brand-gold/30">
            <RegisterBackdrop />

            <div className="relative z-10 flex-1 flex flex-col justify-center px-4 pt-10 pb-14 sm:px-8 lg:px-14 lg:py-12">
                <div className="mx-auto w-full max-w-6xl">
                    <AnimatePresence mode="wait">
                        {step === 0 ? (
                            <motion.div
                                key="role-selection"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                                className="grid gap-12 lg:grid-cols-[1fr_minmax(400px,680px)] lg:items-center"
                            >
                                <header className="space-y-8">
                                    <div className="flex items-center gap-4">
                                        <div className="relative h-14 w-14 ring-1 ring-brand-gold/30 ring-offset-4 ring-offset-brand-deep-950 rounded-2xl bg-brand-deep-900 overflow-hidden group">
                                            <Image
                                                src="/images/logo-white.png"
                                                alt="Cloove"
                                                fill
                                                className="object-contain p-2 transition-transform duration-700 group-hover:scale-110"
                                                priority
                                            />
                                        </div>
                                        <div className="h-px w-24 bg-linear-to-r from-brand-gold/50 to-transparent" />
                                    </div>

                                    <div className="space-y-5">
                                        <motion.p 
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: 0.2 }}
                                            className="text-[11px] font-bold uppercase tracking-[0.5em] text-brand-gold"
                                        >
                                            Intelligent Operations
                                        </motion.p>
                                        <h1 className="font-serif text-[3.25rem] leading-[1.05] md:text-6xl lg:text-7xl text-brand-cream font-medium tracking-tight">
                                            Choose your <br />
                                            <span className="italic font-normal text-brand-gold/90">vanguard.</span>
                                        </h1>
                                        <p className="text-brand-cream/60 text-lg leading-relaxed max-w-md font-sans">
                                            Select the role that fits your mission. Whether running a business or scaling 
                                            the field, Cloove provides the intelligent edge.
                                        </p>
                                    </div>

                                    <div className="flex flex-wrap gap-3">
                                        {[
                                            { icon: Globe, text: "Global Reach" },
                                            { icon: ShieldCheck, text: "Enterprise Security" },
                                            { icon: Zap, text: "Real-time Intelligence" }
                                        ].map((feat, i) => (
                                            <motion.div 
                                                key={feat.text}
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: 0.4 + i * 0.1 }}
                                                className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-[10px] text-brand-cream/70 uppercase tracking-widest font-semibold"
                                            >
                                                <feat.icon className="size-3 text-brand-gold" />
                                                {feat.text}
                                            </motion.div>
                                        ))}
                                    </div>
                                </header>

                                <div className="grid sm:grid-cols-2 gap-6">
                                    <RoleCard
                                        title="Business Owner"
                                        description="Run your commerce with quiet confidence. Manage inventory, sales, and analytics from one premium dashboard."
                                        icon={Briefcase}
                                        onClick={() => {
                                            setIntendedRole("business_owner")
                                            setStep(1)
                                        }}
                                        badge="Preferred"
                                    />
                                    <RoleCard
                                        title="Field Agent"
                                        description="The engine of the ecosystem. Onboard businesses, earn commissions, and drive operations on the ground."
                                        icon={Users}
                                        onClick={() => {
                                            setIntendedRole("field_agent")
                                            setStep(1)
                                        }}
                                    />
                                </div>
                            </motion.div>
                        ) : (
                            <motion.div
                                key="registration-form"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="grid gap-8 lg:gap-16 lg:grid-cols-[1fr_minmax(300px,440px)] lg:items-center"
                            >
                                <header className="max-w-xl space-y-8">
                                    <button 
                                        onClick={() => setStep(0)}
                                        className="text-brand-gold/65 hover:text-brand-gold flex items-center gap-2 text-xs uppercase tracking-[0.2em] font-bold transition-colors group"
                                    >
                                        <ArrowRight className="size-3 rotate-180 transition-transform group-hover:-translate-x-1" />
                                        Back to selection
                                    </button>
                                    
                                    <div className="space-y-4">
                                        <p className="text-[11px] font-bold uppercase tracking-[0.45em] text-brand-gold">
                                            {intendedRole === "field_agent" ? "Agent Onboarding" : "Merchant Entry"}
                                        </p>
                                        <h1 className="font-serif text-[3rem] leading-[1] sm:text-5xl lg:text-6xl text-brand-cream font-medium tracking-tight">
                                            {intendedRole === "field_agent" ? (
                                                <>Become a <span className="italic font-normal text-brand-gold/90 text-[2.8rem] sm:text-[3.2rem] lg:text-[4rem]">partner.</span></>
                                            ) : (
                                                <>Claim your <span className="italic font-normal text-brand-gold/90 text-[2.8rem] sm:text-[3.2rem] lg:text-[4rem]">workspace.</span></>
                                            )}
                                        </h1>
                                        <p className="text-brand-cream/60 text-lg leading-relaxed max-w-sm">
                                            {intendedRole === "field_agent" 
                                                ? "Join the force driving commerce across the continent. Verify once, earn forever." 
                                                : "Join teams who run operations with quiet confidence—verification stays lightweight."}
                                        </p>
                                    </div>

                                    <div className="hidden lg:flex items-center gap-6 p-6 rounded-3xl bg-brand-gold/5 border border-brand-gold/15 backdrop-blur-sm">
                                        <div className="size-12 rounded-2xl bg-brand-gold/20 flex items-center justify-center shrink-0">
                                            <Sparkle className="size-6 text-brand-gold animate-pulse" />
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-sm font-semibold text-brand-cream">Elite Access</p>
                                            <p className="text-xs text-brand-cream/50 leading-relaxed">
                                                You're registering as a <span className="text-brand-gold">{intendedRole?.replace('_', ' ')}</span>.
                                            </p>
                                        </div>
                                    </div>
                                </header>

                                <div className="relative">
                                    <GlassCard
                                        allowOverflow
                                        className="p-8 sm:p-10 border-white/10 shadow-2xl bg-white/5 backdrop-blur-3xl relative overflow-visible ring-1 ring-white/5"
                                    >
                                        <div className="mb-8">
                                            <h2 className="font-serif text-2xl text-brand-cream tracking-tight">Create account</h2>
                                            <p className="text-brand-cream/50 text-[10px] mt-2 uppercase tracking-[0.25em] font-bold">
                                                Secure Identity Gateway
                                            </p>
                                        </div>

                                        <form onSubmit={handleSubmit} className="space-y-6">
                                            <div
                                                className="flex rounded-2xl bg-black/20 border border-white/5 p-1 gap-1"
                                                role="tablist"
                                            >
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    onClick={() => setIdentifierType("email")}
                                                    className={cn(
                                                        "flex-1 gap-2 py-3 rounded-xl h-auto font-medium transition-all duration-300",
                                                        identifierType === "email"
                                                            ? "bg-brand-gold/15 text-brand-gold border border-brand-gold/25 shadow-2xl shadow-brand-gold/10"
                                                            : "text-brand-cream/45 hover:text-brand-cream hover:bg-white/5"
                                                    )}
                                                >
                                                    <Mail className="size-3.5" />
                                                    Email
                                                </Button>
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    onClick={() => setIdentifierType("phone")}
                                                    className={cn(
                                                        "flex-1 gap-2 py-3 rounded-xl h-auto font-medium transition-all duration-300",
                                                        identifierType === "phone"
                                                            ? "bg-brand-gold/15 text-brand-gold border border-brand-gold/25 shadow-2xl shadow-brand-gold/10"
                                                            : "text-brand-cream/45 hover:text-brand-cream hover:bg-white/5"
                                                    )}
                                                >
                                                    <Phone className="size-3.5" />
                                                    Phone
                                                </Button>
                                            </div>

                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <Label className="text-[10px] font-bold uppercase tracking-widest text-brand-cream/50">
                                                        First name
                                                    </Label>
                                                    <Input
                                                        required
                                                        value={firstName}
                                                        onChange={(e) => setFirstName(e.target.value)}
                                                        className="bg-white/5 border-white/10 text-brand-cream focus:border-brand-gold/50 h-12 md:h-13"
                                                        placeholder="Jane"
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label className="text-[10px] font-bold uppercase tracking-widest text-brand-cream/50">
                                                        Last name
                                                    </Label>
                                                    <Input
                                                        required
                                                        value={lastName}
                                                        onChange={(e) => setLastName(e.target.value)}
                                                        className="bg-white/5 border-white/10 text-brand-cream focus:border-brand-gold/50 h-12 md:h-13"
                                                        placeholder="Doe"
                                                    />
                                                </div>
                                            </div>

                                            {identifierType === "email" ? (
                                                <div className="space-y-4">
                                                    <div className="space-y-2">
                                                        <Label className="text-[10px] font-bold uppercase tracking-widest text-brand-cream/50">
                                                            Email Address
                                                        </Label>
                                                        <Input
                                                            type="email"
                                                            required
                                                            value={email}
                                                            onChange={(e) => setEmail(e.target.value)}
                                                            className="bg-white/5 border-white/10 text-brand-cream focus:border-brand-gold/50 h-12 md:h-13"
                                                            placeholder="jane@company.com"
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label className="text-[10px] font-bold uppercase tracking-widest text-brand-cream/50">
                                                            Country
                                                        </Label>
                                                        <CountrySelector
                                                            countries={countries}
                                                            selectedCountry={country}
                                                            onSelect={setCountry}
                                                            disabled={isSubmitting}
                                                            showName
                                                            triggerClassName="h-12 md:h-13 w-full rounded-xl border-white/10 bg-white/5 text-brand-cream hover:bg-white/10"
                                                        />
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="space-y-2">
                                                    <Label className="text-[10px] font-bold uppercase tracking-widest text-brand-cream/50">
                                                        Phone number
                                                    </Label>
                                                    <div className="flex h-12 md:h-13 rounded-xl border border-white/10 bg-white/5 focus-within:ring-1 focus-within:ring-brand-gold/50 overflow-hidden">
                                                        <CountrySelector
                                                            countries={countries}
                                                            selectedCountry={country}
                                                            onSelect={setCountry}
                                                            disabled={isSubmitting}
                                                            triggerClassName="h-full border-0 bg-transparent px-3 shrink-0"
                                                        />
                                                        <span className="w-px bg-white/10 my-2" />
                                                        <Input
                                                            type="tel"
                                                            required
                                                            value={phone}
                                                            onChange={(e) => setPhone(e.target.value)}
                                                            className="border-0 bg-transparent focus-visible:ring-0 flex-1"
                                                            placeholder={country ? `${country.phoneCode} …` : "Phone"}
                                                        />
                                                    </div>
                                                </div>
                                            )}

                                            <div className="space-y-2">
                                                <Label className="text-[10px] font-bold uppercase tracking-widest text-brand-cream/50">
                                                    Security Password
                                                </Label>
                                                <div className="relative">
                                                    <Input
                                                        type={showPassword ? "text" : "password"}
                                                        value={password}
                                                        onChange={(e) => setPassword(e.target.value)}
                                                        className="bg-white/5 border-white/10 text-brand-cream focus:border-brand-gold/50 h-12 md:h-13 pr-10"
                                                        placeholder="••••••••"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => setShowPassword(!showPassword)}
                                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-cream/30 hover:text-brand-gold transition-colors"
                                                    >
                                                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                                    </button>
                                                </div>
                                            </div>

                                            <label className="flex items-start gap-3 cursor-pointer group">
                                                <div className="relative mt-0.5 shrink-0">
                                                    <input
                                                        type="checkbox"
                                                        checked={termsAccepted}
                                                        onChange={(e) => setTermsAccepted(e.target.checked)}
                                                        className="sr-only peer"
                                                    />
                                                    <div className={cn(
                                                        "size-5 rounded-md border transition-all duration-200 flex items-center justify-center",
                                                        termsAccepted
                                                            ? "bg-brand-gold border-brand-gold"
                                                            : "bg-white/5 border-white/20 group-hover:border-brand-gold/40"
                                                    )}>
                                                        {termsAccepted && (
                                                            <svg className="size-3 text-brand-deep" viewBox="0 0 12 12" fill="none">
                                                                <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                                                            </svg>
                                                        )}
                                                    </div>
                                                </div>
                                                <span className="text-xs text-brand-cream/50 leading-relaxed group-hover:text-brand-cream/70 transition-colors">
                                                    I agree to the{" "}
                                                    <a
                                                        href="https://clooveai.com/terms"
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        onClick={(e) => e.stopPropagation()}
                                                        className="text-brand-gold/80 hover:text-brand-gold underline underline-offset-2 transition-colors"
                                                    >
                                                        Terms of Service
                                                    </a>
                                                    {" "}and{" "}
                                                    <a
                                                        href="https://clooveai.com/privacy"
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        onClick={(e) => e.stopPropagation()}
                                                        className="text-brand-gold/80 hover:text-brand-gold underline underline-offset-2 transition-colors"
                                                    >
                                                        Privacy Policy
                                                    </a>
                                                </span>
                                            </label>

                                            <Button
                                                type="submit"
                                                disabled={isSubmitting || !termsAccepted}
                                                className="w-full h-14 rounded-2xl bg-brand-gold text-brand-deep font-bold hover:bg-brand-gold/90 shadow-2xl shadow-brand-gold/10 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                                            >
                                                {isSubmitting ? (
                                                    <Loader2 className="animate-spin size-5" />
                                                ) : (
                                                    <span className="flex items-center gap-2">
                                                        Initiate Access
                                                        <ArrowRight className="size-4" />
                                                    </span>
                                                )}
                                            </Button>
                                        </form>
                                    </GlassCard>
                                    
                                    <p className="mt-8 text-center text-brand-cream/40 text-sm">
                                        Already a member?{" "}
                                        <Link href="/login" className="text-brand-gold/80 hover:text-brand-gold font-medium transition-colors">
                                            Log in
                                        </Link>
                                    </p>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    )
}

interface RoleCardProps {
    title: string
    description: string
    icon: any
    onClick: () => void
    badge?: string
}

function RoleCard({ title, description, icon: Icon, onClick, badge }: RoleCardProps) {
    return (
        <button
            onClick={onClick}
            className="group relative flex flex-col items-start text-left p-8 rounded-[2rem] bg-white/5 border border-white/10 backdrop-blur-3xl transition-all duration-500 hover:bg-brand-gold/[0.03] hover:border-brand-gold/30 hover:scale-[1.03] hover:shadow-[0_20px_60px_rgba(0,0,0,0.5)] overflow-hidden"
        >
            <div className="absolute top-0 right-0 p-6 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                <ArrowRight className="size-6 text-brand-gold -rotate-45" />
            </div>

            {badge && (
                <div className="absolute top-6 right-6 px-3 py-1 rounded-full bg-brand-gold/15 border border-brand-gold/25 text-[9px] font-bold text-brand-gold uppercase tracking-widest">
                    {badge}
                </div>
            )}

            <div className="mb-8 size-14 rounded-2xl bg-brand-gold/10 border border-brand-gold/20 flex items-center justify-center group-hover:bg-brand-gold group-hover:scale-110 transition-all duration-500">
                <Icon className="size-7 text-brand-gold group-hover:text-brand-deep transition-colors duration-500" />
            </div>

            <h3 className="font-serif text-2xl text-brand-cream mb-3 group-hover:text-brand-gold transition-colors duration-500">
                {title}
            </h3>
            <p className="text-brand-cream/50 text-sm leading-relaxed font-sans group-hover:text-brand-cream/70 transition-colors duration-500">
                {description}
            </p>

            <div className="mt-8 pt-6 border-t border-white/5 w-full">
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-gold/60 group-hover:text-brand-gold transition-colors">
                    Get started
                </span>
            </div>
        </button>
    )
}
