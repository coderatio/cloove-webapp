"use client"

import React from "react"
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
    Calendar, 
    Phone, 
    Mail, 
    MapPin, 
    TrendingUp, 
    History,
    ExternalLink,
    Shield
} from "lucide-react"
import { cn } from "@/app/lib/utils"
import { OnboardedBusiness } from "@/app/domains/field-agent/providers/FieldAgentProvider"

interface MerchantDetailsDrawerProps {
    business: OnboardedBusiness | null
    isOpen: boolean
    onOpenChange: (open: boolean) => void
}

export function MerchantDetailsDrawer({ business, isOpen, onOpenChange }: MerchantDetailsDrawerProps) {
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
                            <DrawerDescription className="flex items-center gap-2 mt-1">
                                <span className={cn(
                                    "px-1.5 py-0.5 rounded text-[10px] font-black uppercase tracking-widest",
                                    business.status === 'active' ? "bg-green-500/10 text-green-600" : "bg-brand-gold/10 text-brand-gold"
                                )}>
                                    {business.status}
                                </span>
                                <span>·</span>
                                <span className="font-medium">BID: {business.id.toUpperCase()}</span>
                            </DrawerDescription>
                        </div>
                    </div>
                </DrawerStickyHeader>

                <DrawerBody className="space-y-8">
                    {/* Key Metrics Grid */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-5 rounded-3xl bg-brand-gold/5 border border-brand-gold/10 space-y-1">
                            <p className="text-[10px] font-black text-brand-gold uppercase tracking-widest">Commission Earned</p>
                            <p className="text-3xl font-serif font-medium text-brand-gold">
                                ₦{new Intl.NumberFormat().format(business.earnings)}
                            </p>
                        </div>
                        <div className="p-5 rounded-3xl bg-brand-deep/5 border border-brand-deep/5 space-y-1">
                            <p className="text-[10px] font-black text-brand-deep/30 uppercase tracking-widest">Total Sales</p>
                            <p className="text-3xl font-serif font-medium text-brand-deep/80">
                                ₦0.00
                            </p>
                        </div>
                    </div>

                    {/* Merchant Profile */}
                    <section className="space-y-4">
                        <h5 className="text-[10px] font-black text-brand-deep/30 uppercase tracking-[0.2em] px-1">Merchant Profile</h5>
                        <div className="grid grid-cols-1 gap-3">
                            <div className="flex items-center gap-4 p-4 rounded-2xl border border-brand-deep/5 bg-white/50 dark:bg-white/5">
                                <div className="p-2 bg-brand-deep/5 rounded-lg text-brand-deep/40">
                                    <Shield className="w-4 h-4" />
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-brand-deep/80">{business.ownerName}</p>
                                    <p className="text-[10px] text-brand-deep/40 uppercase tracking-wider font-bold">Business Owner</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4 p-4 rounded-2xl border border-brand-deep/5 bg-white/50 dark:bg-white/5">
                                <div className="p-2 bg-brand-deep/5 rounded-lg text-brand-deep/40">
                                    <Phone className="w-4 h-4" />
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-brand-deep/80">{business.phone}</p>
                                    <p className="text-[10px] text-brand-deep/40 uppercase tracking-wider font-bold">Contact Number</p>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Timeline */}
                    <section className="space-y-4">
                        <h5 className="text-[10px] font-black text-brand-deep/30 uppercase tracking-[0.2em] px-1 text-center">Onboarding Timeline</h5>
                        <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-brand-deep/5">
                            <div className="relative flex items-center gap-4">
                                <span className="absolute -left-5 w-2.5 h-2.5 rounded-full bg-green-500 ring-4 ring-green-500/10" />
                                <div>
                                    <p className="text-xs font-bold text-brand-deep/80">Approved & Verified</p>
                                    <p className="text-[10px] text-brand-deep/40 italic">System Auto-Verification Complete</p>
                                </div>
                            </div>
                            <div className="relative flex items-center gap-4">
                                <span className={cn(
                                    "absolute -left-5 w-2.5 h-2.5 rounded-full",
                                    business.status === 'active' ? "bg-green-500" : "bg-brand-gold animate-pulse"
                                )} />
                                <div>
                                    <p className="text-xs font-bold text-brand-deep/80">Onboarded by Agent</p>
                                    <p className="text-[10px] text-brand-deep/40 font-mono flex items-center gap-1 mt-0.5">
                                        <Calendar className="w-3 h-3" />
                                        {new Date(business.onboardedAt).toLocaleDateString()} · {new Date(business.onboardedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </section>
                </DrawerBody>

                <DrawerFooter className="bg-brand-deep/5 dark:bg-white/5 flex-row gap-3">
                    <Button variant="outline" className="flex-1 rounded-2xl h-12 bg-white/50 hover:bg-white transition-all font-bold group">
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
