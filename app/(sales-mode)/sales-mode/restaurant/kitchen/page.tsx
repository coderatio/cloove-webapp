import { RestaurantLiveView } from "@/app/domains/restaurant/components/RestaurantLiveView"

export default function SalesModeRestaurantKitchenPage() {
    return (
        <div className="h-full overflow-auto p-2 md:p-4">
            <RestaurantLiveView mode="kitchen" />
        </div>
    )
}
