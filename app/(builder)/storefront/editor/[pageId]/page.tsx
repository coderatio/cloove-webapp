"use client"

import React from "react"
import {
    LayoutTemplate,
    Layers,
    Palette,
    Maximize2,
    Undo2,
    Redo2,
    History as HistoryIcon,
    Search
} from "lucide-react"
import { Button } from "@/app/components/ui/button"
import { Input } from "@/app/components/ui/input"
import { cn } from "@/app/lib/utils"

import { SectionLibrary } from "../../components/SectionLibrary"
import { LiveCanvas } from "../../components/LiveCanvas"
import { SectionInspector } from "../../components/SectionInspector"
import { MagicGenerator } from "../../components/MagicGenerator"
import { ThemeEditor } from "../../components/ThemeEditor"
import { useBuilder } from "../../../../domains/storefront/context/BuilderContext"

export default function StorefrontEditorPage() {
    const {
        sections, config, selectedSectionId, activeTab, isMagicOpen,
        setSelectedSectionId, setActiveTab, setIsMagicOpen,
        updateTheme, addSection, updateSection, removeSection, duplicateSection
    } = useBuilder()

    const selectedSection = sections.find(s => s.id === selectedSectionId) || null

    const handleToggleVisibility = (id: string) => {
        const section = sections.find(s => s.id === id)
        if (section) {
            updateSection(id, { settings: { ...section.settings, isVisible: !section.settings.isVisible } })
        }
    }

    const handleApplyMagic = (content: { heading: string, text: string }) => {
        if (selectedSectionId) {
            updateSection(selectedSectionId, {
                content,
                settings: { ...selectedSection!.settings, aiSuggested: true }
            })
        } else {
            addSection('hero' as any, content)
        }
    }

    const handleGenerateAI = (id: string, prompt: string) => {
        // Placeholder for AI generation logic
        updateSection(id, { settings: { ...selectedSection!.settings, aiSuggested: true } });
    };


    return (
        <div className="flex-1 flex overflow-hidden">
            {/* Left Sidebar - Tool Drawer */}
            <aside className="w-80 border-r border-brand-deep/5 dark:border-white/5 bg-white dark:bg-zinc-900 flex flex-col z-20">
                <div className="flex border-b border-brand-deep/5 dark:border-white/5">
                    {[
                        { id: 'add', icon: LayoutTemplate, label: 'Add' },
                        { id: 'layers', icon: Layers, label: 'Layers' },
                        { id: 'theme', icon: Palette, label: 'Theme' },
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={cn(
                                "flex-1 py-4 flex flex-col items-center gap-1 transition-all",
                                activeTab === tab.id
                                    ? "text-brand-green border-b-2 border-brand-green bg-brand-green/5"
                                    : "text-brand-accent/40 hover:text-brand-deep hover:bg-brand-deep/5"
                            )}
                        >
                            <tab.icon className="w-5 h-5" />
                            <span className="text-[10px] font-bold uppercase tracking-widest">{tab.label}</span>
                        </button>
                    ))}
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-6 no-scrollbar">
                    {activeTab === 'add' && (
                        <div className="space-y-6">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-accent/40" />
                                <Input
                                    placeholder="Search sections..."
                                    className="pl-9 h-10 rounded-xl bg-brand-deep/5 border-transparent focus:bg-white focus:ring-brand-green/20"
                                />
                            </div>
                            <SectionLibrary
                                onAddSection={addSection}
                                onOpenAIAssistant={() => setIsMagicOpen(true)}
                            />
                        </div>
                    )}

                    {activeTab === 'layers' && (
                        <div className="space-y-4">
                            <h3 className="text-[10px] font-bold uppercase tracking-widest text-brand-accent/40">Page Layers</h3>
                            {sections.length === 0 ? (
                                <p className="text-[11px] text-brand-accent/40 italic">No sections added yet.</p>
                            ) : (
                                <div className="space-y-2">
                                    {sections.map((section, idx) => (
                                        <div
                                            key={section.id}
                                            onClick={() => setSelectedSectionId(section.id)}
                                            className={cn(
                                                "p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all",
                                                selectedSectionId === section.id
                                                    ? "bg-brand-green/5 border-brand-green/20 text-brand-green"
                                                    : "bg-brand-deep/5 border-transparent text-brand-deep/60"
                                            )}
                                        >
                                            <span className="text-xs font-bold">{idx + 1}. {section.type}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                    {activeTab === 'theme' && (
                        <div className="space-y-6">
                            <h3 className="text-[10px] font-bold uppercase tracking-widest text-brand-accent/40">Global Styling</h3>
                            <ThemeEditor config={config.theme} onUpdate={updateTheme} />
                        </div>
                    )}
                </div>
            </aside>

            {/* Central Canvas Container */}
            <div
                className="flex-1 bg-zinc-100 dark:bg-zinc-950 p-8 overflow-y-auto relative no-scrollbar"
                style={{ '--brand-primary': config.theme.primaryColor } as React.CSSProperties}
            >
                <LiveCanvas
                    sections={sections}
                    selectedSectionId={selectedSectionId}
                    onSelectSection={setSelectedSectionId}
                    onRemoveSection={removeSection}
                    onDuplicateSection={duplicateSection}
                    onToggleVisibility={handleToggleVisibility}
                />

                {/* Canvas Floating Controls */}
                <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-40 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border border-brand-deep/5 dark:border-white/5 rounded-full p-1.5 flex items-center gap-1 shadow-2xl">
                    <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full text-brand-accent/40 hover:text-brand-deep">
                        <Undo2 className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full text-brand-accent/40 hover:text-brand-deep">
                        <Redo2 className="w-4 h-4" />
                    </Button>
                    <div className="h-4 w-px bg-brand-deep/10 mx-1" />
                    <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full text-brand-accent/40 hover:text-brand-deep">
                        <HistoryIcon className="w-4 h-4" />
                    </Button>
                    <div className="h-4 w-px bg-brand-deep/10 mx-1" />
                    <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full text-brand-accent/40 hover:text-brand-deep">
                        <Maximize2 className="w-4 h-4" />
                    </Button>
                </div>
            </div>

            {/* Right Sidebar - Inspector Panel */}
            <aside className="w-80 border-l border-brand-deep/5 dark:border-white/5 bg-white dark:bg-zinc-900 flex flex-col z-20 overflow-hidden">
                <SectionInspector
                    section={selectedSection}
                    onUpdate={updateSection}
                    onGenerateAI={() => setIsMagicOpen(true)}
                />
            </aside>

            <MagicGenerator
                isOpen={isMagicOpen}
                onClose={() => setIsMagicOpen(false)}
                onApply={handleApplyMagic}
                context={selectedSection?.type}
            />
        </div>
    )
}
