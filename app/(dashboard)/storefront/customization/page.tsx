"use client"

import { useState, useEffect } from "react"
import { GlassCard } from "@/app/components/ui/glass-card"
import { Button } from "@/app/components/ui/button"
import { Input } from "@/app/components/ui/input"
import { Switch } from "@/app/components/ui/switch"
import { Check, Palette, Smartphone, RefreshCw, Upload, Type, Layout, Sun, Moon } from "lucide-react"
import { cn } from "@/app/lib/utils"
import { useStorefrontTheme, useUpdateStorefrontTheme, type StorefrontThemeData } from "@/app/domains/storefront/hooks/useStorefrontTheme"
import { uploadService } from "@/app/lib/upload/upload-service"
import { ColorPicker } from "@/app/components/ui/color-picker"
import {
    getDefaultTheme,
    STOREFRONT_LAYOUT_IDS,
    THEME_MODES,
    GOOGLE_FONTS_ALLOWED,
    HEADER_STYLES,
    PRODUCT_CARD_RADIUS,
    SHADOW_OPTIONS,
    CTA_SHAPES,
    CTA_STYLES,
} from "@/app/domains/storefront/lib/theme-defaults"
import { toast } from "sonner"
import { SearchableSelect } from "@/app/components/ui/searchable-select"
import { Textarea } from "@/app/components/ui/textarea"

const themeColors = [
    { name: 'Forest', hex: '#062C21', bg: 'bg-[#062C21]' },
    { name: 'Midnight', hex: '#0F172A', bg: 'bg-[#0F172A]' },
    { name: 'Berry', hex: '#4A044E', bg: 'bg-[#4A044E]' },
    { name: 'Ocean', hex: '#1E3A8A', bg: 'bg-[#1E3A8A]' },
    { name: 'Chocolate', hex: '#431407', bg: 'bg-[#431407]' },
    { name: 'Charcoal', hex: '#18181B', bg: 'bg-[#18181B]' },
]

const HEX_REGEX = /^#[0-9A-Fa-f]{6}$/
function ensureHex(s: string | undefined, fallback: string): string {
    if (s && HEX_REGEX.test(s)) return s
    return fallback
}

export default function StorefrontCustomization() {
    const { data: theme, isLoading } = useStorefrontTheme()
    const updateTheme = useUpdateStorefrontTheme()
    const defaultTheme = getDefaultTheme()
    const base = theme ?? defaultTheme
    const colors = base.colors ?? defaultTheme.colors
    const colorsDark = base.colorsDark ?? defaultTheme.colorsDark
    const fonts = base.fonts ?? defaultTheme.fonts
    const components = base.components as Record<string, Record<string, unknown>> | undefined
    const header = components?.header ?? defaultTheme.components.header
    const productCard = components?.productCard ?? defaultTheme.components.productCard
    const ctaButton = components?.ctaButton ?? defaultTheme.components.ctaButton

    const [logo, setLogo] = useState<string | null>(null)
    const [logoUploading, setLogoUploading] = useState(false)
    const [layout, setLayout] = useState(base.layout ?? 'classic')
    const [themeMode, setThemeMode] = useState(base.themeMode ?? 'auto')
    const [primaryHex, setPrimaryHex] = useState(colors.primary ?? '#062c21')
    const [colorsForm, setColorsForm] = useState(colors)
    const [colorsDarkForm, setColorsDarkForm] = useState(colorsDark)
    const [showDarkColors, setShowDarkColors] = useState(!!base.colorsDark)
    const [fontsForm, setFontsForm] = useState(fonts)
    const [headerForm, setHeaderForm] = useState(header)
    const [productCardForm, setProductCardForm] = useState(productCard)
    const [ctaButtonForm, setCtaButtonForm] = useState(ctaButton)
    const [welcomeMessage, setWelcomeMessage] = useState((base.welcomeMessage as string) ?? '')
    const trimmedWelcomeMessage = welcomeMessage.trim()
    const marqueeDuration = `${Math.max(16, Math.min(32, trimmedWelcomeMessage.length * 0.32))}s`

    useEffect(() => {
        if (!theme) return
        setLayout((theme.layout as string) ?? 'classic')
        setThemeMode((theme.themeMode as string) ?? 'auto')
        setPrimaryHex(theme.colors?.primary ?? '#062c21')
        setColorsForm(theme.colors ?? defaultTheme.colors)
        setColorsDarkForm(theme.colorsDark ?? defaultTheme.colorsDark)
        setShowDarkColors(!!theme.colorsDark)
        setFontsForm(theme.fonts ?? defaultTheme.fonts)
        setHeaderForm((theme.components as any)?.header ?? defaultTheme.components.header)
        setProductCardForm((theme.components as any)?.productCard ?? defaultTheme.components.productCard)
        setCtaButtonForm((theme.components as any)?.ctaButton ?? defaultTheme.components.ctaButton)
        setWelcomeMessage((theme.welcomeMessage as string) ?? '')
    }, [theme])
    useEffect(() => {
        if (theme?.logoUrl) setLogo(theme.logoUrl as string)
    }, [theme?.logoUrl])

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[200px]">
                <div className="w-8 h-8 border-2 border-brand-gold border-t-transparent rounded-full animate-spin" />
            </div>
        )
    }

    return (
        <div className="flex flex-col lg:flex-row gap-8">
            {/* Editor Panel */}
            <div className="flex-1 space-y-8 pb-24">
                {/* Brand Identity */}
                <section className="space-y-4">
                    <div className="flex items-center gap-2">
                        <div className="p-2 rounded-lg bg-brand-green/10 text-brand-green dark:bg-emerald-400/10 dark:text-emerald-400">
                            <Palette className="w-5 h-5" />
                        </div>
                        <h2 className="font-serif text-xl text-brand-deep dark:text-brand-cream">Brand Identity</h2>
                    </div>

                    <GlassCard className="p-6 space-y-6">
                        <div className="space-y-3">
                            <label className="text-xs font-bold uppercase tracking-widest text-brand-accent/40 dark:text-white/40">Brand Logo</label>
                            <div className="flex flex-col sm:flex-row items-start gap-6">
                                <div className="h-24 w-24 rounded-2xl border-2 border-dashed border-brand-accent/20 dark:border-white/20 flex items-center justify-center bg-brand-accent/5 dark:bg-white/5 relative overflow-hidden group shrink-0">
                                    {logo ? (
                                        <img src={logo} alt="Logo" className="w-full h-full object-cover" />
                                    ) : logoUploading ? (
                                        <span className="text-xs text-brand-accent/60 dark:text-brand-cream/60 font-medium">Uploading…</span>
                                    ) : (
                                        <span className="text-xs text-brand-accent/40 dark:text-white/40 font-medium">Logo</span>
                                    )}
                                    {logo && !logoUploading && (
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity text-white text-xs font-bold rounded-none h-full"
                                            onClick={() => setLogo(null)}
                                        >
                                            Remove
                                        </Button>
                                    )}
                                </div>
                                <div className="space-y-2 flex-1 min-w-0">
                                    <p className="text-sm text-brand-deep/80 dark:text-brand-cream/80 max-w-xs">
                                        Upload an image or paste a logo URL. Recommended: 512×512px (PNG or JPG).
                                    </p>
                                    <div className="flex flex-wrap gap-2">
                                        <input
                                            type="file"
                                            accept="image/png,image/jpeg,image/webp,image/gif"
                                            className="hidden"
                                            id="storefront-logo-upload"
                                            onChange={async (e) => {
                                                const file = e.target.files?.[0]
                                                if (!file) return
                                                if (!file.type.startsWith('image/')) {
                                                    toast.error('Please choose an image file (PNG, JPG, WEBP, GIF)')
                                                    return
                                                }
                                                if (file.size > 5 * 1024 * 1024) {
                                                    toast.error('Image must be under 5MB')
                                                    return
                                                }
                                                setLogoUploading(true)
                                                try {
                                                    const url = await uploadService.uploadFile(file)
                                                    setLogo(url)
                                                    toast.success('Logo uploaded')
                                                } catch (err) {
                                                    toast.error('Upload failed. Try a URL instead.')
                                                } finally {
                                                    setLogoUploading(false)
                                                    e.target.value = ''
                                                }
                                            }}
                                        />
                                        <label
                                            htmlFor={logoUploading ? undefined : 'storefront-logo-upload'}
                                            className={cn(
                                                "inline-flex items-center gap-2 rounded-xl h-10 px-4 text-sm font-medium border border-brand-deep/10 dark:border-white/10 bg-white dark:bg-white/5 hover:bg-brand-deep/5 dark:hover:bg-white/10 transition-colors text-brand-deep dark:text-brand-cream",
                                                logoUploading ? "cursor-not-allowed opacity-50" : "cursor-pointer"
                                            )}
                                        >
                                            <Upload className="w-4 h-4" />
                                            {logoUploading ? 'Uploading…' : 'Choose File'}
                                        </label>
                                        <span className="text-brand-deep/40 dark:text-brand-cream/40 text-sm self-center">or</span>
                                        <Input
                                            type="url"
                                            placeholder="Paste image URL"
                                            value={logo ?? ''}
                                            onChange={(e) => setLogo(e.target.value.trim() || null)}
                                            disabled={logoUploading}
                                            className="flex-1 min-w-[180px]"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-3 pt-4 border-t border-brand-deep/5 dark:border-white/5">
                            <label className="text-xs font-bold uppercase tracking-widest text-brand-accent/40 dark:text-white/40">Primary (presets)</label>
                            <div className="flex flex-wrap gap-3">
                                {themeColors.map((color) => (
                                    <Button
                                        key={color.name}
                                        variant="ghost"
                                        size="icon"
                                        className={cn(
                                            "w-12 h-12 rounded-full relative transition-all hover:scale-110 hover:!bg-[var(--swatch)]",
                                            color.bg,
                                            primaryHex?.toLowerCase() === color.hex.toLowerCase() && "ring-4 ring-brand-green/20 dark:ring-white/20 scale-110"
                                        )}
                                        style={{
                                            ['--swatch' as string]: color.hex,
                                        } as React.CSSProperties}
                                        title={color.name}
                                        onClick={() => {
                                            setPrimaryHex(color.hex)
                                            setColorsForm((c) => ({ ...c, primary: color.hex }))
                                        }}
                                    >
                                        {primaryHex?.toLowerCase() === color.hex.toLowerCase() && (
                                            <div className="absolute inset-0 flex items-center justify-center">
                                                <Check className="w-5 h-5 text-white stroke-[3px]" />
                                            </div>
                                        )}
                                    </Button>
                                ))}
                            </div>
                            <p className="text-xs text-brand-accent/60 dark:text-brand-cream/60">Primary is used for buttons, links, and highlights.</p>
                        </div>
                    </GlassCard>
                </section>

                {/* Layout & mode */}
                <section className="space-y-4">
                    <div className="flex items-center gap-2">
                        <Layout className="w-5 h-5 text-brand-green dark:text-emerald-400" />
                        <h2 className="font-serif text-xl text-brand-deep dark:text-brand-cream">Layout & Mode</h2>
                    </div>
                    <GlassCard className="p-6 space-y-6">
                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase tracking-widest text-brand-accent/40 dark:text-white/40">Layout</label>
                            <div className="flex flex-wrap gap-2">
                                {STOREFRONT_LAYOUT_IDS.map((id) => (
                                    <Button
                                        key={id}
                                        variant={layout === id ? 'default' : 'outline'}
                                        size="sm"
                                        className="rounded-xl capitalize"
                                        onClick={() => setLayout(id)}
                                    >
                                        {id}
                                    </Button>
                                ))}
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase tracking-widest text-brand-accent/40 dark:text-white/40 flex items-center gap-2">
                                <Sun className="w-3.5 h-3.5" /> <Moon className="w-3.5 h-3.5" /> Theme mode
                            </label>
                            <div className="flex flex-wrap gap-2">
                                {THEME_MODES.map((mode) => (
                                    <Button
                                        key={mode}
                                        variant={themeMode === mode ? 'default' : 'outline'}
                                        size="sm"
                                        className="rounded-xl capitalize"
                                        onClick={() => setThemeMode(mode)}
                                    >
                                        {mode}
                                    </Button>
                                ))}
                            </div>
                        </div>
                    </GlassCard>
                </section>

                {/* Colors */}
                <section className="space-y-4">
                    <div className="flex items-center gap-2">
                        <Palette className="w-5 h-5 text-brand-green dark:text-emerald-400" />
                        <h2 className="font-serif text-xl text-brand-deep dark:text-brand-cream">Colors</h2>
                    </div>
                    <GlassCard className="p-6 space-y-6">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase tracking-widest text-brand-accent/40">Primary</label>
                                <ColorPicker
                                    color={ensureHex(primaryHex, '#062c21')}
                                    onChange={(v) => { setPrimaryHex(v); setColorsForm((c) => ({ ...c, primary: v })) }}
                                    showHexInput={true}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase tracking-widest text-brand-accent/40">Secondary</label>
                                <ColorPicker
                                    color={ensureHex(colorsForm.secondary, '#d4af37')}
                                    onChange={(v) => setColorsForm((c) => ({ ...c, secondary: v }))}
                                    showHexInput={true}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase tracking-widest text-brand-accent/40">Background</label>
                                <ColorPicker
                                    color={ensureHex(colorsForm.background, '#ffffff')}
                                    onChange={(v) => setColorsForm((c) => ({ ...c, background: v }))}
                                    showHexInput={true}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase tracking-widest text-brand-accent/40">Text</label>
                                <ColorPicker
                                    color={ensureHex(colorsForm.text, '#062c21')}
                                    onChange={(v) => setColorsForm((c) => ({ ...c, text: v }))}
                                    showHexInput={true}
                                />
                            </div>
                        </div>
                        <div className="border-t border-brand-deep/5 dark:border-white/5 pt-4">
                            <div className="flex items-center justify-between mb-3">
                                <span className="text-sm font-medium text-brand-deep dark:text-brand-cream">Dark mode colors</span>
                                <Switch checked={showDarkColors} onCheckedChange={setShowDarkColors} />
                            </div>
                            {showDarkColors && (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {(['primary', 'secondary', 'background', 'text'] as const).map((key) => (
                                        <div key={key} className="space-y-1">
                                            <label className="text-xs text-brand-accent/50 capitalize">{key}</label>
                                            <ColorPicker
                                                color={ensureHex(colorsDarkForm[key], defaultTheme.colorsDark[key])}
                                                onChange={(v) => setColorsDarkForm((c) => ({ ...c, [key]: v }))}
                                                showHexInput={true}
                                            />
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </GlassCard>
                </section>

                {/* Fonts */}
                <section className="space-y-4">
                    <div className="flex items-center gap-2">
                        <Type className="w-5 h-5 text-brand-green dark:text-emerald-400" />
                        <h2 className="font-serif text-xl text-brand-deep dark:text-brand-cream">Fonts</h2>
                    </div>
                    <GlassCard className="p-6 space-y-4">
                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase tracking-widest text-brand-accent/40">Heading</label>
                            <SearchableSelect
                                options={GOOGLE_FONTS_ALLOWED.map((f) => ({ label: f, value: f }))}
                                value={fontsForm.heading}
                                onChange={(v) => setFontsForm((f) => ({ ...f, heading: v }))}
                                placeholder="Select heading font"
                                searchPlaceholder="Search fonts..."
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase tracking-widest text-brand-accent/40">Body</label>
                            <SearchableSelect
                                options={GOOGLE_FONTS_ALLOWED.map((f) => ({ label: f, value: f }))}
                                value={fontsForm.body}
                                onChange={(v) => setFontsForm((f) => ({ ...f, body: v }))}
                                placeholder="Select body font"
                                searchPlaceholder="Search fonts..."
                            />
                        </div>
                    </GlassCard>
                </section>

                {/* Components */}
                <section className="space-y-4">
                    <h2 className="font-serif text-xl text-brand-deep dark:text-brand-cream">Components</h2>
                    <GlassCard className="p-6 space-y-6">
                        <div className="space-y-3">
                            <label className="text-xs font-bold uppercase tracking-widest text-brand-accent/40">Header</label>
                            <div className="flex flex-wrap gap-2">
                                {HEADER_STYLES.map((s) => (
                                    <Button
                                        key={s}
                                        variant={(headerForm.style as string) === s ? 'default' : 'outline'}
                                        size="sm"
                                        className="rounded-xl capitalize"
                                        onClick={() => setHeaderForm((h) => ({ ...h, style: s }))}
                                    >
                                        {s}
                                    </Button>
                                ))}
                            </div>
                            <div className="flex items-center justify-between py-2">
                                <span className="text-sm text-brand-deep dark:text-brand-cream">Show search</span>
                                <Switch
                                    checked={!!headerForm.showSearch}
                                    onCheckedChange={(v) => setHeaderForm((h) => ({ ...h, showSearch: v }))}
                                />
                            </div>
                        </div>
                        <div className="border-t border-brand-deep/5 dark:border-white/5 pt-4 space-y-3">
                            <label className="text-xs font-bold uppercase tracking-widest text-brand-accent/40">Product card</label>
                            <div className="flex flex-wrap gap-2">
                                <span className="text-xs text-brand-accent/60 mr-1">Radius:</span>
                                {PRODUCT_CARD_RADIUS.map((r) => (
                                    <Button
                                        key={r}
                                        variant={(productCardForm.borderRadius as string) === r ? 'default' : 'outline'}
                                        size="sm"
                                        className="rounded-xl capitalize"
                                        onClick={() => setProductCardForm((p) => ({ ...p, borderRadius: r }))}
                                    >
                                        {r}
                                    </Button>
                                ))}
                            </div>
                            <div className="flex flex-wrap gap-2">
                                <span className="text-xs text-brand-accent/60 mr-1">Shadow:</span>
                                {SHADOW_OPTIONS.map((s) => (
                                    <Button
                                        key={s}
                                        variant={(productCardForm.shadow as string) === s ? 'default' : 'outline'}
                                        size="sm"
                                        className="rounded-xl capitalize"
                                        onClick={() => setProductCardForm((p) => ({ ...p, shadow: s }))}
                                    >
                                        {s}
                                    </Button>
                                ))}
                            </div>
                        </div>
                        <div className="border-t border-brand-deep/5 dark:border-white/5 pt-4 space-y-3">
                            <label className="text-xs font-bold uppercase tracking-widest text-brand-accent/40">CTA button</label>
                            <div className="flex flex-wrap gap-2">
                                <span className="text-xs text-brand-accent/60 mr-1">Shape:</span>
                                {CTA_SHAPES.map((s) => (
                                    <Button
                                        key={s}
                                        variant={(ctaButtonForm.shape as string) === s ? 'default' : 'outline'}
                                        size="sm"
                                        className="rounded-xl capitalize"
                                        onClick={() => setCtaButtonForm((c) => ({ ...c, shape: s }))}
                                    >
                                        {s}
                                    </Button>
                                ))}
                            </div>
                            <div className="flex flex-wrap gap-2">
                                <span className="text-xs text-brand-accent/60 mr-1">Style:</span>
                                {CTA_STYLES.map((s) => (
                                    <Button
                                        key={s}
                                        variant={(ctaButtonForm.style as string) === s ? 'default' : 'outline'}
                                        size="sm"
                                        className="rounded-xl capitalize"
                                        onClick={() => setCtaButtonForm((c) => ({ ...c, style: s }))}
                                    >
                                        {s}
                                    </Button>
                                ))}
                            </div>
                        </div>
                    </GlassCard>
                </section>

                {/* Welcome message */}
                <section className="space-y-4">
                    <h2 className="font-serif text-xl text-brand-deep dark:text-brand-cream">Welcome message</h2>
                    <GlassCard className="p-6">
                        <Textarea
                            className="min-h-[100px] resize-none"
                            value={welcomeMessage}
                            onChange={(e) => setWelcomeMessage(e.target.value.slice(0, 500))}
                            placeholder="Optional message at the top of your store (max 500 characters)"
                            maxLength={500}
                        />
                        <p className="text-xs text-brand-accent/60 mt-1">{welcomeMessage.length}/500</p>
                    </GlassCard>
                </section>
            </div>

            {/* Sticky save bar */}
            <div className="fixed bottom-0 left-0 right-0 z-30 border-t border-brand-deep/10 dark:border-white/10 bg-white/95 dark:bg-brand-deep/95 backdrop-blur-md py-4 px-4 safe-area-pb">
                <div className="max-w-5xl mx-auto flex justify-end">
                    <Button
                        onClick={() => {
                            const fullTheme: StorefrontThemeData = {
                                ...defaultTheme,
                                ...base,
                                schemaVersion: 1,
                                layout,
                                themeMode,
                                colors: {
                                    primary: ensureHex(primaryHex, defaultTheme.colors.primary),
                                    secondary: ensureHex(colorsForm.secondary, defaultTheme.colors.secondary),
                                    background: ensureHex(colorsForm.background, defaultTheme.colors.background),
                                    text: ensureHex(colorsForm.text, defaultTheme.colors.text),
                                },
                                colorsDark: showDarkColors ? {
                                    primary: ensureHex(colorsDarkForm.primary, defaultTheme.colorsDark.primary),
                                    secondary: ensureHex(colorsDarkForm.secondary, defaultTheme.colorsDark.secondary),
                                    background: ensureHex(colorsDarkForm.background, defaultTheme.colorsDark.background),
                                    text: ensureHex(colorsDarkForm.text, defaultTheme.colorsDark.text),
                                } : undefined,
                                fonts: fontsForm,
                                components: {
                                    header: headerForm,
                                    productCard: productCardForm,
                                    ctaButton: ctaButtonForm,
                                },
                                welcomeMessage: welcomeMessage.slice(0, 500),
                                logoUrl: logo ?? null,
                            }
                            updateTheme.mutate(fullTheme)
                        }}
                        disabled={updateTheme.isPending || isLoading}
                        className="rounded-full bg-brand-deep text-brand-gold dark:bg-brand-gold dark:text-brand-deep dark:hover:bg-brand-gold/90 dark:hover:text-brand-deep font-bold px-8 h-12 shadow-xl hover:scale-105 transition-all"
                    >
                        {updateTheme.isPending ? 'Saving...' : 'Save Changes'}
                    </Button>
                </div>
            </div>

            {/* Mobile Preview - sticky */}
            <div className="w-full lg:w-[380px] shrink-0 lg:sticky lg:top-8 lg:self-start order-first lg:order-none pb-24 lg:pb-0">
                <div className="flex items-center gap-2 mb-4 justify-center lg:justify-start">
                    <div className="p-2 rounded-lg bg-brand-gold/10 text-brand-gold">
                        <Smartphone className="w-5 h-5" />
                    </div>
                    <h2 className="font-serif text-lg text-brand-deep dark:text-brand-cream">Live Preview</h2>
                </div>

                <div
                    className="relative mx-auto border-gray-800 dark:border-gray-800 bg-gray-900 border-[14px] rounded-[2.5rem] h-[600px] w-[300px] shadow-xl"
                    style={{
                        fontFamily: `${fontsForm.heading}, serif`,
                        ['--preview-primary' as string]: ensureHex(primaryHex, '#062c21'),
                        ['--preview-secondary' as string]: ensureHex(colorsForm.secondary, '#d4af37'),
                        ['--preview-bg' as string]: ensureHex(colorsForm.background, '#ffffff'),
                        ['--preview-text' as string]: ensureHex(colorsForm.text, '#062c21'),
                    }}
                >
                    <div className="h-[32px] w-[3px] bg-gray-800 absolute -left-[17px] top-[72px] rounded-l-lg" />
                    <div className="h-[46px] w-[3px] bg-gray-800 absolute -left-[17px] top-[124px] rounded-l-lg" />
                    <div className="h-[64px] w-[3px] bg-gray-800 absolute -right-[17px] top-[142px] rounded-r-lg" />
                    <div
                        className="rounded-[2rem] overflow-hidden w-full h-full relative transition-colors duration-300"
                        style={{
                            backgroundColor: themeMode === 'dark' ? ensureHex(colorsDarkForm?.background, '#1a1a1a') : ensureHex(colorsForm.background, '#f8f9fa'),
                        }}
                    >
                        <div className="storefront-preview-scroll h-full overflow-y-auto no-scrollbar" style={{ fontFamily: `${fontsForm.body}, sans-serif` }}>
                            {trimmedWelcomeMessage && (
                                <div
                                    className="flex items-center gap-3 overflow-hidden border-b border-black/10 px-3 py-2.5 shrink-0 w-full"
                                    style={{
                                        backgroundColor: 'var(--preview-primary)',
                                        color: 'rgba(255,255,255,0.95)',
                                    }}
                                    role="marquee"
                                    aria-live="polite"
                                >
                                    <span className="shrink-0 rounded-full border border-white/15 bg-white/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.24em] text-white/85">
                                        Notice
                                    </span>
                                    <div
                                        className="min-w-0 flex-1 overflow-hidden"
                                        style={{
                                            maskImage: 'linear-gradient(to right, transparent, black 10%, black 90%, transparent)',
                                            WebkitMaskImage: 'linear-gradient(to right, transparent, black 10%, black 90%, transparent)',
                                        }}
                                    >
                                        <div
                                            className="flex w-max items-center gap-8 whitespace-nowrap will-change-transform shrink-0"
                                            style={{
                                                animation: `storefront-marquee ${marqueeDuration} linear infinite`,
                                            }}
                                        >
                                            {[0, 1].map((copy) => (
                                                <div key={copy} className="flex shrink-0 items-center gap-8 pr-8">
                                                    <span className="h-1.5 w-1.5 rounded-full bg-white/65" aria-hidden />
                                                    <span className="shrink-0 text-sm font-medium text-white/95">
                                                        {trimmedWelcomeMessage}
                                                    </span>
                                                    <span className="h-1.5 w-1.5 rounded-full bg-white/65" aria-hidden />
                                                    <span className="shrink-0 text-sm font-medium text-white/95">
                                                        {trimmedWelcomeMessage}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}
                            <div
                                className={cn(
                                    "p-6 pb-4 sticky top-0 z-10 backdrop-blur-md border-b border-black/5",
                                    headerForm.style === 'minimal' && "py-3",
                                    headerForm.style === 'centered' && "text-center"
                                )}
                                style={{ backgroundColor: themeMode === 'dark' ? 'rgba(0,0,0,0.4)' : 'rgba(255,255,255,0.9)' }}
                            >
                                <div className={cn(
                                    "flex items-center gap-2 mb-4",
                                    headerForm.style === 'centered' && "justify-center",
                                    headerForm.style === 'minimal' && "mb-2"
                                )}>
                                    {logo ? (
                                        <img src={logo} alt="" className="w-8 h-8 rounded-full object-cover" />
                                    ) : (
                                        <div className="w-8 h-8 rounded-full flex items-center justify-center font-serif font-bold text-xs opacity-70" style={{ backgroundColor: 'var(--preview-primary)', color: '#fff' }}>
                                            L
                                        </div>
                                    )}
                                    <span className="font-bold text-sm" style={{ color: 'var(--preview-text)' }}>Store</span>
                                </div>
                                {headerForm.showSearch !== false && (
                                    <div className="h-8 w-full rounded-lg flex items-center px-3 gap-2 opacity-80" style={{ backgroundColor: 'var(--preview-bg)' }}>
                                        <div className="w-3 h-3 rounded-full opacity-50" style={{ backgroundColor: 'var(--preview-text)' }} />
                                        <div className="h-2 w-24 rounded-full opacity-40" style={{ backgroundColor: 'var(--preview-text)' }} />
                                    </div>
                                )}
                            </div>

                            <div
                                className="m-4 p-6 rounded-2xl text-white relative overflow-hidden transition-colors duration-500"
                                style={{ backgroundColor: ensureHex(primaryHex, '#062c21') }}
                            >
                                <div className="relative z-10">
                                    <p className="text-[10px] font-bold uppercase tracking-widest opacity-80 mb-1">New Arrivals</p>
                                    <h3 className="font-serif text-xl mb-3">Summer Collection</h3>
                                    <div
                                        className={cn(
                                            "h-8 px-4 bg-white/20 backdrop-blur-sm inline-flex items-center text-xs font-bold",
                                            ctaButtonForm.shape === 'pill' && "rounded-full",
                                            ctaButtonForm.shape === 'rounded' && "rounded-lg",
                                            ctaButtonForm.shape === 'square' && "rounded-none"
                                        )}
                                    >
                                        Shop Now
                                    </div>
                                </div>
                                <div className="absolute -right-4 -bottom-8 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
                            </div>

                            <div className={cn("p-4 pt-0 grid gap-3", layout === 'compact' ? 'grid-cols-2' : 'grid-cols-2')}>
                                {[1, 2, 3, 4].map((i) => (
                                    <div
                                        key={i}
                                        className={cn(
                                            "bg-white dark:bg-white/5 p-3 space-y-2 transition-all",
                                            productCardForm.borderRadius === 'none' && "rounded-none",
                                            productCardForm.borderRadius === 'sm' && "rounded-lg",
                                            productCardForm.borderRadius === 'md' && "rounded-xl",
                                            productCardForm.borderRadius === 'lg' && "rounded-2xl",
                                            productCardForm.borderRadius === 'xl' && "rounded-3xl",
                                            productCardForm.shadow === 'sm' && "shadow-sm",
                                            productCardForm.shadow === 'md' && "shadow-md",
                                            productCardForm.shadow === 'lg' && "shadow-lg",
                                            productCardForm.shadow === 'none' && "shadow-none"
                                        )}
                                    >
                                        <div className="aspect-square rounded-lg bg-gray-100 dark:bg-white/5 relative mb-2" />
                                        <div className="h-2 w-16 rounded-full opacity-60" style={{ backgroundColor: 'var(--preview-text)' }} />
                                        <div className="h-2 w-10 rounded-full opacity-40" style={{ backgroundColor: 'var(--preview-text)' }} />
                                        <div
                                            className={cn(
                                                "h-8 w-full mt-2 flex items-center justify-center text-[10px] font-bold text-white transition-colors duration-500",
                                                ctaButtonForm.shape === 'pill' && "rounded-full",
                                                ctaButtonForm.shape === 'rounded' && "rounded-lg",
                                                ctaButtonForm.shape === 'square' && "rounded-none",
                                                ctaButtonForm.style === 'outline' && "bg-transparent border-2 border-current"
                                            )}
                                            style={{
                                                backgroundColor: ctaButtonForm.style === 'solid' ? ensureHex(primaryHex, '#062c21') : undefined,
                                                color: ctaButtonForm.style === 'outline' ? ensureHex(primaryHex, '#062c21') : undefined,
                                                borderColor: ctaButtonForm.style === 'outline' ? ensureHex(primaryHex, '#062c21') : undefined,
                                            }}
                                        >
                                            Add to Cart
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
                <p className="text-center text-xs text-brand-accent/40 dark:text-white/30 mt-6 font-medium">
                    This is how your store looks on mobile devices.
                </p>
            </div>
        </div>
    )
}
