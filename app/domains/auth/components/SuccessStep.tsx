"use client"

import { HugeiconsIcon } from "@hugeicons/react"
import { CheckmarkCircle02Icon as CheckCircle2 } from "@hugeicons/core-free-icons"

export function SuccessStep() {
    return (
        <div className="rounded-[28px] border border-white/10 bg-white/[0.045] p-8 text-center shadow-sm">
            <div className="mb-5 inline-flex h-14 w-14 items-center justify-center rounded-2xl border border-emerald-300/20 bg-emerald-300/10 text-emerald-300">
                    <HugeiconsIcon icon={CheckCircle2} className="w-10 h-10" />
            </div>
            <h2 className="mb-2 text-2xl font-semibold tracking-tight text-white">Welcome home</h2>
            <p className="text-sm text-white/55">Accessing your business dashboard...</p>
        </div>
    )
}
