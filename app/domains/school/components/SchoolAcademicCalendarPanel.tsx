"use client"

import * as React from "react"
import { motion } from "framer-motion"
import { CalendarRange, Plus, Trash2 } from "lucide-react"
import { ConfirmDialog } from "@/app/components/shared/ConfirmDialog"
import { DatePickerField } from "@/app/components/shared/DatePickerField"
import { InsightWhisper } from "@/app/components/dashboard/InsightWhisper"
import { GlassCard } from "@/app/components/ui/glass-card"
import { Button } from "@/app/components/ui/button"
import { Input } from "@/app/components/ui/input"
import { Label } from "@/app/components/ui/label"
import { Skeleton } from "@/app/components/ui/skeleton"
import { Badge } from "@/app/components/ui/badge"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/app/components/ui/select"
import { useAcademicCalendar } from "@/app/domains/school/hooks/useAcademicCalendar"
import { usePermission } from "@/app/hooks/usePermission"
import { cn } from "@/app/lib/utils"
import { toast } from "sonner"

function toIsoStart(d: string) {
    return new Date(`${d}T00:00:00.000`).toISOString()
}

function toIsoEnd(d: string) {
    return new Date(`${d}T23:59:59.999`).toISOString()
}

const listItemVariants = {
    hidden: { opacity: 0, y: 6 },
    show: (i: number) => ({
        opacity: 1,
        y: 0,
        transition: { delay: i * 0.04, duration: 0.25 },
    }),
}

export function SchoolAcademicCalendarPanel({ showIntro = true }: { showIntro?: boolean }) {
    const { can } = usePermission()
    const canManage = can("MANAGE_BUSINESS_CONFIG")

    const {
        data,
        isLoading,
        setActiveTerm,
        createSession,
        deleteSession,
        createTerm,
        deleteTerm,
    } = useAcademicCalendar()

    const [yearName, setYearName] = React.useState("")
    const [yearStart, setYearStart] = React.useState("")
    const [yearEnd, setYearEnd] = React.useState("")

    const [termSessionId, setTermSessionId] = React.useState<string>("")
    const [termName, setTermName] = React.useState("")
    const [termStart, setTermStart] = React.useState("")
    const [termEnd, setTermEnd] = React.useState("")

    const [pendingDelete, setPendingDelete] = React.useState<
        | { kind: "session"; id: string; name: string }
        | { kind: "term"; id: string; name: string }
        | null
    >(null)

    const sessions = data?.sessions ?? []
    const activeTermId = data?.activeTermId ?? ""

    const flatTerms = React.useMemo(
        () =>
            sessions.flatMap((s) =>
                (s.terms ?? []).map((t) => ({
                    ...t,
                    sessionLabel: s.name,
                }))
            ),
        [sessions]
    )

    React.useEffect(() => {
        if (!termSessionId && sessions[0]?.id) {
            setTermSessionId(sessions[0].id)
        }
    }, [sessions, termSessionId])

    const onAddYear = async () => {
        if (!yearName.trim() || !yearStart || !yearEnd) {
            toast.error("Enter session name and start/end dates.")
            return
        }
        try {
            await createSession.mutateAsync({
                name: yearName.trim(),
                startsAt: toIsoStart(yearStart),
                endsAt: toIsoEnd(yearEnd),
            })
            toast.success("School year added")
            setYearName("")
            setYearStart("")
            setYearEnd("")
        } catch (e: unknown) {
            toast.error(e instanceof Error ? e.message : "Could not add school year")
        }
    }

    const onAddTerm = async () => {
        if (!termSessionId || !termName.trim() || !termStart || !termEnd) {
            toast.error("Choose a school year and enter term name and dates.")
            return
        }
        try {
            await createTerm.mutateAsync({
                sessionId: termSessionId,
                name: termName.trim(),
                startsAt: toIsoStart(termStart),
                endsAt: toIsoEnd(termEnd),
            })
            toast.success("Term added")
            setTermName("")
            setTermStart("")
            setTermEnd("")
        } catch (e: unknown) {
            toast.error(e instanceof Error ? e.message : "Could not add term")
        }
    }

    const onActiveChange = async (v: string) => {
        if (v === "__clear__") {
            try {
                await setActiveTerm.mutateAsync(null)
                toast.success("Cleared default term")
            } catch (e: unknown) {
                toast.error(e instanceof Error ? e.message : "Update failed")
            }
            return
        }
        try {
            await setActiveTerm.mutateAsync(v)
            toast.success("Default term updated for new fee payments")
        } catch (e: unknown) {
            toast.error(e instanceof Error ? e.message : "Update failed")
        }
    }

    const showDefaultHint = Boolean(flatTerms.length > 0 && !activeTermId)

    if (isLoading) {
        return (
            <div className="space-y-6" aria-busy="true" aria-label="Loading school calendar">
                <Skeleton className="h-10 w-full max-w-md rounded-2xl" />
                <Skeleton className="h-28 w-full rounded-[24px]" />
                <Skeleton className="h-48 w-full rounded-[24px]" />
                <Skeleton className="h-56 w-full rounded-[24px]" />
            </div>
        )
    }

    return (
        <section className={showIntro ? "space-y-6" : "space-y-6"}>
            {showIntro ? (
                <div className="flex items-start gap-3">
                    <CalendarRange className="h-6 w-6 text-brand-gold shrink-0 mt-0.5" />
                    <div>
                        <h2 className="font-serif text-xl text-brand-deep dark:text-brand-cream">School years & terms</h2>
                        <p className="text-sm text-brand-deep/65 dark:text-brand-cream/65 mt-1 max-w-2xl">
                            Define your academic sessions and terms. Fee payments (sales) can be tagged to a term; set a
                            default term so staff do not have to pick one every time.
                        </p>
                    </div>
                </div>
            ) : null}

            {showDefaultHint ? (
                <InsightWhisper insight="Choose a **default term** below so new fee payments pick up the right academic period automatically." />
            ) : null}

            <div className="rounded-2xl border border-brand-gold/20 bg-brand-gold/5 px-4 py-4 dark:bg-brand-gold/10 transition-all duration-300">
                <div className="space-y-2">
                    <Label
                        htmlFor="default-term-select"
                        className="text-brand-deep/85 dark:text-brand-cream/85 font-medium"
                    >
                        Default term for new fee payments
                    </Label>
                    <Select
                        value={activeTermId || "__clear__"}
                        onValueChange={onActiveChange}
                        disabled={setActiveTerm.isPending || !canManage}
                    >
                        <SelectTrigger
                            id="default-term-select"
                            className="w-full max-w-md rounded-2xl border-brand-deep/10 dark:border-white/10 bg-white/40 dark:bg-brand-deep/30 transition-all duration-300"
                        >
                            <SelectValue placeholder="No default" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="__clear__">No default (choose each time)</SelectItem>
                            {flatTerms.map((t) => (
                                <SelectItem key={t.id} value={t.id}>
                                    {t.sessionLabel} · {t.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <GlassCard className="p-0 overflow-hidden border-brand-gold/10 shadow-sm">
                <div className="border-b border-brand-deep/8 dark:border-white/10 px-5 py-4 bg-white/30 dark:bg-white/[0.03]">
                    <h3 className="font-serif text-base font-medium text-brand-deep dark:text-brand-cream tracking-tight">
                        Add school year
                    </h3>
                    <p className="text-xs text-brand-deep/55 dark:text-brand-cream/55 mt-0.5">
                        One row per academic session (e.g. 2025/2026).
                    </p>
                </div>
                <div className="p-5 pt-4 space-y-4">
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                        <div className="space-y-1">
                            <Label htmlFor="sess-name" className="text-brand-deep/80 dark:text-brand-cream/80">
                                Name
                            </Label>
                            <Input
                                id="sess-name"
                                value={yearName}
                                onChange={(e) => setYearName(e.target.value)}
                                placeholder="e.g. 2025/2026"
                                disabled={!canManage}
                                className="rounded-2xl border-brand-deep/10 dark:border-white/10 transition-all duration-300"
                            />
                        </div>
                        <div className="space-y-1">
                            <Label htmlFor="sess-start" className="text-brand-deep/80 dark:text-brand-cream/80">
                                Starts
                            </Label>
                            <DatePickerField
                                id="sess-start"
                                value={yearStart}
                                onChange={setYearStart}
                                placeholder="Start date"
                                disabled={!canManage}
                            />
                        </div>
                        <div className="space-y-1">
                            <Label htmlFor="sess-end" className="text-brand-deep/80 dark:text-brand-cream/80">
                                Ends
                            </Label>
                            <DatePickerField
                                id="sess-end"
                                value={yearEnd}
                                onChange={setYearEnd}
                                placeholder="End date"
                                disabled={!canManage}
                            />
                        </div>
                        <div className="flex items-end">
                            <Button
                                type="button"
                                onClick={() => void onAddYear()}
                                disabled={createSession.isPending || !canManage}
                                className="h-[46px] w-full sm:w-auto rounded-full transition-all duration-300"
                            >
                                <Plus className="h-4 w-4 mr-2" />
                                Add year
                            </Button>
                        </div>
                    </div>
                </div>
            </GlassCard>

            <GlassCard className="p-0 overflow-hidden border-brand-gold/10 shadow-sm">
                <div className="border-b border-brand-deep/8 dark:border-white/10 px-5 py-4 bg-white/30 dark:bg-white/[0.03]">
                    <h3 className="font-serif text-base font-medium text-brand-deep dark:text-brand-cream tracking-tight">
                        Add term
                    </h3>
                    <p className="text-xs text-brand-deep/55 dark:text-brand-cream/55 mt-0.5">
                        Terms must fall within the school year dates you defined.
                    </p>
                </div>
                <div className="p-5 pt-4 space-y-4">
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                        <div className="space-y-1">
                            <Label htmlFor="term-session-select" className="text-brand-deep/80 dark:text-brand-cream/80">
                                School year
                            </Label>
                            <Select value={termSessionId} onValueChange={setTermSessionId} disabled={!canManage}>
                                <SelectTrigger
                                    id="term-session-select"
                                    className="rounded-2xl border-brand-deep/10 dark:border-white/10 transition-all duration-300"
                                >
                                    <SelectValue placeholder="Select year" />
                                </SelectTrigger>
                                <SelectContent>
                                    {sessions.map((s) => (
                                        <SelectItem key={s.id} value={s.id}>
                                            {s.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1">
                            <Label htmlFor="term-name" className="text-brand-deep/80 dark:text-brand-cream/80">
                                Term name
                            </Label>
                            <Input
                                id="term-name"
                                value={termName}
                                onChange={(e) => setTermName(e.target.value)}
                                placeholder="First term"
                                disabled={!canManage}
                                className="rounded-2xl border-brand-deep/10 dark:border-white/10 transition-all duration-300"
                            />
                        </div>
                        <div className="space-y-1">
                            <Label htmlFor="term-start" className="text-brand-deep/80 dark:text-brand-cream/80">
                                Starts
                            </Label>
                            <DatePickerField
                                id="term-start"
                                value={termStart}
                                onChange={setTermStart}
                                placeholder="Start date"
                                disabled={!canManage}
                            />
                        </div>
                        <div className="space-y-1">
                            <Label htmlFor="term-end" className="text-brand-deep/80 dark:text-brand-cream/80">
                                Ends
                            </Label>
                            <DatePickerField
                                id="term-end"
                                value={termEnd}
                                onChange={setTermEnd}
                                placeholder="End date"
                                disabled={!canManage}
                            />
                        </div>
                        <div className="flex items-end">
                            <Button
                                type="button"
                                variant="secondary"
                                onClick={() => void onAddTerm()}
                                disabled={createTerm.isPending || !sessions.length || !canManage}
                                className="h-[46px] w-full sm:w-auto rounded-full transition-all duration-300"
                            >
                                <Plus className="h-4 w-4 mr-2" />
                                Add term
                            </Button>
                        </div>
                    </div>
                </div>
            </GlassCard>

            <GlassCard className="p-0 overflow-hidden border-brand-gold/10 shadow-sm">
                <div className="border-b border-brand-deep/8 dark:border-white/10 px-5 py-4 bg-white/30 dark:bg-white/[0.03]">
                    <h3 className="font-serif text-base font-medium text-brand-deep dark:text-brand-cream tracking-tight">
                        Calendar overview
                    </h3>
                </div>
                <div className="p-5 pt-4">
                    {sessions.length === 0 ? (
                        <p className="text-sm text-brand-deep/60 dark:text-brand-cream/60">No school years yet.</p>
                    ) : (
                        <ul className="relative space-y-0 pl-2 md:pl-3">
                            <div
                                className="absolute left-[11px] md:left-[15px] top-2 bottom-2 w-px bg-linear-to-b from-brand-gold/50 via-brand-gold/25 to-transparent dark:from-brand-gold/40 dark:via-brand-gold/20"
                                aria-hidden
                            />
                            {sessions.map((s, si) => (
                                <motion.li
                                    key={s.id}
                                    custom={si}
                                    variants={listItemVariants}
                                    initial="hidden"
                                    animate="show"
                                    className="relative pb-8 last:pb-0"
                                >
                                    <div className="flex gap-3 md:gap-4">
                                        <div
                                            className="mt-1.5 h-3 w-3 shrink-0 rounded-full border-2 border-brand-gold/80 bg-brand-cream dark:bg-brand-deep shadow-[0_0_0_4px_rgba(212,175,55,0.12)] z-10"
                                            aria-hidden
                                        />
                                        <div
                                            className={cn(
                                                "flex-1 rounded-2xl border border-brand-deep/10 dark:border-white/10",
                                                "bg-white/40 dark:bg-white/[0.04] p-4 transition-all duration-300",
                                                "hover:border-brand-gold/25 hover:shadow-sm"
                                            )}
                                        >
                                            <div className="flex flex-wrap items-center justify-between gap-2">
                                                <div>
                                                    <p className="font-medium text-brand-deep dark:text-brand-cream font-serif">
                                                        {s.name}
                                                    </p>
                                                    <p className="text-xs text-brand-deep/55 dark:text-brand-cream/55 mt-0.5">
                                                        {s.startsAt?.slice(0, 10)} → {s.endsAt?.slice(0, 10)}
                                                    </p>
                                                </div>
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-9 w-9 rounded-xl text-destructive hover:bg-destructive/10 transition-all duration-300"
                                                    aria-label={`Remove school year ${s.name}`}
                                                    onClick={() =>
                                                        setPendingDelete({ kind: "session", id: s.id, name: s.name })
                                                    }
                                                    disabled={deleteSession.isPending || !canManage}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                            <ul className="mt-3 flex flex-col gap-2">
                                                {(s.terms ?? []).map((t) => {
                                                    const isDefault = activeTermId === t.id
                                                    return (
                                                        <li
                                                            key={t.id}
                                                            className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-brand-deep/6 dark:border-white/8 bg-brand-deep/[0.02] dark:bg-white/[0.03] px-3 py-2 text-sm"
                                                        >
                                                            <span className="text-brand-deep dark:text-brand-cream flex flex-wrap items-center gap-2">
                                                                <span>{t.name}</span>
                                                                {isDefault ? (
                                                                    <Badge
                                                                        variant="secondary"
                                                                        className="rounded-full bg-brand-gold/15 text-brand-deep dark:text-brand-cream border-brand-gold/25 text-[10px] uppercase tracking-wide"
                                                                    >
                                                                        Default
                                                                    </Badge>
                                                                ) : null}
                                                                <span className="text-brand-deep/50 dark:text-brand-cream/50 text-xs font-normal">
                                                                    {t.startsAt?.slice(0, 10)} – {t.endsAt?.slice(0, 10)}
                                                                </span>
                                                            </span>
                                                            <Button
                                                                type="button"
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-8 w-8 shrink-0 rounded-lg text-destructive hover:bg-destructive/10 transition-all duration-300"
                                                                aria-label={`Remove term ${t.name}`}
                                                                onClick={() =>
                                                                    setPendingDelete({ kind: "term", id: t.id, name: t.name })
                                                                }
                                                                disabled={deleteTerm.isPending || !canManage}
                                                            >
                                                                <Trash2 className="h-3.5 w-3.5" />
                                                            </Button>
                                                        </li>
                                                    )
                                                })}
                                            </ul>
                                        </div>
                                    </div>
                                </motion.li>
                            ))}
                        </ul>
                    )}
                </div>
            </GlassCard>

            <ConfirmDialog
                open={pendingDelete !== null}
                onOpenChange={(open) => {
                    if (!open) setPendingDelete(null)
                }}
                title={
                    pendingDelete?.kind === "term"
                        ? "Remove term?"
                        : "Remove school year?"
                }
                description={
                    pendingDelete?.kind === "term"
                        ? `“${pendingDelete.name}” will be removed. This cannot be undone.`
                        : pendingDelete
                          ? `“${pendingDelete.name}” and all its terms will be removed. This cannot be undone.`
                          : ""
                }
                confirmText="Remove"
                cancelText="Cancel"
                variant="destructive"
                isLoading={
                    pendingDelete?.kind === "session"
                        ? deleteSession.isPending
                        : pendingDelete?.kind === "term"
                          ? deleteTerm.isPending
                          : false
                }
                onConfirm={async () => {
                    if (!pendingDelete) return
                    try {
                        if (pendingDelete.kind === "session") {
                            await deleteSession.mutateAsync(pendingDelete.id)
                            toast.success("School year removed")
                        } else {
                            await deleteTerm.mutateAsync(pendingDelete.id)
                            toast.success("Term removed")
                        }
                    } catch (e: unknown) {
                        toast.error(e instanceof Error ? e.message : "Remove failed")
                        throw e
                    }
                }}
            />
        </section>
    )
}
