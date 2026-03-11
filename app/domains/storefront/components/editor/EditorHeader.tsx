"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowLeft, Save, Sun, Moon, Monitor, X } from "lucide-react"
import { Button } from "@/app/components/ui/button"
import { cn } from "@/app/lib/utils"

interface EditorHeaderProps {
  title: string
  isSaving: boolean
  onSave: () => void
  previewDark: boolean
  onTogglePreviewDark: () => void
  isPreviewMode: boolean
  onTogglePreviewMode: () => void
}

export function EditorHeader({ title, isSaving, onSave, previewDark, onTogglePreviewDark, isPreviewMode, onTogglePreviewMode }: EditorHeaderProps) {
  const [dismissed, setDismissed] = useState(false)

  return (
    <header className="sticky top-0 z-40 border-b border-brand-deep/10 dark:border-white/10 bg-brand-cream/80 dark:bg-zinc-900/80 backdrop-blur-md">
      {!dismissed && (
        <div className="md:hidden bg-brand-gold/10 border-b border-brand-gold/20">
          <div className="px-3 py-2.5 flex items-center gap-3">
            <Monitor className="w-4 h-4 text-brand-gold shrink-0" />
            <p className="text-[11px] font-medium text-brand-deep/70 dark:text-brand-cream/70 flex-1 leading-snug">
              The page editor works best on a tablet or desktop.
            </p>
            <button
              onClick={() => setDismissed(true)}
              className="shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-brand-deep/40 dark:text-brand-cream/40 hover:bg-brand-deep/5 dark:hover:bg-white/5 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
      <div className="max-w-5xl mx-auto px-3 md:px-4 py-2.5 flex items-center justify-between gap-2 md:gap-4">
        <div className="flex items-center gap-2 md:gap-3 min-w-0">
          <Link href="/storefront/pages">
            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full shrink-0">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div className="h-5 w-px bg-brand-deep/10 dark:bg-white/10 shrink-0 hidden md:block" />
          <div className="min-w-0">
            <h1 className="text-sm font-semibold text-brand-deep dark:text-brand-cream leading-tight truncate max-w-[120px] md:max-w-[200px]">
              {title || "Untitled Page"}
            </h1>
            <span className="text-[10px] text-brand-accent/50 dark:text-white/40 font-medium hidden md:block">
              Editor v0.1
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1 md:gap-2 shrink-0">
          <Button
            variant="ghost"
            size="sm"
            onClick={onTogglePreviewMode}
            className={cn("rounded-full h-9 gap-1.5 md:gap-2 text-xs font-medium px-2 md:px-3", isPreviewMode && "bg-brand-green/10 text-brand-green")}
          >
            <Sun className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{isPreviewMode ? "Exit preview" : "Preview"}</span>
          </Button>

          <div className="h-5 w-px bg-brand-deep/10 dark:bg-white/10 hidden md:block" />

          <Button
            variant="ghost"
            size="sm"
            onClick={onTogglePreviewDark}
            className="rounded-full h-9 gap-1.5 md:gap-2 text-xs font-medium px-2 md:px-3"
          >
            {previewDark ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{previewDark ? "Light" : "Dark"}</span>
          </Button>

          <Button
            onClick={onSave}
            disabled={isSaving}
            className="rounded-full bg-brand-deep text-brand-gold dark:bg-brand-gold dark:text-brand-deep font-bold px-3 md:px-6 h-9 gap-1.5 md:gap-2 shadow-lg hover:scale-105 transition-all duration-300"
          >
            <Save className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{isSaving ? "Saving…" : "Save"}</span>
          </Button>
        </div>
      </div>
    </header>
  )
}
