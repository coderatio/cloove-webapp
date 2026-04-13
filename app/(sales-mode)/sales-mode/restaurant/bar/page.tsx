import { RestaurantLiveView } from "@/app/domains/restaurant/components/RestaurantLiveView"

export default function SalesModeRestaurantBarPage() {
    return (
        <div className="p-2 md:p-4">
            <RestaurantLiveView mode="bar" />
        </div>
    )
}
