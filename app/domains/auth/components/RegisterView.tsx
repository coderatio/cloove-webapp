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
import { Briefcase, Users, ShieldCheck, Zap, Globe, Sparkle, type LucideIcon } from "lucide-react"

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
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(18,87,65,0.28),transparent_42%),linear-gradient(180deg,#061a14_0%,#03100c_100%)]" />
            </div>
        </>
    )
}

export function RegisterView() {
    const { data: countries = [], isLoading: isLoadingCountries } = useCountries()
    const [signupEnabled, setSignupEnabled] = useState<boolean | null>(null)
    const [identifierType, setIdentifierType] = useState<"email" | "phone">("email")
    const [firstName, setFirstName] = useState("")
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
                <div className="relative z-10 flex flex-col items-center gap-4">
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
                <GlassCard className="relative z-10 max-w-md rounded-[28px] border-white/10 bg-white/[0.045] p-8 text-center shadow-sm">
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
                            className="rounded-2xl border-white/10 bg-white/[0.04] text-white/70 hover:bg-white/[0.07] hover:text-white"
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
            <div className="relative flex min-h-dvh w-full flex-col items-center justify-center overflow-hidden bg-brand-deep-950 p-6">
                <RegisterBackdrop />
                <div className="relative z-10 w-full max-w-[480px]">
                    <GlassCard className="rounded-[28px] border-white/10 bg-white/[0.045] p-8 text-center shadow-sm sm:p-10">
                        <div className="mb-8 flex justify-center">
                            <div className="flex size-16 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04]">
                                {isEmail ? (
                                    <Mail className="size-8 text-emerald-300" />
                                ) : (
                                    <CheckCircle2 className="size-8 text-emerald-300" />
                                )}
                            </div>
                        </div>

                        <div className="space-y-4 mb-10">
                            <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-white/45">
                                {isEmail ? "Email sent" : "One step left"}
                            </p>
                            <h2 className="text-3xl font-semibold leading-tight tracking-tight text-white">
                                {isEmail ? "Check your inbox." : "Message our bot."}
                            </h2>
                            <p className="mx-auto max-w-sm leading-relaxed text-white/60">
                                {success.message}
                            </p>
                        </div>

                        {!isEmail && WHATSAPP_URL && (
                            <div className="mb-6 space-y-3">
                                <a
                                    href={WHATSAPP_URL}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex w-full items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-4 hover:bg-white/[0.07]"
                                >
                                    <div className="text-left">
                                        <p className="mb-0.5 text-[10px] font-semibold uppercase tracking-widest text-white/45">
                                            WhatsApp bot number
                                        </p>
                                        <p className="text-lg font-semibold tracking-wide text-white">
                                            {BOT_DISPLAY}
                                        </p>
                                    </div>
                                    <ExternalLink className="h-4 w-4 shrink-0 text-white/45" />
                                </a>
                                <Button
                                    asChild
                                    className="h-12 w-full rounded-2xl bg-[#25D366] font-semibold text-white hover:bg-[#22c55e]"
                                >
                                    <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer">
                                        <MessageCircle className="size-5 mr-2" />
                                        Open in WhatsApp
                                    </a>
                                </Button>
                            </div>
                        )}

                        <Button
                            asChild
                            className={isEmail
                                ? "h-12 w-full rounded-2xl bg-primary font-semibold text-white hover:bg-primary/92 hover:text-white"
                                : "h-12 w-full rounded-2xl border border-white/10 bg-white/[0.04] font-semibold text-white/70 hover:bg-white/[0.07] hover:text-white"
                            }
                        >
                            <Link href="/login" className="flex items-center gap-2 justify-center">
                                {isEmail ? "Enter Workspace" : "I'll do this later — go to login"}
                                <ArrowRight className="size-4" />
                            </Link>
                        </Button>
                    </GlassCard>
                </div>
            </div>
        )
    }

    return (
        <div className="relative flex min-h-dvh w-full flex-col overflow-hidden bg-brand-deep-950 selection:bg-brand-gold/30">
            <RegisterBackdrop />

            <div className="relative z-10 flex flex-1 flex-col justify-center px-4 py-8 sm:px-8 lg:px-12">
                <div className="mx-auto w-full max-w-5xl">
                        {step === 0 ? (
                            <div className="grid gap-8 lg:grid-cols-[0.9fr_minmax(360px,620px)] lg:items-center">
                                <header className="space-y-6">
                                    <div className="flex items-center gap-4">
                                        <div className="relative h-11 w-11 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04]">
                                            <Image
                                                src="/images/logo-white.png"
                                                alt="Cloove"
                                                fill
                                                className="object-contain p-2"
                                                priority
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-emerald-300/70">
                                            Get started
                                        </p>
                                        <h1 className="text-4xl font-semibold leading-tight tracking-tight text-white md:text-5xl">
                                            Choose your role.
                                        </h1>
                                        <p className="max-w-md text-base leading-relaxed text-white/60">
                                            Set up the right workspace for your operation. Keep the flow focused and complete the basics in a few steps.
                                        </p>
                                    </div>

                                    <div className="flex flex-wrap gap-3">
                                        {[
                                            { icon: Globe, text: "Global reach" },
                                            { icon: ShieldCheck, text: "Secure access" },
                                            { icon: Zap, text: "Fast setup" }
                                        ].map((feat) => (
                                            <div
                                                key={feat.text}
                                                className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-2 text-[10px] font-semibold uppercase tracking-widest text-white/60"
                                            >
                                                <feat.icon className="size-3 text-emerald-300/70" />
                                                {feat.text}
                                            </div>
                                        ))}
                                    </div>
                                </header>

                                <div className="grid gap-4 sm:grid-cols-2">
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
                            </div>
                        ) : (
                            <div className="grid gap-8 lg:grid-cols-[0.9fr_minmax(300px,440px)] lg:items-center">
                                <header className="max-w-xl space-y-6">
                                    <button 
                                        onClick={() => setStep(0)}
                                        className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-300/70 hover:text-white"
                                    >
                                        <ArrowRight className="size-3 rotate-180" />
                                        Back to selection
                                    </button>
                                    
                                    <div className="space-y-4">
                                        <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-emerald-300/70">
                                            {intendedRole === "field_agent" ? "Agent Onboarding" : "Merchant Entry"}
                                        </p>
                                        <h1 className="text-4xl font-semibold leading-tight tracking-tight text-white sm:text-5xl">
                                            {intendedRole === "field_agent" ? "Create your agent profile." : "Create your workspace."}
                                        </h1>
                                        <p className="max-w-sm text-base leading-relaxed text-white/60">
                                            {intendedRole === "field_agent" 
                                                ? "Join the field team and start onboarding businesses." 
                                                : "Set up your account and continue to business setup."}
                                        </p>
                                    </div>

                                    <div className="hidden items-center gap-4 rounded-[24px] border border-white/10 bg-white/[0.04] p-5 lg:flex">
                                        <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-primary/20">
                                            <Sparkle className="size-5 text-emerald-300" />
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-sm font-semibold text-white">Selected role</p>
                                            <p className="text-xs leading-relaxed text-white/50">
                                                You&apos;re registering as a <span className="text-emerald-300">{intendedRole?.replace('_', ' ')}</span>.
                                            </p>
                                        </div>
                                    </div>
                                </header>

                                <div className="relative">
                                    <GlassCard
                                        allowOverflow
                                        className="relative overflow-visible rounded-[28px] border-white/10 bg-white/[0.045] p-5 shadow-sm sm:p-6"
                                    >
                                        <div className="mb-6">
                                            <h2 className="text-2xl font-semibold tracking-tight text-white">Create account</h2>
                                            <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-white/45">
                                                Secure access
                                            </p>
                                        </div>

                                        <form onSubmit={handleSubmit} className="space-y-6">
                                            <div
                                                className="flex gap-1 rounded-2xl border border-white/10 bg-white/[0.03] p-1"
                                                role="tablist"
                                            >
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    onClick={() => setIdentifierType("email")}
                                                    className={cn(
                                                        "h-auto flex-1 gap-2 rounded-xl py-3 font-medium",
                                                        identifierType === "email"
                                                            ? "border border-white/10 bg-primary text-white"
                                                            : "text-white/45 hover:bg-white/[0.05] hover:text-white"
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
                                                        "h-auto flex-1 gap-2 rounded-xl py-3 font-medium",
                                                        identifierType === "phone"
                                                            ? "border border-white/10 bg-primary text-white"
                                                            : "text-white/45 hover:bg-white/[0.05] hover:text-white"
                                                    )}
                                                >
                                                    <Phone className="size-3.5" />
                                                    Phone
                                                </Button>
                                            </div>

                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <Label className="text-[10px] font-semibold uppercase tracking-widest text-white/55">
                                                        First name
                                                    </Label>
                                                    <Input
                                                        required
                                                        value={firstName}
                                                        onChange={(e) => setFirstName(e.target.value)}
                                                        className="h-12 border-white/12 bg-white/[0.04] text-white placeholder:text-white/35 focus:border-white/25"
                                                        placeholder="Jane"
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label className="text-[10px] font-semibold uppercase tracking-widest text-white/55">
                                                        Last name
                                                    </Label>
                                                    <Input
                                                        required
                                                        value={lastName}
                                                        onChange={(e) => setLastName(e.target.value)}
                                                        className="h-12 border-white/12 bg-white/[0.04] text-white placeholder:text-white/35 focus:border-white/25"
                                                        placeholder="Doe"
                                                    />
                                                </div>
                                            </div>

                                            {identifierType === "email" ? (
                                                <div className="space-y-4">
                                                    <div className="space-y-2">
                                                        <Label className="text-[10px] font-semibold uppercase tracking-widest text-white/55">
                                                            Email Address
                                                        </Label>
                                                        <Input
                                                            type="email"
                                                            required
                                                            value={email}
                                                            onChange={(e) => setEmail(e.target.value)}
                                                            className="h-12 border-white/12 bg-white/[0.04] text-white placeholder:text-white/35 focus:border-white/25"
                                                            placeholder="jane@company.com"
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label className="text-[10px] font-semibold uppercase tracking-widest text-white/55">
                                                            Country
                                                        </Label>
                                                        <CountrySelector
                                                            countries={countries}
                                                            selectedCountry={country}
                                                            onSelect={setCountry}
                                                            disabled={isSubmitting}
                                                            showName
                                                            triggerClassName="h-12 w-full rounded-xl border-white/10 bg-white/[0.04] text-white hover:bg-white/[0.07]"
                                                        />
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="space-y-2">
                                                    <Label className="text-[10px] font-semibold uppercase tracking-widest text-white/55">
                                                        Phone number
                                                    </Label>
                                                    <div className="flex h-12 overflow-hidden rounded-xl border border-white/10 bg-white/[0.04] focus-within:border-white/25">
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
                                                            className="flex-1 border-0 bg-transparent text-white placeholder:text-white/35 focus-visible:ring-0"
                                                            placeholder={country ? `${country.phoneCode} …` : "Phone"}
                                                        />
                                                    </div>
                                                </div>
                                            )}

                                            <div className="space-y-2">
                                                <Label className="text-[10px] font-semibold uppercase tracking-widest text-white/55">
                                                    Security Password
                                                </Label>
                                                <div className="relative">
                                                    <Input
                                                        type={showPassword ? "text" : "password"}
                                                        value={password}
                                                        onChange={(e) => setPassword(e.target.value)}
                                                        className="h-12 border-white/12 bg-white/[0.04] pr-10 text-white placeholder:text-white/35 focus:border-white/25"
                                                        placeholder="••••••••"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => setShowPassword(!showPassword)}
                                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-white/35 hover:text-white/70"
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
                                                        "size-5 rounded-md border flex items-center justify-center",
                                                        termsAccepted
                                                            ? "border-primary bg-primary"
                                                            : "border-white/20 bg-white/[0.04] group-hover:border-white/35"
                                                    )}>
                                                        {termsAccepted && (
                                                            <svg className="size-3 text-white" viewBox="0 0 12 12" fill="none">
                                                                <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                                                            </svg>
                                                        )}
                                                    </div>
                                                </div>
                                                <span className="text-xs leading-relaxed text-white/50 group-hover:text-white/70">
                                                    I agree to the{" "}
                                                    <a
                                                        href="https://clooveai.com/terms"
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        onClick={(e) => e.stopPropagation()}
                                                        className="text-emerald-300/80 underline underline-offset-2 hover:text-white"
                                                    >
                                                        Terms of Service
                                                    </a>
                                                    {" "}and{" "}
                                                    <a
                                                        href="https://clooveai.com/privacy"
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        onClick={(e) => e.stopPropagation()}
                                                        className="text-emerald-300/80 underline underline-offset-2 hover:text-white"
                                                    >
                                                        Privacy Policy
                                                    </a>
                                                </span>
                                            </label>

                                            <Button
                                                type="submit"
                                                disabled={isSubmitting || !termsAccepted}
                                                className="h-12 w-full rounded-2xl bg-primary font-semibold text-white hover:bg-primary/92 hover:text-white disabled:cursor-not-allowed disabled:opacity-45"
                                            >
                                                {isSubmitting ? (
                                                    <Loader2 className="animate-spin size-5" />
                                                ) : (
                                                    <span className="flex items-center gap-2">
                                                        Continue
                                                        <ArrowRight className="size-4" />
                                                    </span>
                                                )}
                                            </Button>
                                        </form>
                                    </GlassCard>
                                    
                                    <p className="mt-5 text-center text-sm text-white/45">
                                        Already a member?{" "}
                                        <Link href="/login" className="font-medium text-emerald-300/80 hover:text-white">
                                            Log in
                                        </Link>
                                    </p>
                                </div>
                            </div>
                        )}
                </div>
            </div>
        </div>
    )
}

interface RoleCardProps {
    title: string
    description: string
    icon: LucideIcon
    onClick: () => void
    badge?: string
}

function RoleCard({ title, description, icon: Icon, onClick, badge }: RoleCardProps) {
    return (
        <button
            onClick={onClick}
            className="group relative flex flex-col items-start overflow-hidden rounded-[28px] border border-white/10 bg-white/[0.045] p-6 text-left hover:bg-white/[0.07]"
        >
            <div className="absolute right-5 top-5">
                <ArrowRight className="size-4 -rotate-45 text-white/35" />
            </div>

            {badge && (
                <div className="absolute right-10 top-5 rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[9px] font-semibold uppercase tracking-widest text-emerald-300/80">
                    {badge}
                </div>
            )}

            <div className="mb-6 flex size-12 items-center justify-center rounded-2xl border border-white/10 bg-primary/20">
                <Icon className="size-6 text-emerald-300" />
            </div>

            <h3 className="mb-3 text-xl font-semibold tracking-tight text-white">
                {title}
            </h3>
            <p className="text-sm leading-relaxed text-white/55">
                {description}
            </p>

            <div className="mt-6 w-full border-t border-white/10 pt-5">
                <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-emerald-300/70">
                    Get started
                </span>
            </div>
        </button>
    )
}
