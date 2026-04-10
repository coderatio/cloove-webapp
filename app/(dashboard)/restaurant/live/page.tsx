import { RestaurantLiveView } from "@/app/domains/restaurant/components/RestaurantLiveView"
import { RestaurantNavTabs } from "@/app/domains/restaurant/components/RestaurantNavTabs"
import { PresetGate } from "@/app/components/shared/PresetGate"
import { RestaurantLiveHeader } from "@/app/domains/restaurant/components/RestaurantLiveHeader"

export const metadata = {
  title: "Restaurant Live | Cloove",
  description: "Monitor floor operations, kitchen throughput, and service progress in real time.",
}

export default function RestaurantLivePage() {
  return (
    <PresetGate preset="restaurant" featureLabel="Live Board">
      <div className="space-y-4 px-0 lg:px-8 md:px-0">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <RestaurantLiveHeader />
          <div className="lg:shrink-0">
            <RestaurantNavTabs />
          </div>
        </div>
        <RestaurantLiveView />
      </div>
    </PresetGate>
  )
}
