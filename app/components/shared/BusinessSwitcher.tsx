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
import { useTheme } from "next-themes"

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
    const { resolvedTheme } = useTheme()
    const isDark = resolvedTheme === "dark"

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
                className={cn(
                    "fixed z-50 min-w-[200px] overflow-hidden rounded-2xl px-2 pt-1 shadow-2xl backdrop-blur-xl animate-in fade-in zoom-in-95",
                    isDark
                        ? "border border-white/10 bg-[#101513]/95"
                        : "border border-brand-green-100 bg-white/96 shadow-lg"
                )}
                style={
                    isCollapsed
                        ? { left: triggerRect.right + 8, top: triggerRect.top, minWidth: 200 }
                        : { left: triggerRect.left, top: triggerRect.bottom + 8, width: triggerRect.width, minWidth: 200 }
                }
            >
                <div className={cn(
                    "mb-1 border-b px-2 py-2 text-[10px] font-bold uppercase tracking-widest",
                    isDark ? "border-white/8 text-white/35" : "border-brand-green-100 text-muted-foreground"
                )}>Your Businesses</div>
                <div className="max-h-[220px] space-y-0.5 overflow-y-auto pb-2">
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
                                "relative flex w-full select-none items-center rounded-xl px-2 py-2.5 text-sm font-medium outline-none transition-all",
                                isDark ? "text-brand-cream" : "text-foreground",
                                isLocked ? "cursor-not-allowed opacity-50" : isDark ? "cursor-pointer hover:bg-white/6" : "cursor-pointer hover:bg-brand-green-50",
                                activeBusiness?.id === business.id && (isDark ? "bg-primary/15 text-white" : "bg-brand-green-50 text-foreground")
                            )}
                        >
                            <div className={cn(
                                "mr-2 flex h-6 w-6 items-center justify-center rounded-md shrink-0",
                                isDark ? "bg-primary/18 text-primary-foreground" : "bg-brand-green-100 text-brand-green-800"
                            )}>
                                <LayoutGrid className="h-3.5 w-3.5" />
                            </div>
                            <div className="flex-1 text-left overflow-hidden">
                                <span className="block truncate">{business.name}</span>
                                <span
                                    onClick={(e) => copySlug(e, business.code)}
                                    className={cn(
                                        "inline-flex cursor-copy items-center gap-1 text-[10px] uppercase tracking-wider transition-colors",
                                        isDark ? "text-white/40 hover:text-white/75" : "text-muted-foreground hover:text-foreground"
                                    )}
                                >
                                    {copiedSlug === business.code ? <Check className="h-2.5 w-2.5" /> : <Copy className="h-2.5 w-2.5" />}
                                    {business.code}
                                </span>
                            </div>
                            {activeBusiness?.id === business.id && <Check className={cn("ml-auto h-4 w-4", isDark ? "text-primary-foreground" : "text-foreground")} />}
                        </button>
                            )
                        })()
                    ))}
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
                {canAddBusiness && (
                    <div className={cn(
                        "mt-auto border-t px-1 py-2",
                        isDark ? "border-white/8 bg-black/10" : "border-brand-green-100 bg-white/80"
                    )}>
                        <button
                            type="button"
                            onClick={handleAddBusiness}
                            className={cn(
                                "relative flex w-full cursor-pointer select-none items-center rounded-xl border border-dashed px-2.5 py-2.5 text-sm font-medium outline-none transition-all",
                                isDark
                                    ? "border-white/12 bg-white/4 text-white hover:bg-white/8"
                                    : "border-brand-green-200 bg-brand-green-50/70 text-foreground hover:bg-brand-green-50"
                            )}
                        >
                            <div className={cn(
                                "mr-2 flex h-7 w-7 items-center justify-center rounded-md shrink-0",
                                isDark ? "bg-primary/18 text-primary-foreground" : "bg-brand-green-100 text-brand-green-800"
                            )}>
                                <Plus className="h-3.5 w-3.5" />
                            </div>
                            <span className="flex-1 text-left">Add business</span>
                        </button>
                    </div>
                )}
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
                        "flex w-full cursor-pointer items-center gap-2 rounded-[14px] border p-2 transition-colors",
                        isDark
                            ? "border-white/10 bg-white/5 text-brand-cream hover:bg-white/10"
                            : "border-brand-green-100 bg-white text-foreground hover:bg-brand-green-50",
                        isCollapsed && "justify-center border-0 bg-transparent p-0 hover:bg-transparent"
                    )}
                >
                    <div className={cn(
                        "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg shadow-sm",
                        isDark ? "bg-primary/20 text-primary-foreground shadow-black/20" : "bg-brand-green-100 text-brand-green-800"
                    )}>
                        <LayoutGrid className="h-4 w-4" />
                    </div>
                    {!isCollapsed && (
                        <>
                            <div className="flex flex-1 flex-col items-start overflow-hidden text-left">
                                <span className={cn(
                                    "mb-1 text-[10px] font-bold uppercase leading-none tracking-wider",
                                    isDark ? "text-brand-cream/40" : "text-muted-foreground"
                                )}>Business</span>
                                <span className="truncate text-sm font-bold leading-none">{activeBusiness?.name || 'Select Business'}</span>
                            </div>
                            <ChevronsUpDown className={cn("h-4 w-4 shrink-0", isDark ? "opacity-50" : "text-muted-foreground")} />
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
                <button className="flex cursor-pointer items-center gap-2 rounded-full border border-border bg-white/50 px-3 py-1.5 text-sm font-medium text-foreground shadow-sm ring-1 ring-black/5 backdrop-blur-sm dark:bg-white/5 dark:text-brand-cream dark:ring-white/5">
                    <LayoutGrid className="h-3.5 w-3.5 text-muted-foreground dark:text-primary-foreground" />
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
                                <div className="h-12 w-12 rounded-xl bg-primary/20 flex items-center justify-center text-primary-foreground shadow-lg">
                                    <LayoutGrid className="h-6 w-6" />
                                </div>
                                <div className="flex-1 text-left">
                                    <h3 className="font-bold text-foreground dark:text-brand-cream">{business.name}</h3>
                                    <p
                                        onClick={(e) => copySlug(e, business.code)}
                                        className="inline-flex cursor-copy items-center gap-1 text-xs uppercase tracking-wider text-muted-foreground transition-colors hover:text-foreground dark:text-brand-cream/50 dark:hover:text-brand-cream/80"
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
                                    <h3 className="font-bold text-foreground dark:text-brand-cream">Add business</h3>
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
                        <Button className="h-14 w-full rounded-2xl font-bold">Close</Button>
                    </DrawerClose>
                </div>
            </DrawerContent>
        </Drawer>
    )
}
