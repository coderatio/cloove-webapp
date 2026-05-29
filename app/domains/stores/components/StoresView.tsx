"use client"

import { useState } from "react"
import { toast } from "sonner"
import { motion } from "framer-motion"
import { PageTransition } from "@/app/components/layout/page-transition"
import { GlassCard } from "@/app/components/ui/glass-card"
import { useBusiness } from "@/app/components/BusinessProvider"
import {
    MapPin,
    Plus,
    Settings2,
    Store as StoreIcon,
    ChevronRight,
    LocateFixed,
    Loader2,
} from "lucide-react"
import { Button } from "@/app/components/ui/button"
import { Input } from "@/app/components/ui/input"
import { ActivityStream } from "@/app/components/dashboard/ActivityStream"
import { TableSearch } from "@/app/components/shared/TableSearch"
import {
    Drawer,
    DrawerContent,
    DrawerStickyHeader,
    DrawerBody,
    DrawerFooter,
    DrawerTitle,
    DrawerDescription,
    DrawerClose,
} from "@/app/components/ui/drawer"
import {
    useStores,
    useStoreActivities,
} from "@/app/domains/stores/providers/StoreProvider"

const FIELD_LABEL =
    "block text-[10px] font-bold uppercase tracking-widest text-brand-accent/40 dark:text-brand-cream/40 px-0.5"

export function StoresView() {
    const { stores, addStore, updateStore, deleteStore } = useStores()
    const { activeBusiness } = useBusiness()
    const [isAddOpen, setIsAddOpen] = useState(false)
    const [editingStore, setEditingStore] = useState<any>(null)
    const [viewingActivities, setViewingActivities] = useState<any>(null)
    const { data: activitiesResponse, isLoading: isLoadingActivities } = useStoreActivities(viewingActivities?.id)

    // Form states
    const [newName, setNewName] = useState("")
    const [newLocation, setNewLocation] = useState("")
    const [newLatitude, setNewLatitude] = useState("")
    const [newLongitude, setNewLongitude] = useState("")
    const [managerName, setManagerName] = useState("")
    const [managerPhone, setManagerPhone] = useState("")
    const [managerEmail, setManagerEmail] = useState("")
    const [contactEmail, setContactEmail] = useState("")
    const [contactPhone, setContactPhone] = useState("")
    const [isCapturingLocation, setIsCapturingLocation] = useState(false)

    const parseOptionalCoord = (
        raw: string,
        min: number,
        max: number
    ): { ok: true; value: number | null } | { ok: false } => {
        const t = raw.trim()
        if (!t) return { ok: true, value: null }
        const n = Number(t)
        if (!Number.isFinite(n) || n < min || n > max) return { ok: false }
        return { ok: true, value: n }
    }

    const handleAdd = (e: React.FormEvent) => {
        e.preventDefault()
        if (!newName.trim()) return
        const lat = parseOptionalCoord(newLatitude, -90, 90)
        const lng = parseOptionalCoord(newLongitude, -180, 180)
        if (!lat.ok) {
            toast.error("Latitude must be a number between -90 and 90, or leave blank.")
            return
        }
        if (!lng.ok) {
            toast.error("Longitude must be a number between -180 and 180, or leave blank.")
            return
        }
        addStore({
            name: newName,
            location: newLocation || null,
            latitude: lat.value,
            longitude: lng.value,
            managerName,
            managerPhone,
            managerEmail,
            contactEmail,
            contactPhone
        })
        resetForm()
        setIsAddOpen(false)
    }

    const resetForm = () => {
        setNewName("")
        setNewLocation("")
        setNewLatitude("")
        setNewLongitude("")
        setManagerName("")
        setManagerPhone("")
        setManagerEmail("")
        setContactEmail("")
        setContactPhone("")
        setIsCapturingLocation(false)
    }

    const captureCurrentLocation = () => {
        if (typeof navigator === "undefined" || !navigator.geolocation) {
            toast.error("Location is not available in this browser.")
            return
        }
        setIsCapturingLocation(true)
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                setNewLatitude(String(pos.coords.latitude))
                setNewLongitude(String(pos.coords.longitude))
                setIsCapturingLocation(false)
                toast.success("Current location applied to coordinates.")
            },
            (err) => {
                setIsCapturingLocation(false)
                if (err.code === err.PERMISSION_DENIED) {
                    toast.error("Location permission denied. Allow location access for this site and try again.")
                } else if (err.code === err.POSITION_UNAVAILABLE) {
                    toast.error("Could not determine your position. Try again or enter coordinates manually.")
                } else if (err.code === err.TIMEOUT) {
                    toast.error("Location request timed out. Try again.")
                } else {
                    toast.error("Could not read your location.")
                }
            },
            { enableHighAccuracy: true, timeout: 20_000, maximumAge: 0 }
        )
    }

    const handleUpdate = (e: React.FormEvent) => {
        e.preventDefault()
        if (!editingStore || !newName.trim()) return
        const lat = parseOptionalCoord(newLatitude, -90, 90)
        const lng = parseOptionalCoord(newLongitude, -180, 180)
        if (!lat.ok) {
            toast.error("Latitude must be a number between -90 and 90, or leave blank.")
            return
        }
        if (!lng.ok) {
            toast.error("Longitude must be a number between -180 and 180, or leave blank.")
            return
        }
        updateStore(editingStore.id, {
            name: newName,
            location: newLocation || null,
            latitude: lat.value,
            longitude: lng.value,
            managerName,
            managerPhone,
            managerEmail,
            contactEmail,
            contactPhone
        })
        setEditingStore(null)
        resetForm()
    }

    const openEdit = (store: any) => {
        setEditingStore(store)
        setNewName(store.name)
        setNewLocation(store.location || "")
        setNewLatitude(
            store.latitude != null && store.latitude !== "" ? String(store.latitude) : ""
        )
        setNewLongitude(
            store.longitude != null && store.longitude !== "" ? String(store.longitude) : ""
        )
        setManagerName(store.managerName || "")
        setManagerPhone(store.managerPhone || "")
        setManagerEmail(store.managerEmail || "")
        setContactEmail(store.contactEmail || "")
        setContactPhone(store.contactPhone || "")
    }

    // Filter out the virtual "All Stores" for management
    const actualStores = stores.filter(s => s.id !== 'all-stores')

    return (
        <PageTransition>
            <div className="max-w-6xl mx-auto space-y-8 pb-10">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                    <div>
                        <h1 className="font-serif text-3xl md:text-5xl font-medium text-brand-deep dark:text-brand-cream mb-2">
                            Manage Stores
                        </h1>
                        <p className="text-brand-accent/60 dark:text-brand-cream/60 max-w-lg">
                            Add, edit, and organize your business locations. Each store maintains its own inventory and staff.
                        </p>
                    </div>
                    <Button
                        onClick={() => setIsAddOpen(true)}
                        className="rounded-full bg-brand-deep text-brand-gold dark:bg-brand-gold-700 dark:text-white dark:hover:bg-brand-gold-800 hover:scale-105 transition-all shadow-lg"
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        Add New Store
                    </Button>
                </div>

                {/* Search & Filter - Minimalist */}
                <TableSearch
                    value={""}
                    onChange={() => { }}
                    placeholder="Search locations..."
                    className="w-full"
                />

                {/* Stores Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {actualStores.map((store, index) => (
                        <motion.div
                            key={store.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                        >
                            <GlassCard className="p-6 h-full group hover:shadow-2xl transition-all duration-500 border-l-4 border-l-brand-green relative overflow-hidden">
                                <div className="flex items-start justify-between mb-6">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-2xl bg-brand-green/10 dark:bg-brand-gold/10 flex items-center justify-center text-brand-green dark:text-brand-gold group-hover:scale-110 transition-transform">
                                            <StoreIcon className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-serif font-medium text-brand-deep dark:text-brand-cream">
                                                {store.name}
                                            </h3>
                                            <div className="flex flex-col gap-0.5 text-xs text-brand-accent/60 dark:text-brand-cream/60">
                                                <div className="flex items-center gap-1.5">
                                                    <MapPin className="w-3 h-3 shrink-0" />
                                                    <span>{store.location || "Location not set"}</span>
                                                </div>
                                                {store.latitude != null &&
                                                    store.longitude != null && (
                                                        <span className="ml-4 tabular-nums opacity-90">
                                                            {Number(store.latitude).toFixed(5)},{" "}
                                                            {Number(store.longitude).toFixed(5)}
                                                        </span>
                                                    )}
                                            </div>
                                        </div>
                                    </div>
                                    {store.isDefault && (
                                        <span className="px-3 py-1 bg-brand-gold/10 text-brand-gold text-[10px] font-bold uppercase tracking-widest rounded-full border border-brand-gold/20">
                                            Primary
                                        </span>
                                    )}
                                </div>

                                <div className="space-y-4">
                                    <div className="flex items-center justify-between text-sm py-2 border-b border-brand-accent/5">
                                        <span className="text-brand-accent/60 dark:text-brand-cream/60">Active Staff</span>
                                        <span className="font-semibold text-brand-deep dark:text-brand-cream">{store.metrics?.staffCount || 0} members</span>
                                    </div>
                                    <div className="flex items-center justify-between text-sm py-2 border-b border-brand-accent/5">
                                        <span className="text-brand-accent/60 dark:text-brand-cream/60">Inventory Value</span>
                                        <span className="font-semibold text-brand-deep dark:text-brand-cream">
                                            {new Intl.NumberFormat('en-NG', {
                                                style: 'currency',
                                                currency: activeBusiness?.currency || 'NGN',
                                                maximumFractionDigits: 0
                                            }).format(store.metrics?.inventoryValue || 0)}
                                        </span>
                                    </div>
                                </div>

                                <div className="mt-8 flex items-center gap-3">
                                    <Button
                                        variant="outline"
                                        onClick={() => openEdit(store)}
                                        className="flex-1 rounded-xl border-brand-accent/10 hover:bg-brand-accent/5 dark:border-white/10 dark:hover:bg-white/5 transition-all text-sm font-semibold"
                                    >
                                        <Settings2 className="w-4 h-4 mr-2" />
                                        Settings
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        onClick={() => setViewingActivities(store)}
                                        title="View Activity Feed"
                                        className="rounded-xl hover:bg-brand-green/5 text-brand-green dark:hover:bg-brand-gold/5 dark:text-brand-gold p-2 transition-all"
                                    >
                                        <ChevronRight className="w-5 h-5" />
                                    </Button>
                                </div>
                            </GlassCard>
                        </motion.div>
                    ))}

                    {/* Add More Shadow/Empty State */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: actualStores.length * 0.1 }}
                        onClick={() => setIsAddOpen(true)}
                        className="cursor-pointer group"
                    >
                        <div className="h-full min-h-[220px] rounded-[30px] border-2 border-dashed border-brand-accent/10 dark:border-white/10 flex flex-col items-center justify-center gap-4 hover:border-brand-green/40 dark:hover:border-brand-gold/40 hover:bg-white/40 dark:hover:bg-white/5 transition-all group-active:scale-[0.98]">
                            <div className="w-12 h-12 rounded-full bg-brand-accent/5 dark:bg-white/5 flex items-center justify-center text-brand-accent/40 dark:text-brand-cream/60 group-hover:bg-brand-green/10 group-hover:text-brand-green transition-all">
                                <Plus className="w-6 h-6" />
                            </div>
                            <span className="text-brand-accent/40 dark:text-brand-cream/40 font-medium group-hover:text-brand-deep dark:group-hover:text-brand-cream transition-colors">
                                Add Another Branch
                            </span>
                        </div>
                    </motion.div>
                </div>

                {/* Add/Edit Store Drawer */}
                <Drawer
                    open={isAddOpen || !!editingStore}
                    onOpenChange={(open) => {
                        if (!open) {
                            setIsAddOpen(false);
                            setEditingStore(null);
                            resetForm();
                        }
                    }}
                >
                    <DrawerContent className="h-[80vh]">
                        <DrawerStickyHeader>
                            <DrawerTitle>
                                {editingStore ? "Edit Branch" : "Add New Branch"}
                            </DrawerTitle>
                            <DrawerDescription>
                                {editingStore ? "Update details for this location." : "Expand your business with a new location."}
                            </DrawerDescription>
                        </DrawerStickyHeader>

                        <DrawerBody className="pb-6">
                            <form id="store-form" onSubmit={editingStore ? handleUpdate : handleAdd} className="space-y-5 max-w-lg mx-auto">
                                <div className="space-y-1.5">
                                    <label className={FIELD_LABEL}>Store name</label>
                                    <Input
                                        autoFocus
                                        value={newName}
                                        onChange={(e) => setNewName(e.target.value)}
                                        placeholder="e.g. Victoria Island branch"
                                    />
                                </div>

                                <div className="rounded-2xl border border-brand-deep/8 dark:border-white/10 bg-white/55 dark:bg-white/[0.04] p-4 space-y-4">
                                    <div className="space-y-1.5">
                                        <label className={FIELD_LABEL}>Street address</label>
                                        <Input
                                            value={newLocation}
                                            onChange={(e) => setNewLocation(e.target.value)}
                                            placeholder="Number, street, area, city"
                                        />
                                    </div>

                                    <div className="h-px w-full bg-brand-deep/[0.07] dark:bg-white/[0.08]" />

                                    <div className="space-y-2.5">
                                        <div className="flex items-center justify-between gap-3">
                                            <div className="flex items-center gap-2 min-w-0">
                                                <span className="shrink-0 text-[10px] font-bold uppercase tracking-widest text-brand-accent/40 dark:text-brand-cream/40 px-0.5">
                                                    Lat / long
                                                </span>
                                                <span className="shrink-0 rounded-md border border-brand-accent/12 dark:border-white/12 bg-brand-deep/[0.03] dark:bg-white/[0.04] px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-brand-accent/45 dark:text-brand-cream/45">
                                                    Optional
                                                </span>
                                            </div>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                disabled={isCapturingLocation}
                                                onClick={captureCurrentLocation}
                                                className="h-8 shrink-0 gap-1.5 rounded-lg px-2.5 text-[10px] font-bold uppercase tracking-wider text-brand-deep/75 dark:text-brand-cream/75 hover:bg-brand-deep/[0.06] dark:hover:bg-white/10"
                                            >
                                                {isCapturingLocation ? (
                                                    <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
                                                ) : (
                                                    <LocateFixed className="h-3.5 w-3.5" aria-hidden />
                                                )}
                                                {isCapturingLocation ? "Fixing…" : "Use device"}
                                            </Button>
                                        </div>
                                        <p className="text-[11px] leading-snug text-brand-accent/48 dark:text-brand-cream/42 px-0.5">
                                            For maps and catalog. Paste from Google Maps or capture GPS from this device.
                                        </p>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="space-y-1.5 min-w-0">
                                                <label className={FIELD_LABEL}>Latitude</label>
                                                <Input
                                                    inputMode="decimal"
                                                    value={newLatitude}
                                                    onChange={(e) => setNewLatitude(e.target.value)}
                                                    placeholder="9.0571"
                                                    className="tabular-nums text-sm"
                                                />
                                            </div>
                                            <div className="space-y-1.5 min-w-0">
                                                <label className={FIELD_LABEL}>Longitude</label>
                                                <Input
                                                    inputMode="decimal"
                                                    value={newLongitude}
                                                    onChange={(e) => setNewLongitude(e.target.value)}
                                                    placeholder="7.4613"
                                                    className="tabular-nums text-sm"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div className="space-y-1.5">
                                        <label className={FIELD_LABEL}>Manager name</label>
                                        <Input
                                            value={managerName}
                                            onChange={(e) => setManagerName(e.target.value)}
                                            placeholder="Full name"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className={FIELD_LABEL}>Manager phone</label>
                                        <Input
                                            value={managerPhone}
                                            onChange={(e) => setManagerPhone(e.target.value)}
                                            placeholder="Phone number"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <label className={FIELD_LABEL}>Manager email</label>
                                    <Input
                                        type="email"
                                        value={managerEmail}
                                        onChange={(e) => setManagerEmail(e.target.value)}
                                        placeholder="manager@example.com"
                                    />
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-brand-deep/6 dark:border-white/8">
                                    <div className="space-y-1.5">
                                        <label className={FIELD_LABEL}>Store contact email</label>
                                        <Input
                                            type="email"
                                            value={contactEmail}
                                            onChange={(e) => setContactEmail(e.target.value)}
                                            placeholder="branch@example.com"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className={FIELD_LABEL}>Store contact phone</label>
                                        <Input
                                            value={contactPhone}
                                            onChange={(e) => setContactPhone(e.target.value)}
                                            placeholder="Alternate line"
                                        />
                                    </div>
                                </div>

                                {editingStore && (
                                    <div className="pt-4 flex justify-center">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                deleteStore(editingStore.id);
                                                setEditingStore(null);
                                            }}
                                            className="text-xs font-bold text-danger/60 hover:text-danger hover:underline transition-all"
                                        >
                                            Remove this location from business
                                        </button>
                                    </div>
                                )}
                            </form>
                        </DrawerBody>

                        <DrawerFooter>
                            <div className="flex gap-4 max-w-lg mx-auto w-full">
                                <DrawerClose asChild>
                                    <Button variant="outline" className="flex-1 rounded-2xl h-14">Cancel</Button>
                                </DrawerClose>
                                <Button type="submit" form="store-form" className="h-14 flex-1 rounded-2xl font-semibold shadow-sm">
                                    {editingStore ? "Save Changes" : "Create Store"}
                                </Button>
                            </div>
                        </DrawerFooter>
                    </DrawerContent>
                </Drawer>

                {/* Activity Detail Drawer */}
                <Drawer
                    open={!!viewingActivities}
                    onOpenChange={(open) => !open && setViewingActivities(null)}
                >
                    <DrawerContent className="h-[80vh]">
                        <DrawerStickyHeader>
                            <DrawerTitle>
                                {viewingActivities?.name}
                            </DrawerTitle>
                            <DrawerDescription>
                                Recent activity and updates
                            </DrawerDescription>
                        </DrawerStickyHeader>

                        <div className="flex-1 overflow-y-auto p-8 pt-6 pb-12">
                            <div className="max-w-lg mx-auto space-y-8">
                                <div className="space-y-4">
                                    <h3 className="text-[10px] font-bold uppercase tracking-widest text-brand-accent/40 dark:text-brand-cream/40 ml-1">Live Feed</h3>
                                    {isLoadingActivities ? (
                                        <div className="space-y-4">
                                            <div className="h-20 bg-brand-deep/5 dark:bg-white/5 animate-pulse rounded-2xl" />
                                            <div className="h-20 bg-brand-deep/5 dark:bg-white/5 animate-pulse rounded-2xl" />
                                        </div>
                                    ) : (
                                        <ActivityStream activities={activitiesResponse?.data || []} />
                                    )}
                                </div>

                                <div className="space-y-4">
                                    <h3 className="text-[10px] font-bold uppercase tracking-widest text-brand-accent/40 dark:text-brand-cream/40 ml-1">Location Details</h3>
                                    <GlassCard className="p-6 space-y-4">
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-brand-accent/60">Branch Address</span>
                                            <span className="font-medium text-brand-deep dark:text-brand-cream">{viewingActivities?.location || "Not set"}</span>
                                        </div>
                                        {viewingActivities?.latitude != null &&
                                            viewingActivities?.longitude != null && (
                                                <div className="flex items-center justify-between text-sm">
                                                    <span className="text-brand-accent/60">Coordinates</span>
                                                    <span className="font-medium text-brand-deep dark:text-brand-cream tabular-nums">
                                                        {Number(viewingActivities.latitude).toFixed(5)},{" "}
                                                        {Number(viewingActivities.longitude).toFixed(5)}
                                                    </span>
                                                </div>
                                            )}
                                        {viewingActivities?.managerName && (
                                            <div className="flex items-center justify-between text-sm">
                                                <span className="text-brand-accent/60">Manager</span>
                                                <span className="font-medium text-brand-deep dark:text-brand-cream">{viewingActivities.managerName}</span>
                                            </div>
                                        )}
                                        {viewingActivities?.managerPhone && (
                                            <div className="flex items-center justify-between text-sm">
                                                <span className="text-brand-accent/60">Manager Phone</span>
                                                <span className="font-medium text-brand-deep dark:text-brand-cream">{viewingActivities.managerPhone}</span>
                                            </div>
                                        )}
                                        {viewingActivities?.contactEmail && (
                                            <div className="flex items-center justify-between text-sm">
                                                <span className="text-brand-accent/60">Contact Email</span>
                                                <span className="font-medium text-brand-deep dark:text-brand-cream">{viewingActivities.contactEmail}</span>
                                            </div>
                                        )}
                                    </GlassCard>
                                </div>
                            </div>
                        </div>
                    </DrawerContent>
                </Drawer>
            </div>
        </PageTransition>
    )
}
