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
import { usePermission } from "@/app/hooks/usePermission"

type Tab = "business" | "profile" | "billing" | "security" | "verification"

function SettingsContent() {
    const { role } = usePermission()
    const [isDirty, setIsDirty] = useState(false)
    const [isSaving, setIsSaving] = useState(false)
    const [saveTrigger, setSaveTrigger] = useState(0)

    const allTabs: (TabItem & { id: Tab })[] = [
        { id: "business", label: "Business", icon: Building2 },
        { id: "profile", label: "My Profile", icon: User },
        { id: "verification", label: "Verification", icon: ShieldCheck },
        { id: "billing", label: "Billing", icon: CreditCard },
        { id: "security", label: "Security", icon: Lock },
    ]

    // Role-based filtering
    const tabs = allTabs.filter(tab => {
        if (tab.id === "profile" || tab.id === "security") return true
        if (role === 'OWNER') return true
        if (tab.id === "billing" && role === 'ACCOUNTANT') return true
        return false
    })

    // Safe default tab selection
    const [activeTab, setActiveTab] = useState<Tab>(() => {
        if (role === 'OWNER') return "business"
        return "profile"
    })

    const handleGlobalSave = () => {
        setSaveTrigger(prev => prev + 1)
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
                defaultTab={tabs[0]?.id || "profile"}
                onChange={(id) => {
                    setActiveTab(id as Tab)
                    setIsDirty(false)
                }}
            />

            <AnimatePresence mode="wait">
                <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                >
                    {activeTab === "business" && role === 'OWNER' && (
                        <BusinessSettings
                            onDirtyChange={setIsDirty}
                            onSavingChange={setIsSaving}
                            saveTrigger={saveTrigger}
                        />
                    )}
                    {activeTab === "profile" && <ProfileSettings />}
                    {activeTab === "verification" && role === 'OWNER' && <VerificationSettings />}
                    {activeTab === "billing" && (role === 'OWNER' || role === 'ACCOUNTANT') && <BillingSettings />}
                    {activeTab === "security" && <SecuritySettings />}
                </motion.div>
            </AnimatePresence>

            {/* Common Save Bar */}
            {isDirty && (
                <div className="fixed bottom-8 right-8 z-30">
                    <Button
                        onClick={handleGlobalSave}
                        disabled={isSaving}
                        className="rounded-full bg-brand-deep text-brand-gold hover:bg-brand-deep/90 dark:bg-brand-gold dark:text-brand-deep dark:hover:bg-brand-gold/90 px-8 h-14 shadow-2xl hover:scale-105 transition-all font-bold"
                    >
                        {isSaving ? (
                            <>
                                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                Saving...
                            </>
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
