"use client"

import React, { createContext, useContext, useState, useEffect } from "react"
import { StorefrontSection, StorefrontConfig, SectionType } from "../types"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

interface BuilderContextType {
    sections: StorefrontSection[]
    config: StorefrontConfig
    selectedSectionId: string | null
    isMagicOpen: boolean
    activeTab: 'add' | 'layers' | 'theme'

    // Actions
    setSections: React.Dispatch<React.SetStateAction<StorefrontSection[]>>
    setSelectedSectionId: (id: string | null) => void
    setIsMagicOpen: (open: boolean) => void
    setActiveTab: (tab: 'add' | 'layers' | 'theme') => void
    updateTheme: (updates: Partial<StorefrontConfig['theme']>) => void
    addSection: (type: SectionType, aiContent?: { heading: string, text: string }) => void
    updateSection: (id: string, updates: Partial<StorefrontSection>) => void
    removeSection: (id: string) => void
    duplicateSection: (id: string) => void
    saveAndPublish: () => Promise<void>
}

const BuilderContext = createContext<BuilderContextType | undefined>(undefined)

export function BuilderProvider({ children }: { children: React.ReactNode }) {
    const router = useRouter()

    const [sections, setSections] = useState<StorefrontSection[]>([])
    const [config, setConfig] = useState<StorefrontConfig>({
        theme: {
            layout: 'editorial',
            primaryColor: '#10b981',
            fontHeading: 'serif',
            fontBody: 'sans',
        },
        navigation: { header: [], footer: [] }
    })
    const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null)
    const [isMagicOpen, setIsMagicOpen] = useState(false)
    const [activeTab, setActiveTab] = useState<'add' | 'layers' | 'theme'>('add')

    const updateTheme = (updates: Partial<StorefrontConfig['theme']>) => {
        setConfig(prev => ({ ...prev, theme: { ...prev.theme, ...updates } }))
    }

    const addSection = (type: SectionType, aiContent?: { heading: string, text: string }) => {
        const newSection: StorefrontSection = {
            id: Math.random().toString(36).substr(2, 9),
            type,
            content: aiContent || {
                heading: `New ${type.replace('-', ' ')}`,
                text: "Tell your brand story here. Click to edit this content."
            },
            settings: {
                padding: 'medium',
                isVisible: true,
                aiSuggested: !!aiContent
            }
        }
        setSections(prev => [...prev, newSection])
        setSelectedSectionId(newSection.id)
        toast.success(aiContent ? "Magic section created!" : `${type.replace('-', ' ')} section added`)
    }

    const updateSection = (id: string, updates: Partial<StorefrontSection>) => {
        setSections(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s))
    }

    const removeSection = (id: string) => {
        setSections(prev => prev.filter(s => s.id !== id))
        if (selectedSectionId === id) setSelectedSectionId(null)
        toast.info("Section removed")
    }

    const duplicateSection = (id: string) => {
        const original = sections.find(s => s.id === id)
        if (!original) return

        const duplicate: StorefrontSection = {
            ...original,
            id: Math.random().toString(36).substr(2, 9)
        }

        const index = sections.findIndex(s => s.id === id)
        const newSections = [...sections]
        newSections.splice(index + 1, 0, duplicate)
        setSections(newSections)
        setSelectedSectionId(duplicate.id)
        toast.success("Section duplicated")
    }

    const saveAndPublish = async () => {
        toast.loading("Publishing your changes...")
        // Real API call would go here
        await new Promise(resolve => setTimeout(resolve, 2000))
        toast.dismiss()
        toast.success("Storefront published successfully!")
    }

    return (
        <BuilderContext.Provider value={{
            sections, config, selectedSectionId, isMagicOpen, activeTab,
            setSections, setSelectedSectionId, setIsMagicOpen, setActiveTab,
            updateTheme, addSection, updateSection, removeSection, duplicateSection, saveAndPublish
        }}>
            {children}
        </BuilderContext.Provider>
    )
}

export function useBuilder() {
    const context = useContext(BuilderContext)
    if (context === undefined) {
        throw new Error("useBuilder must be used within a BuilderProvider")
    }
    return context
}
