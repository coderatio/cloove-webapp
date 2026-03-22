"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { Mail, Phone, ArrowRight, Loader2, Eye, EyeOff, CheckCircle2, Sparkles } from "lucide-react"
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

const NOISE_BG = `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`

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
                            "radial-gradient(ellipse 120% 80% at 100% 0%, rgba(212, 175, 55, 0.12) 0%, transparent 55%), radial-gradient(ellipse 90% 70% at 0% 100%, rgba(11, 61, 46, 0.35) 0%, transparent 50%), linear-gradient(165deg, var(--color-brand-deep-950) 0%, #031510 45%, var(--color-brand-deep-900) 100%)",
                    }}
                />
                <div className="absolute -top-1/4 -right-1/4 w-[85%] h-[85%] rounded-full bg-brand-gold/10 blur-[120px] animate-float-slow" />
                <div className="absolute -bottom-1/4 -left-1/4 w-[75%] h-[75%] rounded-full bg-brand-accent/25 blur-[110px] animate-float-slower" />
                <div
                    className="absolute top-[18%] left-[8%] w-px h-32 bg-linear-to-b from-brand-gold/50 to-transparent opacity-60 hidden lg:block"
                    aria-hidden
                />
                <div
                    className="lg:hidden absolute top-[22%] right-[-12%] w-40 h-40 rounded-full border border-brand-gold/12 pointer-events-none"
                    aria-hidden
                />
            </div>
            <div
                className="absolute inset-0 opacity-[0.04] pointer-events-none mix-blend-overlay z-1"
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
        setIsSubmitting(true)
        try {
            const payload: Record<string, unknown> = {
                identifierType,
                firstName: firstName.trim(),
                middleName: middleName.trim() || undefined,
                lastName: lastName.trim() || undefined,
            }
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
            <div className="min-h-dvh w-full flex flex-col items-center justify-center p-6 relative overflow-hidden bg-brand-deep-950">
                <RegisterBackdrop />
                <GlassCard className="relative z-10 p-10 sm:p-12 max-w-md text-center border-white/10 bg-white/5 shadow-2xl shadow-black/25 animate-in fade-in zoom-in-95 slide-in-from-bottom-4 duration-500">
                    <div
                        className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl border border-brand-gold/25 bg-brand-gold/10 text-brand-gold"
                        aria-hidden
                    >
                        {isEmail ? <Mail className="h-8 w-8" /> : <CheckCircle2 className="h-8 w-8" />}
                    </div>
                    <h1 className="font-serif text-2xl sm:text-3xl text-brand-cream font-medium tracking-tight mb-3">
                        {isEmail ? "Almost there" : "One more step"}
                    </h1>
                    <p className="text-brand-cream/75 text-sm sm:text-base mb-10 max-w-sm mx-auto leading-relaxed">
                        {success.message}
                    </p>
                    <Link href="/login" className="flex justify-center w-full">
                        <Button
                            size="lg"
                            className="w-full min-h-12 rounded-xl bg-brand-gold text-brand-deep font-semibold hover:bg-brand-gold/90 shadow-lg shadow-brand-gold/15 transition-all duration-300 hover:scale-[1.01] active:scale-[0.99]"
                        >
                            Go to login
                            <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                    </Link>
                </GlassCard>
            </div>
        )
    }

    return (
        <div className="min-h-dvh w-full relative overflow-hidden bg-brand-deep-950 flex flex-col">
            <RegisterBackdrop />

            <div className="relative z-10 flex-1 flex flex-col justify-center px-4 pt-10 pb-14 sm:px-8 lg:px-14 lg:py-12">
                <div className="mx-auto w-full max-w-6xl grid gap-8 lg:gap-16 lg:grid-cols-[1fr_minmax(300px,420px)] lg:items-center">
                    <header className="animate-in fade-in slide-in-from-left-4 duration-700 max-w-xl lg:pr-4 space-y-6 lg:space-y-8">
                        <div className="flex items-center gap-4">
                            <div className="relative h-14 w-14 shrink-0 ring-1 ring-brand-gold/20 ring-offset-2 ring-offset-brand-deep-950 rounded-2xl">
                                <Image
                                    src="/images/logo-white.png"
                                    alt="Cloove"
                                    fill
                                    className="object-contain p-1"
                                    priority
                                />
                            </div>
                            <div className="h-px flex-1 max-w-[120px] bg-linear-to-r from-brand-gold/50 to-transparent hidden sm:block" />
                        </div>

                        <div className="relative max-lg:pl-1">
                            <div
                                className="pointer-events-none absolute -left-1 top-1 bottom-0 w-[3px] rounded-full bg-linear-to-b from-brand-gold via-brand-gold/50 to-transparent opacity-90 lg:hidden"
                                aria-hidden
                            />
                            <div className="max-lg:pl-5 space-y-4 lg:space-y-4">
                                <p className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-[0.45em] text-brand-gold">
                                    Calm intelligence
                                </p>
                                <h1 className="font-serif text-[2.65rem] leading-[0.98] sm:text-5xl lg:text-[3.25rem] lg:leading-[1.08] text-brand-cream font-medium tracking-tight">
                                    Claim your
                                    <span className="block mt-2 italic font-normal text-[2.2rem] sm:text-[2.6rem] text-brand-gold/90 lg:mt-1 lg:text-[3.25rem] lg:text-brand-cream/95">
                                        workspace.
                                    </span>
                                </h1>
                                <p className="hidden lg:block text-brand-cream/60 text-base sm:text-lg leading-relaxed font-sans max-w-md">
                                    Join teams who run operations with quiet confidence—verification stays lightweight,
                                    your data stays yours.
                                </p>
                                <p className="lg:hidden text-brand-cream/55 text-sm leading-relaxed">
                                    Quietly powerful ops—verify by email or WhatsApp, then step into your dashboard.
                                </p>
                                <ul className="hidden lg:block space-y-4 text-sm text-brand-cream/55 border-l border-white/10 pl-5">
                                    <li className="leading-relaxed">
                                        <span className="text-brand-gold font-medium">Email</span> or{" "}
                                        <span className="text-brand-gold font-medium">WhatsApp</span>
                                        —choose what fits your day.
                                    </li>
                                    <li className="leading-relaxed">
                                        Optional password now; finish credentials after you verify.
                                    </li>
                                    <li className="leading-relaxed">Built for serious businesses, without the noise.</li>
                                </ul>
                                <div className="flex lg:hidden flex-wrap gap-2 pt-1">
                                    {[
                                        "Email or WhatsApp",
                                        "Lightweight verify",
                                        "Serious businesses",
                                    ].map((label) => (
                                        <span
                                            key={label}
                                            className="inline-flex items-center rounded-full border border-white/10 bg-white/6 px-3 py-1.5 text-[11px] font-medium uppercase tracking-wider text-brand-cream/70"
                                        >
                                            {label}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </header>

                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 delay-150 max-lg:-mt-4 relative">
                        <span
                            className="pointer-events-none absolute -top-3 right-6 font-serif text-5xl text-brand-gold/12 select-none lg:hidden"
                            aria-hidden
                        >
                            01
                        </span>
                        <GlassCard
                            allowOverflow
                            className="p-7 sm:p-9 border-white/10 shadow-2xl bg-white/6 backdrop-blur-2xl relative overflow-visible max-lg:ring-1 max-lg:ring-brand-gold/15 max-lg:shadow-[0_-20px_60px_rgba(0,0,0,0.45)]"
                        >
                            <div
                                className="absolute -top-px left-8 right-8 h-px bg-linear-to-r from-transparent via-brand-gold/35 to-transparent pointer-events-none"
                                aria-hidden
                            />
                            <div className="mb-8">
                                <h2 className="font-serif text-2xl text-brand-cream tracking-tight">Create account</h2>
                                <p className="text-brand-cream/50 text-xs mt-2 uppercase tracking-[0.2em] font-semibold">
                                    Identity & access
                                </p>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-5">
                                <div
                                    className="flex rounded-2xl bg-brand-deep-900/80 border border-white/10 p-1 gap-1"
                                    role="tablist"
                                    aria-label="Sign up method"
                                >
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        onClick={() => setIdentifierType("email")}
                                        className={cn(
                                            "flex-1 gap-2 py-3 rounded-xl h-auto font-medium transition-all duration-300",
                                            identifierType === "email"
                                                ? "bg-brand-gold/15 text-brand-gold border border-brand-gold/25 shadow-[0_0_28px_rgba(212,175,55,0.08)] hover:bg-brand-gold/20 hover:text-brand-gold"
                                                : "text-brand-cream/55 hover:text-brand-cream border border-transparent"
                                        )}
                                        aria-selected={identifierType === "email"}
                                        role="tab"
                                    >
                                        <Mail className="size-4 shrink-0" aria-hidden />
                                        Email
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        onClick={() => setIdentifierType("phone")}
                                        className={cn(
                                            "flex-1 gap-2 py-3 rounded-xl h-auto font-medium transition-all duration-300",
                                            identifierType === "phone"
                                                ? "bg-brand-gold/15 text-brand-gold border border-brand-gold/25 shadow-[0_0_28px_rgba(212,175,55,0.08)] hover:bg-brand-gold/20 hover:text-brand-gold"
                                                : "text-brand-cream/55 hover:text-brand-cream border border-transparent"
                                        )}
                                        aria-selected={identifierType === "phone"}
                                        role="tab"
                                    >
                                        <Phone className="size-4 shrink-0" aria-hidden />
                                        Phone
                                    </Button>
                                </div>

                                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                                    <div className="space-y-1.5">
                                        <Label className="text-[10px] font-bold uppercase tracking-widest text-brand-cream/70">
                                            First name
                                        </Label>
                                        <Input
                                            type="text"
                                            required
                                            value={firstName}
                                            onChange={(e) => setFirstName(e.target.value)}
                                            className="h-11 min-h-11 box-border bg-white/8 border-white/15 text-brand-cream placeholder:text-white/35 focus-visible:ring-brand-gold/35 transition-all duration-300"
                                            placeholder="First name"
                                            autoComplete="given-name"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="text-[10px] font-bold uppercase tracking-widest text-brand-cream/70">
                                            Middle
                                        </Label>
                                        <Input
                                            type="text"
                                            value={middleName}
                                            onChange={(e) => setMiddleName(e.target.value)}
                                            className="h-11 min-h-11 box-border bg-white/8 border-white/15 text-brand-cream placeholder:text-white/35 focus-visible:ring-brand-gold/35 transition-all duration-300"
                                            placeholder="Optional"
                                            autoComplete="additional-name"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="text-[10px] font-bold uppercase tracking-widest text-brand-cream/70">
                                            Last name
                                        </Label>
                                        <Input
                                            type="text"
                                            value={lastName}
                                            onChange={(e) => setLastName(e.target.value)}
                                            className="h-11 min-h-11 box-border bg-white/8 border-white/15 text-brand-cream placeholder:text-white/35 focus-visible:ring-brand-gold/35 transition-all duration-300"
                                            placeholder="Last name"
                                            autoComplete="family-name"
                                        />
                                    </div>
                                </div>

                                {identifierType === "email" ? (
                                    <>
                                        <div className="space-y-1.5">
                                            <Label className="text-[10px] font-bold uppercase tracking-widest text-brand-cream/70">
                                                Email
                                            </Label>
                                            <Input
                                                type="email"
                                                required
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                className="h-11 min-h-11 box-border bg-white/8 border-white/15 text-brand-cream placeholder:text-white/35 focus-visible:ring-brand-gold/35 transition-all duration-300"
                                                placeholder="you@example.com"
                                                autoComplete="email"
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label className="text-[10px] font-bold uppercase tracking-widest text-brand-cream/70">
                                                Country
                                            </Label>
                                            <CountrySelector
                                                countries={countries}
                                                selectedCountry={country}
                                                onSelect={setCountry}
                                                disabled={isSubmitting}
                                                showName={true}
                                                triggerClassName="h-11 min-h-11 w-full rounded-xl border-white/15 px-3 py-0 bg-white/8 text-brand-cream hover:bg-white/10 transition-all duration-300"
                                            />
                                        </div>
                                    </>
                                ) : (
                                    <div className="space-y-1.5">
                                        <Label className="text-[10px] font-bold uppercase tracking-widest text-brand-cream/70">
                                            Phone number
                                        </Label>
                                        <p className="text-xs text-brand-cream/50 -mt-0.5 leading-relaxed">
                                            Use a number with WhatsApp. You&apos;ll verify by messaging our bot.
                                        </p>
                                        <div className="flex min-h-11 items-stretch rounded-xl border border-white/15 bg-white/8 focus-within:border-brand-gold/35 focus-within:ring-1 focus-within:ring-brand-gold/25 transition-all duration-300">
                                            <CountrySelector
                                                countries={countries}
                                                selectedCountry={country}
                                                onSelect={setCountry}
                                                disabled={isSubmitting}
                                                triggerClassName="h-11 min-h-11 rounded-none rounded-l-xl border-0 bg-transparent hover:bg-white/10 shrink-0 min-w-0 w-auto px-3 py-0 transition-all duration-300"
                                            />
                                            <span className="w-px bg-white/15 self-stretch shrink-0 my-2" aria-hidden />
                                            <Input
                                                type="tel"
                                                required
                                                value={phone}
                                                onChange={(e) => setPhone(e.target.value)}
                                                className="h-11 min-h-11 rounded-none rounded-r-xl border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 text-brand-cream placeholder:text-white/35 min-w-0 flex-1 box-border"
                                                placeholder={country ? `${country.phoneCode} …` : "Phone"}
                                                autoComplete="tel"
                                            />
                                        </div>
                                    </div>
                                )}

                                <div className="space-y-1.5">
                                    <Label className="text-[10px] font-bold uppercase tracking-widest text-brand-cream/70">
                                        Password{" "}
                                        <span className="font-normal normal-case tracking-normal text-brand-cream/45">
                                            (optional — set on verify)
                                        </span>
                                    </Label>
                                    <div className="relative">
                                        <Input
                                            type={showPassword ? "text" : "password"}
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            minLength={6}
                                            className="h-11 min-h-11 box-border pr-11 bg-white/8 border-white/15 text-brand-cream placeholder:text-white/35 focus-visible:ring-brand-gold/35 transition-all duration-300"
                                            placeholder="Min 6 characters"
                                            autoComplete="new-password"
                                        />
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => setShowPassword((p) => !p)}
                                            className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-lg text-brand-cream/50 hover:text-brand-cream hover:bg-white/5 transition-all duration-300"
                                            aria-label={showPassword ? "Hide password" : "Show password"}
                                        >
                                            {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                                        </Button>
                                    </div>
                                </div>

                                <Button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="w-full min-h-12 rounded-xl bg-brand-gold text-brand-deep font-bold hover:bg-brand-gold/90 shadow-xl shadow-brand-gold/10 transition-all duration-300 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-70 disabled:hover:scale-100"
                                >
                                    {isSubmitting ? (
                                        <Loader2 className="w-5 h-5 animate-spin" aria-label="Submitting" />
                                    ) : (
                                        <>
                                            Create account
                                            <ArrowRight className="w-4 h-4 ml-2" />
                                        </>
                                    )}
                                </Button>
                            </form>
                        </GlassCard>

                        <p className="mt-8 text-center text-brand-cream/50 text-sm">
                            Already have an account?{" "}
                            <Link
                                href="/login"
                                className="text-brand-gold hover:text-brand-gold-bright underline-offset-4 hover:underline transition-colors duration-300"
                            >
                                Log in
                            </Link>
                        </p>
                        <p className="mt-6 text-center text-[10px] text-brand-cream/30 uppercase tracking-[0.3em] font-medium">
                            Cloove AI &copy; <span suppressHydrationWarning>{new Date().getFullYear()}</span>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}
