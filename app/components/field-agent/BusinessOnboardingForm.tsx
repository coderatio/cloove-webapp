"use client"

import React, { useState } from "react"
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
    ArrowRight
} from "lucide-react"
import { cn } from "@/app/lib/utils"
import { useFieldAgent } from "@/app/domains/field-agent/providers/FieldAgentProvider"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

const STEPS = [
    { id: 1, title: "Entity", icon: Building2 },
    { id: 2, title: "Profile", icon: User },
    { id: 3, title: "Verify", icon: Shield }
]

export function BusinessOnboardingForm() {
    const [step, setStep] = useState(1)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const router = useRouter()
    const [formData, setFormData] = useState({
        businessName: "",
        category: "",
        country: "Nigeria",
        merchantName: "",
        phone: ""
    })
    const { onboardBusiness } = useFieldAgent()

    const handleNext = () => setStep(s => Math.min(s + 1, 3))
    const handleBack = () => {
        if (step === 1) {
            router.back()
        } else {
            setStep(s => Math.max(s - 1, 1))
        }
    }

    const handleSubmit = async () => {
        setIsSubmitting(true)
        try {
            await onboardBusiness(formData)
            toast.success("Merchant onboarded successfully!")
            setStep(1)
            setFormData({ businessName: "", category: "", country: "Nigeria", merchantName: "", phone: "" })
        } catch (error) {
            toast.error("Failed to onboard merchant.")
        } finally {
            setIsSubmitting(false)
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
                                        : "bg-white/50 border-brand-deep/5 text-brand-deep/20 dark:bg-white/5 dark:border-white/5"
                                )}
                                animate={step === s.id ? { scale: 1.15 } : { scale: 1 }}
                            >
                                <s.icon className={cn("w-5 h-5 md:w-6 md:h-6 transition-all", step >= s.id ? "scale-110" : "scale-100")} />

                                {step > s.id && (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center border-2 border-brand-cream"
                                    >
                                        <CheckCircle2 className="w-3 h-3 text-white" />
                                    </motion.div>
                                )}
                            </motion.div>
                            <span className={cn(
                                "text-[10px] md:text-[11px] uppercase tracking-[0.2em] font-black transition-colors duration-500",
                                step === s.id ? "text-brand-deep" : "text-brand-deep/20"
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
                                <h2 className="text-3xl font-serif font-medium text-brand-deep">Business Details</h2>
                                <p className="text-sm text-brand-deep/50 mt-1 font-medium italic">Enter the basic details of the merchant's business.</p>
                            </div>

                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-brand-deep/30 px-1">Business Registered Name</label>
                                    <Input
                                        placeholder="e.g. Lagos Luxury Stitches"
                                        value={formData.businessName}
                                        onChange={(e) => setFormData(p => ({ ...p, businessName: e.target.value }))}
                                        className="h-14 sm:h-12 rounded-2xl border-brand-deep/5 bg-brand-deep/3 focus:ring-brand-gold/20 focus:border-brand-gold transition-all font-bold placeholder:text-brand-deep/20"
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-brand-deep/30 px-1">Industry Category</label>
                                        <Select
                                            value={formData.category}
                                            onValueChange={(v) => setFormData(p => ({ ...p, category: v }))}
                                        >
                                            <SelectTrigger className="h-14 sm:h-12 rounded-2xl border-brand-deep/5 bg-brand-deep/3 focus:ring-brand-gold/20 focus:border-brand-gold font-bold">
                                                <SelectValue placeholder="Select Sector" />
                                            </SelectTrigger>
                                            <SelectContent className="rounded-2xl border-brand-deep/5 shadow-2xl">
                                                <SelectItem value="fashion" className="rounded-xl my-1 focus:bg-brand-gold/10 focus:text-brand-gold">Fashion & Apparel</SelectItem>
                                                <SelectItem value="food" className="rounded-xl my-1 focus:bg-brand-gold/10 focus:text-brand-gold">Food & Beverage</SelectItem>
                                                <SelectItem value="tech" className="rounded-xl my-1 focus:bg-brand-gold/10 focus:text-brand-gold">Electronics & Tech</SelectItem>
                                                <SelectItem value="beauty" className="rounded-xl my-1 focus:bg-brand-gold/10 focus:text-brand-gold">Beauty & Wellness</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-brand-deep/30 px-1">Business Location</label>
                                        <Select
                                            value={formData.country}
                                            onValueChange={(v) => setFormData(p => ({ ...p, country: v }))}
                                        >
                                            <SelectTrigger className="h-14 sm:h-12 rounded-2xl border-brand-deep/5 bg-brand-deep/3 focus:ring-brand-gold/20 focus:border-brand-gold font-bold">
                                                <SelectValue placeholder="Select Country" />
                                            </SelectTrigger>
                                            <SelectContent className="rounded-2xl border-brand-deep/5 shadow-2xl">
                                                <SelectItem value="Nigeria" className="rounded-xl my-1 focus:bg-brand-gold/10 focus:text-brand-gold">Nigeria</SelectItem>
                                                <SelectItem value="Ghana" className="rounded-xl my-1 focus:bg-brand-gold/10 focus:text-brand-gold">Ghana</SelectItem>
                                                <SelectItem value="Kenya" className="rounded-xl my-1 focus:bg-brand-gold/10 focus:text-brand-gold">Kenya</SelectItem>
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
                                <h2 className="text-3xl font-serif font-medium text-brand-deep">Owner Profile</h2>
                                <p className="text-sm text-brand-deep/50 mt-1 font-medium italic">Enter the name and contact details of the business owner.</p>
                            </div>

                            <div className="space-y-6">
                                <div className="space-y-2 group">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-brand-deep/30 px-1 group-focus-within:text-brand-gold transition-colors">Legal Full Name</label>
                                    <div className="relative">
                                        <User className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-brand-deep/20 group-focus-within:text-brand-gold transition-colors" />
                                        <Input
                                            placeholder="e.g. Sarah Johnson"
                                            className="h-14 pl-14 rounded-2xl border-brand-deep/5 bg-brand-deep/3 focus:ring-brand-gold/20 focus:border-brand-gold transition-all font-bold placeholder:text-brand-deep/20"
                                            value={formData.merchantName}
                                            onChange={(e) => setFormData(p => ({ ...p, merchantName: e.target.value }))}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2 group">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-brand-deep/30 px-1 group-focus-within:text-brand-gold transition-colors">Direct Contact Line</label>
                                    <div className="relative">
                                        <Phone className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-brand-deep/20 group-focus-within:text-brand-gold transition-colors" />
                                        <Input
                                            placeholder="e.g. +234 801 234 5678"
                                            className="h-14 pl-14 rounded-2xl border-brand-deep/5 bg-brand-deep/3 focus:ring-brand-gold/20 focus:border-brand-gold transition-all font-bold placeholder:text-brand-deep/20 font-mono"
                                            value={formData.phone}
                                            onChange={(e) => setFormData(p => ({ ...p, phone: e.target.value }))}
                                        />
                                    </div>
                                    <div className="flex items-center gap-2 px-1 mt-2">
                                        <Sparkles className="w-3 h-3 text-brand-gold animate-pulse" />
                                        <p className="text-[10px] text-brand-deep/40 font-bold uppercase tracking-wider">A secure verification invite will be sent.</p>
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
                                <h2 className="text-3xl font-serif font-medium text-brand-deep">Review Details</h2>
                                <p className="text-sm text-brand-deep/50 mt-1 font-medium italic">Check the details below before submitting.</p>
                            </div>

                            <div className="flex flex-col gap-3 p-2 bg-brand-deep/3 rounded-[32px] border border-brand-deep/5 shadow-inner">
                                {[
                                    { label: "Entity Name", value: formData.businessName, icon: Building2 },
                                    { label: "Category", value: formData.category, icon: Globe },
                                    { label: "Jurisdiction", value: formData.country, icon: Sparkles },
                                    { label: "Merchant", value: formData.merchantName, icon: User },
                                    { label: "Contact", value: formData.phone, icon: Phone }
                                ].map((item, i) => (
                                    <div key={i} className="flex items-center justify-between p-5 bg-white rounded-3xl border border-brand-deep/5 shadow-sm group hover:scale-[1.02] transition-all">
                                        <div className="flex items-center gap-4">
                                            <div className="p-2.5 bg-brand-deep/5 rounded-xl text-brand-deep/20 group-hover:bg-brand-gold/10 group-hover:text-brand-gold transition-colors">
                                                <item.icon className="w-4 h-4" />
                                            </div>
                                            <span className="text-[10px] font-black uppercase tracking-widest text-brand-deep/30">{item.label}</span>
                                        </div>
                                        <span className={cn(
                                            "text-sm font-bold text-brand-deep truncate max-w-[150px]",
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
                        className="rounded-2xl h-14 px-8 border-brand-deep/5 bg-white hover:bg-brand-deep/5 transition-all font-bold text-brand-deep/60 disabled:opacity-20 translate-y-0 active:translate-y-1"
                    >
                        <ChevronLeft className="w-5 h-5 mr-2" />
                        {step === 1 ? "Cancel" : "Previous Step"}
                    </Button>

                    {step < 3 ? (
                        <Button
                            onClick={handleNext}
                            disabled={!formData.businessName && step === 1}
                            className="bg-brand-deep text-white rounded-2xl h-14 px-10 font-bold hover:shadow-2xl hover:shadow-brand-deep/20 transition-all hover:-translate-y-1 active:translate-y-0"
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
                                "Complete Onboarding"
                            )}
                        </Button>
                    )}
                </div>
            </GlassCard>

            {/* Mobile Native Sticky Controller */}
            <div className="fixed bottom-0 left-0 right-0 p-6 md:hidden z-50">
                <div className="absolute inset-0 bg-brand-cream/80 backdrop-blur-2xl border-t border-brand-deep/5 mask-gradient-to-t pointer-events-none h-full" />
                <div className="relative flex items-center justify-between gap-4">
                    <Button
                        variant="outline"
                        onClick={handleBack}
                        disabled={step === 1 || isSubmitting}
                        className="flex-1 rounded-[24px] h-16 border-brand-deep/10 bg-white/50 active:scale-95 transition-transform font-bold"
                    >
                        <ChevronLeft className="w-5 h-5 mr-1" />
                        Back
                    </Button>

                    {step < 3 ? (
                        <Button
                            onClick={handleNext}
                            className="flex-2 bg-brand-deep text-white rounded-[24px] h-16 font-bold shadow-2xl shadow-brand-deep/30 active:scale-95 transition-all text-lg"
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
