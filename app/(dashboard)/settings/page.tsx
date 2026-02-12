"use client"

import { useState } from "react"
import { ManagementHeader } from "@/app/components/shared/ManagementHeader"
import { Button } from "@/app/components/ui/button"
import {
    User,
    Building2,
    ShieldCheck,
    Lock,
    Save,
    CreditCard,
    Loader2
} from "lucide-react"
import { cn } from "@/app/lib/utils"
import { motion, AnimatePresence } from "framer-motion"
import { toast } from "sonner"
import { BillingSettings } from "@/app/domains/business/components/BillingSettings"
import { VerificationSettings } from "@/app/domains/business/components/VerificationSettings"
import { BusinessSettings } from "@/app/domains/business/components/BusinessSettings"
import { ProfileSettings } from "@/app/domains/business/components/ProfileSettings"
import { SecuritySettings } from "@/app/domains/business/components/SecuritySettings"
import { PageTransition } from "@/app/components/layout/page-transition"

type Tab = "business" | "profile" | "billing" | "security" | "verification"

export default function SettingsPage() {
    const [activeTab, setActiveTab] = useState<Tab>("business")
    const [isSaving, setIsSaving] = useState(false)

    const tabs: { id: Tab; label: string; icon: any }[] = [
        { id: "business", label: "Business", icon: Building2 },
        { id: "profile", label: "My Profile", icon: User },
        { id: "verification", label: "Verification", icon: ShieldCheck },
        { id: "billing", label: "Billing", icon: CreditCard },
        { id: "security", label: "Security", icon: Lock },
    ]

    const handleGlobalSave = () => {
        setIsSaving(true)
        // Simulate network request
        setTimeout(() => {
            setIsSaving(false)
            toast.success("Settings saved successfully")
        }, 2000)
    }

    return (
        <PageTransition>
            <div className="max-w-5xl mx-auto space-y-8 pb-20">
                <ManagementHeader
                    title="Settings"
                    description="Manage your business preferences and personal profile"
                />

                {/* Tab Navigation */}
                <div className="w-full overflow-x-auto pb-2 no-scrollbar">
                    <div className="flex items-center gap-2 p-1 bg-brand-deep/5 dark:bg-white/5 rounded-2xl w-max min-w-0">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={cn(
                                    "relative flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 whitespace-nowrap",
                                    activeTab === tab.id
                                        ? "text-brand-deep dark:text-brand-gold"
                                        : "text-brand-deep/60 dark:text-brand-cream/60 hover:bg-white/50 dark:hover:bg-white/5"
                                )}
                            >
                                {activeTab === tab.id && (
                                    <motion.div
                                        layoutId="active-tab"
                                        className="absolute inset-0 bg-white dark:bg-white/10 rounded-xl shadow-sm"
                                        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                    />
                                )}
                                <tab.icon className="relative z-10 w-4 h-4" />
                                <span className="relative z-10">{tab.label}</span>
                            </button>
                        ))}
                    </div>
                </div>

                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                    >
                        {activeTab === "business" && <BusinessSettings />}
                        {activeTab === "profile" && <ProfileSettings />}
                        {activeTab === "verification" && <VerificationSettings />}
                        {activeTab === "billing" && <BillingSettings />}
                        {activeTab === "security" && <SecuritySettings />}
                    </motion.div>
                </AnimatePresence>

                {/* Common Save Bar */}
                {activeTab === "business" && (
                    <div className="fixed bottom-8 right-8 z-30">
                        <Button
                            onClick={handleGlobalSave}
                            disabled={isSaving}
                            className="rounded-full bg-brand-deep text-brand-gold hover:bg-brand-deep/90 dark:bg-brand-gold dark:text-brand-deep dark:hover:bg-brand-gold/90 px-8 h-14 shadow-2xl hover:scale-105 transition-all font-bold"
                        >
                            {isSaving ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <>
                                    <Save className="w-4 h-4 mr-2" />
                                    Save Changes
                                </>
                            )}
                        </Button>
                    </div>
                )}
            </div>
        </PageTransition>
    )
}
