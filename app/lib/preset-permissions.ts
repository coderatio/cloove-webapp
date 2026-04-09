import { Permission } from "@/types/permissions"

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
