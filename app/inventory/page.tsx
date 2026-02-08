"use client"

import * as React from 'react'
import DataTable from '../components/DataTable'
import { useIsMobile } from '../hooks/useMediaQuery'
import { PageTransition } from '../components/layout/page-transition'
import { ListCard } from '../components/ui/list-card'
import { GlassCard } from '../components/ui/glass-card'
import { AlertTriangle, Package, Trash2 } from 'lucide-react'
import { cn } from '@/app/lib/utils'
import { ManagementHeader } from '../components/shared/ManagementHeader'
import { InsightWhisper } from '../components/dashboard/InsightWhisper'
import { Button } from '../components/ui/button'
import {
    Drawer,
    DrawerContent,
    DrawerStickyHeader,
    DrawerTitle,
    DrawerDescription,
    DrawerClose,
} from "../components/ui/drawer"

const initialInventory = [
    { id: '1', product: 'Ankara Fabric (Blue)', stock: 45, price: '₦4,500', status: 'In Stock', category: 'Fabric' },
    { id: '2', product: 'Ankara Fabric (Gold)', stock: 32, price: '₦4,500', status: 'In Stock', category: 'Fabric' },
    { id: '3', product: 'Lace Material (White)', stock: 3, price: '₦12,000', status: 'Low Stock', category: 'Material' },
    { id: '4', product: 'Lace Material (Cream)', stock: 18, price: '₦12,000', status: 'In Stock', category: 'Material' },
    { id: '5', product: 'Plain Cotton', stock: 2, price: '₦2,500', status: 'Low Stock', category: 'Fabric' },
    { id: '6', product: 'Silk Blend', stock: 25, price: '₦8,500', status: 'In Stock', category: 'Material' },
    { id: '7', product: 'Velvet (Red)', stock: 12, price: '₦6,800', status: 'In Stock', category: 'Fabric' },
    { id: '8', product: 'Velvet (Black)', stock: 8, price: '₦6,800', status: 'In Stock', category: 'Fabric' },
]

export default function InventoryPage() {
    const isMobile = useIsMobile()
    const [inventory, setInventory] = React.useState(initialInventory)
    const [search, setSearch] = React.useState("")
    const [selectedStatus, setSelectedStatus] = React.useState<string | null>(null)
    const [isAddOpen, setIsAddOpen] = React.useState(false)
    const [editingItem, setEditingItem] = React.useState<any>(null)

    // Form states
    const [formData, setFormData] = React.useState({ product: "", stock: 0, price: "", category: "Fabric" })

    const lowStockItems = inventory.filter(i => i.stock <= 5).length
    const totalInventoryValue = inventory.reduce((acc, curr) => {
        const price = parseInt(curr.price.replace(/[^0-9]/g, '')) || 0
        return acc + (price * curr.stock)
    }, 0)

    const filteredInventory = inventory.filter(item => {
        const matchesSearch = item.product.toLowerCase().includes(search.toLowerCase())
        const matchesStatus = !selectedStatus || item.status === selectedStatus
        return matchesSearch && matchesStatus
    })

    const handleAdd = (e: React.FormEvent) => {
        e.preventDefault()
        const newItem = {
            id: Math.random().toString(36).substr(2, 9),
            ...formData,
            status: formData.stock <= 5 ? 'Low Stock' : 'In Stock'
        }
        setInventory([newItem, ...inventory])
        setIsAddOpen(false)
        setFormData({ product: "", stock: 0, price: "", category: "Fabric" })
    }

    const handleUpdate = (e: React.FormEvent) => {
        e.preventDefault()
        setInventory(inventory.map(item =>
            item.id === editingItem.id
                ? { ...formData, id: item.id, status: formData.stock <= 5 ? 'Low Stock' : 'In Stock' }
                : item
        ))
        setEditingItem(null)
        setFormData({ product: "", stock: 0, price: "", category: "Fabric" })
    }

    const handleDelete = (id: string) => {
        setInventory(inventory.filter(item => item.id !== id))
        setEditingItem(null)
    }

    interface InventoryItem {
        id: string
        product: string
        stock: number
        price: string
        status: string
        category: string
    }

    const columns: any[] = [
        {
            key: 'product',
            header: 'Product',
            render: (value: string) => <span className="font-medium text-brand-deep dark:text-brand-cream">{value}</span>
        },
        {
            key: 'stock',
            header: 'Stock',
            render: (value: number) => (
                <span className={cn("font-mono", value <= 5 ? 'font-bold text-rose-600 dark:text-rose-400' : 'text-brand-accent/60')}>
                    {value} units
                </span>
            )
        },
        { key: 'price', header: 'Price' },
        {
            key: 'status',
            header: 'Status',
            render: (value: string) => (
                <span className={cn(
                    "px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider",
                    value === 'In Stock'
                        ? 'bg-brand-green/10 text-brand-green dark:bg-brand-green/20 dark:text-brand-cream'
                        : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                )}>
                    {value}
                </span>
            )
        },
    ]

    const intelligenceWhisper = lowStockItems > 0
        ? `You have **${lowStockItems} items** critically low on stock. Consider restocking soon to avoid losing sales.`
        : `Your inventory levels are looking healthy. No urgent restocks required today.`

    return (
        <PageTransition>
            <div className="max-w-4xl mx-auto space-y-8 pb-24">
                <ManagementHeader
                    title="Inventory"
                    description="Track your stock levels, manage product catalog, and monitor inventory value."
                    searchValue={search}
                    onSearchChange={setSearch}
                    searchPlaceholder="Search products by name..."
                    addButtonLabel="Add Product"
                    onAddClick={() => {
                        setFormData({ product: "", stock: 0, price: "", category: "Fabric" })
                        setIsAddOpen(true)
                    }}
                    onFilterClick={() => setSelectedStatus(selectedStatus ? null : 'Low Stock')}
                />

                <InsightWhisper insight={intelligenceWhisper} />

                {/* Stats Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <GlassCard className="p-5 flex items-center gap-4 relative overflow-hidden group">
                        <div className="absolute right-0 top-0 p-3 opacity-5 group-hover:opacity-10 transition-opacity">
                            <Package className="w-24 h-24" />
                        </div>
                        <div className="h-12 w-12 rounded-full bg-brand-green/10 dark:bg-brand-green/20 flex items-center justify-center text-brand-deep dark:text-brand-cream">
                            <Package className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-brand-accent/40 uppercase tracking-wider">Total Products</p>
                            <p className="text-2xl font-serif font-medium text-brand-deep dark:text-brand-cream">{inventory.length}</p>
                        </div>
                    </GlassCard>

                    <GlassCard className="p-5 flex items-center gap-4 relative overflow-hidden group border-brand-gold/20">
                        <div className="absolute right-0 top-0 p-3 opacity-5 group-hover:opacity-10 transition-opacity text-brand-gold">
                            <AlertTriangle className="w-24 h-24" />
                        </div>
                        <div className="h-12 w-12 rounded-full bg-brand-gold/10 flex items-center justify-center text-brand-gold">
                            <AlertTriangle className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-brand-gold/60 uppercase tracking-wider">Inventory Value</p>
                            <p className="text-2xl font-serif font-medium text-brand-deep dark:text-brand-cream">
                                ₦{totalInventoryValue.toLocaleString()}
                            </p>
                        </div>
                    </GlassCard>
                </div>

                {/* Main Content */}
                {isMobile ? (
                    <div className="space-y-3">
                        <p className="text-sm font-bold uppercase tracking-widest text-brand-accent/40 dark:text-white/30 ml-1">Product List</p>
                        {filteredInventory.map((product, index) => (
                            <ListCard
                                key={product.id}
                                title={product.product}
                                subtitle={product.price}
                                status={product.status}
                                statusColor={product.status === 'Low Stock' ? 'danger' : 'success'}
                                value={`${product.stock}`}
                                valueLabel="units"
                                delay={index * 0.05}
                                onClick={() => {
                                    setFormData({ product: product.product, stock: product.stock, price: product.price, category: (product as any).category || "Fabric" })
                                    setEditingItem(product)
                                }}
                            />
                        ))}
                    </div>
                ) : (
                    <GlassCard className="overflow-hidden border-brand-deep/5 dark:border-white/5">
                        <DataTable
                            columns={columns}
                            data={filteredInventory}
                            emptyMessage="No products found"
                            onRowClick={(item) => {
                                setFormData({ product: item.product, stock: item.stock, price: item.price, category: (item as any).category || "Fabric" })
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
                            <DrawerTitle>{editingItem ? "Edit Product" : "Add New Product"}</DrawerTitle>
                            <DrawerDescription>
                                {editingItem ? "Update product details and stock levels." : "Add a new item to your store's catalog."}
                            </DrawerDescription>
                        </DrawerStickyHeader>

                        <div className="p-8 pb-12 overflow-y-auto">
                            <form onSubmit={editingItem ? handleUpdate : handleAdd} className="max-w-lg mx-auto space-y-6">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase tracking-widest text-brand-accent/40 dark:text-white/30 ml-1">Product Name</label>
                                    <input
                                        autoFocus
                                        value={formData.product}
                                        onChange={(e) => setFormData({ ...formData, product: e.target.value })}
                                        placeholder="e.g. Premium Lace Material"
                                        className="w-full px-6 py-4 rounded-2xl bg-white dark:bg-white/5 border border-brand-deep/5 dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-brand-green/20 text-brand-deep dark:text-brand-cream"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold uppercase tracking-widest text-brand-accent/40 dark:text-white/30 ml-1">Current Stock</label>
                                        <input
                                            type="number"
                                            value={formData.stock}
                                            onChange={(e) => setFormData({ ...formData, stock: parseInt(e.target.value) || 0 })}
                                            className="w-full px-6 py-4 rounded-2xl bg-white dark:bg-white/5 border border-brand-deep/5 dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-brand-green/20 text-brand-deep dark:text-brand-cream"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold uppercase tracking-widest text-brand-accent/40 dark:text-white/30 ml-1">Price (₦)</label>
                                        <input
                                            value={formData.price}
                                            onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                            placeholder="e.g. ₦12,000"
                                            className="w-full px-6 py-4 rounded-2xl bg-white dark:bg-white/5 border border-brand-deep/5 dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-brand-green/20 text-brand-deep dark:text-brand-cream"
                                        />
                                    </div>
                                </div>

                                <div className="flex gap-4 pt-6">
                                    <DrawerClose asChild>
                                        <Button variant="outline" className="flex-1 rounded-2xl h-14">Cancel</Button>
                                    </DrawerClose>
                                    <Button type="submit" className="flex-1 rounded-2xl h-14 bg-brand-deep text-brand-gold dark:bg-brand-gold dark:text-brand-deep font-bold shadow-xl">
                                        {editingItem ? "Save Changes" : "Create Product"}
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
                                            Delete Product from Inventory
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

