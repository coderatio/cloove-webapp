"use client"

import { useState, type ReactElement } from "react"
import { ThumbsDown } from "lucide-react"
import { cn } from "@/app/lib/utils"
import { Button } from "@/app/components/ui/button"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/app/components/ui/popover"

const FEEDBACK_REASONS = [
    "Inaccurate",
    "Not helpful",
    "Too verbose",
    "Incomplete",
    "Off-topic",
] as const

interface FeedbackPopoverProps {
    messageId: string
    isActive: boolean
    onSubmit: (messageId: string, feedback: "dislike" | null, reason?: string) => void
}

export function FeedbackPopover({ messageId, isActive, onSubmit }: FeedbackPopoverProps): ReactElement {
    const [open, setOpen] = useState(false)
    const [selectedReason, setSelectedReason] = useState<string | null>(null)
    const [customReason, setCustomReason] = useState("")

    const handleQuickSelect = (reason: string) => {
        setSelectedReason(prev => prev === reason ? null : reason)
    }

    const handleSubmit = () => {
        const reason = selectedReason === "Other"
            ? customReason.trim() || "Other"
            : selectedReason || undefined
        onSubmit(messageId, "dislike", reason)
        setOpen(false)
        resetState()
    }

    const handleToggle = () => {
        if (isActive) {
            onSubmit(messageId, null)
            return
        }
        setOpen(true)
    }

    const resetState = () => {
        setSelectedReason(null)
        setCustomReason("")
    }

    return (
        <Popover open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetState() }}>
            <PopoverTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleToggle}
                    className={cn(
                        "h-8 w-8 rounded-lg hover:bg-brand-deep/5 dark:hover:bg-white/5 text-brand-deep/40 dark:text-brand-cream/40 transition-colors",
                        isActive && "text-rose-500 bg-rose-500/10"
                    )}
                >
                    <ThumbsDown className="w-3.5 h-3.5" />
                </Button>
            </PopoverTrigger>
            <PopoverContent
                align="start"
                side="top"
                sideOffset={8}
                className="w-72 p-3"
            >
                <p className="text-xs font-semibold text-brand-deep dark:text-brand-cream mb-2">
                    What went wrong?
                </p>
                <div className="flex flex-wrap gap-1.5 mb-3">
                    {FEEDBACK_REASONS.map((reason) => (
                        <button
                            key={reason}
                            type="button"
                            onClick={() => handleQuickSelect(reason)}
                            className={cn(
                                "px-2.5 py-1 rounded-full text-[11px] font-medium border transition-colors",
                                selectedReason === reason
                                    ? "bg-rose-500/10 border-rose-500/30 text-rose-600 dark:text-rose-400"
                                    : "border-brand-deep/10 dark:border-white/10 text-brand-deep/60 dark:text-brand-cream/60 hover:bg-brand-deep/5 dark:hover:bg-white/5"
                            )}
                        >
                            {reason}
                        </button>
                    ))}
                    <button
                        type="button"
                        onClick={() => handleQuickSelect("Other")}
                        className={cn(
                            "px-2.5 py-1 rounded-full text-[11px] font-medium border transition-colors",
                            selectedReason === "Other"
                                ? "bg-rose-500/10 border-rose-500/30 text-rose-600 dark:text-rose-400"
                                : "border-brand-deep/10 dark:border-white/10 text-brand-deep/60 dark:text-brand-cream/60 hover:bg-brand-deep/5 dark:hover:bg-white/5"
                        )}
                    >
                        Other
                    </button>
                </div>
                {selectedReason === "Other" && (
                    <textarea
                        value={customReason}
                        onChange={(e) => setCustomReason(e.target.value)}
                        placeholder="Tell us more..."
                        rows={2}
                        className="w-full text-xs rounded-xl border border-brand-deep/10 dark:border-white/10 bg-transparent px-3 py-2 mb-3 placeholder:text-brand-deep/30 dark:placeholder:text-brand-cream/30 focus:outline-none focus:ring-1 focus:ring-rose-500/30 resize-none"
                    />
                )}
                <Button
                    size="sm"
                    onClick={handleSubmit}
                    disabled={!selectedReason}
                    className="w-full bg-rose-500/90 hover:bg-rose-500 text-white text-xs font-bold rounded-xl h-8 disabled:opacity-40"
                >
                    Submit Feedback
                </Button>
            </PopoverContent>
        </Popover>
    )
}
