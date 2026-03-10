import { ShieldCheck } from "lucide-react"

export function CheckoutSkeleton() {
  return (
    <div className="w-full max-w-3xl mx-auto">
      <div className="h-8 bg-brand-deep/10 dark:bg-white/10 rounded-xl w-48 mx-auto mb-6 animate-pulse" />
      <div className="flex flex-col md:flex-row gap-4">
        <div className="md:w-56 shrink-0">
          <div className="bg-white dark:bg-white/5 border border-brand-deep/10 dark:border-white/10 rounded-3xl p-4 space-y-3 animate-pulse">
            <div className="h-3 bg-brand-deep/10 dark:bg-white/10 rounded w-24" />
            <div className="h-14 bg-brand-deep/5 dark:bg-white/[0.03] rounded-2xl" />
            <div className="h-14 bg-brand-deep/5 dark:bg-white/[0.03] rounded-2xl" />
          </div>
        </div>
        <div className="flex-1">
          <div className="bg-white dark:bg-white/5 border border-brand-deep/10 dark:border-white/10 rounded-3xl p-6 space-y-5 animate-pulse">
            <div className="h-3 bg-brand-deep/10 dark:bg-white/10 rounded w-20" />
            <div className="h-10 bg-brand-deep/10 dark:bg-white/10 rounded-2xl w-40" />
            <div className="h-px bg-brand-deep/5 dark:bg-white/5" />
            <div className="space-y-3">
              <div className="h-12 bg-brand-deep/5 dark:bg-white/[0.03] rounded-2xl" />
              <div className="h-12 bg-brand-deep/5 dark:bg-white/[0.03] rounded-2xl" />
              <div className="h-12 bg-brand-deep/5 dark:bg-white/[0.03] rounded-2xl" />
            </div>
            <div className="h-14 bg-brand-deep/10 dark:bg-white/10 rounded-2xl" />
          </div>
        </div>
      </div>
      <div className="flex items-center justify-center gap-1.5 mt-6">
        <ShieldCheck className="w-3.5 h-3.5 text-brand-accent/30 dark:text-white/30" />
        <p className="text-brand-accent/30 dark:text-white/30 text-xs">
          Secured by Cloove
        </p>
      </div>
    </div>
  )
}
