"use client"

import Link from "next/link"
import { ArrowLeft, Save, Sun, Moon } from "lucide-react"
import { Button } from "@/app/components/ui/button"

interface EditorHeaderProps {
  title: string
  isSaving: boolean
  onSave: () => void
  previewDark: boolean
  onTogglePreviewDark: () => void
}

export function EditorHeader({ title, isSaving, onSave, previewDark, onTogglePreviewDark }: EditorHeaderProps) {
  return (
    <header className="sticky top-0 z-40 border-b border-brand-deep/10 dark:border-white/10 bg-brand-cream/80 dark:bg-zinc-900/80 backdrop-blur-md">
      <div className="max-w-5xl mx-auto px-4 py-2.5 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/storefront/pages">
            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div className="h-5 w-px bg-brand-deep/10 dark:bg-white/10" />
          <div>
            <h1 className="text-sm font-semibold text-brand-deep dark:text-brand-cream leading-tight truncate max-w-[200px]">
              {title || "Untitled Page"}
            </h1>
            <span className="text-[10px] text-brand-accent/50 dark:text-white/40 font-medium">
              Editor v0.1
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={onTogglePreviewDark}
            className="rounded-full h-9 gap-2 text-xs font-medium"
          >
            {previewDark ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
            {previewDark ? "Light" : "Dark"} preview
          </Button>

          <Button
            onClick={onSave}
            disabled={isSaving}
            className="rounded-full bg-brand-deep text-brand-gold dark:bg-brand-gold dark:text-brand-deep font-bold px-6 h-9 gap-2 shadow-lg hover:scale-105 transition-all duration-300"
          >
            <Save className="w-3.5 h-3.5" />
            {isSaving ? "Saving…" : "Save"}
          </Button>
        </div>
      </div>
    </header>
  )
}
