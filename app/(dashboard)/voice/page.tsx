"use client"

import { PermissionGuard } from "@/app/components/shared/PermissionGuard"
import { VoiceView } from "@/app/domains/voice/components/VoiceView"

export default function VoicePage() {
    return (
        <PermissionGuard anyPermission={["VIEW_VOICE_CALLS", "START_VOICE_CALLS", "MANAGE_VOICE_SETTINGS"]}>
            <VoiceView />
        </PermissionGuard>
    )
}
