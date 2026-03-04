import { Skeleton } from "@/app/components/ui/skeleton"
import { GlassCard } from "@/app/components/ui/glass-card"

export function OrdersSkeleton({ isMobile }: { isMobile: boolean }) {
    if (isMobile) {
        return (
            <div className="space-y-3">
                {[1, 2, 3, 4, 5].map((i) => (
                    <GlassCard key={i} className="p-4 flex justify-between items-center border-brand-deep/5 dark:border-white/5">
                        <div className="space-y-2 flex-1">
                            <Skeleton className="h-4 w-3/4" />
                            <Skeleton className="h-3 w-1/2" />
                        </div>
                        <div className="text-right space-y-2">
                            <Skeleton className="h-4 w-16 ml-auto" />
                            <Skeleton className="h-3 w-12 ml-auto" />
                        </div>
                    </GlassCard>
                ))}
            </div>
        )
    }

    return (
        <GlassCard className="overflow-hidden border-brand-deep/5 dark:border-white/5">
            <div className="p-4 border-b border-brand-deep/5 dark:border-white/5 bg-brand-deep/5 dark:bg-white/5">
                <div className="grid grid-cols-6 gap-4">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                        <Skeleton key={i} className="h-4 w-20" />
                    ))}
                </div>
            </div>
            <div className="divide-y divide-brand-deep/5 dark:divide-white/5">
                {[1, 2, 3, 4, 5, 6, 7].map((i) => (
                    <div key={i} className="p-4 grid grid-cols-6 gap-4">
                        <Skeleton className="h-4 w-12" />
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-4 w-20" />
                        <Skeleton className="h-4 w-16" />
                        <Skeleton className="h-6 w-20 rounded-full" />
                        <Skeleton className="h-4 w-16" />
                    </div>
                ))}
            </div>
        </GlassCard>
    )
}
