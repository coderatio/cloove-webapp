"use client"

import { useLayoutPresetId, usePresetPageCopy } from "@/app/domains/workspace/hooks/usePresetPageCopy"
import { DefaultDashboardModule } from "./DefaultDashboardModule"
import { RetailDashboardModule } from "./RetailDashboardModule"
import { PharmacyDashboardModule } from "./PharmacyDashboardModule"
import { SchoolDashboardModule } from "./SchoolDashboardModule"
import { RestaurantDashboardModule } from "./RestaurantDashboardModule"

/**
 * Preset-specific dashboard feature surface: real navigation modules, not copy-only hints.
 * Renders structured cards with quick links and (where relevant) operational checklists.
 */
export function PresetDashboardModules() {
    const presetId = useLayoutPresetId()
    const pageCopy = usePresetPageCopy()

    switch (presetId) {
        case "retail":
            return <RetailDashboardModule pageCopy={pageCopy} />
        case "pharmacy":
            return <PharmacyDashboardModule pageCopy={pageCopy} />
        case "school":
            return <SchoolDashboardModule pageCopy={pageCopy} />
        case "restaurant":
            return <RestaurantDashboardModule pageCopy={pageCopy} />
        default:
            return <DefaultDashboardModule pageCopy={pageCopy} />
    }
}
