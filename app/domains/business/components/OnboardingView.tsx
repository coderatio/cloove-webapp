"use client"

import { useState, useEffect, useRef, useMemo } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import {
    ArrowRight,
    Check,
    ChevronLeft,
    Building2,
    MapPin,
    LogOut,
    X
} from "lucide-react"
import { cn } from "@/app/lib/utils"
import { GlassCard } from "@/app/components/ui/glass-card"
import { Button } from "@/app/components/ui/button"
import { Input } from "@/app/components/ui/input"
import { CountrySelector, type CountryDetail } from "@/app/components/ui/country-selector"
import { apiClient } from "@/app/lib/api-client"
import { toast } from "sonner"
import { useBusiness, type Business } from "@/app/components/BusinessProvider"
import { useAuth } from "@/app/components/providers/auth-provider"
import { useCountries } from "@/app/hooks/useCountries"
import { usePermission } from "@/app/hooks/usePermission"
import { useCurrentSubscription, useUsageStats } from "@/app/domains/business/hooks/useBilling"
import { BusinessTypeSelector, type BusinessType } from "@/app/domains/business/components/BusinessTypeSelector"
import Image from "next/image"

interface Category {
    id: string
    name: string
}

function OnboardingCancelButton({ className }: { className?: string }) {
    const router = useRouter()
    return (
        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} transition={{ duration: 0.2 }}>
            <Button
                type="button"
                variant="outline"
                onClick={() => router.push("/")}
                className={cn(
                    "flex cursor-pointer items-center gap-2 rounded-xl border border-brand-deep/15 dark:border-brand-cream/25 bg-transparent text-sm font-semibold text-brand-deep dark:text-brand-cream hover:bg-white/10 transition-colors duration-200",
                    className
                )}
                aria-label="Cancel and return to dashboard"
            >
                <X className="h-4 w-4 shrink-0" aria-hidden />
                <span>Cancel</span>
            </Button>
        </motion.div>
    )
}

export function OnboardingView() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const fromSwitcher = searchParams.get("from") === "switcher"
    const { user, logout } = useAuth()
    const { businesses, refreshBusinesses, setActiveBusiness } = useBusiness()
    const isAddBusinessFlow = fromSwitcher || (businesses?.length ?? 0) > 0
    const { role } = usePermission()
    const { data: subData } = useCurrentSubscription()
    const { data: usage, isLoading: isLoadingUsage } = useUsageStats()
    const { data: countriesData, isError: isCountriesError, error: countriesError, refetch: refetchCountries } = useCountries()
    const countries = countriesData ?? []

    const [step, setStep] = useState(1)
    const [categories, setCategories] = useState<Category[]>([])
    const [isLoadingCategories, setIsLoadingCategories] = useState(true)
    const [isSubmitting, setIsSubmitting] = useState(false)

    const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
    const [businessType, setBusinessType] = useState<BusinessType | null>(null)
    const [businessName, setBusinessName] = useState("")
    const [selectedCountry, setSelectedCountry] = useState<CountryDetail | null>(null)
    const [fullName, setFullName] = useState("")

    const businessNameRef = useRef<HTMLInputElement>(null)
    const countryTriggerRef = useRef<HTMLButtonElement>(null)
    const fullNameRef = useRef<HTMLInputElement>(null)

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const data = await apiClient.get<Category[]>("/onboarding/categories")
                setCategories(data)
            } catch (error) {
                toast.error("Failed to load business categories")
            } finally {
                setIsLoadingCategories(false)
            }
        }
        fetchCategories()
    }, [])

    useEffect(() => {
        if (user?.fullName) {
            setFullName((prev) => (prev === "" ? user.fullName ?? "" : prev))
        }
    }, [user?.fullName])

    useEffect(() => {
        if (countries.length === 0) return
        const defaultCountry =
            ((user?.countryDetail && countries.find((c) => c.id === user.countryDetail!.id || c.code === user.countryDetail!.code)) ||
                countries.find((c) => c.isDefault) ||
                countries[0]) ?? null
        setSelectedCountry((prev) => prev ?? defaultCountry)
    }, [countries, user?.countryDetail])

    const { canAddBusiness, maxBusinesses, isUnlimited } = useMemo(() => {
        const planBenefits = subData?.currentPlan?.benefits as Record<string, number | null> | undefined
        const max = planBenefits?.maxBusinesses
        const unlimited = max === undefined || max === null || max === Infinity

        const allowed =
            (role === "OWNER" || role === null) &&
            !isLoadingUsage &&
            (unlimited || (usage != null && usage.businesses < Number(max)))

        return {
            canAddBusiness: allowed,
            maxBusinesses: max,
            isUnlimited: unlimited,
        }
    }, [role, subData?.currentPlan?.benefits, isLoadingUsage, usage])

    const handleNext = () => {
        if (step === 1 && !selectedCategory) {
            toast.error("Please select a business category")
            return
        }
        if (step === 2 && !businessType) {
            toast.error("Please select your business type")
            return
        }
        setStep(prev => prev + 1)
    }

    const handleSubmit = async () => {
        if (!businessName.trim()) {
            toast.error("Please enter your business name")
            businessNameRef.current?.focus()
            return
        }
        if (!selectedCountry) {
            toast.error("Please select a country")
            countryTriggerRef.current?.focus()
            return
        }
        if (!fullName.trim()) {
            toast.error("Please enter your name")
            fullNameRef.current?.focus()
            return
        }

        setIsSubmitting(true)
        try {
            const countryCode = selectedCountry.code
            const response = await apiClient.post<{ business: { id: string } }>("/onboarding/setup", {
                businessName,
                categoryId: selectedCategory,
                country: countryCode,
                fullName,
                businessType,
            })

            const list = (await refreshBusinesses()) as Business[] | undefined
            if (response?.business?.id && list) {
                const newBusiness = list.find((b: Business) => b.id === response.business.id)
                if (newBusiness) {
                    setActiveBusiness(newBusiness, { quiet: true })
                }
            }
            toast.success(
                fromSwitcher
                    ? "Business created. You can switch to it from the business switcher."
                    : "Business set up successfully!"
            )
            router.push("/")
        } catch (error: any) {
            toast.error(error.message || "Failed to set up business")
        } finally {
            setIsSubmitting(false)
        }
    }

    const containerVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: {
            opacity: 1,
            y: 0,
            transition: {
                duration: 0.6,
                staggerChildren: 0.1
            }
        },
        exit: { opacity: 0, y: -20 }
    }

    const reachedBusinessLimit =
        isAddBusinessFlow &&
        !isLoadingUsage &&
        !isUnlimited &&
        usage != null &&
        maxBusinesses != null &&
        usage.businesses >= Number(maxBusinesses)

    if (isAddBusinessFlow && (role !== "OWNER" || reachedBusinessLimit || !canAddBusiness)) {
        if (isLoadingUsage) return null // Wait for usage stats to confirm if limit is actually reached
        const currentCount = usage?.businesses ?? businesses?.length ?? 0
        return (
            <div className="min-h-screen bg-brand-cream dark:bg-brand-deep flex flex-col items-center justify-center p-6 sm:p-12">
                <GlassCard className="max-w-lg w-full p-8 space-y-6 text-center">
                    <h1 className="font-serif text-2xl sm:text-3xl text-brand-deep dark:text-brand-cream tracking-tight">
                        You’ve reached your business limit
                    </h1>
                    <p className="text-sm text-brand-accent/70 dark:text-brand-cream/70">
                        Your current plan allows{" "}
                        <span className="font-semibold">
                            {isUnlimited ? "unlimited" : `${maxBusinesses ?? 1}`}
                        </span>{" "}
                        business{!isUnlimited && Number(maxBusinesses) > 1 ? "es" : ""}. You already have{" "}
                        <span className="font-semibold">{currentCount}</span>, so you can’t add another one.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3 justify-center mt-4">
                        <Button
                            variant="outline"
                            onClick={() => router.push("/")}
                            className="sm:min-w-[140px] rounded-xl!"
                        >
                            Back to dashboard
                        </Button>
                        {role === "OWNER" && (
                            <Button
                                onClick={() => router.push("/settings?tab=billing")}
                                className="sm:min-w-[160px] rounded-xl!"
                            >
                                Manage plan
                            </Button>
                        )}
                    </div>
                </GlassCard>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-brand-cream dark:bg-brand-deep flex flex-col items-center justify-center p-6 sm:p-12 relative overflow-hidden">
            {/* Background Effects */}
            <div className="fixed inset-0 z-0 pointer-events-none opacity-40 dark:opacity-20">
                <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] rounded-full bg-brand-green/20 blur-3xl filter animate-pulse" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] rounded-full bg-brand-gold/20 blur-3xl filter animate-pulse" />
            </div>

            <div className="relative z-10 w-full max-w-3xl space-y-12">
                {/* Header */}
                <div className="text-center space-y-4">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="h-16 w-16 bg-brand-green rounded-2xl p-3 mx-auto shadow-2xl shadow-brand-green/20 mb-6"
                    >
                        <Image src="/images/logo-white.png" alt="Cloove" width={40} height={40} className="w-full h-full object-contain" />
                    </motion.div>

                    <h1 className="font-serif text-3xl sm:text-4xl text-brand-deep dark:text-brand-cream tracking-tight">
                        {step === 1
                            ? "What's your business industry?"
                            : step === 2
                            ? "What type of business is this?"
                            : "Let's name your business"}
                    </h1>
                    <p className="text-brand-accent/60 dark:text-brand-cream/60 text-lg max-w-md mx-auto">
                        {step === 1
                            ? "Help us tailor your experience by selecting a category."
                            : step === 2
                            ? "This determines your verification requirements."
                            : "Give your business a name to get started."}
                    </p>
                </div>

                <AnimatePresence mode="wait">
                    {step === 2 ? (
                        <motion.div
                            key="step2-type"
                            variants={containerVariants}
                            initial="hidden"
                            animate="visible"
                            exit="exit"
                            className="flex justify-center"
                        >
                            <BusinessTypeSelector value={businessType} onChange={setBusinessType} />
                        </motion.div>
                    ) : step === 1 ? (
                        <motion.div
                            key="step1"
                            variants={containerVariants}
                            initial="hidden"
                            animate="visible"
                            exit="exit"
                            className="flex flex-wrap justify-center gap-3"
                        >
                            {isLoadingCategories ? (
                                Array(6).fill(0).map((_, i) => (
                                    <div key={i} className="h-11 w-32 rounded-full bg-white/5 animate-pulse" />
                                ))
                            ) : (
                                categories.map((category) => {
                                    const isSelected = selectedCategory === category.id
                                    return (
                                        <motion.button
                                            key={category.id}
                                            type="button"
                                            onClick={() => setSelectedCategory(category.id)}
                                            whileHover={{ scale: 1.04 }}
                                            whileTap={{ scale: 0.97 }}
                                            className={cn(
                                                "relative cursor-pointer rounded-full px-5 py-2.5 text-sm font-semibold border transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-brand-gold/50",
                                                isSelected
                                                    ? "bg-brand-gold text-brand-deep border-brand-gold shadow-lg shadow-brand-gold/20"
                                                    : "bg-white dark:bg-white/10 text-brand-deep dark:text-brand-cream border-brand-deep/10 dark:border-white/10 hover:border-brand-gold/40 hover:bg-brand-gold/10"
                                            )}
                                        >
                                            <span className="flex items-center gap-2">
                                                {isSelected && (
                                                    <motion.span
                                                        initial={{ scale: 0, opacity: 0 }}
                                                        animate={{ scale: 1, opacity: 1 }}
                                                        transition={{ type: "spring", stiffness: 500, damping: 25 }}
                                                    >
                                                        <Check className="h-3.5 w-3.5" strokeWidth={3} />
                                                    </motion.span>
                                                )}
                                                {category.name}
                                            </span>
                                        </motion.button>
                                    )
                                })
                            )}
                        </motion.div>
                    ) : (
                        <motion.div
                            key="step3"
                            variants={containerVariants}
                            initial="hidden"
                            animate="visible"
                            exit="exit"
                            className="max-w-md mx-auto w-full"
                        >
                            <GlassCard allowOverflow className="p-8 space-y-6 border-white/5 shadow-2xl">
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-brand-accent/40 dark:text-brand-cream/40 uppercase tracking-[0.2em] flex items-center gap-2">
                                            <Building2 className="h-3 w-3" />
                                            Business Name
                                        </label>
                                        <Input
                                            ref={businessNameRef}
                                            value={businessName}
                                            onChange={(e) => setBusinessName(e.target.value)}
                                            placeholder="e.g. Martha's Kitchen"
                                            className="h-14 sm:h-14 px-4 bg-white/5 border-white/10 rounded-2xl focus:ring-brand-gold/20 focus:border-brand-gold/30 text-lg transition-all"
                                            autoFocus
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-brand-accent/40 dark:text-brand-cream/40 uppercase tracking-[0.2em] flex items-center gap-2">
                                            <MapPin className="h-3 w-3" />
                                            Country
                                        </label>
                                        {isCountriesError ? (
                                            <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 space-y-2">
                                                <p className="text-sm text-red-600 dark:text-red-400">
                                                    {countriesError?.message ?? "Failed to load supported countries"}
                                                </p>
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => refetchCountries()}
                                                    className="border-red-500/30 text-red-600 dark:text-red-400 hover:bg-red-500/10"
                                                >
                                                    Retry
                                                </Button>
                                            </div>
                                        ) : (
                                            <CountrySelector
                                                countries={countries}
                                                selectedCountry={selectedCountry}
                                                onSelect={setSelectedCountry}
                                                disabled={isSubmitting}
                                                className="w-full"
                                                dropdownVariant="light"
                                                dropdownClassName="bg-brand-cream/95 dark:bg-brand-deep/95 border-brand-green/10 dark:border-white/10"
                                                triggerRef={countryTriggerRef}
                                            />
                                        )}
                                        {user?.countryDetail && selectedCountry && user.countryDetail.code === selectedCountry.code && (
                                            <p className="text-[10px] text-brand-cream/50">Default: your account country</p>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-brand-accent/40 dark:text-brand-cream/40 uppercase tracking-[0.2em] flex items-center gap-2">
                                            Your name
                                        </label>
                                        <Input
                                            ref={fullNameRef}
                                            value={fullName}
                                            onChange={(e) => setFullName(e.target.value)}
                                            placeholder="Full name of the business owner"
                                            className="h-14 sm:h-14 px-4 bg-white/5 border-white/10 rounded-2xl focus:ring-brand-gold/20 focus:border-brand-gold/30 transition-all"
                                        />
                                    </div>
                                </div>

                                <div className="pt-4">
                                    <Button
                                        onClick={handleSubmit}
                                        disabled={isSubmitting || !selectedCountry || isCountriesError || !canAddBusiness}
                                        className="w-full h-14 rounded-2xl bg-brand-gold text-brand-deep font-bold hover:bg-brand-gold/90 transition-all text-lg shadow-xl shadow-brand-gold/10"
                                    >
                                        {isSubmitting ? (
                                            <div className="flex items-center gap-2">
                                                <div className="w-5 h-5 border-2 border-brand-deep/30 border-t-brand-deep rounded-full animate-spin" />
                                                <span>Setting up...</span>
                                            </div>
                                        ) : (
                                            "Launch Business"
                                        )}
                                    </Button>
                                </div>
                            </GlassCard>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Footer: one place for all step navigation (Back, Cancel, dots, Next) */}
                <nav
                    className="flex items-center justify-between gap-4 pt-8 sm:pt-12"
                    aria-label="Onboarding steps"
                >
                    <div className="flex min-w-0 shrink-0 items-center gap-2 sm:gap-3">
                        {step > 1 ? (
                            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} transition={{ duration: 0.2 }}>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    onClick={() => setStep(prev => prev - 1)}
                                    className="flex cursor-pointer items-center gap-2 text-sm font-semibold text-brand-deep dark:text-brand-cream hover:bg-white/10 transition-colors duration-200 uppercase tracking-wider"
                                >
                                    <ChevronLeft className="h-4 w-4 shrink-0" aria-hidden />
                                    <span>Back</span>
                                </Button>
                            </motion.div>
                        ) : isAddBusinessFlow ? (
                            <OnboardingCancelButton className="px-3 py-2" />
                        ) : (
                            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} transition={{ duration: 0.2 }}>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    onClick={logout}
                                    className="flex cursor-pointer items-center gap-2 text-sm font-semibold text-brand-deep dark:text-brand-cream hover:bg-white/10 transition-colors duration-200 uppercase tracking-wider"
                                >
                                    <LogOut className="h-4 w-4 shrink-0" aria-hidden />
                                    <span>Logout</span>
                                </Button>
                            </motion.div>
                        )}
                    </div>
                    <div className="flex shrink-0 gap-2" aria-hidden>
                        <div className={cn("h-1.5 w-8 rounded-full transition-all duration-500", step === 1 ? "bg-brand-gold" : "bg-white/10")} />
                        <div className={cn("h-1.5 w-8 rounded-full transition-all duration-500", step === 2 ? "bg-brand-gold" : "bg-white/10")} />
                        <div className={cn("h-1.5 w-8 rounded-full transition-all duration-500", step === 3 ? "bg-brand-gold" : "bg-white/10")} />
                    </div>
                    <div className="flex min-w-0 shrink-0 justify-end w-24 sm:w-28">
                        {step < 3 ? (
                            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} transition={{ duration: 0.2 }}>
                                <Button
                                    onClick={handleNext}
                                    className="bg-transparent hover:bg-white/5 text-brand-deep dark:text-brand-cream font-bold group px-4 sm:px-6 h-11 sm:h-12 uppercase tracking-widest text-xs transition-colors duration-200"
                                >
                                    Next
                                    <ArrowRight className="ml-2 h-4 w-4 shrink-0 group-hover:translate-x-0.5 transition-transform duration-200" aria-hidden />
                                </Button>
                            </motion.div>
                        ) : isAddBusinessFlow ? (
                            <OnboardingCancelButton className="px-4 sm:px-6 h-11 sm:h-12" />
                        ) : (
                            <span className="block w-full" aria-hidden />
                        )}
                    </div>
                </nav>
            </div>
        </div>
    )
}
