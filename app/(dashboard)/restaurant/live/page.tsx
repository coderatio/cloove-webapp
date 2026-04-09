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
      <div className="space-y-4 px-auto sm:px-8">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <RestaurantLiveHeader />
          <RestaurantNavTabs />
        </div>
        <RestaurantLiveView />
      </div>
    </PresetGate>
  )
}
