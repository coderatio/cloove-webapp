"use client"

import { useEffect, useState } from "react"
import { CloudOff, CloudUpload } from "lucide-react"
import { getOutboxEntryCount } from "@/app/lib/offline/sales-outbox"
import { cn } from "@/app/lib/utils"

function getInitialOnline() {
    if (typeof navigator === "undefined") return true
    return navigator.onLine
}

export function SalesOutboxBanner() {
    const [online, setOnline] = useState(getInitialOnline)
    const [pending, setPending] = useState(0)

    useEffect(() => {
        const refresh = () => {
            void getOutboxEntryCount().then(setPending)
        }
        const onOnline = () => setOnline(true)
        const onOffline = () => setOnline(false)

        refresh()

        window.addEventListener("online", onOnline)
        window.addEventListener("offline", onOffline)
        window.addEventListener("sales-outbox:changed", refresh)
        const interval = window.setInterval(refresh, 8000)

        return () => {
            window.removeEventListener("online", onOnline)
            window.removeEventListener("offline", onOffline)
            window.removeEventListener("sales-outbox:changed", refresh)
            window.clearInterval(interval)
        }
    }, [])

    if (!online) {
        return (
            <div
                className={cn(
                    "shrink-0 border-b border-amber-500/30 bg-amber-500/15 px-3 py-2 text-center text-[11px] sm:text-xs",
                    "text-amber-950 dark:text-amber-100"
                )}
                role="status"
            >
                <span className="inline-flex items-center justify-center gap-1.5 font-medium">
                    <CloudOff className="h-3.5 w-3.5 shrink-0 opacity-90" aria-hidden />
                    You are offline. Sales are saved on this device and will sync when you are back online.
                </span>
            </div>
        )
    }

    if (pending === 0) return null

    return (
        <div
            className={cn(
                "shrink-0 border-b border-brand-gold/25 bg-brand-gold/10 px-3 py-2 text-center text-[11px] sm:text-xs",
                "text-foreground"
            )}
            role="status"
        >
            <span className="inline-flex items-center justify-center gap-1.5 font-medium">
                <CloudUpload className="h-3.5 w-3.5 shrink-0 opacity-80" aria-hidden />
                {pending === 1
                    ? "1 sale is waiting to sync with the server."
                    : `${pending} sales are waiting to sync with the server.`}
            </span>
        </div>
    )
}
