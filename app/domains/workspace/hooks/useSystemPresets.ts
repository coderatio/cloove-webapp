"use client"

import { useQuery } from "@tanstack/react-query"
import { apiClient } from "@/app/lib/api-client"

export interface SystemPreset {
    id: string
    label: string
    description: string
    isEnabled: boolean
}

/**
 * Fetches available workspace layout presets from the server.
 * These are system-level definitions managed via SystemConfig — not per-business.
 * Cached globally; does not change per business switch.
 */
export function useSystemPresets() {
    return useQuery({
        queryKey: ["system-presets"],
        queryFn: () => apiClient.get<SystemPreset[]>("/layout-presets"),
        staleTime: 1000 * 60 * 60, // 1 hour — system presets rarely change
    })
}
