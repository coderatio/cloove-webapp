"use client"

import * as React from "react"
import { Tooltip as BaseTooltipPrimitive } from "@base-ui/react"
import { cn } from "@/app/lib/utils"

const TooltipProvider = BaseTooltipPrimitive.Provider
const Tooltip = BaseTooltipPrimitive.Root
const TooltipTrigger = BaseTooltipPrimitive.Trigger
const TooltipPortal = BaseTooltipPrimitive.Portal

const TooltipContent = React.forwardRef<
    React.ElementRef<typeof BaseTooltipPrimitive.Popup>,
    React.ComponentPropsWithoutRef<typeof BaseTooltipPrimitive.Popup>
>(({ className, children, ...props }, ref) => (
    <TooltipPortal>
        <BaseTooltipPrimitive.Positioner className="z-100" sideOffset={8}>
            <BaseTooltipPrimitive.Popup
                ref={ref}
                className={cn(
                    "outline-none",
                    "group data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
                    className
                )}
                {...props}
            >
                <div className="rounded-lg border border-white/10 bg-green-950 dark:bg-brand-gold px-3 py-1.5 text-[11px] font-bold text-white dark:text-brand-deep-950 shadow-xl backdrop-blur-md">
                    {children}
                    <BaseTooltipPrimitive.Arrow className="fill-green-950 dark:fill-brand-gold" />
                </div>
            </BaseTooltipPrimitive.Popup>
        </BaseTooltipPrimitive.Positioner>
    </TooltipPortal>
))
TooltipContent.displayName = "TooltipContent"

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider }
