"use client"

import { useMemo } from "react"
import { useBusiness } from "@/app/components/BusinessProvider"
import { getPresetPageCopy, type PresetPageCopy } from "../copy/preset-page-copy"
import { LAYOUT_PRESETS, type LayoutPresetId } from "../nav/layout-presets"

const VALID_PRESET_IDS = Object.keys(LAYOUT_PRESETS) as LayoutPresetId[]

export function useLayoutPresetId(): LayoutPresetId {
    const { activeBusiness } = useBusiness()
    const raw = activeBusiness?.layoutPreset
    if (raw && VALID_PRESET_IDS.includes(raw as LayoutPresetId)) {
        return raw as LayoutPresetId
    }
    return "default"
}

export function usePresetPageCopy(): PresetPageCopy {
    const { activeBusiness } = useBusiness()
    const presetId = activeBusiness?.layoutPreset

    return useMemo(() => getPresetPageCopy(presetId), [presetId])
}
