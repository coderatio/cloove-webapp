import React from "react"
import { LogOut, RefreshCw, AlertCircle, Clock } from "lucide-react"
import { Button } from "@/app/components/ui/button"
import {
    Drawer,
    DrawerContent,
    DrawerHeader,
    DrawerTitle,
    DrawerDescription,
} from "@/app/components/ui/drawer"

interface SessionTimeoutDrawerProps {
    isOpen: boolean
    onExtend: () => void
    onLogout: () => void
    remainingSeconds: number
}

/**
 * A non-closable warning drawer for session timeout using the project's design system
 */
export function SessionTimeoutDrawer({
    isOpen,
    onExtend,
    onLogout,
    remainingSeconds
}: SessionTimeoutDrawerProps) {
    const minutes = Math.floor(remainingSeconds / 60)
    const seconds = remainingSeconds % 60

    return (
        <Drawer open={isOpen} dismissible={false}>
            <DrawerContent className="max-w-xl mx-auto">
                <div className="p-8 pt-6 relative">
                    <div className="flex flex-col items-center text-center space-y-6">
                        <div className="w-16 h-16 rounded-full bg-brand-gold/10 flex items-center justify-center relative">
                            <Clock className="w-8 h-8 text-brand-gold animate-pulse" />
                            <div className="absolute inset-0 rounded-full border-2 border-brand-gold/20 border-dashed animate-spin-slow" />
                        </div>

                        <div className="space-y-2">
                            <DrawerTitle className="text-2xl font-serif text-brand-deep dark:text-brand-cream">
                                Session Timing Out
                            </DrawerTitle>
                            <DrawerDescription className="text-brand-deep/60 dark:text-brand-cream/60 max-w-sm mx-auto">
                                You've been inactive for a while. For your security, you'll be logged out in:
                            </DrawerDescription>
                        </div>

                        <div className="text-4xl font-serif text-brand-gold tabular-nums">
                            {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
                        </div>

                        <div className="flex flex-col sm:flex-row gap-4 w-full pt-4">
                            <Button
                                onClick={onExtend}
                                className="flex-1 h-12 rounded-xl bg-brand-deep dark:bg-brand-gold text-brand-gold dark:text-brand-deep hover:bg-brand-deep/90 dark:hover:bg-brand-gold/90 font-medium gap-2"
                            >
                                <RefreshCw className="w-4 h-4" />
                                Stay Logged In
                            </Button>
                            <Button
                                onClick={onLogout}
                                variant="outline"
                                className="flex-1 h-12 rounded-xl border-brand-deep/10 dark:border-white/10 text-brand-deep dark:text-brand-cream hover:bg-red-50 dark:hover:bg-red-500/10 hover:border-red-500/10 dark:hover:border-red-500/10 hover:text-red-600 dark:hover:text-red-400 font-medium gap-2"
                            >
                                <LogOut className="w-4 h-4" />
                                Logout
                            </Button>
                        </div>

                        <div className="flex items-center gap-2 py-2 px-4 rounded-full bg-brand-deep/5 dark:bg-white/5">
                            <AlertCircle className="w-3.5 h-3.5 text-brand-deep/40 dark:text-white/40" />
                            <span className="text-[10px] text-brand-deep/40 dark:text-white/40 uppercase tracking-[0.2em] font-bold">
                                Secure Session Active
                            </span>
                        </div>
                    </div>
                </div>
            </DrawerContent>
        </Drawer>
    )
}
