"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { useParams, useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { Trash2, GripVertical, ChevronUp, Settings2 } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/app/components/ui/button"
import { Input } from "@/app/components/ui/input"
import { GlassCard } from "@/app/components/ui/glass-card"
import { SortableBlockList } from "@/app/components/ui/sortable-block-list"

import {
  useStorefrontPage,
  useCreateStorefrontPage,
  useUpdateStorefrontPage,
} from "@/app/domains/storefront/hooks/useStorefrontPages"
import { useStorefrontTheme } from "@/app/domains/storefront/hooks/useStorefrontTheme"

import { EditorHeader } from "@/app/domains/storefront/components/editor/EditorHeader"
import { EditorCanvas, PreviewThemeScope } from "@/app/domains/storefront/components/editor/EditorCanvas"
import { BlockRenderer } from "@/app/domains/storefront/components/editor/BlockRenderer"
import { BlockEditor } from "@/app/domains/storefront/components/editor/BlockEditor"
import { AddBlockMenu } from "@/app/domains/storefront/components/editor/AddBlockMenu"
import { ImageUrlField } from "@/app/domains/storefront/components/editor/ImageUrlField"
import { BLOCK_META, createBlock, type BlockSection, type BlockType } from "@/app/domains/storefront/components/editor/block-types"
import { cn } from "@/app/lib/utils"

export default function EditorV01Page() {
  const params = useParams()
  const router = useRouter()
  const pageSlug = (params?.pageSlug as string) ?? "new"
  const isNewPage = pageSlug === "new"

  const { data: pageData, isLoading } = useStorefrontPage(isNewPage ? null : pageSlug)
  const { data: theme } = useStorefrontTheme()
  const createPage = useCreateStorefrontPage()
  const updatePage = useUpdateStorefrontPage(isNewPage ? "" : pageSlug)

  const [title, setTitle] = useState("")
  const [slug, setSlug] = useState("")
  const [sections, setSections] = useState<BlockSection[]>([])
  const [activeBlockId, setActiveBlockId] = useState<string | null>(null)
  const [previewDark, setPreviewDark] = useState(false)
  const [showPageSettings, setShowPageSettings] = useState(false)
  const [metaTitle, setMetaTitle] = useState("")
  const [metaDescription, setMetaDescription] = useState("")
  const [metaImageUrl, setMetaImageUrl] = useState("")
  const [initialized, setInitialized] = useState(false)

  useEffect(() => {
    if (theme?.themeMode === "dark") setPreviewDark(true)
    else if (theme?.themeMode === "auto") {
      setPreviewDark(window.matchMedia("(prefers-color-scheme: dark)").matches)
    }
  }, [theme?.themeMode])

  useEffect(() => {
    if (isNewPage) {
      setTitle("")
      setSlug("")
      setMetaTitle("")
      setMetaDescription("")
      setMetaImageUrl("")
      setSections([])
      setInitialized(true)
      return
    }
    if (!pageData) return
    setTitle(pageData.title ?? "")
    setSlug(pageData.slug ?? "")
    setMetaTitle(pageData.metaTitle ?? "")
    setMetaDescription(pageData.metaDescription ?? "")
    setMetaImageUrl(pageData.metaImageUrl ?? "")
    const raw = (pageData.content?.sections ?? []) as Array<{
      id: string
      type: string
      config?: Record<string, unknown>
      data?: Record<string, unknown>
    }>
    setSections(
      raw.map((s) => {
        let data = (s.data ?? {}) as Record<string, unknown>
        if (s.type === "cta" && data.theme === "default") data = { ...data, theme: "light" }
        if (s.type === "faq" && Array.isArray(data.items)) {
          data = {
            ...data,
            items: data.items.map((item: { q?: string; a?: string }) => ({
              question: item.q ?? "",
              answer: item.a ?? "",
            })),
          }
        }
        if (s.type === "testimonials" && Array.isArray(data.items)) {
          data = {
            ...data,
            items: data.items.map((item: { name?: string; role?: string; content?: string }) => ({
              quote: item.content ?? "",
              name: item.name ?? "",
              role: item.role ?? "",
            })),
          }
        }
        return {
          id: s.id,
          type: s.type as BlockType,
          config: {
            padding: "md" as const,
            background: "default" as const,
            textAlign: "left" as const,
            showBorder: false,
            ...(s.config as Record<string, unknown>),
          },
          data,
        }
      })
    )
    setInitialized(true)
  }, [pageData, isNewPage])

  const payloadSections = useMemo(() => {
    return sections.map((s) => {
      let data = { ...s.data }
      if (s.type === "cta" && data.theme === "light") data = { ...data, theme: "default" }
      if (s.type === "faq" && Array.isArray(data.items)) {
        data = {
          ...data,
          items: data.items.map((item: { question?: string; answer?: string }) => ({
            q: item.question ?? "",
            a: item.answer ?? "",
          })),
        }
      }
      if (s.type === "testimonials" && Array.isArray(data.items)) {
        data = {
          ...data,
          items: data.items.map((item: { quote?: string; name?: string; role?: string }) => ({
            name: item.name ?? "",
            role: item.role ?? "",
            content: item.quote ?? "",
          })),
        }
      }
      return { ...s, data }
    })
  }, [sections])

  const handleSave = useCallback(() => {
    const meta = {
      metaTitle: metaTitle || null,
      metaDescription: metaDescription || null,
      metaImageUrl: metaImageUrl || null,
    }
    if (isNewPage) {
      const finalSlug =
        (slug || title).trim().toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "") ||
        `page-${Date.now().toString(36)}`
      createPage.mutate(
        {
          title: title || "Untitled",
          slug: finalSlug,
          isPublished: true,
          content: { sections: payloadSections },
          ...meta,
        },
        { onSuccess: () => router.replace(`/storefront/editor/v0.1/${finalSlug}`) }
      )
    } else {
      updatePage.mutate({
        title: title || "Untitled",
        isPublished: true,
        content: { sections: payloadSections },
        ...meta,
      })
    }
  }, [isNewPage, slug, title, metaTitle, metaDescription, metaImageUrl, payloadSections, createPage, updatePage, router])

  const addBlock = useCallback(
    (type: BlockType, afterIndex?: number) => {
      const block = createBlock(type)
      setSections((prev) => {
        if (afterIndex !== undefined) {
          const next = [...prev]
          next.splice(afterIndex + 1, 0, block)
          return next
        }
        return [...prev, block]
      })
      setActiveBlockId(block.id)
    },
    []
  )

  const updateBlock = useCallback(
    (id: string, updates: { data?: Record<string, unknown>; config?: Partial<BlockSection["config"]> }) => {
      setSections((prev) =>
        prev.map((s) => {
          if (s.id !== id) return s
          return {
            ...s,
            ...(updates.data !== undefined && { data: updates.data }),
            ...(updates.config !== undefined && { config: { ...s.config, ...updates.config } }),
          }
        })
      )
    },
    []
  )

  const deleteBlock = useCallback(
    (id: string) => {
      setSections((prev) => prev.filter((s) => s.id !== id))
      if (activeBlockId === id) setActiveBlockId(null)
    },
    [activeBlockId]
  )

  const isSaving = createPage.isPending || updatePage.isPending

  if (isLoading && !isNewPage) {
    return (
      <div className="min-h-dvh flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-brand-gold border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!initialized && !isNewPage && !pageData && !isLoading) {
    return (
      <div className="min-h-dvh flex items-center justify-center">
        <p className="text-brand-deep/70 dark:text-brand-cream/70">Page not found.</p>
      </div>
    )
  }

  return (
    <div className="h-dvh flex flex-col min-h-0">
      <header className="shrink-0">
      <EditorHeader
        title={title}
        isSaving={isSaving}
        onSave={handleSave}
        previewDark={previewDark}
        onTogglePreviewDark={() => {
          setPreviewDark((p) => !p)
          setActiveBlockId(null)
        }}
      />
      </header>

      <main className="flex-1 overflow-y-auto min-h-0 max-w-4xl w-full mx-auto px-4 py-8 space-y-6">
        {/* Page title + settings */}
        <GlassCard className="p-5">
          <div className="flex items-center gap-3">
            <input
              value={title ?? ""}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Page title…"
              className="flex-1 bg-transparent text-2xl font-serif font-bold text-brand-deep dark:text-brand-cream placeholder:text-brand-deep/20 dark:placeholder:text-white/20 focus:outline-none"
            />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowPageSettings((p) => !p)}
              className={cn("h-9 w-9 rounded-full transition-all duration-300", showPageSettings && "bg-brand-green/10 dark:bg-brand-gold/10")}
            >
              {showPageSettings ? <ChevronUp className="w-4 h-4" /> : <Settings2 className="w-4 h-4" />}
            </Button>
          </div>
          <AnimatePresence>
            {showPageSettings && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                className="overflow-hidden"
              >
                <div className="pt-4 space-y-3 border-t border-brand-deep/5 dark:border-white/5 mt-4">
                  {isNewPage && (
                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-widest text-brand-accent/40 dark:text-white/40 mb-1 block">
                        URL Slug
                      </label>
                      <Input
                        value={slug ?? ""}
                        onChange={(e) => setSlug(e.target.value)}
                        placeholder="about-us"
                        className="h-9 font-mono text-sm"
                      />
                    </div>
                  )}
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-widest text-brand-accent/40 dark:text-white/40 mb-1 block">
                      SEO Title
                    </label>
                    <Input
                      value={metaTitle ?? ""}
                      onChange={(e) => setMetaTitle(e.target.value)}
                      placeholder="Optional"
                      className="h-9"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-widest text-brand-accent/40 dark:text-white/40 mb-1 block">
                      SEO Description
                    </label>
                    <textarea
                      value={metaDescription ?? ""}
                      onChange={(e) => setMetaDescription(e.target.value)}
                      placeholder="Optional"
                      className="w-full rounded-xl p-2.5 text-sm min-h-[60px] bg-white/50 dark:bg-white/5 border border-brand-deep/10 dark:border-white/10 resize-none text-brand-deep dark:text-brand-cream focus:outline-none focus:ring-1 focus:ring-brand-green/20"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-widest text-brand-accent/40 dark:text-white/40 mb-1 block">
                      SEO Image
                    </label>
                    <ImageUrlField
                      value={metaImageUrl ?? ""}
                      onChange={setMetaImageUrl}
                      placeholder="Paste URL or upload (optional)"
                    />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </GlassCard>

        {/* Block canvas */}
        <EditorCanvas
          previewDark={previewDark}
          className="rounded-[32px] border border-brand-deep/10 dark:border-white/10 shadow-[0_8px_32px_rgba(6,44,33,0.04)] dark:shadow-[0_8px_24px_rgba(0,0,0,0.2)] overflow-hidden min-h-[300px]"
        >
          {sections.length === 0 && (
            <PreviewThemeScope className="flex flex-col items-center justify-center py-20 opacity-40 min-h-[200px]">
              <p className="text-sm mb-4" style={{ fontFamily: "var(--sf-font-body)" }}>
                Your page is empty. Add your first block below.
              </p>
            </PreviewThemeScope>
          )}

          <SortableBlockList
            items={sections}
            onReorder={setSections}
            itemClassName="!rounded-none !border-0 !border-b border-brand-deep/5 !bg-transparent !shadow-none"
            renderItem={(block) => (
              <EditableBlock
                block={block}
                previewDark={previewDark}
                isActive={activeBlockId === block.id}
                onActivate={() => setActiveBlockId(block.id)}
                onDeactivate={() => setActiveBlockId(null)}
                onUpdate={(data) => updateBlock(block.id, { data })}
                onUpdateConfig={(config) => updateBlock(block.id, { config })}
                onDelete={() => deleteBlock(block.id)}
                onAddBelow={(type) => {
                  const idx = sections.findIndex((s) => s.id === block.id)
                  addBlock(type, idx)
                }}
              />
            )}
          />
        </EditorCanvas>

        <AddBlockMenu onAdd={(type) => addBlock(type)} />
      </main>
    </div>
  )
}

interface EditableBlockProps {
  block: BlockSection
  previewDark: boolean
  isActive: boolean
  onActivate: () => void
  onDeactivate: () => void
  onUpdate: (data: Record<string, unknown>) => void
  onUpdateConfig: (config: Partial<BlockSection["config"]>) => void
  onDelete: () => void
  onAddBelow: (type: BlockType) => void
}

function EditableBlock({ block, previewDark, isActive, onActivate, onDeactivate, onUpdate, onUpdateConfig, onDelete, onAddBelow }: EditableBlockProps) {
  const meta = BLOCK_META[block.type]

  return (
    <div className="relative group/block">
      {/* Block type label */}
      <div className="absolute -top-0.5 left-0 z-10 flex items-center gap-1.5 px-2 py-0.5 opacity-0 group-hover/block:opacity-100 transition-opacity duration-200">
        <span className="text-[9px] font-bold uppercase tracking-widest" style={{ color: "var(--sf-secondary)" }}>
          {meta?.label ?? block.type}
        </span>
      </div>

      {/* Delete button */}
      <div className="absolute top-2 right-2 z-10 flex items-center gap-1 opacity-0 group-hover/block:opacity-100 transition-opacity duration-200">
        <Button
          variant="ghost"
          size="icon"
          onClick={(e) => { e.stopPropagation(); onDelete() }}
          className="h-7 w-7 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20 hover:text-red-600"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </Button>
      </div>

      {/* Preview — click to open editor, click again to close; theme applies only here */}
      <PreviewThemeScope
        onClick={() => (isActive ? onDeactivate() : onActivate())}
        className={cn(
          "cursor-pointer transition-all duration-300 rounded-lg",
          isActive ? "ring-2 ring-[var(--sf-secondary)] ring-offset-2" : "hover:ring-1 hover:ring-[var(--sf-secondary)]/30"
        )}
        style={{ ["--tw-ring-offset-color" as string]: "var(--sf-background)" }}
      >
        <BlockRenderer block={block} previewDark={previewDark} />
      </PreviewThemeScope>

      {/* Inline editor */}
      <AnimatePresence>
        {isActive && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <div
              className="border-t mt-1 rounded-b-xl"
              style={{
                borderColor: "color-mix(in srgb, var(--sf-text) 8%, transparent)",
                backgroundColor: "color-mix(in srgb, var(--sf-background) 97%, var(--sf-text))",
              }}
            >
              <div className="flex items-center justify-between px-4 pt-3 pb-1">
                <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "var(--sf-secondary)" }}>
                  Edit {meta?.label}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => { e.stopPropagation(); onDeactivate() }}
                  className="h-7 rounded-md text-xs gap-1"
                  style={{ color: "var(--sf-text)" }}
                >
                  <ChevronUp className="w-3 h-3" /> Close
                </Button>
              </div>
              <BlockEditor block={block} onUpdate={onUpdate} onUpdateConfig={onUpdateConfig} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
