"use client"

import { ArrowLeft, Save, Globe, Sparkles, Monitor, Smartphone } from "lucide-react"
import { Button } from "@/app/components/ui/button"
import { cn } from "@/app/lib/utils"
import { BuilderProvider, useBuilder } from "../domains/storefront/context/BuilderContext"
import { useRouter } from "next/navigation"

export default function BuilderLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <BuilderProvider>
            <BuilderContent>{children}</BuilderContent>
        </BuilderProvider>
    )
}

function BuilderContent({ children }: { children: React.ReactNode }) {
    const router = useRouter()
    const { setIsMagicOpen, saveAndPublish } = useBuilder()

    return (
        <div className="h-screen w-screen flex flex-col bg-[#F9FAFB] dark:bg-zinc-950 overflow-hidden font-sans">
            {/* Top Bar */}
            <header className="h-16 px-6 border-b border-brand-deep/5 dark:border-white/5 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md flex items-center justify-between z-50">
                <div className="flex items-center gap-4">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => router.back()}
                        className="rounded-full hover:bg-brand-deep/5"
                    >
                        <ArrowLeft className="w-5 h-5 text-brand-deep/60" />
                    </Button>
                    <div className="h-6 w-px bg-brand-deep/10 mx-2" />
                    <div>
                        <h1 className="text-sm font-bold text-brand-deep dark:text-brand-cream">Website Builder <span className="text-brand-green ml-2 font-mono text-[10px] uppercase px-2 py-0.5 rounded-full bg-brand-green/10">v2.0</span></h1>
                        <p className="text-[10px] text-brand-accent/40 uppercase tracking-widest font-bold">Draft: Home Page</p>
                    </div>
                </div>

                {/* Viewport Toggles */}
                <div className="hidden md:flex items-center bg-brand-deep/5 dark:bg-white/5 p-1 rounded-full border border-brand-deep/5">
                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full bg-white dark:bg-white/10 shadow-sm text-brand-green">
                        <Monitor className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-brand-accent/40 hover:text-brand-deep">
                        <Smartphone className="w-4 h-4" />
                    </Button>
                </div>

                <div className="flex items-center gap-3">
                    <Button
                        variant="ghost"
                        onClick={() => setIsMagicOpen(true)}
                        className="rounded-full text-brand-accent hover:text-brand-deep gap-2 text-xs font-bold"
                    >
                        <Sparkles className="w-3.5 h-3.5 text-brand-green" />
                        AI Helper
                    </Button>
                    <div className="h-6 w-px bg-brand-deep/10 mx-1" />
                    <Button variant="outline" className="rounded-full border-brand-deep/10 text-brand-deep h-10 px-6 font-bold text-xs">
                        Preview
                    </Button>
                    <Button
                        onClick={saveAndPublish}
                        className="rounded-full bg-brand-deep text-brand-gold dark:bg-brand-gold dark:text-brand-deep h-10 px-8 font-bold text-xs shadow-lg hover:scale-105 transition-all"
                    >
                        Publish
                    </Button>
                </div>
            </header>

            {/* Main Editor Area */}
            <main className="flex-1 overflow-hidden relative flex">
                {children}
            </main>
        </div>
    )
}
