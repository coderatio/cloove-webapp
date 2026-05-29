"use client"

import { useMemo, useState } from "react"
import dynamic from "next/dynamic"
import { GlassCard } from "@/app/components/ui/glass-card"
import { Button } from "@/app/components/ui/button"
import { ManagementHeader } from "@/app/components/shared/ManagementHeader"
import { Pencil, Trash2 } from "lucide-react"
import {
    useBusinessServices,
    type BusinessServiceItem,
} from "@/app/domains/services/hooks/useServices"

const ServiceFormDrawer = dynamic(
    () =>
        import("@/app/domains/services/components/ServiceFormDrawer").then(
            (mod) => mod.ServiceFormDrawer
        ),
    { ssr: false }
)

export function ServicesView() {
    const {
        services,
        isLoading,
        createService,
        updateService,
        removeService,
        isCreating,
        isUpdating,
        isRemoving,
    } = useBusinessServices()

    const [search, setSearch] = useState("")
    const [editing, setEditing] = useState<BusinessServiceItem | null>(null)
    const [drawerOpen, setDrawerOpen] = useState(false)

    const filtered = useMemo(() => {
        const term = search.trim().toLowerCase()
        if (!term) return services
        return services.filter((service) =>
            [service.name, service.summary, service.audience]
                .filter(Boolean)
                .join(" ")
                .toLowerCase()
                .includes(term)
        )
    }, [services, search])

    function openCreate() {
        setEditing(null)
        setDrawerOpen(true)
    }

    function openEdit(service: BusinessServiceItem) {
        setEditing(service)
        setDrawerOpen(true)
    }

    return (
        <div className="space-y-8">
            <ManagementHeader
                title="Services"
                description="The catalog your white-label assistant uses as the only source of truth."
                searchValue={search}
                onSearchChange={setSearch}
                searchPlaceholder="Search services..."
                addButtonLabel="Add service"
                onAddClick={openCreate}
            />

            {isLoading ? (
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {[0, 1, 2].map((i) => (
                        <GlassCard key={i} className="h-44 animate-pulse" />
                    ))}
                </div>
            ) : filtered.length === 0 ? (
                <GlassCard className="p-10 text-center">
                    <h3 className="font-serif text-xl text-brand-deep dark:text-brand-cream mb-2">
                        No services yet
                    </h3>
                    <p className="text-brand-accent/60 dark:text-brand-cream/60 mb-6 max-w-md mx-auto">
                        Add the consultations, packages, or engagements you offer. The white-label assistant will refuse to invent any that aren&apos;t listed here.
                    </p>
                    <Button
                        onClick={openCreate}
                        className="rounded-full bg-brand-deep text-brand-gold-300 dark:bg-brand-gold-700 dark:text-white dark:hover:bg-brand-gold-800 h-11 px-6"
                    >
                        Add your first service
                    </Button>
                </GlassCard>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {filtered.map((service) => (
                        <GlassCard
                            key={service.id}
                            hoverEffect
                            className="p-5 flex flex-col gap-4"
                            style={{ contentVisibility: "auto", containIntrinsicSize: "260px" }}
                        >
                            <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                    <h3 className="font-serif text-lg text-brand-deep dark:text-brand-cream truncate">
                                        {service.name}
                                    </h3>
                                    {service.summary && (
                                        <p className="text-sm text-brand-accent/70 dark:text-brand-cream/60 mt-1 line-clamp-2">
                                            {service.summary}
                                        </p>
                                    )}
                                </div>
                                <span
                                    className={
                                        service.isActive
                                            ? "px-3 py-1 text-[10px] font-bold uppercase tracking-widest rounded-full bg-brand-green/10 text-brand-green"
                                            : "px-3 py-1 text-[10px] font-bold uppercase tracking-widest rounded-full bg-brand-accent/10 text-brand-accent/60"
                                    }
                                >
                                    {service.isActive ? "Active" : "Hidden"}
                                </span>
                            </div>

                            <dl className="grid grid-cols-2 gap-3 text-sm">
                                <div>
                                    <dt className="text-[10px] uppercase tracking-widest text-brand-accent/50 dark:text-brand-cream/40">
                                        Pricing
                                    </dt>
                                    <dd className="text-brand-deep dark:text-brand-cream font-medium">
                                        {service.priceLabel ?? "On request"}
                                    </dd>
                                </div>
                                <div>
                                    <dt className="text-[10px] uppercase tracking-widest text-brand-accent/50 dark:text-brand-cream/40">
                                        Duration
                                    </dt>
                                    <dd className="text-brand-deep dark:text-brand-cream font-medium">
                                        {service.durationLabel ?? "—"}
                                    </dd>
                                </div>
                            </dl>

                            <div className="flex items-center justify-end gap-2 pt-2 border-t border-brand-deep/5 dark:border-white/5">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => openEdit(service)}
                                    className="text-brand-accent/70 hover:text-brand-deep"
                                >
                                    <Pencil className="w-4 h-4 mr-1" /> Edit
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => removeService(service.id)}
                                    disabled={isRemoving}
                                    className="text-brand-accent/70 hover:text-red-500"
                                >
                                    <Trash2 className="w-4 h-4 mr-1" /> Remove
                                </Button>
                            </div>
                        </GlassCard>
                    ))}
                </div>
            )}

            {drawerOpen && (
                <ServiceFormDrawer
                    open={drawerOpen}
                    onOpenChange={setDrawerOpen}
                    initial={editing}
                    onSubmit={async (payload) => {
                        if (editing) {
                            await updateService({ id: editing.id, payload })
                        } else {
                            await createService(payload)
                        }
                        setDrawerOpen(false)
                    }}
                    submitting={isCreating || isUpdating}
                />
            )}
        </div>
    )
}
