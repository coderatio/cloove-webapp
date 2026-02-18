"use client"

import React from "react"
import {
    LayoutTemplate,
    Layout,
    Type,
    Image as ImageIcon,
    Mail,
    Plus,
    Sparkles,
    Star,
    MessageSquare,
    HelpCircle,
    LayoutDashboard
} from "lucide-react"
import { cn } from "@/app/lib/utils"
import { SectionType } from "../../../domains/storefront/types"

interface SectionLibraryProps {
    onAddSection: (type: SectionType) => void
    onOpenAIAssistant?: () => void
}

const SECTION_TEMPLATES = [
    {
        type: 'hero' as SectionType,
        label: 'Hero Header',
        description: 'Large impact banner with primary CTA',
        icon: LayoutTemplate,
        color: 'text-blue-500 bg-blue-500/10'
    },
    {
        type: 'features' as SectionType,
        label: 'Features Grid',
        description: 'Showcase benefits or services',
        icon: Layout,
        color: 'text-purple-500 bg-purple-500/10'
    },
    {
        type: 'product-showcase' as SectionType,
        label: 'Product Showcase',
        description: 'Highlight a specific product or collection',
        icon: Star,
        color: 'text-brand-gold bg-brand-gold/10'
    },
    {
        type: 'rich-text' as SectionType,
        label: 'Rich Text',
        description: 'Narrative content and formatting',
        icon: Type,
        color: 'text-emerald-500 bg-emerald-500/10'
    },
    {
        type: 'gallery' as SectionType,
        label: 'Media Gallery',
        description: 'Engaging visual layout',
        icon: ImageIcon,
        color: 'text-orange-500 bg-orange-500/10'
    },
    {
        type: 'cta-banner' as SectionType,
        label: 'CTA Banner',
        description: 'Focused drive to conversion',
        icon: LayoutDashboard,
        color: 'text-indigo-500 bg-indigo-500/10'
    },
    {
        type: 'testimonial' as SectionType,
        label: 'Testimonials',
        description: 'Build trust with social proof',
        icon: MessageSquare,
        color: 'text-cyan-500 bg-cyan-500/10'
    },
    {
        type: 'faq' as SectionType,
        label: 'FAQ Section',
        description: 'Answer common questions',
        icon: HelpCircle,
        color: 'text-amber-500 bg-amber-500/10'
    },
    {
        type: 'contact' as SectionType,
        label: 'Contact Form',
        description: 'Direct inquiry channel',
        icon: Mail,
        color: 'text-pink-500 bg-pink-500/10'
    }
]

export function SectionLibrary({ onAddSection, onOpenAIAssistant }: SectionLibraryProps) {
    return (
        <div className="space-y-6">
            <div className="relative group">
                <button
                    onClick={onOpenAIAssistant}
                    className="w-full p-4 rounded-2xl bg-gradient-to-br from-brand-deep to-brand-deep/80 text-white shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all relative overflow-hidden group"
                >
                    <div className="relative z-10 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-md">
                            <Sparkles className="w-5 h-5 text-brand-gold" />
                        </div>
                        <div className="text-left">
                            <h4 className="text-sm font-bold leading-tight">Generate with AI</h4>
                            <p className="text-[10px] text-white/60 font-medium tracking-wide font-mono uppercase">Magic Sections</p>
                        </div>
                    </div>
                </button>
            </div>

            <div className="space-y-4">
                <h3 className="text-[10px] font-bold uppercase tracking-widest text-brand-accent/40">Basic Blocks</h3>
                <div className="grid grid-cols-1 gap-2">
                    {SECTION_TEMPLATES.map((tpl) => (
                        <button
                            key={tpl.type}
                            onClick={() => onAddSection(tpl.type)}
                            className="group w-full p-3 rounded-xl border border-brand-deep/5 bg-brand-deep/5 hover:bg-white hover:border-brand-green/20 hover:shadow-lg transition-all text-left flex items-center gap-4"
                        >
                            <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center shrink-0 transition-transform group-hover:scale-110", tpl.color)}>
                                <tpl.icon className="w-5 h-5" />
                            </div>
                            <div className="min-w-0 flex-1">
                                <h4 className="text-xs font-bold text-brand-deep dark:text-brand-cream">{tpl.label}</h4>
                                <p className="text-[9px] text-brand-accent/60 dark:text-brand-cream/60 line-clamp-1">{tpl.description}</p>
                            </div>
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                <Plus className="w-4 h-4 text-brand-green" />
                            </div>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    )
}
