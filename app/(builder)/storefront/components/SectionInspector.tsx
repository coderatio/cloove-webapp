"use client"

import React from "react"
import {
    Settings,
    Type,
    Palette,
    Layout,
    Maximize,
    AlignLeft,
    AlignCenter,
    AlignRight,
    Sparkles,
    Check
} from "lucide-react"
import { cn } from "@/app/lib/utils"
import { StorefrontSection } from "../../../domains/storefront/types"
import { Input } from "@/app/components/ui/input"
import { Button } from "@/app/components/ui/button"
import { Label } from "@/app/components/ui/label"
import { Switch } from "@/app/components/ui/switch"

interface SectionInspectorProps {
    section: StorefrontSection | null
    onUpdate: (id: string, updates: Partial<StorefrontSection>) => void
    onGenerateAI: (id: string, prompt: string) => void
}

export function SectionInspector({ section, onUpdate, onGenerateAI }: SectionInspectorProps) {
    if (!section) {
        return (
            <div className="flex-1 p-8 text-center flex flex-col items-center justify-center space-y-4 opacity-40 grayscale">
                <div className="w-16 h-16 rounded-2xl bg-brand-deep/5 flex items-center justify-center border-2 border-dashed border-brand-deep/20">
                    <Settings className="w-8 h-8 text-brand-deep/20" />
                </div>
                <p className="text-[10px] font-bold uppercase tracking-widest leading-relaxed max-w-[160px]">
                    Select a section on the canvas to edit its properties
                </p>
            </div>
        )
    }

    const handleContentUpdate = (key: string, value: any) => {
        onUpdate(section.id, {
            content: { ...section.content, [key]: value }
        })
    }

    const handleSettingUpdate = (key: string, value: any) => {
        onUpdate(section.id, {
            settings: { ...section.settings, [key]: value }
        })
    }

    return (
        <div className="flex-1 flex flex-col overflow-hidden bg-white dark:bg-zinc-900">
            {/* Inspector Header */}
            <div className="p-6 border-b border-brand-deep/5 dark:border-white/5 bg-brand-deep/[0.02] flex items-center justify-between">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <Layout className="w-3.5 h-3.5 text-brand-green" />
                        <h3 className="text-[10px] font-bold uppercase tracking-widest text-brand-accent/40">Inspector</h3>
                    </div>
                    <h2 className="text-sm font-bold text-brand-deep dark:text-brand-cream truncate max-w-[140px]">
                        {section.type.charAt(0).toUpperCase() + section.type.slice(1).replace('-', ' ')}
                    </h2>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg">
                        <Sparkles className="w-4 h-4 text-brand-gold" />
                    </Button>
                </div>
            </div>

            {/* Editing Tabs Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-8 no-scrollbar pb-32">
                {/* AI Assist Section */}
                <div className="p-4 rounded-2xl bg-brand-green/5 border border-brand-green/10 space-y-3">
                    <div className="flex items-center gap-2 text-brand-green">
                        <Sparkles className="w-3.5 h-3.5" />
                        <span className="text-[10px] font-bold uppercase tracking-widest">AI Content Assistant</span>
                    </div>
                    <p className="text-[10px] text-brand-accent/60 leading-relaxed">
                        Let AI rewrite your copy or suggest new items for this section.
                    </p>
                    <Button
                        size="sm"
                        variant="ghost"
                        className="w-full justify-start text-[11px] font-bold text-brand-green hover:bg-white dark:hover:bg-white/10"
                    >
                        ✨ Rewrite Heading
                    </Button>
                </div>

                {/* Content Configuration */}
                <div className="space-y-6">
                    <div className="flex items-center gap-2 opacity-40">
                        <Type className="w-3.5 h-3.5" />
                        <span className="text-[10px] font-bold uppercase tracking-widest">Content</span>
                    </div>

                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label className="text-[10px] font-bold uppercase text-brand-accent/40">Heading</Label>
                            <Input
                                value={section.content.heading || ''}
                                onChange={(e) => handleContentUpdate('heading', e.target.value)}
                                className="h-10 rounded-xl bg-brand-deep/5 border-transparent focus:bg-white focus:ring-brand-green/20"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label className="text-[10px] font-bold uppercase text-brand-accent/40">Body Text</Label>
                            <textarea
                                value={section.content.text || ''}
                                onChange={(e) => handleContentUpdate('text', e.target.value)}
                                className="w-full h-32 p-3 rounded-xl bg-brand-deep/5 border-transparent focus:bg-white focus:ring-brand-green/20 text-sm resize-none focus:outline-none focus:ring-2"
                            />
                        </div>
                    </div>
                </div>

                {/* Style Settings */}
                <div className="space-y-6">
                    <div className="flex items-center gap-2 opacity-40">
                        <Palette className="w-3.5 h-3.5" />
                        <span className="text-[10px] font-bold uppercase tracking-widest">Style & Layout</span>
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <Label className="text-[10px] font-bold uppercase text-brand-accent/40">Visible to Public</Label>
                            <Switch
                                checked={section.settings.isVisible !== false}
                                onCheckedChange={(val) => handleSettingUpdate('isVisible', val)}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label className="text-[10px] font-bold uppercase text-brand-accent/40">Section Padding</Label>
                            <div className="grid grid-cols-4 gap-2">
                                {['none', 'small', 'medium', 'large'].map((p) => (
                                    <button
                                        key={p}
                                        onClick={() => handleSettingUpdate('padding', p)}
                                        className={cn(
                                            "h-8 rounded-lg text-[9px] font-bold uppercase tracking-wider transition-all",
                                            section.settings.padding === p
                                                ? "bg-brand-deep text-brand-gold shadow-md"
                                                : "bg-brand-deep/5 text-brand-accent/40 hover:bg-brand-deep/10"
                                        )}
                                    >
                                        {p}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Sticky Actions */}
            <div className="absolute bottom-0 left-0 right-0 p-6 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border-t border-brand-deep/5 dark:border-white/5">
                <Button className="w-full rounded-full bg-brand-deep text-brand-gold dark:bg-brand-gold dark:text-brand-deep font-bold h-12 shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all">
                    <Check className="w-4 h-4 mr-2" />
                    Save Settings
                </Button>
            </div>
        </div>
    )
}
