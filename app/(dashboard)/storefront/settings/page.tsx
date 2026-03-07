"use client"

import { useState, useEffect } from "react"
import { GlassCard } from "@/app/components/ui/glass-card"
import { Button } from "@/app/components/ui/button"
import { Switch } from "@/app/components/ui/switch"
import { Input } from "@/app/components/ui/input"
import { AtSign, Globe, Instagram, Phone, Save, Twitter, MessageCircle, Search, Megaphone, ImageIcon } from "lucide-react"
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
    const [contactPhoneValue, setContactPhoneValue] = useState('')
    const [contactEmailValue, setContactEmailValue] = useState('')
    const [contactWhatsappValue, setContactWhatsappValue] = useState('')
    const [instagram, setInstagram] = useState('')
    const [twitter, setTwitter] = useState('')
    const [website, setWebsite] = useState('')
    const [metaTitle, setMetaTitle] = useState('')
    const [metaDescription, setMetaDescription] = useState('')
    const [metaImageUrl, setMetaImageUrl] = useState('')
    const [faviconUrl, setFaviconUrl] = useState('')
    const [announcementText, setAnnouncementText] = useState('')
    const [announcementLink, setAnnouncementLink] = useState('')
    const [announcementActive, setAnnouncementActive] = useState(false)

    useEffect(() => {
        if (settings) {
            setBusinessName(settings.businessName ?? '')
            setSlug(settings.slug ?? '')
            setBusinessDescription(settings.businessDescription ?? '')
            setShowPhone(!!settings.contactPhone)
            setShowEmail(!!settings.contactEmail)
            setShowWhatsApp(!!settings.contactWhatsapp)
            setContactPhoneValue(settings.contactPhone ?? '')
            setContactEmailValue(settings.contactEmail ?? '')
            setContactWhatsappValue(settings.contactWhatsapp ?? '')
            setInstagram(settings.socialLinks?.instagram ?? '')
            setTwitter(settings.socialLinks?.twitter ?? '')
            setWebsite(settings.socialLinks?.website ?? '')
            setMetaTitle(settings.metaTitle ?? '')
            setMetaDescription(settings.metaDescription ?? '')
            setMetaImageUrl(settings.metaImageUrl ?? '')
            setFaviconUrl(settings.faviconUrl ?? '')
            const ann = settings.announcement ?? { text: '', link: '', active: false }
            setAnnouncementText(ann.text ?? '')
            setAnnouncementLink(ann.link ?? '')
            setAnnouncementActive(!!ann.active)
        }
    }, [settings])

    const handleSave = () => {
        updateSettings.mutate({
            businessName,
            slug: slug.trim() || undefined,
            businessDescription: businessDescription || null,
            contactPhone: showPhone ? (contactPhoneValue.trim() || null) : null,
            contactEmail: showEmail ? (contactEmailValue.trim() || null) : null,
            contactWhatsapp: showWhatsApp ? (contactWhatsappValue.trim() || null) : null,
            socialLinks: { ...settings?.socialLinks, instagram, twitter, website },
            metaTitle: metaTitle.trim() || null,
            metaDescription: metaDescription.trim() || null,
            metaImageUrl: metaImageUrl.trim() || null,
            faviconUrl: faviconUrl.trim() || null,
            announcement: {
                text: announcementText.trim(),
                link: announcementLink.trim() || undefined,
                active: announcementActive,
            },
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
                    {showPhone && (
                        <div className="pl-6">
                            <Input
                                placeholder="e.g. +234 800 000 0000"
                                value={contactPhoneValue}
                                onChange={(e) => setContactPhoneValue(e.target.value)}
                                className="border-brand-deep/5 dark:border-white/10 dark:bg-white/5 h-11 rounded-xl"
                            />
                        </div>
                    )}
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
                    {showEmail && (
                        <div className="pl-6">
                            <Input
                                type="email"
                                placeholder="support@example.com"
                                value={contactEmailValue}
                                onChange={(e) => setContactEmailValue(e.target.value)}
                                className="border-brand-deep/5 dark:border-white/10 dark:bg-white/5 h-11 rounded-xl"
                            />
                        </div>
                    )}
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
                    {showWhatsApp && (
                        <div className="pl-6">
                            <Input
                                placeholder="e.g. 2348000000000 (with country code, no +)"
                                value={contactWhatsappValue}
                                onChange={(e) => setContactWhatsappValue(e.target.value)}
                                className="border-brand-deep/5 dark:border-white/10 dark:bg-white/5 h-11 rounded-xl"
                            />
                        </div>
                    )}
                </GlassCard>
            </section>

            {/* SEO & Favicon */}
            <section className="space-y-4">
                <h2 className="font-serif text-xl text-brand-deep dark:text-brand-cream">SEO & Sharing</h2>
                <GlassCard className="p-6 md:p-8 space-y-6">
                    <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-widest text-brand-accent/40 dark:text-white/40 flex items-center gap-2">
                            <Search className="w-3.5 h-3.5" /> Meta Title
                        </label>
                        <Input
                            value={metaTitle}
                            onChange={(e) => setMetaTitle(e.target.value)}
                            placeholder="Store name or tagline for search results"
                            className="border-brand-deep/5 dark:border-white/10 dark:bg-white/5 h-11 rounded-xl"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-widest text-brand-accent/40 dark:text-white/40">Meta Description</label>
                        <textarea
                            className="w-full text-sm p-4 rounded-xl resize-none h-20 bg-white dark:bg-white/5 border border-brand-deep/5 dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-brand-green/20 text-brand-deep dark:text-brand-cream"
                            value={metaDescription}
                            onChange={(e) => setMetaDescription(e.target.value)}
                            placeholder="Short description for search and social sharing"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-widest text-brand-accent/40 dark:text-white/40 flex items-center gap-2">
                            <ImageIcon className="w-3.5 h-3.5" /> Meta Image URL
                        </label>
                        <Input
                            value={metaImageUrl}
                            onChange={(e) => setMetaImageUrl(e.target.value)}
                            placeholder="https://... (image for social shares)"
                            className="border-brand-deep/5 dark:border-white/10 dark:bg-white/5 h-11 rounded-xl"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-widest text-brand-accent/40 dark:text-white/40">Favicon URL</label>
                        <Input
                            value={faviconUrl}
                            onChange={(e) => setFaviconUrl(e.target.value)}
                            placeholder="https://... (or leave blank to use logo)"
                            className="border-brand-deep/5 dark:border-white/10 dark:bg-white/5 h-11 rounded-xl"
                        />
                    </div>
                </GlassCard>
            </section>

            {/* Announcement Bar */}
            <section className="space-y-4">
                <h2 className="font-serif text-xl text-brand-deep dark:text-brand-cream">Announcement Bar</h2>
                <GlassCard className="p-6 md:p-8 space-y-6">
                    <div className="flex items-center justify-between py-2">
                        <div className="space-y-0.5">
                            <div className="flex items-center gap-2">
                                <Megaphone className="w-4 h-4 text-brand-deep dark:text-brand-cream" />
                                <span className="font-medium text-brand-deep dark:text-brand-cream">Show announcement bar</span>
                            </div>
                            <p className="text-xs text-brand-accent/60 dark:text-white/40">Display a message at the top of your storefront.</p>
                        </div>
                        <Switch checked={announcementActive} onCheckedChange={setAnnouncementActive} />
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-widest text-brand-accent/40 dark:text-white/40">Message</label>
                        <Input
                            value={announcementText}
                            onChange={(e) => setAnnouncementText(e.target.value)}
                            placeholder="e.g. Free delivery on orders over ₦10,000"
                            className="border-brand-deep/5 dark:border-white/10 dark:bg-white/5 h-11 rounded-xl"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-widest text-brand-accent/40 dark:text-white/40">Link (optional)</label>
                        <Input
                            value={announcementLink}
                            onChange={(e) => setAnnouncementLink(e.target.value)}
                            placeholder="https://... (clicking the bar goes here)"
                            className="border-brand-deep/5 dark:border-white/10 dark:bg-white/5 h-11 rounded-xl"
                        />
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
