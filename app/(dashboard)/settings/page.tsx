"use client"

import { useState, Suspense } from "react"
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
import { motion, AnimatePresence } from "framer-motion"
import { toast } from "sonner"
import { BillingSettings } from "@/app/domains/business/components/BillingSettings"
import { VerificationSettings } from "@/app/domains/business/components/VerificationSettings"
import { BusinessSettings } from "@/app/domains/business/components/BusinessSettings"
import { ProfileSettings } from "@/app/domains/business/components/ProfileSettings"
import { SecuritySettings } from "@/app/domains/business/components/SecuritySettings"
import { PageTransition } from "@/app/components/layout/page-transition"
import { PersistedTabs, TabItem } from "@/app/components/shared/PersistedTabs"

type Tab = "business" | "profile" | "billing" | "security" | "verification"

function SettingsContent() {
    const [activeTab, setActiveTab] = useState<Tab>("business")
    const [isSaving, setIsSaving] = useState(false)

    const tabs: (TabItem & { id: Tab })[] = [
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
        <div className="max-w-5xl mx-auto space-y-8 pb-20">
            <ManagementHeader
                title="Settings"
                description="Manage your business preferences and personal profile"
            />

            {/* Tab Navigation */}
            <PersistedTabs
                tabs={tabs}
                activeTab={activeTab}
                defaultTab="business"
                onChange={(id) => setActiveTab(id as Tab)}
            />

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
    )
}

export default function SettingsPage() {
    return (
        <PageTransition>
            <Suspense fallback={<div className="flex items-center justify-center min-h-[400px]"><Loader2 className="w-8 h-8 animate-spin text-brand-gold" /></div>}>
                <SettingsContent />
            </Suspense>
        </PageTransition>
    )
}
