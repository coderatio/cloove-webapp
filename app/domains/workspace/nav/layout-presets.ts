import type { NavGroupDef, NavRouteId } from "./nav-definitions"
import { NAV_GROUPS } from "./nav-definitions"

export type LayoutPresetId =
    | "default"
    | "restaurant"
    | "retail"
    | "pharmacy"
    | "school"

export interface LayoutPreset {
    id: LayoutPresetId
    title: string
    description: string
    /** Ordered group keys from NAV_GROUPS */
    groupOrder: string[]
    /** Nav item label overrides */
    labelOverrides: Partial<Record<NavRouteId, string>>
    /** Ids shown left of assistant on mobile (subset) */
    mobilePrimaryIds: NavRouteId[]
    /** Ids shown right of assistant before More */
    mobileSecondaryIds: NavRouteId[]
}

const groupKeys = NAV_GROUPS.map((g) => g.key)

const defaultPreset: LayoutPreset = {
    id: "default",
    title: "General",
    description: "Balanced navigation for most businesses.",
    groupOrder: [...groupKeys],
    labelOverrides: {},
    mobilePrimaryIds: ["overview", "orders"],
    mobileSecondaryIds: ["finance"],
}

const restaurantPreset: LayoutPreset = {
    id: "restaurant",
    title: "Restaurant & hospitality",
    description: "Emphasizes sales flow, floor activity, and inventory.",
    groupOrder: ["main", "sales_finance", "operations", "staff_management"],
    labelOverrides: {
        orders: "Sales & service",
        inventory: "Menu & stock",
        customers: "Guests",
    },
    mobilePrimaryIds: ["overview", "orders"],
    mobileSecondaryIds: ["inventory"],
}

const retailPreset: LayoutPreset = {
    id: "retail",
    title: "Retail & supermarket",
    description: "Inventory-forward with fast checkout paths.",
    groupOrder: ["main", "operations", "sales_finance", "staff_management"],
    labelOverrides: {
        orders: "Checkout",
        inventory: "Products & stock",
    },
    mobilePrimaryIds: ["overview", "orders"],
    mobileSecondaryIds: ["inventory"],
}

const pharmacyPreset: LayoutPreset = {
    id: "pharmacy",
    title: "Pharmacy & health retail",
    description: "Compliance-minded ordering with inventory emphasis.",
    groupOrder: ["main", "operations", "sales_finance", "staff_management"],
    labelOverrides: {
        inventory: "Stock & batches",
        customers: "Patients",
        orders: "Dispensing",
    },
    mobilePrimaryIds: ["overview", "inventory"],
    mobileSecondaryIds: ["orders"],
}

const schoolPreset: LayoutPreset = {
    id: "school",
    title: "School & training",
    description:
        "People-first navigation plus academic years & terms for fee collection, resources, and your public presence.",
    groupOrder: ["main", "sales_finance", "operations", "staff_management"],
    labelOverrides: {
        customers: "Students & parents",
        orders: "Fees & sales",
        school_calendar: "Years & terms",
        inventory: "Resources & stock",
        storefront: "Public pages",
        staff: "Faculty & staff",
    },
    mobilePrimaryIds: ["overview", "customers"],
    mobileSecondaryIds: ["orders", "school_calendar"],
}

export const LAYOUT_PRESETS: Record<LayoutPresetId, LayoutPreset> = {
    default: defaultPreset,
    restaurant: restaurantPreset,
    retail: retailPreset,
    pharmacy: pharmacyPreset,
    school: schoolPreset,
}

export const LAYOUT_PRESET_LIST: LayoutPreset[] = [
    defaultPreset,
    restaurantPreset,
    retailPreset,
    pharmacyPreset,
    schoolPreset,
]

export function getLayoutPreset(id: string | null | undefined): LayoutPreset {
    if (id && id in LAYOUT_PRESETS) {
        return LAYOUT_PRESETS[id as LayoutPresetId]
    }
    return LAYOUT_PRESETS.default
}

/** Reorder groups and apply label overrides; returns new structure for rendering */
export function applyLayoutPreset(
    presetId: string | null | undefined,
    labelOverrides?: Partial<Record<NavRouteId, string>>
): NavGroupDef[] {
    const preset = getLayoutPreset(presetId)
    const mergedOverrides = { ...preset.labelOverrides, ...labelOverrides }
    const groupMap = new Map(NAV_GROUPS.map((g) => [g.key, g]))
    const orderedKeys = preset.groupOrder.filter((k) => groupMap.has(k))
    const rest = NAV_GROUPS.map((g) => g.key).filter((k) => !orderedKeys.includes(k))
    const keys = [...orderedKeys, ...rest]

    const applyLabels = (items: typeof NAV_GROUPS[0]["items"]): typeof items =>
        items.map((item) => {
            const label =
                mergedOverrides[item.id] ?? item.defaultLabel
            const children = item.children?.map((c) => ({
                ...c,
                defaultLabel: mergedOverrides[c.id] ?? c.defaultLabel,
            }))
            return {
                ...item,
                defaultLabel: label,
                children,
            }
        })

    return keys.map((key) => {
        const g = groupMap.get(key)!
        return {
            ...g,
            defaultLabel: g.defaultLabel,
            items: applyLabels(g.items),
        }
    })
}
