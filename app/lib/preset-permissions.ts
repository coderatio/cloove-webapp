import { Permission } from "@/app/types/permissions"

export type LayoutPresetId =
    | "default"
    | "restaurant"
    | "retail"
    | "pharmacy"
    | "school"

/**
 * Defines which permissions are available/meaningful for each layout preset.
 *
 * Use this to:
 *  - Filter the staff permission configuration UI to only show preset-relevant options
 *  - Avoid showing school-specific permissions to a retail business and vice versa
 */
export const PRESET_AVAILABLE_PERMISSIONS: Record<LayoutPresetId, Permission[]> = {
    default: [
        // General
        Permission.VIEW_DASHBOARD,
        Permission.VIEW_FINANCIALS,
        Permission.VIEW_STAFF,
        Permission.MANAGE_STAFF,
        Permission.VIEW_STORES,
        Permission.MANAGE_STORES,
        Permission.MANAGE_SUBSCRIPTION,
        Permission.MANAGE_PAYOUTS,
        Permission.MANAGE_BUSINESS_CONFIG,
        // Sales
        Permission.VIEW_SALES,
        Permission.RECORD_SALE,
        Permission.UPDATE_SALE,
        Permission.DELETE_SALE,
        // Products
        Permission.VIEW_PRODUCTS,
        Permission.MANAGE_PRODUCTS,
        // Customers
        Permission.VIEW_CUSTOMERS,
        Permission.CREATE_CUSTOMER,
        Permission.UPDATE_CUSTOMER,
        Permission.DELETE_CUSTOMER,
        // Suppliers
        Permission.VIEW_SUPPLIERS,
        Permission.MANAGE_SUPPLIERS,
        Permission.RECORD_PAYABLE,
        Permission.PAY_SUPPLIER,
        // Expenses & debts
        Permission.VIEW_EXPENSES,
        Permission.RECORD_EXPENSE,
        Permission.RECORD_REPAYMENT,
    ],

    retail: [
        Permission.VIEW_DASHBOARD,
        Permission.VIEW_FINANCIALS,
        Permission.VIEW_STAFF,
        Permission.MANAGE_STAFF,
        Permission.VIEW_STORES,
        Permission.MANAGE_STORES,
        Permission.MANAGE_SUBSCRIPTION,
        Permission.MANAGE_PAYOUTS,
        Permission.MANAGE_BUSINESS_CONFIG,
        Permission.VIEW_SALES,
        Permission.RECORD_SALE,
        Permission.UPDATE_SALE,
        Permission.DELETE_SALE,
        Permission.VIEW_PRODUCTS,
        Permission.MANAGE_PRODUCTS,
        Permission.VIEW_CUSTOMERS,
        Permission.CREATE_CUSTOMER,
        Permission.UPDATE_CUSTOMER,
        Permission.DELETE_CUSTOMER,
        Permission.VIEW_SUPPLIERS,
        Permission.MANAGE_SUPPLIERS,
        Permission.RECORD_PAYABLE,
        Permission.PAY_SUPPLIER,
        Permission.VIEW_EXPENSES,
        Permission.RECORD_EXPENSE,
        Permission.RECORD_REPAYMENT,
    ],

    pharmacy: [
        Permission.VIEW_DASHBOARD,
        Permission.VIEW_FINANCIALS,
        Permission.VIEW_STAFF,
        Permission.MANAGE_STAFF,
        Permission.VIEW_STORES,
        Permission.MANAGE_STORES,
        Permission.MANAGE_SUBSCRIPTION,
        Permission.MANAGE_PAYOUTS,
        Permission.MANAGE_BUSINESS_CONFIG,
        Permission.VIEW_SALES,
        Permission.RECORD_SALE,
        Permission.UPDATE_SALE,
        Permission.DELETE_SALE,
        Permission.VIEW_PRODUCTS,
        Permission.MANAGE_PRODUCTS,
        Permission.VIEW_CUSTOMERS,
        Permission.CREATE_CUSTOMER,
        Permission.UPDATE_CUSTOMER,
        Permission.DELETE_CUSTOMER,
        Permission.VIEW_SUPPLIERS,
        Permission.MANAGE_SUPPLIERS,
        Permission.RECORD_PAYABLE,
        Permission.PAY_SUPPLIER,
        Permission.VIEW_EXPENSES,
        Permission.RECORD_EXPENSE,
        Permission.RECORD_REPAYMENT,
    ],

    school: [
        // General
        Permission.VIEW_DASHBOARD,
        Permission.VIEW_FINANCIALS,
        Permission.VIEW_STAFF,
        Permission.MANAGE_STAFF,
        Permission.VIEW_STORES,
        Permission.MANAGE_STORES,
        Permission.MANAGE_SUBSCRIPTION,
        Permission.MANAGE_PAYOUTS,
        Permission.MANAGE_BUSINESS_CONFIG,
        // School-specific
        Permission.VIEW_ACADEMIC_CALENDAR,
        Permission.MANAGE_ACADEMIC_CALENDAR,
        Permission.VIEW_FEE_TEMPLATES,
        Permission.MANAGE_FEE_TEMPLATES,
        // Fees map to sales internally
        Permission.VIEW_SALES,
        Permission.RECORD_SALE,
        Permission.UPDATE_SALE,
        Permission.DELETE_SALE,
        // Students map to customers internally
        Permission.VIEW_CUSTOMERS,
        Permission.CREATE_CUSTOMER,
        Permission.UPDATE_CUSTOMER,
        Permission.DELETE_CUSTOMER,
        // Resources & stock
        Permission.VIEW_PRODUCTS,
        Permission.MANAGE_PRODUCTS,
        // Expenses & debts
        Permission.VIEW_EXPENSES,
        Permission.RECORD_EXPENSE,
        Permission.RECORD_REPAYMENT,
        // Suppliers intentionally excluded
    ],

    restaurant: [
        // General
        Permission.VIEW_DASHBOARD,
        Permission.VIEW_FINANCIALS,
        Permission.VIEW_STAFF,
        Permission.MANAGE_STAFF,
        Permission.VIEW_STORES,
        Permission.MANAGE_STORES,
        Permission.MANAGE_SUBSCRIPTION,
        Permission.MANAGE_PAYOUTS,
        Permission.MANAGE_BUSINESS_CONFIG,
        // Restaurant-specific
        Permission.VIEW_RESTAURANT_TABLES,
        Permission.MANAGE_RESTAURANT_TABLES,
        Permission.VIEW_KITCHEN_TICKETS,
        Permission.MANAGE_KITCHEN_TICKETS,
        Permission.VIEW_BAR_TICKETS,
        Permission.MANAGE_BAR_TICKETS,
        // Sales
        Permission.VIEW_SALES,
        Permission.RECORD_SALE,
        Permission.UPDATE_SALE,
        Permission.DELETE_SALE,
        // Products (menu & stock)
        Permission.VIEW_PRODUCTS,
        Permission.MANAGE_PRODUCTS,
        // Customers (guests)
        Permission.VIEW_CUSTOMERS,
        Permission.CREATE_CUSTOMER,
        Permission.UPDATE_CUSTOMER,
        Permission.DELETE_CUSTOMER,
        // Suppliers
        Permission.VIEW_SUPPLIERS,
        Permission.MANAGE_SUPPLIERS,
        Permission.RECORD_PAYABLE,
        Permission.PAY_SUPPLIER,
        // Expenses & debts
        Permission.VIEW_EXPENSES,
        Permission.RECORD_EXPENSE,
        Permission.RECORD_REPAYMENT,
    ],
}

/**
 * Returns the permissions available for a given layout preset.
 * Falls back to 'default' for unknown preset ids.
 */
export function getPermissionsForPreset(preset: string | null | undefined): Permission[] {
    if (preset && preset in PRESET_AVAILABLE_PERMISSIONS) {
        return PRESET_AVAILABLE_PERMISSIONS[preset as LayoutPresetId]
    }
    return PRESET_AVAILABLE_PERMISSIONS.default
}

// ---------------------------------------------------------------------------
// Role-based defaults (mirrors backend permission_defaults.ts)
// Used by the staff editor to show resolved permission state (defaults + overrides)
// ---------------------------------------------------------------------------

/** Generic role defaults, preset-agnostic (default / retail / pharmacy). */
const DEFAULT_ROLE_PERMISSIONS: Record<string, string[]> = {
    STAFF: [
        'VIEW_DASHBOARD',
        'VIEW_SALES',
        'RECORD_SALE',
        'RECORD_REPAYMENT',
        'VIEW_STAFF',
        'VIEW_CUSTOMERS',
        'CREATE_CUSTOMER',
        'UPDATE_CUSTOMER',
        'VIEW_PRODUCTS',
    ],
    ACCOUNTANT: [
        'VIEW_DASHBOARD',
        'VIEW_FINANCIALS',
        'VIEW_SALES',
        'VIEW_EXPENSES',
        'RECORD_EXPENSE',
        'RECORD_REPAYMENT',
        'VIEW_CUSTOMERS',
        'CREATE_CUSTOMER',
        'UPDATE_CUSTOMER',
        'DELETE_CUSTOMER',
        'VIEW_SUPPLIERS',
        'MANAGE_SUPPLIERS',
        'RECORD_PAYABLE',
        'PAY_SUPPLIER',
        'VIEW_STAFF',
    ],
}

/** Preset-specific overrides for role defaults. */
const PRESET_ROLE_PERMISSIONS: Partial<Record<LayoutPresetId, Partial<Record<string, string[]>>>> = {
    school: {
        STAFF: [
            'VIEW_DASHBOARD',
            'VIEW_ACADEMIC_CALENDAR',
            'VIEW_FEE_TEMPLATES',
            'VIEW_SALES',
            'RECORD_SALE',
            'RECORD_REPAYMENT',
            'VIEW_STAFF',
            'VIEW_CUSTOMERS',
            'CREATE_CUSTOMER',
            'UPDATE_CUSTOMER',
            'VIEW_PRODUCTS',
        ],
        ACCOUNTANT: [
            'VIEW_DASHBOARD',
            'VIEW_FINANCIALS',
            'VIEW_ACADEMIC_CALENDAR',
            'VIEW_FEE_TEMPLATES',
            'VIEW_SALES',
            'VIEW_EXPENSES',
            'RECORD_EXPENSE',
            'RECORD_REPAYMENT',
            'VIEW_CUSTOMERS',
            'CREATE_CUSTOMER',
            'UPDATE_CUSTOMER',
            'DELETE_CUSTOMER',
            'VIEW_STAFF',
        ],
    },
    restaurant: {
        STAFF: [
            'VIEW_DASHBOARD',
            'VIEW_RESTAURANT_TABLES',
            'VIEW_KITCHEN_TICKETS',
            'VIEW_SALES',
            'RECORD_SALE',
            'VIEW_CUSTOMERS',
            'CREATE_CUSTOMER',
            'VIEW_PRODUCTS',
        ],
        ACCOUNTANT: [
            'VIEW_DASHBOARD',
            'VIEW_FINANCIALS',
            'VIEW_RESTAURANT_TABLES',
            'VIEW_KITCHEN_TICKETS',
            'VIEW_BAR_TICKETS',
            'VIEW_SALES',
            'VIEW_EXPENSES',
            'RECORD_EXPENSE',
            'RECORD_REPAYMENT',
            'VIEW_CUSTOMERS',
            'VIEW_SUPPLIERS',
            'VIEW_STAFF',
        ],
    },
}

/**
 * Returns the default permission keys for a role in a given preset.
 * Mirrors getDefaultsForRole() on the backend.
 */
export function getDefaultsForRoleAndPreset(role: string, preset: string | null | undefined): string[] {
    if (role === 'OWNER') return [] // owners have all permissions
    const presetDefaults = preset ? PRESET_ROLE_PERMISSIONS[preset as LayoutPresetId] : undefined
    return presetDefaults?.[role] ?? DEFAULT_ROLE_PERMISSIONS[role] ?? []
}

/**
 * Compute the full resolved permission map (what the staff member can actually do).
 * role defaults (preset-aware) + explicit overrides.
 */
export function resolvePermissionsForDisplay(
    role: string,
    preset: string | null | undefined,
    overrides: Record<string, boolean> | null
): Record<string, boolean> {
    const defaults = getDefaultsForRoleAndPreset(role, preset)
    const resolved: Record<string, boolean> = {}
    for (const perm of defaults) resolved[perm] = true
    if (overrides) {
        for (const [perm, val] of Object.entries(overrides)) resolved[perm] = val
    }
    return resolved
}

/**
 * Compute only the overrides that differ from role defaults.
 * Call this before saving to avoid sending redundant overrides.
 */
export function computeOverrides(
    resolved: Record<string, boolean>,
    role: string,
    preset: string | null | undefined
): Record<string, boolean> {
    const defaults = getDefaultsForRoleAndPreset(role, preset)
    const overrides: Record<string, boolean> = {}
    for (const [perm, val] of Object.entries(resolved)) {
        const inDefault = defaults.includes(perm)
        if (val !== inDefault) overrides[perm] = val
    }
    return overrides
}
