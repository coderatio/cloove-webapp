"use client"

import * as React from "react"
import { Dialog as BaseDialogPrimitive } from "@base-ui/react"
import { motion, AnimatePresence } from "framer-motion"
import { X } from "lucide-react"
import { cn } from "@/app/lib/utils"
import { useIsMobile } from "@/app/hooks/useMediaQuery"

/* ─── Primitives (re-export as-is) ─── */
const Dialog = BaseDialogPrimitive.Root
const DialogTrigger = BaseDialogPrimitive.Trigger
const DialogClose = BaseDialogPrimitive.Close
const DialogPortal = BaseDialogPrimitive.Portal

/* ─── Animation variants ─── */
const backdropVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
}

const desktopPopupVariants = {
    hidden: { opacity: 0, scale: 0.96, y: -12 },
    visible: { opacity: 1, scale: 1, y: 0 },
    exit: { opacity: 0, scale: 0.97, y: 8 },
}

const mobileDrawerVariants = {
    hidden: { y: "100%" },
    visible: { y: 0 },
    exit: { y: "100%" },
}

const springTransition = {
    type: "spring" as const,
    damping: 30,
    stiffness: 350,
    mass: 0.8,
}

const desktopTransition = {
    duration: 0.45,
    ease: [0.16, 1, 0.3, 1] as const,
    opacity: { duration: 0.25 },
}

/* ─── Backdrop / Overlay ─── */
const DialogOverlay = React.forwardRef<
    React.ElementRef<typeof BaseDialogPrimitive.Backdrop>,
    React.ComponentPropsWithoutRef<typeof BaseDialogPrimitive.Backdrop>
>(({ className, ...props }, ref) => (
    <BaseDialogPrimitive.Backdrop
        ref={ref}
        className={cn(
            "fixed inset-0 z-50 bg-brand-deep/30 dark:bg-black/50 backdrop-blur-xl",
            className
        )}
        {...props}
        render={(backdropProps, state) => {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { onDrag, ...restProps } = backdropProps as any;
            return (
                <AnimatePresence>
                    {state.open && (
                        <motion.div
                            variants={backdropVariants}
                            initial="hidden"
                            animate="visible"
                            exit="hidden"
                            transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
                            {...restProps}
                        />
                    )}
                </AnimatePresence>
            );
        }}
    />
))
DialogOverlay.displayName = "DialogOverlay"

/* ─── Content / Popup ─── */
interface DialogContentProps
    extends React.ComponentPropsWithoutRef<typeof BaseDialogPrimitive.Popup> {
    /** Override mobile detection (useful for stories/tests). */
    forceMobile?: boolean;
    /** Hide the default close button. @default false */
    hideClose?: boolean;
}

const DialogContent = React.forwardRef<
    React.ElementRef<typeof BaseDialogPrimitive.Popup>,
    DialogContentProps
>(({ className, children, forceMobile, hideClose = false, ...props }, ref) => {
    const isMobile = useIsMobile();
    const mobile = forceMobile ?? isMobile;

    return (
        <DialogPortal>
            <DialogOverlay />
            <BaseDialogPrimitive.Popup
                ref={ref}
                className={cn(
                    "fixed z-50 focus:outline-none flex flex-col",
                    // Desktop: centered
                    !mobile && "left-[50%] top-[50%] translate-x-[-50%] translate-y-[-50%] w-full max-w-lg",
                    // Mobile: bottom-anchored
                    mobile && "bottom-0 left-0 right-0 w-full max-h-[92vh]",
                    className
                )}
                {...props}
                render={(popupProps, state) => {
                    // eslint-disable-next-line @typescript-eslint/no-unused-vars
                    const { onDrag, ...restProps } = popupProps as any;
                    return (
                        <AnimatePresence>
                            {state.open && (
                                <motion.div
                                    variants={mobile ? mobileDrawerVariants : desktopPopupVariants}
                                    initial="hidden"
                                    animate="visible"
                                    exit="exit"
                                    transition={mobile ? springTransition : desktopTransition}
                                    className={cn(
                                        "flex flex-col overflow-hidden shadow-2xl",
                                        // Glass panel styling
                                        "glass-panel",
                                        // Shape: rounded-top on mobile, fully rounded on desktop
                                        mobile
                                            ? "rounded-t-[28px] border-b-0"
                                            : "rounded-[28px]",
                                        // Subtle light sweep
                                        "relative",
                                    )}
                                    {...restProps}
                                >
                                    {/* Light sweep overlay */}
                                    <div className="absolute inset-0 bg-linear-to-br from-white/5 to-transparent pointer-events-none rounded-[inherit]" />

                                    {/* Mobile drag indicator */}
                                    {mobile && (
                                        <div className="flex justify-center pt-3 pb-1 shrink-0">
                                            <div className="w-10 h-1 rounded-full bg-brand-deep/15 dark:bg-white/15" />
                                        </div>
                                    )}

                                    {/* Content */}
                                    <div className="relative z-10 flex-1 flex flex-col min-h-0">
                                        {children}
                                    </div>

                                    {/* Close button */}
                                    {!hideClose && (
                                        <BaseDialogPrimitive.Close
                                            className={cn(
                                                "absolute z-50 cursor-pointer rounded-full p-2",
                                                "bg-brand-deep/5 dark:bg-white/5",
                                                "opacity-70 transition-all duration-300",
                                                "hover:opacity-100 hover:bg-brand-deep/10 dark:hover:bg-white/10",
                                                "focus:outline-none ring-2 ring-transparent focus:ring-brand-gold",
                                                "active:scale-90",
                                                mobile ? "right-4 top-4" : "right-6 top-6",
                                            )}
                                        >
                                            <X className="h-5 w-5 text-brand-deep/60 dark:text-brand-cream/60" />
                                            <span className="sr-only">Close</span>
                                        </BaseDialogPrimitive.Close>
                                    )}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    );
                }}
            />
        </DialogPortal>
    );
})
DialogContent.displayName = "DialogContent"

/* ─── Compositional helpers ─── */
const DialogHeader = ({
    className,
    ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
    <div
        className={cn(
            "flex flex-col space-y-2 text-left px-8 pt-8 pb-2",
            className
        )}
        {...props}
    />
)
DialogHeader.displayName = "DialogHeader"

const DialogFooter = ({
    className,
    ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
    <div
        className={cn(
            "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-3 px-8 pb-8 pt-4",
            className
        )}
        {...props}
    />
)
DialogFooter.displayName = "DialogFooter"

const DialogTitle = React.forwardRef<
    React.ElementRef<typeof BaseDialogPrimitive.Title>,
    React.ComponentPropsWithoutRef<typeof BaseDialogPrimitive.Title>
>(({ className, ...props }, ref) => (
    <BaseDialogPrimitive.Title
        ref={ref}
        className={cn(
            "font-serif text-3xl font-medium tracking-tight text-brand-deep dark:text-brand-cream",
            className
        )}
        {...props}
    />
))
DialogTitle.displayName = "DialogTitle"

const DialogDescription = React.forwardRef<
    React.ElementRef<typeof BaseDialogPrimitive.Description>,
    React.ComponentPropsWithoutRef<typeof BaseDialogPrimitive.Description>
>(({ className, ...props }, ref) => (
    <BaseDialogPrimitive.Description
        ref={ref}
        className={cn(
            "text-base text-brand-accent/60 dark:text-brand-cream/60 leading-relaxed",
            className
        )}
        {...props}
    />
))
DialogDescription.displayName = "DialogDescription"

/* ─── Standalone close button (opt-in) ─── */
const DialogCloseButton = React.forwardRef<
    React.ElementRef<typeof BaseDialogPrimitive.Close>,
    React.ComponentPropsWithoutRef<typeof BaseDialogPrimitive.Close>
>(({ className, ...props }, ref) => (
    <BaseDialogPrimitive.Close
        ref={ref}
        className={cn(
            "cursor-pointer rounded-full p-2",
            "bg-brand-deep/5 dark:bg-white/5",
            "opacity-70 transition-all duration-300",
            "hover:opacity-100 hover:bg-brand-deep/10 dark:hover:bg-white/10",
            "focus:outline-none ring-2 ring-transparent focus:ring-brand-gold",
            "active:scale-90",
            className,
        )}
        {...props}
    >
        <X className="h-5 w-5 text-brand-deep/60 dark:text-brand-cream/60" />
        <span className="sr-only">Close</span>
    </BaseDialogPrimitive.Close>
))
DialogCloseButton.displayName = "DialogCloseButton"

export {
    Dialog,
    DialogPortal,
    DialogOverlay,
    DialogClose,
    DialogTrigger,
    DialogContent,
    DialogHeader,
    DialogFooter,
    DialogTitle,
    DialogDescription,
    DialogCloseButton,
}
