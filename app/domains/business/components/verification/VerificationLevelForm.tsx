"use client"

import { MapPin, Loader2, ShieldCheck, FileText } from "lucide-react"
import { Input } from "@/app/components/ui/input"
import { Button } from "@/app/components/ui/button"
import { DocumentUpload } from "./DocumentUpload"
import { VerificationType } from "@/app/domains/business/hooks/use-verification"

interface VerificationLevelFormProps {
    level: number
    type: VerificationType
    bvn: string
    onBvnChange: (value: string) => void
    address: string
    onAddressChange: (value: string) => void
    onFileSelect: (file: File | null) => void
    onSubmit: () => void
    onCancel: () => void
    isPending: boolean
}

export function VerificationLevelForm({
    level,
    type,
    bvn,
    onBvnChange,
    address,
    onAddressChange,
    onFileSelect,
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

            <div className="flex items-center gap-3 pt-2">
                <Button
                    onClick={onSubmit}
                    disabled={isPending}
                    className="flex-1 h-14 md:h-16 rounded-[20px] bg-brand-gold px-8 hover:bg-brand-gold/90 text-brand-deep font-bold uppercase tracking-widest hover:shadow-[0_12px_32px_rgba(212,175,55,0.2)] active:scale-[0.98] transition-all"
                >
                    {isPending ? (
                        <div className="flex items-center gap-2">
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
                    className="h-14 md:h-16 px-6 md:px-8 rounded-[20px] text-brand-deep/40 dark:text-brand-cream/40 hover:bg-brand-deep/5 dark:hover:bg-white/5 font-bold uppercase tracking-widest text-xs"
                >
                    Cancel
                </Button>
            </div>
        </div>
    )
}
