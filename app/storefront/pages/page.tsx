"use client"

import { useState } from "react"
import { GlassCard } from "../../components/ui/glass-card"
import { Button } from "../../components/ui/button"
import { FileText, Eye, Edit2, Plus, Info, MessageSquare, ShieldCheck } from "lucide-react"
import { cn } from "@/app/lib/utils"

const initialPages = [
    { id: '1', title: 'About Us', slug: 'about', status: 'Published', icon: Info, date: 'Last updated 2 days ago' },
    { id: '2', title: 'Contact Support', slug: 'contact', status: 'Published', icon: MessageSquare, date: 'Last updated 1 week ago' },
    { id: '3', title: 'Return Policy', slug: 'policy', status: 'Draft', icon: ShieldCheck, date: 'Created 2 weeks ago' },
]

export default function StorefrontPages() {
    const [pages, setPages] = useState(initialPages)

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="font-serif text-xl text-brand-deep dark:text-brand-cream font-medium">Content Pages</h2>
                    <p className="text-brand-accent/60 dark:text-brand-cream/60 text-sm">Manage the auxiliary pages for your storefront.</p>
                </div>
                <Button className="rounded-full bg-brand-deep text-brand-gold dark:bg-brand-gold dark:text-brand-deep dark:hover:bg-brand-gold/90 dark:hover:text-brand-deep font-bold px-6 h-10 shadow-lg hover:scale-105 transition-all">
                    <Plus className="w-4 h-4 mr-2" />
                    New Page
                </Button>
            </div>

            <GlassCard className="overflow-hidden p-0">
                <div className="grid grid-cols-1 divide-y divide-brand-deep/5 dark:divide-white/5">
                    {pages.map((page) => (
                        <div key={page.id} className="p-4 md:p-6 flex items-center justify-between group hover:bg-brand-cream/40 dark:hover:bg-white/5 transition-colors">
                            <div className="flex items-center gap-4">
                                <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center",
                                    page.status === 'Published'
                                        ? "bg-brand-green/10 text-brand-green dark:text-emerald-400 dark:bg-emerald-400/10"
                                        : "bg-brand-accent/10 text-brand-accent/60 dark:text-brand-cream/60"
                                )}>
                                    <page.icon className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="font-serif text-lg font-medium text-brand-deep dark:text-brand-cream">{page.title}</h3>
                                    <div className="flex items-center gap-3 text-xs">
                                        <span className={cn(
                                            "font-bold uppercase tracking-widest",
                                            page.status === 'Published' ? "text-brand-green dark:text-emerald-400" : "text-brand-accent/60 dark:text-brand-cream/60"
                                        )}>
                                            {page.status}
                                        </span>
                                        <span className="w-1 h-1 rounded-full bg-brand-deep/20 dark:bg-white/20" />
                                        <span className="text-brand-accent/60 dark:text-brand-cream/60">{page.date}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-9 px-3 text-brand-accent/60 hover:text-brand-deep dark:text-white/60 dark:hover:text-white"
                                >
                                    <Eye className="w-4 h-4 mr-2" />
                                    View
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-9 px-4 border-brand-accent/10 hover:bg-white/60 dark:border-white/10 dark:hover:bg-white/10 rounded-lg group/edit"
                                >
                                    <Edit2 className="w-3.5 h-3.5 mr-2 group-hover/edit:text-brand-green dark:group-hover/edit:text-emerald-400 transition-colors" />
                                    Edit
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
            </GlassCard>
        </div>
    )
}
