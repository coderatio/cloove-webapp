"use client"

import { useState } from "react"
import { GlassCard } from "@/app/components/ui/glass-card"
import { Button } from "@/app/components/ui/button"
import { Switch } from "@/app/components/ui/switch"
import { Input } from "@/app/components/ui/input"
import { AtSign, Globe, Instagram, Phone, Save, Twitter, MessageCircle } from "lucide-react"
import { toast } from "sonner"

export default function StorefrontSettings() {
    return (
        <div className="space-y-8 max-w-5xl mx-auto">
            {/* General Settings */}
            <section className="space-y-4">
                <h2 className="font-serif text-xl text-brand-deep dark:text-brand-cream">General Configuration</h2>
                <GlassCard className="p-6 md:p-8 space-y-6">
                    <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-widest text-brand-accent/40 dark:text-white/40">Store Name</label>
                        <Input
                            defaultValue="Adebayo Textiles"
                            className="text-lg font-medium border-brand-deep/5 dark:border-white/10 dark:bg-white/5 h-12 rounded-xl"
                        />
                        <p className="text-xs text-brand-accent/60 dark:text-white/40">This is the public name displayed on your storefront header.</p>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-widest text-brand-accent/40 dark:text-white/40">Store URL Slug</label>
                        <div className="flex items-center gap-2">
                            <span className="text-brand-deep/60 dark:text-brand-cream/60 font-mono text-sm">clooveai.com/b/</span>
                            <Input
                                defaultValue="adebayo-textiles"
                                className="font-mono text-brand-green dark:text-emerald-400 font-medium border-brand-deep/5 dark:border-white/10 dark:bg-white/5 h-12 rounded-xl flex-1"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-widest text-brand-accent/40 dark:text-white/40">Store Description</label>
                        <textarea
                            className="w-full text-sm p-4 rounded-xl resize-none h-24 bg-white dark:bg-white/5 border border-brand-deep/5 dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-brand-green/20 text-brand-deep dark:text-brand-cream"
                            defaultValue="Premium African fabrics and textiles. Quality materials sourced directly from manufacturers."
                        />
                    </div>
                </GlassCard>
            </section>

            {/* Contact Visibility */}
            <section className="space-y-4">
                <h2 className="font-serif text-xl text-brand-deep dark:text-brand-cream">Contact Information</h2>
                <GlassCard className="p-6 md:p-8 space-y-6">
                    <div className="flex items-center justify-between py-2">
                        <div className="space-y-0.5">
                            <div className="flex items-center gap-2">
                                <Phone className="w-4 h-4 text-brand-deep dark:text-brand-cream" />
                                <span className="font-medium text-brand-deep dark:text-brand-cream">Show Phone Number</span>
                            </div>
                            <p className="text-xs text-brand-accent/60 dark:text-white/40">Allow customers to call you directly.</p>
                        </div>
                        <Switch defaultChecked />
                    </div>
                    <div className="h-px bg-brand-deep/5 dark:bg-white/5" />
                    <div className="flex items-center justify-between py-2">
                        <div className="space-y-0.5">
                            <div className="flex items-center gap-2">
                                <AtSign className="w-4 h-4 text-brand-deep dark:text-brand-cream" />
                                <span className="font-medium text-brand-deep dark:text-brand-cream">Show Email Address</span>
                            </div>
                            <p className="text-xs text-brand-accent/60 dark:text-white/40">Display email for support inquiries.</p>
                        </div>
                        <Switch />
                    </div>
                    <div className="h-px bg-brand-deep/5 dark:bg-white/5" />
                    <div className="flex items-center justify-between py-2">
                        <div className="space-y-0.5">
                            <div className="flex items-center gap-2">
                                <MessageCircle className="w-4 h-4 text-brand-deep dark:text-brand-cream" />
                                <span className="font-medium text-brand-deep dark:text-brand-cream">Enable WhatsApp Chat</span>
                            </div>
                            <p className="text-xs text-brand-accent/60 dark:text-white/40">Add a floating WhatsApp button to your store.</p>
                        </div>
                        <Switch defaultChecked />
                    </div>
                </GlassCard>
            </section>

            {/* Social Media */}
            <section className="space-y-4">
                <h2 className="font-serif text-xl text-brand-deep dark:text-brand-cream">Social Profiles</h2>
                <GlassCard className="p-6 md:p-8 space-y-4">
                    <div className="relative">
                        <Instagram className="absolute left-4 top-3.5 w-5 h-5 text-brand-accent/40" />
                        <Input
                            placeholder="Instagram Username"
                            className="pl-12 border-brand-deep/5 dark:border-white/10 dark:bg-white/5 h-12 rounded-xl"
                        />
                    </div>
                    <div className="relative">
                        <Twitter className="absolute left-4 top-3.5 w-5 h-5 text-brand-accent/40" />
                        <Input
                            placeholder="Twitter Handle"
                            className="pl-12 border-brand-deep/5 dark:border-white/10 dark:bg-white/5 h-12 rounded-xl"
                        />
                    </div>
                    <div className="relative">
                        <Globe className="absolute left-4 top-3.5 w-5 h-5 text-brand-accent/40" />
                        <Input
                            placeholder="Website URL"
                            className="pl-12 border-brand-deep/5 dark:border-white/10 dark:bg-white/5 h-12 rounded-xl"
                        />
                    </div>
                </GlassCard>
            </section>



            <div className="sticky bottom-4 flex justify-end">
                <Button
                    onClick={() => toast.success("Store settings saved successfully")}
                    className="rounded-full bg-brand-deep text-brand-gold dark:bg-brand-gold dark:text-brand-deep dark:hover:bg-brand-gold/90 dark:hover:text-brand-deep font-bold px-8 h-14 shadow-xl hover:scale-105 transition-all"
                >
                    <Save className="w-4 h-4 mr-2" />
                    Save Configuration
                </Button>
            </div>
        </div>
    )
}
