"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
    Sparkles,
    Loader2,
    CheckCircle2,
    ArrowLeft,
    Trash2,
    Users,
    GraduationCap,
} from "lucide-react"
import {
    Drawer,
    DrawerBody,
    DrawerClose,
    DrawerContent,
    DrawerDescription,
    DrawerFooter,
    DrawerStickyHeader,
    DrawerTitle,
} from "@/app/components/ui/drawer"
import { Button } from "@/app/components/ui/button"
import { Input } from "@/app/components/ui/input"
import { Label } from "@/app/components/ui/label"
import { FileDropZone } from "@/app/components/ui/file-drop-zone"
import { Badge } from "@/app/components/ui/badge"
import { useRosterExtract, type ExtractedPerson } from "@/app/domains/customers/hooks/useRosterExtract"
import { useCustomerBulkImport } from "@/app/domains/customers/hooks/useCustomerBulkImport"
import { cn } from "@/app/lib/utils"
import { toast } from "sonner"

type Step = "upload" | "extracting" | "review" | "success"

interface SuccessResult {
    created: number
    skipped: number
    failed: number
}

interface SchoolRosterImportDrawerProps {
    open: boolean
    onOpenChange: (open: boolean) => void
}

function PersonCard({
    person,
    onUpdate,
    onRemove,
}: {
    person: ExtractedPerson
    onUpdate: (id: string, updates: Partial<ExtractedPerson>) => void
    onRemove: (id: string) => void
}) {
    return (
        <div
            className={cn(
                "rounded-2xl border p-4 space-y-3 transition-colors",
                person.status === "error"
                    ? "border-destructive/40 bg-destructive/[0.03]"
                    : "border-brand-deep/10 dark:border-white/10 bg-white/40 dark:bg-white/[0.03]"
            )}
        >
            <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium text-brand-deep dark:text-brand-cream font-serif">
                        {person.name || <span className="text-destructive italic">No name</span>}
                    </span>
                    {person.role ? (
                        <Badge
                            variant="secondary"
                            className="rounded-full text-[10px] bg-brand-gold/10 text-brand-deep dark:text-brand-cream border-brand-gold/20 capitalize"
                        >
                            {person.role}
                        </Badge>
                    ) : null}
                    {person.class ? (
                        <Badge
                            variant="secondary"
                            className="rounded-full text-[10px] bg-brand-deep/5 dark:bg-white/5 text-brand-deep/70 dark:text-brand-cream/70"
                        >
                            {person.class}
                        </Badge>
                    ) : null}
                    {person.status === "error" ? (
                        <Badge variant="destructive" className="rounded-full text-[10px]">
                            {person.errors[0]}
                        </Badge>
                    ) : null}
                </div>
                <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 shrink-0 rounded-lg text-destructive hover:bg-destructive/10"
                    onClick={() => onRemove(person.id)}
                    aria-label={`Remove ${person.name}`}
                >
                    <Trash2 className="h-3.5 w-3.5" />
                </Button>
            </div>

            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                <div className="space-y-1">
                    <Label className="text-[11px] text-brand-deep/60 dark:text-brand-cream/60 uppercase tracking-wide">
                        Name
                    </Label>
                    <Input
                        value={person.name}
                        onChange={(e) => onUpdate(person.id, { name: e.target.value })}
                        className="h-8 rounded-xl text-sm"
                        placeholder="Full name"
                    />
                </div>
                <div className="space-y-1">
                    <Label className="text-[11px] text-brand-deep/60 dark:text-brand-cream/60 uppercase tracking-wide">
                        Phone
                    </Label>
                    <Input
                        value={person.phone}
                        onChange={(e) => onUpdate(person.id, { phone: e.target.value })}
                        className="h-8 rounded-xl text-sm"
                        placeholder="Phone number"
                    />
                </div>
                <div className="space-y-1">
                    <Label className="text-[11px] text-brand-deep/60 dark:text-brand-cream/60 uppercase tracking-wide">
                        Email
                    </Label>
                    <Input
                        value={person.email}
                        onChange={(e) => onUpdate(person.id, { email: e.target.value })}
                        className="h-8 rounded-xl text-sm"
                        placeholder="Email address"
                    />
                </div>
                <div className="space-y-1">
                    <Label className="text-[11px] text-brand-deep/60 dark:text-brand-cream/60 uppercase tracking-wide">
                        Class / Grade
                    </Label>
                    <Input
                        value={person.class}
                        onChange={(e) => onUpdate(person.id, { class: e.target.value })}
                        className="h-8 rounded-xl text-sm"
                        placeholder="e.g. JSS 2"
                    />
                </div>
                <div className="space-y-1">
                    <Label className="text-[11px] text-brand-deep/60 dark:text-brand-cream/60 uppercase tracking-wide">
                        Role
                    </Label>
                    <Input
                        value={person.role}
                        onChange={(e) => onUpdate(person.id, { role: e.target.value })}
                        className="h-8 rounded-xl text-sm"
                        placeholder="student / parent"
                    />
                </div>
                <div className="space-y-1">
                    <Label className="text-[11px] text-brand-deep/60 dark:text-brand-cream/60 uppercase tracking-wide">
                        Notes
                    </Label>
                    <Input
                        value={person.notes}
                        onChange={(e) => onUpdate(person.id, { notes: e.target.value })}
                        className="h-8 rounded-xl text-sm"
                        placeholder="Optional notes"
                    />
                </div>
            </div>
        </div>
    )
}

export function SchoolRosterImportDrawer({ open, onOpenChange }: SchoolRosterImportDrawerProps) {
    const { extractRoster, mapRaw, isExtracting } = useRosterExtract()
    const importMutation = useCustomerBulkImport()

    const [step, setStep] = React.useState<Step>("upload")
    const [file, setFile] = React.useState<File | null>(null)
    const [people, setPeople] = React.useState<ExtractedPerson[]>([])
    const [successResult, setSuccessResult] = React.useState<SuccessResult | null>(null)

    React.useEffect(() => {
        if (!open) {
            setStep("upload")
            setFile(null)
            setPeople([])
            setSuccessResult(null)
        }
    }, [open])

    const handleFileSelect = async (selected: File) => {
        setFile(selected)
        setStep("extracting")
        try {
            const raw = await extractRoster(selected)
            const mapped = raw.map((r, i) => mapRaw(r, i))
            setPeople(mapped)
            setStep("review")
            toast.success(`AI extracted ${mapped.length} record${mapped.length === 1 ? "" : "s"}. Review before importing.`)
        } catch {
            setStep("upload")
        }
    }

    const handleUpdate = (id: string, updates: Partial<ExtractedPerson>) => {
        setPeople((prev) =>
            prev.map((p) => {
                if (p.id !== id) return p
                const updated = { ...p, ...updates }
                const errors: string[] = []
                if (!updated.name.trim()) errors.push("Name is required")
                return { ...updated, status: errors.length > 0 ? "error" : "ok", errors }
            })
        )
    }

    const handleRemove = (id: string) => {
        setPeople((prev) => prev.filter((p) => p.id !== id))
    }

    const handleConfirm = async () => {
        const hasErrors = people.some((p) => p.status === "error")
        if (hasErrors) {
            toast.error("Fix errors before importing.")
            return
        }
        if (people.length === 0) {
            toast.error("No records to import.")
            return
        }

        // Build a CSV from the reviewed people and reuse the existing bulk import endpoint
        const header = "name,phone,whatsapp,email,class,role,notes"
        const escape = (v: string) => `"${v.replace(/"/g, '""')}"`
        const rows = people.map((p) =>
            [p.name, p.phone, p.whatsapp, p.email, p.class, p.role, p.notes]
                .map(escape)
                .join(",")
        )
        const csvContent = [header, ...rows].join("\n")
        const csvFile = new File([csvContent], "roster.csv", { type: "text/csv" })

        importMutation.mutate(csvFile, {
            onSuccess: (data) => {
                setSuccessResult({
                    created: data.created,
                    skipped: data.skipped,
                    failed: data.failed,
                })
                setStep("success")
            },
        })
    }

    const hasErrors = people.some((p) => p.status === "error")

    return (
        <Drawer open={open} onOpenChange={onOpenChange}>
            <DrawerContent className="max-w-4xl max-h-[92vh] flex flex-col">
                <DrawerStickyHeader>
                    <div className="flex items-center gap-3 mb-1">
                        <div className="h-8 w-8 rounded-full bg-brand-gold/10 flex items-center justify-center text-brand-gold shrink-0">
                            {step === "extracting" ? (
                                <Sparkles className="h-4 w-4" />
                            ) : step === "success" ? (
                                <CheckCircle2 className="h-4 w-4" />
                            ) : (
                                <GraduationCap className="h-4 w-4" />
                            )}
                        </div>
                        <DrawerTitle className="font-serif">Import roster</DrawerTitle>
                    </div>
                    <DrawerDescription>
                        {step === "upload" &&
                            "Upload a class list, admission form, or any document. Cloove AI will extract student and parent records for you."}
                        {step === "extracting" &&
                            `Cloove AI is reading "${file?.name ?? "your file"}" and identifying students and parents…`}
                        {step === "review" &&
                            `Found ${people.length} record${people.length === 1 ? "" : "s"}. Review and edit before importing.`}
                        {step === "success" && "Roster imported successfully."}
                    </DrawerDescription>
                </DrawerStickyHeader>

                <DrawerBody className="overflow-y-auto">
                    <AnimatePresence mode="wait">
                        {step === "upload" && (
                            <motion.div
                                key="upload"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="max-w-xl mx-auto space-y-6"
                            >
                                <FileDropZone
                                    accept={[".pdf", ".csv", ".xlsx", ".xls", ".png", ".jpg", ".jpeg"]}
                                    maxSizeMB={10}
                                    onFileSelect={(f) => void handleFileSelect(f)}
                                    title="Drop your class list or admission form"
                                    description="PDF, CSV, Excel, or image · up to 10 MB · up to 500 students"
                                />
                                <div className="rounded-2xl border border-brand-gold/20 bg-brand-gold/5 p-5 space-y-3">
                                    <div className="flex items-center gap-2">
                                        <Sparkles className="h-4 w-4 text-brand-gold shrink-0" />
                                        <p className="text-sm font-medium text-brand-deep dark:text-brand-cream">
                                            AI-powered — no template needed
                                        </p>
                                    </div>
                                    <ul className="space-y-2 text-xs text-brand-deep/65 dark:text-brand-cream/65">
                                        <li className="flex gap-2">
                                            <span className="mt-1 h-1 w-1 rounded-full bg-brand-gold shrink-0" />
                                            Upload any list — printed table, Excel sheet, PDF register, even a photo
                                        </li>
                                        <li className="flex gap-2">
                                            <span className="mt-1 h-1 w-1 rounded-full bg-brand-gold shrink-0" />
                                            Automatically identifies names, phone numbers, class, and role
                                        </li>
                                        <li className="flex gap-2">
                                            <span className="mt-1 h-1 w-1 rounded-full bg-brand-gold shrink-0" />
                                            Review and edit every record before it is saved
                                        </li>
                                    </ul>
                                </div>
                            </motion.div>
                        )}

                        {step === "extracting" && (
                            <motion.div
                                key="extracting"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="flex flex-col items-center justify-center py-24 text-center"
                            >
                                <div className="relative mb-8">
                                    <div className="absolute inset-0 bg-brand-gold/20 blur-[50px] rounded-full animate-pulse" />
                                    <div className="relative h-20 w-20 rounded-[28px] bg-brand-deep/5 dark:bg-white/5 border border-brand-gold/20 flex items-center justify-center">
                                        <Loader2 className="h-9 w-9 text-brand-gold animate-spin" />
                                    </div>
                                </div>
                                <h3 className="font-serif text-xl text-brand-deep dark:text-brand-cream">
                                    Reading your roster…
                                </h3>
                                <p className="mt-2 text-sm text-brand-deep/55 dark:text-brand-cream/55 max-w-xs">
                                    Identifying students and parents from{" "}
                                    <span className="font-medium">{file?.name}</span>
                                </p>
                            </motion.div>
                        )}

                        {step === "review" && (
                            <motion.div
                                key="review"
                                initial={{ opacity: 0, x: 16 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -16 }}
                                className="space-y-4"
                            >
                                <div className="flex items-start gap-3 rounded-2xl border border-brand-gold/20 bg-brand-gold/5 p-4">
                                    <Users className="h-4 w-4 text-brand-gold mt-0.5 shrink-0" />
                                    <p className="text-sm text-brand-deep/80 dark:text-brand-cream/80">
                                        Review each record below. Edit any field or remove unwanted rows. Only
                                        records without errors will be imported.
                                    </p>
                                </div>
                                {people.length === 0 ? (
                                    <p className="text-sm text-brand-deep/55 dark:text-brand-cream/55 text-center py-8">
                                        No records remaining. Go back to upload a different file.
                                    </p>
                                ) : (
                                    <div className="space-y-3">
                                        {people.map((person) => (
                                            <PersonCard
                                                key={person.id}
                                                person={person}
                                                onUpdate={handleUpdate}
                                                onRemove={handleRemove}
                                            />
                                        ))}
                                    </div>
                                )}
                            </motion.div>
                        )}

                        {step === "success" && successResult && (
                            <motion.div
                                key="success"
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="flex flex-col items-center justify-center py-24 text-center"
                            >
                                <div className="h-20 w-20 rounded-full bg-brand-gold/10 flex items-center justify-center text-brand-gold mb-8">
                                    <CheckCircle2 className="h-10 w-10" />
                                </div>
                                <h3 className="font-serif text-2xl text-brand-deep dark:text-brand-cream">
                                    Roster imported
                                </h3>
                                <p className="mt-3 text-sm text-brand-deep/65 dark:text-brand-cream/65 max-w-xs">
                                    <strong className="text-brand-deep dark:text-brand-cream">
                                        {successResult.created}
                                    </strong>{" "}
                                    added
                                    {successResult.skipped > 0 ? (
                                        <>
                                            {" · "}
                                            <strong>{successResult.skipped}</strong> already existed
                                        </>
                                    ) : null}
                                    {successResult.failed > 0 ? (
                                        <>
                                            {" · "}
                                            <strong className="text-destructive">{successResult.failed}</strong> failed
                                        </>
                                    ) : null}
                                </p>
                                <Button
                                    type="button"
                                    className="mt-8 rounded-full"
                                    onClick={() => {
                                        setStep("upload")
                                        setPeople([])
                                        setFile(null)
                                        setSuccessResult(null)
                                    }}
                                >
                                    Import another file
                                </Button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </DrawerBody>

                {(step === "upload" || step === "review") && (
                    <DrawerFooter className="flex-row justify-between gap-2">
                        {step === "review" ? (
                            <Button
                                type="button"
                                variant="ghost"
                                className="gap-2 text-xs font-bold uppercase tracking-widest text-brand-deep/40 hover:text-brand-deep dark:text-brand-cream/40 dark:hover:text-brand-cream"
                                onClick={() => {
                                    setStep("upload")
                                    setPeople([])
                                    setFile(null)
                                }}
                            >
                                <ArrowLeft className="h-4 w-4" />
                                Start over
                            </Button>
                        ) : (
                            <DrawerClose asChild>
                                <Button type="button" variant="secondary" className="rounded-full">
                                    Cancel
                                </Button>
                            </DrawerClose>
                        )}
                        {step === "review" && (
                            <Button
                                type="button"
                                className="rounded-full px-8"
                                onClick={() => void handleConfirm()}
                                disabled={
                                    importMutation.isPending ||
                                    hasErrors ||
                                    people.length === 0
                                }
                            >
                                {importMutation.isPending ? (
                                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                ) : (
                                    <CheckCircle2 className="h-4 w-4 mr-2" />
                                )}
                                Import {people.length} record{people.length === 1 ? "" : "s"}
                            </Button>
                        )}
                    </DrawerFooter>
                )}

                {step === "success" && (
                    <DrawerFooter className="flex-row justify-end">
                        <DrawerClose asChild>
                            <Button type="button" variant="secondary" className="rounded-full">
                                Close
                            </Button>
                        </DrawerClose>
                    </DrawerFooter>
                )}
            </DrawerContent>
        </Drawer>
    )
}
