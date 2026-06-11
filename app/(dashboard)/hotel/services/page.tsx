import { PresetGate } from "@/app/components/shared/PresetGate";
import { ServicesView } from "@/app/domains/services/components/ServicesView";
import { HotelTabs } from "@/app/domains/hotel/components/HotelTabs";

export default function Page() {
  return (
    <PresetGate preset="hotel" featureLabel="Services">
      <ServicesView
        title="Services & amenities"
        description="Spa, laundry, airport pickup, and other paid services your front desk and AI concierge can offer guests."
        tabsSlot={<HotelTabs />}
      />
    </PresetGate>
  );
}
