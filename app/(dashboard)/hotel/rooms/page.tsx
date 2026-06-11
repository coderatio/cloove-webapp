import { PresetGate } from "@/app/components/shared/PresetGate";
import { HotelRoomsView } from "@/app/domains/hotel/components/HotelRoomsView";

export default function Page() {
  return (
    <PresetGate preset="hotel" featureLabel="Rooms">
      <HotelRoomsView />
    </PresetGate>
  );
}
