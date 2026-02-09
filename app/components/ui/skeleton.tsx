import { cn } from "@/app/lib/utils"

function Skeleton({
    className,
    ...props
}: React.HTMLAttributes<HTMLDivElement>) {
    return (
        <div
            className={cn("animate-pulse rounded-md bg-brand-deep/5 dark:bg-white/5", className)}
            {...props}
        />
    )
}

export { Skeleton }
