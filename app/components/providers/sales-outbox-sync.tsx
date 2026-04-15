"use client"

import { useEffect } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { flushSalesOutbox } from "@/app/lib/offline/sales-outbox"

/**
 * Periodically drains the offline sales queue when the browser is online.
 */
export function SalesOutboxSync() {
    const queryClient = useQueryClient()

    useEffect(() => {
        const run = () => {
            void flushSalesOutbox(queryClient)
        }
        run()
        window.addEventListener("online", run)
        window.addEventListener("sales-outbox:changed", run)
        const interval = window.setInterval(run, 25_000)
        return () => {
            window.removeEventListener("online", run)
            window.removeEventListener("sales-outbox:changed", run)
            window.clearInterval(interval)
        }
    }, [queryClient])

    return null
}
