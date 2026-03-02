"use client"

import * as React from "react"
import { RadioGroup as BaseRadioGroupRoot, Radio as BaseRadioPrimitive } from "@base-ui/react"
import { cn } from "@/app/lib/utils"
import { motion, AnimatePresence } from "framer-motion"

const RadioGroup = React.forwardRef<
    React.ElementRef<typeof BaseRadioGroupRoot>,
    React.ComponentPropsWithoutRef<typeof BaseRadioGroupRoot>
>(({ className, ...props }, ref) => {
    return (
        <BaseRadioGroupRoot
            ref={ref}
            className={cn("grid gap-4", className)}
            {...props}
        />
    )
})
RadioGroup.displayName = "RadioGroup"

const RadioGroupItem = React.forwardRef<
    React.ElementRef<typeof BaseRadioPrimitive.Root>,
    React.ComponentPropsWithoutRef<typeof BaseRadioPrimitive.Root> & {
        title?: string;
        description?: string;
        icon?: React.ReactNode;
    }
>(({ className, children, title, description, icon, ...props }, ref) => {
    return (
        <BaseRadioPrimitive.Root
            ref={ref}
            className={cn(
                "group relative flex items-start gap-4 rounded-3xl border border-brand-accent/5 bg-brand-deep/2 p-5 text-left transition-all duration-300",
                "cursor-pointer outline-none select-none",
                "hover:bg-white dark:hover:bg-white/5 hover:border-brand-accent/20 dark:hover:border-white/20",
                "focus-visible:ring-2 focus-visible:ring-brand-gold focus-visible:ring-offset-2",
                "data-checked:border-brand-gold data-checked:bg-white dark:data-checked:bg-white/5 data-checked:ring-2 data-checked:ring-brand-gold/10",
                className
            )}
            {...props}
        >
            {icon && (
                <div className="shrink-0 mt-1 flex h-6 w-6 items-center justify-center text-brand-deep/60 dark:text-brand-cream/60 group-data-checked:text-brand-gold">
                    {icon}
                </div>
            )}
            <div className="flex-1 space-y-1">
                {title && (
                    <p className="text-sm font-black text-brand-deep dark:text-brand-cream group-data-checked:text-brand-deep dark:group-data-checked:text-brand-gold">
                        {title}
                    </p>
                )}
                {description && (
                    <p className="text-[11px] font-medium leading-relaxed text-brand-deep/50 dark:text-brand-cream/60">
                        {description}
                    </p>
                )}
                {children}
            </div>

            <div className="shrink-0 self-center">
                <div className="flex h-5 w-5 items-center justify-center rounded-full border-2 border-brand-deep/10 dark:border-white/10 group-data-checked:border-brand-gold group-data-checked:bg-brand-gold">
                    <BaseRadioPrimitive.Indicator>
                        <motion.div
                            initial={{ scale: 0.5, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="h-2 w-2 rounded-full bg-white"
                        />
                    </BaseRadioPrimitive.Indicator>
                </div>
            </div>

            {/* Glossy overlay for checked state */}
            <div className="absolute inset-0 pointer-events-none rounded-3xl opacity-0 group-data-checked:opacity-100 transition-opacity duration-300">
                <div className="absolute inset-0 bg-linear-to-br from-brand-gold/5 to-transparent" />
            </div>
        </BaseRadioPrimitive.Root>
    )
})
RadioGroupItem.displayName = "RadioGroupItem"

export { RadioGroup, RadioGroupItem }
