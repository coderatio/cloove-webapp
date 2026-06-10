import { PresetGate } from "@/app/components/shared/PresetGate";
import { HotelReservationsView } from "@/app/domains/hotel/components/HotelReservationsView";

export default function Page() {
  return (
    <PresetGate preset="hotel" featureLabel="Reservations">
      <HotelReservationsView />
    </PresetGate>
  );
}
