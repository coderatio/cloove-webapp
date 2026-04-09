import { RestaurantLiveView } from "@/app/domains/restaurant/components/RestaurantLiveView"
import { RestaurantNavTabs } from "@/app/domains/restaurant/components/RestaurantNavTabs"
import { PresetGate } from "@/app/components/shared/PresetGate"

export const metadata = {
  title: "Restaurant Kitchen | Cloove",
  description: "Move tickets through queue, prep, ready, and served with clarity.",
}

export default function RestaurantKitchenPage() {
  return (
    <PresetGate preset="restaurant" featureLabel="Kitchen Board">
      <div className="space-y-4 px-auto sm:px-8">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <p className="text-[10px] uppercase tracking-[0.25em] font-black text-brand-accent/40 dark:text-brand-cream/40 mb-1.5">
              Restaurant
            </p>
            <h1 className="text-3xl md:text-4xl font-serif tracking-tight text-brand-deep dark:text-brand-cream">
              Kitchen
            </h1>
            <p className="text-sm text-brand-accent/60 dark:text-brand-cream/60 mt-1.5 max-w-md">
              Full-screen ticket board for your kitchen team. Move orders from queue through to served.
            </p>
          </div>
          <RestaurantNavTabs />
        </div>
        <RestaurantLiveView mode="kitchen" />
      </div>
    </PresetGate>
  )
}
