"use client"

import { useState, useEffect } from "react"
import { MapPin, Loader2, ShieldCheck, Briefcase, Home, CheckCircle2, AlertTriangle } from "lucide-react"
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
        <div className="flex items-center gap-3 px-4 py-3 rounded-2xl border transition-colors">
            {locating && (
                <>
                    <Loader2 className="w-4 h-4 animate-spin text-brand-gold shrink-0" />
                    <p className="text-[11px] text-brand-deep/60 dark:text-brand-cream/60">
                        Requesting location access — please allow when prompted…
                    </p>
                </>
            )}
            {!locating && coords && (
                <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <p className="text-[11px] font-mono text-brand-deep/70 dark:text-brand-cream/70">
                        {coords.lat.toFixed(6)}, {coords.lng.toFixed(6)}
                    </p>
                </>
            )}
            {!locating && denied && (
                <>
                    <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
                    <p className="text-[11px] text-red-500">
                        Location access denied. Enable it in your browser settings and reopen this form.
                    </p>
                </>
            )}
        </div>
    )
}

export function VerificationLevelForm({
    level,
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
        <div className="w-full space-y-6">
            {type === "BVN" && (
                <div className="space-y-4">
                    <div className="flex items-center gap-3 text-brand-gold">
                        <ShieldCheck className="w-5 h-5" />
                        <span className="text-sm font-serif">Identity Authentication</span>
                    </div>
                    <Input
                        inputMode="numeric"
                        value={bvn}
                        onChange={(e) => onBvnChange(e.target.value)}
                        placeholder="00000000000"
                        autoFocus
                        maxLength={11}
                        className="h-16 md:h-20 bg-white/50 dark:bg-white/5 border-brand-gold/20 rounded-[24px] font-mono text-center tracking-[0.4em] text-xl md:text-2xl focus:ring-brand-gold/10 focus:border-brand-gold/40 transition-all"
                    />
                    <p className="text-[10px] text-center text-brand-deep/40 dark:text-brand-cream/40 px-4 uppercase tracking-widest font-bold">
                        Secure 11-digit Bank Verification Number
                    </p>
                </div>
            )}

            {type === "GOVT_ID" && (
                <div className="space-y-4">
                    <DocumentUpload
                        label="Government Issued ID"
                        description="Upload a clear photo of your National ID, Driver's License or International Passport"
                        onFileSelect={onFileSelect}
                        isPending={isPending}
                    />
                </div>
            )}

            {type === "ADDRESS" && (
                <div className="space-y-4">
                    <div className="flex items-center gap-3 text-brand-gold">
                        <MapPin className="w-5 h-5" />
                        <span className="text-sm font-serif">Business Residency</span>
                    </div>
                    <LocationPicker onCoordinatesChange={onCoordinatesChange} />
                    <div className="relative group">
                        <Input
                            value={address}
                            onChange={(e) => onAddressChange(e.target.value)}
                            placeholder="Physical Business Address"
                            className="h-16 md:h-20 pl-6 bg-white/50 dark:bg-white/5 border-brand-gold/20 rounded-[24px] focus:ring-brand-gold/10 focus:border-brand-gold/40 transition-all text-base"
                        />
                    </div>
                    <p className="text-[10px] text-brand-deep/40 dark:text-brand-cream/40 px-4 uppercase tracking-widest font-bold">
                        Ensure this matches your utility bill or registration
                    </p>
                </div>
            )}

            {type === "OWNER_ADDRESS" && (
                <div className="space-y-4">
                    <div className="flex items-center gap-3 text-brand-gold">
                        <Home className="w-5 h-5" />
                        <span className="text-sm font-serif">Personal Residence</span>
                    </div>
                    <LocationPicker onCoordinatesChange={onCoordinatesChange} />
                    <div className="relative group">
                        <Input
                            value={address}
                            onChange={(e) => onAddressChange(e.target.value)}
                            placeholder="Home Address"
                            className="h-16 md:h-20 pl-6 bg-white/50 dark:bg-white/5 border-brand-gold/20 rounded-[24px] focus:ring-brand-gold/10 focus:border-brand-gold/40 transition-all text-base"
                        />
                    </div>
                    <DocumentUpload
                        label="Proof of Residence"
                        description="Upload a utility bill, bank statement, or tenancy agreement showing your home address"
                        onFileSelect={onFileSelect}
                        isPending={isPending}
                    />
                    <p className="text-[10px] text-brand-deep/40 dark:text-brand-cream/40 px-1 uppercase tracking-widest font-bold">
                        Document must not be older than 3 months
                    </p>
                </div>
            )}

            {type === "REGISTRATION_DOCS" && (
                <div className="space-y-6">
                    <div className="flex items-center gap-3 text-brand-gold">
                        <Briefcase className="w-5 h-5" />
                        <span className="text-sm font-serif">Business Registration Documents</span>
                    </div>
                    <DocumentUpload
                        label="CAC Certificate"
                        description="Upload your Corporate Affairs Commission certificate of incorporation"
                        onFileSelect={(f) => onRegDocChange('cac', f)}
                        isPending={isPending}
                    />
                    <DocumentUpload
                        label="MEMART"
                        description="Upload the Memorandum and Articles of Association"
                        onFileSelect={(f) => onRegDocChange('mermat', f)}
                        isPending={isPending}
                    />
                    <DocumentUpload
                        label="Status Report"
                        description="Upload a current status report from CAC (not older than 3 months)"
                        onFileSelect={(f) => onRegDocChange('statusReport', f)}
                        isPending={isPending}
                    />
                    <p className="text-[10px] text-brand-deep/40 dark:text-brand-cream/40 px-1 uppercase tracking-widest font-bold">
                        All three documents are required. JPG, PNG or PDF • Max 5MB each
                    </p>
                </div>
            )}

            <div className="flex flex-col md:flex-row items-center gap-3 pt-2">
                <Button
                    onClick={onSubmit}
                    disabled={isPending}
                    className="w-full md:flex-1 h-14 md:h-16 rounded-[20px] bg-brand-gold px-8 hover:bg-brand-gold/90 text-brand-deep font-bold uppercase tracking-widest hover:shadow-[0_12px_32px_rgba(212,175,55,0.2)] active:scale-[0.98] transition-all"
                >
                    {isPending ? (
                        <div className="flex items-center justify-center gap-2">
                            <Loader2 className="w-5 h-5 animate-spin" />
                            <span>Processing...</span>
                        </div>
                    ) : (
                        "Confirm & Submit"
                    )}
                </Button>
                <Button
                    variant="ghost"
                    onClick={onCancel}
                    disabled={isPending}
                    className="w-full md:w-auto h-14 md:h-16 px-6 md:px-8 rounded-[20px] text-brand-deep/40 dark:text-brand-cream/40 hover:bg-brand-deep/5 dark:hover:bg-white/5 font-bold uppercase tracking-widest text-xs"
                >
                    Cancel
                </Button>
            </div>
        </div>
    )
}
