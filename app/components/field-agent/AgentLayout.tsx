"use client"

import React, { useState } from "react"
import Image from "next/image"
import { AgentSidebar } from "@/app/components/field-agent/AgentSidebar"
import { FieldAgentProvider } from "@/app/domains/field-agent/providers/FieldAgentProvider"
import { motion, AnimatePresence } from "framer-motion"
import { usePathname } from "next/navigation"
import { PageTransition } from "@/app/components/layout/page-transition"
import {
    Bell,
    Search,
    User,
    Settings,
    ShieldCheck,
    LogOut,
    ChevronDown,
    Sun,
    Moon,
} from "lucide-react"
import { useTheme } from "next-themes"
import Link from "next/link"
import { cn } from "@/app/lib/utils"
import { useAuth } from "@/app/components/providers/auth-provider"
import { PinSetupGuard } from "@/app/components/field-agent/PinSetupGuard"

export default function AgentLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname()
    const segments = pathname.split("/").filter(Boolean)
    const lastSegment = segments[segments.length - 1]
    const pageTitle = lastSegment === "field" ? "Dashboard" : (lastSegment || "Dashboard")

    const [showProfileMenu, setShowProfileMenu] = useState(false)
    const { theme, setTheme } = useTheme()
    const { user, logout } = useAuth()

    const displayName = user?.fullName ?? user?.firstName ?? "Agent"
    const agentCode = user?.fieldAgent?.agentCode ?? ""
    const initials = displayName
        .split(" ")
        .map((n) => n[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()

    return (
        <FieldAgentProvider>
            <PinSetupGuard>
                <div className="min-h-screen bg-brand-cream dark:bg-brand-deep-950 text-brand-deep dark:text-brand-cream selection:bg-brand-gold/20">
                    <AgentSidebar />

                    <main className="lg:pl-64 min-h-screen flex flex-col pb-24 lg:pb-0">
                        {/* Header */}
                        <header className="sticky top-0 z-40 h-20 bg-brand-cream/80 dark:bg-brand-deep-900 backdrop-blur-xl border-b border-brand-deep/5 dark:border-white/5 flex items-center justify-between px-4 lg:px-8">
                            {/* Mobile Logo / Desktop Title */}
                            <div className="flex items-center gap-4">
                                {/* Logo for mobile + tablet */}
                                <div className="lg:hidden flex items-center gap-2.5">
                                    <Image
                                        src="/images/logo-green.png"
                                        alt="Cloove"
                                        width={28}
                                        height={28}
                                        className="h-7 w-7 object-contain dark:hidden"
                                        priority
                                    />
                                    <Image
                                        src="/images/logo-white.png"
                                        alt="Cloove"
                                        width={28}
                                        height={28}
                                        className="h-7 w-7 object-contain hidden dark:block"
                                        priority
                                    />
                                    <span className="font-serif text-lg tracking-tight text-brand-deep-950 dark:text-white">Cloove <span className="text-brand-deep/40 dark:text-brand-cream/40 text-xs font-sans font-normal ml-0.5 whitespace-nowrap">Agents</span></span>
                                </div>

                                {/* Title for desktop */}
                                <div className="hidden lg:block">
                                    <h1 className="text-lg md:text-xl font-serif font-medium capitalize tracking-tight">
                                        {pageTitle.replace("-", " ")}
                                    </h1>
                                    <p className="text-[10px] md:text-xs text-brand-deep/50 dark:text-brand-cream/50 font-sans mt-0.5">
                                        Welcome back, {displayName.split(" ")[0]}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-3 md:gap-6">
                                {/* Search removed as requested */}

                                {/* Notifications commented out for now */}
                                {/* 
                            <button className="relative w-10 h-10 flex items-center justify-center rounded-xl bg-brand-deep/5 dark:bg-white/5 border border-brand-deep/10 dark:border-white/5 hover:border-brand-gold/50 transition-all group">
                                <Bell className="w-5 h-5 text-brand-deep/60 dark:text-brand-cream/60 group-hover:text-brand-gold transition-colors" />
                                <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-brand-gold rounded-full border-2 border-brand-cream dark:border-brand-deep" />
                            </button> 
                            */}

                                <div className="relative">
                                    <button
                                        onClick={() => setShowProfileMenu(!showProfileMenu)}
                                        className="flex cursor-pointer items-center gap-3 pl-4 md:pl-6 border-l border-brand-deep/10 dark:border-white/10 group active:scale-95 transition-transform"
                                    >
                                        <div className="text-right hidden sm:block">
                                            <p className="text-sm font-bold group-hover:text-brand-gold transition-colors">{displayName}</p>
                                            <p className="text-[9px] uppercase tracking-widest text-brand-deep/60 dark:text-brand-cream/60 font-black">{agentCode}</p>
                                        </div>
                                        <div className="w-10 h-10 rounded-full bg-linear-to-br from-brand-gold to-yellow-600 border-2 border-brand-cream dark:border-brand-deep shadow-lg flex items-center justify-center font-bold text-brand-deep relative overflow-hidden">
                                            {initials}
                                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                                        </div>
                                        <ChevronDown className={cn("w-4 h-4 text-brand-deep/30 dark:text-brand-cream/50 transition-transform", showProfileMenu && "rotate-180")} />
                                    </button>

                                    <AnimatePresence>
                                        {showProfileMenu && (
                                            <>
                                                <div
                                                    className="fixed inset-0 z-40"
                                                    onClick={() => setShowProfileMenu(false)}
                                                />
                                                <motion.div
                                                    initial={{ opacity: 0, scale: 0.95, y: 10 }}
                                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                                    exit={{ opacity: 0, scale: 0.95, y: 10 }}
                                                    className="absolute right-0 mt-4 w-64 bg-brand-cream dark:bg-brand-deep border border-brand-deep/10 dark:border-white/10 rounded-[32px] shadow-2xl shadow-black/20 p-3 z-50 backdrop-blur-xl"
                                                >
                                                    <div className="p-4 mb-2 border-b border-brand-deep/5 dark:border-white/5">
                                                        <p className="text-sm font-bold">{displayName}</p>
                                                        <p className="text-xs text-brand-deep/50 dark:text-brand-cream/50">{user?.email ?? user?.phoneNumber ?? ""}</p>
                                                    </div>

                                                    <div className="space-y-1">
                                                        <Link
                                                            href="/field/profile"
                                                            className="flex items-center gap-3 px-4 py-3 rounded-2xl hover:bg-brand-deep/5 dark:hover:bg-white/5 transition-colors group"
                                                            onClick={() => setShowProfileMenu(false)}
                                                        >
                                                            <User className="w-4 h-4 text-brand-deep/40 dark:text-brand-cream/60 group-hover:text-brand-gold" />
                                                            <span className="text-sm font-medium">My Profile</span>
                                                        </Link>
                                                    </div>

                                                    <div className="mt-2 pt-2 border-t border-brand-deep/5 dark:border-white/5 space-y-1">
                                                        <button
                                                            onClick={() => {
                                                                setTheme(theme === "dark" ? "light" : "dark")
                                                                setShowProfileMenu(false)
                                                            }}
                                                            className="flex items-center gap-3 w-full px-4 py-3 rounded-2xl hover:bg-brand-deep/5 dark:hover:bg-white/5 transition-colors group"
                                                        >
                                                            {theme === "dark"
                                                                ? <Sun className="w-4 h-4 text-brand-deep/40 dark:text-brand-cream/60 group-hover:text-brand-gold" />
                                                                : <Moon className="w-4 h-4 text-brand-deep/40 dark:text-brand-cream/60 group-hover:text-brand-gold" />
                                                            }
                                                            <span className="text-sm font-medium">{theme === "dark" ? "Light Mode" : "Dark Mode"}</span>
                                                        </button>
                                                        <button
                                                            onClick={() => logout()}
                                                            className="flex items-center gap-3 w-full px-4 py-3 rounded-2xl text-red-500 hover:bg-red-500/5 transition-colors group"
                                                        >
                                                            <LogOut className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                                                            <span className="text-sm font-bold">Sign Out</span>
                                                        </button>
                                                    </div>
                                                </motion.div>
                                            </>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </div>
                        </header>

                        {/* Content Section */}
                        <div className="flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full">
                            <PageTransition key={pathname}>
                                {children}
                            </PageTransition>
                        </div>
                    </main>
                </div>
            </PinSetupGuard>
        </FieldAgentProvider>
    )
}
