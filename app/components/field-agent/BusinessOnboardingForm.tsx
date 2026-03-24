"use client"

import React, { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { GlassCard } from "@/app/components/ui/glass-card"
import { Button } from "@/app/components/ui/button"
import { Input } from "@/app/components/ui/input"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/app/components/ui/select"
import {
    Building2,
    User,
    Phone,
    Globe,
    ChevronRight,
    ChevronLeft,
    CheckCircle2,
    Loader2,
    Shield,
    Sparkles,
    ArrowRight,
    Store,
    BadgeCheck,
    Check,
} from "lucide-react"
import { cn } from "@/app/lib/utils"
import { useOnboardBusiness } from "@/app/domains/field-agent/hooks/useOnboardBusiness"
import { useCountries } from "@/app/hooks/useCountries"
import { apiClient } from "@/app/lib/api-client"
import { SearchableSelect } from "@/app/components/ui/searchable-select"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

const STEPS = [
    { id: 1, title: "Entity", icon: Building2 },
    { id: 2, title: "Profile", icon: User },
    { id: 3, title: "Verify", icon: Shield }
]

interface Category {
    id: string
    name: string
}

export function BusinessOnboardingForm() {
    const [step, setStep] = useState(1)
    const router = useRouter()
    const [formData, setFormData] = useState({
        businessName: "",
        category: "",
        country: "Nigeria",
        merchantName: "",
        phone: "",
        businessType: "" as "INDIVIDUAL" | "REGISTERED" | "",
    })

    const { data: countriesData, isLoading: isLoadingCountries } = useCountries()
    const [categories, setCategories] = useState<Category[]>([])
    const [isLoadingCategories, setIsLoadingCategories] = useState(true)

    const countries = countriesData ?? []

    const { mutateAsync: onboardBusiness, isPending: isSubmitting } = useOnboardBusiness()

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const data = await apiClient.get<Category[]>("/onboarding/categories")
                setCategories(data)
            } catch (error) {
                console.error("Failed to load categories", error)
            } finally {
                setIsLoadingCategories(false)
            }
        }
        fetchCategories()
    }, [])

    const isStep1Valid = !!formData.businessName && !!formData.country && !!formData.businessType
    const isStep2Valid = !!formData.merchantName && !!formData.phone

    const categoryOptions = categories.map(c => ({
        label: c.name,
        value: c.id,
        icon: <Building2 className="w-4 h-4 opacity-40" />
    }))

    const handleNext = () => {
        if (step === 1 && !isStep1Valid) {
            toast.error("Please fill in all business details")
            return
        }
        if (step === 2 && !isStep2Valid) {
            toast.error("Please fill in all owner details")
            return
        }
        setStep(s => Math.min(s + 1, 3))
    }

    const handleBack = () => {
        if (step === 1) {
            router.back()
        } else {
            setStep(s => Math.max(s - 1, 1))
        }
    }

    const handleSubmit = async () => {
        try {
            await onboardBusiness({
                businessName: formData.businessName,
                merchantName: formData.merchantName,
                phoneNumber: formData.phone,
                country: formData.country.toUpperCase().replace(/ /g, '_'),
                categoryId: formData.category || undefined,
                businessType: formData.businessType || undefined,
            })
            toast.success("Merchant onboarded successfully!")
            setStep(1)
            setFormData({ businessName: "", category: "", country: "Nigeria", merchantName: "", phone: "", businessType: "" })
        } catch {
            // error handling is done inside useOnboardBusiness
        }
    }

    const stepVariants = {
        initial: { opacity: 0, x: 20 },
        animate: { opacity: 1, x: 0 },
        exit: { opacity: 0, x: -20 }
    }

    return (
        <div className="max-w-xl mx-auto pb-44 md:py-8">
            {/* Professional Step Indicator */}
            <div className="flex items-center justify-between mb-10 md:mb-16 px-4">
                {STEPS.map((s, i) => (
                    <React.Fragment key={s.id}>
                        <div className="flex flex-col items-center gap-3 relative z-10">
                            <motion.div
                                className={cn(
                                    "w-10 h-10 md:w-12 md:h-12 rounded-2xl flex items-center justify-center transition-all duration-500 border-2",
                                    step >= s.id
                                        ? "bg-brand-deep border-brand-deep text-white shadow-xl shadow-brand-deep/20"
                                        : "bg-white/50 border-brand-deep/5 text-brand-deep/20 dark:bg-white/5 dark:border-white/5 dark:text-brand-cream/20"
                                )}
                                animate={step === s.id ? { scale: 1.15 } : { scale: 1 }}
                            >
                                <s.icon className={cn("w-5 h-5 md:w-6 md:h-6 transition-all", step >= s.id ? "scale-110" : "scale-100")} />

                                {step > s.id && (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center border-2 border-brand-cream dark:border-brand-deep"
                                    >
                                        <CheckCircle2 className="w-3 h-3 text-white" />
                                    </motion.div>
                                )}
                            </motion.div>
                            <span className={cn(
                                "text-[10px] md:text-[11px] uppercase tracking-[0.2em] font-black transition-colors duration-500",
                                step === s.id ? "text-brand-deep dark:text-brand-cream" : "text-brand-deep/20 dark:text-brand-cream/20"
                            )}>
                                {s.title}
                            </span>
                        </div>
                        {i < STEPS.length - 1 && (
                            <div className="flex-1 h-px bg-brand-deep/5 relative -mt-7 -mx-10 md:-mx-12 overflow-hidden">
                                <motion.div
                                    className="h-full bg-brand-deep"
                                    initial={{ width: "0%" }}
                                    animate={{ width: step > s.id ? "100%" : "0%" }}
                                    transition={{ duration: 0.6, ease: "easeInOut" }}
                                />
                            </div>
                        )}
                    </React.Fragment>
                ))}
            </div>

            {/* Main Form Applet Container */}
            <GlassCard className="p-6 md:p-12 border-none shadow-2xl shadow-brand-deep/5 overflow-visible">
                <AnimatePresence mode="wait">
                    {step === 1 && (
                        <motion.div
                            key="step1"
                            variants={stepVariants}
                            initial="initial"
                            animate="animate"
                            exit="exit"
                            className="space-y-8"
                        >
                            <div className="space-y-2">
                                <p className="text-[10px] font-black text-brand-gold uppercase tracking-[0.3em] mb-1">Step 01</p>
                                <h2 className="text-3xl font-serif font-medium text-brand-deep dark:text-brand-cream">Business Details</h2>
                                <p className="text-sm text-brand-deep/50 dark:text-brand-cream/50 mt-1 font-medium italic">Enter the basic details of the merchant's business.</p>
                            </div>

                            <div className="space-y-6">
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between px-1">
                                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-deep/30 dark:text-brand-cream/30">Business Type</label>
                                        <motion.span 
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: formData.businessType ? 1 : 0 }}
                                            className="text-[10px] text-brand-gold font-bold uppercase tracking-widest flex items-center gap-1"
                                        >
                                            <CheckCircle2 className="w-3 h-3" />
                                            Selected
                                        </motion.span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        {([
                                            { value: "INDIVIDUAL", label: "Individual", sub: "Unregistered / Sole Trader", icon: Store },
                                            { value: "REGISTERED", label: "Registered", sub: "CAC or Officially Registered", icon: BadgeCheck },
                                        ] as const).map(({ value, label, sub, icon: Icon }, i) => (
                                            <motion.button
                                                key={value}
                                                type="button"
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: i * 0.1 + 0.2 }}
                                                whileHover={{ y: -4, transition: { duration: 0.2 } }}
                                                whileTap={{ scale: 0.98 }}
                                                onClick={() => setFormData(p => ({ ...p, businessType: value }))}
                                                className={cn(
                                                    "group relative flex flex-col items-start gap-4 p-5 rounded-3xl border-2 text-left transition-all duration-500 overflow-hidden",
                                                    formData.businessType === value
                                                        ? "border-brand-gold bg-brand-gold/5 shadow-2xl shadow-brand-gold/10"
                                                        : "border-brand-deep/5 bg-brand-deep/2 hover:border-brand-deep/10 dark:bg-white/3 dark:border-white/5 dark:hover:border-white/10"
                                                )}
                                            >
                                                {/* Background Glow for selected state */}
                                                {formData.businessType === value && (
                                                    <motion.div 
                                                        layoutId="bg-glow"
                                                        className="absolute inset-0 bg-linear-to-br from-brand-gold/10 to-transparent"
                                                    />
                                                )}

                                                <div className={cn(
                                                    "w-10 h-10 rounded-2xl flex items-center justify-center transition-all duration-500 relative z-10",
                                                    formData.businessType === value
                                                        ? "bg-brand-gold text-white shadow-lg shadow-brand-gold/20"
                                                        : "bg-brand-deep/5 text-brand-deep/30 dark:bg-white/5 dark:text-brand-cream/20 group-hover:scale-110"
                                                )}>
                                                    <Icon className="w-5 h-5" />
                                                </div>

                                                <div className="relative z-10">
                                                    <p className={cn(
                                                        "text-base md:text-lg font-serif transition-colors duration-500",
                                                        formData.businessType === value ? "text-brand-deep dark:text-brand-cream" : "text-brand-deep/40 dark:text-brand-cream/40"
                                                    )}>{label}</p>
                                                    <p className="text-[10px] text-brand-deep/30 dark:text-brand-cream/30 font-medium mt-1 leading-snug uppercase tracking-wider">{sub}</p>
                                                </div>

                                                {/* Selection Checkmark */}
                                                {formData.businessType === value && (
                                                    <motion.div 
                                                        layoutId="check-bubble"
                                                        className="absolute top-4 right-4 w-6 h-6 bg-brand-gold rounded-full flex items-center justify-center"
                                                    >
                                                        <Check className="w-3.5 h-3.5 text-white stroke-3" />
                                                    </motion.div>
                                                )}
                                            </motion.button>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-brand-deep/30 dark:text-brand-cream/30 px-1">Business Name</label>
                                    <Input
                                        placeholder="e.g. Lagos Luxury Stitches"
                                        value={formData.businessName}
                                        onChange={(e) => setFormData(p => ({ ...p, businessName: e.target.value }))}
                                        className="h-14 sm:h-14 lg:h-12 rounded-2xl border-brand-deep/5 bg-brand-deep/3 focus:ring-brand-gold/20 focus:border-brand-gold transition-all font-bold placeholder:text-brand-deep/20"
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-brand-deep/30 dark:text-brand-cream/30 px-1">Industry Category</label>
                                        <SearchableSelect
                                            options={categoryOptions}
                                            value={formData.category}
                                            onChange={(v) => setFormData(p => ({ ...p, category: v }))}
                                            disabled={isLoadingCategories}
                                            placeholder={isLoadingCategories ? "Loading..." : "Select Sector"}
                                            searchPlaceholder="Search industries..."
                                            triggerClassName="h-14 sm:h-14 lg:h-12 rounded-2xl border-brand-deep/5 bg-brand-deep/3 focus:ring-brand-gold/20 focus:border-brand-gold font-bold transition-all hover:bg-brand-deep/5 dark:bg-brand-deep/20 dark:hover:bg-brand-deep/30 dark:border-white/5"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-brand-deep/30 dark:text-brand-cream/30 px-1">Business Location</label>
                                        <Select
                                            value={formData.country}
                                            onValueChange={(v) => setFormData(p => ({ ...p, country: v }))}
                                            disabled={isLoadingCountries}
                                        >
                                            <SelectTrigger className="h-14 sm:h-14 lg:h-12 rounded-2xl border-brand-deep/5 bg-brand-deep/3 focus:ring-brand-gold/20 focus:border-brand-gold font-bold">
                                                <SelectValue placeholder={isLoadingCountries ? "Loading..." : "Select Country"} />
                                            </SelectTrigger>
                                            <SelectContent className="rounded-2xl border-brand-deep/5 shadow-2xl">
                                                {countries.map((c) => (
                                                    <SelectItem key={c.id} value={c.name} className="rounded-xl my-1 focus:bg-brand-gold/10 focus:text-brand-gold">
                                                        {c.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {step === 2 && (
                        <motion.div
                            key="step2"
                            variants={stepVariants}
                            initial="initial"
                            animate="animate"
                            exit="exit"
                            className="space-y-8"
                        >
                            <div className="space-y-2">
                                <p className="text-[10px] font-black text-brand-gold uppercase tracking-[0.3em] mb-1">Step 02</p>
                                <h2 className="text-3xl font-serif font-medium text-brand-deep dark:text-brand-cream">Owner Profile</h2>
                                <p className="text-sm text-brand-deep/50 dark:text-brand-cream/50 mt-1 font-medium italic">Enter the name and contact details of the business owner.</p>
                            </div>

                            <div className="space-y-6">
                                <div className="space-y-2 group">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-brand-deep/30 dark:text-brand-cream/30 px-1 group-focus-within:text-brand-gold transition-colors">Legal Full Name</label>
                                    <div className="relative">
                                        <User className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-brand-deep/20 dark:text-brand-cream/20 group-focus-within:text-brand-gold transition-colors" />
                                        <Input
                                            placeholder="e.g. Sarah Johnson"
                                            className="h-14 sm:h-14 lg:h-12 pl-14 rounded-2xl border-brand-deep/5 bg-brand-deep/3 focus:ring-brand-gold/20 focus:border-brand-gold transition-all font-bold placeholder:text-brand-deep/20"
                                            value={formData.merchantName}
                                            onChange={(e) => setFormData(p => ({ ...p, merchantName: e.target.value }))}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2 group">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-brand-deep/30 dark:text-brand-cream/30 px-1 group-focus-within:text-brand-gold transition-colors">Direct Contact Line</label>
                                    <div className="relative">
                                        <Phone className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-brand-deep/20 dark:text-brand-cream/20 group-focus-within:text-brand-gold transition-colors" />
                                        <Input
                                            placeholder="e.g. +234 801 234 5678"
                                            className="h-14 sm:h-14 lg:h-12 pl-14 rounded-2xl border-brand-deep/5 bg-brand-deep/3 focus:ring-brand-gold/20 focus:border-brand-gold transition-all font-bold placeholder:text-brand-deep/20 font-mono"
                                            value={formData.phone}
                                            onChange={(e) => setFormData(p => ({ ...p, phone: e.target.value }))}
                                        />
                                    </div>
                                    <div className="flex items-center gap-2 px-1 mt-2">
                                        <Sparkles className="w-3 h-3 text-brand-gold animate-pulse" />
                                        <p className="text-[10px] text-brand-deep/40 dark:text-brand-cream/40 font-bold uppercase tracking-wider">A secure verification invite will be sent.</p>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {step === 3 && (
                        <motion.div
                            key="step3"
                            variants={stepVariants}
                            initial="initial"
                            animate="animate"
                            exit="exit"
                            className="space-y-8"
                        >
                            <div className="space-y-2">
                                <p className="text-[10px] font-black text-brand-gold uppercase tracking-[0.3em] mb-1">Step 03</p>
                                <h2 className="text-3xl font-serif font-medium text-brand-deep dark:text-brand-cream">Review Details</h2>
                                <p className="text-sm text-brand-deep/50 dark:text-brand-cream/50 mt-1 font-medium italic">Check the details below before submitting.</p>
                            </div>

                            <div className="flex flex-col gap-3 p-2 bg-brand-deep/3 rounded-[32px] border border-brand-deep/5 shadow-inner">
                                {[
                                    { label: "Entity Name", value: formData.businessName, icon: Building2 },
                                    { label: "Type", value: formData.businessType === "INDIVIDUAL" ? "Individual (Unregistered)" : "Registered Business", icon: BadgeCheck },
                                    { label: "Category", value: formData.category ? (categories.find(c => c.id === formData.category)?.name ?? formData.category) : "—", icon: Globe },
                                    { label: "Jurisdiction", value: formData.country, icon: Sparkles },
                                    { label: "Merchant", value: formData.merchantName, icon: User },
                                    { label: "Contact", value: formData.phone, icon: Phone }
                                ].map((item, i) => (
                                    <div key={i} className="flex items-center justify-between p-5 bg-white dark:bg-white/5 rounded-3xl border border-brand-deep/5 dark:border-white/5 shadow-sm group hover:scale-[1.02] transition-all">
                                        <div className="flex items-center gap-4">
                                            <div className="p-2.5 bg-brand-deep/5 dark:bg-white/5 rounded-xl text-brand-deep/20 dark:text-brand-cream/20 group-hover:bg-brand-gold/10 group-hover:text-brand-gold transition-colors">
                                                <item.icon className="w-4 h-4" />
                                            </div>
                                            <span className="text-[10px] font-black uppercase tracking-widest text-brand-deep/30 dark:text-brand-cream/30">{item.label}</span>
                                        </div>
                                        <span className={cn(
                                            "text-sm font-bold text-brand-deep dark:text-brand-cream truncate max-w-[150px]",
                                            item.label === "Contact" && "font-mono"
                                        )}>{item.value || "—"}</span>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Desk-only Footer Actions */}
                <div className="mt-12 hidden md:flex items-center justify-between">
                    <Button
                        variant="outline"
                        onClick={handleBack}
                        disabled={isSubmitting}
                        className="rounded-2xl h-14 px-8 border-brand-deep/5 dark:border-white/10 bg-white dark:bg-white/5 hover:bg-brand-deep/5 dark:hover:bg-white/10 transition-all font-bold text-brand-deep/60 dark:text-brand-cream/60 disabled:opacity-20 translate-y-0 active:translate-y-1"
                    >
                        <ChevronLeft className="w-5 h-5 mr-2" />
                        {step === 1 ? "Cancel" : "Back"}
                    </Button>

                    {step < 3 ? (
                        <Button
                            onClick={handleNext}
                            disabled={step === 1 ? !isStep1Valid : !isStep2Valid}
                            className="bg-brand-deep text-white rounded-2xl h-14 px-10 font-bold hover:shadow-2xl hover:shadow-brand-deep/20 transition-all hover:-translate-y-1 active:translate-y-0 disabled:opacity-50"
                        >
                            Continue
                            <ChevronRight className="w-5 h-5 ml-2" />
                        </Button>
                    ) : (
                        <Button
                            onClick={handleSubmit}
                            disabled={isSubmitting}
                            className="bg-brand-gold text-brand-deep hover:bg-brand-gold/90 rounded-2xl h-14 px-12 font-black uppercase tracking-widest shadow-xl shadow-brand-gold/10 hover:-translate-y-1 active:translate-y-0 transition-all"
                        >
                            {isSubmitting ? (
                                <Loader2 className="w-6 h-6 animate-spin" />
                            ) : (
                                "Submit"
                            )}
                        </Button>
                    )}
                </div>
            </GlassCard>

            {/* Mobile Native Sticky Controller */}
            <div className="fixed bottom-0 left-0 right-0 p-6 md:hidden z-50">
                <div className="absolute inset-0 bg-brand-cream/80 dark:bg-brand-deep/80 backdrop-blur-2xl border-t border-brand-deep/5 dark:border-white/5 mask-gradient-to-t pointer-events-none h-full" />
                <div className="relative flex items-center justify-between gap-4">
                    <Button
                        variant="outline"
                        onClick={handleBack}
                        disabled={isSubmitting}
                        className="flex-1 rounded-[24px] h-16 border-brand-deep/10 dark:border-white/10 bg-white/50 dark:bg-white/5 active:scale-95 transition-transform font-bold"
                    >
                        <ChevronLeft className="w-5 h-5 mr-1" />
                        {step === 1 ? "Cancel" : "Back"}
                    </Button>

                    {step < 3 ? (
                        <Button
                            onClick={handleNext}
                            disabled={step === 1 ? !isStep1Valid : !isStep2Valid}
                            className="flex-2 bg-brand-deep text-white rounded-[24px] h-16 font-bold shadow-2xl shadow-brand-deep/30 active:scale-95 transition-all text-lg disabled:opacity-50"
                        >
                            Continue
                            <ArrowRight className="w-6 h-6 ml-2" />
                        </Button>
                    ) : (
                        <Button
                            onClick={handleSubmit}
                            disabled={isSubmitting}
                            className="flex-2 bg-brand-gold text-brand-deep rounded-[24px] h-16 font-black uppercase tracking-widest shadow-2xl shadow-brand-gold/30 active:scale-95 transition-all text-lg"
                        >
                            {isSubmitting ? (
                                <Loader2 className="w-6 h-6 animate-spin" />
                            ) : (
                                "Complete Onboarding"
                            )}
                        </Button>
                    )}
                </div>
            </div>
        </div>
    )
}
