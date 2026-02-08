"use client"

import * as React from 'react'
import DataTable from '../components/DataTable'
import { useIsMobile } from '../hooks/useMediaQuery'
import { PageTransition } from '../components/layout/page-transition'
import { ListCard } from '../components/ui/list-card'
import { GlassCard } from '../components/ui/glass-card'
import { AlertCircle, Users, Trash2 } from 'lucide-react'
import { cn } from '@/app/lib/utils'
import { ManagementHeader } from '../components/shared/ManagementHeader'
import { InsightWhisper } from '../components/dashboard/InsightWhisper'
import { Button } from '../components/ui/button'
import { FilterPopover } from '../components/shared/FilterPopover'
import { TableSearch } from '../components/shared/TableSearch'
import {
    Drawer,
    DrawerContent,
    DrawerStickyHeader,
    DrawerTitle,
    DrawerDescription,
    DrawerClose,
} from "../components/ui/drawer"

const initialCustomers = [
    { id: '1', name: 'Mrs. Adebayo', orders: 12, totalSpent: '₦156,000', lastOrder: 'Today', owing: '₦15,000' },
    { id: '2', name: 'Chief Okonkwo', orders: 8, totalSpent: '₦89,500', lastOrder: 'Yesterday', owing: '₦8,500' },
    { id: '3', name: 'Fatima Shop', orders: 15, totalSpent: '₦234,000', lastOrder: 'Today', owing: '₦5,000' },
    { id: '4', name: 'Blessing Stores', orders: 6, totalSpent: '₦54,200', lastOrder: 'Feb 5', owing: '—' },
    { id: '5', name: 'Mama Tunde', orders: 4, totalSpent: '₦32,800', lastOrder: 'Feb 3', owing: '—' },
    { id: '6', name: 'Grace Fashion', orders: 9, totalSpent: '₦118,500', lastOrder: 'Feb 1', owing: '—' },
]

export default function CustomersPage() {
    const isMobile = useIsMobile()
    const [customers, setCustomers] = React.useState(initialCustomers)
    const [search, setSearch] = React.useState("")
    const [selectedFilters, setSelectedFilters] = React.useState<string[]>([])
    const [isAddOpen, setIsAddOpen] = React.useState(false)
    const [editingItem, setEditingItem] = React.useState<any>(null)

    const filterGroups = [
        {
            title: "Account Status",
            options: [
                { label: "Has Debt", value: "owing" },
                { label: "Up to Date", value: "clean" },
            ]
        }
    ]

    // Form states
    const [formData, setFormData] = React.useState({ name: "", owing: "—" })

    const owingCustomers = customers.filter(c => c.owing !== '—').length
    const totalDebt = customers.reduce((acc, curr) => {
        if (curr.owing === '—') return acc
        const val = parseInt(curr.owing.replace(/[^0-9]/g, '')) || 0
        return acc + val
    }, 0)

    const filteredCustomers = customers.filter(c => {
        const matchesSearch = c.name.toLowerCase().includes(search.toLowerCase())
        const isOwing = c.owing !== '—'
        const matchesFilter = selectedFilters.length === 0 ||
            (selectedFilters.includes("owing") && isOwing) ||
            (selectedFilters.includes("clean") && !isOwing)
        return matchesSearch && matchesFilter
    })

    const handleAdd = (e: React.FormEvent) => {
        e.preventDefault()
        const newItem = {
            id: Math.random().toString(36).substr(2, 9),
            name: formData.name,
            owing: formData.owing || "—",
            orders: 0,
            totalSpent: "₦0",
            lastOrder: "Never"
        }
        setCustomers([newItem, ...customers])
        setIsAddOpen(false)
        setFormData({ name: "", owing: "—" })
    }

    const handleUpdate = (e: React.FormEvent) => {
        e.preventDefault()
        setCustomers(customers.map(c =>
            c.id === editingItem.id ? { ...c, ...formData } : c
        ))
        setEditingItem(null)
        setFormData({ name: "", owing: "—" })
    }

    const handleDelete = (id: string) => {
        setCustomers(customers.filter(c => c.id !== id))
        setEditingItem(null)
    }

    const columns: any[] = [
        {
            key: 'name',
            header: 'Customer',
            render: (value: string) => <span className="font-serif font-medium text-brand-deep dark:text-brand-cream text-base">{value}</span>
        },
        { key: 'orders', header: 'Orders' },
        { key: 'totalSpent', header: 'Total Spent' },
        { key: 'lastOrder', header: 'Last Order' },
        {
            key: 'owing',
            header: 'Owing',
            render: (value: string) => (
                <span className={cn(
                    "font-medium px-2 py-0.5 rounded-full text-xs inline-flex items-center gap-1.5",
                    value !== '—' ? "bg-brand-gold/10 text-brand-deep dark:text-brand-gold border border-brand-gold/20" : "text-brand-accent/30"
                )}>
                    {value !== '—' && <div className="w-1.5 h-1.5 rounded-full bg-brand-gold animate-pulse" />}
                    {value}
                </span>
            )
        },
    ]

    const intelligenceWhisper = owingCustomers > 0
        ? `There are **${owingCustomers} customers** with unpaid debts totaling **₦${totalDebt.toLocaleString()}**. Consider sending friendly reminders.`
        : `All customers are up to date with their payments. Your credit health is looking excellent.`

    return (
        <PageTransition>
            <div className="max-w-4xl mx-auto space-y-8 pb-24">
                <ManagementHeader
                    title="Customers"
                    description="Manage your relationships, track sales history, and stay on top of overdue payments."
                    addButtonLabel="Add Customer"
                    onAddClick={() => {
                        setFormData({ name: "", owing: "—" })
                        setIsAddOpen(true)
                    }}
                />

                <InsightWhisper insight={intelligenceWhisper} />

                {/* Stats Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <GlassCard className="p-5 flex items-center gap-4 relative overflow-hidden group">
                        <div className="absolute right-0 top-0 p-3 opacity-5 group-hover:opacity-10 transition-opacity">
                            <Users className="w-24 h-24" />
                        </div>
                        <div className="h-12 w-12 rounded-full bg-brand-green/10 dark:bg-brand-green/20 flex items-center justify-center text-brand-deep dark:text-brand-cream">
                            <Users className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-brand-accent/40 uppercase tracking-wider">Total Customers</p>
                            <p className="text-2xl font-serif font-medium text-brand-deep dark:text-brand-cream">{customers.length}</p>
                        </div>
                    </GlassCard>

                    <GlassCard className={cn(
                        "p-5 flex items-center gap-4 relative overflow-hidden group transition-all",
                        owingCustomers > 0 ? "border-brand-gold/30 bg-brand-gold/5" : "border-brand-deep/5"
                    )}>
                        <div className="absolute right-0 top-0 p-3 opacity-5 group-hover:opacity-10 transition-opacity text-brand-gold">
                            <AlertCircle className="w-24 h-24" />
                        </div>
                        <div className="h-12 w-12 rounded-full bg-brand-gold/10 flex items-center justify-center text-brand-gold">
                            <AlertCircle className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-brand-gold/60 uppercase tracking-wider">Payments Pending</p>
                            <div className="flex items-baseline gap-2">
                                <p className="text-2xl font-serif font-medium text-brand-deep dark:text-brand-gold">{owingCustomers}</p>
                                <span className="text-sm text-brand-accent/40">₦{totalDebt.toLocaleString()} due</span>
                            </div>
                        </div>
                    </GlassCard>
                </div>

                {/* Main Content */}
                <div className="space-y-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand-accent/40 dark:text-white/30 ml-1">Relationship List</p>

                        <div className="flex items-center gap-3 font-sans">
                            <TableSearch
                                value={search}
                                onChange={setSearch}
                                placeholder="Search by name..."
                            />
                            <FilterPopover
                                groups={filterGroups}
                                selectedValues={selectedFilters}
                                onSelectionChange={setSelectedFilters}
                                onClear={() => setSelectedFilters([])}
                            />
                        </div>
                    </div>
                </div>

                {isMobile ? (
                    <div className="space-y-3">
                        {filteredCustomers.map((customer, index) => (
                            <ListCard
                                key={customer.id}
                                title={customer.name}
                                subtitle={`${customer.orders} orders • Last: ${customer.lastOrder}`}
                                status={customer.owing !== '—' ? 'Owing' : undefined}
                                statusColor={customer.owing !== '—' ? 'warning' : undefined}
                                value={customer.owing !== '—' ? customer.owing : customer.totalSpent}
                                valueLabel={customer.owing !== '—' ? 'Debt' : 'Total Spent'}
                                delay={index * 0.05}
                                onClick={() => {
                                    setFormData({ name: customer.name, owing: customer.owing })
                                    setEditingItem(customer)
                                }}
                            />
                        ))}
                    </div>
                ) : (
                    <GlassCard className="overflow-hidden border-brand-deep/5 dark:border-white/5">
                        <DataTable
                            columns={columns}
                            data={filteredCustomers}
                            emptyMessage="No customers found"
                            onRowClick={(item) => {
                                setFormData({ name: item.name, owing: item.owing })
                                setEditingItem(item)
                            }}
                        />
                    </GlassCard>
                )}

                {/* Add/Edit Drawer */}
                <Drawer
                    open={isAddOpen || !!editingItem}
                    onOpenChange={(open) => {
                        if (!open) {
                            setIsAddOpen(false);
                            setEditingItem(null);
                        }
                    }}
                >
                    <DrawerContent>
                        <DrawerStickyHeader>
                            <DrawerTitle>{editingItem ? "Edit Profile" : "Add New Customer"}</DrawerTitle>
                            <DrawerDescription>
                                {editingItem ? "Update customer information and debt records." : "Start a new business relationship."}
                            </DrawerDescription>
                        </DrawerStickyHeader>

                        <div className="p-8 pb-12 overflow-y-auto">
                            <form onSubmit={editingItem ? handleUpdate : handleAdd} className="max-w-lg mx-auto space-y-6">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase tracking-widest text-brand-accent/40 dark:text-white/30 ml-1">Customer Name</label>
                                    <input
                                        autoFocus
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        placeholder="e.g. Mrs. Adebayo"
                                        className="w-full px-6 py-4 rounded-2xl bg-white dark:bg-white/5 border border-brand-deep/5 dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-brand-green/20 text-brand-deep dark:text-brand-cream"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase tracking-widest text-brand-accent/40 dark:text-white/30 ml-1">Current Debt (₦)</label>
                                    <input
                                        value={formData.owing}
                                        onChange={(e) => setFormData({ ...formData, owing: e.target.value })}
                                        placeholder="— or e.g. ₦5,000"
                                        className="w-full px-6 py-4 rounded-2xl bg-white dark:bg-white/5 border border-brand-deep/5 dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-brand-green/20 text-brand-deep dark:text-brand-cream"
                                    />
                                </div>

                                <div className="flex gap-4 pt-6">
                                    <DrawerClose asChild>
                                        <Button variant="outline" className="flex-1 rounded-2xl h-14">Cancel</Button>
                                    </DrawerClose>
                                    <Button type="submit" className="flex-1 rounded-2xl h-14 bg-brand-deep text-brand-gold dark:bg-brand-gold dark:text-brand-deep font-bold shadow-xl">
                                        {editingItem ? "Save Changes" : "Create Customer"}
                                    </Button>
                                </div>

                                {editingItem && (
                                    <div className="pt-6 border-t border-brand-deep/5 dark:border-white/5 mt-6">
                                        <button
                                            type="button"
                                            onClick={() => handleDelete(editingItem.id)}
                                            className="flex items-center justify-center gap-2 w-full py-4 text-xs font-bold text-rose-500/60 hover:text-rose-500 transition-all uppercase tracking-widest"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                            Remove Customer Profile
                                        </button>
                                    </div>
                                )}
                            </form>
                        </div>
                    </DrawerContent>
                </Drawer>
            </div>
        </PageTransition>
    )
}
