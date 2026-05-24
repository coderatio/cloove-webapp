"use client"

import { PermissionGuard } from "@/app/components/shared/PermissionGuard"
import { DeveloperView } from "@/app/domains/developer/components/DeveloperView"

export default function DeveloperSettingsPage() {
    return (
        <PermissionGuard anyPermission={["MANAGE_DEVELOPER_KEYS"]}>
            <DeveloperView section="settings" />
        </PermissionGuard>
    )
}
