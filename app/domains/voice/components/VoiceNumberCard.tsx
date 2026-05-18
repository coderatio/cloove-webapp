"use client"

import { useState } from "react"
import { Button } from "@/app/components/ui/button"
import { ConfirmDialog } from "@/app/components/shared/ConfirmDialog"
import { cn } from "@/app/lib/utils"
import { Pencil, Phone, RotateCcw, Star, Unplug } from "lucide-react"
import type { VoiceNumberItem, VoiceProviderOption } from "@/app/domains/voice/hooks/useVoice"

interface VoiceNumberCardProps {
    number: VoiceNumberItem
    provider?: VoiceProviderOption
    isUpdating: boolean
    isDisconnecting: boolean
    onEdit: () => void
    onSetDefault: () => void
    onReconnect: () => void
    onDisconnect: () => void
}

export function VoiceNumberCard({
    number,
    provider,
    isUpdating,
    isDisconnecting,
    onEdit,
    onSetDefault,
    onReconnect,
    onDisconnect,
}: VoiceNumberCardProps) {
    const [showDisconnectConfirm, setShowDisconnectConfirm] = useState(false)
    const status = number.status.toLowerCase()
    const isActive = status === "active"
    const isFailed = status === "failed"
    const canReconnect = status === "disconnected" || status === "failed"
    const providerName = provider?.name ?? number.provider.replace(/_/g, " ")
    const hasLabel = Boolean(number.label)
    const displayTitle = number.label || number.phone_number
    const statusLabel = isActive ? null : isFailed ? "Needs attention" : "Disconnected"

    return (
        <>
            <article
                className={cn(
                    "group overflow-hidden rounded-3xl border bg-white transition-all duration-150 dark:bg-slate-950/40",
                    isActive
                        ? "border-slate-200/80 hover:border-slate-200 hover:shadow-[0_2px_10px_-4px_rgba(15,23,42,0.08)] dark:border-white/10 dark:hover:border-white/20"
                        : "border-slate-200/60 dark:border-white/8"
                )}
            >
                <div className="flex items-start gap-3.5 px-4 pt-4 pb-3.5">
                    <div className="relative shrink-0">
                        <div
                            className={cn(
                                "flex h-11 w-11 items-center justify-center rounded-xl",
                                isActive
                                    ? "bg-brand-green-50 text-brand-green dark:bg-brand-green-950/40 dark:text-emerald-400"
                                    : isFailed
                                        ? "bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400"
                                        : "bg-slate-100 text-slate-400 dark:bg-white/5 dark:text-slate-500"
                            )}
                        >
                            <Phone className="h-[18px] w-[18px]" strokeWidth={2} />
                        </div>
                        <span
                            className={cn(
                                "absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full ring-[2.5px] ring-white dark:ring-slate-950",
                                isActive
                                    ? "bg-emerald-500"
                                    : isFailed
                                        ? "bg-amber-500"
                                        : "bg-slate-300 dark:bg-slate-600"
                            )}
                            aria-hidden
                        />
                    </div>

                    <div className="min-w-0 flex-1 pt-0.5">
                        <div className="flex items-center gap-2">
                            <h3 className="truncate text-[15px] font-semibold leading-tight text-slate-900 dark:text-slate-100">
                                {displayTitle}
                            </h3>
                            {number.is_default ? (
                                <span
                                    className="inline-flex shrink-0 items-center gap-1 rounded-md bg-amber-50 px-1.5 py-0.5 text-[11px] font-medium text-amber-700 dark:bg-amber-500/10 dark:text-amber-300"
                                    title="Default voice number"
                                >
                                    <Star className="h-2.5 w-2.5 fill-current" strokeWidth={0} />
                                    Default
                                </span>
                            ) : null}
                        </div>

                        {hasLabel ? (
                            <p className="mt-1 truncate font-mono text-[13px] tabular-nums text-slate-600 dark:text-slate-300">
                                {number.phone_number}
                            </p>
                        ) : null}

                        <p className="mt-1 truncate text-xs text-slate-500 dark:text-slate-400">
                            <span className="capitalize">{providerName}</span>
                            <span aria-hidden className="px-1.5 text-slate-300 dark:text-slate-600">·</span>
                            <span>
                                {number.use_system_credentials ? "Managed credentials" : "Custom credentials"}
                            </span>
                            {statusLabel ? (
                                <>
                                    <span aria-hidden className="px-1.5 text-slate-300 dark:text-slate-600">·</span>
                                    <span
                                        className={cn(
                                            "font-medium",
                                            isFailed
                                                ? "text-amber-600 dark:text-amber-400"
                                                : "text-slate-500 dark:text-slate-400"
                                        )}
                                    >
                                        {statusLabel}
                                    </span>
                                </>
                            ) : null}
                        </p>
                    </div>
                </div>

                <div className="flex flex-wrap items-center justify-end gap-1 border-t border-slate-100 bg-slate-50/40 px-2 py-1.5 dark:border-white/6 dark:bg-white/1.5">
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={onEdit}
                        className="h-8 rounded-md px-2.5 text-[13px] font-medium text-slate-600 hover:bg-white hover:text-slate-900 dark:text-slate-300 dark:hover:bg-white/5 dark:hover:text-slate-100"
                    >
                        <Pencil className="mr-1.5 h-3.5 w-3.5" />
                        Edit
                    </Button>

                    {isActive && !number.is_default ? (
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={onSetDefault}
                            disabled={isUpdating}
                            className="h-8 rounded-md px-2.5 text-[13px] font-medium text-slate-600 hover:bg-white hover:text-slate-900 dark:text-slate-300 dark:hover:bg-white/5 dark:hover:text-slate-100"
                        >
                            <Star className="mr-1.5 h-3.5 w-3.5" />
                            Set default
                        </Button>
                    ) : null}

                    {canReconnect ? (
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={onReconnect}
                            disabled={isUpdating}
                            className="h-8 rounded-md px-2.5 text-[13px] font-medium text-slate-600 hover:bg-white hover:text-slate-900 dark:text-slate-300 dark:hover:bg-white/5 dark:hover:text-slate-100"
                        >
                            <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
                            Reconnect
                        </Button>
                    ) : null}

                    {isActive ? (
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => setShowDisconnectConfirm(true)}
                            disabled={isDisconnecting}
                            className="h-8 rounded-md px-2.5 text-[13px] font-medium text-red-600 hover:bg-white hover:text-red-700 dark:text-red-400 dark:hover:bg-red-500/10"
                        >
                            <Unplug className="mr-1.5 h-3.5 w-3.5" />
                            Disconnect
                        </Button>
                    ) : null}
                </div>
            </article>

            <ConfirmDialog
                open={showDisconnectConfirm}
                onOpenChange={setShowDisconnectConfirm}
                onConfirm={onDisconnect}
                title="Disconnect this voice line?"
                description="Cloove will stop handling inbound and outbound calls on this number. You can reconnect it later without losing your settings."
                confirmText="Disconnect"
                isLoading={isDisconnecting}
            />
        </>
    )
}
