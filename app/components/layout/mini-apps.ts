import type { LucideIcon } from "lucide-react"
import {
    AudioLines,
    MapPinned,
    PanelsTopLeft,
    PhoneForwarded,
    PhoneIncoming,
    Receipt,
    Settings2,
    ShoppingBag,
    Users,
    Link2,
    Code2,
    LayoutGrid,
    BarChart3,
    ListChecks,
    Sparkles,
    BookText,
    MessageSquare,
    Bot,
    KeyRound,
    ClipboardList,
    Plug,
    GitBranch,
    BadgePercent,
    Truck,
    Mic,
} from "lucide-react"
import type { NavRouteId } from "@/app/domains/workspace/nav/nav-definitions"
import { NAV_GROUPS } from "@/app/domains/workspace/nav/nav-definitions"
import type { ResolvedNavGroup } from "@/app/domains/workspace/nav/build-nav-model"

// ── Static maps built from NAV_GROUPS for fast lookups ──────────────────────

/** Map from nav item id (parents + children) to href */
const NAV_ID_TO_HREF = new Map<string, string>()
/** Map from root-level nav item href to its id */
const ROOT_HREF_TO_ID = new Map<string, string>()
for (const group of NAV_GROUPS) {
    for (const item of group.items) {
        NAV_ID_TO_HREF.set(item.id, item.href)
        ROOT_HREF_TO_ID.set(item.href, item.id)
        for (const child of item.children || []) {
            NAV_ID_TO_HREF.set(child.id, child.href)
        }
    }
}

export interface MiniAppItem {
    id: string
    label: string
    icon: LucideIcon
    href: string
    permission?: string
}

export interface MiniAppDef {
    id: string
    /** The nav item id in the main sidebar that triggers this mini app */
    navItemId: NavRouteId
    title: string
    description?: string
    icon: LucideIcon
    items: MiniAppItem[]
    /**
     * IDs of nav items to resolve from the resolved nav tree (preset-aware).
     * Items that pass RBAC/feature/preset filtering will be rendered before static `items`.
     */
    navChildIds?: NavRouteId[]
    /** If pathname starts with any of these, auto-activate this mini app */
    autoActivatePrefixes: string[]
}

export const MINI_APPS: MiniAppDef[] = [
    {
        id: "whatsapp",
        navItemId: "whatsapp",
        title: "WhatsApp",
        description: "Inbox, takeover, templates, and automation",
        icon: MessageSquare,
        autoActivatePrefixes: ["/whatsapp"],
        items: [
            { id: "overview", label: "Overview", icon: PanelsTopLeft, href: "/whatsapp?tab=overview" },
            { id: "inbox", label: "Inbox", icon: MessageSquare, href: "/whatsapp/inbox" },
            { id: "otps", label: "OTPs", icon: KeyRound, href: "/whatsapp?tab=otps", permission: "VIEW_WHATSAPP_OTPS" },
            { id: "templates", label: "Templates", icon: ClipboardList, href: "/whatsapp?tab=templates" },
            { id: "flows", label: "Flows", icon: GitBranch, href: "/whatsapp?tab=flows" },
            { id: "connections", label: "Connections", icon: Plug, href: "/whatsapp?tab=connections" },
            { id: "automation", label: "Automation", icon: Bot, href: "/whatsapp?tab=automation" },
        ],
    },
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
            { id: "voice-cloning", label: "Voice Cloning", icon: Mic, href: "/voice?voiceTab=voice-cloning" },
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
            { id: "discount-codes", label: "Discount Codes", icon: BadgePercent, href: "/orders/discount-codes" },
            { id: "delivery-fees", label: "Delivery Fees", icon: Truck, href: "/orders/delivery-fees" },
        ],
        /** Items resolved from the nav tree (preset-aware: restaurant, school, etc.) */
        navChildIds: [
            "orders",
            "orders_sale",
            "restaurant_live",
            "restaurant_tables",
            "restaurant_kitchen",
            "restaurant_bar",
            "school_fee_tools",
        ],
    },
    {
        id: "developer",
        navItemId: "developer",
        title: "Developer",
        description: "Apps, API keys, and integrations",
        icon: Code2,
        autoActivatePrefixes: ["/developer"],
        items: [
            { id: "overview", label: "Overview", icon: PanelsTopLeft, href: "/developer" },
            { id: "apps", label: "Apps", icon: LayoutGrid, href: "/developer/apps" },
            { id: "usage", label: "Usage", icon: BarChart3, href: "/developer/usage" },
            { id: "events", label: "Events", icon: ListChecks, href: "/developer/events" },
            { id: "api-docs", label: "Api Docs", icon: BookText, href: "https://docs.clooveai.com/" },
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

/**
 * Compute the full set of auto-activation prefixes for a mini app.
 * Merges manual `autoActivatePrefixes` with prefixes derived from `navChildIds`
 * by looking up their hrefs in NAV_GROUPS. This means any preset-specific route
 * added to `navChildIds` is automatically included — no manual prefix maintenance.
 *
 * Safety rule for multi-segment hrefs:
 *   - If the first segment is a root nav item belonging to a DIFFERENT module
 *     (e.g., `/finance/payment-links` where `/finance` is the Finance page),
 *     the full href is used as the prefix to avoid collision.
 *   - Otherwise, the first segment is used (e.g., `/restaurant/live` → `/restaurant`).
 */
function getAutoActivatePrefixes(miniApp: MiniAppDef): string[] {
    const prefixes = new Set(miniApp.autoActivatePrefixes)

    if (miniApp.navChildIds) {
        for (const childId of miniApp.navChildIds) {
            const href = NAV_ID_TO_HREF.get(childId)
            if (!href) continue

            // Already covered by an existing prefix
            if ([...prefixes].some((p) => href.startsWith(p))) continue

            const parts = href.split("/").filter(Boolean)
            if (parts.length >= 2) {
                const firstSegment = "/" + parts[0]
                const rootId = ROOT_HREF_TO_ID.get(firstSegment)

                // If the first segment is a root nav item that belongs to a DIFFERENT module,
                // use the full href to avoid colliding with that module's root page.
                if (rootId !== undefined && rootId !== miniApp.navItemId) {
                    prefixes.add(href)
                } else {
                    prefixes.add(firstSegment)
                }
            } else {
                prefixes.add(href)
            }
        }
    }

    return [...prefixes]
}

/** Check if a pathname belongs to a mini app (auto-activate) */
export function findMiniAppByPathname(pathname: string): MiniAppDef | undefined {
    return MINI_APPS.find((app) =>
        getAutoActivatePrefixes(app).some((prefix) => pathname.startsWith(prefix))
    )
}

/**
 * Resolve the actual items for a mini app by merging static `items` with
 * preset-aware nav children resolved from the nav tree.
 *
 * Nav children that don't pass RBAC/feature/preset filtering won't be in the
 * resolved tree and will be silently skipped.
 */
export function resolveMiniAppItems(
    miniApp: MiniAppDef,
    navGroups: ResolvedNavGroup[]
): MiniAppItem[] {
    if (!miniApp.navChildIds || miniApp.navChildIds.length === 0) {
        return miniApp.items
    }

    // Build a map of all resolved nav items (including children) by their id
    const itemMap = new Map<
        string,
        { id: string; href: string; icon: LucideIcon; label: string }
    >()
    for (const group of navGroups) {
        for (const item of group.items) {
            itemMap.set(item.id, item)
            if (item.children) {
                for (const child of item.children) {
                    itemMap.set(child.id, child)
                }
            }
        }
    }

    // Resolve nav child IDs that exist in the current preset tree
    const resolvedChildren: MiniAppItem[] = []
    for (const childId of miniApp.navChildIds) {
        const navItem = itemMap.get(childId)
        if (navItem) {
            resolvedChildren.push({
                id: navItem.id,
                label: navItem.label,
                icon: navItem.icon,
                href: navItem.href,
            })
        }
    }

    // Ensure the parent nav item (the one that triggers this mini app) is always first
    const parentIdx = resolvedChildren.findIndex((r) => r.id === miniApp.navItemId)
    if (parentIdx > 0) {
        const [parent] = resolvedChildren.splice(parentIdx, 1)
        resolvedChildren.unshift(parent)
    }

    // Static items minus any that overlap with resolved children
    const resolvedIds = new Set(resolvedChildren.map((r) => r.id))
    const staticItems = miniApp.items.filter((i) => !resolvedIds.has(i.id))

    return [...resolvedChildren, ...staticItems]
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
        if (basePath === "/orders") return pathname === "/orders"
        if (basePath === "/developer") return pathname === "/developer"
        return pathname === basePath || pathname.startsWith(basePath + "/")
    }

    // Query-param-based route (PersistedTabs): check base path + all query params match
    if (!pathname.startsWith(basePath)) return false

    if (pathname !== basePath && pathname.startsWith(basePath + "/")) {
        const subPath = pathname.slice(basePath.length + 1)
        const firstSegment = subPath.split("/")[0]

        if (firstSegment && hrefParamKeys.some((key) => hrefParams[key] === firstSegment)) {
            return true
        }
    }

    for (const [key, value] of Object.entries(hrefParams)) {
        if (searchParams.get(key) !== value) return false
    }

    return true
}
