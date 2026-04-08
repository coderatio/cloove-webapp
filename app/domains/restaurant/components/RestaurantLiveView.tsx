"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/app/components/ui/button"
import { GlassCard } from "@/app/components/ui/glass-card"
import { Input } from "@/app/components/ui/input"
import { toast } from "sonner"
import {
  useKitchenTickets,
  useKitchenTicketActions,
  useRestaurantTableActions,
  useRestaurantTables,
  useTableSessions,
  useTableSessionActions,
  type KitchenTicket,
  type TableSession,
  type RestaurantTable,
} from "../hooks/useRestaurantOps"
import { cn } from "@/app/lib/utils"
import {
  UtensilsCrossed,
  ChefHat,
  Armchair,
  CheckCircle2,
  Clock,
  Users,
  Plus,
  Minus,
  Circle,
  ArrowRight,
  Zap,
  TableProperties,
  ToggleLeft,
  ToggleRight,
  Trash2,
} from "lucide-react"

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

function formatElapsed(isoString: string): string {
  const diff = Math.floor((Date.now() - new Date(isoString).getTime()) / 1000)
  if (diff < 60) return `${diff}s`
  if (diff < 3600) return `${Math.floor(diff / 60)}m`
  return `${Math.floor(diff / 3600)}h ${Math.floor((diff % 3600) / 60)}m`
}

function getUrgencyClass(isoString: string, status: KitchenTicket["status"]): string {
  if (status === "served") return ""
  const mins = (Date.now() - new Date(isoString).getTime()) / 60000
  if (mins > 30) return "ring-1 ring-rose-400/40 bg-rose-50/50 dark:bg-rose-950/20"
  if (mins > 15) return "ring-1 ring-amber-400/30"
  return ""
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

function KitchenTicketCard({
  ticket,
  onAdvance,
  isPending,
}: {
  ticket: KitchenTicket
  onAdvance: (id: string, status: KitchenTicket["status"]) => void
  isPending: boolean
}) {
  const next = KITCHEN_FLOW[KITCHEN_FLOW.indexOf(ticket.status) + 1]

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      className={cn(
        "rounded-2xl border bg-white dark:bg-white/5 p-3.5 space-y-2.5 transition-all",
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

      {next ? (
        <Button
          size="sm"
          className={cn(
            "w-full h-8 text-[11px] font-bold uppercase tracking-wider rounded-xl transition-all",
            next === "preparing" &&
              "bg-blue-500/10 hover:bg-blue-500/20 text-blue-700 dark:text-blue-300 border border-blue-500/20",
            next === "ready" &&
              "bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20",
            next === "served" &&
              "bg-brand-deep dark:bg-white/10 hover:bg-brand-deep/90 text-white dark:text-brand-cream border-transparent"
          )}
          variant="ghost"
          onClick={() => onAdvance(ticket.id, next)}
          disabled={isPending}
        >
          <ArrowRight className="h-3 w-3 mr-1.5" />
          {STATUS_CONFIG[next].label}
        </Button>
      ) : (
        <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-brand-accent/40 dark:text-brand-cream/30">
          <CheckCircle2 className="h-3 w-3" />
          Complete
        </div>
      )}
    </motion.div>
  )
}

function TableSessionCard({
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
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={cn(
        "rounded-2xl border p-4 flex flex-col gap-3 transition-all",
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
    </motion.div>
  )
}

function RegisteredTableCard({
  table,
  onToggle,
  onDelete,
  isTogglePending,
  isDeletePending,
}: {
  table: RestaurantTable
  onToggle: (id: string, isActive: boolean) => void
  onDelete: (id: string) => void
  isTogglePending: boolean
  isDeletePending: boolean
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border p-3.5 flex items-center gap-3 transition-all",
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
}

export function RestaurantLiveView({ mode = "all" }: { mode?: "all" | "tables" | "kitchen" }) {
  const { data: tickets = [], isLoading: ticketsLoading } = useKitchenTickets()
  const { data: sessions = [], isLoading: sessionsLoading } = useTableSessions()
  const { data: restaurantTables = [], isLoading: restaurantTablesLoading } = useRestaurantTables()
  const kitchenAction = useKitchenTicketActions()
  const tableAction = useTableSessionActions()
  const tableCrud = useRestaurantTableActions()
  const [newTableLabel, setNewTableLabel] = React.useState("")
  const [newTableCapacity, setNewTableCapacity] = React.useState(4)

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
      const message = err instanceof Error ? err.message : "Failed to create table"
      toast.error(message)
    }
  }

  const counts = {
    openTables: sessions.filter((t) => t.status === "open").length,
    queuedTickets: tickets.filter((t) => t.status === "queued").length,
    readyTickets: tickets.filter((t) => t.status === "ready").length,
  }

  const showTables = mode === "all" || mode === "tables"
  const showKitchen = mode === "all" || mode === "kitchen"

  return (
    <div className="space-y-4">
      {/* Metrics */}
      <div className="grid grid-cols-3 gap-3">
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
            <GlassCard key={metric.label} className="p-1 rounded-[1.6rem] border-brand-accent/10">
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
          <GlassCard className="p-4 rounded-[1.8rem]">
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

            {sessionsLoading ? (
              <div className="space-y-2">
                {[1, 2].map((i) => (
                  <div key={i} className="h-20 rounded-2xl bg-brand-accent/5 dark:bg-white/5 animate-pulse" />
                ))}
              </div>
            ) : sessions.length === 0 ? (
              <div className="py-10 flex flex-col items-center text-center">
                <Armchair className="h-8 w-8 text-brand-accent/20 dark:text-brand-cream/20 mb-2" />
                <p className="text-sm text-brand-accent/50 dark:text-brand-cream/40">No active sessions</p>
                <p className="text-xs text-brand-accent/30 dark:text-brand-cream/30 mt-0.5">
                  Sessions open when a dine-in sale is recorded
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <AnimatePresence>
                  {sessions.map((session) => (
                    <TableSessionCard
                      key={session.id}
                      session={session}
                      onClose={(id) => tableAction.mutate(id)}
                      isPending={tableAction.isPending}
                    />
                  ))}
                </AnimatePresence>
              </div>
            )}
          </GlassCard>

          {/* Registered Tables */}
          <GlassCard className="p-4 rounded-[1.8rem]">
            <div className="mb-4">
              <h3 className="font-serif text-lg text-brand-deep dark:text-brand-cream tracking-tight">
                Table Register
              </h3>
              <p className="text-[10px] uppercase tracking-[0.18em] font-black text-brand-accent/40 dark:text-brand-cream/40 mt-0.5">
                {restaurantTables.filter((t) => t.isActive).length} of {restaurantTables.length} active
              </p>
            </div>

            {/* Add Table Form */}
            <div className="flex gap-2 mb-4 p-3 rounded-2xl bg-brand-accent/3 dark:bg-white/3 border border-brand-accent/8 dark:border-white/5">
              <Input
                value={newTableLabel}
                onChange={(e) => setNewTableLabel(e.target.value)}
                placeholder="Label (e.g. T12)"
                aria-label="Table label"
                name="tableLabel"
                autoComplete="off"
                className="flex-1 h-9 text-sm bg-white dark:bg-white/5"
                onKeyDown={(e) => e.key === "Enter" && void handleCreateTable()}
              />
              <div className="flex items-center gap-1 bg-white dark:bg-white/5 border border-brand-accent/10 dark:border-white/10 rounded-lg px-2">
                <button
                  className="h-5 w-5 flex items-center justify-center text-brand-accent/50 hover:text-brand-deep dark:hover:text-brand-cream transition-colors"
                  onClick={() => setNewTableCapacity((v) => Math.max(1, v - 1))}
                  type="button"
                >
                  <Minus className="h-3 w-3" />
                </button>
                <span className="text-sm font-bold w-5 text-center text-brand-deep dark:text-brand-cream tabular-nums">
                  {newTableCapacity}
                </span>
                <button
                  className="h-5 w-5 flex items-center justify-center text-brand-accent/50 hover:text-brand-deep dark:hover:text-brand-cream transition-colors"
                  onClick={() => setNewTableCapacity((v) => v + 1)}
                  type="button"
                >
                  <Plus className="h-3 w-3" />
                </button>
              </div>
              <Button
                onClick={() => void handleCreateTable()}
                disabled={tableCrud.createTable.isPending || !newTableLabel.trim()}
                size="sm"
                className="h-9 px-3 rounded-xl text-xs font-bold"
              >
                {tableCrud.createTable.isPending ? (
                  <Circle className="h-3 w-3 animate-spin" />
                ) : (
                  <Plus className="h-3.5 w-3.5" />
                )}
                <span className="ml-1.5">{tableCrud.createTable.isPending ? "Adding…" : "Add"}</span>
              </Button>
            </div>

            {restaurantTablesLoading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-14 rounded-2xl bg-brand-accent/5 dark:bg-white/5 animate-pulse" />
                ))}
              </div>
            ) : restaurantTables.length === 0 ? (
              <div className="py-8 flex flex-col items-center text-center">
                <TableProperties className="h-8 w-8 text-brand-accent/20 dark:text-brand-cream/20 mb-2" />
                <p className="text-sm text-brand-accent/50 dark:text-brand-cream/40">No tables registered yet</p>
                <p className="text-xs text-brand-accent/30 dark:text-brand-cream/30 mt-0.5">
                  Add tables to use the dine-in selector in sale mode
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {restaurantTables.map((table) => (
                  <RegisteredTableCard
                    key={table.id}
                    table={table}
                    onToggle={(id, isActive) => tableCrud.updateTable.mutate({ id, isActive })}
                    onDelete={(id) => tableCrud.deleteTable.mutate(id)}
                    isTogglePending={tableCrud.updateTable.isPending}
                    isDeletePending={tableCrud.deleteTable.isPending}
                  />
                ))}
              </div>
            )}
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
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-32 rounded-2xl bg-brand-accent/5 dark:bg-white/5 animate-pulse" />
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
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {KITCHEN_FLOW.map((column) => {
                const cfg = STATUS_CONFIG[column]
                const columnTickets = tickets.filter((t) => t.status === column)
                const Icon = cfg.icon

                return (
                  <div
                    key={column}
                    className={cn(
                      "rounded-2xl border p-3 space-y-2",
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
                            onAdvance={(id, status) => kitchenAction.mutate({ id, status })}
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
    </div>
  )
}
