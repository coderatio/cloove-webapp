import { Skeleton } from "../ui/skeleton"
import { GlassCard } from "../ui/glass-card"

export function DashboardSkeleton() {
    return (
        <div className="max-w-5xl mx-auto space-y-8 pb-20">
            {/* Header Skeleton - greeting + 2-column filters */}
            <div className="pt-1 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                <div className="space-y-2 min-w-0">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-8 md:h-10 w-48" />
                </div>
                <div className="grid grid-cols-2 gap-2 md:gap-3 w-full md:w-auto">
                    <Skeleton className="h-10 rounded-xl min-w-0" />
                    <Skeleton className="h-10 rounded-xl min-w-0" />
                </div>
            </div>

            {/* Hero Skeleton - Wallet + Sales (matches DashboardHero layout) */}
            <GlassCard className="rounded-[32px] md:rounded-[40px] p-6 md:px-10 md:py-10 min-h-[320px] md:min-h-[280px] border-white/20 dark:border-white/5">
                <div className="relative flex flex-col md:flex-row md:items-stretch gap-8 md:gap-10 md:min-h-[200px]">
                    {/* Wallet block */}
                    <div className="flex-1 flex flex-col items-center md:items-start justify-center">
                        <Skeleton className="h-3 w-24 mb-3" />
                        <Skeleton className="h-10 sm:h-12 md:h-14 w-40 mb-4 rounded-xl" />
                        <div className="flex flex-wrap gap-2 md:gap-3 justify-center md:justify-start">
                            <Skeleton className="h-9 md:h-10 w-28 rounded-full" />
                            <Skeleton className="h-9 md:h-10 w-24 rounded-full" />
                        </div>
                    </div>
                    <div className="hidden md:block w-px bg-brand-deep/10 dark:bg-white/10 shrink-0" aria-hidden />
                    {/* Sales block */}
                    <div className="flex-1 flex flex-col items-center md:items-end justify-center">
                        <Skeleton className="h-3 w-28 mb-3 md:ml-auto" />
                        <Skeleton className="h-10 sm:h-12 md:h-14 w-36 mb-3 rounded-xl md:ml-auto" />
                        <Skeleton className="h-8 w-32 rounded-full md:ml-auto" />
                    </div>
                </div>
            </GlassCard>

            {/* Insight Whisper Skeleton */}
            <GlassCard className="rounded-[32px] p-6 md:p-8 h-24 flex items-center gap-6">
                <Skeleton className="h-10 w-10 rounded-full shrink-0" />
                <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-2/3" />
                </div>
            </GlassCard>

            {/* Actions/Widgets Skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <GlassCard className="h-48 rounded-[24px] p-6">
                    <div className="flex justify-between mb-4">
                        <Skeleton className="h-5 w-32" />
                        <Skeleton className="h-5 w-5 rounded-full" />
                    </div>
                    <div className="flex items-end justify-between mt-8">
                        <Skeleton className="h-12 w-24" />
                        <Skeleton className="h-16 w-32 rounded-lg" />
                    </div>
                </GlassCard>
                <GlassCard className="h-48 rounded-[24px] p-6">
                    <div className="flex justify-between mb-4">
                        <Skeleton className="h-5 w-32" />
                        <Skeleton className="h-5 w-5 rounded-full" />
                    </div>
                    <div className="flex gap-4 mt-8">
                        <Skeleton className="h-20 w-20 rounded-full" />
                        <div className="space-y-2 flex-1 pt-4">
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-2/3" />
                        </div>
                    </div>
                </GlassCard>
            </div>

            {/* Activity Stream Skeleton */}
            <div className="space-y-4">
                <div className="flex justify-between px-2">
                    <Skeleton className="h-6 w-32" />
                    <Skeleton className="h-4 w-16" />
                </div>
                <GlassCard className="rounded-[32px] p-2 space-y-2">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="flex items-center gap-4 p-3">
                            <Skeleton className="h-8 w-8 rounded-full" />
                            <div className="flex-1 space-y-1">
                                <Skeleton className="h-4 w-48" />
                                <Skeleton className="h-3 w-32" />
                            </div>
                            <Skeleton className="h-4 w-16" />
                        </div>
                    ))}
                </GlassCard>
            </div>
        </div>
    )
}
