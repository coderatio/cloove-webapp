"use client"

import { type ReactElement } from "react"
import { FileText, Download } from "lucide-react"
import { Button } from "@/app/components/ui/button"
import { Markdown } from "@/app/components/ui/markdown"
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
import type { ProposalPart } from "../types"

interface ProposalDetailViewProps {
    proposal: ProposalPart
    open: boolean
    onOpenChange: (open: boolean) => void
    onGeneratePdf?: () => void
}

export function ProposalDetailView({ proposal, open, onOpenChange, onGeneratePdf }: ProposalDetailViewProps): ReactElement {
    return (
        <Drawer open={open} onOpenChange={onOpenChange}>
            <DrawerContent>
                <VisuallyHidden>
                    <DrawerTitle>{proposal.title || "Business Proposal"}</DrawerTitle>
                    <DrawerDescription>Proposal details for {proposal.clientName}</DrawerDescription>
                </VisuallyHidden>
                <DrawerStickyHeader>
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-brand-green/20 flex items-center justify-center text-brand-green shrink-0">
                            <FileText className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                            <h2 className="text-lg font-serif font-semibold text-brand-deep dark:text-brand-cream truncate">
                                {proposal.title || "Business Proposal"}
                            </h2>
                            <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-[10px] uppercase tracking-widest text-brand-green font-bold">
                                    {proposal.status}
                                </span>
                                {proposal.totalValue != null && (
                                    <span className="text-[10px] text-brand-deep/40 dark:text-brand-cream/40 font-bold">
                                        • ₦{proposal.totalValue.toLocaleString()}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                </DrawerStickyHeader>

                <DrawerBody>
                    <div className="space-y-2 mb-6">
                        <div className="flex justify-between items-center text-xs text-brand-deep/50 dark:text-brand-cream/50">
                            <span className="font-bold uppercase tracking-wider">Client</span>
                            <span className="font-medium text-brand-deep dark:text-brand-cream">{proposal.clientName}</span>
                        </div>
                    </div>

                    <div className="space-y-6">
                        {proposal.sections.map((section, i) => (
                            <div key={i} className="space-y-2">
                                <h3 className="text-sm font-bold text-brand-green uppercase tracking-wider">
                                    {section.title}
                                </h3>
                                <div className="text-sm text-brand-deep/80 dark:text-brand-cream/80 leading-relaxed">
                                    <Markdown content={section.content} />
                                </div>
                            </div>
                        ))}
                    </div>
                </DrawerBody>

                <DrawerFooter>
                    <div className="flex gap-3">
                        {onGeneratePdf && (
                            <Button
                                size="sm"
                                variant="ghost"
                                onClick={onGeneratePdf}
                                className="border border-brand-green/20 text-brand-green hover:bg-brand-green/5"
                            >
                                <Download className="w-3.5 h-3.5 mr-2" />
                                Export PDF
                            </Button>
                        )}
                    </div>
                </DrawerFooter>
            </DrawerContent>
        </Drawer>
    )
}
