import { PresetGate } from "@/app/components/shared/PresetGate";
import { HotelRequestsView } from "@/app/domains/hotel/components/HotelRequestsView";

export default function Page() {
  return (
    <PresetGate preset="hotel" featureLabel="Guest requests">
      <HotelRequestsView />
    </PresetGate>
  );
}
