import * as React from "react"
import { cn } from "@/app/lib/utils"

const VisuallyHidden = React.forwardRef<
    HTMLSpanElement,
    React.HTMLAttributes<HTMLSpanElement>
>(({ className, ...props }, ref) => {
    return (
        <span
            ref={ref}
            className={cn(
                "absolute h-px w-px overflow-hidden whitespace-nowrap border-0 p-0 [clip:rect(0,0,0,0)]",
                className
            )}
            {...props}
        />
    )
})
VisuallyHidden.displayName = "VisuallyHidden"

export { VisuallyHidden }
