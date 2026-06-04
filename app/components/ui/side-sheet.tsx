"use client"

import * as React from "react"
import { Drawer as VaulDrawer } from "vaul"
import { HugeiconsIcon } from "@hugeicons/react"
import { Cancel01Icon as X } from "@hugeicons/core-free-icons"
import { cn } from "@/app/lib/utils"
import { useIsMobile } from "@/app/hooks/useMediaQuery"

// We reuse the existing drawer animation overrides so the side sheet feels
// consistent with the bottom drawer (same easing, same 280ms duration).
import "./drawer-vaul-overrides.css"

/**
 * SideSheet: a right-side panel on desktop, bottom drawer on mobile.
 *
 * Uses vaul under the hood so swipe-to-dismiss, focus trap, and scroll lock
 * all behave like the standard `Drawer`. The two layouts share a single
 * children tree — callers don't write two markups.
 */

type SideSheetRootProps = React.ComponentProps<typeof VaulDrawer.Root>

const SideSheetContext = React.createContext<{ isMobile: boolean }>({ isMobile: false })

function SideSheet({ children, ...props }: SideSheetRootProps) {
    const isMobile = useIsMobile()
    return (
        <SideSheetContext.Provider value={{ isMobile }}>
            <VaulDrawer.Root direction={isMobile ? "bottom" : "right"} {...props}>
                {children}
            </VaulDrawer.Root>
        </SideSheetContext.Provider>
    )
}
SideSheet.displayName = "SideSheet"

const SideSheetTrigger = VaulDrawer.Trigger
const SideSheetClose = VaulDrawer.Close
const SideSheetPortal = VaulDrawer.Portal

const SideSheetOverlay = React.forwardRef<
    React.ElementRef<typeof VaulDrawer.Overlay>,
    React.ComponentPropsWithoutRef<typeof VaulDrawer.Overlay>
>(({ className, ...props }, ref) => (
    <VaulDrawer.Overlay
        ref={ref}
        className={cn("fixed inset-0 z-50 bg-black/45", className)}
        {...props}
    />
))
SideSheetOverlay.displayName = VaulDrawer.Overlay.displayName

const SideSheetContent = React.forwardRef<
    React.ElementRef<typeof VaulDrawer.Content>,
    React.ComponentPropsWithoutRef<typeof VaulDrawer.Content>
>(({ className, children, ...props }, ref) => {
    const { isMobile } = React.useContext(SideSheetContext)
    return (
        <SideSheetPortal>
            <SideSheetOverlay />
            <VaulDrawer.Content
                ref={ref}
                className={cn(
                    "fixed z-50 flex flex-col border border-slate-200 bg-white outline-none focus:outline-none focus:ring-0 dark:border-slate-800 dark:bg-slate-950",
                    "contain-[layout_paint]",
                    isMobile
                        ? "inset-x-0 bottom-0 mt-24 h-auto max-h-[96vh] rounded-t-[28px] mx-auto w-full"
                        : "right-0 top-0 h-full w-full max-w-xl rounded-l-[28px] border-r-0",
                    className
                )}
                {...props}
            >
                {children}
            </VaulDrawer.Content>
        </SideSheetPortal>
    )
})
SideSheetContent.displayName = "SideSheetContent"

const SideSheetStickyHeader = ({
    className,
    children,
    showClose = true,
    ...props
}: React.HTMLAttributes<HTMLDivElement> & { showClose?: boolean }) => {
    const { isMobile } = React.useContext(SideSheetContext)
    return (
        <div
            className={cn(
                "relative z-20 shrink-0 border-b border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-950 sm:p-6",
                isMobile && "rounded-t-[28px] pb-3 sm:pb-4",
                !isMobile && "rounded-tl-[28px]",
                className
            )}
            {...props}
        >
            {isMobile && (
                <div className="mx-auto mb-4 h-1.5 w-10 rounded-full bg-slate-200 dark:bg-white/10" />
            )}
            <div className="max-w-full mx-auto flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                    {children}
                </div>
                {showClose && (
                    <SideSheetClose asChild>
                        <button
                            aria-label="Close"
                            className="shrink-0 rounded-full bg-slate-100 p-2 text-slate-600 transition-colors hover:bg-slate-200 dark:bg-white/5 dark:text-slate-300 dark:hover:bg-white/10"
                        >
                            <HugeiconsIcon icon={X} className="h-5 w-5" />
                        </button>
                    </SideSheetClose>
                )}
            </div>
        </div>
    )
}
SideSheetStickyHeader.displayName = "SideSheetStickyHeader"

const SideSheetBody = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
    ({ className, ...props }, ref) => (
        <div
            ref={ref}
            className={cn(
                "flex-1 overflow-y-auto overscroll-contain p-4 sm:p-6",
                "contain-content will-change-scroll [-webkit-overflow-scrolling:touch] transform-gpu",
                className
            )}
            {...props}
        />
    )
)
SideSheetBody.displayName = "SideSheetBody"

const SideSheetFooter = ({
    className,
    ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
    <div
        className={cn(
            "shrink-0 flex flex-col gap-2 border-t border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-950 sm:p-6",
            className
        )}
        {...props}
    />
)
SideSheetFooter.displayName = "SideSheetFooter"

const SideSheetTitle = React.forwardRef<
    React.ElementRef<typeof VaulDrawer.Title>,
    React.ComponentPropsWithoutRef<typeof VaulDrawer.Title>
>(({ className, ...props }, ref) => (
    <VaulDrawer.Title
        ref={ref}
        className={cn(
            "font-serif text-2xl sm:text-3xl font-medium text-brand-deep dark:text-brand-cream leading-none tracking-tight",
            className
        )}
        {...props}
    />
))
SideSheetTitle.displayName = VaulDrawer.Title.displayName

const SideSheetDescription = React.forwardRef<
    React.ElementRef<typeof VaulDrawer.Description>,
    React.ComponentPropsWithoutRef<typeof VaulDrawer.Description>
>(({ className, ...props }, ref) => (
    <VaulDrawer.Description
        ref={ref}
        className={cn("mt-1 text-sm text-brand-accent/60 dark:text-brand-cream/60 leading-relaxed", className)}
        {...props}
    />
))
SideSheetDescription.displayName = VaulDrawer.Description.displayName

export {
    SideSheet,
    SideSheetTrigger,
    SideSheetClose,
    SideSheetPortal,
    SideSheetOverlay,
    SideSheetContent,
    SideSheetStickyHeader,
    SideSheetBody,
    SideSheetFooter,
    SideSheetTitle,
    SideSheetDescription,
}
