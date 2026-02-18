"use client"

import * as React from "react"
import { cn } from "@/app/lib/utils"

export interface TextareaProps
    extends React.TextareaHTMLAttributes<HTMLTextAreaElement> { }

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
    ({ className, ...props }, ref) => {
        return (
            <textarea
                className={cn(
                    "flex min-h-[80px] w-full rounded-xl border border-brand-accent/10 bg-white/50 dark:bg-zinc-950/50 px-3 py-2 text-sm ring-offset-background placeholder:text-brand-accent/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-green/20 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/10 dark:text-brand-cream transition-all",
                    className
                )}
                ref={ref}
                {...props}
            />
        )
    }
)
Textarea.displayName = "Textarea"

export { Textarea }
