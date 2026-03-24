"use client"

import React, { useState } from "react"
import { motion } from "framer-motion"
import {
    Drawer,
    DrawerContent,
    DrawerStickyHeader,
    DrawerBody,
    DrawerTitle,
    DrawerDescription,
    DrawerFooter
} from "@/app/components/ui/drawer"
import { Button } from "@/app/components/ui/button"
import {
    CheckCircle2,
    Clock,
    Phone,
    Mail,
    ExternalLink,
    Shield,
    Copy,
    Check,
} from "lucide-react"
import { cn } from "@/app/lib/utils"
import { OnboardedBusiness } from "@/app/domains/field-agent/hooks/useFieldAgentBusinesses"
import { useFieldAgentWallet } from "@/app/domains/field-agent/hooks/useFieldAgentWallet"
import { formatCurrency } from "@/app/lib/formatters"

interface MerchantDetailsDrawerProps {
    business: OnboardedBusiness | null
    isOpen: boolean
    onOpenChange: (open: boolean) => void
}

export function MerchantDetailsDrawer({ business, isOpen, onOpenChange }: MerchantDetailsDrawerProps) {
    const { data: wallet } = useFieldAgentWallet()
    const currency = wallet?.currency ?? 'NGN'
    const fmt = (val: number) => formatCurrency(val, { currency })
    const [copied, setCopied] = useState(false)

    const handleCopy = () => {
        if (!business?.shortCode) return
        navigator.clipboard.writeText(business.shortCode)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    if (!business) return null

    return (
        <Drawer open={isOpen} onOpenChange={onOpenChange}>
            <DrawerContent>
                <DrawerStickyHeader>
                    <div className="flex items-center gap-4">
                        <div className={cn(
                            "w-12 h-12 rounded-2xl flex items-center justify-center shrink-0",
                            business.status === 'active' ? "bg-green-500/10 text-green-600" : "bg-brand-gold/10 text-brand-gold"
                        )}>
                            {business.status === 'active' ? <CheckCircle2 className="w-6 h-6" /> : <Clock className="w-6 h-6" />}
                        </div>
                        <div className="flex-1 min-w-0">
                            <DrawerTitle>{business.name}</DrawerTitle>
                            <div className="flex items-center gap-2 mt-1.5">
                                <span className={cn(
                                    "px-1.5 py-0.5 rounded text-[10px] font-black uppercase tracking-widest shrink-0",
                                    business.status === 'active' ? "bg-green-500/10 text-green-600" : "bg-brand-gold/10 text-brand-gold"
                                )}>
                                    {business.status}
                                </span>
                                {business.shortCode && (
                                    <button
                                        onClick={handleCopy}
                                        className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-brand-deep/5 dark:bg-white/5 hover:bg-brand-deep/10 dark:hover:bg-white/10 transition-colors group"
                                    >
                                        <span className="text-[10px] font-mono font-bold text-brand-deep/50 dark:text-brand-cream/50 uppercase tracking-wider">
                                            {business.shortCode}
                                        </span>
                                        {copied
                                            ? <Check className="w-3 h-3 text-green-500 shrink-0" />
                                            : <Copy className="w-3 h-3 text-brand-deep/20 dark:text-brand-cream/20 group-hover:text-brand-deep/50 dark:group-hover:text-brand-cream/50 shrink-0 transition-colors" />
                                        }
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </DrawerStickyHeader>

                <DrawerBody className="space-y-8">
                    {/* Key Metrics Grid */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-5 rounded-3xl bg-brand-gold/5 border border-brand-gold/10 space-y-1">
                            <p className="text-[10px] font-black text-brand-gold uppercase tracking-widest">Commission Earned</p>
                            <p className="text-3xl font-serif font-medium text-brand-gold">
                                {fmt(business.earnings)}
                            </p>
                        </div>
                        <div className="p-5 rounded-3xl bg-brand-deep/5 dark:bg-white/5 border border-brand-deep/5 dark:border-white/5 space-y-1">
                            <p className="text-[10px] font-black text-brand-deep/30 dark:text-brand-cream/30 uppercase tracking-widest">Total Sales</p>
                            <p className="text-3xl font-serif font-medium text-brand-deep/80 dark:text-brand-cream/80">
                                {fmt(0)}
                            </p>
                        </div>
                    </div>

                    {/* Merchant Profile */}
                    <section className="space-y-4">
                        <h5 className="text-[10px] font-black text-brand-deep/30 dark:text-brand-cream/30 uppercase tracking-[0.2em] px-1">Merchant Profile</h5>
                        <div className="grid grid-cols-1 gap-3">
                            <div className="flex items-center gap-4 p-4 rounded-2xl border border-brand-deep/5 bg-white/50 dark:bg-white/5">
                                <div className="p-2 bg-brand-deep/5 dark:bg-white/5 rounded-lg text-brand-deep/40 dark:text-brand-cream/40">
                                    <Shield className="w-4 h-4" />
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-brand-deep/80 dark:text-brand-cream/80">{business.ownerName}</p>
                                    <p className="text-[10px] text-brand-deep/40 dark:text-brand-cream/40 uppercase tracking-wider font-bold">Business Owner</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4 p-4 rounded-2xl border border-brand-deep/5 bg-white/50 dark:bg-white/5">
                                <div className="p-2 bg-brand-deep/5 dark:bg-white/5 rounded-lg text-brand-deep/40 dark:text-brand-cream/40">
                                    <Phone className="w-4 h-4" />
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-brand-deep/80 dark:text-brand-cream/80">{business.phone}</p>
                                    <p className="text-[10px] text-brand-deep/40 dark:text-brand-cream/40 uppercase tracking-wider font-bold">Contact Number</p>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Onboarding Timeline Journey */}
                    <section className="space-y-6 relative">
                        <div className="px-1 mb-6">
                            <h5 className="text-[10px] font-black text-brand-deep/30 dark:text-brand-cream/30 uppercase tracking-[0.4em]">Onboarding Journey</h5>
                            <p className="text-[10px] text-brand-deep/50 dark:text-brand-cream/50 mt-1 font-bold tracking-widest">Commission Milestones Map</p>
                        </div>

                        <div className="relative pl-1 pr-1 pb-4">
                            {/* The vertical track line */}
                            <div className="absolute left-[25px] top-[14px] bottom-10 w-0.5 bg-brand-deep/5 dark:bg-white/10" />

                            <div className="space-y-10">
                                {/* Stage 1: Foundation */}
                                <TimelineStage
                                    title="Foundation"
                                    description="Initial business setup and security"
                                >
                                    <MilestoneRow
                                        done
                                        label="Business Onboarded"
                                        detail={`${new Date(business.onboardedAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })} · ${new Date(business.onboardedAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`}
                                        isFirst
                                    />
                                    <MilestoneRow
                                        done={business.milestones.countrySet}
                                        label="Country Configured"
                                        detail="Business operating region established"
                                        active={!business.milestones.countrySet}
                                    />
                                    <MilestoneRow
                                        done={business.milestones.pinSet}
                                        label="Security PIN Created"
                                        detail="Merchant set their transaction PIN"
                                        active={business.milestones.countrySet && !business.milestones.pinSet}
                                    />
                                </TimelineStage>

                                {/* Stage 2: Growth */}
                                <TimelineStage
                                    title="Expansion"
                                    description="Active engagement and monetization"
                                >
                                    <MilestoneRow
                                        done={business.milestones.productsAdded}
                                        label="Product Catalog Ready"
                                        detail={`Added ${business.milestones.minProductsRequired}+ active items`}
                                        active={business.milestones.pinSet && !business.milestones.productsAdded}
                                    />
                                    <MilestoneRow
                                        done={business.milestones.subscribed}
                                        label="Premium Activation"
                                        detail="Merchant upgrade to a paid plan"
                                        active={business.milestones.productsAdded && !business.milestones.subscribed}
                                        isLast
                                    />
                                </TimelineStage>
                            </div>
                        </div>
                    </section>
                </DrawerBody>

                <DrawerFooter className="bg-brand-deep/5 dark:bg-white/5 flex-row gap-3">
                    <Button variant="outline" className="flex-1 rounded-2xl h-12 bg-white/50 dark:bg-white/5 hover:bg-white dark:hover:bg-white/10 transition-all font-bold group">
                        <Mail className="w-4 h-4 mr-2 text-brand-deep/40 group-hover:text-brand-gold" />
                        Send Receipt
                    </Button>
                    <Button className="flex-1 rounded-2xl h-12 bg-brand-deep hover:bg-brand-deep/90 text-white font-bold group">
                        <ExternalLink className="w-4 h-4 mr-2" />
                        View Live
                    </Button>
                </DrawerFooter>
            </DrawerContent>
        </Drawer>
    )
}

function TimelineStage({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
    return (
        <div className="space-y-4">
            <div className="flex items-center gap-3 pl-[16px]">
                <div className="w-3 h-3 rounded-full bg-brand-gold/10 border border-brand-gold/20 flex items-center justify-center">
                    <div className="w-1 h-1 rounded-full bg-brand-gold" />
                </div>
                <div>
                    <h6 className="text-[11px] font-black text-brand-deep/80 dark:text-brand-cream/80 uppercase tracking-[0.2em]">{title}</h6>
                    <p className="text-[9px] text-brand-deep/30 dark:text-brand-cream/30 italic">{description}</p>
                </div>
            </div>
            <div className="space-y-3">
                {children}
            </div>
        </div>
    )
}

function MilestoneRow({
    done,
    label,
    detail,
    active,
    isFirst,
    isLast
}: {
    done: boolean;
    label: string;
    detail: string;
    active?: boolean;
    isFirst?: boolean;
    isLast?: boolean;
}) {
    return (
        <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-start gap-4 group relative"
        >
            {/* Connection visualization */}
            <div className="relative mt-1">
                <div className={cn(
                    "w-11 h-11 rounded-full flex items-center justify-center shrink-0 border-2 transition-all duration-500 relative z-10",
                    done
                        ? "bg-green-600 border-green-600 shadow-lg shadow-green-600/20 text-white"
                        : active
                            ? "bg-brand-gold/10 border-brand-gold text-brand-gold animate-pulse"
                            : "bg-white dark:bg-white/5 border-brand-deep/5 dark:border-white/10 text-brand-deep/10 dark:text-brand-cream/10"
                )}>
                    {done ? (
                        <Check className="w-5 h-5 stroke-3" />
                    ) : (
                        <span className="text-[10px] font-black">{active ? "!!" : "..."}</span>
                    )}
                </div>

                {/* Active indicator ping */}
                {active && (
                    <motion.div
                        initial={{ scale: 1, opacity: 0.5 }}
                        animate={{ scale: 1.5, opacity: 0 }}
                        transition={{ repeat: Infinity, duration: 2 }}
                        className="absolute inset-0 bg-brand-gold rounded-2xl z-0"
                    />
                )}
            </div>

            <div className={cn(
                "flex-1 p-4 rounded-2xl border transition-all duration-300",
                done
                    ? "bg-green-500/5 border-green-500/10"
                    : active
                        ? "bg-brand-gold/3 border-brand-gold/20 shadow-xl shadow-brand-gold/5"
                        : "bg-brand-deep/3 dark:bg-white/3 border-brand-deep/5 dark:border-white/5"
            )}>
                <div className="flex items-center justify-between gap-2">
                    <p className={cn(
                        "text-xs font-bold transition-colors",
                        done ? "text-brand-deep dark:text-brand-cream" : active ? "text-brand-gold" : "text-brand-deep/40 dark:text-brand-cream/40"
                    )}>
                        {label}
                    </p>
                    {done && (
                        <span className="text-[8px] font-black text-green-600 bg-green-500/10 px-1.5 py-0.5 rounded-full uppercase tracking-tighter">Verified</span>
                    )}
                </div>
                <p className="text-[10px] text-brand-deep/30 dark:text-brand-cream/30 mt-1 font-medium leading-tight">
                    {detail}
                </p>
            </div>
        </motion.div>
    )
}
