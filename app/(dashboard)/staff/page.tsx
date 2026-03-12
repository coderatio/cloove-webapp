"use client"

import { StaffView } from "@/app/domains/staff/components/StaffView"
import { PermissionGuard } from "@/app/components/shared/PermissionGuard"

export default function StaffManagementPage() {
    return (
        <PermissionGuard permission="VIEW_STAFF">
            <StaffView />
        </PermissionGuard>
    )
}
