"use client"

import { cn } from "@/app/lib/utils"
import { motion } from "framer-motion"
import { Phone, Mail, Shield, Clock, Sparkles } from "lucide-react"
import type { StaffMember } from "../hooks/useStaff"

interface StaffCardProps {
    member: StaffMember
    onClick?: () => void
    delay?: number
}

function getInitials(name: string): string {
    return name
        .split(' ')
        .map(w => w[0])
        .filter(Boolean)
        .slice(0, 2)
        .join('')
        .toUpperCase()
}

const roleLabels: Record<string, string> = {
    OWNER: 'Owner',
    STAFF: 'Staff',
    ACCOUNTANT: 'Accountant',
}

/** Deterministic avatar gradient from name */
function avatarGradient(name: string): string {
    const hash = name.split('').reduce((a, c) => a + c.charCodeAt(0), 0)
    const palettes = [
        'from-brand-deep-500 to-brand-deep-700',
        'from-brand-gold-500 to-brand-gold-700',
        'from-emerald-600 to-teal-800',
        'from-brand-accent to-brand-deep',
        'from-brand-deep-400 to-emerald-700',
        'from-amber-600 to-brand-gold-700',
    ]
    return palettes[hash % palettes.length]
}

export function StaffCard({ member, onClick, delay = 0 }: StaffCardProps) {
    const isActive = member.status === 'ACTIVE'
    const isPending = member.status === 'PENDING'
    const isOwner = member.role === 'OWNER'
    const gradient = avatarGradient(member.user.fullName || 'User')

    return (
        <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            whileHover={onClick ? { y: -2, transition: { duration: 0.25 } } : undefined}
            whileTap={onClick ? { scale: 0.985 } : undefined}
            onClick={onClick}
            className={cn(
                "group relative rounded-[24px] border overflow-hidden transition-all duration-500",
                "bg-brand-cream/50 border-brand-green/8 shadow-[0_4px_20px_rgba(6,44,33,0.03)]",
                "dark:bg-white/3 dark:border-white/6 dark:shadow-[0_4px_20px_rgba(0,0,0,0.15)]",
                "backdrop-blur-xl",
                onClick && "cursor-pointer hover:shadow-[0_12px_40px_rgba(6,44,33,0.08)] hover:border-brand-green/15 dark:hover:shadow-[0_12px_40px_rgba(0,0,0,0.25)] dark:hover:border-white/10"
            )}
        >
            {/* Subtle inner glow */}
            <div className="absolute inset-0 bg-linear-to-br from-white/40 via-transparent to-transparent dark:from-white/3 pointer-events-none" />

            {/* Owner accent line */}
            {isOwner && (
                <div className="absolute top-0 left-0 right-0 h-[2px] bg-linear-to-r from-transparent via-brand-gold to-transparent opacity-60" />
            )}

            <div className="relative p-5">
                <div className="flex items-center gap-4">
                    {/* Premium avatar */}
                    <div className="relative shrink-0">
                        <div className={cn(
                            "w-12 h-12 rounded-2xl bg-linear-to-br flex items-center justify-center text-white font-serif text-[15px] font-semibold tracking-wide shadow-lg",
                            gradient,
                            isOwner && "ring-2 ring-brand-gold/30 ring-offset-2 ring-offset-brand-cream dark:ring-offset-brand-deep"
                        )}>
                            {member.user.fullName ? getInitials(member.user.fullName) : '?'}
                        </div>

                        {/* Live status indicator */}
                        <span className={cn(
                            "absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-[2.5px] border-brand-cream dark:border-brand-deep",
                            isActive && "bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.4)]",
                            isPending && "bg-amber-400 shadow-[0_0_6px_rgba(251,191,36,0.4)]",
                        )} />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0 space-y-1.5">
                        {/* Name row */}
                        <div className="flex items-center gap-2">
                            <h3 className="font-serif text-[15px] font-semibold text-brand-deep dark:text-brand-cream truncate leading-tight">
                                {member.user.fullName || 'Unnamed'}
                            </h3>
                            {isOwner && (
                                <Sparkles className="w-3.5 h-3.5 text-brand-gold shrink-0" />
                            )}
                        </div>

                        {/* Contact row */}
                        <div className="flex items-center gap-3 flex-wrap">
                            <span className="inline-flex items-center gap-1.5 text-[12px] text-brand-accent/50 dark:text-brand-cream/40">
                                <Phone className="w-3 h-3" />
                                <span className="font-mono tracking-tight">{member.user.phoneNumber}</span>
                            </span>
                            {member.user.email && (
                                <span className="inline-flex items-center gap-1.5 text-[12px] text-brand-accent/50 dark:text-brand-cream/40 truncate">
                                    <Mail className="w-3 h-3 shrink-0" />
                                    <span className="truncate">{member.user.email}</span>
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Right side: Role + Status */}
                    <div className="shrink-0 flex flex-col items-end gap-2">
                        {/* Role chip */}
                        <div className={cn(
                            "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-[0.15em]",
                            isOwner
                                ? "bg-linear-to-r from-brand-gold/15 to-brand-gold/5 text-brand-gold border border-brand-gold/20"
                                : member.role === 'ACCOUNTANT'
                                    ? "bg-brand-deep/5 text-brand-deep/70 border border-brand-deep/10 dark:bg-white/5 dark:text-brand-cream/60 dark:border-white/8"
                                    : "bg-brand-accent/5 text-brand-accent/60 border border-brand-accent/10 dark:bg-white/5 dark:text-brand-cream/50 dark:border-white/8"
                        )}>
                            {isOwner && <Shield className="w-3 h-3" />}
                            {roleLabels[member.role] || member.role}
                        </div>

                        {/* Status badge */}
                        <div className={cn(
                            "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-semibold",
                            isActive && "text-emerald-700/70 dark:text-emerald-400/60",
                            isPending && "text-amber-600/70 dark:text-amber-400/60"
                        )}>
                            {isPending ? (
                                <>
                                    <Clock className="w-3 h-3" />
                                    <span>Awaiting login</span>
                                </>
                            ) : (
                                <>
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                    <span>Active</span>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    )
}
