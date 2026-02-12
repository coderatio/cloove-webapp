"use client"

import { useState } from "react"
import { GlassCard } from "@/app/components/ui/glass-card"
import { Button } from "@/app/components/ui/button"
import { Input } from "@/app/components/ui/input"
import { Switch } from "@/app/components/ui/switch"
import {
    User,
    Lock,
    Smartphone,
    Mail,
    Save,
    Loader2
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
import { useEffect } from "react"

export function ProfileSettings() {
    const [isEditing, setIsEditing] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const { user, refreshUser } = useAuth()

    // Form state
    const [formData, setFormData] = useState({
        fullName: user?.fullName || "",
        email: user?.email || "",
        phone: user?.phoneNumber || ""
    })

    // Sync form state when user changes
    useEffect(() => {
        if (user) {
            setFormData({
                fullName: user.fullName,
                email: user.email,
                phone: user.phoneNumber
            })
        }
    }, [user])

    const handleSave = () => {
        setIsLoading(true)
        // Simulate API call for now (backend profile update not yet implemented)
        setTimeout(async () => {
            setIsLoading(false)
            setIsEditing(false)
            await refreshUser()
            toast.success("Profile updated successfully")
        }, 1500)
    }

    return (
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
                                <Input value={formData.email} disabled className="h-10 rounded-xl bg-brand-deep/5 dark:bg-white/5 border-transparent opacity-60" />
                                <Lock className="w-4 h-4 text-brand-deep/30 dark:text-white/30" />
                            </div>
                        </div>
                    </div>
                </GlassCard>
            </section>

            <section className="space-y-4">
                <h2 className="font-serif text-xl text-brand-deep dark:text-brand-cream pl-1">Communication</h2>
                <GlassCard className="p-6 space-y-6">
                    <div className="grid md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-brand-accent/40 dark:text-white/40">WhatsApp Number</label>
                            <div className="relative">
                                <Smartphone className="absolute left-3 top-3 w-4 h-4 text-brand-accent/40" />
                                <Input value={formData.phone} readOnly className="pl-10 h-10 rounded-xl bg-brand-deep/5 dark:bg-white/5 border-transparent" />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-brand-accent/40 dark:text-white/40">System Notifications</label>
                            <div className="flex items-center justify-between h-10 px-1">
                                <div className="flex items-center gap-2">
                                    <Mail className="w-4 h-4 text-brand-deep/40 dark:text-brand-cream/60" />
                                    <span className="text-sm dark:text-brand-cream">Email Summaries</span>
                                </div>
                                <Switch defaultChecked />
                            </div>
                        </div>
                    </div>
                </GlassCard>
            </section>

            <Drawer open={isEditing} onOpenChange={setIsEditing}>
                <DrawerContent>
                    <DrawerStickyHeader>
                        <DrawerTitle>Edit Profile</DrawerTitle>
                        <DrawerDescription>Update your personal information.</DrawerDescription>
                    </DrawerStickyHeader>

                    <div className="p-6 space-y-6 pb-40">
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase tracking-widest text-brand-accent/60 dark:text-white/60">Full Name</label>
                                <Input
                                    value={formData.fullName}
                                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                                    className="h-14 rounded-2xl text-lg bg-transparent border-brand-deep/10 dark:border-white/10 dark:text-brand-cream"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase tracking-widest text-brand-accent/60 dark:text-white/60">Phone Number</label>
                                <div className="relative">
                                    <Smartphone className="absolute left-4 top-4.5 w-5 h-5 text-brand-accent/40" />
                                    <Input
                                        value={formData.phone}
                                        readOnly
                                        className="pl-12 h-14 rounded-2xl text-lg bg-brand-deep/5 dark:bg-white/5 border-transparent opacity-60 cursor-not-allowed dark:text-brand-cream"
                                    />
                                    <Lock className="absolute right-4 top-4.5 w-5 h-5 text-brand-deep/30 dark:text-white/30" />
                                </div>
                            </div>

                            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-sm flex gap-3">
                                <Lock className="w-5 h-5 shrink-0" />
                                <p>To update your email or phone number, please contact support for security verification.</p>
                            </div>
                        </div>
                    </div>

                    <div className="p-6 border-t border-brand-deep/5 dark:border-white/5 bg-brand-cream dark:bg-[#021a12]">
                        <Button
                            onClick={handleSave}
                            disabled={isLoading}
                            className="w-full h-14 rounded-2xl bg-brand-deep text-brand-gold dark:bg-brand-gold dark:text-brand-deep font-bold text-lg shadow-xl hover:scale-[1.02] active:scale-95 transition-all"
                        >
                            {isLoading ? (
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
        </div>
    )
}
