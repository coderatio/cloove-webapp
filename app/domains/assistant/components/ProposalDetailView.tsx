"use client"

import { useState, useEffect, useRef, type ReactElement } from "react"
import { FileText, Download, Loader2, Sparkles } from "lucide-react"
import { Button } from "@/app/components/ui/button"
import { Markdown } from "@/app/components/ui/markdown"
import { DocumentEditor } from "@/app/components/ui/document-editor"
import {
    Drawer,
    DrawerContent,
    DrawerStickyHeader,
    DrawerBody,
    DrawerFooter,
    DrawerTitle,
    DrawerDescription,
} from "@/app/components/ui/drawer"
import { VisuallyHidden } from "@/app/components/ui/visually-hidden"
import { useDocumentDraft } from "../hooks/useDocumentDraft"

interface ProposalDetailViewProps {
    draftId: string
    clientName: string
    projectName: string
    streamingContent: string
    isStreaming: boolean
    onClose?: () => void
    open: boolean
    onOpenChange: (open: boolean) => void
}

/** Convert markdown to basic HTML for tiptap initial content */
function markdownToHtml(markdown: string): string {
    return markdown
        .split('\n\n')
        .map((block) => {
            if (block.startsWith('# ')) {
                return `<h1>${block.slice(2).trim()}</h1>`
            }
            if (block.startsWith('## ')) {
                return `<h2>${block.slice(3).trim()}</h2>`
            }
            if (block.startsWith('### ')) {
                return `<h3>${block.slice(4).trim()}</h3>`
            }
            if (block.startsWith('- ') || block.startsWith('* ')) {
                const items = block.split('\n').map((l) => `<li>${l.replace(/^[-*]\s+/, '').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\*(.*?)\*/g, '<em>$1</em>')}</li>`)
                return `<ul>${items.join('')}</ul>`
            }
            if (/^\d+\.\s/.test(block)) {
                const items = block.split('\n').map((l) => `<li>${l.replace(/^\d+\.\s+/, '').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\*(.*?)\*/g, '<em>$1</em>')}</li>`)
                return `<ol>${items.join('')}</ol>`
            }
            const text = block.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\*(.*?)\*/g, '<em>$1</em>').replace(/\n/g, '<br />')
            return `<p>${text}</p>`
        })
        .join('')
}

export function ProposalDetailView({
    draftId,
    clientName,
    projectName,
    streamingContent,
    isStreaming,
    open,
    onOpenChange,
}: ProposalDetailViewProps): ReactElement {
    const { isSaving, isGeneratingPdf, updateContent, generatePdf } = useDocumentDraft(draftId)
    const [editorContent, setEditorContent] = useState("")
    const hasTransitioned = useRef(false)

    // When streaming ends for the first time, convert markdown to HTML for tiptap
    useEffect(() => {
        if (!isStreaming && streamingContent && !hasTransitioned.current) {
            hasTransitioned.current = true
            setEditorContent(markdownToHtml(streamingContent))
        }
    }, [isStreaming, streamingContent])

    return (
        <Drawer open={open} onOpenChange={onOpenChange}>
            <DrawerContent>
                <VisuallyHidden>
                    <DrawerTitle>{projectName || "Business Proposal"}</DrawerTitle>
                    <DrawerDescription>Proposal for {clientName}</DrawerDescription>
                </VisuallyHidden>
                <DrawerStickyHeader>
                    <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                            <div className="h-10 w-10 rounded-xl bg-brand-green/20 flex items-center justify-center text-brand-green shrink-0">
                                <FileText className="w-5 h-5" />
                            </div>
                            <div className="min-w-0">
                                <h2 className="text-lg font-serif font-semibold text-brand-deep dark:text-brand-cream truncate">
                                    {projectName || "Business Proposal"}
                                </h2>
                                <div className="flex items-center gap-2 mt-0.5">
                                    <span className="text-[10px] uppercase tracking-widest text-brand-green font-bold">
                                        Draft
                                    </span>
                                    <span className="text-[10px] text-brand-deep/40 dark:text-brand-cream/40">
                                        • {clientName}
                                    </span>
                                </div>
                            </div>
                        </div>
                        {isSaving && (
                            <span className="text-[10px] text-brand-deep/40 dark:text-brand-cream/40 shrink-0">
                                Saving…
                            </span>
                        )}
                    </div>
                </DrawerStickyHeader>

                <DrawerBody>
                    {isStreaming ? (
                        // Live streaming preview
                        <div className="space-y-3">
                            <div className="flex items-center gap-1.5 text-xs text-brand-green/70">
                                <Sparkles className="w-3.5 h-3.5 animate-pulse" />
                                <span>Writing proposal…</span>
                            </div>
                            <div className="text-sm text-brand-deep/80 dark:text-brand-cream/80 leading-relaxed">
                                <Markdown content={streamingContent} streaming />
                            </div>
                        </div>
                    ) : (
                        // Tiptap editor once streaming ends
                        <DocumentEditor
                            content={editorContent}
                            onChange={updateContent}
                            placeholder="Proposal content will appear here…"
                        />
                    )}
                </DrawerBody>

                <DrawerFooter>
                    <div className="flex items-center gap-3">
                        <Button
                            size="sm"
                            variant="ghost"
                            onClick={generatePdf}
                            disabled={isStreaming || isGeneratingPdf}
                            className="border border-brand-green/20 text-brand-green hover:bg-brand-green/5"
                        >
                            {isGeneratingPdf ? (
                                <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" />
                            ) : (
                                <Download className="w-3.5 h-3.5 mr-2" />
                            )}
                            Generate PDF
                        </Button>
                    </div>
                </DrawerFooter>
            </DrawerContent>
        </Drawer>
    )
}
