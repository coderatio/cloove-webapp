"use client"

import { useState } from "react"
import { GlassCard } from "@/app/components/ui/glass-card"
import { Button } from "@/app/components/ui/button"
import { Input } from "@/app/components/ui/input"
import {
    Lock,
    ExternalLink,
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

export function SecuritySettings() {
    const [isChangingPin, setIsChangingPin] = useState(false)
    const [isChangingPassword, setIsChangingPassword] = useState(false)
    const [isLoading, setIsLoading] = useState(false)

    // PIN State
    const [pinData, setPinData] = useState({ current: "", new: "", confirm: "" })
    // Password State
    const [passData, setPassData] = useState({ current: "", new: "", confirm: "" })

    const handlePinSave = () => {
        if (pinData.new !== pinData.confirm) {
            toast.error("New PINs do not match")
            return
        }
        if (pinData.new.length !== 4) {
            toast.error("PIN must be 4 digits")
            return
        }
        setIsLoading(true)
        setTimeout(() => {
            setIsLoading(false)
            setIsChangingPin(false)
            setPinData({ current: "", new: "", confirm: "" })
            toast.success("Transaction PIN updated successfully")
        }, 1500)
    }

    const handlePassSave = () => {
        if (passData.new !== passData.confirm) {
            toast.error("New passwords do not match")
            return
        }
        if (passData.new.length < 8) {
            toast.error("Password must be at least 8 characters")
            return
        }
        setIsLoading(true)
        setTimeout(() => {
            setIsLoading(false)
            setIsChangingPassword(false)
            setPassData({ current: "", new: "", confirm: "" })
            toast.success("Password updated successfully")
        }, 1500)
    }

    return (
        <div className="space-y-8">
            <section className="space-y-4">
                <h2 className="font-serif text-xl text-brand-deep dark:text-brand-cream pl-1">Access Control</h2>
                <GlassCard className="p-6 space-y-6">
                    <div className="flex items-center justify-between">
                        <div className="space-y-1">
                            <div className="flex items-center gap-2">
                                <Lock className="w-4 h-4 text-brand-deep dark:text-brand-cream" />
                                <span className="font-medium text-brand-deep dark:text-brand-cream">Transaction PIN</span>
                                <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 text-[10px] font-bold uppercase">Active</span>
                            </div>
                            <p className="text-xs text-brand-accent/60 dark:text-white/40">Required for withdrawals and sensitive actions.</p>
                        </div>
                        <Button
                            onClick={() => setIsChangingPin(true)}
                            variant="outline"
                            className="rounded-xl px-4 text-xs font-bold border-brand-deep/5 hover:bg-brand-deep/5 dark:border-white/10 dark:hover:bg-white/5"
                        >
                            Change PIN
                        </Button>
                    </div>
                    <div className="h-px bg-brand-deep/5 dark:bg-white/5" />
                    <div className="flex items-center justify-between">
                        <div className="space-y-1">
                            <span className="font-medium text-brand-deep dark:text-brand-cream">Password</span>
                            <p className="text-xs text-brand-accent/60 dark:text-white/40">Last changed 3 months ago.</p>
                        </div>
                        <Button
                            onClick={() => setIsChangingPassword(true)}
                            variant="outline"
                            className="rounded-xl px-4 text-xs font-bold border-brand-deep/5 hover:bg-brand-deep/5 dark:border-white/10 dark:hover:bg-white/5"
                        >
                            Update Password
                        </Button>
                    </div>
                </GlassCard>
            </section>

            <section className="space-y-4">
                <h2 className="font-serif text-xl text-brand-deep dark:text-brand-cream pl-1">Audit & Devices</h2>
                <GlassCard className="p-6 space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                        <div className="flex items-center justify-between text-sm p-4 bg-white/50 dark:bg-white/5 rounded-xl border border-brand-deep/5 dark:border-white/5">
                            <span className="text-brand-deep/60 dark:text-brand-cream/60">Current Session</span>
                            <span className="font-medium text-brand-deep dark:text-brand-cream">Lagos, Nigeria</span>
                        </div>
                        <div className="flex items-center justify-between text-sm p-4 bg-white/50 dark:bg-white/5 rounded-xl border border-brand-deep/5 dark:border-white/5">
                            <span className="text-brand-deep/60 dark:text-brand-cream/60">Browser</span>
                            <span className="font-medium text-brand-deep dark:text-brand-cream">Chrome on MacOS</span>
                        </div>
                    </div>
                    <Button variant="ghost" className="w-full text-brand-deep dark:text-brand-gold text-xs font-bold mt-2">
                        View All Activity <ExternalLink className="w-3 h-3 ml-2" />
                    </Button>
                </GlassCard>
            </section>

            {/* PIN Change Drawer */}
            <Drawer open={isChangingPin} onOpenChange={setIsChangingPin}>
                <DrawerContent>
                    <DrawerStickyHeader>
                        <DrawerTitle>Change PIN</DrawerTitle>
                        <DrawerDescription>Update your 4-digit transaction PIN.</DrawerDescription>
                    </DrawerStickyHeader>
                    <div className="p-6 space-y-6 pb-40">
                        <div className="space-y-4 w-full">
                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase tracking-widest text-brand-accent/60 dark:text-white/60">Current PIN</label>
                                <Input
                                    type="password"
                                    maxLength={4}
                                    className="h-14 rounded-2xl text-center text-2xl tracking-[1em] font-mono bg-transparent border-brand-deep/10 dark:border-white/10 dark:text-brand-cream"
                                    value={pinData.current}
                                    onChange={(e) => setPinData({ ...pinData, current: e.target.value })}
                                />
                            </div>
                            <div className="h-px bg-brand-deep/5 dark:bg-white/5 my-4" />
                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase tracking-widest text-brand-accent/60 dark:text-white/60">New PIN</label>
                                <Input
                                    type="password"
                                    maxLength={4}
                                    className="h-14 rounded-2xl text-center text-2xl tracking-[1em] font-mono bg-transparent border-brand-deep/10 dark:border-white/10 dark:text-brand-cream"
                                    value={pinData.new}
                                    onChange={(e) => setPinData({ ...pinData, new: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase tracking-widest text-brand-accent/60 dark:text-white/60">Confirm New PIN</label>
                                <Input
                                    type="password"
                                    maxLength={4}
                                    className="h-14 rounded-2xl text-center text-2xl tracking-[1em] font-mono bg-transparent border-brand-deep/10 dark:border-white/10 dark:text-brand-cream"
                                    value={pinData.confirm}
                                    onChange={(e) => setPinData({ ...pinData, confirm: e.target.value })}
                                />
                            </div>
                        </div>
                    </div>
                    <div className="p-6 border-t border-brand-deep/5 dark:border-white/5 bg-brand-cream dark:bg-[#021a12]">
                        <Button
                            onClick={handlePinSave}
                            disabled={isLoading}
                            className="w-full h-14 rounded-2xl bg-brand-deep text-brand-gold dark:bg-brand-gold dark:text-brand-deep font-bold text-lg shadow-xl hover:scale-[1.02] active:scale-95 transition-all"
                        >
                            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Update PIN"}
                        </Button>
                    </div>
                </DrawerContent>
            </Drawer>

            {/* Password Change Drawer */}
            <Drawer open={isChangingPassword} onOpenChange={setIsChangingPassword}>
                <DrawerContent>
                    <DrawerStickyHeader>
                        <DrawerTitle>Update Password</DrawerTitle>
                        <DrawerDescription>Secure your account with a strong password.</DrawerDescription>
                    </DrawerStickyHeader>
                    <div className="p-6 space-y-6 pb-40">
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase tracking-widest text-brand-accent/60 dark:text-white/60">Current Password</label>
                                <Input
                                    type="password"
                                    className="h-14 rounded-2xl text-lg bg-transparent border-brand-deep/10 dark:border-white/10 dark:text-brand-cream"
                                    value={passData.current}
                                    onChange={(e) => setPassData({ ...passData, current: e.target.value })}
                                />
                            </div>
                            <div className="h-px bg-brand-deep/5 dark:bg-white/5 my-4" />
                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase tracking-widest text-brand-accent/60 dark:text-white/60">New Password</label>
                                <Input
                                    type="password"
                                    className="h-14 rounded-2xl text-lg bg-transparent border-brand-deep/10 dark:border-white/10 dark:text-brand-cream"
                                    value={passData.new}
                                    onChange={(e) => setPassData({ ...passData, new: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase tracking-widest text-brand-accent/60 dark:text-white/60">Confirm New Password</label>
                                <Input
                                    type="password"
                                    className="h-14 rounded-2xl text-lg bg-transparent border-brand-deep/10 dark:border-white/10 dark:text-brand-cream"
                                    value={passData.confirm}
                                    onChange={(e) => setPassData({ ...passData, confirm: e.target.value })}
                                />
                            </div>
                        </div>
                    </div>
                    <div className="p-6 border-t border-brand-deep/5 dark:border-white/5 bg-brand-cream dark:bg-[#021a12]">
                        <Button
                            onClick={handlePassSave}
                            disabled={isLoading}
                            className="w-full h-14 rounded-2xl bg-brand-deep text-brand-gold dark:bg-brand-gold dark:text-brand-deep font-bold text-lg shadow-xl hover:scale-[1.02] active:scale-95 transition-all"
                        >
                            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Update Password"}
                        </Button>
                    </div>
                </DrawerContent>
            </Drawer>
        </div>
    )
}
