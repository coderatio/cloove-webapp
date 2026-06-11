import type { IconSvgElement } from "@hugeicons/react"
import { Activity03Icon as Activity, AlertCircleIcon as AlertCircle, BanknoteIcon as Banknote, BookOpen01Icon as BookOpen, CalendarRangeIcon as CalendarRange, ChefHatIcon as ChefHat, GlassWaterIcon as GlassWater, Home01Icon as Home, LayoutGridIcon as LayoutGrid, Link02Icon as Link2, CodeIcon as Code2, WhatsappIcon as WhatsApp, PackageIcon as Package, WheatIcon as Wheat, CallIcon as Phone, Invoice01Icon as Receipt, SecurityCheckIcon as ShieldCheck, ShoppingBag01Icon as ShoppingBag, SparklesIcon as Sparkles, Store01Icon as Store, TruckIcon as Truck, UserMultiple02Icon as Users, Building02Icon as Building2, ConciergeBellIcon as ConciergeBell } from "@hugeicons/core-free-icons"

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
    | "restaurant_bar"
    | "hotel_reservations"
    | "hotel_rooms"
    | "hotel_requests"
    | "hotel_services"
    | "finance"
    | "payment_links"
    | "voice"
    | "whatsapp"
    | "customers"
    | "debts"
    | "expenses"
    | "vendors"
    | "inventory"
    | "supplies"
    | "stores"
    | "activity"
    | "storefront"
    | "staff"
    | "developer"

/** Keys merged into `business.features` (plan + feature_flags) */
export type PlanFeatureKey =
    | "hasExpenses"
    | "hasDebts"
    | "hasAdvancedAnalytics"
    | "hasApiAccess"
    | "hasWhitelabelWhatsapp"
    | "canHaveCustomDomain"

/** Optional module visibility in feature_flags; default visible when absent */
export type ModuleFeatureKey =
    | "module_vendors"
    | "module_referrals"
    | "module_storefront"
    | "module_staff"
    | "module_expenses"
    | "module_debts"
    | "module_voice"

export interface NavItemDef {
    id: NavRouteId
    href: string
    icon: IconSvgElement
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
                        permission: "VIEW_FEE_TEMPLATES",
                        visibleForPresets: ["school"],
                    },
                    {
                        id: "restaurant_live",
                        href: "/restaurant/live",
                        icon: ChefHat,
                        defaultLabel: "Service Console",
                        permission: "VIEW_RESTAURANT_TABLES",
                        visibleForPresets: ["restaurant"],
                    },
                    {
                        id: "restaurant_tables",
                        href: "/restaurant/tables",
                        icon: LayoutGrid,
                        defaultLabel: "Tables",
                        permission: "VIEW_RESTAURANT_TABLES",
                        visibleForPresets: ["restaurant"],
                    },
                    {
                        id: "restaurant_kitchen",
                        href: "/restaurant/kitchen",
                        icon: ChefHat,
                        defaultLabel: "Kitchen Board",
                        permission: "VIEW_KITCHEN_TICKETS",
                        visibleForPresets: ["restaurant"],
                    },
                    {
                        id: "restaurant_bar",
                        href: "/restaurant/bar",
                        icon: GlassWater,
                        defaultLabel: "Bar Board",
                        permission: "VIEW_BAR_TICKETS",
                        visibleForPresets: ["restaurant"],
                    },
                ],
            },
            {
                id: "hotel_rooms",
                href: "/hotel/rooms",
                icon: Building2,
                defaultLabel: "Rooms",
                permission: "VIEW_HOTEL_ROOMS",
                visibleForPresets: ["hotel"],
            },
            {
                id: "hotel_reservations",
                href: "/hotel/reservations",
                icon: CalendarRange,
                defaultLabel: "Reservations",
                permission: "VIEW_HOTEL_RESERVATIONS",
                visibleForPresets: ["hotel"],
            },
            {
                id: "hotel_requests",
                href: "/hotel/requests",
                icon: Activity,
                defaultLabel: "Guest requests",
                permission: "VIEW_HOTEL_SERVICE_REQUESTS",
                visibleForPresets: ["hotel"],
            },
            {
                id: "hotel_services",
                href: "/hotel/services",
                icon: ConciergeBell,
                defaultLabel: "Services",
                permission: "VIEW_PRODUCTS",
                visibleForPresets: ["hotel"],
            },
            {
                id: "school_calendar",
                href: "/school/calendar",
                icon: CalendarRange,
                defaultLabel: "School calendar",
                permission: "VIEW_ACADEMIC_CALENDAR",
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
                id: "voice",
                href: "/voice",
                icon: Phone,
                defaultLabel: "Voice",
                permission: "VIEW_VOICE_CALLS",
                moduleFeatureKey: "module_voice",
            },
            {
                id: "whatsapp",
                href: "/whatsapp",
                icon: WhatsApp,
                defaultLabel: "WhatsApp",
                permission: "VIEW_WHATSAPP_CONVERSATIONS",
                planFeatureKey: "hasWhitelabelWhatsapp",
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
                id: "supplies",
                href: "/supplies",
                icon: Wheat,
                defaultLabel: "Supplies",
                permission: "MANAGE_SUPPLIES",
            },
            {
                id: "stores",
                href: "/stores",
                icon: LayoutGrid,
                defaultLabel: "Stores",
                permission: "VIEW_STORES",
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
            {
                id: "developer",
                href: "/developer",
                icon: Code2,
                defaultLabel: "Developer",
                permission: "MANAGE_DEVELOPER_KEYS",
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
