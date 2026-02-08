"use client"

import * as React from "react"
import { Check, ChevronsUpDown, Store, LayoutGrid } from "lucide-react"
import { cn } from "@/app/lib/utils"
import { Button } from "@/app/components/ui/button"
import {
    Drawer,
    DrawerContent,
    DrawerStickyHeader,
    DrawerTitle,
    DrawerDescription,
    DrawerClose,
    DrawerTrigger,
} from "../ui/drawer"

import { useStore, ALL_STORES_ID } from "../StoreProvider"
import { useMediaQuery } from "@/app/hooks/useMediaQuery"

export function StoreSwitcher({ isCollapsed = false }: { isCollapsed?: boolean }) {
    const { stores, currentStore, setCurrentStore } = useStore()
    const [open, setOpen] = React.useState(false)
    const isDesktop = useMediaQuery("(min-width: 768px)")

    if (isDesktop) {
        return (
            <div className="relative">
                <button
                    onClick={() => setOpen(!open)}
                    className={cn(
                        "flex w-full items-center gap-2 rounded-xl border border-white/10 bg-white/5 p-2 transition-colors hover:bg-white/10 text-brand-cream",
                        isCollapsed && "justify-center border-0 bg-transparent p-0"
                    )}
                >
                    <div className={cn(
                        "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-gold text-brand-deep shadow-lg shadow-black/20",
                    )}>
                        <LayoutGrid className="h-4 w-4" />
                    </div>
                    {!isCollapsed && (
                        <>
                            <div className="flex flex-1 flex-col items-start overflow-hidden text-left">
                                <span className="text-[10px] uppercase tracking-wider font-bold text-brand-cream/40 leading-none mb-1">Business</span>
                                <span className="truncate text-sm font-bold leading-none">Cloove Fashion</span>
                            </div>
                            <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
                        </>
                    )}
                </button>

                {open && (
                    <>
                        <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
                        <div className={cn(
                            "absolute z-50 mt-2 min-w-[200px] overflow-hidden rounded-xl border border-white/10 bg-brand-deep/95 dark:bg-black/95 p-1 shadow-2xl backdrop-blur-xl animate-in fade-in zoom-in-95",
                            isCollapsed ? "left-12 top-0" : "top-full left-0 w-full"
                        )}>
                            <div className="px-2 py-2 text-[10px] uppercase tracking-widest font-bold text-white/30 border-b border-white/5 mb-1">Your Businesses</div>
                            <div className="space-y-0.5">
                                <button
                                    onClick={() => setOpen(false)}
                                    className={cn(
                                        "relative flex w-full cursor-pointer select-none items-center rounded-lg px-2 py-2.5 text-sm font-medium outline-none transition-all hover:bg-white/10 text-brand-gold bg-white/10",
                                    )}
                                >
                                    <div className={cn(
                                        "mr-2 flex h-6 w-6 items-center justify-center rounded-md shrink-0 bg-brand-gold/10",
                                    )}>
                                        <LayoutGrid className="h-3.5 w-3.5" />
                                    </div>
                                    <span className="flex-1 text-left truncate">Cloove Fashion</span>
                                    <Check className="ml-auto h-4 w-4 text-brand-gold" />
                                </button>
                            </div>
                        </div>
                    </>
                )}
            </div>
        )
    }

    // Mobile Drawer (Vaul)
    // We'll expose this as a method to be triggered from the Header in the mobile layout
    // But wait, the StoreSwitcher is usually in the Header on Mobile.
    // So this component will be used in the Mobile Header too?
    // Let's make it flexible.

    return (
        <Drawer open={open} onOpenChange={setOpen}>
            <DrawerTrigger asChild>
                <button className="flex items-center gap-2 rounded-full border border-brand-deep/10 dark:border-white/10 bg-white/50 dark:bg-white/5 px-3 py-1.5 text-sm font-medium backdrop-blur-sm text-brand-deep dark:text-brand-cream ring-1 ring-black/5 dark:ring-white/5 shadow-sm">
                    <LayoutGrid className="h-3.5 w-3.5 text-brand-deep/60 dark:text-brand-cream/60" />
                    <span className="max-w-[100px] truncate">Cloove Fashion</span>
                    <ChevronsUpDown className="h-3 w-3 opacity-40 dark:opacity-50" />
                </button>
            </DrawerTrigger>
            <DrawerContent>
                <DrawerStickyHeader>
                    <DrawerTitle>Switch Business</DrawerTitle>
                </DrawerStickyHeader>
                <div className="p-4 flex-1 text-center">
                    <div className="max-w-md mx-auto space-y-6 py-12">
                        <div className="h-16 w-16 mx-auto rounded-3xl bg-brand-gold flex items-center justify-center text-brand-deep shadow-xl">
                            <LayoutGrid className="h-8 w-8" />
                        </div>
                        <div className="space-y-2">
                            <h3 className="text-xl font-serif font-medium text-brand-deep dark:text-brand-cream">Cloove Fashion</h3>
                            <p className="text-sm text-brand-accent/60 dark:text-brand-cream/40 px-6">You are currently managing Cloove Fashion. Support for multiple businesses is coming soon.</p>
                        </div>
                    </div>
                </div>
                <div className="p-4 bg-brand-deep/5 dark:bg-white/5 border-t border-brand-deep/5 dark:border-white/5 mt-auto">
                    <div className="flex gap-6 justify-center max-w-md mx-auto">
                        <DrawerClose asChild>
                            <Button className="w-full h-14 rounded-2xl bg-brand-deep text-brand-gold dark:bg-brand-gold dark:text-brand-deep font-bold">Done</Button>
                        </DrawerClose>
                    </div>
                </div>
            </DrawerContent>
        </Drawer>
    )
}
