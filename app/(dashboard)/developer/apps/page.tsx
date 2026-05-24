"use client"

import { PermissionGuard } from "@/app/components/shared/PermissionGuard"
import { AppsListView } from "@/app/domains/developer/components/AppsListView"

export default function DeveloperAppsPage() {
    return (
        <PermissionGuard anyPermission={["MANAGE_DEVELOPER_KEYS"]}>
            <AppsListView />
        </PermissionGuard>
    )
}
