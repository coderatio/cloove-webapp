"use client"

import * as React from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { Upload01Icon as Upload } from "@hugeicons/core-free-icons"
import { Button } from "@/app/components/ui/button"
import { usePermission } from "@/app/hooks/usePermission"
import { CustomerRosterImportDrawer } from "./CustomerRosterImportDrawer"

export function CustomerRosterImportTrigger() {
    const { can } = usePermission()
    const [open, setOpen] = React.useState(false)

    if (!can("CREATE_CUSTOMER")) return null

    return (
        <>
            <Button
                type="button"
                variant="secondary"
                className="rounded-full transition-all duration-300"
                onClick={() => setOpen(true)}
            >
                <HugeiconsIcon icon={Upload} className="h-4 w-4 mr-2 opacity-80" />
                Import roster
            </Button>
            <CustomerRosterImportDrawer open={open} onOpenChange={setOpen} />
        </>
    )
}
