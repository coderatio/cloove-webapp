"use client"

import React from "react"
import { GlassCard } from "@/app/components/ui/glass-card"
import { Button } from "@/app/components/ui/button"
import { Input } from "@/app/components/ui/input"
import { 
    Key,
    ShieldAlert
} from "lucide-react"

export default function SecurityPage() {
    return (
        <div className="max-w-4xl mx-auto space-y-8 pb-12">
            <div className="space-y-2">
                <h2 className="text-3xl font-serif font-medium">Security</h2>
                <p className="text-brand-deep/50 dark:text-brand-cream/50">Ensure your account remains secure and private.</p>
            </div>

            {/* Change Password */}
            <GlassCard className="p-8">
                <div className="flex items-center gap-3 mb-8">
                    <div className="w-10 h-10 rounded-xl bg-brand-gold/10 text-brand-gold flex items-center justify-center">
                        <Key className="w-5 h-5" />
                    </div>
                    <h3 className="text-xl font-serif font-medium">Change Password</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-widest text-brand-deep/40">Current Password</label>
                        <Input type="password" placeholder="••••••••" className="h-12 bg-transparent" />
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-widest text-brand-deep/40">New Password</label>
                        <Input type="password" placeholder="••••••••" className="h-12 bg-transparent" />
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-widest text-brand-deep/40">Confirm New Password</label>
                        <Input type="password" placeholder="••••••••" className="h-12 bg-transparent" />
                    </div>
                </div>
                
                <div className="mt-8 flex justify-end">
                    <Button className="w-full md:w-auto rounded-2xl px-12 h-12 bg-brand-deep text-brand-cream dark:bg-brand-gold dark:text-brand-deep font-bold">Update Password</Button>
                </div>
            </GlassCard>

            <GlassCard className="p-8 border-brand-deep/5 bg-brand-deep/5">
                <div className="flex items-center gap-6">
                    <div className="w-12 h-12 rounded-xl bg-brand-deep/10 flex items-center justify-center text-brand-deep/40">
                        <ShieldAlert className="w-6 h-6" />
                    </div>
                    <div>
                        <h4 className="font-bold text-sm">Security Policy</h4>
                        <p className="text-xs text-brand-deep/50">Cloove will never ask for your PIN via chat or phone call. Always use secure links for identity verification.</p>
                    </div>
                </div>
            </GlassCard>
        </div>
    )
}
