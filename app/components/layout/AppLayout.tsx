"use client"

import Image from "next/image"
import * as React from "react"
import { MobileNav } from "./mobile-nav"
import { Sidebar } from "./sidebar"
import { MobileNavProvider } from "../providers/mobile-nav-provider"
import { BusinessSwitcher } from "../shared/BusinessSwitcher"
import { usePathname } from "next/navigation"
import { useIsTablet } from "../../hooks/useMediaQuery"


interface AppLayoutProps {
    children: React.ReactNode
}

import Link from "next/link"
import { useTheme } from "next-themes"
import { Settings, LogOut, Sun, Moon } from "lucide-react"
import { toast } from "sonner"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/app/lib/utils"
import { BusinessGuard } from "../shared/BusinessGuard"
import { VerificationAlert } from "../shared/VerificationAlert"
import { apiClient } from "@/app/lib/api-client"
import { useAuth } from "../providers/auth-provider"
import { usePermission } from "@/app/hooks/usePermission"
import { StoreProvider } from "../../domains/stores/providers/StoreProvider"

import { storage } from "@/app/lib/storage"

export default function AppLayout({ children }: AppLayoutProps) {
    const [mounted, setMounted] = React.useState(false)
    const [isCollapsed, setIsCollapsed] = React.useState(false)
    const isTablet = useIsTablet()

    // 1. Initial mount: Load saved state and determine initial collapse
    React.useEffect(() => {
        const saved = storage.getSidebarCollapsed()
        if (isTablet) {
            setIsCollapsed(true)
        } else {
            setIsCollapsed(saved)
        }
        setMounted(true)
    }, [])

    // 2. Responsive behavior: Handle screen size changes after mount
    React.useEffect(() => {
        if (!mounted) return

        if (isTablet) {
            setIsCollapsed(true)
        } else {
            // Restore from saved preference when moving back to desktop
            setIsCollapsed(storage.getSidebarCollapsed())
        }
    }, [isTablet, mounted])

    // 3. Persistence: Save manual toggle changes (only when allowed)
    React.useEffect(() => {
        if (!mounted || isTablet) return
        storage.setSidebarCollapsed(isCollapsed)
    }, [isCollapsed, isTablet, mounted])


    const pathname = usePathname()
    const isAssistantPage = pathname?.startsWith("/assistant")

    const { theme, setTheme } = useTheme()
    const [isProfileMenuOpen, setIsProfileMenuOpen] = React.useState(false)
    const { user, logout: authLogout } = useAuth()
    const { role } = usePermission()

    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map(n => n[0])
            .join('')
            .toUpperCase()
            .substring(0, 2)
    }

    const userInitials = user?.fullName ? getInitials(user.fullName) : '??'

    const handleLogout = () => {
        toast.promise(
            apiClient.post('/settings/logout', {})
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
        <div className="min-h-screen bg-brand-cream dark:bg-background text-foreground transition-colors duration-300">
            {/* Background Gradient Mesh (Optional "Premium" touch) */}
            <div className="fixed inset-0 z-0 pointer-events-none opacity-40 dark:opacity-10">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-brand-gold/5 blur-3xl filter" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-brand-gold/10 blur-3xl filter" />
            </div>

            <MobileNavProvider>
                <Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />

                <main
                    className={cn(
                        "relative z-10 min-h-screen transition-all duration-300",
                        !isAssistantPage && "md:pr-8 md:pt-6 md:pb-8",
                        isCollapsed ? "md:pl-[120px]" : "md:pl-[320px]"
                    )}
                >
                    {!isAssistantPage && (
                        <div className="px-4 md:px-0 pt-3 sm:pt-0 max-w-5xl md:mx-auto">
                            <VerificationAlert />
                        </div>
                    )}
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
                                    className="h-8 w-8 rounded-full bg-linear-to-br from-brand-gold to-yellow-600 text-brand-deep flex items-center justify-center font-bold text-[10px] shadow-lg uppercase border border-white/20"
                                >
                                    {userInitials}
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
                                                        <p className="text-xs font-bold text-brand-cream truncate">{user?.fullName}</p>
                                                        <p className="text-[10px] text-brand-cream/50 truncate font-medium capitalize">
                                                            {role?.toLowerCase().replace('_', ' ') || 'User'}
                                                        </p>
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

                    <div className={cn(isAssistantPage ? "p-0" : "px-4 pt-4 md:p-0 pb-24")}>
                        <BusinessGuard>
                            <StoreProvider>
                                {children}
                            </StoreProvider>
                        </BusinessGuard>
                    </div>
                </main>

                <MobileNav />
            </MobileNavProvider>
        </div>
    )
}
