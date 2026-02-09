import { Skeleton } from "../ui/skeleton"
import { GlassCard } from "../ui/glass-card"

export function DashboardSkeleton() {
    return (
        <div className="max-w-5xl mx-auto space-y-8 pb-20">
            {/* Header Skeleton */}
            <div className="pt-4 px-2 flex justify-between items-end">
                <div className="space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-10 w-48" />
                </div>
                <Skeleton className="h-8 w-24 rounded-full hidden md:block" />
            </div>

            {/* Hero Skeleton - The big card */}
            <GlassCard className="h-[380px] md:h-[420px] rounded-[32px] p-8 md:p-12 flex flex-col justify-center items-center">
                <Skeleton className="h-4 w-24 mb-6" />
                <Skeleton className="h-20 w-64 mb-6 rounded-2xl" />
                <Skeleton className="h-8 w-32 rounded-full" />
                <div className="absolute bottom-6 flex gap-2">
                    <Skeleton className="h-2 w-6 rounded-full" />
                    <Skeleton className="h-2 w-2 rounded-full" />
                </div>
            </GlassCard>

            {/* Insight Whisper Skeleton */}
            <GlassCard className="rounded-[32px] p-6 md:p-8 h-24 flex items-center gap-6">
                <Skeleton className="h-10 w-10 rounded-full flex-shrink-0" />
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
