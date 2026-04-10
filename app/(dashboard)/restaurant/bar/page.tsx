import { RestaurantLiveView } from "@/app/domains/restaurant/components/RestaurantLiveView"
import { RestaurantNavTabs } from "@/app/domains/restaurant/components/RestaurantNavTabs"
import { PresetGate } from "@/app/components/shared/PresetGate"

export const metadata = {
  title: "Bar Board | Cloove",
  description: "Track bar orders from ordered through to served.",
}

export default function RestaurantBarPage() {
  return (
    <PresetGate preset="restaurant" featureLabel="Bar Board">
      <div className="space-y-4 px-0 lg:px-8 md:px-0">
        <div className="space-y-4">
          <div>
            <p className="text-[10px] uppercase tracking-[0.25em] font-black text-brand-accent/40 dark:text-brand-cream/40 mb-1.5">
              Restaurant
            </p>
            <h1 className="text-3xl md:text-4xl font-serif tracking-tight text-brand-deep dark:text-brand-cream">
              Bar Board
            </h1>
            <p className="text-sm text-brand-accent/60 dark:text-brand-cream/60 mt-1.5 max-w-md">
              Track drink orders from ordered through to served. Tap "New order" to add manually.
            </p>
          </div>
          <RestaurantNavTabs />
        </div>
        <RestaurantLiveView mode="bar" />
      </div>
    </PresetGate>
  )
}
