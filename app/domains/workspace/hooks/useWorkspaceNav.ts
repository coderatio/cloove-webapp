"use client"

import { useMemo } from "react"
import { useBusiness } from "@/app/components/BusinessProvider"
import { usePermission } from "@/app/hooks/usePermission"
import { applyLayoutPreset, getLayoutPreset, type LayoutPresetId } from "../nav/layout-presets"
import {
    buildResolvedNavGroups,
    pickNavItemsById,
    type ResolvedNavGroup,
    type ResolvedNavItem,
} from "../nav/build-nav-model"

export function useWorkspaceNav() {
    const { features, activeBusiness } = useBusiness()
    const { can } = usePermission()

    const presetId = (activeBusiness?.layoutPreset as string | undefined) || "default"

    const navGroups: ResolvedNavGroup[] = useMemo(() => {
        const layoutGroups = applyLayoutPreset(presetId)
        return buildResolvedNavGroups(layoutGroups, features, can, presetId)
    }, [presetId, features, can])

    const preset = useMemo(() => getLayoutPreset(presetId), [presetId])

    const mobilePrimary = useMemo(
        () => pickNavItemsById(navGroups, preset.mobilePrimaryIds),
        [navGroups, preset.mobilePrimaryIds]
    )

    const mobileSecondary = useMemo(
        () => pickNavItemsById(navGroups, preset.mobileSecondaryIds),
        [navGroups, preset.mobileSecondaryIds]
    )

    /** More drawer: parent items only (children accessed via submenu), in nav order */
    const mobileMoreItems: ResolvedNavItem[] = useMemo(
        () => navGroups.flatMap((g) => g.items),
        [navGroups]
    )

    return {
        navGroups,
        mobilePrimary,
        mobileSecondary,
        mobileMoreItems,
        presetId: presetId as LayoutPresetId,
        preset,
    }
}
