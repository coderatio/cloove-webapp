"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import {
    LayoutGrid,
    ArrowRight,
    CheckCircle2,
    ChevronLeft,
    Building2,
    MapPin,
    Globe,
    Briefcase
} from "lucide-react"
import { cn } from "@/app/lib/utils"
import { GlassCard } from "@/app/components/ui/glass-card"
import { Button } from "@/app/components/ui/button"
import { Input } from "@/app/components/ui/input"
import { apiClient } from "@/app/lib/api-client"
import { toast } from "sonner"
import { useBusiness } from "@/app/components/BusinessProvider"
import Image from "next/image"

interface Category {
    id: string
    name: string
}

export default function OnboardingPage() {
    const router = useRouter()
    const { refreshBusinesses } = useBusiness()
    const [step, setStep] = useState(1)
    const [categories, setCategories] = useState<Category[]>([])
    const [isLoadingCategories, setIsLoadingCategories] = useState(true)
    const [isSubmitting, setIsSubmitting] = useState(false)

    // Form State
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
    const [businessName, setBusinessName] = useState("")
    const [country, setCountry] = useState("NG") // Default to Nigeria
    const [fullName, setFullName] = useState("")

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

    const handleNext = () => {
        if (step === 1 && !selectedCategory) {
            toast.error("Please select a business category")
            return
        }
        setStep(prev => prev + 1)
    }

    const handleSubmit = async () => {
        if (!businessName.trim()) {
            toast.error("Please enter your business name")
            return
        }

        setIsSubmitting(true)
        try {
            await apiClient.post("/onboarding/setup", {
                businessName,
                categoryId: selectedCategory,
                country,
                fullName
            })

            toast.success("Business set up successfully!")
            await refreshBusinesses()
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
                        {step === 1 ? "What's your business industry?" : "Let's name your business"}
                    </h1>
                    <p className="text-brand-accent/60 dark:text-brand-cream/60 text-lg max-w-md mx-auto">
                        {step === 1
                            ? "Help us tailor your experience by selecting a category."
                            : "Give your business a name to get started."}
                    </p>
                </div>

                <AnimatePresence mode="wait">
                    {step === 1 ? (
                        <motion.div
                            key="step1"
                            variants={containerVariants}
                            initial="hidden"
                            animate="visible"
                            exit="exit"
                            className="grid grid-cols-2 sm:grid-cols-3 gap-4"
                        >
                            {isLoadingCategories ? (
                                Array(6).fill(0).map((_, i) => (
                                    <div key={i} className="h-40 rounded-3xl bg-white/5 animate-pulse border border-white/5" />
                                ))
                            ) : (
                                categories.map((category) => (
                                    <button
                                        key={category.id}
                                        onClick={() => setSelectedCategory(category.id)}
                                        className="group text-left focus:outline-none"
                                    >
                                        <GlassCard className={cn(
                                            "h-40 p-6 flex flex-col justify-between transition-all duration-300 group-hover:bg-white/10 group-hover:scale-[1.02] border-white/5",
                                            selectedCategory === category.id && "bg-brand-gold/10 border-brand-gold/40 ring-1 ring-brand-gold/20 scale-[1.02]"
                                        )}>
                                            <div className={cn(
                                                "h-10 w-10 rounded-xl flex items-center justify-center transition-colors shadow-inner border border-white/5",
                                                selectedCategory === category.id ? "bg-brand-gold text-brand-deep" : "bg-white/5 text-brand-gold group-hover:bg-brand-gold/20"
                                            )}>
                                                <Briefcase className="h-5 w-5" />
                                            </div>
                                            <div className="space-y-1">
                                                <h3 className={cn(
                                                    "font-bold text-sm transition-colors",
                                                    selectedCategory === category.id ? "text-brand-gold" : "text-brand-deep dark:text-brand-cream group-hover:text-brand-gold"
                                                )}>
                                                    {category.name}
                                                </h3>
                                                {selectedCategory === category.id && (
                                                    <motion.div layoutId="check" initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }}>
                                                        <CheckCircle2 className="h-4 w-4 text-brand-gold" />
                                                    </motion.div>
                                                )}
                                            </div>
                                        </GlassCard>
                                    </button>
                                ))
                            )}
                        </motion.div>
                    ) : (
                        <motion.div
                            key="step2"
                            variants={containerVariants}
                            initial="hidden"
                            animate="visible"
                            exit="exit"
                            className="max-w-md mx-auto w-full"
                        >
                            <GlassCard className="p-8 space-y-6 border-white/5 shadow-2xl">
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-brand-accent/40 dark:text-brand-cream/40 uppercase tracking-[0.2em] flex items-center gap-2">
                                            <Building2 className="h-3 w-3" />
                                            Business Name
                                        </label>
                                        <Input
                                            value={businessName}
                                            onChange={(e) => setBusinessName(e.target.value)}
                                            placeholder="e.g. Martha's Kitchen"
                                            className="h-14 bg-white/5 border-white/10 rounded-2xl focus:ring-brand-gold/20 focus:border-brand-gold/30 text-lg transition-all"
                                            autoFocus
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-brand-accent/40 dark:text-brand-cream/40 uppercase tracking-[0.2em] flex items-center gap-2">
                                            <MapPin className="h-3 w-3" />
                                            Country
                                        </label>
                                        <div className="h-14 bg-white/5 border border-white/10 rounded-2xl flex items-center px-4 gap-3 text-brand-deep/60 dark:text-brand-cream/60 cursor-not-allowed">
                                            <Globe className="h-5 w-5 text-brand-gold/40" />
                                            <span className="font-medium">Nigeria (Default)</span>
                                            <span className="ml-auto text-[10px] bg-brand-gold/10 text-brand-gold px-2 py-1 rounded-md">NG</span>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-brand-accent/40 dark:text-brand-cream/40 uppercase tracking-[0.2em] flex items-center gap-2">
                                            Account Holder Name
                                        </label>
                                        <Input
                                            value={fullName}
                                            onChange={(e) => setFullName(e.target.value)}
                                            placeholder="Your full name"
                                            className="h-14 bg-white/5 border-white/10 rounded-2xl focus:ring-brand-gold/20 focus:border-brand-gold/30 transition-all"
                                        />
                                    </div>
                                </div>

                                <div className="pt-4">
                                    <Button
                                        onClick={handleSubmit}
                                        disabled={isSubmitting}
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

                {/* Footer Controls */}
                <div className="flex items-center justify-between pt-12">
                    {step === 2 && (
                        <button
                            onClick={() => setStep(1)}
                            className="flex items-center gap-2 text-sm font-bold text-brand-accent/40 hover:text-brand-deep dark:hover:text-brand-cream transition-colors uppercase tracking-widest"
                        >
                            <ChevronLeft className="h-4 w-4" />
                            Back
                        </button>
                    )}
                    <div className="flex gap-2 mx-auto">
                        <div className={cn("h-1.5 w-8 rounded-full transition-all duration-500", step === 1 ? "bg-brand-gold" : "bg-white/10")} />
                        <div className={cn("h-1.5 w-8 rounded-full transition-all duration-500", step === 2 ? "bg-brand-gold" : "bg-white/10")} />
                    </div>
                    {step === 1 && (
                        <Button
                            onClick={handleNext}
                            className="bg-transparent hover:bg-white/5 text-brand-deep dark:text-brand-cream font-bold group px-6 h-12 uppercase tracking-widest text-xs"
                        >
                            Next
                            <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                        </Button>
                    )}
                    {step === 2 && <div className="w-24" />}
                </div>
            </div>
        </div>
    )
}
