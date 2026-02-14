"use client"

import { useState } from "react"
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
} from "lucide-react"
import { Button } from "@/app/components/ui/button"
import { ActivityStream } from "@/app/components/dashboard/ActivityStream"
import { TableSearch } from "@/app/components/shared/TableSearch"
import {
    Drawer,
    DrawerContent,
    DrawerStickyHeader,
    DrawerTitle,
    DrawerDescription,
    DrawerClose,
} from "@/app/components/ui/drawer"
import {
    useStores,
    useStoreActivities,
} from "@/app/domains/stores/providers/StoreProvider"

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
    const [managerName, setManagerName] = useState("")
    const [managerPhone, setManagerPhone] = useState("")
    const [managerEmail, setManagerEmail] = useState("")
    const [contactEmail, setContactEmail] = useState("")
    const [contactPhone, setContactPhone] = useState("")

    const handleAdd = (e: React.FormEvent) => {
        e.preventDefault()
        if (newName.trim()) {
            addStore({
                name: newName,
                location: newLocation,
                managerName,
                managerPhone,
                managerEmail,
                contactEmail,
                contactPhone
            })
            resetForm()
            setIsAddOpen(false)
        }
    }

    const resetForm = () => {
        setNewName("")
        setNewLocation("")
        setManagerName("")
        setManagerPhone("")
        setManagerEmail("")
        setContactEmail("")
        setContactPhone("")
    }

    const handleUpdate = (e: React.FormEvent) => {
        e.preventDefault()
        if (editingStore && newName.trim()) {
            updateStore(editingStore.id, {
                name: newName,
                location: newLocation,
                managerName,
                managerPhone,
                managerEmail,
                contactEmail,
                contactPhone
            })
            setEditingStore(null)
            resetForm()
        }
    }

    const openEdit = (store: any) => {
        setEditingStore(store)
        setNewName(store.name)
        setNewLocation(store.location || "")
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
            <div className="max-w-5xl mx-auto space-y-8 pb-10">
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
                        className="rounded-full bg-brand-deep text-brand-gold dark:bg-brand-gold dark:text-brand-deep dark:hover:bg-brand-gold/80 hover:scale-105 transition-all shadow-lg"
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
                                            <div className="flex items-center gap-1.5 text-xs text-brand-accent/60 dark:text-brand-cream/60">
                                                <MapPin className="w-3 h-3" />
                                                <span>{store.location || "Location not set"}</span>
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
                    <DrawerContent>
                        <div className="p-8 pb-12">
                            <div className="space-y-6 max-w-lg mx-auto">
                                <div className="text-center space-y-2">
                                    <DrawerTitle>
                                        {editingStore ? "Edit Branch" : "Add New Branch"}
                                    </DrawerTitle>
                                    <DrawerDescription>
                                        {editingStore ? "Update details for this location." : "Expand your business with a new location."}
                                    </DrawerDescription>
                                </div>

                                <form onSubmit={editingStore ? handleUpdate : handleAdd} className="space-y-6">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold uppercase tracking-widest text-brand-accent/40 dark:text-brand-cream/40 ml-1">Store Name</label>
                                        <input
                                            autoFocus
                                            value={newName}
                                            onChange={(e) => setNewName(e.target.value)}
                                            placeholder="e.g. Victoria Island Branch"
                                            className="w-full px-6 py-4 rounded-2xl bg-white dark:bg-white/5 border border-brand-deep/5 dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-brand-green/20 focus:border-brand-green/30 transition-all text-brand-deep dark:text-brand-cream"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold uppercase tracking-widest text-brand-accent/40 dark:text-brand-cream/40 ml-1">Location</label>
                                        <input
                                            value={newLocation}
                                            onChange={(e) => setNewLocation(e.target.value)}
                                            placeholder="e.g. 15 Admiralty Way, Lekki"
                                            className="w-full px-6 py-4 rounded-2xl bg-white dark:bg-white/5 border border-brand-deep/5 dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-brand-green/20 focus:border-brand-green/30 transition-all text-brand-deep dark:text-brand-cream"
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold uppercase tracking-widest text-brand-accent/40 dark:text-brand-cream/40 ml-1">Manager Name</label>
                                            <input
                                                value={managerName}
                                                onChange={(e) => setManagerName(e.target.value)}
                                                placeholder="Assign a manager"
                                                className="w-full px-6 py-4 rounded-2xl bg-white dark:bg-white/5 border border-brand-deep/5 dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-brand-green/20 focus:border-brand-green/30 transition-all text-brand-deep dark:text-brand-cream"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold uppercase tracking-widest text-brand-accent/40 dark:text-brand-cream/40 ml-1">Manager Phone</label>
                                            <input
                                                value={managerPhone}
                                                onChange={(e) => setManagerPhone(e.target.value)}
                                                placeholder="Manager contact #"
                                                className="w-full px-6 py-4 rounded-2xl bg-white dark:bg-white/5 border border-brand-deep/5 dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-brand-green/20 focus:border-brand-green/30 transition-all text-brand-deep dark:text-brand-cream"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-xs font-bold uppercase tracking-widest text-brand-accent/40 dark:text-brand-cream/40 ml-1">Manager Email</label>
                                        <input
                                            value={managerEmail}
                                            onChange={(e) => setManagerEmail(e.target.value)}
                                            placeholder="manager@example.com"
                                            className="w-full px-6 py-4 rounded-2xl bg-white dark:bg-white/5 border border-brand-deep/5 dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-brand-green/20 focus:border-brand-green/30 transition-all text-brand-deep dark:text-brand-cream"
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-brand-deep/5 dark:border-white/5">
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold uppercase tracking-widest text-brand-accent/40 dark:text-brand-cream/40 ml-1">Contact Email</label>
                                            <input
                                                value={contactEmail}
                                                onChange={(e) => setContactEmail(e.target.value)}
                                                placeholder="Store email"
                                                className="w-full px-6 py-4 rounded-2xl bg-white dark:bg-white/5 border border-brand-deep/5 dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-brand-green/20 focus:border-brand-green/30 transition-all text-brand-deep dark:text-brand-cream"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold uppercase tracking-widest text-brand-accent/40 dark:text-brand-cream/40 ml-1">Contact Phone</label>
                                            <input
                                                value={contactPhone}
                                                onChange={(e) => setContactPhone(e.target.value)}
                                                placeholder="Secondary contact"
                                                className="w-full px-6 py-4 rounded-2xl bg-white dark:bg-white/5 border border-brand-deep/5 dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-brand-green/20 focus:border-brand-green/30 transition-all text-brand-deep dark:text-brand-cream"
                                            />
                                        </div>
                                    </div>

                                    <div className="flex gap-4 pt-4">
                                        <DrawerClose asChild>
                                            <Button variant="outline" className="flex-1 rounded-2xl h-14">Cancel</Button>
                                        </DrawerClose>
                                        <Button type="submit" className="flex-1 rounded-2xl h-14 bg-brand-deep text-brand-gold dark:bg-brand-gold dark:text-brand-deep font-bold shadow-xl">
                                            {editingStore ? "Save Changes" : "Create Store"}
                                        </Button>
                                    </div>
                                </form>

                                {editingStore && (
                                    <div className="pt-4 flex justify-center">
                                        <button
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
                            </div>
                        </div>
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
