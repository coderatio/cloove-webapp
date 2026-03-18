"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { MapPin, Loader2, ShieldCheck, Briefcase, Home, CheckCircle2, AlertTriangle, Fingerprint } from "lucide-react"
import { Input } from "@/app/components/ui/input"
import { Button } from "@/app/components/ui/button"
import { DocumentUpload } from "./DocumentUpload"
import { VerificationTypeEnum } from "../../data/type"
import { cn } from "@/app/lib/utils"

interface RegDocs {
    cac: File | null
    mermat: File | null
    statusReport: File | null
}

export interface Coordinates {
    lat: number
    lng: number
}

interface VerificationLevelFormProps {
    level: number
    type: VerificationTypeEnum
    bvn: string
    onBvnChange: (value: string) => void
    address: string
    onAddressChange: (value: string) => void
    onFileSelect: (file: File | null) => void
    regDocs: RegDocs
    onRegDocChange: (key: keyof RegDocs, file: File | null) => void
    onCoordinatesChange: (coords: Coordinates | null) => void
    onSubmit: () => void
    onCancel: () => void
    isPending: boolean
}

function LocationPicker({ onCoordinatesChange }: { onCoordinatesChange: (coords: Coordinates | null) => void }) {
    const [coords, setCoords] = useState<Coordinates | null>(null)
    const [locating, setLocating] = useState(true)
    const [denied, setDenied] = useState(false)

    useEffect(() => {
        if (!navigator.geolocation) {
            setLocating(false)
            setDenied(true)
            return
        }
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const result = { lat: position.coords.latitude, lng: position.coords.longitude }
                setCoords(result)
                onCoordinatesChange(result)
                setLocating(false)
            },
            () => {
                setDenied(true)
                setLocating(false)
            },
            { enableHighAccuracy: true, timeout: 10000 }
        )
    }, [])

    return (
        <div className={cn(
            "flex items-center gap-4 px-5 py-4 rounded-2xl border transition-all duration-500 bg-white/40 dark:bg-white/[0.02] backdrop-blur-sm",
            locating ? "border-brand-gold/20 animate-pulse" : 
            coords ? "border-emerald-500/20 shadow-[0_0_20px_rgba(16,185,129,0.05)]" : 
            "border-red-500/20 bg-red-500/[0.02]"
        )}>
            <AnimatePresence mode="wait">
                {locating && (
                    <motion.div 
                        key="locating"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="flex items-center gap-3"
                    >
                        <div className="w-8 h-8 rounded-full bg-brand-gold/10 flex items-center justify-center shrink-0">
                            <Loader2 className="w-4 h-4 animate-spin text-brand-gold" />
                        </div>
                        <p className="text-[11px] font-bold uppercase tracking-widest text-brand-gold">
                            Acquiring Satellite Lock...
                        </p>
                    </motion.div>
                )}
                {!locating && coords && (
                    <motion.div 
                        key="coords"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-center gap-3"
                    >
                        <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0">
                            <MapPin className="w-4 h-4 text-emerald-500" />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[9px] font-bold uppercase tracking-widest text-emerald-600/60 leading-none mb-1">Authenticated Position</span>
                            <p className="text-xs font-mono text-brand-deep/80 dark:text-brand-cream/80">
                                {coords.lat.toFixed(6)}° N, {coords.lng.toFixed(6)}° E
                            </p>
                        </div>
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 ml-auto" />
                    </motion.div>
                )}
                {!locating && denied && (
                    <motion.div 
                        key="denied"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="flex items-center gap-3 w-full"
                    >
                        <div className="w-8 h-8 rounded-full bg-red-500/10 flex items-center justify-center shrink-0">
                            <AlertTriangle className="w-4 h-4 text-red-500" />
                        </div>
                        <p className="text-[11px] font-medium text-red-500 uppercase tracking-tight">
                            Geospatial Authorization Denied
                        </p>
                        <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => window.location.reload()}
                            className="ml-auto h-8 text-[10px] uppercase font-bold text-red-500/60 hover:text-red-500 hover:bg-red-500/10"
                        >
                            Retry
                        </Button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}

export function VerificationLevelForm({
    type,
    bvn,
    onBvnChange,
    address,
    onAddressChange,
    onFileSelect,
    regDocs,
    onRegDocChange,
    onCoordinatesChange,
    onSubmit,
    onCancel,
    isPending
}: VerificationLevelFormProps) {
    return (
        <div className="w-full space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {type === "BVN" && (
                <div className="space-y-6">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-brand-gold/10 flex items-center justify-center text-brand-gold">
                            <Fingerprint className="w-5 h-5" />
                        </div>
                        <div>
                            <h4 className="text-sm font-serif text-brand-deep dark:text-brand-cream">Biometric Node Check</h4>
                            <p className="text-[10px] font-medium text-brand-deep/40 dark:text-brand-cream/40 uppercase tracking-widest">Bank Verification Number</p>
                        </div>
                    </div>
                    
                    <div className="relative group">
                        <Input
                            inputMode="numeric"
                            value={bvn}
                            onChange={(e) => onBvnChange(e.target.value)}
                            placeholder="000 000 000 00"
                            autoFocus
                            maxLength={11}
                            className="h-20 bg-brand-deep/[0.02] dark:bg-white/[0.04] border-brand-gold/10 hover:border-brand-gold/30 rounded-[28px] font-mono text-center tracking-[0.5em] text-2xl md:text-3xl focus:ring-brand-gold/5 focus:border-brand-gold/60 transition-all duration-500 placeholder:opacity-20 shadow-inner"
                        />
                        <div className="absolute inset-0 pointer-events-none rounded-[28px] ring-1 ring-inset ring-brand-gold/5 group-focus-within:ring-brand-gold/20 transition-all" />
                    </div>
                    
                    <p className="text-[10px] text-center text-brand-deep/30 dark:text-brand-cream/30 px-4 leading-relaxed font-sans italic">
                        By submitting, you authorize Cloove to perform a one-time validation through the Central Bank regulatory switch.
                    </p>
                </div>
            )}

            {type === "GOVT_ID" && (
                <div className="space-y-2">
                    <DocumentUpload
                        label="Sovereign Identification"
                        description="National Passport, Driver's License, or NIMC Card. High resolution scan required."
                        onFileSelect={onFileSelect}
                        isPending={isPending}
                    />
                </div>
            )}

            {type === "ADDRESS" && (
                <div className="space-y-6">
                    <div className="flex items-center gap-4">
                         <div className="w-10 h-10 rounded-xl bg-brand-gold/10 flex items-center justify-center text-brand-gold">
                            <MapPin className="w-5 h-5" />
                        </div>
                        <div>
                            <h4 className="text-sm font-serif text-brand-deep dark:text-brand-cream">Corporate Residency</h4>
                            <p className="text-[10px] font-medium text-brand-deep/40 dark:text-brand-cream/40 uppercase tracking-widest">Physical Operational Node</p>
                        </div>
                    </div>
                    
                    <LocationPicker onCoordinatesChange={onCoordinatesChange} />
                    
                    <div className="relative group">
                        <Input
                            value={address}
                            onChange={(e) => onAddressChange(e.target.value)}
                            placeholder="Full Operational Address"
                            className="h-16 pl-6 bg-brand-deep/[0.02] dark:bg-white/[0.04] border-brand-gold/10 rounded-[20px] focus:ring-brand-gold/5 focus:border-brand-gold/60 transition-all duration-500 font-sans text-base shadow-inner"
                        />
                    </div>
                </div>
            )}

            {type === "OWNER_ADDRESS" && (
                <div className="space-y-6">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-brand-gold/10 flex items-center justify-center text-brand-gold">
                            <Home className="w-5 h-5" />
                        </div>
                        <div>
                            <h4 className="text-sm font-serif text-brand-deep dark:text-brand-cream">Director Residency</h4>
                            <p className="text-[10px] font-medium text-brand-deep/40 dark:text-brand-cream/40 uppercase tracking-widest">Personal Permanent Hub</p>
                        </div>
                    </div>

                    <LocationPicker onCoordinatesChange={onCoordinatesChange} />
                    
                    <div className="relative">
                        <Input
                            value={address}
                            onChange={(e) => onAddressChange(e.target.value)}
                            placeholder="Home Address"
                            className="h-16 pl-6 bg-brand-deep/[0.02] dark:bg-white/[0.04] border-brand-gold/10 rounded-[20px] focus:ring-brand-gold/5 focus:border-brand-gold/60 transition-all font-sans text-base shadow-inner"
                        />
                    </div>

                    <div className="pt-2">
                        <DocumentUpload
                            label="Residential Oracle"
                            description="Utility bill, bank statement, or tenancy agreement (< 3 months old)"
                            onFileSelect={onFileSelect}
                            isPending={isPending}
                        />
                    </div>
                </div>
            )}

            {type === "REGISTRATION_DOCS" && (
                <div className="space-y-8">
                    <div className="flex items-center gap-4 border-b border-brand-deep/5 dark:border-white/5 pb-4">
                        <div className="w-10 h-10 rounded-xl bg-brand-gold/10 flex items-center justify-center text-brand-gold">
                            <Briefcase className="w-5 h-5" />
                        </div>
                        <div>
                            <h4 className="text-sm font-serif text-brand-deep dark:text-brand-cream">Institutional Artifacts</h4>
                            <p className="text-[10px] font-medium text-brand-deep/40 dark:text-brand-cream/40 uppercase tracking-widest">Regulatory Incorporation Docs</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-6">
                        <DocumentUpload
                            label="Certificate of Incorporation"
                            description="Corporate Affairs Commission official certificate"
                            onFileSelect={(f) => onRegDocChange('cac', f)}
                            isPending={isPending}
                        />
                        <DocumentUpload
                            label="MEMART"
                            description="Memorandum and Articles of Association"
                            onFileSelect={(f) => onRegDocChange('mermat', f)}
                            isPending={isPending}
                        />
                        <DocumentUpload
                            label="Entity Status Report"
                            description="Current CAC status validation report"
                            onFileSelect={(f) => onRegDocChange('statusReport', f)}
                            isPending={isPending}
                        />
                    </div>
                </div>
            )}

            <div className="flex flex-col md:flex-row items-center gap-4 pt-6">
                <Button
                    onClick={onSubmit}
                    disabled={isPending}
                    className="w-full md:flex-1 h-14 rounded-2xl bg-brand-gold px-8 hover:bg-brand-gold/90 text-brand-deep font-bold uppercase tracking-[0.2em] text-[11px] shadow-[0_8px_32px_rgba(212,175,55,0.15)] hover:shadow-[0_12px_48px_rgba(212,175,55,0.3)] hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-500"
                >
                    {isPending ? (
                        <div className="flex items-center justify-center gap-3">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>Validating Credentials...</span>
                        </div>
                    ) : (
                        "Submit Verification"
                    )}
                </Button>
                <Button
                    variant="ghost"
                    onClick={onCancel}
                    disabled={isPending}
                    className="w-full md:w-auto h-14 px-8 rounded-2xl text-brand-deep/30 dark:text-brand-cream/30 hover:bg-brand-deep/5 dark:hover:bg-white/5 font-bold uppercase tracking-widest text-[10px] transition-all duration-300"
                >
                    Return
                </Button>
            </div>
        </div>
    )
}
