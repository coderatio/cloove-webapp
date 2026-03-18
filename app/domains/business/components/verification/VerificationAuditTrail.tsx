"use client"

import { motion, AnimatePresence } from "framer-motion"
import { AlertCircle, ChevronRight, History } from "lucide-react"
import { cn } from "@/app/lib/utils"
import { formatDateTime } from "@/app/lib/date-utils"
import { GlassCard } from "@/app/components/ui/glass-card"

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
        <div className="space-y-4">
            <GlassCard className={cn(
                "p-6 border-red-500/10 bg-red-500/2 shadow-sm overflow-visible relative",
                "after:absolute after:inset-y-0 after:left-0 after:w-1 after:bg-red-500 after:rounded-full after:opacity-40"
            )}>
                <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center shrink-0">
                        <AlertCircle className="w-5 h-5 text-red-500" />
                    </div>
                    <div className="space-y-1.5">
                        <h4 className="text-[10px] font-bold text-red-500 uppercase tracking-[0.2em] leading-none">Security Exception</h4>
                        <p className="text-brand-deep dark:text-brand-cream/90 leading-relaxed font-serif italic text-lg opacity-80">
                            "{rejectionReason || "Identity verification could not be completed at this time. Please refine your submission artifacts."}"
                        </p>
                    </div>
                </div>

                <div className="mt-8 flex items-center justify-between border-t border-red-500/5 pt-4">
                    <button
                        onClick={onToggleHistory}
                        className="text-[10px] font-bold text-brand-deep/30 dark:text-brand-cream/30 hover:text-brand-gold uppercase tracking-[0.2em] transition-all flex items-center gap-2 group"
                    >
                        <History className="w-3.5 h-3.5 transition-transform group-hover:-rotate-45" />
                        {showHistory ? "Collapse Lifecycle" : "Examine Lifecycle"}
                        <ChevronRight className={cn("w-3 h-3 transition-all duration-300", showHistory && "rotate-90 translate-x-1")} />
                    </button>
                    
                    <span className="text-[9px] font-mono text-brand-deep/20 dark:text-white/10 uppercase">Ref ID: {logs[0]?.id?.slice(0, 8) || "N/A"}</span>
                </div>
            </GlassCard>

            <AnimatePresence>
                {showHistory && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                        className="overflow-hidden"
                    >
                        <div className="space-y-3 pl-4 border-l border-brand-deep/5 dark:border-white/5 ml-5 py-2">
                            {logs.map((log, i) => (
                                <motion.div 
                                    key={log.id} 
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: i * 0.1 }}
                                    className="flex gap-4 relative py-2"
                                >
                                    <div className={cn(
                                        "w-2 h-2 rounded-full mt-1.5 shrink-0 z-10",
                                        log.status === "VERIFIED" ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" :
                                            log.status === "PENDING" ? "bg-brand-gold shadow-[0_0_8px_rgba(212,175,55,0.5)]" :
                                                "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]"
                                    )} />
                                    
                                    <div className="space-y-1 flex-1">
                                        <div className="flex items-center justify-between">
                                            <span className={cn(
                                                "text-[9px] font-bold uppercase tracking-widest",
                                                log.status === "VERIFIED" ? "text-emerald-600" :
                                                log.status === "PENDING" ? "text-brand-gold" : "text-red-500"
                                            )}>
                                                {log.status}
                                            </span>
                                            <span className="text-[9px] font-mono text-brand-deep/30 dark:text-brand-cream/30">
                                                {formatDateTime(log.createdAt)}
                                            </span>
                                        </div>
                                        {log.rejectionReason && (
                                            <p className="text-[11px] text-brand-deep/50 dark:text-brand-cream/50 leading-relaxed font-sans mt-1 bg-brand-deep/2 dark:bg-white/2 p-2 rounded-lg border border-brand-deep/5 dark:border-white/5">
                                                {log.rejectionReason}
                                            </p>
                                        )}
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
