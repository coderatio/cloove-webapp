"use client"

import { motion, AnimatePresence } from "framer-motion"
import { AlertCircle, ChevronRight } from "lucide-react"
import { cn } from "@/app/lib/utils"
import { formatDateTime } from "@/app/lib/date-utils"

interface LogEntry {
    id: string
    status: string
    rejectionReason: string | null
    createdAt: string
}

interface VerificationAuditTrailProps {
    logs: LogEntry[]
    showHistory: boolean
    onToggleHistory: () => void
    rejectionReason?: string | null
}

export function VerificationAuditTrail({
    logs,
    showHistory,
    onToggleHistory,
    rejectionReason
}: VerificationAuditTrailProps) {
    return (
        <div className="mt-4 p-5 rounded-[24px] bg-red-500/5 border border-red-500/10 flex flex-col gap-4">
            <div className="flex items-start gap-3">
                <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                <div className="space-y-1">
                    <p className="text-[10px] font-bold text-red-500 uppercase tracking-widest leading-none">Identity Rejection</p>
                    <p className="text-sm text-brand-deep dark:text-brand-cream/90 leading-relaxed font-medium">
                        {rejectionReason || "Please verify your information and try again."}
                    </p>
                </div>
            </div>

            <button
                onClick={onToggleHistory}
                className="text-[10px] font-bold text-brand-deep/40 dark:text-brand-cream/40 hover:text-brand-gold uppercase tracking-widest transition-colors flex items-center gap-2 self-start"
            >
                {showHistory ? "Hide Audit Trail" : "View Audit Trail"}
                <ChevronRight className={cn("w-3 h-3 transition-transform", showHistory && "rotate-90")} />
            </button>

            <AnimatePresence>
                {showHistory && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden border-t border-red-500/5 pt-4 space-y-4"
                    >
                        {logs.map((log, i) => (
                            <div key={log.id} className="flex gap-4 relative">
                                {i !== logs.length - 1 && (
                                    <div className="absolute left-1.5 top-3 bottom-0 w-px bg-brand-deep/5 dark:bg-white/5" />
                                )}
                                <div className={cn(
                                    "w-3 h-3 rounded-full mt-1.5 shrink-0 border-2",
                                    log.status === "VERIFIED" ? "bg-emerald-500 border-emerald-500/20" :
                                        log.status === "PENDING" ? "bg-brand-gold border-brand-gold/20" :
                                            "bg-red-500 border-red-500/20"
                                )} />
                                <div className="space-y-1.5 pb-2">
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] font-bold uppercase tracking-wider text-brand-deep/80 dark:text-brand-cream/80">{log.status}</span>
                                        <span className="text-[10px] text-brand-deep/40 dark:text-brand-cream/40">{formatDateTime(log.createdAt)}</span>
                                    </div>
                                    {log.rejectionReason && (
                                        <p className="text-xs text-brand-deep/60 dark:text-brand-cream/60 leading-relaxed italic pr-4">
                                            "{log.rejectionReason}"
                                        </p>
                                    )}
                                </div>
                            </div>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
