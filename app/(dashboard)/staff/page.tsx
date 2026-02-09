"use client"

import { useState } from "react"
import { PageTransition } from "@/app/components/layout/page-transition"
import { ManagementHeader } from "@/app/components/shared/ManagementHeader"
import { ListCard } from "@/app/components/ui/list-card"
import { GlassCard } from "@/app/components/ui/glass-card"
import { Button } from "@/app/components/ui/button"
import { Input } from "@/app/components/ui/input"
import { Switch } from "@/app/components/ui/switch"
import {
    ShieldCheck,
    UserPlus,
    Search,
    Filter,
    MoreVertical,
    Mail,
    Phone,
    Shield,
    Save,
    X,
    UserCog,
    Check
} from "lucide-react"
import { cn } from "@/app/lib/utils"
import {
    Drawer,
    DrawerContent,
    DrawerStickyHeader,
    DrawerTitle,
    DrawerDescription,
    DrawerFooter,
    DrawerClose,
} from "@/app/components/ui/drawer"
import { toast } from "sonner"

// Mock Roles & Permissions based on backend
type Role = 'OWNER' | 'STAFF' | 'ACCOUNTANT'

const PERMISSIONS = [
    { id: 'VIEW_FINANCIALS', label: 'View Financials', category: 'Finance' },
    { id: 'VIEW_SALES', label: 'View Sales', category: 'Sales' },
    { id: 'RECORD_SALE', label: 'Record Sales', category: 'Sales' },
    { id: 'MANAGE_PRODUCTS', label: 'Manage Products', category: 'Operations' },
    { id: 'MANAGE_STAFF', label: 'Manage Staff', category: 'Management' },
    { id: 'RECORD_EXPENSE', label: 'Record Expenses', category: 'Finance' },
    { id: 'RECORD_REPAYMENT', label: 'Record Repayments', category: 'Finance' },
]

const initialStaff = [
    {
        id: '1',
        name: 'Blessing Okon',
        phone: '+234 801 234 5678',
        role: 'STAFF' as Role,
        status: 'Active',
        permissions: ['VIEW_SALES', 'RECORD_SALE', 'RECORD_REPAYMENT']
    },
    {
        id: '2',
        name: 'Samuel Adebayo',
        phone: '+234 802 345 6789',
        role: 'ACCOUNTANT' as Role,
        status: 'Active',
        permissions: ['VIEW_FINANCIALS', 'VIEW_SALES', 'RECORD_EXPENSE', 'RECORD_REPAYMENT']
    },
    {
        id: '3',
        name: 'Chioma Nwosu',
        phone: '+234 803 456 7890',
        role: 'STAFF' as Role,
        status: 'Pending',
        permissions: ['VIEW_SALES', 'RECORD_SALE']
    },
]

export default function StaffManagementPage() {
    const [staff, setStaff] = useState(initialStaff)
    const [searchTerm, setSearchTerm] = useState("")
    const [isDrawerOpen, setIsDrawerOpen] = useState(false)
    const [editingStaff, setEditingStaff] = useState<typeof initialStaff[0] | null>(null)

    const filteredStaff = staff.filter(s =>
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.phone.includes(searchTerm)
    )

    const handleEdit = (member: typeof initialStaff[0]) => {
        setEditingStaff(member)
        setIsDrawerOpen(true)
    }

    const handleAdd = () => {
        setEditingStaff(null)
        setIsDrawerOpen(true)
    }

    const handleSave = () => {
        toast.success(editingStaff ? "Staff updated" : "Staff added and invitation sent")
        setIsDrawerOpen(false)
    }

    return (
        <PageTransition>
            <div className="max-w-5xl mx-auto space-y-8">
                <ManagementHeader
                    title="Staff Management"
                    description="Assign roles and manage permissions for your team members."
                    searchValue={searchTerm}
                    onSearchChange={setSearchTerm}
                    searchPlaceholder="Search staff by name or phone..."
                    addButtonLabel="Add Staff Member"
                    onAddClick={handleAdd}
                />

                <div className="grid grid-cols-1 gap-4">
                    {filteredStaff.map((member, index) => (
                        <ListCard
                            key={member.id}
                            title={member.name}
                            subtitle={member.phone}
                            status={member.role}
                            statusColor={member.role === 'ACCOUNTANT' ? "warning" : "neutral"}
                            meta={member.status === 'Pending' ? "Invitation pending" : undefined}
                            value={member.status}
                            valueLabel="Status"
                            onClick={() => handleEdit(member)}
                            delay={index * 0.05}
                        />
                    ))}

                    {filteredStaff.length === 0 && (
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
                                            defaultValue={editingStaff?.name}
                                            className="h-12 rounded-xl border-brand-deep/5 bg-white/50 dark:bg-white/5"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-brand-deep dark:text-brand-cream pl-1">WhatsApp Number</label>
                                        <div className="relative">
                                            <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-accent/40" />
                                            <Input
                                                placeholder="+234..."
                                                defaultValue={editingStaff?.phone}
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
                                    {['STAFF', 'ACCOUNTANT'].map((role) => (
                                        <button
                                            key={role}
                                            onClick={() => editingStaff && setEditingStaff({ ...editingStaff, role: role as Role })}
                                            className={cn(
                                                "p-4 rounded-3xl cursor-pointer border transition-all text-left group active:scale-95",
                                                (editingStaff?.role || 'STAFF') === role
                                                    ? "bg-brand-deep text-brand-gold border-brand-deep shadow-lg"
                                                    : "bg-white/50 dark:bg-white/5 border-brand-deep/5 hover:border-brand-deep/20"
                                            )}
                                        >
                                            <div className={cn(
                                                "w-10 h-10 rounded-xl mb-3 flex items-center justify-center transition-colors",
                                                (editingStaff?.role || 'STAFF') === role ? "bg-brand-gold text-brand-deep" : "bg-brand-deep/5 text-brand-accent/40 dark:text-white/40"
                                            )}>
                                                {role === 'ACCOUNTANT' ? <Shield className="w-5 h-5" /> : <UserCog className="w-5 h-5" />}
                                            </div>
                                            <div className="font-bold text-sm tracking-wide">{role}</div>
                                            <div className={cn(
                                                "text-[10px] mt-1 opacity-60 text-sm truncate",
                                                (editingStaff?.role || 'STAFF') === role ? "text-brand-gold" : "text-brand-accent dark:text-white/80"
                                            )}>
                                                {role === 'ACCOUNTANT'
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
                                                defaultChecked={editingStaff?.permissions.includes(perm.id) || (editingStaff?.role === 'ACCOUNTANT')}
                                            />
                                        </div>
                                    ))}
                                </GlassCard>
                            </section>
                        </div>

                        <DrawerFooter className="p-8 border-t border-brand-deep/5 dark:border-white/5 bg-brand-cream/40 dark:bg-black/20 backdrop-blur-md">
                            <div className="max-w-lg mx-auto w-full flex gap-3">
                                <DrawerClose asChild>
                                    <Button variant="outline" className="flex-1 h-12 rounded-xl border-brand-accent/10">
                                        Cancel
                                    </Button>
                                </DrawerClose>
                                <Button
                                    onClick={handleSave}
                                    className="flex-2 h-12 rounded-xl bg-brand-deep text-brand-gold dark:bg-brand-gold dark:text-brand-deep dark:hover:bg-brand-gold/80 font-bold px-8 shadow-xl hover:scale-[1.02] transition-all"
                                >
                                    <Save className="w-4 h-4 mr-2" />
                                    {editingStaff ? "Save Changes" : "Send Invite"}
                                </Button>
                            </div>
                        </DrawerFooter>
                    </DrawerContent>
                </Drawer>
            </div>
        </PageTransition>
    )
}
