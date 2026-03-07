"use client"

import { useEffect } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { GlassCard } from "@/app/components/ui/glass-card"
import { Button } from "@/app/components/ui/button"
import { FileText, Eye, Edit2, Plus, Info, MessageSquare, ShieldCheck } from "lucide-react"
import { cn } from "@/app/lib/utils"
import { useStorefrontPages, type StorefrontPageListItem } from "@/app/domains/storefront/hooks/useStorefrontPages"
import { useStorefront } from "@/app/domains/storefront/hooks/useStorefront"

const iconBySlug: Record<string, typeof Info> = {
    about: Info,
    contact: MessageSquare,
    policy: ShieldCheck,
}

function getIcon(page: StorefrontPageListItem) {
    return iconBySlug[page.slug] ?? FileText
}

function formatDate(iso: string) {
    try {
        const d = new Date(iso)
        const now = new Date()
        const diffMs = now.getTime() - d.getTime()
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
        if (diffDays === 0) return 'Updated today'
        if (diffDays === 1) return 'Last updated yesterday'
        if (diffDays < 7) return `Last updated ${diffDays} days ago`
        if (diffDays < 30) return `Last updated ${Math.floor(diffDays / 7)} weeks ago`
        return `Created ${d.toLocaleDateString()}`
    } catch {
        return ''
    }
}

export default function StorefrontPages() {
    const searchParams = useSearchParams()
    const router = useRouter()
    const { data: storefront } = useStorefront()
    const { data: pages = [], isLoading, error } = useStorefrontPages()

    useEffect(() => {
        const action = searchParams.get('action')
        const slug = searchParams.get('slug')
        if (action === 'edit' && slug) {
            const pageToEdit = pages.find((p) => p.slug === slug)
            if (pageToEdit) router.push(`/storefront/editor/${pageToEdit.slug}`)
        }
    }, [searchParams, pages, router])

    const handleEdit = (page: StorefrontPageListItem) => {
        router.push(`/storefront/editor/${page.slug}`)
    }

    const handleCreate = () => {
        router.push('/storefront/editor/new')
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[200px]">
                <div className="w-8 h-8 border-2 border-brand-gold border-t-transparent rounded-full animate-spin" />
            </div>
        )
    }

    if (error) {
        return (
            <div className="rounded-2xl border border-brand-deep/10 dark:border-white/10 bg-brand-cream/50 dark:bg-black/20 p-8 text-center">
                <p className="text-brand-deep/70 dark:text-brand-cream/70">
                    {(error as Error)?.message ?? 'Failed to load pages.'}
                </p>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="font-serif text-xl text-brand-deep dark:text-brand-cream font-medium">Website Builder</h2>
                    <p className="text-brand-accent/60 dark:text-brand-cream/60 text-sm">Design and compose your storefront pages with modular sections.</p>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        onClick={() => router.push('/storefront/editor/v0.1/new')}
                        className="rounded-full border-brand-accent/10 dark:border-white/10 px-4 h-10"
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        New (simple)
                    </Button>
                    <Button
                        onClick={handleCreate}
                        className="rounded-full bg-brand-deep text-brand-gold dark:bg-brand-gold dark:text-brand-deep dark:hover:bg-brand-gold/90 dark:hover:text-brand-deep font-bold px-6 h-10 shadow-lg hover:scale-105 transition-all"
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        New Page
                    </Button>
                </div>
            </div>

            <GlassCard className="overflow-hidden p-0">
                <div className="grid grid-cols-1 divide-y divide-brand-deep/5 dark:divide-white/5">
                    {pages.length === 0 ? (
                        <div className="p-8 text-center text-brand-accent/60 dark:text-brand-cream/60 text-sm">
                            No pages yet. Create one to get started.
                        </div>
                    ) : (
                        pages.map((page) => {
                            const Icon = getIcon(page)
                            const status = page.isPublished ? 'Published' : 'Draft'
                            return (
                                <div key={page.id} className="p-4 md:p-6 flex items-center justify-between group hover:bg-brand-cream/40 dark:hover:bg-white/5 transition-colors">
                                    <div className="flex items-center gap-4">
                                        <div className={cn(
                                            "w-12 h-12 rounded-xl flex items-center justify-center",
                                            page.isPublished
                                                ? "bg-brand-green/10 text-brand-green dark:text-emerald-400 dark:bg-emerald-400/10"
                                                : "bg-brand-accent/10 text-brand-accent/60 dark:text-brand-cream/60"
                                        )}>
                                            <Icon className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <h3 className="font-serif text-lg font-medium text-brand-deep dark:text-brand-cream">{page.title}</h3>
                                            <div className="flex items-center gap-3 text-xs">
                                                <span className={cn(
                                                    "font-bold uppercase tracking-widest",
                                                    page.isPublished ? "text-brand-green dark:text-emerald-400" : "text-brand-accent/60 dark:text-brand-cream/60"
                                                )}>
                                                    {status}
                                                </span>
                                                <span className="w-1 h-1 rounded-full bg-brand-deep/20 dark:bg-white/20" />
                                                <span className="text-brand-accent/60 dark:text-brand-cream/60">{formatDate(page.updatedAt)}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-9 px-3 text-brand-accent/60 hover:text-brand-deep dark:text-white/60 dark:hover:text-white"
                                            onClick={() => storefront?.url && window.open(page.isHome ? storefront.url : `${storefront.url.replace(/\/$/, '')}/${page.slug}`, '_blank')}
                                        >
                                            <Eye className="w-4 h-4 mr-2" />
                                            View
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => router.push(`/storefront/editor/v0.1/${page.slug}`)}
                                            className="h-9 px-3 text-brand-accent/60 hover:text-brand-deep dark:text-white/60 dark:hover:text-white"
                                        >
                                            Simple
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleEdit(page)}
                                            className="h-9 px-4 border-brand-accent/10 hover:bg-white/60 dark:border-white/10 dark:hover:bg-white/10 rounded-lg group/edit"
                                        >
                                            <Edit2 className="w-3.5 h-3.5 mr-2 group-hover/edit:text-brand-green dark:group-hover/edit:text-emerald-400 transition-colors" />
                                            Edit
                                        </Button>
                                    </div>
                                </div>
                            )
                        })
                    )}
                </div>
            </GlassCard>
        </div>
    )
}
