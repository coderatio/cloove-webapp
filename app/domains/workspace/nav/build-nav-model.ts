import type { NavGroupDef, NavItemDef, NavRouteId } from "./nav-definitions"

export type ResolvedNavItem = Omit<NavItemDef, "children"> & {
    label: string
    children?: ResolvedNavItem[]
}

export interface ResolvedNavGroup {
    key: string
    label: string
    items: ResolvedNavItem[]
}

function isItemVisible(
    item: NavItemDef,
    features: Record<string, boolean> | null,
    can: (permission: string) => boolean
): boolean {
    if (item.permission && !can(item.permission)) return false

    if (item.planFeatureKey) {
        const v = features?.[item.planFeatureKey]
        if (v !== true) return false
    }

    if (item.moduleFeatureKey) {
        const v = features?.[item.moduleFeatureKey]
        if (v === false) return false
    }

    return true
}

function resolveItem(
    item: NavItemDef,
    features: Record<string, boolean> | null,
    can: (permission: string) => boolean
): ResolvedNavItem | null {
    if (!isItemVisible(item, features, can)) return null

    const children = item.children
        ?.map((c) => resolveItem(c as NavItemDef, features, can))
        .filter((c): c is ResolvedNavItem => c !== null)

    const resolvedChildren =
        children && children.length > 0 ? children : undefined

    return {
        id: item.id,
        href: item.href,
        icon: item.icon,
        defaultLabel: item.defaultLabel,
        label: item.defaultLabel,
        permission: item.permission,
        planFeatureKey: item.planFeatureKey,
        moduleFeatureKey: item.moduleFeatureKey,
        children: resolvedChildren,
    }
}

/**
 * Filter nav tree by RBAC + plan features + module toggles.
 */
export function buildResolvedNavGroups(
    groups: NavGroupDef[],
    features: Record<string, boolean> | null,
    can: (permission: string) => boolean
): ResolvedNavGroup[] {
    const out: ResolvedNavGroup[] = []

    for (const g of groups) {
        const items: ResolvedNavItem[] = []
        for (const item of g.items) {
            const r = resolveItem(item, features, can)
            if (r) items.push(r)
        }
        if (items.length === 0) continue
        out.push({
            key: g.key,
            label: g.defaultLabel,
            items,
        })
    }

    return out
}

/** Flatten nav items in visual order for mobile "More" list */
export function flattenNavItems(groups: ResolvedNavGroup[]): ResolvedNavItem[] {
    const flat: ResolvedNavItem[] = []
    for (const g of groups) {
        for (const item of g.items) {
            flat.push(item)
            if (item.children?.length) {
                for (const c of item.children) {
                    flat.push(c)
                }
            }
        }
    }
    return flat
}

/** Pick items by id for mobile bar; preserves order of `ids` */
export function pickNavItemsById(
    groups: ResolvedNavGroup[],
    ids: NavRouteId[]
): ResolvedNavItem[] {
    const flat = flattenNavItems(groups)
    const map = new Map(flat.map((i) => [i.id, i]))
    return ids.map((id) => map.get(id)).filter((i): i is ResolvedNavItem => !!i)
}
