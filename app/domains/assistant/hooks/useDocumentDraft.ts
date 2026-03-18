"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import { apiClient } from "@/app/lib/api-client"
import type { LineItem } from "../types"

interface UseDocumentDraftReturn {
    isSaving: boolean
    isGeneratingPdf: boolean
    pdfUrl: string | null
    updateContent: (html: string) => void
    updateLineItems: (items: LineItem[]) => void
    generatePdf: () => Promise<void>
}

export function useDocumentDraft(draftId: string | null): UseDocumentDraftReturn {
    const [isSaving, setIsSaving] = useState(false)
    const [isGeneratingPdf, setIsGeneratingPdf] = useState(false)
    const [pdfUrl, setPdfUrl] = useState<string | null>(null)

    const contentTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
    const lineItemsTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

    // Clear timers on unmount
    useEffect(() => {
        return () => {
            if (contentTimerRef.current) clearTimeout(contentTimerRef.current)
            if (lineItemsTimerRef.current) clearTimeout(lineItemsTimerRef.current)
        }
    }, [])

    const updateContent = useCallback(
        (html: string) => {
            if (!draftId) return
            if (contentTimerRef.current) clearTimeout(contentTimerRef.current)
            contentTimerRef.current = setTimeout(async () => {
                setIsSaving(true)
                try {
                    await apiClient.patch(`/documents/drafts/${draftId}`, { content: html })
                } finally {
                    setIsSaving(false)
                }
            }, 1500)
        },
        [draftId]
    )

    const updateLineItems = useCallback(
        (items: LineItem[]) => {
            if (!draftId) return
            if (lineItemsTimerRef.current) clearTimeout(lineItemsTimerRef.current)
            lineItemsTimerRef.current = setTimeout(async () => {
                setIsSaving(true)
                try {
                    await apiClient.patch(`/documents/drafts/${draftId}`, { lineItems: items })
                } finally {
                    setIsSaving(false)
                }
            }, 1500)
        },
        [draftId]
    )

    const generatePdf = useCallback(async () => {
        if (!draftId) return
        setIsGeneratingPdf(true)
        try {
            const result = await apiClient.post<{ pdfUrl: string }>(`/documents/drafts/${draftId}/pdf`, {})
            setPdfUrl(result.pdfUrl)
            window.open(result.pdfUrl, "_blank")
        } finally {
            setIsGeneratingPdf(false)
        }
    }, [draftId])

    return {
        isSaving,
        isGeneratingPdf,
        pdfUrl,
        updateContent,
        updateLineItems,
        generatePdf,
    }
}
