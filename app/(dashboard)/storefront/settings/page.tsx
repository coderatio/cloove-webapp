"use client"

import { useState, useEffect } from "react"
import { GlassCard } from "@/app/components/ui/glass-card"
import { Button } from "@/app/components/ui/button"
import { Switch } from "@/app/components/ui/switch"
import { Input } from "@/app/components/ui/input"
import { AtSign, Globe, Instagram, Phone, Save, Twitter, MessageCircle } from "lucide-react"
import { useStorefrontSettings, useUpdateStorefrontSettings } from "@/app/domains/storefront/hooks/useStorefrontSettings"

export default function StorefrontSettings() {
    const { data: settings, isLoading, error } = useStorefrontSettings()
    const updateSettings = useUpdateStorefrontSettings()
    const [businessName, setBusinessName] = useState('')
    const [slug, setSlug] = useState('')
    const [businessDescription, setBusinessDescription] = useState('')
    const [showPhone, setShowPhone] = useState(true)
    const [showEmail, setShowEmail] = useState(false)
    const [showWhatsApp, setShowWhatsApp] = useState(true)
    const [instagram, setInstagram] = useState('')
    const [twitter, setTwitter] = useState('')
    const [website, setWebsite] = useState('')

    useEffect(() => {
        if (settings) {
            setBusinessName(settings.businessName ?? '')
            setSlug(settings.slug ?? '')
            setBusinessDescription(settings.businessDescription ?? '')
            setShowPhone(!!settings.contactPhone)
            setShowEmail(!!settings.contactEmail)
            setShowWhatsApp(!!settings.contactWhatsapp)
            setInstagram(settings.socialLinks?.instagram ?? '')
            setTwitter(settings.socialLinks?.twitter ?? '')
            setWebsite(settings.socialLinks?.website ?? '')
        }
    }, [settings])

    const handleSave = () => {
        updateSettings.mutate({
            businessName,
            slug: slug.trim() || undefined,
            businessDescription: businessDescription || null,
            contactPhone: showPhone ? (settings?.contactPhone ?? null) : null,
            contactEmail: showEmail ? (settings?.contactEmail ?? null) : null,
            contactWhatsapp: showWhatsApp ? (settings?.contactWhatsapp ?? null) : null,
            socialLinks: { ...settings?.socialLinks, instagram, twitter, website },
        })
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[200px]">
                <div className="w-8 h-8 border-2 border-brand-gold border-t-transparent rounded-full animate-spin" />
            </div>
        )
    }

    if (error || !settings) {
        return (
            <div className="rounded-2xl border border-brand-deep/10 dark:border-white/10 bg-brand-cream/50 dark:bg-black/20 p-8 text-center">
                <p className="text-brand-deep/70 dark:text-brand-cream/70">
                    {(error as Error)?.message ?? 'Failed to load settings.'}
                </p>
            </div>
        )
    }

    return (
        <div className="space-y-8 max-w-5xl mx-auto">
            {/* General Settings */}
            <section className="space-y-4">
                <h2 className="font-serif text-xl text-brand-deep dark:text-brand-cream">General Configuration</h2>
                <GlassCard className="p-6 md:p-8 space-y-6">
                    <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-widest text-brand-accent/40 dark:text-white/40">Store Name</label>
                        <Input
                            value={businessName}
                            onChange={(e) => setBusinessName(e.target.value)}
                            className="text-lg font-medium border-brand-deep/5 dark:border-white/10 dark:bg-white/5 h-12 rounded-xl"
                        />
                        <p className="text-xs text-brand-accent/60 dark:text-white/40">This is the public name displayed on your storefront header.</p>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-widest text-brand-accent/40 dark:text-white/40">Store URL Slug</label>
                        <div className="flex items-center gap-2">
                            <span className="text-brand-deep/60 dark:text-brand-cream/60 font-mono text-sm">/b/</span>
                            <Input
                                value={slug}
                                onChange={(e) => setSlug(e.target.value)}
                                className="font-mono text-brand-green dark:text-emerald-400 font-medium border-brand-deep/5 dark:border-white/10 dark:bg-white/5 h-12 rounded-xl flex-1"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-widest text-brand-accent/40 dark:text-white/40">Store Description</label>
                        <textarea
                            className="w-full text-sm p-4 rounded-xl resize-none h-24 bg-white dark:bg-white/5 border border-brand-deep/5 dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-brand-green/20 text-brand-deep dark:text-brand-cream"
                            value={businessDescription}
                            onChange={(e) => setBusinessDescription(e.target.value)}
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
                        <Switch checked={showPhone} onCheckedChange={setShowPhone} />
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
                        <Switch checked={showEmail} onCheckedChange={setShowEmail} />
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
                        <Switch checked={showWhatsApp} onCheckedChange={setShowWhatsApp} />
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
                            value={instagram}
                            onChange={(e) => setInstagram(e.target.value)}
                            className="pl-12 border-brand-deep/5 dark:border-white/10 dark:bg-white/5 h-12 rounded-xl"
                        />
                    </div>
                    <div className="relative">
                        <Twitter className="absolute left-4 top-3.5 w-5 h-5 text-brand-accent/40" />
                        <Input
                            placeholder="Twitter Handle"
                            value={twitter}
                            onChange={(e) => setTwitter(e.target.value)}
                            className="pl-12 border-brand-deep/5 dark:border-white/10 dark:bg-white/5 h-12 rounded-xl"
                        />
                    </div>
                    <div className="relative">
                        <Globe className="absolute left-4 top-3.5 w-5 h-5 text-brand-accent/40" />
                        <Input
                            placeholder="Website URL"
                            value={website}
                            onChange={(e) => setWebsite(e.target.value)}
                            className="pl-12 border-brand-deep/5 dark:border-white/10 dark:bg-white/5 h-12 rounded-xl"
                        />
                    </div>
                </GlassCard>
            </section>



            <div className="sticky bottom-4 flex justify-end">
                <Button
                    onClick={handleSave}
                    disabled={updateSettings.isPending}
                    className="rounded-full bg-brand-deep text-brand-gold dark:bg-brand-gold dark:text-brand-deep dark:hover:bg-brand-gold/90 dark:hover:text-brand-deep font-bold px-8 h-14 shadow-xl hover:scale-105 transition-all"
                >
                    <Save className="w-4 h-4 mr-2" />
                    {updateSettings.isPending ? 'Saving...' : 'Save Configuration'}
                </Button>
            </div>
        </div>
    )
}
