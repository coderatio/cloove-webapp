"use client"

import Image from "next/image"
import Link from "next/link"
import { useState } from "react"
import { usePathname } from "next/navigation"
import {
    LayoutDashboard,
    UserPlus,
    Building2,
    Wallet,
    LogOut,
    Settings,
    User,
    ShieldCheck,
    ChevronRight,
    MoreVerticalIcon
} from "lucide-react"
import { cn } from "@/app/lib/utils"
import { motion } from "framer-motion"
import { useAuth } from "@/app/components/providers/auth-provider"

const navItems = [
    { href: "", icon: LayoutDashboard, label: "Overview" },
    { href: "/onboard", icon: UserPlus, label: "Onboard" },
    { href: "/businesses", icon: Building2, label: "Businesses" },
    { href: "/wallet", icon: Wallet, label: "Wallet" },
]

export function AgentSidebar() {
    const pathname = usePathname()
    const { logout, user } = useAuth()
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

    return (
        <>
            {/* Desktop Sidebar */}
            <aside className="fixed left-0 top-0 h-screen w-64 bg-brand-deep dark:bg-brand-deep-900/60 text-brand-cream z-50 transition-all duration-300 hidden lg:flex flex-col items-stretch py-8 border-r border-white/5">
                {/* Logo */}
                <div className="px-6 mb-12 flex items-center gap-3 justify-start">
                    <Image
                        src="/images/logo-white.png"
                        alt="Cloove"
                        width={32}
                        height={32}
                        className="h-8 w-8 object-contain shrink-0"
                        priority
                    />
                    <span className="font-serif text-xl tracking-tight text-white">Cloove <span className="text-white/60 text-sm font-sans font-normal ml-1">Agents</span></span>
                </div>

                {/* Nav Items */}
                <nav className="flex-1 w-full px-4 space-y-2">
                    {navItems.map((item) => {
                        const fullHref = `/field${item.href}`
                        const isActive = item.href === ""
                            ? pathname === "/field" || pathname === "/field/"
                            : pathname.includes(item.href)

                        return (
                            <Link
                                key={item.href}
                                href={fullHref}
                                className={cn(
                                    "flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-200 group relative",
                                    isActive
                                        ? "bg-brand-gold text-brand-deep"
                                        : "text-brand-cream/60 hover:text-white hover:bg-white/5"
                                )}
                            >
                                <item.icon className={cn("w-5 h-5 transition-transform group-hover:scale-110", isActive && "text-brand-deep")} />
                                <span className="font-medium text-sm">{item.label}</span>
                            </Link>
                        )
                    })}
                </nav>

                {/* Bottom Section */}
                <div className="px-4 mt-auto space-y-2 w-full">
                    {[
                        { href: "/field/settings", icon: Settings, label: "Settings", iconClass: "group-hover:rotate-45 transition-transform" },
                        { href: "/field/security", icon: ShieldCheck, label: "Security", iconClass: "group-hover:scale-110 transition-transform" },
                    ].map((item) => {
                        const isActive = pathname === item.href
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={cn(
                                    "flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-200 group",
                                    isActive
                                        ? "bg-brand-gold text-brand-deep"
                                        : "text-brand-cream/60 hover:text-white hover:bg-white/5"
                                )}
                            >
                                <item.icon className={cn("w-5 h-5", item.iconClass, isActive && "text-brand-deep")} />
                                <span className="font-medium text-sm">{item.label}</span>
                            </Link>
                        )
                    })}
                    <button
                        onClick={logout}
                        className="flex items-center gap-3 px-4 py-3 rounded-2xl text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all w-full group"
                    >
                        <LogOut className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                        <span className="font-medium text-sm">Log Out</span>
                    </button>
                </div>
            </aside>

            {/* Mobile Bottom Navigation */}
            <nav className="fixed bottom-6 left-4 right-4 h-16 md:h-20 bg-brand-deep/90 backdrop-blur-2xl border border-white/10 lg:hidden z-50 flex items-center justify-around px-2 rounded-full shadow-2xl shadow-black/40">
                {navItems.map((item) => {
                    const fullHref = `/field${item.href}`
                    const isActive = item.href === ""
                        ? pathname === "/field" || pathname === "/field/"
                        : pathname.includes(item.href)

                    return (
                        <Link
                            key={item.href}
                            href={fullHref}
                            className={cn(
                                "flex flex-col items-center justify-center gap-1 w-16 h-12 rounded-2xl transition-all duration-300 relative",
                                isActive ? "text-brand-gold" : "text-brand-cream/40"
                            )}
                        >
                            <item.icon className={cn("w-5 h-5 transition-transform duration-300", isActive && "scale-110 -translate-y-0.5")} />
                            <span className="text-[9px] font-bold">{item.label}</span>

                            {isActive && (
                                <motion.div
                                    layoutId="mobile-active-glow"
                                    className="absolute -bottom-1 w-1 h-1 bg-brand-gold rounded-full shadow-[0_0_8px_rgba(234,179,8,0.8)]"
                                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                />
                            )}
                        </Link>
                    )
                })}

                {/* Mobile More Toggle */}
                <button
                    onClick={() => setIsMobileMenuOpen(true)}
                    className={cn(
                        "flex flex-col items-center justify-center gap-1 w-16 h-12 rounded-2xl transition-all duration-300 relative",
                        ["/field/settings", "/field/security", "/field/profile"].includes(pathname)
                            ? "text-brand-gold"
                            : "text-brand-cream/40"
                    )}
                >
                    <MoreVerticalIcon className="w-5 h-5 transition-transform duration-300" />
                    <span className="text-[9px] font-bold uppercase tracking-widest">More</span>
                </button>
            </nav>

            {/* Mobile Profile Drawer/Menu */}
            {isMobileMenuOpen && (
                <div className="fixed inset-0 z-60 lg:hidden">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                    />
                    <motion.div
                        initial={{ y: "100%" }}
                        animate={{ y: 0 }}
                        exit={{ y: "100%" }}
                        className="absolute bottom-0 left-0 right-0 bg-brand-deep rounded-t-[32px] pt-8 pb-12 border-t border-white/10"
                    >
                        <div className="flex items-center gap-4 mb-8 pb-8 px-8 border-b border-white/5">
                            <div className="w-16 h-16 rounded-full bg-brand-gold/10 flex items-center justify-center text-brand-gold font-serif text-2xl">
                                {user?.firstName?.charAt(0) || user?.fullName?.charAt(0) || "A"}
                            </div>
                            <div>
                                <h4 className="text-xl font-serif font-medium text-white">{user?.fullName}</h4>
                                <p className="text-white/40 text-sm">Field Agent</p>
                            </div>
                        </div>

                        <div className="divide-y divide-white/5 mt-4">
                            <Link
                                href="/field/settings"
                                onClick={() => setIsMobileMenuOpen(false)}
                                className="flex items-center justify-between p-5 text-white font-serif font-medium active:bg-white/10 transition-colors"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-brand-gold/10 flex items-center justify-center text-brand-gold">
                                        <Settings className="w-5 h-5" />
                                    </div>
                                    <span>Settings</span>
                                </div>
                                <ChevronRight className="w-5 h-5 text-white/20" />
                            </Link>
                            <Link
                                href="/field/security"
                                onClick={() => setIsMobileMenuOpen(false)}
                                className="flex items-center justify-between p-5 text-white font-serif font-medium active:bg-white/10 transition-colors"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-brand-gold/10 flex items-center justify-center text-brand-gold">
                                        <ShieldCheck className="w-5 h-5" />
                                    </div>
                                    <span>Security</span>
                                </div>
                                <ChevronRight className="w-5 h-5 text-white/20" />
                            </Link>
                            <button
                                onClick={() => {
                                    setIsMobileMenuOpen(false)
                                    logout()
                                }}
                                className="flex items-center justify-between w-full p-5 text-red-400 font-serif font-medium active:bg-red-500/10 transition-colors"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center text-red-400">
                                        <LogOut className="w-5 h-5" />
                                    </div>
                                    <span>Log Out</span>
                                </div>
                                <ChevronRight className="w-5 h-5 text-red-400/20" />
                            </button>
                        </div>

                        <button
                            onClick={() => setIsMobileMenuOpen(false)}
                            className="w-full mt-8 p-4 text-white/40 font-bold uppercase tracking-widest text-xs"
                        >
                            Close
                        </button>
                    </motion.div>
                </div>
            )}
        </>
    )
}
