import { RestaurantLiveView } from "@/app/domains/restaurant/components/RestaurantLiveView"

export default function SalesModeRestaurantKitchenPage() {
    return (
        <div className="p-2 md:p-4">
            <RestaurantLiveView mode="kitchen" />
        </div>
    )
}
