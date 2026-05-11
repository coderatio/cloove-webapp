"use client"

import * as React from "react"
import { Drawer as DrawerPrimitive } from "vaul"
import { cn } from "@/app/lib/utils"

import "./drawer-vaul-overrides.css"

import { X } from "lucide-react"

const Drawer = ({
    shouldScaleBackground = false,
    ...props
}: React.ComponentProps<typeof DrawerPrimitive.Root>) => (
    <DrawerPrimitive.Root
        shouldScaleBackground={shouldScaleBackground}
        {...props}
    />
)
Drawer.displayName = "Drawer"

const DrawerTrigger = DrawerPrimitive.Trigger

const DrawerPortal = DrawerPrimitive.Portal

const DrawerClose = DrawerPrimitive.Close

const DrawerOverlay = React.forwardRef<
    React.ElementRef<typeof DrawerPrimitive.Overlay>,
    React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Overlay>
>(({ className, ...props }, ref) => (
    <DrawerPrimitive.Overlay
        ref={ref}
        className={cn("fixed inset-0 z-50 bg-black/45 backdrop-blur-[1px]", className)}
        {...props}
    />
))
DrawerOverlay.displayName = DrawerPrimitive.Overlay.displayName

const DrawerContent = React.forwardRef<
    React.ElementRef<typeof DrawerPrimitive.Content>,
    React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Content>
>(({ className, children, ...props }, ref) => (
    <DrawerPortal>
        <DrawerOverlay />
        <DrawerPrimitive.Content
            ref={ref}
            className={cn(
                "fixed inset-x-0 bottom-0 z-50 mt-24 flex h-auto max-h-[96vh] flex-col rounded-t-[28px] border border-slate-200 bg-white outline-none focus:outline-none focus:ring-0 dark:border-slate-800 dark:bg-slate-950/80",
                "mx-auto w-full sm:max-w-lg md:max-w-xl", // Compact desktop drawers
                className
            )}
            {...props}
        >
            {children}
        </DrawerPrimitive.Content>
    </DrawerPortal>
))
DrawerContent.displayName = "DrawerContent"

const DrawerStickyHeader = ({
    className,
    children,
    showClose = true,
    ...props
}: React.HTMLAttributes<HTMLDivElement> & { showClose?: boolean }) => (
    <div
        className={cn(
            "relative z-20 shrink-0 rounded-t-[28px] border-b border-slate-200 bg-white/85 p-5 pb-3 backdrop-blur-md dark:border-slate-800 dark:bg-slate-950/70 sm:p-6 sm:pb-4",
            className
        )}
        {...props}
    >
        <div className="mx-auto mb-4 h-1.5 w-10 rounded-full bg-slate-200 dark:bg-white/10" />
        <div className="max-w-full mx-auto flex items-center justify-between gap-4">
            <div className="flex-1 min-w-0">
                {children}
            </div>
            {showClose && (
                <DrawerClose asChild>
                    <button className="absolute right-3 top-3 rounded-full bg-slate-100 p-2 text-slate-600 transition-colors hover:bg-slate-200 dark:bg-white/5 dark:text-slate-300 dark:hover:bg-white/10 sm:right-4 sm:top-4">
                        <X className="h-5 w-5" />
                    </button>
                </DrawerClose>
            )}
        </div>
    </div>
)
DrawerStickyHeader.displayName = "DrawerStickyHeader"

const DrawerHeader = ({
    className,
    ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
    <div
        className={cn("grid gap-1.5 p-4 text-center sm:text-left", className)}
        {...props}
    />
)
DrawerHeader.displayName = "DrawerHeader"

const DrawerBody = ({
    className,
    ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
    <div
        className={cn("flex-1 overflow-y-auto p-4 sm:p-6", className)}
        {...props}
    />
)
DrawerBody.displayName = "DrawerBody"

const DrawerFooter = ({
    className,
    ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
    <div
        className={cn("shrink-0 flex flex-col gap-2 border-t border-slate-200 bg-white/60 p-4 backdrop-blur-md dark:border-slate-800 dark:bg-slate-950/60 sm:p-6", className)}
        {...props}
    />
)
DrawerFooter.displayName = "DrawerFooter"

const DrawerTitle = React.forwardRef<
    React.ElementRef<typeof DrawerPrimitive.Title>,
    React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Title>
>(({ className, ...props }, ref) => (
    <DrawerPrimitive.Title
        ref={ref}
        className={cn(
            "font-serif text-3xl font-medium text-brand-deep dark:text-brand-cream leading-none tracking-tight",
            className
        )}
        {...props}
    />
))
DrawerTitle.displayName = DrawerPrimitive.Title.displayName

const DrawerDescription = React.forwardRef<
    React.ElementRef<typeof DrawerPrimitive.Description>,
    React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Description>
>(({ className, ...props }, ref) => (
    <DrawerPrimitive.Description
        ref={ref}
        className={cn("text-sm text-brand-accent/60 dark:text-brand-cream/60 leading-relaxed", className)}
        {...props}
    />
))
DrawerDescription.displayName = DrawerPrimitive.Description.displayName

export {
    Drawer,
    DrawerPortal,
    DrawerOverlay,
    DrawerTrigger,
    DrawerClose,
    DrawerContent,
    DrawerHeader,
    DrawerStickyHeader,
    DrawerBody,
    DrawerFooter,
    DrawerTitle,
    DrawerDescription,
}
