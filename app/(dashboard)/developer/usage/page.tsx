"use client"

import { PermissionGuard } from "@/app/components/shared/PermissionGuard"
import { ManagementHeader } from "@/app/components/shared/ManagementHeader"
import { UsagePanel } from "@/app/domains/developer/components/DeveloperPanels"

export default function DeveloperUsagePage() {
    return (
        <PermissionGuard anyPermission={["MANAGE_DEVELOPER_KEYS"]}>
            <div className="mx-auto max-w-7xl space-y-5 pb-28">
                <ManagementHeader
                    title="Usage"
                    description="API request volume across all apps, environments, and endpoints."
                    className="rounded-3xl"
                />
                <UsagePanel />
            </div>
        </PermissionGuard>
    )
}
