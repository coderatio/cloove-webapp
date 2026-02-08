"use client"

import { useEffect, useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { GlassCard } from "../../components/ui/glass-card"
import { Button } from "../../components/ui/button"
import { Input } from "../../components/ui/input"
import { Switch } from "../../components/ui/switch"
import { FileText, Eye, Edit2, Plus, Info, MessageSquare, ShieldCheck, Save, ArrowLeft, Check, ChevronDown } from "lucide-react"
import { cn } from "@/app/lib/utils"
import {
    Drawer,
    DrawerContent,
    DrawerHeader,
    DrawerTitle,
    DrawerDescription,
    DrawerFooter,
    DrawerClose,
} from "../../components/ui/drawer"
import { toast } from "sonner"


const initialPages = [
    { id: '1', title: 'About Us', slug: 'about', status: 'Published', icon: Info, date: 'Last updated 2 days ago', content: "Welcome to our store. We are passionate about..." },
    { id: '2', title: 'Contact Support', slug: 'contact', status: 'Published', icon: MessageSquare, date: 'Last updated 1 week ago', content: "Contact us at support@example.com" },
    { id: '3', title: 'Return Policy', slug: 'policy', status: 'Draft', icon: ShieldCheck, date: 'Created 2 weeks ago', content: "Returns are accepted within 30 days." },
]

export default function StorefrontPages() {
    const [pages, setPages] = useState(initialPages)
    const searchParams = useSearchParams()
    const router = useRouter()

    // Drawer State
    const [isDrawerOpen, setIsDrawerOpen] = useState(false)
    const [editingPage, setEditingPage] = useState<typeof initialPages[0] | null>(null)

    // Handle Deep Linking
    useEffect(() => {
        const action = searchParams.get('action')
        const slug = searchParams.get('slug')

        if (action === 'edit' && slug) {
            const pageToEdit = pages.find(p => p.slug === slug)
            if (pageToEdit) {
                setEditingPage(pageToEdit)
                setIsDrawerOpen(true)
            }
        }
    }, [searchParams, pages])

    const handleEdit = (page: typeof initialPages[0]) => {
        setEditingPage(page)
        setIsDrawerOpen(true)
    }

    const handleCreate = () => {
        setEditingPage({
            id: Math.random().toString(),
            title: '',
            slug: '',
            status: 'Draft',
            icon: FileText,
            date: 'Just now',
            content: ''
        })
        setIsDrawerOpen(true)
    }

    const handleSave = () => {
        toast.success("Page saved successfully")
        setIsDrawerOpen(false)
        // clean up URL if deep linked
        if (searchParams.get('action')) {
            router.push('/storefront/pages')
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="font-serif text-xl text-brand-deep dark:text-brand-cream font-medium">Content Pages</h2>
                    <p className="text-brand-accent/60 dark:text-brand-cream/60 text-sm">Manage the auxiliary pages for your storefront.</p>
                </div>
                <Button
                    onClick={handleCreate}
                    className="rounded-full bg-brand-deep text-brand-gold dark:bg-brand-gold dark:text-brand-deep dark:hover:bg-brand-gold/90 dark:hover:text-brand-deep font-bold px-6 h-10 shadow-lg hover:scale-105 transition-all"
                >
                    <Plus className="w-4 h-4 mr-2" />
                    New Page
                </Button>
            </div>

            <GlassCard className="overflow-hidden p-0">
                <div className="grid grid-cols-1 divide-y divide-brand-deep/5 dark:divide-white/5">
                    {pages.map((page) => (
                        <div key={page.id} className="p-4 md:p-6 flex items-center justify-between group hover:bg-brand-cream/40 dark:hover:bg-white/5 transition-colors">
                            <div className="flex items-center gap-4">
                                <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center",
                                    page.status === 'Published'
                                        ? "bg-brand-green/10 text-brand-green dark:text-emerald-400 dark:bg-emerald-400/10"
                                        : "bg-brand-accent/10 text-brand-accent/60 dark:text-brand-cream/60"
                                )}>
                                    <page.icon className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="font-serif text-lg font-medium text-brand-deep dark:text-brand-cream">{page.title}</h3>
                                    <div className="flex items-center gap-3 text-xs">
                                        <span className={cn(
                                            "font-bold uppercase tracking-widest",
                                            page.status === 'Published' ? "text-brand-green dark:text-emerald-400" : "text-brand-accent/60 dark:text-brand-cream/60"
                                        )}>
                                            {page.status}
                                        </span>
                                        <span className="w-1 h-1 rounded-full bg-brand-deep/20 dark:bg-white/20" />
                                        <span className="text-brand-accent/60 dark:text-brand-cream/60">{page.date}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-9 px-3 text-brand-accent/60 hover:text-brand-deep dark:text-white/60 dark:hover:text-white"
                                >
                                    <Eye className="w-4 h-4 mr-2" />
                                    View
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleEdit(page)}
                                    className="h-9 px-4 border-brand-accent/10 hover:bg-white/60 dark:border-white/10 dark:hover:bg-white/10 rounded-lg group/edit"
                                >
                                    <Edit2 className="w-3.5 h-3.5 mr-2 group-hover/edit:text-brand-green dark:group-hover/edit:text-emerald-400 transition-colors" />
                                    Edit
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
            </GlassCard>

            {/* Page Editor Drawer */}
            <Drawer open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
                <DrawerContent>
                    <div className="max-w-5xl mx-auto w-full h-full flex flex-col">
                        <div className="p-6 border-b border-brand-deep/5 dark:border-white/5 flex items-center justify-between">
                            <div>
                                <DrawerTitle>Edit Page</DrawerTitle>
                                <DrawerDescription>Make changes to your page content.</DrawerDescription>
                            </div>
                            <div className="flex items-center gap-3">
                                <DrawerClose asChild>
                                    <Button variant="ghost">Cancel</Button>
                                </DrawerClose>
                                <Button onClick={handleSave} className="bg-brand-deep text-brand-gold dark:bg-brand-gold dark:text-brand-deep font-bold rounded-full">
                                    <Save className="w-4 h-4 mr-2" />
                                    Save Changes
                                </Button>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="space-y-2 md:col-span-2">
                                    <label className="text-xs font-bold uppercase tracking-widest text-brand-accent/40 dark:text-white/40">Page Title</label>
                                    <Input
                                        defaultValue={editingPage?.title}
                                        className="text-lg font-serif border-brand-deep/10 dark:border-white/10 bg-white/50 dark:bg-white/5 h-12"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase tracking-widest text-brand-accent/40 dark:text-white/40">Visible to Public</label>
                                    <div className="h-12 flex items-center px-4 rounded-xl border border-brand-deep/10 dark:border-white/10 bg-white/50 dark:bg-white/5 justify-between">
                                        <span className="text-sm font-medium text-brand-deep dark:text-brand-cream">Published</span>
                                        <Switch defaultChecked={editingPage?.status === 'Published'} />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2 h-[400px]">
                                <label className="text-xs font-bold uppercase tracking-widest text-brand-accent/40 dark:text-white/40">Content</label>
                                <textarea
                                    className="w-full h-full p-4 rounded-xl border border-brand-deep/10 dark:border-white/10 bg-white/50 dark:bg-white/5 resize-none focus:outline-none focus:ring-2 focus:ring-brand-green/20 text-brand-deep dark:text-brand-cream"
                                    defaultValue={editingPage?.content}
                                />
                            </div>
                        </div>
                    </div>
                </DrawerContent>
            </Drawer>
        </div>
    )
}
