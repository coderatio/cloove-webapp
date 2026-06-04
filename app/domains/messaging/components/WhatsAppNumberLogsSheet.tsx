"use client"

import { useMemo, useState } from "react"
import {
  SideSheet,
  SideSheetContent,
  SideSheetStickyHeader,
  SideSheetBody,
  SideSheetTitle,
  SideSheetDescription,
} from "@/app/components/ui/side-sheet"
import { Button } from "@/app/components/ui/button"
import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react"
import { CheckmarkCircle02Icon as CheckCircle2, AlertCircleIcon as AlertCircle, Clock01Icon as Clock, WifiOff01Icon as WifiOff, Loading03Icon as Loader2 } from "@hugeicons/core-free-icons"
import {
  useWhatsAppNumberVerificationLogs,
  type VerificationLogEntry,
  type WhatsAppNumber,
} from "../hooks/useWhatsAppSettings"

interface WhatsAppNumberLogsSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  number: WhatsAppNumber
}

interface DayGroup {
  key: string
  label: string
  entries: VerificationLogEntry[]
}

const OUTCOME_STYLES: Record<
  string,
  { dot: string; ring: string; icon: IconSvgElement; label: string }
> = {
  active: {
    dot: "bg-emerald-500",
    ring: "ring-emerald-500/20",
    icon: CheckCircle2,
    label: "Verified",
  },
  pending: {
    dot: "bg-amber-500",
    ring: "ring-amber-500/20",
    icon: Clock,
    label: "Pending",
  },
  escalated: {
    dot: "bg-amber-500",
    ring: "ring-amber-500/20",
    icon: Clock,
    label: "Escalated",
  },
  failed: {
    dot: "bg-red-500",
    ring: "ring-red-500/20",
    icon: AlertCircle,
    label: "Failed",
  },
  unreachable: {
    dot: "bg-slate-400",
    ring: "ring-slate-400/20",
    icon: WifiOff,
    label: "Unreachable",
  },
}

const SOURCE_LABELS: Record<string, string> = {
  fast_poll: "Polling",
  slow_retry: "Polling",
  manual_check: "Manual check",
  webhook: "Webhook",
}

export function WhatsAppNumberLogsSheet({
  open,
  onOpenChange,
  number,
}: WhatsAppNumberLogsSheetProps) {
  const query = useWhatsAppNumberVerificationLogs(number.id, open)

  const entries = useMemo<VerificationLogEntry[]>(
    () => query.data?.pages.flatMap((page) => page.entries ?? []) ?? [],
    [query.data]
  )
  const groups = useMemo(() => groupByDay(entries), [entries])
  const total = number.verification_logs_count
  const isInitialLoading = query.isPending && entries.length === 0

  return (
    <SideSheet open={open} onOpenChange={onOpenChange}>
      <SideSheetContent>
        <SideSheetStickyHeader>
          <SideSheetTitle>Activity log</SideSheetTitle>
          <SideSheetDescription>
            {number.phone_number}
            {number.display_name ? ` · ${number.display_name}` : ""}
          </SideSheetDescription>
          <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
            {total === 0
              ? "No activity recorded yet."
              : `${total} event${total === 1 ? "" : "s"} · last 90 days`}
          </p>
        </SideSheetStickyHeader>

        <SideSheetBody>
          {isInitialLoading ? (
            <LoadingState />
          ) : groups.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="space-y-8">
              {groups.map((group) => (
                <DayTimelineGroup key={group.key} group={group} />
              ))}
              {query.hasNextPage && (
                <div className="flex justify-center pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => query.fetchNextPage()}
                    disabled={query.isFetchingNextPage}
                    className="rounded-full"
                  >
                    {query.isFetchingNextPage ? (
                      <HugeiconsIcon icon={Loader2} className="mr-2 h-3.5 w-3.5 animate-spin" />
                    ) : null}
                    Load older
                  </Button>
                </div>
              )}
              {!query.hasNextPage && entries.length > 0 && (
                <p className="pt-2 text-center text-xs text-slate-400 dark:text-slate-500">
                  End of history
                </p>
              )}
            </div>
          )}
        </SideSheetBody>
      </SideSheetContent>
    </SideSheet>
  )
}

function DayTimelineGroup({ group }: { group: DayGroup }) {
  return (
    <section>
      <div className="sticky top-0 z-10 -mx-4 mb-3 bg-white/95 px-4 pb-2 pt-1 backdrop-blur dark:bg-slate-950/95 sm:-mx-6 sm:px-6">
        <h3 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
          {group.label}
        </h3>
      </div>
      <ol>
        {group.entries.map((log, idx) => (
          <TimelineEntry
            key={log.id}
            log={log}
            isLast={idx === group.entries.length - 1}
          />
        ))}
      </ol>
    </section>
  )
}

function TimelineEntry({
  log,
  isLast,
}: {
  log: VerificationLogEntry
  isLast: boolean
}) {
  const [showDetails, setShowDetails] = useState(false)
  const style = OUTCOME_STYLES[log.outcome] ?? OUTCOME_STYLES.pending
  const Icon = style.icon
  const time = new Date(log.timestamp).toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  })
  const sourceLabel = SOURCE_LABELS[log.source] ?? log.source

  const metaParts: string[] = []
  if (log.meta_status) metaParts.push(`Meta: ${log.meta_status}`)
  if (log.code_verification_status) metaParts.push(`Code: ${log.code_verification_status}`)
  if (log.quality_rating) metaParts.push(`Quality: ${log.quality_rating}`)

  const hasDetails = log.metadata && Object.keys(log.metadata).length > 0

  return (
    <li className="flex gap-3">
      {/* Marker column: dot at top, rail below filling the entry height */}
      <div className="flex w-3.5 flex-none flex-col items-center">
        <span
          className={`mt-1 block h-3.5 w-3.5 shrink-0 rounded-full ${style.dot} ring-4 ${style.ring}`}
          aria-hidden
        />
        {!isLast && (
          <span className="mt-1 w-px flex-1 bg-slate-200 dark:bg-slate-800" aria-hidden />
        )}
      </div>

      {/* Content */}
      <div className={`min-w-0 flex-1 ${isLast ? "" : "pb-5"}`}>
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
          <span className="text-sm font-semibold tabular-nums text-slate-900 dark:text-slate-100">
            {time}
          </span>
          <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 dark:text-slate-400">
            <HugeiconsIcon icon={Icon} className="h-3 w-3" />
            {style.label}
          </span>
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-slate-500 dark:bg-slate-800 dark:text-slate-400">
            {sourceLabel}
          </span>
        </div>
        <p className="mt-1.5 text-sm leading-relaxed text-slate-700 dark:text-slate-200">
          {log.message}
        </p>
        {metaParts.length > 0 && (
          <p className="mt-1 font-mono text-[11px] text-slate-400 dark:text-slate-500">
            {metaParts.join(" · ")}
          </p>
        )}
        {hasDetails && (
          <>
            <button
              type="button"
              onClick={() => setShowDetails((prev) => !prev)}
              className="mt-1.5 text-[11px] font-medium text-slate-500 underline-offset-2 hover:text-slate-900 hover:underline dark:text-slate-400 dark:hover:text-slate-200"
            >
              {showDetails ? "Hide details" : "View details"}
            </button>
            {showDetails && (
              <pre className="mt-1.5 max-h-48 overflow-auto rounded-lg bg-slate-50 px-3 py-2 font-mono text-[11px] leading-snug text-slate-700 dark:bg-slate-900 dark:text-slate-300">
                {JSON.stringify(log.metadata, null, 2)}
              </pre>
            )}
          </>
        )}
      </div>
    </li>
  )
}

function LoadingState() {
  return (
    <div className="flex h-full flex-col items-center justify-center py-16 text-center">
      <HugeiconsIcon icon={Loader2} className="h-5 w-5 animate-spin text-slate-400" />
      <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">Loading activity…</p>
    </div>
  )
}

function EmptyState() {
  return (
    <div className="flex h-full flex-col items-center justify-center py-16 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
        <HugeiconsIcon icon={Clock} className="h-5 w-5 text-slate-400" />
      </div>
      <p className="mt-4 text-sm font-medium text-slate-700 dark:text-slate-200">
        No activity yet
      </p>
      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
        Meta status checks and webhook events will appear here as they happen.
      </p>
    </div>
  )
}

function groupByDay(logs: VerificationLogEntry[]): DayGroup[] {
  if (!logs || logs.length === 0) return []

  const today = startOfDay(new Date())
  const yesterday = startOfDay(new Date(today.getTime() - 86400_000))

  const buckets = new Map<string, DayGroup>()
  for (const log of logs) {
    if (!log?.timestamp) continue
    const ts = new Date(log.timestamp)
    if (Number.isNaN(ts.getTime())) continue
    const day = startOfDay(ts)
    const key = day.toISOString().slice(0, 10)

    if (!buckets.has(key)) {
      buckets.set(key, { key, label: formatDayLabel(day, today, yesterday), entries: [] })
    }
    buckets.get(key)!.entries.push(log)
  }

  return Array.from(buckets.values())
}

function startOfDay(date: Date): Date {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return d
}

function formatDayLabel(day: Date, today: Date, yesterday: Date): string {
  if (day.getTime() === today.getTime()) return "Today"
  if (day.getTime() === yesterday.getTime()) return "Yesterday"
  return day.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: day.getFullYear() === today.getFullYear() ? undefined : "numeric",
  })
}
