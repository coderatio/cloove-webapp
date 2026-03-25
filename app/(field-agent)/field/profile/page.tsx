"use client"

import React, { useState } from "react"
import { GlassCard } from "@/app/components/ui/glass-card"
import { Button } from "@/app/components/ui/button"
import { Input } from "@/app/components/ui/input"
import {
    User,
    Mail,
    Phone,
    Camera,
    Edit2,
    Check,
    X,
    Loader2
} from "lucide-react"
import { useAuth } from "@/app/components/providers/auth-provider"
import { useFieldAgentStats } from "@/app/domains/field-agent/hooks/useFieldAgentStats"
import { useFieldAgentWallet } from "@/app/domains/field-agent/hooks/useFieldAgentWallet"
import { formatCurrency } from "@/app/lib/formatters"
import { apiClient } from "@/app/lib/api-client"
import { toast } from "sonner"

export default function ProfilePage() {
    const { user, refreshUser } = useAuth()
    const { data: stats } = useFieldAgentStats()
    const { data: wallet } = useFieldAgentWallet()

    const displayName = user?.fullName ?? user?.firstName ?? "Agent"
    const initials = displayName.split(" ").map((n: string) => n[0]).slice(0, 2).join("").toUpperCase()
    const currency = wallet?.currency ?? 'NGN'
    const totalEarned = stats?.totalEarned ?? 0

    const [isEditing, setIsEditing] = useState(false)
    const [fullName, setFullName] = useState(displayName)
    const [isSaving, setIsSaving] = useState(false)

    const handleEdit = () => {
        setFullName(displayName)
        setIsEditing(true)
    }

    const handleCancel = () => {
        setIsEditing(false)
        setFullName(displayName)
    }

    const handleSave = async () => {
        if (!fullName.trim() || fullName.trim() === displayName) {
            setIsEditing(false)
            return
        }
        setIsSaving(true)
        try {
            await apiClient.patch("/field-agent/profile", { fullName: fullName.trim() })
            await refreshUser()
            toast.success("Profile updated")
            setIsEditing(false)
        } catch (err: any) {
            toast.error(err.message || "Failed to update profile")
        } finally {
            setIsSaving(false)
        }
    }

    return (
        <div className="space-y-8 pb-12 overflow-hidden">
            {/* Profile Header */}
            <GlassCard className="p-8 md:p-12 overflow-hidden relative">
                <div className="absolute top-0 right-0 w-64 h-64 bg-brand-gold/5 rounded-full -translate-y-32 translate-x-32 blur-3xl" />

                <div className="flex flex-col md:flex-row items-center gap-8 relative z-10">
                    <div className="relative group">
                        <div className="w-32 h-32 rounded-[40px] bg-linear-to-br from-brand-gold to-yellow-600 border-4 border-brand-cream dark:border-brand-deep shadow-2xl flex items-center justify-center text-4xl font-serif font-black text-brand-deep">
                            {initials}
                        </div>
                        <button className="absolute -bottom-2 -right-2 w-10 h-10 bg-brand-deep text-brand-cream rounded-2xl border-4 border-brand-cream dark:border-brand-deep flex items-center justify-center hover:scale-110 transition-transform">
                            <Camera className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="flex-1 text-center md:text-left">
                        {isEditing ? (
                            <div className="flex flex-col sm:flex-row items-center gap-3 mb-4">
                                <Input
                                    value={fullName}
                                    onChange={(e) => setFullName(e.target.value)}
                                    className="h-12 text-xl font-serif bg-transparent border-brand-deep/20 dark:border-white/20 max-w-xs"
                                    autoFocus
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') handleSave()
                                        if (e.key === 'Escape') handleCancel()
                                    }}
                                />
                                <div className="flex items-center gap-2">
                                    <Button
                                        onClick={handleSave}
                                        disabled={isSaving}
                                        size="sm"
                                        className="rounded-xl h-10 px-4 bg-brand-gold text-brand-deep font-bold"
                                    >
                                        {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                                    </Button>
                                    <Button
                                        onClick={handleCancel}
                                        disabled={isSaving}
                                        size="sm"
                                        variant="outline"
                                        className="rounded-xl h-10 px-4"
                                    >
                                        <X className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col md:flex-row md:items-center gap-4 mb-2">
                                <h2 className="text-3xl font-serif font-medium">{displayName}</h2>
                            </div>
                        )}
                        <p className="text-brand-deep/50 dark:text-brand-cream/50 max-w-lg mb-6">
                            Field Agent at Cloove. Helping merchants grow their business through digital financial inclusion.
                        </p>
                        {!isEditing && (
                            <div className="flex flex-wrap justify-center md:justify-start gap-4">
                                <Button
                                    onClick={handleEdit}
                                    className="rounded-2xl px-6 h-11 bg-brand-deep text-brand-cream dark:bg-brand-gold dark:text-brand-deep"
                                >
                                    <Edit2 className="w-4 h-4 mr-2" />
                                    Edit Profile
                                </Button>
                            </div>
                        )}
                    </div>

                    <div className="hidden lg:block">
                        <div className="p-6 bg-brand-deep/5 dark:bg-white/5 rounded-3xl border border-brand-deep/5 text-center min-w-[200px]">
                            <p className="text-[10px] uppercase tracking-widest font-black text-brand-deep/30 mb-1">Total Commissions</p>
                            <p className="text-2xl font-serif font-medium text-brand-gold">
                                {formatCurrency(totalEarned, { currency })}
                            </p>
                        </div>
                    </div>
                </div>
            </GlassCard>

            {/* Personal Information */}
            <GlassCard className="p-8">
                <h3 className="text-xl font-serif font-medium mb-8">Personal Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-widest text-brand-deep/40">Full Name</label>
                        <div className="relative">
                            <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-deep/30" />
                            <Input disabled value={user?.fullName ?? ""} className="pl-12 h-12 bg-transparent" />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-widest text-brand-deep/40">Email Address</label>
                        <div className="relative">
                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-deep/30" />
                            <Input disabled value={user?.email ?? ""} className="pl-12 h-12 bg-transparent" />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-widest text-brand-deep/40">Phone Number</label>
                        <div className="relative">
                            <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-deep/30" />
                            <Input disabled value={user?.phoneNumber ?? ""} className="pl-12 h-12 bg-transparent" />
                        </div>
                    </div>
                </div>

                <div className="mt-12 flex flex-col md:flex-row items-center justify-end gap-6">
                    <p className="text-xs text-brand-deep/40 dark:text-brand-cream/40 italic text-center md:text-right">To update restricted fields, please contact support.</p>
                    <Button variant="outline" className="w-full md:w-auto rounded-2xl px-8 h-12 border-brand-gold/30 text-brand-gold font-bold">
                        Request Identity Update
                    </Button>
                </div>
            </GlassCard>
        </div>
    )
}
