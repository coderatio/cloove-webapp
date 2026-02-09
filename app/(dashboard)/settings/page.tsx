"use client"

import { useState } from "react"
import { ManagementHeader } from "@/app/components/shared/ManagementHeader"
import { GlassCard } from "@/app/components/ui/glass-card"
import { Button } from "@/app/components/ui/button"
import { Input } from "@/app/components/ui/input"
import { Switch } from "@/app/components/ui/switch"
import {
    User,
    Building2,
    ShieldCheck,
    Settings,
    Bell,
    Smartphone,
    Globe,
    Mail,
    Phone,
    Lock,
    Save,
    ExternalLink,
    CreditCard
} from "lucide-react"
import { cn } from "@/app/lib/utils"
import { motion, AnimatePresence } from "framer-motion"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"
import { BillingSettings } from "./components/BillingSettings"
import {
    Drawer,
    DrawerContent,
    DrawerStickyHeader,
    DrawerTitle,
    DrawerDescription,
} from "@/app/components/ui/drawer"

import { PageTransition } from "@/app/components/layout/page-transition"

type Tab = "business" | "profile" | "billing" | "security"

export default function SettingsPage() {
    const [activeTab, setActiveTab] = useState<Tab>("business")
    const [isSaving, setIsSaving] = useState(false)

    const tabs: { id: Tab; label: string; icon: any }[] = [
        { id: "business", label: "Business", icon: Building2 },
        { id: "profile", label: "My Profile", icon: User },
        { id: "billing", label: "Billing", icon: CreditCard },
        { id: "security", label: "Security", icon: ShieldCheck },
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
                        {activeTab === "billing" && <BillingSettings />}
                        {activeTab === "security" && <SecuritySettings />}
                    </motion.div>
                </AnimatePresence>

                {/* Common Save Bar */}
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
            </div>
        </PageTransition>
    )
}

function BusinessSettings() {
    const [settings, setSettings] = useState({
        lowStockAlerts: true,
        defaultThreshold: "5",
        creditSales: true,
        debtReminders: true,
        emailSummaries: true
    })

    const handleToggle = (key: keyof typeof settings) => {
        setSettings(prev => {
            const newState = { ...prev, [key]: !prev[key] }
            toast.success(`${key === 'lowStockAlerts' ? 'Inventory alerts' :
                key === 'creditSales' ? 'Credit sales' :
                    key === 'debtReminders' ? 'Debt reminders' : 'Settings'} updated`)
            return newState
        })
    }

    const handleThresholdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSettings({ ...settings, defaultThreshold: e.target.value })
    }

    return (
        <div className="space-y-8">
            <section className="space-y-4">
                <h2 className="font-serif text-xl text-brand-deep dark:text-brand-cream pl-1">Inventory Management</h2>
                <GlassCard className="p-6 space-y-6">
                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <span className="font-medium text-brand-deep dark:text-brand-cream">Low Stock Alerts</span>
                            <p className="text-xs text-brand-accent/60 dark:text-white/40">Notify me when products are running low.</p>
                        </div>
                        <Switch
                            checked={settings.lowStockAlerts}
                            onCheckedChange={() => handleToggle('lowStockAlerts')}
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-brand-accent/40 dark:text-white/40">Default Threshold</label>
                        <Input
                            type="number"
                            value={settings.defaultThreshold}
                            onChange={handleThresholdChange}
                            className="h-10 rounded-xl bg-white/50 dark:bg-white/5 border-brand-deep/10 dark:border-white/10"
                        />
                    </div>
                </GlassCard>
            </section>

            <section className="space-y-4">
                <h2 className="font-serif text-xl text-brand-deep dark:text-brand-cream pl-1">Sales & Credit</h2>
                <GlassCard className="p-6 space-y-6">
                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <span className="font-medium text-brand-deep dark:text-brand-cream">Allow Credit Sales</span>
                            <p className="text-xs text-brand-accent/60 dark:text-white/40">Enable "Buy Now Pay Later" for customers.</p>
                        </div>
                        <Switch
                            checked={settings.creditSales}
                            onCheckedChange={() => handleToggle('creditSales')}
                        />
                    </div>
                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <span className="font-medium text-brand-deep dark:text-brand-cream">Automated Debt Reminders</span>
                            <p className="text-xs text-brand-accent/60 dark:text-white/40">Send WhatsApp reminders for overdue payments.</p>
                        </div>
                        <Switch
                            checked={settings.debtReminders}
                            onCheckedChange={() => handleToggle('debtReminders')}
                        />
                    </div>
                </GlassCard>
            </section>

            <section className="space-y-4">
                <h2 className="font-serif text-xl text-brand-deep dark:text-brand-cream pl-1">Localization</h2>
                <GlassCard className="p-6 space-y-6">
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-brand-accent/40 dark:text-white/40">Business Currency</label>
                        <div className="flex items-center justify-between p-3 bg-white dark:bg-white/5 rounded-xl border border-brand-deep/5 dark:border-white/10 max-w-md">
                            <span className="font-medium text-brand-deep dark:text-brand-cream">Nigerian Naira (NGN)</span>
                            <Globe className="w-4 h-4 text-brand-deep/30 dark:text-brand-cream/30" />
                        </div>
                        <p className="text-[10px] text-brand-accent/40 dark:text-brand-cream/40 mt-2">Currency is based on your registration country and cannot be changed here.</p>
                    </div>
                </GlassCard>
            </section>
        </div>
    )
}

function ProfileSettings() {
    const [isEditing, setIsEditing] = useState(false)
    const [isLoading, setIsLoading] = useState(false)

    // Form state
    const [formData, setFormData] = useState({
        fullName: "Josiah AO",
        email: "josiah@example.com",
        phone: "+234 813 160 0400"
    })

    const handleSave = () => {
        setIsLoading(true)
        // Simulate API call
        setTimeout(() => {
            setIsLoading(false)
            setIsEditing(false)
            toast.success("Profile updated successfully")
        }, 1500)
    }

    return (
        <div className="space-y-8">
            <section className="space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="font-serif text-xl text-brand-deep dark:text-brand-cream pl-1">Account Details</h2>
                    <Button
                        onClick={() => setIsEditing(true)}
                        variant="outline"
                        className="rounded-xl px-4 text-xs font-bold border-brand-deep/5 hover:bg-brand-deep/5 dark:border-white/10 dark:hover:bg-white/5"
                    >
                        Edit Profile
                    </Button>
                </div>

                <GlassCard className="p-6 space-y-6">
                    <div className="grid md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-brand-accent/40 dark:text-white/40">Full Name</label>
                            <Input value={formData.fullName} readOnly className="h-10 rounded-xl bg-brand-deep/5 dark:bg-white/5 border-transparent" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-brand-accent/40 dark:text-white/40">Email Address</label>
                            <div className="flex items-center gap-2">
                                <Input value={formData.email} disabled className="h-10 rounded-xl bg-brand-deep/5 dark:bg-white/5 border-transparent opacity-60" />
                                <Lock className="w-4 h-4 text-brand-deep/30 dark:text-white/30" />
                            </div>
                        </div>
                    </div>
                </GlassCard>
            </section>

            <section className="space-y-4">
                <h2 className="font-serif text-xl text-brand-deep dark:text-brand-cream pl-1">Communication</h2>
                <GlassCard className="p-6 space-y-6">
                    <div className="grid md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-brand-accent/40 dark:text-white/40">WhatsApp Number</label>
                            <div className="relative">
                                <Smartphone className="absolute left-3 top-3 w-4 h-4 text-brand-accent/40" />
                                <Input value={formData.phone} readOnly className="pl-10 h-10 rounded-xl bg-brand-deep/5 dark:bg-white/5 border-transparent" />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-brand-accent/40 dark:text-white/40">System Notifications</label>
                            <div className="flex items-center justify-between h-10 px-1">
                                <div className="flex items-center gap-2">
                                    <Mail className="w-4 h-4 text-brand-deep/40 dark:text-brand-cream/60" />
                                    <span className="text-sm dark:text-brand-cream">Email Summaries</span>
                                </div>
                                <Switch defaultChecked />
                            </div>
                        </div>
                    </div>
                </GlassCard>
            </section>

            <Drawer open={isEditing} onOpenChange={setIsEditing}>
                <DrawerContent>
                    <DrawerStickyHeader>
                        <DrawerTitle>Edit Profile</DrawerTitle>
                        <DrawerDescription>Update your personal information.</DrawerDescription>
                    </DrawerStickyHeader>

                    <div className="p-6 space-y-6 pb-40">
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase tracking-widest text-brand-accent/60 dark:text-white/60">Full Name</label>
                                <Input
                                    value={formData.fullName}
                                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                                    className="h-14 rounded-2xl text-lg bg-transparent border-brand-deep/10 dark:border-white/10 dark:text-brand-cream"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase tracking-widest text-brand-accent/60 dark:text-white/60">Phone Number</label>
                                <div className="relative">
                                    <Smartphone className="absolute left-4 top-4.5 w-5 h-5 text-brand-accent/40" />
                                    <Input
                                        value={formData.phone}
                                        readOnly
                                        className="pl-12 h-14 rounded-2xl text-lg bg-brand-deep/5 dark:bg-white/5 border-transparent opacity-60 cursor-not-allowed dark:text-brand-cream"
                                    />
                                    <Lock className="absolute right-4 top-4.5 w-5 h-5 text-brand-deep/30 dark:text-white/30" />
                                </div>
                            </div>

                            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-sm flex gap-3">
                                <Lock className="w-5 h-5 shrink-0" />
                                <p>To update your email or phone number, please contact support for security verification.</p>
                            </div>
                        </div>
                    </div>

                    <div className="p-6 border-t border-brand-deep/5 dark:border-white/5 bg-brand-cream dark:bg-[#021a12]">
                        <Button
                            onClick={handleSave}
                            disabled={isLoading}
                            className="w-full h-14 rounded-2xl bg-brand-deep text-brand-gold dark:bg-brand-gold dark:text-brand-deep font-bold text-lg shadow-xl hover:scale-[1.02] active:scale-95 transition-all"
                        >
                            {isLoading ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <>
                                    <Save className="w-5 h-5 mr-2" />
                                    Save Changes
                                </>
                            )}
                        </Button>
                    </div>
                </DrawerContent>
            </Drawer>
        </div>
    )
}

function SecuritySettings() {
    const [isChangingPin, setIsChangingPin] = useState(false)
    const [isChangingPassword, setIsChangingPassword] = useState(false)
    const [isLoading, setIsLoading] = useState(false)

    // PIN State
    const [pinData, setPinData] = useState({ current: "", new: "", confirm: "" })
    // Password State
    const [passData, setPassData] = useState({ current: "", new: "", confirm: "" })

    const handlePinSave = () => {
        if (pinData.new !== pinData.confirm) {
            toast.error("New PINs do not match")
            return
        }
        if (pinData.new.length !== 4) {
            toast.error("PIN must be 4 digits")
            return
        }
        setIsLoading(true)
        setTimeout(() => {
            setIsLoading(false)
            setIsChangingPin(false)
            setPinData({ current: "", new: "", confirm: "" })
            toast.success("Transaction PIN updated successfully")
        }, 1500)
    }

    const handlePassSave = () => {
        if (passData.new !== passData.confirm) {
            toast.error("New passwords do not match")
            return
        }
        if (passData.new.length < 8) {
            toast.error("Password must be at least 8 characters")
            return
        }
        setIsLoading(true)
        setTimeout(() => {
            setIsLoading(false)
            setIsChangingPassword(false)
            setPassData({ current: "", new: "", confirm: "" })
            toast.success("Password updated successfully")
        }, 1500)
    }

    return (
        <div className="space-y-8">
            <section className="space-y-4">
                <h2 className="font-serif text-xl text-brand-deep dark:text-brand-cream pl-1">Access Control</h2>
                <GlassCard className="p-6 space-y-6">
                    <div className="flex items-center justify-between">
                        <div className="space-y-1">
                            <div className="flex items-center gap-2">
                                <Lock className="w-4 h-4 text-brand-deep dark:text-brand-cream" />
                                <span className="font-medium text-brand-deep dark:text-brand-cream">Transaction PIN</span>
                                <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 text-[10px] font-bold uppercase">Active</span>
                            </div>
                            <p className="text-xs text-brand-accent/60 dark:text-white/40">Required for withdrawals and sensitive actions.</p>
                        </div>
                        <Button
                            onClick={() => setIsChangingPin(true)}
                            variant="outline"
                            className="rounded-xl px-4 text-xs font-bold border-brand-deep/5 hover:bg-brand-deep/5 dark:border-white/10 dark:hover:bg-white/5"
                        >
                            Change PIN
                        </Button>
                    </div>
                    <div className="h-px bg-brand-deep/5 dark:bg-white/5" />
                    <div className="flex items-center justify-between">
                        <div className="space-y-1">
                            <span className="font-medium text-brand-deep dark:text-brand-cream">Password</span>
                            <p className="text-xs text-brand-accent/60 dark:text-white/40">Last changed 3 months ago.</p>
                        </div>
                        <Button
                            onClick={() => setIsChangingPassword(true)}
                            variant="outline"
                            className="rounded-xl px-4 text-xs font-bold border-brand-deep/5 hover:bg-brand-deep/5 dark:border-white/10 dark:hover:bg-white/5"
                        >
                            Update Password
                        </Button>
                    </div>
                </GlassCard>
            </section>

            <section className="space-y-4">
                <h2 className="font-serif text-xl text-brand-deep dark:text-brand-cream pl-1">Audit & Devices</h2>
                <GlassCard className="p-6 space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                        <div className="flex items-center justify-between text-sm p-4 bg-white/50 dark:bg-white/5 rounded-xl border border-brand-deep/5 dark:border-white/5">
                            <span className="text-brand-deep/60 dark:text-brand-cream/60">Current Session</span>
                            <span className="font-medium text-brand-deep dark:text-brand-cream">Lagos, Nigeria</span>
                        </div>
                        <div className="flex items-center justify-between text-sm p-4 bg-white/50 dark:bg-white/5 rounded-xl border border-brand-deep/5 dark:border-white/5">
                            <span className="text-brand-deep/60 dark:text-brand-cream/60">Browser</span>
                            <span className="font-medium text-brand-deep dark:text-brand-cream">Chrome on MacOS</span>
                        </div>
                    </div>
                    <Button variant="ghost" className="w-full text-brand-deep dark:text-brand-gold text-xs font-bold mt-2">
                        View All Activity <ExternalLink className="w-3 h-3 ml-2" />
                    </Button>
                </GlassCard>
            </section>

            {/* PIN Change Drawer */}
            <Drawer open={isChangingPin} onOpenChange={setIsChangingPin}>
                <DrawerContent>
                    <DrawerStickyHeader>
                        <DrawerTitle>Change PIN</DrawerTitle>
                        <DrawerDescription>Update your 4-digit transaction PIN.</DrawerDescription>
                    </DrawerStickyHeader>
                    <div className="p-6 space-y-6 pb-40">
                        <div className="space-y-4 w-full">
                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase tracking-widest text-brand-accent/60 dark:text-white/60">Current PIN</label>
                                <Input
                                    type="password"
                                    maxLength={4}
                                    className="h-14 rounded-2xl text-center text-2xl tracking-[1em] font-mono bg-transparent border-brand-deep/10 dark:border-white/10 dark:text-brand-cream"
                                    value={pinData.current}
                                    onChange={(e) => setPinData({ ...pinData, current: e.target.value })}
                                />
                            </div>
                            <div className="h-px bg-brand-deep/5 dark:bg-white/5 my-4" />
                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase tracking-widest text-brand-accent/60 dark:text-white/60">New PIN</label>
                                <Input
                                    type="password"
                                    maxLength={4}
                                    className="h-14 rounded-2xl text-center text-2xl tracking-[1em] font-mono bg-transparent border-brand-deep/10 dark:border-white/10 dark:text-brand-cream"
                                    value={pinData.new}
                                    onChange={(e) => setPinData({ ...pinData, new: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase tracking-widest text-brand-accent/60 dark:text-white/60">Confirm New PIN</label>
                                <Input
                                    type="password"
                                    maxLength={4}
                                    className="h-14 rounded-2xl text-center text-2xl tracking-[1em] font-mono bg-transparent border-brand-deep/10 dark:border-white/10 dark:text-brand-cream"
                                    value={pinData.confirm}
                                    onChange={(e) => setPinData({ ...pinData, confirm: e.target.value })}
                                />
                            </div>
                        </div>
                    </div>
                    <div className="p-6 border-t border-brand-deep/5 dark:border-white/5 bg-brand-cream dark:bg-[#021a12]">
                        <Button
                            onClick={handlePinSave}
                            disabled={isLoading}
                            className="w-full h-14 rounded-2xl bg-brand-deep text-brand-gold dark:bg-brand-gold dark:text-brand-deep font-bold text-lg shadow-xl hover:scale-[1.02] active:scale-95 transition-all"
                        >
                            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Update PIN"}
                        </Button>
                    </div>
                </DrawerContent>
            </Drawer>

            {/* Password Change Drawer */}
            <Drawer open={isChangingPassword} onOpenChange={setIsChangingPassword}>
                <DrawerContent>
                    <DrawerStickyHeader>
                        <DrawerTitle>Update Password</DrawerTitle>
                        <DrawerDescription>Secure your account with a strong password.</DrawerDescription>
                    </DrawerStickyHeader>
                    <div className="p-6 space-y-6 pb-40">
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase tracking-widest text-brand-accent/60 dark:text-white/60">Current Password</label>
                                <Input
                                    type="password"
                                    className="h-14 rounded-2xl text-lg bg-transparent border-brand-deep/10 dark:border-white/10 dark:text-brand-cream"
                                    value={passData.current}
                                    onChange={(e) => setPassData({ ...passData, current: e.target.value })}
                                />
                            </div>
                            <div className="h-px bg-brand-deep/5 dark:bg-white/5 my-4" />
                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase tracking-widest text-brand-accent/60 dark:text-white/60">New Password</label>
                                <Input
                                    type="password"
                                    className="h-14 rounded-2xl text-lg bg-transparent border-brand-deep/10 dark:border-white/10 dark:text-brand-cream"
                                    value={passData.new}
                                    onChange={(e) => setPassData({ ...passData, new: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase tracking-widest text-brand-accent/60 dark:text-white/60">Confirm New Password</label>
                                <Input
                                    type="password"
                                    className="h-14 rounded-2xl text-lg bg-transparent border-brand-deep/10 dark:border-white/10 dark:text-brand-cream"
                                    value={passData.confirm}
                                    onChange={(e) => setPassData({ ...passData, confirm: e.target.value })}
                                />
                            </div>
                        </div>
                    </div>
                    <div className="p-6 border-t border-brand-deep/5 dark:border-white/5 bg-brand-cream dark:bg-[#021a12]">
                        <Button
                            onClick={handlePassSave}
                            disabled={isLoading}
                            className="w-full h-14 rounded-2xl bg-brand-deep text-brand-gold dark:bg-brand-gold dark:text-brand-deep font-bold text-lg shadow-xl hover:scale-[1.02] active:scale-95 transition-all"
                        >
                            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Update Password"}
                        </Button>
                    </div>
                </DrawerContent>
            </Drawer>
        </div>
    )
}
