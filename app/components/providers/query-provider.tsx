"use client"

import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { useState } from "react"
import { SalesOutboxSync } from "@/app/components/providers/sales-outbox-sync"

export default function QueryProvider({ children }: { children: React.ReactNode }) {
    const [queryClient] = useState(() => new QueryClient({
        defaultOptions: {
            queries: {
                staleTime: 60 * 1000, // 1 minute
            },
        },
    }))

    return (
        <QueryClientProvider client={queryClient}>
            <SalesOutboxSync />
            {children}
        </QueryClientProvider>
    )
}
