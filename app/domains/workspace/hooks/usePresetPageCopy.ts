"use client"

import { useMemo } from "react"
import { useSettings } from "@/app/domains/business/hooks/useBusinessSettings"
import { getPresetPageCopy, type PresetPageCopy } from "../copy/preset-page-copy"
import type { LayoutPresetId } from "../nav/layout-presets"

export function useLayoutPresetId(): LayoutPresetId {
    const { data: settings } = useSettings()
    const raw = settings?.business?.configs?.ui_layout_preset as string | undefined
    if (raw && ["default", "restaurant", "retail", "pharmacy", "school"].includes(raw)) {
        return raw as LayoutPresetId
    }
    return "default"
}

export function usePresetPageCopy(): PresetPageCopy {
    const { data: settings } = useSettings()
    const presetId = settings?.business?.configs?.ui_layout_preset as string | undefined

    return useMemo(() => getPresetPageCopy(presetId), [presetId])
}
