import type { LucideIcon } from "lucide-react"
import {
    AudioLines,
    Headphones,
    MapPinned,
    PanelsTopLeft,
    PhoneForwarded,
    PhoneIncoming,
    Receipt,
    Settings2,
    ShoppingBag,
    Users,
    Link2,
    Sparkles,
} from "lucide-react"
import type { NavRouteId } from "@/app/domains/workspace/nav/nav-definitions"

export interface MiniAppItem {
    id: string
    label: string
    icon: LucideIcon
    href: string
}

export interface MiniAppDef {
    id: string
    /** The nav item id in the main sidebar that triggers this mini app */
    navItemId: NavRouteId
    title: string
    description?: string
    icon: LucideIcon
    items: MiniAppItem[]
    /** If pathname starts with any of these, auto-activate this mini app */
    autoActivatePrefixes: string[]
}

export const MINI_APPS: MiniAppDef[] = [
    {
        id: "voice",
        navItemId: "voice",
        title: "Voice",
        description: "Call handling, numbers, and AI agents",
        icon: PhoneIncoming,
        autoActivatePrefixes: ["/voice"],
        items: [
            { id: "overview", label: "Overview", icon: PanelsTopLeft, href: "/voice?voiceTab=overview" },
            { id: "requests", label: "Requests", icon: MapPinned, href: "/voice?voiceTab=requests" },
            { id: "ai-agents", label: "AI Agents", icon: Sparkles, href: "/voice?voiceTab=ai-agents" },
            { id: "calls", label: "Calls", icon: AudioLines, href: "/voice?voiceTab=calls" },
            { id: "transfer", label: "Transfer", icon: PhoneForwarded, href: "/voice?voiceTab=transfer" },
            { id: "spend", label: "Spend", icon: Receipt, href: "/voice?voiceTab=charges" },
            { id: "settings", label: "Settings", icon: Settings2, href: "/voice?voiceTab=settings" },
        ],
    },
    {
        id: "sales",
        navItemId: "orders",
        title: "Sales",
        description: "Orders, customers, and checkout",
        icon: ShoppingBag,
        autoActivatePrefixes: ["/orders", "/sales-mode", "/customers", "/finance/payment-links"],
        items: [
            { id: "orders", label: "Orders", icon: ShoppingBag, href: "/orders" },
            { id: "customers", label: "Customers", icon: Users, href: "/customers" },
            { id: "payment-links", label: "Payment Links", icon: Link2, href: "/finance/payment-links" },
        ],
    },
]

/** Look up a mini app by its nav item id */
export function findMiniAppByNavItemId(navItemId: string): MiniAppDef | undefined {
    return MINI_APPS.find((app) => app.navItemId === navItemId)
}

/** Look up a mini app by its id */
export function findMiniAppById(id: string): MiniAppDef | undefined {
    return MINI_APPS.find((app) => app.id === id)
}

/** Check if a pathname belongs to a mini app (auto-activate) */
export function findMiniAppByPathname(pathname: string): MiniAppDef | undefined {
    return MINI_APPS.find((app) =>
        app.autoActivatePrefixes.some((prefix) => pathname.startsWith(prefix))
    )
}

/**
 * Parse query params from an href string.
 * Example: "/voice?voiceTab=overview&foo=bar" → { pathname: "/voice", params: { voiceTab: "overview", foo: "bar" } }
 */
export function parseHrefParams(
    href: string
): { basePath: string; params: Record<string, string> } {
    const qIndex = href.indexOf("?")
    if (qIndex === -1) {
        return { basePath: href, params: {} }
    }
    const basePath = href.slice(0, qIndex)
    const search = href.slice(qIndex + 1)
    const params: Record<string, string> = {}
    for (const part of search.split("&")) {
        const eqIndex = part.indexOf("=")
        if (eqIndex === -1) {
            params[part] = ""
        } else {
            params[decodeURIComponent(part.slice(0, eqIndex))] = decodeURIComponent(part.slice(eqIndex + 1))
        }
    }
    return { basePath, params }
}

/**
 * Check if a mini app item href matches the current pathname + searchParams.
 * Supports both direct routes and query-param-based tab routes (PersistedTabs).
 */
export function isMiniAppItemActive(
    href: string,
    pathname: string,
    searchParams: URLSearchParams
): boolean {
    const { basePath, params: hrefParams } = parseHrefParams(href)
    const hrefParamKeys = Object.keys(hrefParams)

    if (hrefParamKeys.length === 0) {
        // Direct route: exact match or sub-path
        if (basePath === "/") return pathname === "/"
        return pathname === basePath || pathname.startsWith(basePath + "/")
    }

    // Query-param-based route (PersistedTabs): check base path + all query params match
    if (!pathname.startsWith(basePath)) return false

    for (const [key, value] of Object.entries(hrefParams)) {
        if (searchParams.get(key) !== value) return false
    }

    return true
}
