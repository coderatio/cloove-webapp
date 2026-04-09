"use client"

import { useState, useEffect } from "react"
import { PageTransition } from "@/app/components/layout/page-transition"
import { ManagementHeader } from "@/app/components/shared/ManagementHeader"
import { StaffCard } from "@/app/domains/staff/components/StaffCard"
import { GlassCard } from "@/app/components/ui/glass-card"
import { Button } from "@/app/components/ui/button"
import { Input } from "@/app/components/ui/input"
import { Switch } from "@/app/components/ui/switch"
import {
    Search,
    Phone,
    Mail,
    Shield,
    Save,
    UserCog,
    Trash2,
    Loader2
} from "lucide-react"
import { cn } from "@/app/lib/utils"
import { ConfirmDialog } from "@/app/components/shared/ConfirmDialog"
import {
    Drawer,
    DrawerContent,
    DrawerStickyHeader,
    DrawerTitle,
    DrawerDescription,
    DrawerFooter,
    DrawerClose,
} from "@/app/components/ui/drawer"
import { PERMISSIONS, Role } from "../data/staffMocks"
import { useStaff, type StaffMember } from "../hooks/useStaff"
import { useStores } from "@/app/domains/stores/providers/StoreProvider"
import { usePermission } from "@/app/hooks/usePermission"
import { usePresetPageCopy } from "@/app/domains/workspace/hooks/usePresetPageCopy"
import { DepartmentsPanel } from "./DepartmentsPanel"
import Link from "next/link"

export function StaffView() {
    const pageCopy = usePresetPageCopy()
    const { canInviteStaff, loading: permissionLoading } = usePermission()
    const { staff, isLoading, inviteStaff, updateStaff, removeStaff, resendInvite } = useStaff()
    const [searchTerm, setSearchTerm] = useState("")
    const [isDrawerOpen, setIsDrawerOpen] = useState(false)
    const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null)
    const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false)

    // Form State
    const [fullName, setFullName] = useState("")
    const [email, setEmail] = useState("")
    const [phoneNumber, setPhoneNumber] = useState("")
    const [role, setRole] = useState<Role>('STAFF')
    const [permissions, setPermissions] = useState<Record<string, boolean>>({})
    const [selectedStoreIds, setSelectedStoreIds] = useState<string[]>([])
    const [isSaving, setIsSaving] = useState(false)

    const { stores } = useStores()

    useEffect(() => {
        if (!isDrawerOpen) return

        if (editingStaff) {
            setFullName(editingStaff.user.fullName)
            setEmail(editingStaff.user.email || "")
            setPhoneNumber(editingStaff.user.phoneNumber)
            setRole(editingStaff.role)
            setPermissions(editingStaff.permissions || {})
            setSelectedStoreIds(editingStaff.stores?.map(s => s.id) || [])
        } else {
            setFullName("")
            setEmail("")
            setPhoneNumber("")
            setRole('STAFF')
            setPermissions({})
            setSelectedStoreIds([])
        }
    }, [isDrawerOpen, editingStaff])

    const filteredStaff = staff?.filter(s =>
        (s.user.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
        (s.user.phoneNumber?.includes(searchTerm) || false)
    ) || []

    const handleEdit = (member: StaffMember) => {
        setEditingStaff(member)
        setIsDrawerOpen(true)
    }

    const handleAdd = () => {
        if (!canInviteStaff()) return
        setEditingStaff(null)
        setIsDrawerOpen(true)
    }

    const showAddStaff = !permissionLoading && canInviteStaff()

    const handleSave = async () => {
        setIsSaving(true)
        try {
            if (editingStaff) {
                await updateStaff(editingStaff.userId, { role, permissions, storeIds: selectedStoreIds })
            } else {
                await inviteStaff({ fullName, email, phoneNumber, role, permissions, storeIds: selectedStoreIds })
            }
            setIsDrawerOpen(false)
        } catch (error) {
            // Error is handled by the mutation's onError
        } finally {
            setIsSaving(false)
        }
    }

    const handleRemove = async () => {
        if (!editingStaff) return
        setIsConfirmDialogOpen(true)
    }

    const confirmRemove = async () => {
        if (!editingStaff) return
        setIsSaving(true)
        try {
            await removeStaff(editingStaff.userId)
            setIsDrawerOpen(false)
        } catch (error) {
            // Error is handled by the mutation's onError
        } finally {
            setIsSaving(false)
        }
    }

    const handleResendInvite = async () => {
        if (!editingStaff) return
        setIsSaving(true)
        await resendInvite(editingStaff.userId)
        setIsSaving(false)
        setIsDrawerOpen(false)
    }

    const togglePermission = (permId: string) => {
        setPermissions(prev => ({
            ...prev,
            [permId]: !prev[permId]
        }))
    }

    const toggleStore = (storeId: string) => {
        setSelectedStoreIds(prev =>
            prev.includes(storeId)
                ? prev.filter(id => id !== storeId)
                : [...prev, storeId]
        )
    }

    return (
        <PageTransition>
            <div className="max-w-5xl mx-auto space-y-8">
                <ManagementHeader
                    title={pageCopy.staff.title}
                    description={pageCopy.staff.description}
                    searchValue={searchTerm}
                    onSearchChange={setSearchTerm}
                    searchPlaceholder="Search staff by name or phone..."
                    {...(showAddStaff
                        ? { addButtonLabel: "Add Staff Member" as const, onAddClick: handleAdd }
                        : {})}
                />

                {!permissionLoading && !showAddStaff && (
                    <div className="rounded-2xl border border-amber-500/25 bg-amber-500/5 dark:bg-amber-500/10 px-4 py-3 text-sm text-brand-deep dark:text-brand-cream/90">
                        You can&apos;t add more staff on your current plan{" "}
                        <span className="opacity-70">(limit reached or staff not included).</span>{" "}
                        <Link
                            href="/settings?tab=billing"
                            className="font-semibold text-brand-gold underline-offset-2 hover:underline"
                        >
                            Upgrade in Billing
                        </Link>{" "}
                        to invite more team members.
                    </div>
                )}

                <div className="grid grid-cols-1 gap-4">
                    {isLoading ? (
                        <div className="p-12 text-center text-brand-accent/40">Loading staff...</div>
                    ) : (
                        filteredStaff.map((member, index) => (
                            <StaffCard
                                key={member.id}
                                member={member}
                                onClick={member.role !== 'OWNER' ? () => handleEdit(member) : undefined}
                                delay={index * 0.05}
                            />
                        ))
                    )}

                    {!isLoading && filteredStaff.length === 0 && (
                        <GlassCard className="p-12 text-center space-y-4">
                            <div className="mx-auto w-16 h-16 rounded-full bg-brand-deep/5 flex items-center justify-center">
                                <Search className="w-8 h-8 text-brand-accent/20" />
                            </div>
                            <div>
                                <h3 className="text-lg font-medium text-brand-deep dark:text-brand-cream">No staff found</h3>
                                <p className="text-brand-accent/60 dark:text-brand-cream/60">Try adjusting your search or add a new team member.</p>
                            </div>
                        </GlassCard>
                    )}
                </div>

                {/* Departments */}
                <DepartmentsPanel />

                {/* Staff Editor Drawer */}
                <Drawer open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
                    <DrawerContent>
                        <DrawerStickyHeader>
                            <DrawerTitle>{editingStaff ? "Edit Staff" : "Add Staff"}</DrawerTitle>
                            <DrawerDescription>
                                {editingStaff ? "Review and update roles or specific permissions." : "Invite a new team member via their WhatsApp number."}
                            </DrawerDescription>
                        </DrawerStickyHeader>

                        <div className="flex-1 overflow-y-auto p-8 space-y-8">
                            {/* Basic Info */}
                            <section className="space-y-4">
                                <h3 className="text-xs font-bold uppercase tracking-widest text-brand-accent/40 dark:text-brand-cream/40">Basic Information</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-brand-deep dark:text-brand-cream pl-1">Full Name</label>
                                        <Input
                                            placeholder="e.g. Blessing Okon"
                                            value={fullName}
                                            onChange={(e) => setFullName(e.target.value)}
                                            disabled={!!editingStaff}
                                            className="h-12 rounded-xl border-brand-deep/5 bg-white/50 dark:bg-white/5"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-brand-deep dark:text-brand-cream pl-1">Email Address</label>
                                        <div className="relative">
                                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-accent/40" />
                                            <Input
                                                type="email"
                                                placeholder="e.g. blessing@example.com"
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                disabled={!!editingStaff}
                                                className="h-12 pl-12 rounded-xl border-brand-deep/5 bg-white/50 dark:bg-white/5"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-brand-deep dark:text-brand-cream pl-1">WhatsApp Number</label>
                                        <div className="relative">
                                            <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-accent/40" />
                                            <Input
                                                placeholder="+234..."
                                                value={phoneNumber}
                                                onChange={(e) => setPhoneNumber(e.target.value)}
                                                disabled={!!editingStaff}
                                                className="h-12 pl-12 rounded-xl border-brand-deep/5 bg-white/50 dark:bg-white/5"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </section>

                            {/* Role Selection */}
                            <section className="space-y-4">
                                <h3 className="text-xs font-bold uppercase tracking-widest text-brand-accent/40 dark:text-brand-cream/40">Primary Role</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                    {['STAFF', 'ACCOUNTANT'].map((r) => (
                                        <button
                                            key={r}
                                            onClick={() => setRole(r as Role)}
                                            className={cn(
                                                "p-4 rounded-3xl cursor-pointer border transition-all text-left group active:scale-95",
                                                role === r
                                                    ? "bg-brand-deep text-brand-gold border-brand-deep shadow-lg"
                                                    : "bg-white/50 dark:bg-white/5 border-brand-deep/5 hover:border-brand-deep/20"
                                            )}
                                        >
                                            <div className={cn(
                                                "w-10 h-10 rounded-xl mb-3 flex items-center justify-center transition-colors",
                                                role === r ? "bg-brand-gold text-brand-deep" : "bg-brand-deep/5 text-brand-accent/40 dark:text-white/40"
                                            )}>
                                                {r === 'ACCOUNTANT' ? <Shield className="w-5 h-5" /> : <UserCog className="w-5 h-5" />}
                                            </div>
                                            <div className="font-bold text-sm tracking-wide">{r}</div>
                                            <div className={cn(
                                                "text-[10px] mt-1 opacity-60 text-sm truncate",
                                                role === r ? "text-brand-gold" : "text-brand-accent dark:text-white/80"
                                            )}>
                                                {r === 'ACCOUNTANT'
                                                    ? "Full access to financials and expenses."
                                                    : "Focused on sales and daily operations."}
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </section>

                            {/* Permission Toggles */}
                            <section className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-xs font-bold uppercase tracking-widest text-brand-accent/40 dark:text-white/40">Specific Permissions</h3>
                                    <span className="text-[10px] font-bold text-brand-gold bg-brand-gold/10 px-2 py-0.5 rounded-full uppercase tracking-widest">Advanced</span>
                                </div>

                                <GlassCard className="divide-y divide-brand-deep/5 dark:divide-white/5 p-0 overflow-hidden">
                                    {PERMISSIONS.map((perm) => (
                                        <div key={perm.id} className="p-4 flex items-center justify-between hover:bg-brand-cream/20 dark:hover:bg-white/5 transition-colors">
                                            <div className="flex flex-col gap-0.5">
                                                <span className="font-medium text-brand-deep dark:text-brand-cream">{perm.label}</span>
                                                <span className="text-[10px] text-brand-accent/40 dark:text-white/40 font-bold uppercase tracking-wider">{perm.category}</span>
                                            </div>
                                            <Switch
                                                checked={permissions[perm.id] || false}
                                                onCheckedChange={() => togglePermission(perm.id)}
                                            />
                                        </div>
                                    ))}
                                </GlassCard>
                            </section>

                            {/* Store Access Selection */}
                            {stores.length > 1 && (
                                <section className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-xs font-bold uppercase tracking-widest text-brand-accent/40 dark:text-white/40">Store Access</h3>
                                        <span className="text-[10px] font-bold text-brand-gold bg-brand-gold/10 px-2 py-0.5 rounded-full uppercase tracking-widest">Multi-Store</span>
                                    </div>

                                    <GlassCard className="divide-y divide-brand-deep/5 dark:divide-white/5 p-0 overflow-hidden">
                                        {stores.map((store) => (
                                            <div key={store.id} className="p-4 flex items-center justify-between hover:bg-brand-cream/20 dark:hover:bg-white/5 transition-colors">
                                                <div className="flex flex-col gap-0.5">
                                                    <span className="font-medium text-brand-deep dark:text-brand-cream">{store.name}</span>
                                                    <span className="text-[10px] text-brand-accent/40 dark:text-white/40 font-bold uppercase tracking-wider">{store.location || 'No location set'}</span>
                                                </div>
                                                <Switch
                                                    checked={selectedStoreIds.includes(store.id)}
                                                    onCheckedChange={() => toggleStore(store.id)}
                                                />
                                            </div>
                                        ))}
                                    </GlassCard>
                                    <p className="text-[10px] text-brand-accent/60 dark:text-white/40 italic">
                                        Note: If no stores are selected, the staff member will have access to all stores by default.
                                    </p>
                                </section>
                            )}
                        </div>

                        <DrawerFooter className="p-8 border-t border-brand-deep/5 dark:border-white/5 bg-brand-cream/40 dark:bg-black/20 backdrop-blur-md">
                            <div className="max-w-lg mx-auto w-full flex flex-col gap-3">
                                <div className="flex gap-3">
                                    <DrawerClose asChild>
                                        <Button variant="outline" className="flex-1 h-12 rounded-xl border-brand-accent/10">
                                            Cancel
                                        </Button>
                                    </DrawerClose>
                                    <Button
                                        onClick={handleSave}
                                        disabled={isSaving || !fullName || !phoneNumber}
                                        className="flex-2 h-12 rounded-xl bg-brand-deep text-brand-gold dark:bg-brand-gold dark:text-brand-deep dark:hover:bg-brand-gold/80 font-bold px-8 shadow-xl hover:scale-[1.02] transition-all"
                                    >
                                        {isSaving ? (
                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        ) : (
                                            <Save className="w-4 h-4 mr-2" />
                                        )}
                                        {editingStaff ? "Save Changes" : "Send Invite"}
                                    </Button>
                                </div>
                                {editingStaff && (
                                    <div className="flex flex-col gap-2">
                                        {editingStaff.status === 'PENDING' && (
                                            <Button
                                                onClick={handleResendInvite}
                                                disabled={isSaving}
                                                variant="outline"
                                                className="w-full h-12 rounded-xl text-brand-gold border-brand-gold/20 hover:bg-brand-gold/5 font-bold"
                                            >
                                                Resend Invitation
                                            </Button>
                                        )}
                                        <Button
                                            onClick={handleRemove}
                                            disabled={isSaving}
                                            variant="ghost"
                                            className="w-full h-12 rounded-xl text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 font-bold"
                                        >
                                            <Trash2 className="w-4 h-4 mr-2" />
                                            Remove Staff
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </DrawerFooter>
                    </DrawerContent>
                </Drawer>
            </div>

            <ConfirmDialog
                open={isConfirmDialogOpen}
                onOpenChange={setIsConfirmDialogOpen}
                onConfirm={confirmRemove}
                title="Remove Staff Member"
                description={`Are you sure you want to remove ${editingStaff?.user.fullName}? This action cannot be undone and they will lose all access immediately.`}
                confirmText="Remove Staff"
                variant="destructive"
                isLoading={isSaving}
            />
        </PageTransition>
    )
}
