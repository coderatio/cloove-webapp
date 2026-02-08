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
    ExternalLink
} from "lucide-react"
import { cn } from "@/app/lib/utils"
import { motion, AnimatePresence } from "framer-motion"

import { PageTransition } from "../components/layout/page-transition"

type Tab = "business" | "profile" | "security"

export default function SettingsPage() {
    const [activeTab, setActiveTab] = useState<Tab>("business")

    const tabs: { id: Tab; label: string; icon: any }[] = [
        { id: "business", label: "Business", icon: Building2 },
        { id: "profile", label: "My Profile", icon: User },
        { id: "security", label: "Security", icon: ShieldCheck },
    ]

    return (
        <PageTransition>
            <div className="max-w-5xl mx-auto space-y-8 pb-20">
                <ManagementHeader
                    title="Settings"
                    description="Manage your business preferences and personal profile"
                />

                {/* Tab Navigation */}
                <div className="flex items-center gap-2 p-1 bg-brand-deep/5 dark:bg-white/5 rounded-2xl w-fit">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={cn(
                                "relative flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
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
                        {activeTab === "security" && <SecuritySettings />}
                    </motion.div>
                </AnimatePresence>

                {/* Common Save Bar */}
                <div className="fixed bottom-8 right-8 z-30">
                    <Button
                        className="rounded-full bg-brand-deep text-brand-gold dark:bg-brand-gold dark:text-brand-deep px-8 h-14 shadow-2xl hover:scale-105 transition-all font-bold"
                    >
                        <Save className="w-4 h-4 mr-2" />
                        Save Changes
                    </Button>
                </div>
            </div>
        </PageTransition>
    )
}

function BusinessSettings() {
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
                        <Switch defaultChecked />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-brand-accent/40 dark:text-white/40">Default Threshold</label>
                        <Input type="number" defaultValue="5" className="h-10 rounded-xl" />
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
                        <Switch defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <span className="font-medium text-brand-deep dark:text-brand-cream">Automated Debt Reminders</span>
                            <p className="text-xs text-brand-accent/60 dark:text-white/40">Send WhatsApp reminders for overdue payments.</p>
                        </div>
                        <Switch defaultChecked />
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
                            <Globe className="w-4 h-4 text-brand-deep/30" />
                        </div>
                        <p className="text-[10px] text-brand-accent/40 mt-2">Currency is based on your registration country and cannot be changed here.</p>
                    </div>
                </GlassCard>
            </section>
        </div>
    )
}

function ProfileSettings() {
    return (
        <div className="space-y-8">
            <section className="space-y-4">
                <h2 className="font-serif text-xl text-brand-deep dark:text-brand-cream pl-1">Account Details</h2>
                <GlassCard className="p-6 space-y-6">
                    <div className="grid md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-brand-accent/40 dark:text-white/40">Full Name</label>
                            <Input defaultValue="Josiah AO" className="h-10 rounded-xl" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-brand-accent/40 dark:text-white/40">Email Address</label>
                            <div className="flex items-center gap-2">
                                <Input defaultValue="josiah@example.com" disabled className="h-10 rounded-xl bg-brand-deep/5" />
                                <Button variant="ghost" className="text-brand-deep dark:text-brand-gold text-xs">Change</Button>
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
                                <Input defaultValue="+234 813 160 0400" className="pl-10 h-10 rounded-xl" />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-brand-accent/40 dark:text-white/40">System Notifications</label>
                            <div className="flex items-center justify-between h-10 px-1">
                                <div className="flex items-center gap-2">
                                    <Mail className="w-4 h-4 text-brand-deep/40" />
                                    <span className="text-sm">Email Summaries</span>
                                </div>
                                <Switch defaultChecked />
                            </div>
                        </div>
                    </div>
                </GlassCard>
            </section>
        </div>
    )
}

function SecuritySettings() {
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
                        <Button variant="outline" className="rounded-xl px-4 text-xs font-bold border-brand-deep/5">Change PIN</Button>
                    </div>
                    <div className="h-px bg-brand-deep/5 dark:bg-white/5" />
                    <div className="flex items-center justify-between">
                        <div className="space-y-1">
                            <span className="font-medium text-brand-deep dark:text-brand-cream">Password</span>
                            <p className="text-xs text-brand-accent/60 dark:text-white/40">Last changed 3 months ago.</p>
                        </div>
                        <Button variant="outline" className="rounded-xl px-4 text-xs font-bold border-brand-deep/5">Update Password</Button>
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
        </div>
    )
}
