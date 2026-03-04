"use client"

import * as React from "react"
import { ThemeProvider } from "@/app/components/providers/theme-provider"
import QueryProvider from "@/app/components/providers/query-provider"
import { BusinessProvider } from "@/app/components/BusinessProvider"
import { AuthProvider } from "@/app/components/providers/auth-provider"
import { AuthGuard } from "@/app/components/shared/AuthGuard"
import { TooltipProvider } from "@/app/components/ui/tooltip"
import { Toaster } from "@/app/components/ui/sonner"

export default function PosLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <ThemeProvider
            attribute="class"
            enableSystem
            disableTransitionOnChange
        >
            <QueryProvider>
                <AuthProvider>
                    <Toaster />
                    <AuthGuard>
                        <TooltipProvider>
                            <BusinessProvider>
                                <main className="min-h-screen bg-brand-cream dark:bg-brand-deep text-brand-deep dark:text-brand-cream overflow-hidden transition-colors duration-500">
                                    {children}
                                </main>
                            </BusinessProvider>
                        </TooltipProvider>
                    </AuthGuard>
                </AuthProvider>
            </QueryProvider>
        </ThemeProvider>
    )
}
