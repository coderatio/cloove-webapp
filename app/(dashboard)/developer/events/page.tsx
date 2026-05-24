"use client"

import { PermissionGuard } from "@/app/components/shared/PermissionGuard"
import { ManagementHeader } from "@/app/components/shared/ManagementHeader"
import { EventsPanel } from "@/app/domains/developer/components/DeveloperPanels"

export default function DeveloperEventsPage() {
    return (
        <PermissionGuard anyPermission={["MANAGE_DEVELOPER_KEYS"]}>
            <div className="mx-auto max-w-7xl space-y-5 pb-28">
                <ManagementHeader
                    title="Events"
                    description="Audit trail of developer activity — key creation, webhook events, and API changes."
                    className="rounded-3xl"
                />
                <EventsPanel />
            </div>
        </PermissionGuard>
    )
}
