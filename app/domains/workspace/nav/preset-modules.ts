import type { LayoutPresetId } from "./layout-presets"
import type { ModuleFeatureKey } from "./nav-definitions"

/**
 * Nav `module_*` feature flags recommended per layout preset (Workspace → settings nudges).
 * Vertical **product** behavior (e.g. school academic calendar → fee tagging on sales) lives in
 * domain code keyed off `ui_layout_preset`, not in this file.
 */
export const PRESET_RECOMMENDED_MODULES: Record<LayoutPresetId, ModuleFeatureKey[]> = {
    default: ["module_storefront", "module_referrals"],
    restaurant: ["module_staff", "module_storefront", "module_expenses"],
    retail: ["module_vendors", "module_storefront", "module_debts"],
    pharmacy: ["module_debts", "module_expenses", "module_storefront"],
    school: ["module_storefront", "module_staff", "module_debts"],
}

export interface RecommendedModuleMeta {
    key: ModuleFeatureKey
    title: string
    description: string
}

const MODULE_META: Record<ModuleFeatureKey, { title: string; description: string }> = {
    module_expenses: {
        title: "Expenses in navigation",
        description: "Track rent, fuel, and supplier costs—common for Nigerian SMBs juggling cash and transfers.",
    },
    module_debts: {
        title: "Debts in navigation",
        description: "Credit sales and IOUs are typical; keep balances visible alongside bank reconciliation.",
    },
    module_vendors: {
        title: "Vendors",
        description: "Manage suppliers and restock—especially useful for retail and pharmacy buying.",
    },
    module_storefront: {
        title: "Storefront",
        description: "Publish prices and pages customers can share on WhatsApp and social.",
    },
    module_staff: {
        title: "Staff",
        description: "Delegate shifts and permissions as the team grows.",
    },
    module_referrals: {
        title: "Refer & earn",
        description: "Word-of-mouth growth fits how many African businesses acquire customers.",
    },
}

export function getRecommendedModulesForPreset(presetId: string | null | undefined): ModuleFeatureKey[] {
    const id = (presetId && presetId in PRESET_RECOMMENDED_MODULES
        ? presetId
        : "default") as LayoutPresetId
    return PRESET_RECOMMENDED_MODULES[id]
}

export function getRecommendedModuleRows(keys: ModuleFeatureKey[]): RecommendedModuleMeta[] {
    return keys.map((key) => ({
        key,
        title: MODULE_META[key].title,
        description: MODULE_META[key].description,
    }))
}
