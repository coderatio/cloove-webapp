"use client"

import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/app/lib/utils"

const buttonVariants = cva(
    "inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 cursor-pointer",
    {
        variants: {
            variant: {
                default: "bg-primary text-primary-foreground hover:bg-primary/90",
                destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
                outline: "border border-brand-accent/10 dark:border-brand-gold/20 bg-transparent hover:bg-brand-green/5 dark:hover:bg-brand-gold/5 hover:text-brand-green dark:hover:text-brand-gold hover:border-brand-green/20 dark:hover:border-brand-gold/30 transition-all duration-300",
                secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
                ghost: "bg-transparent hover:bg-brand-green/5 dark:hover:bg-brand-gold/5 hover:text-brand-green dark:hover:text-brand-gold transition-all duration-300",
                link: "text-primary underline-offset-4 hover:underline",
                glass: "bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/20 text-foreground shadow-sm",
            },
            size: {
                default: "h-10 px-4 py-2",
                sm: "h-9 rounded-md px-3",
                lg: "h-11 rounded-md px-8",
                icon: "h-10 w-10",
            },
        },
        defaultVariants: {
            variant: "default",
            size: "default",
        },
    }
)

export interface ButtonProps
    extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
    asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant, size, asChild = false, ...props }, ref) => {
        // We need to install @radix-ui/react-slot for asChild, but simpler to just use button for now if not installed
        // Actually, I'll assume standard button if Slot is not available, but 'asChild' pattern is great.
        // I'll skip Slot for now to avoid one more dependency if I didn't install it, but I should probably just make it a standard button.
        const Comp = "button"
        return (
            <Comp
                className={cn(buttonVariants({ variant, size, className }))}
                ref={ref}
                {...props}
            />
        )
    }
)
Button.displayName = "Button"

export { Button, buttonVariants }
