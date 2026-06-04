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
import { HugeiconsIcon } from "@hugeicons/react"
import { Settings01Icon as Settings, Logout01Icon as LogOut, Sun01Icon as Sun, MoonIcon as Moon } from "@hugeicons/core-free-icons"
import { toast } from "sonner"
import { cn } from "@/app/lib/utils"
import { BusinessGuard } from "../shared/BusinessGuard"
import { VerificationAlert } from "../shared/VerificationAlert"
import { SubscriptionAlertBanner } from "../shared/SubscriptionAlertBanner"
import { TermsGate } from "../shared/TermsGate"
import { useAuth } from "../providers/auth-provider"
import { usePermission } from "@/app/hooks/usePermission"
import { StoreProvider } from "../../domains/stores/providers/StoreProvider"
import { GlobalOrderAlertProvider } from "@/app/domains/orders/providers/GlobalOrderAlertProvider"

import { storage } from "@/app/lib/storage"

/** Paths (prefix-matched) where zen mode is supported */
export const ZEN_MODE_PATHS = ["/restaurant"] as const

export const ZenModeContext = React.createContext<{
    isZenMode: boolean
    toggleZenMode: () => void
}>({ isZenMode: false, toggleZenMode: () => {} })

export default function AppLayout({ children }: AppLayoutProps) {
    const [mounted, setMounted] = React.useState(false)
    const [isCollapsed, setIsCollapsed] = React.useState(false)
    const [isZenMode, setIsZenMode] = React.useState(false)
    const isTablet = useIsTablet()

    // 1. Initial mount: Load saved state and determine initial collapse
    React.useEffect(() => {
        const saved = storage.getSidebarCollapsed()
        if (isTablet) {
            setIsCollapsed(true)
        } else {
            setIsCollapsed(saved)
        }
        setIsZenMode(storage.getRestaurantZenMode())
        setMounted(true)
    }, [isTablet])

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
    const zenActive = isZenMode && ZEN_MODE_PATHS.some((p) => pathname?.startsWith(p))

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

    const toggleZenMode = React.useCallback(() => {
        setIsZenMode((prev) => {
            const next = !prev
            storage.setRestaurantZenMode(next)
            return next
        })
    }, [])

    const handleLogout = () => {
        toast.promise(
            authLogout(),
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
        <ZenModeContext.Provider value={{ isZenMode, toggleZenMode }}>
        <div className="min-h-screen bg-background text-foreground">

            <MobileNavProvider>
                {!zenActive && <Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />}

                <main
                    className={cn(
                        "app-content-pattern relative z-10 min-h-screen transition-all duration-300",
                        !isAssistantPage && "md:pr-6 md:pt-3 md:pb-8",
                        zenActive ? "md:pl-8" : isCollapsed ? "md:pl-[96px]" : "md:pl-[280px]"
                    )}
                >
                    {!isAssistantPage && (
                        <div className="max-md:[padding-top:max(0.75rem,var(--subscription-banner-offset,0px))] space-y-4 px-4 md:mx-auto md:max-w-6xl md:px-0 md:pt-0">
                            {/* Subscription first: fixed mobile bar must sit above verification in the stack */}
                            <SubscriptionAlertBanner />
                            <VerificationAlert />
                        </div>
                    )}
                    {/* Mobile header: fixed (sticky breaks when a sibling uses position:fixed, e.g. subscription bar) */}
                    {!isAssistantPage && (
                        <div className="fixed left-0 right-0 top-[var(--subscription-banner-offset,0px)] z-30 flex items-center justify-between border-b border-border bg-background/95 px-4 py-3 backdrop-blur md:hidden">
                            <div className="flex items-center gap-2">
                                <div className="relative flex h-8 w-8 items-center justify-center overflow-hidden rounded-lg border border-primary/12 bg-primary text-primary-foreground">
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
                                    className="flex h-8 w-8 items-center justify-center rounded-full border border-border bg-muted text-[10px] font-semibold uppercase text-foreground"
                                >
                                    {userInitials}
                                </button>
                                {isProfileMenuOpen && (
                                    <>
                                        <div
                                            className="fixed inset-0 z-40"
                                            onClick={() => setIsProfileMenuOpen(false)}
                                        />
                                        <div className="absolute right-0 top-full z-50 mt-2 min-w-[180px] rounded-2xl border border-border bg-background p-1 shadow-lg">
                                            <div className="flex flex-col gap-0.5">
                                                    <div className="mb-1 border-b border-border px-3 py-2">
                                                        <p className="truncate text-xs font-semibold text-foreground">{user?.fullName}</p>
                                                        <p className="truncate text-[10px] font-medium capitalize text-muted-foreground">
                                                            {role?.toLowerCase().replace('_', ' ') || 'User'}
                                                        </p>
                                                    </div>
                                                    <Link
                                                        href="/settings"
                                                        onClick={() => setIsProfileMenuOpen(false)}
                                                        className="flex items-center gap-3 rounded-xl px-3 py-2 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
                                                    >
                                                        <HugeiconsIcon icon={Settings} className="h-3.5 w-3.5" />
                                                        Settings
                                                    </Link>
                                                    <button
                                                        onClick={() => {
                                                            setTheme(theme === "dark" ? "light" : "dark")
                                                            setIsProfileMenuOpen(false)
                                                        }}
                                                        className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
                                                    >
                                                        {theme === "dark" ? <HugeiconsIcon icon={Sun} className="h-3.5 w-3.5" /> : <HugeiconsIcon icon={Moon} className="h-3.5 w-3.5" />}
                                                        {theme === "dark" ? "Light Mode" : "Dark Mode"}
                                                    </button>
                                                    <div className="mx-2 my-1 h-px bg-border" />
                                                    <button
                                                        onClick={() => {
                                                            setIsProfileMenuOpen(false)
                                                            handleLogout()
                                                        }}
                                                        className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-xs font-medium text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/30"
                                                    >
                                                        <HugeiconsIcon icon={LogOut} className="h-3.5 w-3.5" />
                                                        Log Out
                                                    </button>
                                                </div>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    )}
                    {/* Reserve space for fixed mobile header (in-flow when header is md:hidden fixed) */}
                    {!isAssistantPage && <div className="h-14 shrink-0 md:hidden" aria-hidden />}

                    <div
                        className={cn(
                            isAssistantPage ? "p-0" : "px-4 pt-4 pb-24 md:p-0",
                            !isAssistantPage && !zenActive && "md:mx-auto md:w-full md:max-w-6xl"
                        )}
                    >
                        <TermsGate>
                            <BusinessGuard>
                                <StoreProvider>
                                    <GlobalOrderAlertProvider>{children}</GlobalOrderAlertProvider>
                                </StoreProvider>
                            </BusinessGuard>
                        </TermsGate>
                    </div>
                </main>

                {!zenActive && <MobileNav />}
            </MobileNavProvider>
        </div>
        </ZenModeContext.Provider>
    )
}
