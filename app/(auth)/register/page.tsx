"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { Mail, Phone, ArrowRight, Loader2, Eye, EyeOff, CheckCircle2 } from "lucide-react"
import { motion } from "framer-motion"
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

interface SignupConfig {
    signupEnabled: boolean
}

export default function RegisterPage() {
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
            <div className="min-h-dvh w-full flex flex-col items-center justify-center p-4 bg-brand-deep-950">
                <Loader2 className="w-10 h-10 animate-spin text-brand-gold" />
            </div>
        )
    }

    if (!signupEnabled) {
        return (
            <div className="min-h-dvh w-full flex flex-col items-center justify-center p-4 bg-brand-deep-950">
                <GlassCard className="p-8 max-w-md text-center border-white/10">
                    <h1 className="font-serif text-2xl text-brand-cream mb-2">Signup is currently closed</h1>
                    <p className="text-brand-cream/70 text-sm mb-6">
                        New account registration is not available at this time.
                    </p>
                    <Link href="/login">
                        <Button variant="outline" className="border-brand-gold/40 text-brand-cream">
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
            <div className="min-h-dvh w-full flex flex-col items-center justify-center p-4 relative overflow-hidden bg-brand-deep-950">
                <div className="absolute -top-1/4 -right-1/4 w-[80%] h-[80%] rounded-full bg-brand-gold/10 blur-[100px] pointer-events-none" />
                <div className="absolute -bottom-1/4 -left-1/4 w-[70%] h-[70%] rounded-full bg-brand-green/15 blur-[100px] pointer-events-none" />
                <motion.div
                    className="w-full max-w-md relative z-10"
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                >
                    <GlassCard className="p-8 sm:p-10 max-w-md text-center border-white/10 bg-white/5 dark:bg-white/5 shadow-2xl shadow-black/20">
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: 0.1, duration: 0.3, ease: [0.34, 1.56, 0.64, 1] }}
                            className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-gold/20 text-brand-gold"
                        >
                            {isEmail ? (
                                <Mail className="h-7 w-7" aria-hidden />
                            ) : (
                                <CheckCircle2 className="h-7 w-7" aria-hidden />
                            )}
                        </motion.div>
                        <motion.h1
                            className="font-serif text-2xl sm:text-3xl text-brand-cream font-medium tracking-tight mb-2"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.15, duration: 0.25 }}
                        >
                            {isEmail ? "Check your inbox" : "Next step"}
                        </motion.h1>
                        <motion.p
                            className="text-brand-cream/80 text-sm sm:text-base mb-8 max-w-sm mx-auto leading-relaxed"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.2, duration: 0.25 }}
                        >
                            {success.message}
                        </motion.p>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.28, duration: 0.25 }}
                        >
                            <Link href="/login" className="flex justify-center w-full">
                                <Button
                                    size="lg"
                                    className="w-full min-w-[180px] h-12 rounded-xl bg-brand-gold text-brand-deep font-semibold hover:bg-brand-gold/90 shadow-lg shadow-brand-gold/20 transition-transform hover:scale-[1.02] active:scale-[0.98]"
                                >
                                    Go to login
                                    <ArrowRight className="w-4 h-4 ml-2" />
                                </Button>
                            </Link>
                        </motion.div>
                    </GlassCard>
                </motion.div>
            </div>
        )
    }

    return (
        <div className="min-h-dvh w-full flex flex-col items-center justify-center p-4 relative overflow-hidden bg-brand-deep-950">
            <div className="absolute -top-1/4 -right-1/4 w-[80%] h-[80%] rounded-full bg-brand-gold/10 blur-[100px] pointer-events-none" />
            <div className="absolute -bottom-1/4 -left-1/4 w-[70%] h-[70%] rounded-full bg-brand-green/15 blur-[100px] pointer-events-none" />

            <div className="w-full max-w-md relative z-10">
                <div className="flex flex-col items-center mb-10">
                    <div className="relative h-14 w-14 mb-3">
                        <Image
                            src="/images/logo-white.png"
                            alt="Cloove"
                            fill
                            className="object-contain"
                            priority
                        />
                    </div>
                    <h1 className="font-serif text-3xl text-brand-cream font-medium tracking-tight text-center">
                        Create account
                    </h1>
                    <p className="text-brand-cream/60 text-xs mt-2 uppercase tracking-widest font-medium">
                        Sign up with email or WhatsApp
                    </p>
                </div>

                <GlassCard allowOverflow className="p-8 border-white/10 shadow-2xl bg-white/5">
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="flex rounded-2xl bg-white/5 border border-white/20 p-1">
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={() => setIdentifierType("email")}
                                className={cn(
                                    "flex-1 gap-2 py-3 rounded-xl h-auto font-medium",
                                    identifierType === "email"
                                        ? "bg-brand-green-600 text-brand-deep hover:bg-brand-green-600 hover:text-brand-deep"
                                        : "text-brand-cream/70 hover:text-brand-cream"
                                )}
                            >
                                <Mail className="size-4" /> Email
                            </Button>
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={() => setIdentifierType("phone")}
                                className={cn(
                                    "flex-1 gap-2 py-3 rounded-xl h-auto font-medium",
                                    identifierType === "phone"
                                        ? "bg-brand-green-600 text-brand-deep hover:bg-brand-green-600 hover:text-brand-deep"
                                        : "text-brand-cream/70 hover:text-brand-cream"
                                )}
                            >
                                <Phone className="size-4" /> Phone
                            </Button>
                        </div>

                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-bold uppercase tracking-widest text-brand-cream/80">
                                    First name
                                </Label>
                                <Input
                                    type="text"
                                    required
                                    value={firstName}
                                    onChange={(e) => setFirstName(e.target.value)}
                                    className="sm:h-11 bg-white/10 border-white/20 text-brand-cream placeholder:text-white/40 focus-visible:ring-brand-gold/40 dark:bg-white/10 dark:border-white/20"
                                    placeholder="First name"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-bold uppercase tracking-widest text-brand-cream/80">
                                    Middle
                                </Label>
                                <Input
                                    type="text"
                                    value={middleName}
                                    onChange={(e) => setMiddleName(e.target.value)}
                                    className="sm:h-11 bg-white/10 border-white/20 text-brand-cream placeholder:text-white/40 focus-visible:ring-brand-gold/40 dark:bg-white/10 dark:border-white/20"
                                    placeholder="Optional"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-bold uppercase tracking-widest text-brand-cream/80">
                                    Last name
                                </Label>
                                <Input
                                    type="text"
                                    value={lastName}
                                    onChange={(e) => setLastName(e.target.value)}
                                    className="sm:h-11 bg-white/10 border-white/20 text-brand-cream placeholder:text-white/40 focus-visible:ring-brand-gold/40 dark:bg-white/10 dark:border-white/20"
                                    placeholder="Last name"
                                />
                            </div>
                        </div>

                        {identifierType === "email" ? (
                            <>
                                <div className="space-y-1.5">
                                    <Label className="text-[10px] font-bold uppercase tracking-widest text-brand-cream/80">
                                        Email
                                    </Label>
                                    <Input
                                        type="email"
                                        required
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="sm:h-11 bg-white/10 border-white/20 text-brand-cream placeholder:text-white/40 focus-visible:ring-brand-gold/40 dark:bg-white/10 dark:border-white/20"
                                        placeholder="you@example.com"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-[10px] font-bold uppercase tracking-widest text-brand-cream/80">
                                        Country
                                    </Label>
                                    <CountrySelector
                                        countries={countries}
                                        selectedCountry={country}
                                        onSelect={setCountry}
                                        disabled={isSubmitting}
                                        showName={true}
                                        triggerClassName="sm:h-11 w-full bg-white/10 rounded-xl border-white/20 text-brand-cream hover:bg-white/10"
                                    />
                                </div>
                            </>
                        ) : (
                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-bold uppercase tracking-widest text-brand-cream/80">
                                    Phone number
                                </Label>
                                <p className="text-xs text-brand-cream/60 -mt-0.5">
                                    Use a number that has WhatsApp. You&apos;ll activate your account by sending a message to our bot.
                                </p>
                                <div className="flex rounded-xl border border-white/20 bg-white/10 focus-within:border-brand-gold/40 focus-within:ring-1 focus-within:ring-brand-gold/40">
                                    <CountrySelector
                                        countries={countries}
                                        selectedCountry={country}
                                        onSelect={setCountry}
                                        disabled={isSubmitting}
                                        triggerClassName="sm:h-11 rounded-none border-0 bg-transparent hover:bg-white/10 shrink-0 min-w-0 w-auto px-3"
                                    />
                                    <span className="w-px bg-white/20 self-stretch shrink-0" aria-hidden />
                                    <Input
                                        type="tel"
                                        required
                                        value={phone}
                                        onChange={(e) => setPhone(e.target.value)}
                                        className="sm:h-11 rounded-none border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 text-brand-cream placeholder:text-white/40 min-w-0 flex-1 border-l-0"
                                        placeholder={country ? `${country.phoneCode} ...` : "Phone"}
                                    />
                                </div>
                            </div>
                        )}

                        <div className="space-y-1.5">
                            <Label className="text-[10px] font-bold uppercase tracking-widest text-brand-cream/80">
                                Password (optional — set on verify)
                            </Label>
                            <div className="relative">
                                <Input
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    minLength={6}
                                    className="sm:h-11 pr-10 bg-white/10 border-white/20 text-brand-cream placeholder:text-white/40 focus-visible:ring-brand-gold/40 dark:bg-white/10 dark:border-white/20"
                                    placeholder="Min 6 characters"
                                />
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => setShowPassword((p) => !p)}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-brand-cream/60 hover:text-brand-cream hover:bg-transparent transition-colors"
                                    aria-label={showPassword ? "Hide password" : "Show password"}
                                >
                                    {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                                </Button>
                            </div>
                        </div>

                        <Button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full h-12 rounded-xl bg-brand-gold text-brand-deep font-bold hover:bg-brand-gold/90 shadow-xl shadow-brand-gold/10"
                        >
                            {isSubmitting ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
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
                    <Link href="/login" className="text-brand-gold hover:underline">
                        Log in
                    </Link>
                </p>
            </div>
        </div>
    )
}
