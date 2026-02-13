"use client"

import { ReferralsView } from "@/app/domains/referrals/components/ReferralsView"
import { usePermission } from "@/app/hooks/usePermission"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { toast } from "sonner"

export default function ReferralsPage() {
    const { role } = usePermission()
    const router = useRouter()

    useEffect(() => {
        if (role && role !== 'OWNER') {
            toast.error('You are not authorized to access this resource')
            router.push('/')
        }
    }, [role, router])

    if (role && role !== 'OWNER') return null

    return <ReferralsView />
}
