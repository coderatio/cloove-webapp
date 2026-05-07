"use client"

import { useMemo, useState } from "react"
import dynamic from "next/dynamic"
import { GlassCard } from "@/app/components/ui/glass-card"
import { ManagementHeader } from "@/app/components/shared/ManagementHeader"
import DataTable, { type Column } from "@/app/components/DataTable"
import type { FilterGroup } from "@/app/components/shared/FilterPopover"
import {
    useInquiries,
    type ConsultationInquiry,
    type InquiryStatus,
} from "@/app/domains/inquiries/hooks/useInquiries"

const InquiryDetailDrawer = dynamic(
    () =>
        import("@/app/domains/inquiries/components/InquiryDetailDrawer").then(
            (mod) => mod.InquiryDetailDrawer
        ),
    { ssr: false }
)

const STATUS_LABEL: Record<InquiryStatus, string> = {
    new: "New",
    qualifying: "Qualifying",
    scheduled: "Scheduled",
    won: "Won",
    lost: "Lost",
}

const STATUS_TONE: Record<InquiryStatus, string> = {
    new: "bg-brand-green/10 text-brand-green",
    qualifying: "bg-brand-gold/15 text-brand-gold",
    scheduled: "bg-brand-deep/10 text-brand-deep dark:text-brand-cream",
    won: "bg-brand-green/15 text-brand-green",
    lost: "bg-brand-accent/10 text-brand-accent/70",
}

export function InquiriesView() {
    const [statusFilter, setStatusFilter] = useState<InquiryStatus | "ALL">("ALL")
    const [search, setSearch] = useState("")
    const [selected, setSelected] = useState<ConsultationInquiry | null>(null)

    const { inquiries, isLoading, updateInquiry, isUpdating } = useInquiries({
        status: statusFilter,
        limit: 100,
    })

    const filtered = useMemo(() => {
        const term = search.trim().toLowerCase()
        if (!term) return inquiries
        return inquiries.filter((inquiry) =>
            [
                inquiry.topic,
                inquiry.message,
                inquiry.customerName,
                inquiry.customerPhone,
                inquiry.serviceName,
            ]
                .filter(Boolean)
                .join(" ")
                .toLowerCase()
                .includes(term)
        )
    }, [inquiries, search])

    const columns: Column<ConsultationInquiry>[] = [
        {
            key: "topic",
            header: "Topic",
            render: (_value, row) => (
                <div className="space-y-1">
                    <div className="font-medium text-brand-deep dark:text-brand-cream">
                        {row.topic}
                    </div>
                    {row.serviceName && (
                        <div className="text-xs text-brand-accent/60 dark:text-brand-cream/50">
                            {row.serviceName}
                        </div>
                    )}
                </div>
            ),
        },
        {
            key: "customerName",
            header: "Customer",
            render: (_value, row) => (
                <div className="space-y-0.5">
                    <div className="text-sm text-brand-deep dark:text-brand-cream">
                        {row.customerName ?? "—"}
                    </div>
                    {row.customerPhone && (
                        <div className="text-xs text-brand-accent/60 dark:text-brand-cream/50">
                            {row.customerPhone}
                        </div>
                    )}
                </div>
            ),
        },
        {
            key: "preferredContactWindow",
            header: "Preferred",
            render: (value) => (
                <span className="text-sm text-brand-accent/70 dark:text-brand-cream/60">
                    {(value as string) || "—"}
                </span>
            ),
        },
        {
            key: "status",
            header: "Status",
            render: (_value, row) => (
                <span
                    className={`px-3 py-1 text-[10px] font-bold uppercase tracking-widest rounded-full ${STATUS_TONE[row.status]}`}
                >
                    {STATUS_LABEL[row.status]}
                </span>
            ),
        },
        {
            key: "createdAt",
            header: "Received",
            render: (value) => (
                <span className="text-xs text-brand-accent/60 dark:text-brand-cream/50">
                    {new Date(String(value)).toLocaleString()}
                </span>
            ),
        },
    ]

    const filterGroups: FilterGroup[] = [
        {
            title: "Status",
            options: [
                { value: "ALL", label: "All" },
                { value: "new", label: "New" },
                { value: "qualifying", label: "Qualifying" },
                { value: "scheduled", label: "Scheduled" },
                { value: "won", label: "Won" },
                { value: "lost", label: "Lost" },
            ],
        },
    ]

    const selectedFilterValues =
        statusFilter === "ALL" ? ["ALL"] : [statusFilter]

    return (
        <div className="space-y-8">
            <ManagementHeader
                title="Inquiries"
                description="Leads captured by your white-label assistant. Triage, assign, and close from here."
                searchValue={search}
                onSearchChange={setSearch}
                searchPlaceholder="Search inquiries..."
                filterGroups={filterGroups}
                selectedFilterValues={selectedFilterValues}
                onFilterSelectionChange={(values) => {
                    const next = values.find((v) => v !== "ALL") ?? "ALL"
                    setStatusFilter(next as InquiryStatus | "ALL")
                }}
                onFilterClear={() => setStatusFilter("ALL")}
            />

            <GlassCard
                allowOverflow
                className="p-2"
                style={{ contentVisibility: "auto", containIntrinsicSize: "640px" }}
            >
                <DataTable<ConsultationInquiry>
                    columns={columns}
                    data={filtered}
                    isLoading={isLoading}
                    emptyMessage="No inquiries yet"
                    onRowClick={(row) => setSelected(row)}
                    pageSize={20}
                />
            </GlassCard>

            {selected && (
                <InquiryDetailDrawer
                    open={!!selected}
                    onOpenChange={(open) => !open && setSelected(null)}
                    inquiry={selected}
                    submitting={isUpdating}
                    onUpdateStatus={async (status, notes) => {
                        await updateInquiry({
                            id: selected.id,
                            payload: { status, notes: notes ?? null },
                        })
                        setSelected(null)
                    }}
                />
            )}
        </div>
    )
}
