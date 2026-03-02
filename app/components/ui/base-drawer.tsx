"use client"

import * as React from "react"
import { DrawerPreview as BaseDrawerPrimitive } from "@base-ui/react"
import { motion, AnimatePresence } from "framer-motion"
import { X } from "lucide-react"
import { cn } from "@/app/lib/utils"

const Drawer = BaseDrawerPrimitive.Root
const DrawerTrigger = BaseDrawerPrimitive.Trigger
const DrawerClose = BaseDrawerPrimitive.Close
const DrawerPortal = BaseDrawerPrimitive.Portal

const DrawerBackdrop = React.forwardRef<
    React.ElementRef<typeof BaseDrawerPrimitive.Backdrop>,
    React.ComponentPropsWithoutRef<typeof BaseDrawerPrimitive.Backdrop>
>(({ className, ...props }, ref) => (
    <BaseDrawerPrimitive.Backdrop
        ref={ref}
        className={cn(
            "fixed inset-0 z-50 bg-brand-deep/60 backdrop-blur-md",
            className
        )}
        {...props}
        render={(backdropProps: any, state: { open: boolean }) => (
            <AnimatePresence>
                {state.open && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.4 }}
                        {...backdropProps}
                    />
                )}
            </AnimatePresence>
        )}
    />
))
DrawerBackdrop.displayName = "DrawerBackdrop"

const DrawerContent = React.forwardRef<
    React.ElementRef<typeof BaseDrawerPrimitive.Popup>,
    React.ComponentPropsWithoutRef<typeof BaseDrawerPrimitive.Popup>
>(({ className, children, ...props }, ref) => (
    <DrawerPortal>
        <DrawerBackdrop />
        <BaseDrawerPrimitive.Popup
            ref={ref}
            className={cn(
                "fixed inset-x-0 bottom-0 z-50 flex h-auto max-h-[96vh] flex-col focus:outline-none",
                "max-w-4xl mx-auto md:max-w-2xl", // Centered optimization
                className
            )}
            {...props}
            render={(popupProps: any, state: { open: boolean }) => (
                <AnimatePresence>
                    {state.open && (
                        <motion.div
                            initial={{ y: "100%" }}
                            animate={{ y: 0 }}
                            exit={{ y: "100%" }}
                            transition={{
                                type: "spring",
                                damping: 25,
                                stiffness: 200,
                                mass: 0.8
                            }}
                            className="bg-brand-cream dark:bg-brand-deep-900 rounded-t-[40px] shadow-2xl overflow-hidden border-t border-brand-deep/5 dark:border-white/10"
                            {...popupProps}
                        >
                            <div className="mx-auto mt-4 h-1.5 w-12 rounded-full bg-brand-deep/10 dark:bg-white/10" />
                            {children}
                        </motion.div>
                    )}
                </AnimatePresence>
            )}
        />
    </DrawerPortal>
))
DrawerContent.displayName = "DrawerContent"

const DrawerHeader = ({
    className,
    ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
    <div
        className={cn("grid gap-2 p-8 pt-6 text-left", className)}
        {...props}
    />
)
DrawerHeader.displayName = "DrawerHeader"

const DrawerBody = ({
    className,
    ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
    <div
        className={cn("flex-1 overflow-y-auto p-8 pt-0", className)}
        {...props}
    />
)
DrawerBody.displayName = "DrawerBody"

const DrawerFooter = ({
    className,
    ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
    <div
        className={cn("mt-auto flex flex-col gap-3 p-8 bg-brand-deep/5 dark:bg-white/5", className)}
        {...props}
    />
)
DrawerFooter.displayName = "DrawerFooter"

const DrawerTitle = React.forwardRef<
    React.ElementRef<typeof BaseDrawerPrimitive.Title>,
    React.ComponentPropsWithoutRef<typeof BaseDrawerPrimitive.Title>
>(({ className, ...props }, ref) => (
    <BaseDrawerPrimitive.Title
        ref={ref}
        className={cn(
            "font-serif text-4xl font-medium tracking-tight text-brand-deep dark:text-brand-cream",
            className
        )}
        {...props}
    />
))
DrawerTitle.displayName = "DrawerTitle"

const DrawerDescription = React.forwardRef<
    React.ElementRef<typeof BaseDrawerPrimitive.Description>,
    React.ComponentPropsWithoutRef<typeof BaseDrawerPrimitive.Description>
>(({ className, ...props }, ref) => (
    <BaseDrawerPrimitive.Description
        ref={ref}
        className={cn("text-base text-brand-accent/60 dark:text-brand-cream/60 leading-relaxed", className)}
        {...props}
    />
))
DrawerDescription.displayName = "DrawerDescription"

export {
    Drawer,
    DrawerPortal,
    DrawerTrigger,
    DrawerClose,
    DrawerContent,
    DrawerHeader,
    DrawerBody,
    DrawerFooter,
    DrawerTitle,
    DrawerDescription,
}
