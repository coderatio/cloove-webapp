"use client"

import { useState, useEffect, useRef, useMemo } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { HugeiconsIcon } from "@hugeicons/react"
import { ArrowRight01Icon as ArrowRight, CheckIcon as Check, ChevronLeftIcon as ChevronLeft, Building02Icon as Building2, MapPinIcon as MapPin, Logout01Icon as LogOut, Cancel01Icon as X } from "@hugeicons/core-free-icons"
import { cn } from "@/app/lib/utils"
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
        <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/")}
            className={cn(
                "flex cursor-pointer items-center gap-2 rounded-2xl border-border bg-card text-sm font-semibold text-foreground hover:bg-muted",
                className
            )}
            aria-label="Cancel and return to dashboard"
        >
            <HugeiconsIcon icon={X} className="h-4 w-4 shrink-0" aria-hidden />
            <span>Cancel</span>
        </Button>
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
    const countries = useMemo(() => countriesData ?? [], [countriesData])

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
            } catch {
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
        } catch (error: unknown) {
            toast.error(error instanceof Error ? error.message : "Failed to set up business")
        } finally {
            setIsSubmitting(false)
        }
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
            <div className="flex min-h-screen flex-col items-center justify-center bg-background p-6 sm:p-10">
                <div className="w-full max-w-md space-y-5 rounded-[28px] border border-border bg-card p-6 text-center shadow-sm sm:p-8">
                    <h1 className="text-2xl font-semibold tracking-tight text-foreground">
                        You’ve reached your business limit
                    </h1>
                    <p className="text-sm leading-relaxed text-muted-foreground">
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
                            className="rounded-2xl border-border bg-card text-foreground hover:bg-muted sm:min-w-[140px]"
                        >
                            Back to dashboard
                        </Button>
                        {role === "OWNER" && (
                            <Button
                                onClick={() => router.push("/settings?tab=billing")}
                                className="rounded-2xl bg-primary text-white hover:bg-primary/92 hover:text-white sm:min-w-[160px]"
                            >
                                Manage plan
                            </Button>
                        )}
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-background p-6 sm:p-10">
            <div className="relative z-10 w-full max-w-2xl space-y-8">
                <div className="space-y-4 text-center">
                    <div className="relative mx-auto h-14 w-14 overflow-hidden rounded-2xl border border-border bg-primary p-3">
                        <Image src="/images/logo-white.png" alt="Cloove" fill className="object-contain p-3" />
                    </div>

                    <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
                        {step === 1
                            ? "What's your business industry?"
                            : step === 2
                            ? "What type of business is this?"
                            : "Let's name your business"}
                    </h1>
                    <p className="mx-auto max-w-md text-base leading-relaxed text-muted-foreground">
                        {step === 1
                            ? "Help us tailor your experience by selecting a category."
                            : step === 2
                            ? "This determines your verification requirements."
                            : "Give your business a name to get started."}
                    </p>
                </div>

                <div className="rounded-[28px] border border-border bg-card p-5 shadow-sm sm:p-6">
                    {step === 2 ? (
                        <div className="flex justify-center">
                            <BusinessTypeSelector value={businessType} onChange={setBusinessType} />
                        </div>
                    ) : step === 1 ? (
                        <div className="flex flex-wrap justify-center gap-3">
                            {isLoadingCategories ? (
                                Array(6).fill(0).map((_, i) => (
                                    <div key={i} className="h-11 w-32 rounded-2xl bg-muted" />
                                ))
                            ) : (
                                categories.map((category) => {
                                    const isSelected = selectedCategory === category.id
                                    return (
                                        <button
                                            key={category.id}
                                            type="button"
                                            onClick={() => setSelectedCategory(category.id)}
                                            className={cn(
                                                "cursor-pointer rounded-2xl border px-4 py-2.5 text-sm font-semibold outline-none transition-colors focus-visible:ring-2 focus-visible:ring-primary/25",
                                                isSelected
                                                    ? "border-primary bg-primary text-white"
                                                    : "border-border bg-background text-foreground hover:border-primary/25 hover:bg-muted"
                                            )}
                                        >
                                            <span className="flex items-center gap-2">
                                                {isSelected && (
                                                    <span>
                                                        <HugeiconsIcon icon={Check} className="h-3.5 w-3.5" strokeWidth={3} />
                                                    </span>
                                                )}
                                                {category.name}
                                            </span>
                                        </button>
                                    )
                                })
                            )}
                        </div>
                    ) : (
                        <div className="mx-auto w-full max-w-md">
                            <div className="space-y-5">
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">
                                            <HugeiconsIcon icon={Building2} className="h-3 w-3" />
                                            Business Name
                                        </label>
                                        <Input
                                            ref={businessNameRef}
                                            value={businessName}
                                            onChange={(e) => setBusinessName(e.target.value)}
                                            placeholder="e.g. Martha's Kitchen"
                                            className="h-12 rounded-2xl border-border bg-background px-4 text-base text-foreground placeholder:text-muted-foreground focus:border-primary/35 focus:ring-primary/15"
                                            autoFocus
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">
                                            <HugeiconsIcon icon={MapPin} className="h-3 w-3" />
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
                                                    className="border-red-500/30 text-red-600 hover:bg-red-500/10 dark:text-red-400"
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
                                                dropdownClassName="border-border bg-popover text-popover-foreground"
                                                triggerRef={countryTriggerRef}
                                            />
                                        )}
                                        {user?.countryDetail && selectedCountry && user.countryDetail.code === selectedCountry.code && (
                                            <p className="text-xs text-muted-foreground">Default: your account country</p>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">
                                            Your name
                                        </label>
                                        <Input
                                            ref={fullNameRef}
                                            value={fullName}
                                            onChange={(e) => setFullName(e.target.value)}
                                            placeholder="Full name of the business owner"
                                            className="h-12 rounded-2xl border-border bg-background px-4 text-base text-foreground placeholder:text-muted-foreground focus:border-primary/35 focus:ring-primary/15"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <Button
                                        onClick={handleSubmit}
                                        disabled={isSubmitting || !selectedCountry || isCountriesError || !canAddBusiness}
                                        className="h-12 w-full rounded-2xl bg-primary text-base font-semibold text-white hover:bg-primary/92 hover:text-white disabled:cursor-not-allowed disabled:opacity-45"
                                    >
                                        {isSubmitting ? (
                                            <div className="flex items-center gap-2">
                                                <div className="h-4 w-4 rounded-full border-2 border-white/35 border-t-white animate-spin" />
                                                <span>Setting up...</span>
                                            </div>
                                        ) : (
                                            "Launch Business"
                                        )}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <nav
                    className="flex items-center justify-between gap-4"
                    aria-label="Onboarding steps"
                >
                    <div className="flex min-w-0 shrink-0 items-center gap-2 sm:gap-3">
                        {step > 1 ? (
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={() => setStep(prev => prev - 1)}
                                className="flex cursor-pointer items-center gap-2 rounded-2xl text-sm font-semibold text-foreground hover:bg-muted"
                            >
                                <HugeiconsIcon icon={ChevronLeft} className="h-4 w-4 shrink-0" aria-hidden />
                                <span>Back</span>
                            </Button>
                        ) : isAddBusinessFlow ? (
                            <OnboardingCancelButton className="px-3 py-2" />
                        ) : (
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={logout}
                                className="flex cursor-pointer items-center gap-2 rounded-2xl text-sm font-semibold text-foreground hover:bg-muted"
                            >
                                <HugeiconsIcon icon={LogOut} className="h-4 w-4 shrink-0" aria-hidden />
                                <span>Logout</span>
                            </Button>
                        )}
                    </div>
                    <div className="flex shrink-0 gap-2" aria-hidden>
                        <div className={cn("h-1.5 w-8 rounded-full", step === 1 ? "bg-primary" : "bg-muted")} />
                        <div className={cn("h-1.5 w-8 rounded-full", step === 2 ? "bg-primary" : "bg-muted")} />
                        <div className={cn("h-1.5 w-8 rounded-full", step === 3 ? "bg-primary" : "bg-muted")} />
                    </div>
                    <div className="flex min-w-0 shrink-0 justify-end w-24 sm:w-28">
                        {step < 3 ? (
                            <Button
                                onClick={handleNext}
                                className="h-11 rounded-2xl bg-primary px-4 text-sm font-semibold text-white hover:bg-primary/92 hover:text-white sm:h-12 sm:px-6"
                            >
                                Next
                                <HugeiconsIcon icon={ArrowRight} className="ml-2 h-4 w-4 shrink-0" aria-hidden />
                            </Button>
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
