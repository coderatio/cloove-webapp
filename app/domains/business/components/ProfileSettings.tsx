"use client"

import { useState, useEffect } from "react"
import { GlassCard } from "@/app/components/ui/glass-card"
import { Button } from "@/app/components/ui/button"
import { Input } from "@/app/components/ui/input"
import {
    User,
    Lock,
    Smartphone,
    Mail,
    Save,
    Loader2,
    ShieldCheck,
} from "lucide-react"
import { toast } from "sonner"
import {
    Drawer,
    DrawerContent,
    DrawerStickyHeader,
    DrawerTitle,
    DrawerDescription,
} from "@/app/components/ui/drawer"
import { useAuth } from "@/app/components/providers/auth-provider"
import { useUpdateProfile, useSettings } from "../hooks/useBusinessSettings"
import { useDepositAccounts } from "@/app/domains/finance/hooks/useFinance"
import { cn } from "@/app/lib/utils"

export function ProfileSettings() {
    const [isEditing, setIsEditing] = useState(false)
    const { user, refreshUser } = useAuth()
    const updateProfile = useUpdateProfile()
    const { data: settings } = useSettings()
    const { depositData } = useDepositAccounts()

    // BVN is verified at Level 1 — name must not be editable
    const bvnVerified = (depositData?.verificationLevel ?? 0) >= 1

    const [formData, setFormData] = useState({
        fullName: user?.fullName || "",
        email: user?.email || "",
    })

    useEffect(() => {
        if (user) {
            setFormData({
                fullName: user.fullName || "",
                email: user.email || "",
            })
        }
    }, [user])

    const handleSave = () => {
        const payload: { fullName?: string; email?: string } = {}

        if (!bvnVerified) {
            payload.fullName = formData.fullName
        }

        // Only send email if it's newly added (user had none before)
        if (formData.email && !user?.email) {
            payload.email = formData.email
        }

        updateProfile.mutate(payload, {
            onSuccess: async () => {
                setIsEditing(false)
                await refreshUser()
            },
        })
    }

    const emailLocked = !!user?.email  // once set, can't be changed from here
    const emailVerified = user?.emailVerified === true

    return (
        <>
            <div className="space-y-8">
                <section className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="font-serif text-xl text-brand-deep dark:text-brand-cream pl-1">Account Details</h2>
                        <Button
                            onClick={() => setIsEditing(true)}
                            variant="outline"
                            className="rounded-xl px-4 text-xs font-bold border-brand-deep/5 hover:bg-brand-deep/5 dark:border-white/10 dark:hover:bg-white/5"
                        >
                            Edit Profile
                        </Button>
                    </div>

                    <GlassCard className="p-6 space-y-6">
                        <div className="grid md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-brand-accent/40 dark:text-white/40">Full Name</label>
                                <Input value={formData.fullName} readOnly className="h-10 rounded-xl bg-brand-deep/5 dark:bg-white/5 border-transparent" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-brand-accent/40 dark:text-white/40">Email Address</label>
                                <div className="flex items-center gap-2">
                                    <Input
                                        value={formData.email || "Not set"}
                                        readOnly
                                        className="h-10 rounded-xl bg-brand-deep/5 dark:bg-white/5 border-transparent opacity-60"
                                    />
                                    {emailLocked && <Lock className="w-4 h-4 shrink-0 text-brand-deep/30 dark:text-white/30" />}
                                </div>
                            </div>
                        </div>
                    </GlassCard>
                </section>
            </div>

            <Drawer open={isEditing} onOpenChange={setIsEditing}>
                <DrawerContent>
                    <DrawerStickyHeader>
                        <DrawerTitle>Edit Profile</DrawerTitle>
                        <DrawerDescription>Update your personal information.</DrawerDescription>
                    </DrawerStickyHeader>

                    <div className="p-6 space-y-5 pb-40">
                        {/* Full Name — locked when BVN is verified */}
                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase tracking-widest text-brand-accent/60 dark:text-white/60">
                                Full Name
                            </label>
                            <div className="relative">
                                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-brand-accent/40" />
                                <Input
                                    value={formData.fullName}
                                    onChange={(e) => !bvnVerified && setFormData({ ...formData, fullName: e.target.value })}
                                    readOnly={bvnVerified}
                                    className={cn(
                                        "pl-12 h-14 rounded-2xl text-lg border-brand-deep/10 dark:border-white/10 dark:text-brand-cream",
                                        bvnVerified
                                            ? "bg-brand-deep/5 dark:bg-white/5 border-transparent opacity-60 cursor-not-allowed"
                                            : "bg-transparent"
                                    )}
                                />
                                {bvnVerified && (
                                    <ShieldCheck className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-emerald-500/60" />
                                )}
                            </div>
                            {bvnVerified && (
                                <p className="text-[11px] text-emerald-600/70 dark:text-emerald-400/70 pl-1">
                                    Locked — populated from your verified BVN.
                                </p>
                            )}
                        </div>

                        {/* Phone Number — always locked */}
                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase tracking-widest text-brand-accent/60 dark:text-white/60">
                                Phone Number
                            </label>
                            <div className="relative">
                                <Smartphone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-brand-accent/40" />
                                <Input
                                    value={user?.phoneNumber || ""}
                                    readOnly
                                    className="pl-12 pr-12 h-14 rounded-2xl text-lg bg-brand-deep/5 dark:bg-white/5 border-transparent opacity-60 cursor-not-allowed dark:text-brand-cream"
                                />
                                <Lock className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-brand-deep/30 dark:text-white/30" />
                            </div>
                        </div>

                        {/* Email — editable only if not yet set */}
                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase tracking-widest text-brand-accent/60 dark:text-white/60">
                                Email Address
                            </label>
                            <div className="relative">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-brand-accent/40" />
                                <Input
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => !emailLocked && setFormData({ ...formData, email: e.target.value })}
                                    readOnly={emailLocked}
                                    placeholder={emailLocked ? undefined : "Enter your email address"}
                                    className={cn(
                                        "pl-12 pr-12 h-14 rounded-2xl text-lg border-brand-deep/10 dark:border-white/10 dark:text-brand-cream",
                                        emailLocked
                                            ? "bg-brand-deep/5 dark:bg-white/5 border-transparent opacity-60 cursor-not-allowed"
                                            : "bg-transparent"
                                    )}
                                />
                                {emailLocked && (
                                    emailVerified
                                        ? <ShieldCheck className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-emerald-500/60" />
                                        : <Lock className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-brand-deep/30 dark:text-white/30" />
                                )}
                            </div>
                            {emailLocked && !emailVerified && (
                                <p className="text-[11px] text-amber-600/80 dark:text-amber-400/80 pl-1">
                                    Email not yet verified. Check your inbox for the verification link.
                                </p>
                            )}
                            {emailLocked && (
                                <p className="text-[11px] text-brand-deep/40 dark:text-white/40 pl-1">
                                    To change your email, please contact support.
                                </p>
                            )}
                        </div>

                        {/* Info banner — only when phone is the only locked item */}
                        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-sm flex gap-3">
                            <Lock className="w-5 h-5 shrink-0 mt-0.5" />
                            <p>To update your phone number, please contact support for security verification.</p>
                        </div>
                    </div>

                    <div className="p-6 border-t border-brand-deep/5 dark:border-white/5 bg-brand-cream dark:bg-[#021a12]">
                        <Button
                            onClick={handleSave}
                            disabled={updateProfile.isPending}
                            className="w-full h-14 rounded-2xl bg-brand-deep text-brand-gold dark:bg-brand-gold dark:text-brand-deep font-bold text-lg shadow-xl hover:scale-[1.02] active:scale-95 transition-all"
                        >
                            {updateProfile.isPending ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <>
                                    <Save className="w-5 h-5 mr-2" />
                                    Save Changes
                                </>
                            )}
                        </Button>
                    </div>
                </DrawerContent>
            </Drawer>
        </>
    )
}
