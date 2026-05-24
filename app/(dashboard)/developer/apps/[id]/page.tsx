"use client"

import { PermissionGuard } from "@/app/components/shared/PermissionGuard"
import { AppDetailView } from "@/app/domains/developer/components/AppDetailView"

export default function DeveloperAppDetailPage() {
    return (
        <PermissionGuard anyPermission={["MANAGE_DEVELOPER_KEYS"]}>
            <AppDetailView />
        </PermissionGuard>
    )
}
