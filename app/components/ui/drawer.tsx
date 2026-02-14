"use client"

import * as React from "react"
import { Drawer as DrawerPrimitive } from "vaul"
import { cn } from "@/app/lib/utils"

import { X } from "lucide-react"

const Drawer = ({
    shouldScaleBackground = true,
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
        className={cn("fixed inset-0 z-50 bg-black/40 backdrop-blur-sm", className)}
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
                "fixed inset-x-0 bottom-0 z-50 mt-24 flex h-auto max-h-[96vh] flex-col rounded-t-[32px] border-none outline-none focus:outline-none focus:ring-0 bg-brand-cream dark:bg-brand-deep-900 dark:border dark:border-brand-gold shadow-2xl dark:shadow-sm dark:shadow-brand-deep-500",
                "max-w-5xl md:max-w-2xl mx-auto", // Optimized for desktop
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
            "shrink-0 p-8 pb-4 bg-brand-cream/80 dark:bg-brand-deep-800 backdrop-blur-md border-b border-brand-deep/5 dark:border-white/5 z-20 rounded-t-[32px]",
            className
        )}
        {...props}
    >
        <div className="mx-auto mb-6 h-1.5 w-12 rounded-full bg-brand-deep/10 dark:bg-white/10" />
        <div className="max-w-full mx-auto flex items-center justify-between gap-4">
            <div className="flex-1 min-w-0">
                {children}
            </div>
            {showClose && (
                <DrawerClose asChild>
                    <button className="p-2 bg-brand-deep/5 cursor-pointer dark:bg-white/5 hover:bg-brand-deep/10 dark:hover:bg-white/10 rounded-full text-brand-accent/40 dark:text-brand-cream/40 transition-colors shrink-0">
                        <X className="w-6 h-6" />
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
        className={cn("flex-1 overflow-y-auto p-6 md:p-8", className)}
        {...props}
    />
)
DrawerBody.displayName = "DrawerBody"

const DrawerFooter = ({
    className,
    ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
    <div
        className={cn("shrink-0 flex flex-col gap-2 p-6 md:p-8 border-t border-brand-deep/5 dark:border-white/5 bg-brand-cream/50 dark:bg-zinc-950/50", className)}
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
