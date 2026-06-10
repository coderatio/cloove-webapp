"use client";

import { useMemo, useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  SparklesIcon as Sparkles,
  Loading03Icon as Loader,
  CheckmarkCircle02Icon as Check,
  Delete02Icon as Trash,
  ArrowLeft01Icon as ArrowLeft,
} from "@hugeicons/core-free-icons";
import {
  Drawer,
  DrawerContent,
  DrawerStickyHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerBody,
  DrawerFooter,
} from "@/app/components/ui/drawer";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { FileDropZone } from "@/app/components/ui/file-drop-zone";
import { DotBadge } from "@/app/components/ui/dot-badge";
import { useServiceImport } from "../hooks/useServiceImport";

type Step = "upload" | "extracting" | "review" | "done";

interface Row {
  key: string;
  name: string;
  summary: string;
  priceMin: string;
  currency: string;
}

let counter = 0;
const nextKey = () => `svc-${counter++}`;

export function ServiceImportDrawer({
  open,
  onOpenChange,
  noun = "service",
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** What to call a row in copy — e.g. "service" or "amenity". */
  noun?: string;
}) {
  const { extract, bulkImport } = useServiceImport();
  const [step, setStep] = useState<Step>("upload");
  const [rows, setRows] = useState<Row[]>([]);

  const rowError = (row: Row) => (!row.name.trim() ? "Needs a name" : null);
  const hasErrors = useMemo(() => rows.some((r) => rowError(r)), [rows]);

  async function handleFile(file: File) {
    setStep("extracting");
    try {
      const data = await extract.mutateAsync(file);
      setRows(
        data.services.map((s) => ({
          key: nextKey(),
          name: s.name,
          summary: s.summary ?? "",
          priceMin: s.priceMin ? String(s.priceMin) : "",
          currency: s.currency ?? "",
        })),
      );
      setStep("review");
    } catch {
      setStep("upload");
    }
  }

  async function confirm() {
    await bulkImport.mutateAsync({
      services: rows.map((r) => ({
        name: r.name.trim(),
        summary: r.summary.trim() || null,
        priceMin: r.priceMin ? Number(r.priceMin) : null,
        currency: r.currency.trim() || null,
      })),
    });
    setStep("done");
  }

  function reset() {
    setStep("upload");
    setRows([]);
  }

  const update = (key: string, patch: Partial<Row>) =>
    setRows((prev) => prev.map((r) => (r.key === key ? { ...r, ...patch } : r)));

  return (
    <Drawer
      open={open}
      onOpenChange={(next) => {
        if (!next) reset();
        onOpenChange(next);
      }}
    >
      <DrawerContent className="max-h-[92vh] max-w-3xl">
        <DrawerStickyHeader>
          <div className="mb-1 flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-gold/10 text-brand-gold">
              <HugeiconsIcon icon={Sparkles} className="h-4 w-4" />
            </div>
            <DrawerTitle className="font-serif text-2xl text-brand-deep dark:text-brand-cream">
              Bring your {noun}s in
            </DrawerTitle>
          </div>
          <DrawerDescription>
            Upload your {noun} list (spreadsheet, PDF, or photo) and we&apos;ll read it for you to
            check.
          </DrawerDescription>
        </DrawerStickyHeader>

        <DrawerBody className="space-y-6 pt-5">
          {step === "upload" && (
            <div className="mx-auto max-w-xl space-y-3">
              <FileDropZone onFileSelect={handleFile} />
              <p className="text-center text-xs text-brand-accent/50 dark:text-brand-cream/40">
                Works with CSV, Excel, PDF, or a photo. No fixed format needed.
              </p>
            </div>
          )}

          {step === "extracting" && (
            <div className="flex flex-col items-center gap-4 py-16 text-center">
              <HugeiconsIcon icon={Loader} className="h-10 w-10 animate-spin text-brand-gold" />
              <p className="text-sm text-brand-accent/60 dark:text-brand-cream/50">
                Reading your file…
              </p>
            </div>
          )}

          {step === "review" && (
            <div className="space-y-3">
              <p className="text-sm text-brand-accent/70 dark:text-brand-cream/60">
                Check the {rows.length} {noun}
                {rows.length === 1 ? "" : "s"} below, then import.
              </p>
              {rows.map((row) => {
                const error = rowError(row);
                return (
                  <div
                    key={row.key}
                    className="grid grid-cols-1 gap-2 rounded-2xl border border-brand-deep/8 bg-white/60 p-3 dark:border-white/10 dark:bg-white/5 sm:grid-cols-[1.2fr_1.6fr_0.7fr_0.6fr_auto]"
                  >
                    <Input
                      value={row.name}
                      placeholder="Name"
                      onChange={(e) => update(row.key, { name: e.target.value })}
                    />
                    <Input
                      value={row.summary}
                      placeholder="Short description"
                      onChange={(e) => update(row.key, { summary: e.target.value })}
                    />
                    <Input
                      type="number"
                      min="0"
                      value={row.priceMin}
                      placeholder="From"
                      onChange={(e) => update(row.key, { priceMin: e.target.value })}
                    />
                    <Input
                      value={row.currency}
                      placeholder="NGN"
                      onChange={(e) => update(row.key, { currency: e.target.value.toUpperCase() })}
                    />
                    <div className="flex items-center justify-between gap-2 sm:justify-end">
                      {error ? (
                        <DotBadge tone="danger">{error}</DotBadge>
                      ) : (
                        <DotBadge tone="success">Looks good</DotBadge>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-xl text-brand-accent/40 hover:text-rose-500"
                        onClick={() => setRows((p) => p.filter((r) => r.key !== row.key))}
                      >
                        <HugeiconsIcon icon={Trash} className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {step === "done" && (
            <div className="flex flex-col items-center gap-4 py-16 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-green/10 text-brand-green">
                <HugeiconsIcon icon={Check} className="h-8 w-8" />
              </div>
              <p className="font-serif text-xl text-brand-deep dark:text-brand-cream">
                Import complete
              </p>
              <Button className="h-11 rounded-full px-6" onClick={() => onOpenChange(false)}>
                Done
              </Button>
            </div>
          )}
        </DrawerBody>

        {step === "review" && (
          <DrawerFooter className="gap-2 sm:flex-row sm:items-center">
            <Button variant="ghost" className="h-11 w-full rounded-2xl sm:w-auto" onClick={reset}>
              <HugeiconsIcon icon={ArrowLeft} className="mr-1.5 h-4 w-4" />
              Start over
            </Button>
            <Button
              className="h-11 w-full rounded-2xl font-semibold sm:flex-1"
              disabled={hasErrors || rows.length === 0 || bulkImport.isPending}
              onClick={confirm}
            >
              {bulkImport.isPending
                ? "Importing…"
                : `Import ${rows.length} ${noun}${rows.length === 1 ? "" : "s"}`}
            </Button>
          </DrawerFooter>
        )}
      </DrawerContent>
    </Drawer>
  );
}
