import type { LucideIcon } from "lucide-react"
import {
    Activity,
    AlertCircle,
    Banknote,
    BookOpen,
    CalendarRange,
    ChefHat,
    Home,
    LayoutGrid,
    Link2,
    Package,
    Receipt,
    ShieldCheck,
    ShoppingBag,
    Sparkles,
    Store,
    Truck,
    Users,
} from "lucide-react"

/** Stable ids for nav entries and preset overrides */
export type NavRouteId =
    | "overview"
    | "assistant"
    | "orders"
    | "orders_sale"
    | "school_calendar"
    | "school_fee_tools"
    | "restaurant_live"
    | "restaurant_tables"
    | "restaurant_kitchen"
    | "finance"
    | "payment_links"
    | "customers"
    | "debts"
    | "expenses"
    | "vendors"
    | "inventory"
    | "stores"
    | "activity"
    | "storefront"
    | "staff"

/** Keys merged into `business.features` (plan + feature_flags) */
export type PlanFeatureKey =
    | "hasExpenses"
    | "hasDebts"
    | "hasAdvancedAnalytics"
    | "hasApiAccess"
    | "canHaveCustomDomain"

/** Optional module visibility in feature_flags; default visible when absent */
export type ModuleFeatureKey =
    | "module_vendors"
    | "module_referrals"
    | "module_storefront"
    | "module_staff"
    | "module_expenses"
    | "module_debts"

export interface NavItemDef {
    id: NavRouteId
    href: string
    icon: LucideIcon
    defaultLabel: string
    permission?: string
    /** When set, require `features[key] === true` (plan-gated) */
    planFeatureKey?: PlanFeatureKey
    /** When set, hide when `features[key] === false`; omit or true = show */
    moduleFeatureKey?: ModuleFeatureKey
    /** When set, only show for these layout presets (e.g. school-only items) */
    visibleForPresets?: string[]
    children?: NavItemDef[]
}

export interface NavGroupDef {
    key: string
    defaultLabel: string
    items: NavItemDef[]
}

export const NAV_GROUPS: NavGroupDef[] = [
    {
        key: "main",
        defaultLabel: "Main",
        items: [
            { id: "overview", href: "/", icon: Home, defaultLabel: "Overview" },
            { id: "assistant", href: "/assistant", icon: Sparkles, defaultLabel: "Assistant" },
        ],
    },
    {
        key: "sales_finance",
        defaultLabel: "Sales & Finance",
        items: [
            {
                id: "orders",
                href: "/orders",
                icon: ShoppingBag,
                defaultLabel: "Orders",
                permission: "VIEW_SALES",
                children: [
                    {
                        id: "orders_sale",
                        href: "/orders/sale",
                        icon: ShoppingBag,
                        defaultLabel: "Record sale",
                        permission: "VIEW_SALES",
                        visibleForPresets: ["default", "restaurant", "retail", "pharmacy"],
                    },
                    {
                        id: "school_fee_tools",
                        href: "/school/fee-tools",
                        icon: BookOpen,
                        defaultLabel: "Fee tools",
                        permission: "VIEW_SALES",
                        visibleForPresets: ["school"],
                    },
                    {
                        id: "restaurant_live",
                        href: "/restaurant/live",
                        icon: ChefHat,
                        defaultLabel: "Service Console",
                        permission: "VIEW_DASHBOARD",
                        visibleForPresets: ["restaurant"],
                    },
                    {
                        id: "restaurant_tables",
                        href: "/restaurant/tables",
                        icon: LayoutGrid,
                        defaultLabel: "Tables",
                        permission: "VIEW_SALES",
                        visibleForPresets: ["restaurant"],
                    },
                    {
                        id: "restaurant_kitchen",
                        href: "/restaurant/kitchen",
                        icon: ChefHat,
                        defaultLabel: "Kitchen Board",
                        permission: "VIEW_SALES",
                        visibleForPresets: ["restaurant"],
                    },
                ],
            },
            {
                id: "school_calendar",
                href: "/school/calendar",
                icon: CalendarRange,
                defaultLabel: "School calendar",
                permission: "VIEW_SALES",
                visibleForPresets: ["school"],
            },
            {
                id: "finance",
                href: "/finance",
                icon: Banknote,
                defaultLabel: "Finance",
                permission: "VIEW_FINANCIALS",
                children: [
                    {
                        id: "payment_links",
                        href: "/finance/payment-links",
                        icon: Link2,
                        defaultLabel: "Payment Links",
                        permission: "VIEW_FINANCIALS",
                    },
                ],
            },
            {
                id: "customers",
                href: "/customers",
                icon: Users,
                defaultLabel: "Customers",
                permission: "VIEW_CUSTOMERS",
            },
            {
                id: "debts",
                href: "/debts",
                icon: AlertCircle,
                defaultLabel: "Debts",
                permission: "VIEW_CUSTOMERS",
                planFeatureKey: "hasDebts",
                moduleFeatureKey: "module_debts",
            },
            {
                id: "expenses",
                href: "/expenses",
                icon: Receipt,
                defaultLabel: "Expenses",
                permission: "VIEW_EXPENSES",
                planFeatureKey: "hasExpenses",
                moduleFeatureKey: "module_expenses",
            },
            {
                id: "vendors",
                href: "/vendors",
                icon: Truck,
                defaultLabel: "Vendors",
                permission: "VIEW_SUPPLIERS",
                moduleFeatureKey: "module_vendors",
            },
        ],
    },
    {
        key: "operations",
        defaultLabel: "Operations",
        items: [
            {
                id: "inventory",
                href: "/inventory",
                icon: Package,
                defaultLabel: "Inventory",
                permission: "MANAGE_PRODUCTS",
            },
            {
                id: "stores",
                href: "/stores",
                icon: LayoutGrid,
                defaultLabel: "Stores",
                permission: "MANAGE_STORES",
            },
            {
                id: "activity",
                href: "/activity",
                icon: Activity,
                defaultLabel: "Activity",
                permission: "VIEW_DASHBOARD",
            },
        ],
    },
    {
        key: "staff_management",
        defaultLabel: "Staff & Management",
        items: [
            {
                id: "storefront",
                href: "/storefront",
                icon: Store,
                defaultLabel: "Storefront",
                permission: "MANAGE_STORES",
                moduleFeatureKey: "module_storefront",
            },
            {
                id: "staff",
                href: "/staff",
                icon: ShieldCheck,
                defaultLabel: "Staff",
                permission: "MANAGE_STAFF",
                moduleFeatureKey: "module_staff",
            },
        ],
    },
]

export function findNavItemByHref(
    groups: NavGroupDef[],
    href: string
): NavItemDef | undefined {
    for (const g of groups) {
        for (const item of g.items) {
            if (item.href === href) return item
            for (const c of item.children || []) {
                if (c.href === href) return c
            }
        }
    }
    return undefined
}
