"use client"

import { cn } from "@/app/lib/utils"

export function formatCallDuration(value: number | null) {
    if (!value) return "—"

    const totalSeconds = Math.max(Math.floor(value), 0)
    const hours = Math.floor(totalSeconds / 3600)
    const minutes = Math.floor((totalSeconds % 3600) / 60)
    const seconds = totalSeconds % 60

    if (hours > 0) {
        return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`
    }

    if (minutes > 0) {
        return seconds > 0 ? `${minutes}m ${seconds}s` : `${minutes}m`
    }

    return `${seconds}s`
}

export function humanizeCallValue(value: string | null | undefined) {
    if (!value) return ""
    const normalized = value.replace(/_/g, " ").trim().toLowerCase()
    if (!normalized || normalized === "not requested") return ""

    const wordMap: Record<string, string> = {
        ai: "AI",
        dtmf: "DTMF",
        ivr: "IVR",
    }

    return normalized
        .split(/\s+/)
        .map((word, index) => {
            if (wordMap[word]) return wordMap[word]
            if (index === 0) return word.charAt(0).toUpperCase() + word.slice(1)
            return word
        })
        .join(" ")
}

export function CallDirectionLabel({ direction }: { direction: string }) {
    const normalized = direction.toLowerCase()
    const isOutbound = normalized.includes("outbound")
    return (
        <span className="inline-flex items-center gap-1.5 text-[13px] text-slate-700 dark:text-slate-300">
            <span
                aria-hidden
                className={cn(
                    "h-1.5 w-1.5 rounded-full",
                    isOutbound ? "bg-sky-500" : "bg-violet-500",
                )}
            />
            <span className="capitalize">{normalized.replace(/_/g, " ")}</span>
        </span>
    )
}

export function CallStatusBadge({ status }: { status: string }) {
    const normalized = status.toLowerCase()
    const styles: Record<string, string> = {
        completed:
            "bg-emerald-50 text-emerald-700 ring-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-500/20",
        transferred:
            "bg-sky-50 text-sky-700 ring-sky-100 dark:bg-sky-500/10 dark:text-sky-300 dark:ring-sky-500/20",
        failed:
            "bg-red-50 text-red-700 ring-red-100 dark:bg-red-500/10 dark:text-red-300 dark:ring-red-500/20",
        missed:
            "bg-amber-50 text-amber-700 ring-amber-100 dark:bg-amber-500/10 dark:text-amber-300 dark:ring-amber-500/20",
        in_progress:
            "bg-blue-50 text-blue-700 ring-blue-100 dark:bg-blue-500/10 dark:text-blue-300 dark:ring-blue-500/20",
        queued:
            "bg-slate-100 text-slate-700 ring-slate-200 dark:bg-white/5 dark:text-slate-300 dark:ring-white/10",
    }
    const className =
        styles[normalized] ??
        "bg-slate-100 text-slate-700 ring-slate-200 dark:bg-white/5 dark:text-slate-300 dark:ring-white/10"
    return (
        <span
            className={cn(
                "inline-flex items-center rounded-md px-2 py-0.5 text-[12px] font-medium capitalize ring-1 ring-inset",
                className,
            )}
        >
            {normalized.replace(/_/g, " ")}
        </span>
    )
}
