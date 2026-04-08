import { RestaurantLiveView } from "@/app/domains/restaurant/components/RestaurantLiveView"
import { RestaurantNavTabs } from "@/app/domains/restaurant/components/RestaurantNavTabs"

export const metadata = {
  title: "Restaurant Live | Cloove",
  description: "Monitor floor operations, kitchen throughput, and service progress in real time.",
}

export default function RestaurantLivePage() {
  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <p className="text-[10px] uppercase tracking-[0.25em] font-black text-brand-accent/40 dark:text-brand-cream/40 mb-1.5">
            Restaurant
          </p>
          <h1 className="text-3xl md:text-4xl font-serif tracking-tight text-brand-deep dark:text-brand-cream">
            Live Board
          </h1>
          <p className="text-sm text-brand-accent/60 dark:text-brand-cream/60 mt-1.5 max-w-md">
            All table sessions, floor activity, and kitchen ticket flow — updated every 5 seconds.
          </p>
        </div>
        <RestaurantNavTabs />
      </div>
      <RestaurantLiveView />
    </div>
  )
}
