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
import { Textarea } from "@/app/components/ui/textarea"
import { Label } from "@/app/components/ui/label"
import { useBatchSalePaymentLinks } from "@/app/domains/checkout/hooks/useBatchSalePaymentLinks"
import { Copy, Loader2 } from "lucide-react"
import { toast } from "sonner"

function parseSaleIds(raw: string): string[] {
    return raw
        .split(/[\s,]+/)
        .map((s) => s.trim())
        .filter((s) => s.length > 0)
        .slice(0, 25)
}

export function SchoolBatchPaymentLinksDrawer({
    open,
    onOpenChange,
}: {
    open: boolean
    onOpenChange: (open: boolean) => void
}) {
    const batch = useBatchSalePaymentLinks()
    const [text, setText] = React.useState("")
    const [results, setResults] = React.useState<
        Array<{ saleId: string; reference: string | null; ok: boolean; error?: string }>
    >([])

    React.useEffect(() => {
        if (!open) {
            setText("")
            setResults([])
        }
    }, [open])

    const onSubmit = () => {
        const ids = parseSaleIds(text)
        if (ids.length === 0) {
            toast.error("Paste at least one fee (sale) ID.")
            return
        }
        batch.mutate(ids, {
            onSuccess: (r) => setResults(r),
        })
    }

    const origin = typeof window !== "undefined" ? window.location.origin : ""

    const copyAll = async () => {
        const lines = results
            .filter((r) => r.ok && r.reference)
            .map((r) => `${origin}/pay/${r.reference}`)
        if (lines.length === 0) {
            toast.error("No successful links to copy.")
            return
        }
        await navigator.clipboard.writeText(lines.join("\n"))
        toast.success("Links copied")
    }

    return (
        <Drawer open={open} onOpenChange={onOpenChange}>
            <DrawerContent className="max-h-[90vh] flex flex-col">
                <DrawerStickyHeader>
                    <DrawerTitle className="font-serif">Batch fee payment links</DrawerTitle>
                    <DrawerDescription>
                        Paste up to <strong>25</strong> pending fee IDs from <strong>Fees & sales</strong> (one per line
                        or comma-separated). We will create or reuse a payment link for each pending sale.
                    </DrawerDescription>
                </DrawerStickyHeader>
                <DrawerBody className="space-y-4 overflow-y-auto">
                    <div className="space-y-2">
                        <Label htmlFor="batch-sale-ids">Sale / fee IDs</Label>
                        <Textarea
                            id="batch-sale-ids"
                            value={text}
                            onChange={(e) => setText(e.target.value)}
                            placeholder={"e.g.\nclv-sale-abc...\nclv-sale-def..."}
                            className="min-h-[140px] rounded-2xl font-mono text-sm"
                            disabled={batch.isPending}
                        />
                    </div>
                    {batch.isPending ? (
                        <div className="flex items-center gap-2 text-sm text-brand-deep/70 dark:text-brand-cream/70">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Creating links…
                        </div>
                    ) : null}
                    {results.length > 0 && !batch.isPending ? (
                        <div className="rounded-xl border border-brand-deep/10 dark:border-white/10 p-4 space-y-3">
                            <div className="flex items-center justify-between gap-2">
                                <p className="text-sm text-brand-deep dark:text-brand-cream">
                                    {results.filter((r) => r.ok).length} ok ·{" "}
                                    {results.filter((r) => !r.ok).length} skipped
                                </p>
                                <Button
                                    type="button"
                                    variant="secondary"
                                    size="sm"
                                    className="rounded-full"
                                    onClick={() => void copyAll()}
                                >
                                    <Copy className="h-3.5 w-3.5 mr-1.5" />
                                    Copy URLs
                                </Button>
                            </div>
                            <ul className="max-h-48 overflow-y-auto text-xs space-y-2 font-mono">
                                {results.map((r) => (
                                    <li key={r.saleId} className="break-all">
                                        {r.ok && r.reference ? (
                                            <span className="text-brand-deep/90 dark:text-brand-cream/90">
                                                {origin}/pay/{r.reference}
                                            </span>
                                        ) : (
                                            <span className="text-destructive">
                                                {r.saleId}: {r.error ?? "Failed"}
                                            </span>
                                        )}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ) : null}
                </DrawerBody>
                <DrawerFooter className="flex-row justify-between gap-2">
                    <DrawerClose asChild>
                        <Button type="button" variant="secondary" className="rounded-full">
                            Close
                        </Button>
                    </DrawerClose>
                    <Button
                        type="button"
                        className="rounded-full"
                        onClick={() => void onSubmit()}
                        disabled={batch.isPending || !text.trim()}
                    >
                        Generate links
                    </Button>
                </DrawerFooter>
            </DrawerContent>
        </Drawer>
    )
}
