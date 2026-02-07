"use client"

import * as React from "react"
import { MobileNav } from "./mobile-nav"
import { Sidebar } from "./sidebar"
import { useMediaQuery } from "@/app/hooks/useMediaQuery"
import { StoreSwitcher } from "../shared/store-switcher"
import { UserCircle } from "lucide-react"

interface AppLayoutProps {
    children: React.ReactNode
}

export default function AppLayout({ children }: AppLayoutProps) {
    const isDesktop = useMediaQuery("(min-width: 768px)")
    const [mounted, setMounted] = React.useState(false)

    React.useEffect(() => {
        setMounted(true)
    }, [])

    if (!mounted) {
        return (
            <div className="min-h-screen bg-background">
                {/* Simple loading shell */}
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-[#fdfcf8] dark:bg-[#070e0b] text-foreground transition-colors duration-300">
            {/* Background Gradient Mesh (Optional "Premium" touch) */}
            <div className="fixed inset-0 z-0 pointer-events-none opacity-40 dark:opacity-20">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-emerald-400/20 blur-3xl filter" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-amber-400/20 blur-3xl filter" />
            </div>

            <Sidebar />

            <main className="relative z-10 min-h-screen transition-all duration-300 md:pl-[300px] md:pr-8 md:py-8">
                {/* Mobile Header */}
                <div className="md:hidden sticky top-0 z-30 flex items-center justify-between px-4 py-3 bg-background/60 backdrop-blur-xl border-b border-white/10">
                    <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-900 text-emerald-100">
                            <span className="font-serif font-bold">C</span>
                        </div>
                        <StoreSwitcher />
                    </div>
                    <button className="h-8 w-8 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
                        <UserCircle className="h-5 w-5 text-muted-foreground" />
                    </button>
                </div>

                <div className="px-4 pb-24 pt-4 md:p-0">
                    {children}
                </div>
            </main>

            <MobileNav />
        </div>
    )
}
