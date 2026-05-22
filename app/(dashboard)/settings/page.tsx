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
    Loader2,
    Printer,
    LayoutTemplate,
    MessageSquare,
    ShoppingCart,
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { BillingSettings } from "@/app/domains/business/components/BillingSettings"
import { VerificationSettings } from "@/app/domains/business/components/VerificationSettings"
import { BusinessSettings } from "@/app/domains/business/components/BusinessSettings"
import { ProfileSettings } from "@/app/domains/business/components/ProfileSettings"
import { SecuritySettings } from "@/app/domains/business/components/SecuritySettings"
import { PrinterSettings } from "@/app/domains/business/components/PrinterSettings"
import { PageTransition } from "@/app/components/layout/page-transition"
import { PersistedTabs, TabItem } from "@/app/components/shared/PersistedTabs"
import { usePermission } from "@/app/hooks/usePermission"
import { PermissionGuard } from "@/app/components/shared/PermissionGuard"
import { WorkspaceSettings } from "@/app/domains/workspace/components/WorkspaceSettings"
import { WhatsAppSettings } from "@/app/domains/messaging/components/WhatsAppSettings"
import { SalesSettings } from "@/app/domains/business/components/SalesSettings"

type Tab = "business" | "sales" | "profile" | "billing" | "security" | "verification" | "printer" | "workspace" | "messaging"

function SettingsContent() {
    const { role, can } = usePermission()
    const [isDirty, setIsDirty] = useState(false)
    const [isSaving, setIsSaving] = useState(false)
    const [saveTrigger, setSaveTrigger] = useState(0)

    const allTabs: (TabItem & { id: Tab })[] = [
        { id: "business", label: "Business", icon: Building2 },
        { id: "sales", label: "Sales", icon: ShoppingCart },
        { id: "workspace", label: "Workspace", icon: LayoutTemplate },
        { id: "messaging", label: "WhatsApp", icon: MessageSquare },
        { id: "profile", label: "My Profile", icon: User },
        { id: "verification", label: "Verification", icon: ShieldCheck },
        { id: "billing", label: "Billing", icon: CreditCard },
        { id: "security", label: "Security", icon: Lock },
        { id: "printer", label: "Printer", icon: Printer },
    ]

    // Role-based filtering
    const tabs = allTabs.filter(tab => {
        if (tab.id === "profile" || tab.id === "security" || tab.id === "printer") return true
        if (tab.id === "workspace") return can("MANAGE_BUSINESS_CONFIG")
        if (tab.id === "messaging") return role === 'OWNER'
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
        <div className="mx-auto max-w-6xl space-y-2 pb-32 md:space-y-8 md:pb-36">
            <div className="sticky top-[calc(var(--subscription-banner-offset,0px)+3.5rem)] z-20 -mx-4 px-4 py-2 md:top-0 md:mx-0 md:px-0 md:py-4">
                <ManagementHeader
                    title="Settings"
                    description="Manage your business preferences and personal profile"
                />
            </div>

            <div className="md:grid md:gap-6 lg:grid-cols-[220px_1fr] lg:items-start">
                <div className="lg:sticky lg:top-32">
                    <PersistedTabs
                        tabs={tabs}
                        activeTab={activeTab}
                        defaultTab={tabs[0]?.id || "profile"}
                        orientation="vertical"
                        compact
                        mobileSheetTitle="Settings"
                        onChange={(id) => {
                            setActiveTab(id as Tab)
                            setIsDirty(false)
                        }}
                    />
                </div>

                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                        className="min-w-0"
                    >
                        {activeTab === "business" && role === 'OWNER' && (
                            <BusinessSettings
                                onDirtyChange={setIsDirty}
                                onSavingChange={setIsSaving}
                                saveTrigger={saveTrigger}
                            />
                        )}
                        {activeTab === "sales" && role === 'OWNER' && (
                            <SalesSettings
                                onDirtyChange={setIsDirty}
                                onSavingChange={setIsSaving}
                                saveTrigger={saveTrigger}
                            />
                        )}
                        {activeTab === "workspace" && can("MANAGE_BUSINESS_CONFIG") && <WorkspaceSettings />}
                        {activeTab === "profile" && <ProfileSettings />}
                        {activeTab === "verification" && role === 'OWNER' && <VerificationSettings />}
                        {activeTab === "billing" && (role === 'OWNER' || role === 'ACCOUNTANT') && <BillingSettings />}
                        {activeTab === "security" && <SecuritySettings />}
                        {activeTab === "printer" && <PrinterSettings />}
                        {activeTab === "messaging" && role === 'OWNER' && (
                            <WhatsAppSettings
                                onDirtyChange={setIsDirty}
                                onSavingChange={setIsSaving}
                                saveTrigger={saveTrigger}
                            />
                        )}
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* Common Save Bar */}
            {isDirty && (
                <div className="fixed inset-x-0 bottom-0 z-30 border-t border-brand-deep/10 bg-background/92 backdrop-blur-xl dark:border-white/10">
                    <div className="mx-auto flex max-w-6xl justify-end px-4 py-4">
                        <Button
                            onClick={handleGlobalSave}
                            disabled={isSaving}
                            className="h-12 w-full rounded-full bg-brand-deep px-6 font-bold text-brand-gold shadow-xl transition-all hover:bg-brand-deep/90 sm:w-auto sm:min-w-[180px] dark:bg-brand-gold-700 dark:text-white dark:hover:bg-brand-gold-800"
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
                </div>
            )}
        </div>
    )
}

export default function SettingsPage() {
    return (
        <PageTransition>
            <Suspense fallback={<div className="flex items-center justify-center min-h-[400px]"><Loader2 className="w-8 h-8 animate-spin text-brand-gold" /></div>}>
                <PermissionGuard>
                    <SettingsContent />
                </PermissionGuard>
            </Suspense>
        </PageTransition>
    )
}
