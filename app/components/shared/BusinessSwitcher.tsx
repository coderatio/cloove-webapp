"use client"

import * as React from "react"
import { createPortal } from "react-dom"
import { useRouter } from "next/navigation"
import { Check, ChevronsUpDown, Copy, LayoutGrid, Plus } from "lucide-react"
import { cn } from "@/app/lib/utils"
import { Button } from "@/app/components/ui/button"
import {
    Drawer,
    DrawerContent,
    DrawerStickyHeader,
    DrawerTitle,
    DrawerClose,
    DrawerTrigger,
} from "../ui/drawer"

import { useBusiness } from "../BusinessProvider"
import { usePermission } from "@/app/hooks/usePermission"
import { useMediaQuery } from "@/app/hooks/useMediaQuery"
import { useCurrentSubscription, useUsageStats } from "@/app/domains/business/hooks/useBilling"
import Link from "next/link"

export function BusinessSwitcher({ isCollapsed = false }: { isCollapsed?: boolean }) {
    const {
        businesses,
        activeBusiness,
        setActiveBusiness,
        isMultiBusinessRestricted,
        primaryBusinessId,
        isBusinessSelectable,
    } = useBusiness()
    const { role } = usePermission()
    const { data: subData } = useCurrentSubscription()
    const { data: usage, isLoading: isLoadingUsage } = useUsageStats()
    const [open, setOpen] = React.useState(false)
    const [copiedSlug, setCopiedSlug] = React.useState<string | null>(null)

    const copySlug = (e: React.MouseEvent, slug: string) => {
        e.stopPropagation()
        navigator.clipboard.writeText(slug)
        setCopiedSlug(slug)
        setTimeout(() => setCopiedSlug(null), 1500)
    }
    const [triggerRect, setTriggerRect] = React.useState<DOMRect | null>(null)
    const triggerRef = React.useRef<HTMLButtonElement>(null)
    const isDesktop = useMediaQuery("(min-width: 768px)")
    const router = useRouter()

    React.useEffect(() => {
        if (!open || !triggerRef.current) return
        setTriggerRect(triggerRef.current.getBoundingClientRect())
    }, [open])

    const planBenefits = subData?.currentPlan?.benefits as Record<string, number | null> | undefined
    const maxBusinesses = planBenefits?.maxBusinesses
    const isUnlimited =
        maxBusinesses === undefined ||
        maxBusinesses === null ||
        maxBusinesses === Infinity
    const canAddBusiness =
        role === "OWNER" &&
        !isLoadingUsage &&
        (isUnlimited || (usage != null && usage.businesses < Number(maxBusinesses)))

    const handleAddBusiness = () => {
        setOpen(false)
        router.push("/onboarding?from=switcher")
    }

    const dropdownContent = open && triggerRect && (
        <>
            <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} aria-hidden />
            <div
                className="fixed z-50 min-w-[200px] overflow-hidden rounded-2xl border border-white/10 bg-brand-deep-900/90 dark:bg-black/95 p-1 pb-2 px-2 shadow-2xl backdrop-blur-xl animate-in fade-in zoom-in-95"
                style={
                    isCollapsed
                        ? { left: triggerRect.right + 8, top: triggerRect.top, minWidth: 200 }
                        : { left: triggerRect.left, top: triggerRect.bottom + 8, width: triggerRect.width, minWidth: 200 }
                }
            >
                <div className="px-2 py-2 text-[10px] uppercase tracking-widest font-bold text-white/30 border-b border-white/5 mb-1">Your Businesses</div>
                <div className="space-y-0.5 max-h-[200px] overflow-y-auto">
                    {businesses.map((business) => (
                        (() => {
                            const isLocked = !isBusinessSelectable(business)
                            return (
                        <button
                            key={business.id}
                            disabled={isLocked}
                            onClick={() => {
                                setActiveBusiness(business)
                                setOpen(false)
                            }}
                            className={cn(
                                "relative flex w-full select-none items-center rounded-xl px-2 py-2.5 text-sm font-medium outline-none transition-all text-brand-cream",
                                isLocked ? "cursor-not-allowed opacity-50" : "cursor-pointer hover:bg-white/10",
                                activeBusiness?.id === business.id && "bg-white/10 text-brand-gold"
                            )}
                        >
                            <div className="mr-2 flex h-6 w-6 items-center justify-center rounded-md shrink-0 bg-brand-gold/10">
                                <LayoutGrid className="h-3.5 w-3.5" />
                            </div>
                            <div className="flex-1 text-left overflow-hidden">
                                <span className="block truncate">{business.name}</span>
                                <span
                                    onClick={(e) => copySlug(e, business.code)}
                                    className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wider text-white/40 hover:text-white/70 cursor-copy transition-colors"
                                >
                                    {copiedSlug === business.code ? <Check className="h-2.5 w-2.5" /> : <Copy className="h-2.5 w-2.5" />}
                                    {business.code}
                                </span>
                            </div>
                            {activeBusiness?.id === business.id && <Check className="ml-auto h-4 w-4 text-brand-gold" />}
                        </button>
                            )
                        })()
                    ))}
                    {canAddBusiness && (
                        <button
                            type="button"
                            onClick={handleAddBusiness}
                            className="relative flex w-full cursor-pointer select-none items-center rounded-lg px-2 py-2.5 text-sm font-medium outline-none transition-all hover:bg-white/10 text-brand-gold/90 border border-dashed border-white/20 mt-1"
                        >
                            <div className="mr-2 flex h-6 w-6 items-center justify-center rounded-md shrink-0 bg-brand-gold/20">
                                <Plus className="h-3.5 w-3.5" />
                            </div>
                            <span className="flex-1 text-left">Add business</span>
                        </button>
                    )}
                    {isMultiBusinessRestricted && businesses.length > 1 && (
                        <div className="mt-2 rounded-lg border border-amber-400/20 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
                            Free plan allows only your first business.{" "}
                            <Link
                                href="/settings?tab=billing"
                                onClick={() => setOpen(false)}
                                className="underline font-semibold"
                            >
                                Upgrade to unlock all.
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </>
    )

    if (isDesktop) {
        return (
            <div className="relative">
                <button
                    ref={triggerRef}
                    onClick={() => {
                        if (!open && triggerRef.current) setTriggerRect(triggerRef.current.getBoundingClientRect())
                        setOpen(!open)
                    }}
                    className={cn(
                        "flex cursor-pointer w-full items-center gap-2 rounded-[14px] border border-white/10 bg-white/5 p-2 transition-colors hover:bg-white/10 text-brand-cream",
                        isCollapsed && "justify-center border-0 bg-transparent hover:bg-transparent p-0"
                    )}
                >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-gold text-brand-deep shadow-lg shadow-black/20">
                        <LayoutGrid className="h-4 w-4" />
                    </div>
                    {!isCollapsed && (
                        <>
                            <div className="flex flex-1 flex-col items-start overflow-hidden text-left">
                                <span className="text-[10px] uppercase tracking-wider font-bold text-brand-cream/40 leading-none mb-1">Business</span>
                                <span className="truncate text-sm font-bold leading-none">{activeBusiness?.name || 'Select Business'}</span>
                            </div>
                            <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
                        </>
                    )}
                </button>

                {typeof document !== "undefined" && createPortal(dropdownContent, document.body)}
            </div>
        )
    }

    return (
        <Drawer open={open} onOpenChange={setOpen}>
            <DrawerTrigger asChild>
                <button className="flex cursor-pointer items-center gap-2 rounded-full border border-brand-deep/10 dark:border-white/10 bg-white/50 dark:bg-white/5 px-3 py-1.5 text-sm font-medium backdrop-blur-sm text-brand-deep dark:text-brand-cream ring-1 ring-black/5 dark:ring-white/5 shadow-sm">
                    <LayoutGrid className="h-3.5 w-3.5 text-brand-deep/60 dark:text-brand-cream/60" />
                    <span className="max-w-[100px] truncate">{activeBusiness?.name || 'Select Business'}</span>
                    <ChevronsUpDown className="h-3 w-3 opacity-40 dark:opacity-50" />
                </button>
            </DrawerTrigger>
            <DrawerContent>
                <DrawerStickyHeader>
                    <DrawerTitle>Switch Business</DrawerTitle>
                </DrawerStickyHeader>
                <div className="p-4 flex-1 overflow-y-auto">
                    <div className="space-y-1">
                        {businesses.map((business) => (
                            (() => {
                                const isLocked = !isBusinessSelectable(business)
                                return (
                            <button
                                key={business.id}
                                disabled={isLocked}
                                onClick={() => {
                                    setActiveBusiness(business)
                                    setOpen(false)
                                }}
                                className={cn(
                                    "flex w-full items-center gap-4 rounded-2xl p-4 transition-all",
                                    isLocked ? "cursor-not-allowed opacity-50" : "cursor-pointer hover:bg-black/5 dark:hover:bg-white/5",
                                    activeBusiness?.id === business.id && "bg-black/5 dark:bg-white/5 ring-1 ring-brand-gold/20"
                                )}
                            >
                                <div className="h-12 w-12 rounded-xl bg-brand-gold flex items-center justify-center text-brand-deep shadow-lg">
                                    <LayoutGrid className="h-6 w-6" />
                                </div>
                                <div className="flex-1 text-left">
                                    <h3 className="font-bold text-brand-deep dark:text-brand-cream">{business.name}</h3>
                                    <p
                                        onClick={(e) => copySlug(e, business.code)}
                                        className="inline-flex items-center gap-1 text-xs text-brand-deep/50 dark:text-brand-cream/50 uppercase tracking-wider hover:text-brand-deep/80 dark:hover:text-brand-cream/80 cursor-copy transition-colors"
                                    >
                                        {copiedSlug === business.code ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                                        {business.code}
                                    </p>
                                </div>
                                {activeBusiness?.id === business.id && (
                                    <div className="h-8 w-8 rounded-full bg-brand-gold/10 flex items-center justify-center text-brand-gold">
                                        <Check className="h-5 w-5" />
                                    </div>
                                )}
                            </button>
                                )
                            })()
                        ))}
                        {canAddBusiness && (
                            <button
                                type="button"
                                onClick={handleAddBusiness}
                                className="flex w-full cursor-pointer items-center gap-4 rounded-2xl p-4 transition-all hover:bg-black/5 dark:hover:bg-white/5 border border-dashed border-brand-deep/20 dark:border-white/20 mt-2"
                            >
                                <div className="h-12 w-12 rounded-xl bg-brand-gold/20 flex items-center justify-center text-brand-gold">
                                    <Plus className="h-6 w-6" />
                                </div>
                                <div className="flex-1 text-left">
                                    <h3 className="font-bold text-brand-deep dark:text-brand-cream">Add business</h3>
                                </div>
                            </button>
                        )}
                        {isMultiBusinessRestricted && businesses.length > 1 && (
                            <div className="mt-2 rounded-2xl border border-amber-400/20 bg-amber-500/10 p-3 text-xs text-amber-800 dark:text-amber-200">
                                Free plan allows only your first business.
                                <button
                                    onClick={() => {
                                        if (primaryBusinessId) {
                                            const primary = businesses.find((b) => b.id === primaryBusinessId)
                                            if (primary) setActiveBusiness(primary, { quiet: true })
                                        }
                                        setOpen(false)
                                        router.push("/settings?tab=billing")
                                    }}
                                    className="ml-1 underline font-semibold"
                                >
                                    Upgrade to unlock all.
                                </button>
                            </div>
                        )}
                    </div>
                </div>
                <div className="p-4 bg-brand-deep/5 dark:bg-white/5 border-t border-brand-deep/5 dark:border-white/5 mt-auto">
                    <DrawerClose asChild>
                        <Button className="w-full h-14 rounded-2xl bg-brand-deep text-brand-gold dark:bg-brand-gold dark:text-brand-deep font-bold">Close</Button>
                    </DrawerClose>
                </div>
            </DrawerContent>
        </Drawer>
    )
}
