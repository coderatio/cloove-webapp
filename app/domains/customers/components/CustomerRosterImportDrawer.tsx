"use client"

import * as React from "react"
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
import { FileDropZone } from "@/app/components/ui/file-drop-zone"
import { useCustomerBulkImport } from "../hooks/useCustomerBulkImport"
import { Loader2 } from "lucide-react"

interface CustomerRosterImportDrawerProps {
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function CustomerRosterImportDrawer({ open, onOpenChange }: CustomerRosterImportDrawerProps) {
    const importMutation = useCustomerBulkImport()
    const [lastResult, setLastResult] = React.useState<{
        created: number
        skipped: number
        failed: number
        errors: Array<{ row: number; name: string; error: string }>
    } | null>(null)

    const onFile = (file: File) => {
        setLastResult(null)
        importMutation.mutate(file, {
            onSuccess: (data) => {
                setLastResult({
                    created: data.created,
                    skipped: data.skipped,
                    failed: data.failed,
                    errors: data.errors ?? [],
                })
            },
        })
    }

    return (
        <Drawer open={open} onOpenChange={onOpenChange}>
            <DrawerContent className="max-h-[90vh] flex flex-col">
                <DrawerStickyHeader>
                    <DrawerTitle className="font-serif">Import students & parents</DrawerTitle>
                    <DrawerDescription>
                        Upload a UTF-8 CSV with a header row. Required column: <strong>name</strong>. Optional:{" "}
                        <strong>phone</strong>, <strong>whatsapp</strong>, <strong>email</strong>,{" "}
                        <strong>class</strong>, <strong>role</strong>, <strong>notes</strong>.
                    </DrawerDescription>
                </DrawerStickyHeader>
                <DrawerBody className="space-y-4 overflow-y-auto">
                    <FileDropZone
                        accept={[".csv"]}
                        maxSizeMB={2}
                        disabled={importMutation.isPending}
                        onFileSelect={onFile}
                        title="Drop roster CSV"
                        description="CSV only, up to 2 MB · max 500 rows"
                    />
                    {importMutation.isPending ? (
                        <div className="flex items-center gap-2 text-sm text-brand-deep/70 dark:text-brand-cream/70">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Importing…
                        </div>
                    ) : null}
                    {lastResult && !importMutation.isPending ? (
                        <div className="rounded-xl border border-brand-deep/10 dark:border-white/10 p-4 text-sm space-y-2">
                            <p className="text-brand-deep dark:text-brand-cream">
                                <strong>{lastResult.created}</strong> created · <strong>{lastResult.skipped}</strong>{" "}
                                skipped (duplicates or empty rows)
                                {lastResult.failed > 0 ? (
                                    <>
                                        {" "}
                                        · <strong>{lastResult.failed}</strong> failed
                                    </>
                                ) : null}
                            </p>
                            {lastResult.errors.length > 0 ? (
                                <ul className="max-h-36 overflow-y-auto text-xs text-destructive space-y-1 list-disc pl-4">
                                    {lastResult.errors.slice(0, 12).map((e) => (
                                        <li key={`${e.row}-${e.name}`}>
                                            Row {e.row} ({e.name}): {e.error}
                                        </li>
                                    ))}
                                    {lastResult.errors.length > 12 ? (
                                        <li>…and {lastResult.errors.length - 12} more</li>
                                    ) : null}
                                </ul>
                            ) : null}
                        </div>
                    ) : null}
                </DrawerBody>
                <DrawerFooter className="flex-row justify-end gap-2">
                    <DrawerClose asChild>
                        <Button type="button" variant="secondary" className="rounded-full">
                            Close
                        </Button>
                    </DrawerClose>
                </DrawerFooter>
            </DrawerContent>
        </Drawer>
    )
}
