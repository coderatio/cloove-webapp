"use client"

import * as React from "react"
import { Button } from "@/app/components/ui/button"
import { GlassCard } from "@/app/components/ui/glass-card"
import { Input } from "@/app/components/ui/input"
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerStickyHeader,
  DrawerTitle,
  DrawerBody,
} from "@/app/components/ui/drawer"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { toast } from "sonner"
import { AnimatePresence, motion } from "framer-motion"
import {
  useKitchenTickets,
  useKitchenTicketActions,
  useBarTickets,
  useBarTicketActions,
  useCreateBarTicket,
  useRestaurantTableActions,
  useRestaurantTables,
  useTableSessions,
  useTableSessionActions,
  type KitchenTicket,
  type BarTicket,
  type TableSession,
  type RestaurantTable,
} from "../hooks/useRestaurantOps"
import { cn } from "@/app/lib/utils"
import { CapacityStepper } from "@/app/domains/restaurant/components/CapacityStepper"
import { useRestaurantRefreshInterval } from "@/app/domains/restaurant/hooks/useRestaurantRefreshInterval"
import {
  UtensilsCrossed,
  ChefHat,
  GlassWater,
  Armchair,
  CheckCircle2,
  Clock,
  Users,
  Plus,
  Circle,
  ArrowLeft,
  ArrowRight,
  Zap,
  TableProperties,
  ToggleLeft,
  ToggleRight,
  Trash2,
  PencilLine,
  Archive,
  RotateCcw,
  ChevronRight,
  Maximize2,
  Minimize2,
} from "lucide-react"
import { ZenModeContext } from "@/app/components/layout/AppLayout"

const KITCHEN_FLOW: KitchenTicket["status"][] = ["queued", "preparing", "ready", "served"]

const STATUS_CONFIG: Record<
  KitchenTicket["status"],
  { label: string; color: string; bg: string; border: string; icon: React.ElementType; dotColor: string }
> = {
  queued: {
    label: "Queued",
    color: "text-amber-700 dark:text-amber-300",
    bg: "bg-amber-500/8 dark:bg-amber-500/10",
    border: "border-amber-500/20",
    icon: Clock,
    dotColor: "bg-amber-400",
  },
  preparing: {
    label: "Preparing",
    color: "text-blue-700 dark:text-blue-300",
    bg: "bg-blue-500/8 dark:bg-blue-500/10",
    border: "border-blue-500/20",
    icon: ChefHat,
    dotColor: "bg-blue-400",
  },
  ready: {
    label: "Ready",
    color: "text-emerald-700 dark:text-emerald-300",
    bg: "bg-emerald-500/8 dark:bg-emerald-500/10",
    border: "border-emerald-500/20",
    icon: Zap,
    dotColor: "bg-emerald-400",
  },
  served: {
    label: "Served",
    color: "text-brand-accent/60 dark:text-brand-cream/50",
    bg: "bg-brand-accent/5 dark:bg-white/5",
    border: "border-brand-accent/10",
    icon: CheckCircle2,
    dotColor: "bg-brand-accent/40",
  },
}

const BAR_FLOW: BarTicket["status"][] = ["ordered", "making", "ready", "served"]

const BAR_STATUS_CONFIG: Record<
  BarTicket["status"],
  { label: string; color: string; bg: string; border: string; icon: React.ElementType; dotColor: string }
> = {
  ordered: {
    label: "Ordered",
    color: "text-amber-700 dark:text-amber-300",
    bg: "bg-amber-500/8 dark:bg-amber-500/10",
    border: "border-amber-500/20",
    icon: Clock,
    dotColor: "bg-amber-400",
  },
  making: {
    label: "Making",
    color: "text-violet-700 dark:text-violet-300",
    bg: "bg-violet-500/8 dark:bg-violet-500/10",
    border: "border-violet-500/20",
    icon: GlassWater,
    dotColor: "bg-violet-400",
  },
  ready: {
    label: "Ready",
    color: "text-emerald-700 dark:text-emerald-300",
    bg: "bg-emerald-500/8 dark:bg-emerald-500/10",
    border: "border-emerald-500/20",
    icon: Zap,
    dotColor: "bg-emerald-400",
  },
  served: {
    label: "Served",
    color: "text-brand-accent/60 dark:text-brand-cream/50",
    bg: "bg-brand-accent/5 dark:bg-white/5",
    border: "border-brand-accent/10",
    icon: CheckCircle2,
    dotColor: "bg-brand-accent/40",
  },
}

function formatElapsed(isoString: string): string {
  const diff = Math.floor((Date.now() - new Date(isoString).getTime()) / 1000)
  if (diff < 60) return `${diff}s`
  if (diff < 3600) return `${Math.floor(diff / 60)}m`
  return `${Math.floor(diff / 3600)}h ${Math.floor((diff % 3600) / 60)}m`
}

function getUrgencyClass(isoString: string, status: KitchenTicket["status"]): string {
  // Served: calm surface + border (same family as default, slightly softer than active urgency)
  if (status === "served") {
    return "border-brand-deep/10 dark:border-white/12 bg-white dark:bg-white/[0.06]"
  }
  const mins = (Date.now() - new Date(isoString).getTime()) / 60000
  if (mins > 30) {
    return "border-brand-deep/14 dark:border-white/12 bg-neutral-50 dark:bg-white/[0.07]"
  }
  if (mins > 15) {
    return "border-brand-deep/11 dark:border-white/10 bg-neutral-50/80 dark:bg-white/[0.05]"
  }
  // Default active: subtle border + solid card fill (visible, calm)
  return "border-brand-deep/8 dark:border-white/9 bg-white dark:bg-white/5"
}

function ElapsedBadge({ createdAt, status }: { createdAt: string; status: KitchenTicket["status"] }) {
  const [elapsed, setElapsed] = React.useState(() => formatElapsed(createdAt))
  const mins = (Date.now() - new Date(createdAt).getTime()) / 60000

  React.useEffect(() => {
    const id = setInterval(() => setElapsed(formatElapsed(createdAt)), 30000)
    return () => clearInterval(id)
  }, [createdAt])

  if (status === "served") return null

  return (
    <span
      className={cn(
        "text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-md",
        mins > 30
          ? "bg-rose-100 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400"
          : mins > 15
            ? "bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400"
            : "bg-brand-accent/5 dark:bg-white/5 text-brand-accent/60 dark:text-brand-cream/50"
      )}
    >
      {elapsed}
    </span>
  )
}

const BarTicketCard = React.memo(function BarTicketCard({
  ticket,
  onAdvance,
  onEdit,
  onDelete,
  isPending,
}: {
  ticket: BarTicket
  onAdvance: (id: string, status: BarTicket["status"]) => void
  onEdit: (ticket: BarTicket) => void
  onDelete: (id: string) => void
  isPending: boolean
}) {
  const idx = BAR_FLOW.indexOf(ticket.status)
  const prev = BAR_FLOW[idx - 1]
  const next = BAR_FLOW[idx + 1]

  return (
    <div
      className={cn(
        "rounded-3xl border p-3.5 space-y-2.5 transition-colors duration-200",
        getUrgencyClass(ticket.createdAt, ticket.status === "served" ? "served" : "queued")
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm text-brand-deep dark:text-brand-cream truncate">{ticket.station}</p>
          <p className="text-[10px] text-brand-accent/50 dark:text-brand-cream/40 font-mono mt-0.5">
            #{ticket.saleId?.slice(0, 8) ?? "manual"}
          </p>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <ElapsedBadge createdAt={ticket.createdAt} status={ticket.status === "served" ? "served" : "queued"} />
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onEdit(ticket)}
            className="h-6 w-6 rounded-lg text-brand-accent/30 hover:text-brand-accent/70 dark:text-brand-cream/30 dark:hover:text-brand-cream/70 hover:bg-black/5 dark:hover:bg-white/10"
            title="Edit label"
          >
            <PencilLine className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onDelete(ticket.id)}
            className="h-6 w-6 rounded-lg text-red-400/50 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10"
            title="Delete"
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>

      <div className="flex gap-1.5">
        {prev && (
          <Button
            size="sm"
            variant="ghost"
            className="flex-none h-8 w-8 rounded-xl border border-brand-accent/10 dark:border-white/10 text-brand-accent/40 dark:text-brand-cream/40 hover:text-brand-deep dark:hover:text-brand-cream hover:border-brand-accent/30 dark:hover:border-white/20 transition-all p-0"
            onClick={() => onAdvance(ticket.id, prev)}
            disabled={isPending}
          >
            <ArrowLeft className="h-3 w-3" />
          </Button>
        )}
        {next ? (
          <Button
            size="sm"
            className={cn(
              "flex-1 h-8 text-[11px] font-bold uppercase tracking-wider rounded-xl transition-all",
              next === "making" &&
              "bg-violet-500/10 hover:bg-violet-500/20 text-violet-700 dark:text-violet-300 border border-violet-500/20",
              next === "ready" &&
              "bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20",
              next === "served" &&
              "bg-brand-deep dark:bg-white/10 hover:bg-brand-deep/90 text-white hover:text-white dark:text-brand-cream border-transparent"
            )}
            variant="ghost"
            onClick={() => onAdvance(ticket.id, next)}
            disabled={isPending}
          >
            <span>{BAR_STATUS_CONFIG[next].label}</span>
            <ArrowRight className="h-3 w-3 ml-1.5" />
          </Button>
        ) : (
          <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-brand-accent/40 dark:text-brand-cream/30">
            <CheckCircle2 className="h-3 w-3" />
            Complete
          </div>
        )}
      </div>
    </div>
  )
})

const KitchenTicketCard = React.memo(function KitchenTicketCard({
  ticket,
  onAdvance,
  isPending,
}: {
  ticket: KitchenTicket
  onAdvance: (id: string, status: KitchenTicket["status"]) => void
  isPending: boolean
}) {
  const idx = KITCHEN_FLOW.indexOf(ticket.status)
  const prev = KITCHEN_FLOW[idx - 1]
  const next = KITCHEN_FLOW[idx + 1]

  return (
    <div
      className={cn(
        "rounded-3xl border p-3.5 space-y-2.5 transition-colors duration-200",
        getUrgencyClass(ticket.createdAt, ticket.status)
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm text-brand-deep dark:text-brand-cream truncate">{ticket.station}</p>
          <p className="text-[10px] text-brand-accent/50 dark:text-brand-cream/40 font-mono mt-0.5">
            #{ticket.saleId?.slice(0, 8) ?? "N/A"}
          </p>
        </div>
        <ElapsedBadge createdAt={ticket.createdAt} status={ticket.status} />
      </div>

      <div className="flex gap-1.5">
        {prev && (
          <Button
            size="sm"
            variant="ghost"
            className="flex-none h-8 w-8 rounded-xl border border-brand-accent/10 dark:border-white/10 text-brand-accent/40 dark:text-brand-cream/40 hover:text-brand-deep dark:hover:text-brand-cream hover:border-brand-accent/30 dark:hover:border-white/20 transition-all p-0"
            onClick={() => onAdvance(ticket.id, prev)}
            disabled={isPending}
            title={`Move back to ${STATUS_CONFIG[prev].label}`}
          >
            <ArrowLeft className="h-3 w-3" />
          </Button>
        )}
        {next ? (
          <Button
            size="sm"
            className={cn(
              "flex-1 h-8 text-[11px] font-bold uppercase tracking-wider rounded-xl transition-all",
              next === "preparing" &&
              "bg-blue-500/10 hover:bg-blue-500/20 text-blue-700 dark:text-blue-300 border border-blue-500/20",
              next === "ready" &&
              "bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20",
              next === "served" &&
              "bg-brand-deep dark:bg-white/10 hover:bg-brand-deep/90 text-white hover:text-white dark:text-brand-cream border-transparent"
            )}
            variant="ghost"
            onClick={() => onAdvance(ticket.id, next)}
            disabled={isPending}
          >
            <span>{STATUS_CONFIG[next].label}</span>
            <ArrowRight className="h-3 w-3 ml-1.5" />
          </Button>
        ) : (
          <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-brand-accent/40 dark:text-brand-cream/30">
            <CheckCircle2 className="h-3 w-3" />
            Complete
          </div>
        )}
      </div>
    </div>
  )
})

const TableSessionCard = React.memo(function TableSessionCard({
  session,
  onClose,
  isPending,
}: {
  session: TableSession
  onClose: (id: string) => void
  isPending: boolean
}) {
  const isOpen = session.status === "open"
  const openedMins = Math.floor((Date.now() - new Date(session.openedAt).getTime()) / 60000)

  return (
    <div
      className={cn(
        "rounded-3xl border p-4 flex flex-col gap-3 transition-colors duration-200",
        isOpen
          ? "bg-white dark:bg-white/5 border-brand-accent/10"
          : "bg-brand-accent/3 dark:bg-white/3 border-brand-accent/5 opacity-60"
      )}
    >
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "h-2 w-2 rounded-full",
                isOpen ? "bg-emerald-400 animate-pulse" : "bg-brand-accent/20"
              )}
            />
            <p className="font-bold text-lg text-brand-deep dark:text-brand-cream font-serif tracking-tight">
              {session.tableLabel}
            </p>
          </div>
          <div className="flex items-center gap-1.5 mt-1">
            <Users className="h-3 w-3 text-brand-accent/40 dark:text-brand-cream/40" />
            <span className="text-xs text-brand-accent/60 dark:text-brand-cream/50">
              {session.covers} {session.covers === 1 ? "cover" : "covers"}
            </span>
          </div>
        </div>
        <div
          className={cn(
            "text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-full",
            isOpen
              ? "bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400"
              : "bg-brand-accent/8 dark:bg-white/5 text-brand-accent/50 dark:text-brand-cream/40"
          )}
        >
          {isOpen ? "Open" : session.status}
        </div>
      </div>

      {isOpen && (
        <div className="flex items-center justify-between pt-1 border-t border-brand-accent/5 dark:border-white/5">
          <span className="text-[10px] text-brand-accent/40 dark:text-brand-cream/30 flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {openedMins < 60
              ? `${openedMins}m open`
              : `${Math.floor(openedMins / 60)}h ${openedMins % 60}m open`}
          </span>
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-[10px] font-bold uppercase tracking-wider rounded-xl px-3 hover:bg-rose-50 hover:border-rose-200 hover:text-rose-600 dark:hover:bg-rose-950/30 dark:hover:border-rose-900 dark:hover:text-rose-400 transition-all"
            onClick={() => onClose(session.id)}
            disabled={isPending}
          >
            Close
          </Button>
        </div>
      )}
    </div>
  )
})

const RegisteredTableCard = React.memo(function RegisteredTableCard({
  table,
  onToggle,
  onDelete,
  onEdit,
  isTogglePending,
  isDeletePending,
}: {
  table: RestaurantTable
  onToggle: (id: string, isActive: boolean) => void
  onDelete: (id: string) => void
  onEdit: (table: RestaurantTable) => void
  isTogglePending: boolean
  isDeletePending: boolean
}) {
  return (
    <div
      className={cn(
        "rounded-[20px] border p-3.5 flex items-center gap-3 transition-all",
        table.isActive
          ? "bg-white dark:bg-white/5 border-brand-accent/10"
          : "bg-brand-accent/3 dark:bg-white/3 border-brand-accent/5 opacity-60"
      )}
    >
      <div
        className={cn(
          "h-9 w-9 rounded-xl flex items-center justify-center shrink-0 font-black text-xs",
          table.isActive
            ? "bg-brand-deep/8 dark:bg-white/10 text-brand-deep dark:text-brand-cream"
            : "bg-brand-accent/5 dark:bg-white/5 text-brand-accent/40 dark:text-brand-cream/30"
        )}
      >
        {table.label.slice(0, 2).toUpperCase()}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm text-brand-deep dark:text-brand-cream truncate">{table.label}</p>
        <p className="text-[10px] text-brand-accent/50 dark:text-brand-cream/40">
          {table.capacity} seats · {table.isActive ? "active" : "inactive"}
        </p>
      </div>
      <div className="flex items-center gap-1.5 shrink-0">
        <Button
          size="sm"
          variant="ghost"
          className="h-8 w-8 rounded-xl p-0 hover:bg-brand-accent/5 dark:hover:bg-white/5"
          onClick={() => onEdit(table)}
          disabled={isTogglePending || isDeletePending}
          title="Edit table"
        >
          <PencilLine className="h-3.5 w-3.5 text-brand-accent/50 dark:text-brand-cream/50" />
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="h-8 w-8 rounded-xl p-0 hover:bg-brand-accent/5 dark:hover:bg-white/5"
          onClick={() => onToggle(table.id, !table.isActive)}
          disabled={isTogglePending}
          title={table.isActive ? "Disable table" : "Enable table"}
        >
          {table.isActive ? (
            <ToggleRight className="h-4 w-4 text-emerald-500" />
          ) : (
            <ToggleLeft className="h-4 w-4 text-brand-accent/30 dark:text-brand-cream/30" />
          )}
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="h-8 w-8 rounded-xl p-0 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-brand-accent/30 dark:text-brand-cream/30 hover:text-rose-500 dark:hover:text-rose-400 transition-all"
          onClick={() => onDelete(table.id)}
          disabled={isDeletePending}
          title="Remove table"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  )
})

const ArchivedTableCard = React.memo(function ArchivedTableCard({
  table,
  onRestore,
  onPermanentDelete,
  isRestorePending,
  isDeletePending,
}: {
  table: RestaurantTable
  onRestore: (id: string) => void
  onPermanentDelete: (id: string) => void
  isRestorePending: boolean
  isDeletePending: boolean
}) {
  const [confirming, setConfirming] = React.useState(false)

  return (
    <div className="rounded-2xl border p-3.5 bg-brand-accent/3 dark:bg-white/3 border-brand-accent/5 dark:border-white/5 opacity-80">
      <div className="flex items-center gap-3">
        <div className="h-9 w-9 rounded-xl flex items-center justify-center shrink-0 font-black text-xs bg-brand-accent/5 dark:bg-white/5 text-brand-accent/40 dark:text-brand-cream/30">
          {table.label.slice(0, 2).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm text-brand-deep dark:text-brand-cream truncate">{table.label}</p>
          <p className="text-[10px] text-brand-accent/50 dark:text-brand-cream/40">
            {table.capacity} seats · archived
          </p>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <Button
            size="sm"
            variant="ghost"
            className="h-8 w-8 rounded-xl p-0 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-brand-accent/30 dark:text-brand-cream/30 hover:text-rose-500 dark:hover:text-rose-400 transition-all"
            onClick={() => setConfirming(true)}
            disabled={isRestorePending || isDeletePending || confirming}
            title="Permanently delete table"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-8 w-8 rounded-xl p-0 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 text-brand-accent/30 dark:text-brand-cream/30 hover:text-emerald-600 dark:hover:text-emerald-400 transition-all"
            onClick={() => onRestore(table.id)}
            disabled={isRestorePending || isDeletePending || confirming}
            title="Restore table"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
      {confirming && (
        <div className="mt-3 pt-3 border-t border-rose-200/60 dark:border-rose-900/40 flex items-center justify-between gap-2">
          <p className="text-[11px] text-rose-600 dark:text-rose-400 font-medium">
            Permanently delete this table?
          </p>
          <div className="flex items-center gap-2 shrink-0">
            <Button
              size="sm"
              variant="ghost"
              className="h-7 rounded-lg px-3 text-[10px] font-bold uppercase tracking-wider text-brand-accent/50 dark:text-brand-cream/50 hover:bg-brand-accent/5"
              onClick={() => setConfirming(false)}
              disabled={isDeletePending}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-7 rounded-lg px-3 text-[10px] font-bold uppercase tracking-wider bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-950/50"
              onClick={() => onPermanentDelete(table.id)}
              disabled={isDeletePending}
            >
              {isDeletePending ? "Deleting…" : "Delete"}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
})

export function RestaurantLiveView({ mode = "all" }: { mode?: "all" | "tables" | "kitchen" | "bar" }) {
  const { intervalMs } = useRestaurantRefreshInterval()
  const refetchInterval: number | false = typeof intervalMs === "number" ? intervalMs : false
  const { data: tickets = [], isLoading: ticketsLoading } = useKitchenTickets({
    refetchInterval,
  })
  const { data: barTickets = [], isLoading: barTicketsLoading } = useBarTickets({
    refetchInterval,
  })
  const barAction = useBarTicketActions()
  const createBarTicket = useCreateBarTicket()
  const [barDrawer, setBarDrawer] = React.useState<{ open: boolean; ticket: BarTicket | null }>({ open: false, ticket: null })
  const [barLabel, setBarLabel] = React.useState("")
  const { data: activeSessions = [], isLoading: activeSessionsLoading } = useTableSessions({
    status: "open",
    refetchInterval,
  })
  const { data: closedSessions = [], isLoading: closedSessionsLoading } = useTableSessions({
    status: "closed",
    limit: 50,
    refetchInterval: false,
  })
  const [isHistoryOpen, setIsHistoryOpen] = React.useState(false)
  const { data: historySessions = [], isLoading: historyLoading } = useTableSessions({
    status: "closed",
    limit: 200,
    enabled: isHistoryOpen,
    refetchInterval: false,
  })
  const { data: activeTables = [], isLoading: activeTablesLoading } = useRestaurantTables("active")
  const { data: archivedTables = [], isLoading: archivedTablesLoading } =
    useRestaurantTables("archived")
  const kitchenAction = useKitchenTicketActions()
  const tableAction = useTableSessionActions()
  const tableCrud = useRestaurantTableActions()
  const [newTableLabel, setNewTableLabel] = React.useState("")
  const [newTableCapacity, setNewTableCapacity] = React.useState(4)
  const [editingTable, setEditingTable] = React.useState<RestaurantTable | null>(null)
  const [editLabel, setEditLabel] = React.useState("")
  const [editCapacity, setEditCapacity] = React.useState(4)
  const [tableTab, setTableTab] = React.useState("active")
  const [sessionTab, setSessionTab] = React.useState<"active" | "closed">("active")
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const handleCreateTable = async () => {
    const label = newTableLabel.trim()
    if (!label) {
      toast.error("Table label is required")
      return
    }
    try {
      await tableCrud.createTable.mutateAsync({
        label,
        capacity: Math.max(1, Number(newTableCapacity || 1)),
      })
      setNewTableLabel("")
      setNewTableCapacity(4)
      toast.success("Table added to floor")
    } catch (err: unknown) {
      const rawMessage = err instanceof Error ? err.message : "Failed to create table"
      const message =
        rawMessage.toLowerCase().includes("already exists") ||
          rawMessage.toLowerCase().includes("duplicate key")
          ? "A table with this label already exists. Check Archived to restore it."
          : rawMessage
      toast.error(message)
    }
  }

  const openEditTable = React.useCallback((table: RestaurantTable) => {
    setEditingTable(table)
    setEditLabel(table.label)
    setEditCapacity(table.capacity || 1)
  }, [])

  const closeEditTable = () => {
    setEditingTable(null)
    setEditLabel("")
    setEditCapacity(4)
  }

  const handleUpdateTable = async () => {
    if (!editingTable) return
    const label = editLabel.trim()
    if (!label) {
      toast.error("Table label is required")
      return
    }
    try {
      await tableCrud.updateTable.mutateAsync({
        id: editingTable.id,
        label,
        capacity: Math.max(1, Number(editCapacity || 1)),
      })
      toast.success("Table updated")
      closeEditTable()
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to update table"
      toast.error(message)
    }
  }

  const handleAdvanceTicket = React.useCallback(
    (id: string, status: KitchenTicket["status"]) => kitchenAction.mutate({ id, status }),
    [kitchenAction]
  )
  const handleCloseSession = React.useCallback(
    (id: string) => tableAction.mutate(id),
    [tableAction]
  )
  const handleToggleTable = React.useCallback(
    (id: string, isActive: boolean) => tableCrud.updateTable.mutate({ id, isActive }),
    [tableCrud.updateTable]
  )
  const handleDeleteTable = React.useCallback(
    (id: string) => tableCrud.deleteTable.mutate(id),
    [tableCrud.deleteTable]
  )
  const handleRestoreTable = React.useCallback(
    (id: string) => tableCrud.restoreTable.mutate(id),
    [tableCrud.restoreTable]
  )
  const handlePermanentDeleteTable = React.useCallback(
    (id: string) => tableCrud.permanentDeleteTable.mutate(id),
    [tableCrud.permanentDeleteTable]
  )

  const counts = React.useMemo(() => ({
    openTables: activeSessions.length,
    queuedTickets: tickets.filter((t) => t.status === "queued").length,
    preparingTickets: tickets.filter((t) => t.status === "preparing").length,
    readyTickets: tickets.filter((t) => t.status === "ready").length,
  }), [activeSessions, tickets])

  const currentTables = tableTab === "archived" ? archivedTables : activeTables
  const tablesLoading = tableTab === "archived" ? archivedTablesLoading : activeTablesLoading
  const visibleSessions = sessionTab === "active" ? activeSessions : closedSessions
  const sessionsPanelLoading = sessionTab === "active" ? activeSessionsLoading : closedSessionsLoading

  React.useEffect(() => {
    const tabParam = searchParams.get("tables")
    if (tabParam && ["active", "archived"].includes(tabParam) && tabParam !== tableTab) {
      setTableTab(tabParam)
    }
  }, [searchParams, tableTab])

  const handleTableTabChange = (next: "active" | "archived") => {
    if (next === tableTab) return
    setTableTab(next)
    const params = new URLSearchParams(searchParams.toString())
    params.set("tables", next)
    router.replace(`${pathname}?${params.toString()}`, { scroll: false })
  }

  React.useEffect(() => {
    const tabParam = searchParams.get("sessions")
    if (tabParam && ["active", "closed"].includes(tabParam) && tabParam !== sessionTab) {
      setSessionTab(tabParam as "active" | "closed")
    }
  }, [searchParams, sessionTab])

  const handleSessionTabChange = (next: "active" | "closed") => {
    if (next === sessionTab) return
    setSessionTab(next)
    const params = new URLSearchParams(searchParams.toString())
    params.set("sessions", next)
    router.replace(`${pathname}?${params.toString()}`, { scroll: false })
  }

  const { isZenMode, toggleZenMode } = React.useContext(ZenModeContext)

  React.useEffect(() => {
    if (!isZenMode) return
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") toggleZenMode() }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [isZenMode, toggleZenMode])

  const showTables = mode === "all" || mode === "tables"
  const showKitchen = mode === "all" || mode === "kitchen"
  const showBar = mode === "bar"

  const handleAdvanceBarTicket = async (id: string, status: BarTicket["status"]) => {
    try {
      await barAction.advance.mutateAsync({ id, status })
    } catch {
      toast.error("Failed to update bar ticket")
    }
  }

  const openBarDrawer = (ticket: BarTicket | null) => {
    setBarLabel(ticket ? ticket.station : "")
    setBarDrawer({ open: true, ticket })
  }

  const closeBarDrawer = () => setBarDrawer({ open: false, ticket: null })

  const handleBarDrawerSave = async () => {
    const label = barLabel.trim()
    if (!label) return
    try {
      if (barDrawer.ticket) {
        await barAction.updateLabel.mutateAsync({ id: barDrawer.ticket.id, label })
      } else {
        await createBarTicket.mutateAsync({ label })
      }
      closeBarDrawer()
    } catch {
      toast.error("Failed to save bar order")
    }
  }

  const handleBarTicketDelete = async (id: string) => {
    try {
      await barAction.remove.mutateAsync(id)
    } catch {
      toast.error("Failed to delete bar ticket")
    }
  }

  return (
    <div className="space-y-4 pb-28 md:pb-4">
      <Drawer open={!!editingTable} onOpenChange={(open) => !open && closeEditTable()}>
        <DrawerContent className="max-w-xl">
          <DrawerStickyHeader className="pb-5">
            <DrawerTitle>Edit table</DrawerTitle>
            <DrawerDescription>Update the label or seat count for this table.</DrawerDescription>
          </DrawerStickyHeader>
          <DrawerBody className="space-y-4 pt-4">
            <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-3 items-end">
              <div className="space-y-2">
                <label className="text-[11px] font-bold uppercase tracking-widest text-brand-accent/50 dark:text-brand-cream/50">
                  Label
                </label>
                <Input
                  value={editLabel}
                  onChange={(e) => setEditLabel(e.target.value)}
                  placeholder="Table label"
                  className="rounded-xl h-12"
                  disabled={tableCrud.updateTable.isPending}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[11px] font-bold uppercase tracking-widest text-brand-accent/50 dark:text-brand-cream/50">
                  Seats
                </label>
                <CapacityStepper
                  value={editCapacity}
                  onChange={setEditCapacity}
                  disabled={tableCrud.updateTable.isPending}
                  className="w-[140px] h-12"
                />
              </div>
            </div>
          </DrawerBody>
          <DrawerFooter className="gap-2 sm:flex-row sm:items-center">
            <Button
              variant="ghost"
              onClick={closeEditTable}
              disabled={tableCrud.updateTable.isPending}
              className="w-full sm:w-auto sm:flex-1 h-12 rounded-2xl"
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpdateTable}
              disabled={tableCrud.updateTable.isPending}
              className="w-full sm:w-auto sm:flex-1 h-12 rounded-2xl"
            >
              {tableCrud.updateTable.isPending ? "Saving…" : "Save changes"}
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

      <Drawer open={isHistoryOpen} onOpenChange={setIsHistoryOpen}>
        <DrawerContent className="max-w-3xl">
          <DrawerStickyHeader className="pb-5">
            <DrawerTitle>Session history</DrawerTitle>
            <DrawerDescription>Most recent closed sessions (up to 200).</DrawerDescription>
          </DrawerStickyHeader>
          <DrawerBody className="pt-4">
            {historyLoading ? (
              <div className="space-y-2">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="h-20 rounded-2xl bg-brand-accent/5 dark:bg-white/5 animate-pulse"
                  />
                ))}
              </div>
            ) : historySessions.length === 0 ? (
              <div className="py-10 flex flex-col items-center text-center">
                <Armchair className="h-8 w-8 text-brand-accent/20 dark:text-brand-cream/20 mb-2" />
                <p className="text-sm text-brand-accent/50 dark:text-brand-cream/40">
                  No closed sessions yet
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {historySessions.map((session) => (
                  <TableSessionCard
                    key={session.id}
                    session={session}
                    onClose={() => { }}
                    isPending={false}
                  />
                ))}
              </div>
            )}
          </DrawerBody>
        </DrawerContent>
      </Drawer>
      {/* Metrics */}
      <div className="flex items-center justify-between gap-3">
        <p className="text-[9px] uppercase tracking-[0.2em] font-black text-brand-accent/40 dark:text-brand-cream/40 hidden md:block">
          Live overview
        </p>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={toggleZenMode}
          title={isZenMode ? "Exit zen mode (Esc)" : "Enter zen mode"}
          className="ml-auto h-8 w-8 rounded-xl p-0 text-brand-accent/40 dark:text-brand-cream/40 hover:text-brand-deep dark:hover:text-brand-cream hover:bg-brand-accent/8 dark:hover:bg-white/8 transition-all hidden md:flex items-center justify-center"
        >
          {isZenMode ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
        </Button>
      </div>
      <div className="flex md:grid md:grid-cols-4 gap-3 overflow-x-auto md:overflow-visible no-scrollbar pb-1">
        {[
          {
            label: "Open Tables",
            value: counts.openTables,
            helper: "active sessions",
            icon: Armchair,
            accent: "text-brand-gold",
            bg: "bg-brand-gold/8",
          },
          {
            label: "In Queue",
            value: counts.queuedTickets,
            helper: "awaiting kitchen",
            icon: UtensilsCrossed,
            accent: "text-amber-600 dark:text-amber-400",
            bg: "bg-amber-500/8",
          },
          {
            label: "Preparing",
            value: counts.preparingTickets,
            helper: "in the kitchen",
            icon: ChefHat,
            accent: "text-blue-600 dark:text-blue-400",
            bg: "bg-blue-500/8",
          },
          {
            label: "Ready",
            value: counts.readyTickets,
            helper: "ready to serve",
            icon: Zap,
            accent: "text-emerald-600 dark:text-emerald-400",
            bg: "bg-emerald-500/8",
          },
        ].map((metric) => {
          const Icon = metric.icon
          return (
            <GlassCard
              key={metric.label}
              className="p-1 rounded-[1.6rem] border-brand-accent/10 min-w-[250px] md:min-w-0 overflow-none"
            >
              <div className="rounded-[1.2rem] bg-white/80 dark:bg-transparent p-4">
                <div className="flex items-start justify-between mb-2">
                  <p className="text-[9px] uppercase tracking-[0.2em] font-black text-brand-accent/50 dark:text-brand-cream/50">
                    {metric.label}
                  </p>
                  <div className={cn("h-7 w-7 rounded-xl flex items-center justify-center", metric.bg)}>
                    <Icon className={cn("h-3.5 w-3.5", metric.accent)} />
                  </div>
                </div>
                <p className="text-3xl font-serif text-brand-deep dark:text-brand-cream tabular-nums leading-none">
                  {metric.value}
                </p>
                <p className="text-[10px] text-brand-accent/40 dark:text-brand-cream/40 mt-1.5">{metric.helper}</p>
              </div>
            </GlassCard>
          )
        })}
      </div>

      {/* Tables Section */}
      {showTables && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {/* Active Sessions */}
          <GlassCard className="p-4 rounded-[1.8rem] flex flex-col h-[520px] min-h-0">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-serif text-lg text-brand-deep dark:text-brand-cream tracking-tight">
                  Floor Sessions
                </h3>
                <p className="text-[10px] uppercase tracking-[0.18em] font-black text-brand-accent/40 dark:text-brand-cream/40 mt-0.5">
                  {counts.openTables} active · live
                </p>
              </div>
              <div className="flex items-center gap-1.5 bg-emerald-100/60 dark:bg-emerald-950/30 px-2.5 py-1 rounded-full">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[9px] font-black uppercase tracking-widest text-emerald-700 dark:text-emerald-400">
                  Live
                </span>
              </div>
            </div>

            <div className="mb-3 flex items-center justify-between gap-3">
              <div className="inline-flex items-center gap-1.5 rounded-2xl bg-brand-deep/5 dark:bg-white/5 p-1.5">
                {[
                  { id: "active" as const, label: "Active", count: activeSessions.length },
                  { id: "closed" as const, label: "Closed", count: closedSessions.length },
                ].map((tab) => {
                  const isActive = sessionTab === tab.id
                  return (
                    <Button
                      key={tab.id}
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSessionTabChange(tab.id)}
                      className={cn(
                        "relative inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition-all h-9",
                        isActive
                          ? "bg-white dark:bg-white/10 text-brand-deep dark:text-brand-gold shadow-sm"
                          : "text-brand-deep/60 dark:text-brand-cream/60 hover:bg-white/50 dark:hover:bg-white/5"
                      )}
                    >
                      <span>{tab.label}</span>
                      <span
                        className={cn(
                          "inline-flex items-center justify-center rounded-full px-2 py-0.5 text-[10px] font-bold",
                          isActive
                            ? "bg-brand-deep/5 text-brand-deep dark:bg-white/10 dark:text-brand-gold"
                            : "bg-brand-deep/10 text-brand-deep/70 dark:bg-white/10 dark:text-brand-cream/70"
                        )}
                      >
                        {tab.count}
                      </span>
                    </Button>
                  )
                })}
              </div>
              {sessionTab === "closed" && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-xs rounded-full px-3"
                  onClick={() => setIsHistoryOpen(true)}
                >
                  View history
                  <ChevronRight className="ml-1 h-3.5 w-3.5" />
                </Button>
              )}
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto pr-1">
              {sessionsPanelLoading ? (
                <div className="space-y-2">
                  {[1, 2].map((i) => (
                    <div
                      key={i}
                      className="h-20 rounded-2xl bg-brand-accent/5 dark:bg-white/5 animate-pulse"
                    />
                  ))}
                </div>
              ) : visibleSessions.length === 0 ? (
                <div className="py-10 flex flex-col items-center text-center">
                  <Armchair className="h-8 w-8 text-brand-accent/20 dark:text-brand-cream/20 mb-2" />
                  <p className="text-sm text-brand-accent/50 dark:text-brand-cream/40">
                    {sessionTab === "active" ? "No active sessions" : "No closed sessions"}
                  </p>
                  <p className="text-xs text-brand-accent/30 dark:text-brand-cream/30 mt-0.5">
                    {sessionTab === "active"
                      ? "Sessions open when a dine-in sale is recorded"
                      : "Closed sessions will appear here"}
                  </p>
                </div>
              ) : (
                <>
                  {sessionTab === "closed" && (
                    <p className="text-[10px] uppercase tracking-[0.18em] font-black text-brand-accent/40 dark:text-brand-cream/40 mb-2">
                      Recent closed sessions
                    </p>
                  )}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {visibleSessions.map((session) => (
                      <TableSessionCard
                        key={session.id}
                        session={session}
                        onClose={handleCloseSession}
                        isPending={tableAction.isPending}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
          </GlassCard>

          {/* Registered Tables */}
          <GlassCard className="p-4 rounded-[1.8rem] flex flex-col h-[520px] min-h-0">
            <div className="mb-4">
              <h3 className="font-serif text-lg text-brand-deep dark:text-brand-cream tracking-tight">
                Table Register
              </h3>
              <p className="text-[10px] uppercase tracking-[0.18em] font-black text-brand-accent/40 dark:text-brand-cream/40 mt-0.5">
                {activeTables.filter((t) => t.isActive).length} of {activeTables.length} active
              </p>
            </div>

            {/* Add Table Form */}
            {tableTab === "active" ? (
              <div className="flex gap-2 mb-4 p-3 rounded-2xl bg-brand-accent/3 dark:bg-white/3 border border-brand-accent/8 dark:border-white/5">
                <Input
                  value={newTableLabel}
                  onChange={(e) => setNewTableLabel(e.target.value)}
                  placeholder="Label (e.g. T12)"
                  aria-label="Table label"
                  name="tableLabel"
                  autoComplete="off"
                  className="flex-1 h-10 text-sm bg-white dark:bg-white/5 rounded-xl"
                  onKeyDown={(e) => e.key === "Enter" && void handleCreateTable()}
                />
                <CapacityStepper value={newTableCapacity} onChange={setNewTableCapacity} className="h-10" />
                <Button
                  onClick={() => void handleCreateTable()}
                  disabled={tableCrud.createTable.isPending || !newTableLabel.trim()}
                  size="sm"
                  className="h-10 px-4 rounded-xl text-xs font-bold"
                >
                  {tableCrud.createTable.isPending ? (
                    <Circle className="h-3 w-3 animate-spin" />
                  ) : (
                    <Plus className="h-3.5 w-3.5" />
                  )}
                  <span className="ml-1.5">{tableCrud.createTable.isPending ? "Adding…" : "Add"}</span>
                </Button>
              </div>
            ) : (
              <div className="mb-4 rounded-2xl border border-brand-accent/8 dark:border-white/5 bg-brand-accent/3 dark:bg-white/3 px-4 py-3 text-xs text-brand-accent/60 dark:text-brand-cream/60">
                Archived tables are hidden from sale mode. Restore one to make it available again.
              </div>
            )}

            <div className="mb-4">
              <div className="inline-flex items-center gap-1.5 rounded-2xl bg-brand-deep/5 dark:bg-white/5 p-1.5">
                {[
                  {
                    id: "active" as const,
                    label: "Active",
                    count: activeTables.length,
                    icon: TableProperties,
                  },
                  {
                    id: "archived" as const,
                    label: "Archived",
                    count: archivedTables.length,
                    icon: Archive,
                  },
                ].map((tab) => {
                  const Icon = tab.icon
                  const isActive = tableTab === tab.id
                  return (
                    <Button
                      key={tab.id}
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleTableTabChange(tab.id)}
                      className={cn(
                        "relative inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition-all h-9",
                        isActive
                          ? "bg-white hover:bg-white/80 dark:hover:bg-white/20 dark:bg-white/10 text-brand-deep dark:text-brand-gold shadow-sm"
                          : "text-brand-deep/60 dark:text-brand-cream/60 hover:bg-white/50 dark:hover:bg-white/5"
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      <span>{tab.label}</span>
                      <span
                        className={cn(
                          "inline-flex items-center justify-center rounded-full px-2 py-0.5 text-[10px] font-bold",
                          isActive
                            ? "bg-brand-deep/5 text-brand-deep dark:bg-white/10 dark:text-brand-gold"
                            : "bg-brand-deep/10 text-brand-deep/70 dark:bg-white/10 dark:text-brand-cream/70"
                        )}
                      >
                        {tab.count}
                      </span>
                    </Button>
                  )
                })}
              </div>
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto pr-1">
              {tablesLoading ? (
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="h-14 rounded-2xl bg-brand-accent/5 dark:bg-white/5 animate-pulse"
                    />
                  ))}
                </div>
              ) : currentTables.length === 0 ? (
                <div className="py-8 flex flex-col items-center text-center">
                  <TableProperties className="h-8 w-8 text-brand-accent/20 dark:text-brand-cream/20 mb-2" />
                  <p className="text-sm text-brand-accent/50 dark:text-brand-cream/40">
                    {tableTab === "archived" ? "No archived tables" : "No tables registered yet"}
                  </p>
                  <p className="text-xs text-brand-accent/30 dark:text-brand-cream/30 mt-0.5">
                    {tableTab === "archived"
                      ? "Archived tables appear here for easy restoration."
                      : "Add tables to use the dine-in selector in sale mode"}
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {tableTab === "archived"
                    ? currentTables.map((table) => (
                      <ArchivedTableCard
                        key={table.id}
                        table={table}
                        onRestore={handleRestoreTable}
                        onPermanentDelete={handlePermanentDeleteTable}
                        isRestorePending={tableCrud.restoreTable.isPending}
                        isDeletePending={tableCrud.permanentDeleteTable.isPending}
                      />
                    ))
                    : currentTables.map((table) => (
                      <RegisteredTableCard
                        key={table.id}
                        table={table}
                        onToggle={handleToggleTable}
                        onDelete={handleDeleteTable}
                        onEdit={openEditTable}
                        isTogglePending={tableCrud.updateTable.isPending}
                        isDeletePending={tableCrud.deleteTable.isPending}
                      />
                    ))}
                </div>
              )}
            </div>
          </GlassCard>
        </div>
      )}

      {/* Kitchen Board */}
      {showKitchen && (
        <GlassCard className="p-4 rounded-[1.8rem]">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-serif text-lg text-brand-deep dark:text-brand-cream tracking-tight">
                Kitchen Board
              </h3>
              <p className="text-[10px] uppercase tracking-[0.18em] font-black text-brand-accent/40 dark:text-brand-cream/40 mt-0.5">
                {tickets.filter((t) => t.status !== "served").length} active tickets · auto-refreshes
              </p>
            </div>
            <div className="flex items-center gap-1.5 bg-blue-100/60 dark:bg-blue-950/30 px-2.5 py-1 rounded-full">
              <ChefHat className="h-3 w-3 text-blue-600 dark:text-blue-400" />
              <span className="text-[9px] font-black uppercase tracking-widest text-blue-700 dark:text-blue-400">
                Kitchen
              </span>
            </div>
          </div>

          {ticketsLoading ? (
            <div className="flex md:grid md:grid-cols-4 gap-3 overflow-x-auto md:overflow-visible no-scrollbar">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-32 rounded-2xl bg-brand-accent/5 dark:bg-white/5 animate-pulse shrink-0 w-[70vw] md:w-auto" />
              ))}
            </div>
          ) : tickets.length === 0 ? (
            <div className="py-12 flex flex-col items-center text-center">
              <UtensilsCrossed className="h-10 w-10 text-brand-accent/15 dark:text-brand-cream/15 mb-3" />
              <p className="text-base font-serif text-brand-deep dark:text-brand-cream">All clear</p>
              <p className="text-xs text-brand-accent/40 dark:text-brand-cream/30 mt-1">
                No kitchen tickets yet. They appear here when items are sent to the kitchen.
              </p>
            </div>
          ) : (
            <div className="flex md:grid md:grid-cols-4 gap-3 overflow-x-auto md:overflow-visible no-scrollbar pb-2 md:pb-0">
              {KITCHEN_FLOW.map((column) => {
                const cfg = STATUS_CONFIG[column]
                const columnTickets = tickets.filter((t) => t.status === column)
                const Icon = cfg.icon

                return (
                  <div
                    key={column}
                    className={cn(
                      "rounded-3xl border p-3 space-y-2 shrink-0 w-[72vw] md:w-auto",
                      cfg.bg,
                      cfg.border
                    )}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className={cn("flex items-center gap-1.5", cfg.color)}>
                        <Icon className="h-3.5 w-3.5" />
                        <span className="text-[10px] font-black uppercase tracking-widest">
                          {cfg.label}
                        </span>
                      </div>
                      {columnTickets.length > 0 && (
                        <span
                          className={cn(
                            "text-[9px] font-black w-5 h-5 rounded-full flex items-center justify-center",
                            cfg.color,
                            "bg-white/60 dark:bg-black/20"
                          )}
                        >
                          {columnTickets.length}
                        </span>
                      )}
                    </div>

                    <AnimatePresence>
                      {columnTickets.length === 0 ? (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="py-4 text-center"
                        >
                          <p className={cn("text-[10px] font-medium opacity-40", cfg.color)}>Empty</p>
                        </motion.div>
                      ) : (
                        columnTickets.map((ticket) => (
                          <KitchenTicketCard
                            key={ticket.id}
                            ticket={ticket}
                            onAdvance={handleAdvanceTicket}
                            isPending={kitchenAction.isPending}
                          />
                        ))
                      )}
                    </AnimatePresence>
                  </div>
                )
              })}
            </div>
          )}
        </GlassCard>
      )}

      {/* Bar Board */}
      {showBar && (
        <>
          <Drawer open={barDrawer.open} onOpenChange={(open) => !open && closeBarDrawer()}>
            <DrawerContent className="max-w-md">
              <DrawerStickyHeader>
                <DrawerTitle>{barDrawer.ticket ? "Edit order" : "New bar order"}</DrawerTitle>
              </DrawerStickyHeader>
              <DrawerBody className="space-y-4 pt-4">
                <div className="space-y-2">
                  <label className="text-[11px] font-bold uppercase tracking-widest text-brand-accent/50 dark:text-brand-cream/50">
                    Order description
                  </label>
                  <Input
                    placeholder="e.g. T4 · 2× Mojito, 1× Beer"
                    value={barLabel}
                    onChange={(e) => setBarLabel(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleBarDrawerSave()}
                    autoFocus
                  />
                  <p className="text-[11px] text-brand-accent/40 dark:text-brand-cream/40">
                    Include table and drink details so the bartender knows what to make.
                  </p>
                </div>
              </DrawerBody>
              <div className="p-4 border-t border-brand-deep/5 dark:border-white/5 flex gap-2">
                <Button
                  variant="ghost"
                  className="flex-1 h-12 rounded-2xl"
                  onClick={closeBarDrawer}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1 h-12 rounded-2xl bg-brand-deep text-brand-gold dark:bg-brand-gold dark:text-brand-deep font-bold"
                  onClick={handleBarDrawerSave}
                  disabled={!barLabel.trim() || createBarTicket.isPending || barAction.updateLabel.isPending}
                >
                  {barDrawer.ticket ? "Save" : "Add order"}
                </Button>
              </div>
            </DrawerContent>
          </Drawer>

          <GlassCard className="p-4 rounded-[1.8rem]">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-serif text-lg text-brand-deep dark:text-brand-cream tracking-tight">
                  Bar Board
                </h3>
                <p className="text-[10px] uppercase tracking-[0.18em] font-black text-brand-accent/40 dark:text-brand-cream/40 mt-0.5">
                  {barTickets.filter((t) => t.status !== "served").length} active · auto-refreshes
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  onClick={() => openBarDrawer(null)}
                  className="flex items-center gap-1.5 h-8 px-3 rounded-full bg-violet-500/10 hover:bg-violet-500/20 text-violet-700 dark:text-violet-300 text-[11px] font-bold uppercase tracking-wider"
                >
                  <Plus className="h-3 w-3" />
                  New order
                </Button>
                <div className="flex items-center gap-1.5 bg-violet-100/60 dark:bg-violet-950/30 px-2.5 py-1 rounded-full">
                  <GlassWater className="h-3 w-3 text-violet-600 dark:text-violet-400" />
                  <span className="text-[9px] font-black uppercase tracking-widest text-violet-700 dark:text-violet-400">
                    Bar
                  </span>
                </div>
              </div>
            </div>

            {barTicketsLoading ? (
              <div className="flex md:grid md:grid-cols-4 gap-3 overflow-x-auto md:overflow-visible no-scrollbar">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-32 rounded-2xl bg-brand-accent/5 dark:bg-white/5 animate-pulse shrink-0 w-[70vw] md:w-auto" />
                ))}
              </div>
            ) : barTickets.length === 0 ? (
              <div className="py-12 flex flex-col items-center text-center">
                <GlassWater className="h-10 w-10 text-brand-accent/15 dark:text-brand-cream/15 mb-3" />
                <p className="text-base font-serif text-brand-deep dark:text-brand-cream">All clear</p>
                <p className="text-xs text-brand-accent/40 dark:text-brand-cream/30 mt-1">
                  No bar orders yet. Tap "New order" to add one.
                </p>
              </div>
            ) : (
              <div className="flex md:grid md:grid-cols-4 gap-3 overflow-x-auto md:overflow-visible no-scrollbar pb-2 md:pb-0">
                {BAR_FLOW.map((column) => {
                  const cfg = BAR_STATUS_CONFIG[column]
                  const columnTickets = barTickets.filter((t) => t.status === column)
                  const Icon = cfg.icon

                  return (
                    <div
                      key={column}
                      className={cn(
                        "rounded-2xl border p-3 space-y-2 shrink-0 w-[72vw] md:w-auto",
                        cfg.bg,
                        cfg.border
                      )}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <div className={cn("flex items-center gap-1.5", cfg.color)}>
                          <Icon className="h-3.5 w-3.5" />
                          <span className="text-[10px] font-black uppercase tracking-widest">
                            {cfg.label}
                          </span>
                        </div>
                        {columnTickets.length > 0 && (
                          <span
                            className={cn(
                              "text-[9px] font-black w-5 h-5 rounded-full flex items-center justify-center",
                              cfg.color,
                              "bg-white/60 dark:bg-black/20"
                            )}
                          >
                            {columnTickets.length}
                          </span>
                        )}
                      </div>

                      <AnimatePresence>
                        {columnTickets.length === 0 ? (
                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="py-4 text-center"
                          >
                            <p className={cn("text-[10px] font-medium opacity-40", cfg.color)}>Empty</p>
                          </motion.div>
                        ) : (
                          columnTickets.map((ticket) => (
                            <BarTicketCard
                              key={ticket.id}
                              ticket={ticket}
                              onAdvance={handleAdvanceBarTicket}
                              onEdit={openBarDrawer}
                              onDelete={handleBarTicketDelete}
                              isPending={barAction.advance.isPending}
                            />
                          ))
                        )}
                      </AnimatePresence>
                    </div>
                  )
                })}
              </div>
            )}
          </GlassCard>
        </>
      )}
    </div>
  )
}
