"use client"

import * as React from "react"
import { Check, ChevronsUpDown, Store, LayoutGrid } from "lucide-react"
import { Drawer as VaulDrawer } from "vaul"
import { cn } from "@/app/lib/utils"
import { Button } from "@/app/components/ui/button"

import { useStore, ALL_STORES_ID } from "../StoreProvider"
import { useMediaQuery } from "@/app/hooks/useMediaQuery"

export function StoreSwitcher({ isCollapsed = false }: { isCollapsed?: boolean }) {
    const { stores, currentStore, setCurrentStore } = useStore()
    const [open, setOpen] = React.useState(false)
    const isDesktop = useMediaQuery("(min-width: 768px)")

    if (isDesktop) {
        const isAllStores = currentStore.id === ALL_STORES_ID

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
                        "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-white shadow-lg shadow-black/20",
                        isAllStores ? "bg-brand-gold text-brand-deep" : "bg-emerald-600"
                    )}>
                        {isAllStores ? <LayoutGrid className="h-4 w-4" /> : <Store className="h-4 w-4" />}
                    </div>
                    {!isCollapsed && (
                        <>
                            <div className="flex flex-1 flex-col items-start overflow-hidden text-left">
                                <span className="text-[10px] uppercase tracking-wider font-bold text-brand-cream/40 leading-none mb-1">Store</span>
                                <span className="truncate text-sm font-bold leading-none">{currentStore.name}</span>
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
                            <div className="px-2 py-2 text-[10px] uppercase tracking-widest font-bold text-white/30 border-b border-white/5 mb-1">Select Store</div>
                            <div className="space-y-0.5">
                                {stores.map((store) => {
                                    const isSelected = store.id === currentStore.id
                                    const isItemAllStores = store.id === ALL_STORES_ID
                                    return (
                                        <button
                                            key={store.id}
                                            onClick={() => {
                                                setCurrentStore(store)
                                                setOpen(false)
                                            }}
                                            className={cn(
                                                "relative flex w-full cursor-pointer select-none items-center rounded-lg px-2 py-2.5 text-sm font-medium outline-none transition-all hover:bg-white/10 text-brand-cream/70 hover:text-brand-cream",
                                                isSelected && "bg-white/10 text-brand-gold"
                                            )}
                                        >
                                            <div className={cn(
                                                "mr-2 flex h-6 w-6 items-center justify-center rounded-md shrink-0",
                                                isSelected ? "bg-brand-gold/10" : "bg-white/5"
                                            )}>
                                                {isItemAllStores ? <LayoutGrid className="h-3.5 w-3.5" /> : <Store className="h-3.5 w-3.5" />}
                                            </div>
                                            <span className="flex-1 text-left truncate">{store.name}</span>
                                            {isSelected && <Check className="ml-auto h-4 w-4 text-brand-gold" />}
                                        </button>
                                    )
                                })}
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
        <VaulDrawer.Root open={open} onOpenChange={setOpen}>
            <VaulDrawer.Trigger asChild>
                <button className="flex items-center gap-2 rounded-full border border-border/40 bg-background/40 px-3 py-1.5 text-sm font-medium backdrop-blur-sm">
                    <Store className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="max-w-[100px] truncate">{currentStore.name}</span>
                    <ChevronsUpDown className="h-3 w-3 opacity-50" />
                </button>
            </VaulDrawer.Trigger>
            <VaulDrawer.Portal>
                <VaulDrawer.Overlay className="fixed inset-0 bg-black/40 z-50 backdrop-blur-sm" />
                <VaulDrawer.Content className="bg-white dark:bg-zinc-900 flex flex-col rounded-t-[10px] h-[400px] mt-24 fixed bottom-0 left-0 right-0 z-50 outline-none">
                    <div className="p-4 bg-white dark:bg-zinc-900 rounded-t-[10px] flex-1">
                        <div className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-zinc-300 dark:bg-zinc-700 mb-8" />
                        <div className="max-w-md mx-auto">
                            <VaulDrawer.Title className="font-medium mb-4 text-zinc-900 dark:text-zinc-100">
                                Switch Store
                            </VaulDrawer.Title>
                            <div className="flex flex-col gap-2">
                                {stores.map((store) => {
                                    const isSelected = store.id === currentStore.id
                                    const isItemAllStores = store.id === ALL_STORES_ID
                                    return (
                                        <button
                                            key={store.id}
                                            onClick={() => {
                                                setCurrentStore(store)
                                                setOpen(false)
                                            }}
                                            className={cn(
                                                "flex items-center gap-3 rounded-xl p-3 text-left transition-colors",
                                                isSelected
                                                    ? "bg-brand-green/5 dark:bg-brand-gold/10 text-brand-deep dark:text-brand-cream ring-1 ring-brand-gold/20"
                                                    : "hover:bg-zinc-100 dark:hover:bg-zinc-800"
                                            )}
                                        >
                                            <div className={cn(
                                                "flex h-10 w-10 items-center justify-center rounded-full",
                                                isSelected ? "bg-brand-gold text-brand-deep" : "bg-zinc-100 text-zinc-500"
                                            )}>
                                                {isItemAllStores ? <LayoutGrid className="h-5 w-5" /> : <Store className="h-5 w-5" />}
                                            </div>
                                            <div className="flex-1">
                                                <div className="font-medium">{store.name}</div>
                                                {store.location && <div className="text-sm text-muted-foreground">{store.location}</div>}
                                            </div>
                                            {isSelected && <Check className="h-5 w-5 text-brand-gold" />}
                                        </button>
                                    )
                                })}
                            </div>
                        </div>
                    </div>
                    <div className="p-4 bg-zinc-100 dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800 mt-auto">
                        <div className="flex gap-6 justify-center max-w-md mx-auto">
                            <a className="text-xs text-zinc-600 flex items-center gap-0.25" href="https://github.com/emilkowalski/vaul" target="_blank">
                                Manage stores
                            </a>
                        </div>
                    </div>
                </VaulDrawer.Content>
            </VaulDrawer.Portal>
        </VaulDrawer.Root>
    )
}
