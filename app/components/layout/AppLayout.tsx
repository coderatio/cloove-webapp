"use client"

import Image from "next/image"
import * as React from "react"
import { MobileNav } from "./mobile-nav"
import { Sidebar } from "./sidebar"
import { BusinessSwitcher } from "../shared/BusinessSwitcher"
import { usePathname } from "next/navigation"

interface AppLayoutProps {
    children: React.ReactNode
}

import Link from "next/link"
import { useTheme } from "next-themes"
import { Settings, LogOut, Sun, Moon } from "lucide-react"
import { toast } from "sonner"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/app/lib/utils"

export default function AppLayout({ children }: AppLayoutProps) {
    const [mounted, setMounted] = React.useState(false)
    const [isCollapsed, setIsCollapsed] = React.useState(false)

    React.useEffect(() => {
        setMounted(true)
    }, [])

    const pathname = usePathname()
    const isAssistantPage = pathname === "/assistant"

    const { theme, setTheme } = useTheme()
    const [isProfileMenuOpen, setIsProfileMenuOpen] = React.useState(false)

    const handleLogout = () => {
        toast.promise(
            fetch('/api/settings/logout', { method: 'POST' })
                .then(() => {
                    window.location.href = '/';
                }),
            {
                loading: 'Logging out...',
                success: 'Logged out successfully',
                error: 'Failed to logout'
            }
        )
    }

    if (!mounted) {
        return (
            <div className="min-h-screen bg-background">
                {/* Simple loading shell */}
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-brand-cream dark:bg-brand-deep text-foreground transition-colors duration-300">
            {/* Background Gradient Mesh (Optional "Premium" touch) */}
            <div className="fixed inset-0 z-0 pointer-events-none opacity-40 dark:opacity-20">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-brand-green/20 blur-3xl filter" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-brand-gold/20 blur-3xl filter" />
            </div>

            <Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />

            <main
                className={cn(
                    "relative z-10 min-h-screen transition-all duration-300 md:pr-8 md:pt-4 md:pb-8",
                    isCollapsed ? "md:pl-[120px]" : "md:pl-[320px]"
                )}
            >
                {/* Mobile Header - Hide on Assistant Page */}
                {!isAssistantPage && (
                    <div className="md:hidden sticky top-0 z-30 flex items-center justify-between px-4 py-3 bg-background/60 backdrop-blur-xl border-b border-white/10 dark:border-white/5">
                        <div className="flex items-center gap-2">
                            <div className="relative flex h-8 w-8 items-center justify-center rounded-lg bg-brand-green text-brand-cream shadow-sm overflow-hidden">
                                <Image
                                    src="/images/logo-white.png"
                                    alt="Cloove"
                                    fill
                                    className="object-contain p-1.5"
                                />
                            </div>
                            <BusinessSwitcher />
                        </div>

                        {/* Mobile Profile Trigger */}
                        <div className="relative">
                            <button
                                onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                                className="h-8 w-8 rounded-full bg-gradient-to-br from-brand-gold to-yellow-600 text-brand-deep flex items-center justify-center font-bold text-[10px] shadow-lg uppercase border border-white/20"
                            >
                                JO
                            </button>
                            <AnimatePresence>
                                {isProfileMenuOpen && (
                                    <>
                                        <div
                                            className="fixed inset-0 z-40"
                                            onClick={() => setIsProfileMenuOpen(false)}
                                        />
                                        <motion.div
                                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                            className="absolute z-50 top-full right-0 mt-2 bg-brand-deep/95 dark:bg-black/95 backdrop-blur-xl border border-white/10 rounded-2xl p-1 shadow-2xl min-w-[180px]"
                                        >
                                            <div className="flex flex-col gap-0.5">
                                                <div className="px-3 py-2 border-b border-white/5 mb-1">
                                                    <p className="text-xs font-bold text-brand-cream truncate">Josiah AO</p>
                                                    <p className="text-[10px] text-brand-cream/50 truncate">Business Owner</p>
                                                </div>
                                                <Link
                                                    href="/settings"
                                                    onClick={() => setIsProfileMenuOpen(false)}
                                                    className="flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium text-brand-cream/70 hover:text-brand-cream hover:bg-white/5 transition-all"
                                                >
                                                    <Settings className="h-3.5 w-3.5" />
                                                    Settings
                                                </Link>
                                                <button
                                                    onClick={() => {
                                                        setTheme(theme === "dark" ? "light" : "dark")
                                                        setIsProfileMenuOpen(false)
                                                    }}
                                                    className="flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium text-brand-cream/70 hover:text-brand-cream hover:bg-white/5 transition-all w-full text-left"
                                                >
                                                    {theme === "dark" ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
                                                    {theme === "dark" ? "Light Mode" : "Dark Mode"}
                                                </button>
                                                <div className="h-px bg-white/5 mx-2 my-1" />
                                                <button
                                                    onClick={() => {
                                                        setIsProfileMenuOpen(false)
                                                        handleLogout()
                                                    }}
                                                    className="flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all w-full text-left"
                                                >
                                                    <LogOut className="h-3.5 w-3.5" />
                                                    Log Out
                                                </button>
                                            </div>
                                        </motion.div>
                                    </>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                )}

                <div className={cn("px-4 pt-4 md:p-0", isAssistantPage ? "pb-0" : "pb-24")}>
                    {children}
                </div>
            </main>

            <MobileNav />
        </div>
    )
}
