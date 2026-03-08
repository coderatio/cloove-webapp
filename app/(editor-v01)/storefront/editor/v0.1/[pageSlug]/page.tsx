"use client"

import { useState, useEffect, useCallback, useMemo, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { Trash2, GripVertical, ChevronUp, Settings2, Eye, EyeOff } from "lucide-react"
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
import { AddBlockMenu, InlineAddBlockButton } from "@/app/domains/storefront/components/editor/AddBlockMenu"
import { ImageUrlField } from "@/app/domains/storefront/components/editor/ImageUrlField"
import { ColorPicker } from "@/app/components/ui/color-picker"
import { Switch } from "@/app/components/ui/switch"
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
  const [isPreviewMode, setIsPreviewMode] = useState(false)
  const [showPageSettings, setShowPageSettings] = useState(false)
  const [metaTitle, setMetaTitle] = useState("")
  const [metaDescription, setMetaDescription] = useState("")
  const [metaImageUrl, setMetaImageUrl] = useState("")
  const [globalPageBgLight, setGlobalPageBgLight] = useState<string>("")
  const [globalPageBgDark, setGlobalPageBgDark] = useState<string>("")
  const [globalPageTextColorLight, setGlobalPageTextColorLight] = useState<string>("")
  const [globalPageTextColorDark, setGlobalPageTextColorDark] = useState<string>("")
  const [isPublished, setIsPublished] = useState(true)
  const [isHome, setIsHome] = useState(false)
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

    // Explicitly parse the page-level config from content.config
    const pConfig = (pageData.content as { config?: Record<string, string> })?.config
    setGlobalPageBgLight(pConfig?.globalBackgroundLight ?? "")
    setGlobalPageBgDark(pConfig?.globalBackgroundDark ?? "")
    setGlobalPageTextColorLight(pConfig?.globalTextColorLight ?? "")
    setGlobalPageTextColorDark(pConfig?.globalTextColorDark ?? "")
    setIsPublished(!!pageData.isPublished)
    setIsHome(!!pageData.isHome)

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
        const c = (s.config ?? {}) as Record<string, unknown>
        return {
          id: s.id,
          type: s.type as BlockType,
          config: {
            ...c,
            padding: (c.padding === "sm" || c.padding === "lg" ? c.padding : "md") as "sm" | "md" | "lg",
            background: (c.background === "muted" || c.background === "accent" ? c.background : "default") as "default" | "muted" | "accent",
            textAlign: (c.textAlign === "center" || c.textAlign === "right" ? c.textAlign : "left") as "left" | "center" | "right",
            showBorder: Boolean(c.showBorder),
            sectionBackground: c.sectionBackground,
            sectionBackgroundDark: c.sectionBackgroundDark,
            textColorLight: typeof c.textColorLight === "string" ? c.textColorLight : undefined,
            textColorDark: typeof c.textColorDark === "string" ? c.textColorDark : undefined,
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
          isPublished,
          isHome,
          content: {
            sections: payloadSections,
            config: {
              globalBackgroundLight: globalPageBgLight,
              globalBackgroundDark: globalPageBgDark,
              globalTextColorLight: globalPageTextColorLight,
              globalTextColorDark: globalPageTextColorDark,
            }
          } as any,
          ...meta,
        },
        { onSuccess: () => router.replace(`/storefront/editor/v0.1/${finalSlug}`) }
      )
    } else {
      updatePage.mutate({
        title: title || "Untitled",
        isPublished,
        isHome,
        content: {
          sections: payloadSections,
          config: {
            globalBackgroundLight: globalPageBgLight,
            globalBackgroundDark: globalPageBgDark,
            globalTextColorLight: globalPageTextColorLight,
            globalTextColorDark: globalPageTextColorDark,
          }
        } as any,
        ...meta,
      })
    }
  }, [isNewPage, slug, title, metaTitle, metaDescription, metaImageUrl, payloadSections, isPublished, isHome, globalPageBgLight, globalPageBgDark, globalPageTextColorLight, globalPageTextColorDark, createPage, updatePage, router])

  const [scrollToBlockId, setScrollToBlockId] = useState<string | null>(null)

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
      setScrollToBlockId(block.id)
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

  const activeBg = previewDark ? globalPageBgDark : globalPageBgLight

  return (
    <div
      className="h-dvh flex flex-col min-h-0 transition-colors duration-300"
      style={isPreviewMode && activeBg ? { backgroundColor: activeBg } : undefined}
    >
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
          isPreviewMode={isPreviewMode}
          onTogglePreviewMode={() => setIsPreviewMode((p) => !p)}
        />
      </header>

      <main className={cn(
        "flex-1 overflow-y-auto min-h-0 w-full mx-auto flex flex-col",
        isPreviewMode ? "max-w-none px-0 py-0 space-y-0" : "max-w-4xl px-4 py-8 space-y-6"
      )}>
        <EditorCanvas
          previewDark={previewDark}
          pageBackground={previewDark ? globalPageBgDark : globalPageBgLight}
          pageTextColor={previewDark ? globalPageTextColorDark : globalPageTextColorLight}
          className={cn(
            "flex-1 w-full mx-auto transition-all duration-500",
            isPreviewMode ? "max-w-none" : "max-w-4xl space-y-6"
          )}
        >
          {/* Page title + settings */}
          <div className={cn(
            !isPreviewMode && "p-5 transition-all duration-300 rounded-3xl bg-white/40 dark:bg-white/5 border border-brand-deep/10 dark:border-white/10 backdrop-blur-md shadow-[0_8px_32px_rgba(6,44,33,0.04)]",
            isPreviewMode && "px-4 pt-12 pb-6 max-w-4xl mx-auto"
          )}>
            <div className="flex items-center gap-3">
              {isPreviewMode ? (
                <h1
                  className="flex-1 text-4xl font-serif font-bold py-1 transition-colors duration-300"
                  style={{
                    color: previewDark
                      ? (globalPageTextColorDark || "#f5f0e6") // Light cream fallback for dark mode
                      : (globalPageTextColorLight || "#062c21") // Dark green fallback for light mode
                  }}
                >
                  {title || "Untitled Page"}
                </h1>
              ) : (
                <>
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
                </>
              )}
            </div>
            <AnimatePresence>
              {!isPreviewMode && showPageSettings && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
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
                        className="w-full rounded-2xl p-2.5 text-sm min-h-[60px] bg-white/50 dark:bg-white/5 border border-brand-deep/10 dark:border-white/10 resize-none text-brand-deep dark:text-brand-cream focus:outline-none focus:ring-1 focus:ring-brand-green/20"
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
                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-brand-deep/5 dark:border-white/5 mt-4">
                      <div className="flex items-center justify-between col-span-2 py-2">
                        <div>
                          <span className="text-sm font-medium text-brand-deep dark:text-brand-cream block">Home Page</span>
                          <span className="text-[10px] text-brand-accent/40 dark:text-white/40 uppercase tracking-wider">Set as storefront landing</span>
                        </div>
                        <Switch checked={isHome} onCheckedChange={setIsHome} />
                      </div>
                      <div className="flex items-center justify-between col-span-2 py-2">
                        <div>
                          <span className="text-sm font-medium text-brand-deep dark:text-brand-cream block">Published</span>
                          <span className="text-[10px] text-brand-accent/40 dark:text-white/40 uppercase tracking-wider">Visible to customers</span>
                        </div>
                        <Switch checked={isPublished} onCheckedChange={setIsPublished} />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold uppercase tracking-widest text-brand-accent/40 dark:text-white/40 mb-1 block">
                          Global BG (Light)
                        </label>
                        <ColorPicker
                          color={globalPageBgLight || ""}
                          onChange={(c) => setGlobalPageBgLight(c)}
                          showHexInput
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold uppercase tracking-widest text-brand-accent/40 dark:text-white/40 mb-1 block">
                          Global BG (Dark)
                        </label>
                        <ColorPicker
                          color={globalPageBgDark || ""}
                          onChange={(c) => setGlobalPageBgDark(c)}
                          showHexInput
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold uppercase tracking-widest text-brand-accent/40 dark:text-white/40 mb-1 block">
                          Text Color (Light)
                        </label>
                        <ColorPicker
                          color={globalPageTextColorLight || ""}
                          onChange={(c) => setGlobalPageTextColorLight(c)}
                          showHexInput
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold uppercase tracking-widest text-brand-accent/40 dark:text-white/40 mb-1 block">
                          Text Color (Dark)
                        </label>
                        <ColorPicker
                          color={globalPageTextColorDark || ""}
                          onChange={(c) => setGlobalPageTextColorDark(c)}
                          showHexInput
                        />
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Block canvas */}
          <div className={cn(
            "overflow-hidden min-h-[300px]",
            !isPreviewMode && "rounded-[32px] py-4 border border-brand-deep/10 dark:border-white/10 shadow-[0_8px_32px_rgba(6,44,33,0.04)] dark:shadow-[0_8px_24px_rgba(0,0,0,0.2)] bg-white/10 dark:bg-white/5",
            isPreviewMode && "max-w-5xl mx-auto"
          )}>
            {!isPreviewMode && (
              <div className="group px-4 -mb-4 relative z-10">
                <InlineAddBlockButton onAdd={(type) => addBlock(type, -1)} />
              </div>
            )}
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
              hideHandle={isPreviewMode}
              itemClassName="!rounded-none !border-0 !bg-transparent !shadow-none"
              renderItem={(block) => {
                if (isPreviewMode) {
                  return (
                    <div className="relative group/block first:mt-0 last:mb-0">
                      <PreviewThemeScope>
                        <BlockRenderer block={block} previewDark={previewDark} />
                      </PreviewThemeScope>
                    </div>
                  )
                }
                return (
                  <EditableBlock
                    block={block}
                    previewDark={previewDark}
                    isActive={activeBlockId === block.id}
                    scrollToBlockId={scrollToBlockId}
                    onClearScrollTo={() => setScrollToBlockId(null)}
                    onActivate={() => setActiveBlockId(block.id)}
                    onDeactivate={() => setActiveBlockId(null)}
                    onUpdate={(data) => updateBlock(block.id, { data })}
                    onUpdateConfig={(config) => updateBlock(block.id, { config })}
                    onDelete={() => deleteBlock(block.id)}
                    isLast={sections.findIndex(s => s.id === block.id) === sections.length - 1}
                    onAddBelow={(type) => {
                      const idx = sections.findIndex((s) => s.id === block.id)
                      addBlock(type, idx)
                    }}
                  />
                )
              }}
            />
          </div>
        </EditorCanvas>

        {!isPreviewMode && <AddBlockMenu onAdd={(type) => addBlock(type)} />}
      </main>
    </div>
  )
}

interface EditableBlockProps {
  block: BlockSection
  previewDark: boolean
  isActive: boolean
  scrollToBlockId: string | null
  onClearScrollTo: () => void
  onActivate: () => void
  onDeactivate: () => void
  onUpdate: (data: Record<string, unknown>) => void
  onUpdateConfig: (config: Partial<BlockSection["config"]>) => void
  onDelete: () => void
  onAddBelow: (type: BlockType) => void
  isLast?: boolean
}

function EditableBlock({ block, previewDark, isActive, scrollToBlockId, onClearScrollTo, onActivate, onDeactivate, onUpdate, onUpdateConfig, onDelete, onAddBelow, isLast }: EditableBlockProps) {
  const meta = BLOCK_META[block.type]
  const blockRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollToBlockId !== block.id || !blockRef.current) return
    blockRef.current.scrollIntoView({ behavior: "smooth", block: "nearest" })
    onClearScrollTo()
  }, [scrollToBlockId, block.id, onClearScrollTo])

  return (
    <div ref={blockRef} className="relative group group/block">
      {/* Block type label */}
      <div className={cn(
        "absolute -top-3 left-5 z-20 flex items-center gap-1.5 transition-opacity duration-200 pointer-events-none",
        isActive ? "opacity-100" : "opacity-0 group-hover/block:opacity-100"
      )}>
        <span className="text-[10px] font-bold uppercase tracking-widest bg-white dark:bg-black px-2.5 py-1.5 rounded-[6px] shadow-sm border border-brand-deep/10 dark:border-white/10 leading-none flex items-center" style={{ color: "var(--sf-secondary)" }}>
          {meta?.label ?? block.type}
        </span>
      </div>

      {/* Visibility toggle + Delete button */}
      <div className={cn(
        "absolute -top-3 right-5 z-20 flex items-center gap-1 transition-opacity duration-200",
        isActive ? "opacity-100" : "opacity-0 group-hover/block:opacity-100"
      )}>
        <Button
          variant="ghost"
          size="icon"
          onClick={(e) => { e.stopPropagation(); onUpdateConfig({ hidden: !block.config.hidden }) }}
          className="h-7 w-7 rounded-full bg-white dark:bg-black border border-brand-deep/10 dark:border-white/10 text-brand-deep/60 dark:text-brand-cream/60 hover:text-brand-deep dark:hover:text-brand-cream"
          title={block.config.hidden ? "Show section" : "Hide section"}
        >
          {block.config.hidden ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={(e) => { e.stopPropagation(); onDelete() }}
          className="h-7 w-7 rounded-full bg-white dark:bg-black border border-brand-deep/10 dark:border-white/10 text-red-500 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/30"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </Button>
      </div>

      {/* Preview — click to open editor; when hidden show placeholder */}
      <PreviewThemeScope
        onClick={() => (isActive ? onDeactivate() : onActivate())}
        className={cn(
          "relative cursor-pointer transition-all duration-300 rounded-3xl overflow-hidden bg-white/50 dark:bg-white/5",
          isActive ? "ring-2 ring-brand-deep/10 dark:ring-white/10 shadow-lg" : "border border-transparent hover:border-brand-deep/10 dark:hover:border-white/10 hover:shadow-sm"
        )}
        style={{
          backgroundColor: (block.config.sectionBackground || (previewDark && block.config.sectionBackgroundDark)) ? "transparent" : undefined,
        }}
      >
        {block.config.hidden ? (
          <div className="px-6 py-8 flex items-center justify-center border border-dashed border-brand-deep/15 dark:border-white/15 rounded-2xl min-h-[80px]">
            <span className="text-xs font-medium uppercase tracking-wider text-brand-deep/40 dark:text-brand-cream/40">Section hidden</span>
          </div>
        ) : (
          <BlockRenderer block={block} previewDark={previewDark} />
        )}
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
              className="mt-1 rounded-3xl"
              style={{
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

      {!isLast && (
        <div className="group -mt-4 relative z-10">
          <InlineAddBlockButton onAdd={onAddBelow} />
        </div>
      )}
    </div>
  )
}
