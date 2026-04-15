import { RestaurantLiveView } from "@/app/domains/restaurant/components/RestaurantLiveView"

export default function SalesModeRestaurantBarPage() {
    return (
        <div className="h-full overflow-auto p-2 md:p-4">
            <RestaurantLiveView mode="bar" />
        </div>
    )
}
