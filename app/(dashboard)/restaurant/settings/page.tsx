import { PresetGate } from "@/app/components/shared/PresetGate"
import { RestaurantNavTabs } from "@/app/domains/restaurant/components/RestaurantNavTabs"
import { WhatsAppSettings } from "@/app/domains/messaging/components/WhatsAppSettings"

export const metadata = {
  title: "Restaurant Settings | Cloove",
  description: "Configure restaurant WhatsApp order notifications and new-order sound.",
}

export default function RestaurantSettingsPage() {
  return (
    <PresetGate preset="restaurant" featureLabel="Restaurant Settings">
      <div className="space-y-4 px-0 lg:px-8 md:px-0">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="mb-1.5 text-[10px] font-black uppercase tracking-[0.25em] text-brand-accent/40 dark:text-brand-cream/40">
              Restaurant
            </p>
            <h1 className="text-3xl font-serif tracking-tight text-brand-deep dark:text-brand-cream md:text-4xl">
              Notification Settings
            </h1>
            <p className="mt-1.5 max-w-md text-sm text-brand-accent/60 dark:text-brand-cream/60">
              Control WhatsApp stage updates and what sound the live board plays for new orders.
            </p>
          </div>
          <div className="lg:shrink-0">
            <RestaurantNavTabs />
          </div>
        </div>

        <WhatsAppSettings initialTab="notifications" allowedTabs={["connections", "notifications"]} />
      </div>
    </PresetGate>
  )
}
