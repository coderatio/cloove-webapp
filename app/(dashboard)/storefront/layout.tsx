"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import { motion } from "framer-motion"
import { cn } from "@/app/lib/utils"
import { LayoutGrid, Palette, FileText, Settings } from "lucide-react"
import { PageTransition } from "@/app/components/layout/page-transition"

const tabs = [
    { name: "Overview", href: "/storefront", icon: LayoutGrid },
    { name: "Customization", href: "/storefront/customization", icon: Palette },
    { name: "Pages", href: "/storefront/pages", icon: FileText },
    { name: "Settings", href: "/storefront/settings", icon: Settings },
]

export default function StorefrontLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname()

    return (
        <PageTransition>
            <div className="max-w-5xl mx-auto space-y-8 pb-20">
                {/* Header */}
                <div className="px-2 pt-4">
                    <h1 className="font-serif text-3xl md:text-4xl text-brand-deep dark:text-brand-cream mb-2">
                        Storefront Management
                    </h1>
                    <p className="text-brand-accent/60 dark:text-brand-cream/60 max-w-2xl">
                        Manage your public sales channel. Customize your look, update content, and configure your store settings.
                    </p>
                </div>

                {/* Tab Navigation */}
                <div className="flex items-center gap-2 overflow-x-auto pb-2 px-2 no-scrollbar">
                    {tabs.map((tab) => {
                        const isActive = pathname === tab.href
                        const Icon = tab.icon

                        return (
                            <Link
                                key={tab.href}
                                href={tab.href}
                                className={cn(
                                    "relative flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium transition-all whitespace-nowrap",
                                    isActive
                                        ? "text-brand-cream bg-brand-deep dark:bg-brand-gold dark:text-brand-deep shadow-lg shadow-brand-deep/10"
                                        : "text-brand-deep/60 dark:text-brand-cream/60 hover:text-brand-deep dark:hover:text-brand-cream hover:bg-black/5 dark:hover:bg-white/5"
                                )}
                            >
                                <Icon className={cn("w-4 h-4", isActive ? "stroke-[2.5px]" : "stroke-2")} />
                                {tab.name}
                                {isActive && (
                                    <motion.div
                                        layoutId="active-storefront-tab"
                                        className="absolute inset-0 rounded-full bg-transparent"
                                        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                    />
                                )}
                            </Link>
                        )
                    })}
                </div>

                {/* Tab Content */}
                <div className="min-h-[500px]">
                    {children}
                </div>
            </div>
        </PageTransition>
    )
}
