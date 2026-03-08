"use client"

import { useState } from "react"
import { Input } from "@/app/components/ui/input"
import { Button } from "@/app/components/ui/button"
import { ColorPicker } from "@/app/components/ui/color-picker"
import { RichTextEditor } from "./RichTextEditor"
import { ImageUrlField } from "./ImageUrlField"
import { Plus, Trash2, AlignLeft, AlignCenter, AlignRight } from "lucide-react"
import { Switch } from "@/app/components/ui/switch"
import { cn } from "@/app/lib/utils"
import { motion, AnimatePresence } from "framer-motion"
import { BLOCK_META, createBlock, type BlockSection, type BlockType, type GridLayoutColumn, type GridLayoutStyle, type FaqItem, type TestimonialItem, type FeatureItem, type CtaButton, type SectionBackground } from "./block-types"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/components/ui/select"
import { Textarea } from "@/app/components/ui/textarea"
import { useProductCategories } from "@/app/domains/inventory/hooks/useProductCategories"
import { usePromotions } from "@/app/domains/orders/hooks/usePromotions"

const GRADIENT_DIR_OPTIONS = [
  { value: "to-br", label: "↘ Bottom right" },
  { value: "to-r", label: "→ Right" },
  { value: "to-b", label: "↓ Bottom" },
  { value: "to-tr", label: "↗ Top right" },
  { value: "to-t", label: "↑ Top" },
  { value: "to-tl", label: "↖ Top left" },
  { value: "to-l", label: "← Left" },
  { value: "to-bl", label: "↙ Bottom left" },
]

interface BlockEditorProps {
  block: BlockSection
  onUpdate: (data: Record<string, unknown>) => void
  onUpdateConfig?: (config: Partial<BlockSection["config"]>) => void
}

export function BlockEditor({ block, onUpdate, onUpdateConfig }: BlockEditorProps) {
  const { data } = block
  const set = (key: string, value: unknown) => onUpdate({ ...data, [key]: value })
  const setNested = (parent: string, key: string, value: unknown) => {
    const obj = (data[parent] as Record<string, unknown>) ?? {}
    onUpdate({ ...data, [parent]: { ...obj, [key]: value } })
  }

  let content: React.ReactNode
  switch (block.type) {
    case "hero":
      content = <HeroEditor data={data} set={set} setNested={setNested} />
      break
    case "rich_text":
      content = <RichTextBlockEditor data={data} set={set} />
      break
    case "cta":
      content = <CtaEditor data={data} set={set} setNested={setNested} />
      break
    case "faq":
      content = <FaqEditor data={data} onUpdate={onUpdate} />
      break
    case "testimonials":
      content = <TestimonialsEditor data={data} onUpdate={onUpdate} />
      break
    case "grid_features":
      content = <GridFeaturesEditor data={data} onUpdate={onUpdate} />
      break
    case "contact_block":
      content = <ContactEditor data={data} set={set} />
      break
    case "image_gallery":
      content = <ImageGalleryEditor data={data} onUpdate={onUpdate} set={set} />
      break
    case "product_listing":
      content = <ProductListingEditor data={data} set={set} />
      break
    case "featured_products":
      content = <FeaturedProductsEditor data={data} set={set} />
      break
    case "on_sale":
      content = <OnSaleEditor data={data} set={set} />
      break
    case "promotion_banner":
      content = <PromotionBannerEditor data={data} set={set} setNested={setNested} />
      break
    case "image":
      content = <ImageEditor data={data} set={set} />
      break
    case "grid_layout":
      content = <GridLayoutEditor data={data} onUpdate={onUpdate} />
      break
    default:
      content = <GenericEditor data={data} set={set} />
  }

  return (
    <div className="space-y-0">
      {content}
      {onUpdateConfig && (
        <>
          <SectionBackgroundEditor
            config={block.config}
            onUpdateConfig={onUpdateConfig}
            configKey="sectionBackground"
            title="Section background (light)"
          />
          <SectionBackgroundEditor
            config={block.config}
            onUpdateConfig={onUpdateConfig}
            configKey="sectionBackgroundDark"
            title="Section background (dark mode)"
          />
          <SectionTextAlignEditor config={block.config} onUpdateConfig={onUpdateConfig} />
          <SectionTextColorEditor config={block.config} onUpdateConfig={onUpdateConfig} />
        </>
      )}
    </div>
  )
}

function SectionBackgroundEditor({
  config,
  onUpdateConfig,
  configKey,
  title,
}: {
  config: BlockSection["config"]
  onUpdateConfig: (c: Partial<BlockSection["config"]>) => void
  configKey: "sectionBackground" | "sectionBackgroundDark"
  title: string
}) {
  const bg = config[configKey]

  const setBg = (next: SectionBackground | undefined) => {
    onUpdateConfig({ [configKey]: next })
  }

  return (
    <div className="space-y-4 p-4 border-t border-brand-deep/5 dark:border-white/5">
      <EditorSection title={title}>
        <div className="flex flex-wrap gap-2">
          <Button
            variant={!bg ? "base" : "ghost"}
            size="sm"
            onClick={() => setBg(undefined)}
            className="rounded-lg text-xs"
          >
            None
          </Button>
          <Button
            variant={bg?.type === "solid" ? "base" : "ghost"}
            size="sm"
            onClick={() => setBg(bg?.type === "solid" ? bg : { type: "solid", color: "#ffffff" })}
            className="rounded-lg text-xs"
          >
            Solid
          </Button>
          <Button
            variant={bg?.type === "gradient" ? "base" : "ghost"}
            size="sm"
            onClick={() =>
              setBg(
                bg?.type === "gradient"
                  ? bg
                  : { type: "gradient", direction: "to-br", color1: "#062c21", color2: "#d4af37" }
              )
            }
            className="rounded-lg text-xs"
          >
            Gradient
          </Button>
          <Button
            variant={bg?.type === "image" ? "base" : "ghost"}
            size="sm"
            onClick={() =>
              setBg(
                bg?.type === "image"
                  ? bg
                  : { type: "image", imageUrl: "", overlayOpacity: 0.4, overlayColor: "#000000" }
              )
            }
            className="rounded-lg text-xs"
          >
            Image
          </Button>
        </div>

        {bg?.type === "solid" && (
          <div className="mt-3">
            <span className={labelCn}>Color</span>
            <ColorPicker
              color={bg.color}
              onChange={(color) => setBg({ ...bg, color })}
            />
          </div>
        )}

        {bg?.type === "gradient" && (
          <div className="mt-3 space-y-3">
            <Field label="Direction">
              <Select value={bg.direction} onValueChange={(value) => setBg({ ...bg, direction: value })}>
                <SelectTrigger className="w-full h-9 bg-white/50 dark:bg-white/5 border-brand-deep/10 dark:border-white/10 text-brand-deep dark:text-brand-cream">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {GRADIENT_DIR_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Color 1">
                <ColorPicker color={bg.color1} onChange={(color1) => setBg({ ...bg, color1 })} />
              </Field>
              <Field label="Color 2">
                <ColorPicker color={bg.color2} onChange={(color2) => setBg({ ...bg, color2 })} />
              </Field>
            </div>
          </div>
        )}

        {bg?.type === "image" && (
          <div className="mt-3 space-y-3">
            <Field label="Image">
              <ImageUrlField
                value={bg.imageUrl}
                onChange={(imageUrl) => setBg({ ...bg, imageUrl })}
                placeholder="Paste URL or upload"
              />
            </Field>
            <Field label="Overlay opacity (0–100%)">
              <input
                type="range"
                min={0}
                max={100}
                value={Math.round((bg.overlayOpacity ?? 0.4) * 100)}
                onChange={(e) => setBg({ ...bg, overlayOpacity: Number(e.target.value) / 100 })}
                className="w-full h-2 rounded-full appearance-none bg-brand-deep/10 dark:bg-white/10 accent-brand-green dark:accent-brand-gold"
              />
              <span className="text-xs text-brand-accent/60 dark:text-white/40 ml-2">
                {Math.round((bg.overlayOpacity ?? 0.4) * 100)}%
              </span>
            </Field>
            <Field label="Overlay color">
              <ColorPicker
                color={bg.overlayColor ?? "#000000"}
                onChange={(overlayColor) => setBg({ ...bg, overlayColor })}
                className="max-w-[200px]"
              />
            </Field>
          </div>
        )}
      </EditorSection>
    </div>
  )
}

function SectionTextColorEditor({
  config,
  onUpdateConfig,
}: {
  config: BlockSection["config"]
  onUpdateConfig: (c: Partial<BlockSection["config"]>) => void
}) {
  const light = config.textColorLight ?? ""
  const dark = config.textColorDark ?? ""

  return (
    <div className="grid grid-cols-2 gap-4 p-4 border-t border-brand-deep/5 dark:border-white/5">
      <EditorSection title="Text color (light)">
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={light || "#000000"}
            onChange={(e) => onUpdateConfig({ textColorLight: e.target.value || undefined })}
            className="h-9 w-10 shrink-0 cursor-pointer rounded border border-brand-deep/10 dark:border-white/10 bg-transparent"
          />
          <Input
            value={light}
            onChange={(e) => onUpdateConfig({ textColorLight: e.target.value.trim() || undefined })}
            placeholder="#111111 or default"
            className="h-9 font-mono text-xs flex-1 min-w-0"
          />
        </div>
      </EditorSection>
      <EditorSection title="Text color (dark)">
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={dark || "#ffffff"}
            onChange={(e) => onUpdateConfig({ textColorDark: e.target.value || undefined })}
            className="h-9 w-10 shrink-0 cursor-pointer rounded border border-brand-deep/10 dark:border-white/10 bg-transparent"
          />
          <Input
            value={dark}
            onChange={(e) => onUpdateConfig({ textColorDark: e.target.value.trim() || undefined })}
            placeholder="#eeeeee or default"
            className="h-9 font-mono text-xs flex-1 min-w-0"
          />
        </div>
      </EditorSection>
    </div>
  )
}

const labelCn = "text-[10px] font-bold uppercase tracking-widest text-brand-accent/40 dark:text-white/40 mb-1 block"

function HeroEditor({ data, set, setNested }: { data: Record<string, unknown>; set: (k: string, v: unknown) => void; setNested: (p: string, k: string, v: unknown) => void }) {
  const primaryCta = (data.primaryCta as CtaButton) ?? { label: "", href: "" }
  const secondaryCta = (data.secondaryCta as CtaButton) ?? { label: "", href: "" }

  return (
    <div className="space-y-4 p-4">
      <EditorSection title="Content">
        <Field label="Title">
          <Input value={(data.title as string) ?? ""} onChange={(e) => set("title", e.target.value)} placeholder="Hero title" className="h-9" />
        </Field>
        <Field label="Subtitle">
          <Input value={(data.subtitle as string) ?? ""} onChange={(e) => set("subtitle", e.target.value)} placeholder="Supporting text" className="h-9" />
        </Field>
        <Field label="Background image">
          <ImageUrlField
            value={(data.imageUrl as string) ?? ""}
            onChange={(url) => set("imageUrl", url)}
            placeholder="Paste URL or upload"
          />
        </Field>
      </EditorSection>
      <EditorSection title="Primary Button">
        <div className="grid grid-cols-2 gap-2">
          <Field label="Label">
            <Input value={primaryCta?.label ?? ""} onChange={(e) => setNested("primaryCta", "label", e.target.value)} placeholder="Get Started" className="h-9" />
          </Field>
          <Field label="Link">
            <Input value={primaryCta?.href ?? ""} onChange={(e) => setNested("primaryCta", "href", e.target.value)} placeholder="/about" className="h-9 font-mono text-xs" />
          </Field>
        </div>
      </EditorSection>
      <EditorSection title="Secondary Button (optional)">
        <div className="grid grid-cols-2 gap-2">
          <Field label="Label">
            <Input value={secondaryCta?.label ?? ""} onChange={(e) => setNested("secondaryCta", "label", e.target.value)} placeholder="" className="h-9" />
          </Field>
          <Field label="Link">
            <Input value={secondaryCta?.href ?? ""} onChange={(e) => setNested("secondaryCta", "href", e.target.value)} placeholder="" className="h-9 font-mono text-xs" />
          </Field>
        </div>
      </EditorSection>
      <EditorSection title="Layout">
        <div className="flex gap-2">
          {(["center", "left", "right"] as const).map((l) => (
            <Button
              key={l}
              variant={(data.layout as string) === l ? "base" : "ghost"}
              size="sm"
              onClick={() => set("layout", l)}
              className="rounded-lg capitalize text-xs"
            >
              {l}
            </Button>
          ))}
        </div>
      </EditorSection>
    </div>
  )
}

function RichTextBlockEditor({ data, set }: { data: Record<string, unknown>; set: (k: string, v: unknown) => void }) {
  return (
    <div className="p-4 space-y-2">
      <span className={labelCn}>Rich Text Content</span>
      <RichTextEditor
        content={(data.html as string) ?? ""}
        onChange={(html) => set("html", html)}
        placeholder="Write your content here…"
      />
    </div>
  )
}

function CtaEditor({ data, set, setNested }: { data: Record<string, unknown>; set: (k: string, v: unknown) => void; setNested: (p: string, k: string, v: unknown) => void }) {
  const primaryCta = (data.primaryCta as CtaButton) ?? { label: "", href: "" }

  return (
    <div className="space-y-4 p-4">
      <EditorSection title="Content">
        <Field label="Title">
          <Input value={(data.title as string) ?? ""} onChange={(e) => set("title", e.target.value)} placeholder="CTA title" className="h-9" />
        </Field>
        <Field label="Subtitle">
          <Input value={(data.subtitle as string) ?? ""} onChange={(e) => set("subtitle", e.target.value)} placeholder="Supporting text" className="h-9" />
        </Field>
      </EditorSection>
      <EditorSection title="Button">
        <div className="grid grid-cols-2 gap-2">
          <Field label="Label">
            <Input value={primaryCta?.label ?? ""} onChange={(e) => setNested("primaryCta", "label", e.target.value)} placeholder="Learn More" className="h-9" />
          </Field>
          <Field label="Link">
            <Input value={primaryCta?.href ?? ""} onChange={(e) => setNested("primaryCta", "href", e.target.value)} placeholder="/about" className="h-9 font-mono text-xs" />
          </Field>
        </div>
      </EditorSection>
      <EditorSection title="Style">
        <div className="flex gap-2">
          {(["brand", "light", "dark"] as const).map((t) => (
            <Button
              key={t}
              variant={(data.theme as string) === t ? "base" : "ghost"}
              size="sm"
              onClick={() => set("theme", t)}
              className="rounded-lg capitalize text-xs"
            >
              {t}
            </Button>
          ))}
        </div>
      </EditorSection>
    </div>
  )
}

function FaqEditor({ data, onUpdate }: { data: Record<string, unknown>; onUpdate: (d: Record<string, unknown>) => void }) {
  const items = (data.items as FaqItem[]) ?? []

  const updateItem = (idx: number, field: keyof FaqItem, value: string) => {
    const next = items.map((item, i) => (i === idx ? { ...item, [field]: value } : item))
    onUpdate({ ...data, items: next })
  }
  const addItem = () => onUpdate({ ...data, items: [...items, { question: "", answer: "" }] })
  const removeItem = (idx: number) => onUpdate({ ...data, items: items.filter((_, i) => i !== idx) })

  return (
    <div className="space-y-4 p-4">
      <EditorSection title="Section Title">
        <Input value={(data.title as string) ?? ""} onChange={(e) => onUpdate({ ...data, title: e.target.value })} placeholder="FAQ" className="h-9" />
      </EditorSection>
      <EditorSection title="Questions">
        {items.map((item, i) => (
          <div key={i} className="space-y-2 pb-3 mb-3 border-b border-brand-deep/5 dark:border-white/5 last:border-0">
            <div className="flex items-start gap-2">
              <div className="flex-1 space-y-2">
                <Input value={item.question ?? ""} onChange={(e) => updateItem(i, "question", e.target.value)} placeholder={`Question ${i + 1}`} className="h-9" />
                <Textarea
                  value={item.answer ?? ""}
                  onChange={(e) => updateItem(i, "answer", e.target.value)}
                  placeholder="Answer"
                  className="min-h-[60px] resize-none"
                />
              </div>
              <Button variant="ghost" size="icon" onClick={() => removeItem(i)} className="h-8 w-8 shrink-0 text-red-400 hover:text-red-500 mt-0.5">
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        ))}
        <Button variant="outline" size="sm" onClick={addItem} className="rounded-lg text-xs gap-1.5">
          <Plus className="w-3.5 h-3.5" /> Add question
        </Button>
      </EditorSection>
    </div>
  )
}

function TestimonialsEditor({ data, onUpdate }: { data: Record<string, unknown>; onUpdate: (d: Record<string, unknown>) => void }) {
  const items = (data.items as TestimonialItem[]) ?? []

  const updateItem = (idx: number, field: keyof TestimonialItem, value: string) => {
    const next = items.map((item, i) => (i === idx ? { ...item, [field]: value } : item))
    onUpdate({ ...data, items: next })
  }
  const addItem = () => onUpdate({ ...data, items: [...items, { quote: "", name: "", role: "" }] })
  const removeItem = (idx: number) => onUpdate({ ...data, items: items.filter((_, i) => i !== idx) })

  return (
    <div className="space-y-4 p-4">
      <EditorSection title="Section Title">
        <Input value={(data.title as string) ?? ""} onChange={(e) => onUpdate({ ...data, title: e.target.value })} placeholder="Testimonials" className="h-9" />
      </EditorSection>
      <EditorSection title="Testimonials">
        {items.map((item, i) => (
          <div key={i} className="space-y-2 pb-3 mb-3 border-b border-brand-deep/5 dark:border-white/5 last:border-0">
            <div className="flex items-start gap-2">
              <div className="flex-1 space-y-2">
                <Textarea
                  value={item.quote ?? ""}
                  onChange={(e) => updateItem(i, "quote", e.target.value)}
                  placeholder="Customer quote"
                  className="min-h-[60px] resize-none"
                />
                <div className="grid grid-cols-2 gap-2">
                  <Input value={item.name ?? ""} onChange={(e) => updateItem(i, "name", e.target.value)} placeholder="Name" className="h-9" />
                  <Input value={item.role ?? ""} onChange={(e) => updateItem(i, "role", e.target.value)} placeholder="Role / Company" className="h-9" />
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={() => removeItem(i)} className="h-8 w-8 shrink-0 text-red-400 hover:text-red-500 mt-1">
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        ))}
        <Button variant="outline" size="sm" onClick={addItem} className="rounded-lg text-xs gap-1.5">
          <Plus className="w-3.5 h-3.5" /> Add testimonial
        </Button>
      </EditorSection>
    </div>
  )
}

function GridFeaturesEditor({ data, onUpdate }: { data: Record<string, unknown>; onUpdate: (d: Record<string, unknown>) => void }) {
  const items = (data.items as FeatureItem[]) ?? []

  const updateItem = (idx: number, field: keyof FeatureItem, value: string) => {
    const next = items.map((item, i) => (i === idx ? { ...item, [field]: value } : item))
    onUpdate({ ...data, items: next })
  }
  const addItem = () => onUpdate({ ...data, items: [...items, { icon: "star", title: "", description: "" }] })
  const removeItem = (idx: number) => onUpdate({ ...data, items: items.filter((_, i) => i !== idx) })

  return (
    <div className="space-y-4 p-4">
      <EditorSection title="Section">
        <Field label="Title">
          <Input value={(data.title as string) ?? ""} onChange={(e) => onUpdate({ ...data, title: e.target.value })} placeholder="Features" className="h-9" />
        </Field>
        <Field label="Columns">
          <div className="flex gap-2">
            {[2, 3, 4].map((n) => (
              <Button
                key={n}
                variant={(data.columns as number) === n ? "base" : "ghost"}
                size="sm"
                onClick={() => onUpdate({ ...data, columns: n })}
                className="rounded-lg text-xs"
              >
                {n}
              </Button>
            ))}
          </div>
        </Field>
      </EditorSection>
      <EditorSection title="Features">
        {items.map((item, i) => (
          <div key={i} className="flex items-start gap-2 pb-3 mb-3 border-b border-brand-deep/5 dark:border-white/5 last:border-0">
            <div className="flex-1 space-y-2">
              <Input value={item.title ?? ""} onChange={(e) => updateItem(i, "title", e.target.value)} placeholder={`Feature ${i + 1}`} className="h-9" />
              <Input value={item.description ?? ""} onChange={(e) => updateItem(i, "description", e.target.value)} placeholder="Description" className="h-9 text-xs" />
            </div>
            <Button variant="ghost" size="icon" onClick={() => removeItem(i)} className="h-8 w-8 shrink-0 text-red-400 hover:text-red-500 mt-0.5">
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          </div>
        ))}
        <Button variant="outline" size="sm" onClick={addItem} className="rounded-lg text-xs gap-1.5">
          <Plus className="w-3.5 h-3.5" /> Add feature
        </Button>
      </EditorSection>
    </div>
  )
}

function ContactEditor({ data, set }: { data: Record<string, unknown>; set: (k: string, v: unknown) => void }) {
  return (
    <div className="space-y-4 p-4">
      <EditorSection title="Content">
        <Field label="Title">
          <Input value={(data.title as string) ?? ""} onChange={(e) => set("title", e.target.value)} placeholder="Contact Us" className="h-9" />
        </Field>
        <Field label="Description">
          <Textarea
            value={(data.description as string) ?? ""}
            onChange={(e) => set("description", e.target.value)}
            placeholder="Optional description"
            className="min-h-[60px] resize-none"
          />
        </Field>
      </EditorSection>
      <EditorSection title="Options">
        <div className="flex items-center justify-between py-1">
          <span className="text-sm text-brand-deep dark:text-brand-cream">Show contact form</span>
          <Switch checked={!!data.showForm} onCheckedChange={(v) => set("showForm", v)} />
        </div>
        <div className="flex items-center justify-between py-1">
          <span className="text-sm text-brand-deep dark:text-brand-cream">Show map</span>
          <Switch checked={!!data.showMap} onCheckedChange={(v) => set("showMap", v)} />
        </div>
      </EditorSection>
    </div>
  )
}

function ImageGalleryEditor({ data, onUpdate, set }: { data: Record<string, unknown>; onUpdate: (d: Record<string, unknown>) => void; set: (k: string, v: unknown) => void }) {
  const images = (data.images as string[]) ?? []

  const updateImage = (idx: number, url: string) => {
    const next = images.map((img, i) => (i === idx ? url : img))
    onUpdate({ ...data, images: next })
  }
  const addImage = () => onUpdate({ ...data, images: [...images, ""] })
  const removeImage = (idx: number) => onUpdate({ ...data, images: images.filter((_, i) => i !== idx) })

  return (
    <div className="space-y-4 p-4">
      <EditorSection title="Gallery">
        <Field label="Title (optional)">
          <Input value={(data.title as string) ?? ""} onChange={(e) => set("title", e.target.value)} placeholder="Gallery" className="h-9" />
        </Field>
        <Field label="Columns">
          <div className="flex gap-2">
            {[2, 3, 4].map((n) => (
              <Button
                key={n}
                variant={(data.columns as number) === n ? "base" : "ghost"}
                size="sm"
                onClick={() => onUpdate({ ...data, columns: n })}
                className="rounded-lg text-xs"
              >
                {n}
              </Button>
            ))}
          </div>
        </Field>
      </EditorSection>
      <EditorSection title="Images">
        {images.map((url, i) => (
          <div key={i} className="flex items-center gap-2 mb-2">
            <ImageUrlField
              value={url ?? ""}
              onChange={(newUrl) => updateImage(i, newUrl)}
              placeholder="Paste URL or upload"
              className="flex-1 min-w-0"
            />
            <Button variant="ghost" size="icon" onClick={() => removeImage(i)} className="h-9 w-9 shrink-0 text-red-400 hover:text-red-500">
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          </div>
        ))}
        <Button variant="outline" size="sm" onClick={addImage} className="rounded-lg text-xs gap-1.5">
          <Plus className="w-3.5 h-3.5" /> Add image
        </Button>
      </EditorSection>
    </div>
  )
}

function ProductListingEditor({ data, set }: { data: Record<string, unknown>; set: (k: string, v: unknown) => void }) {
  const { categories, isLoading } = useProductCategories()
  const categoryId = (data.categoryId as string) ?? ""
  const limit = Math.min(24, Math.max(4, Number(data.limit) || 8))

  return (
    <div className="space-y-4 p-4">
      <EditorSection title="Content">
        <Field label="Title">
          <Input value={(data.title as string) ?? ""} onChange={(e) => set("title", e.target.value)} placeholder="Our Products" className="h-9" />
        </Field>
        <Field label="Category">
          <Select value={categoryId || "__all__"} onValueChange={(v) => set("categoryId", v === "__all__" ? undefined : v)} disabled={isLoading}>
            <SelectTrigger className="h-9">
              <SelectValue placeholder="All categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">All categories</SelectItem>
              {(categories ?? []).map((c: { id: string; name: string }) => (
                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field label="Limit">
          <Input type="number" min={4} max={24} value={String(limit)} onChange={(e) => set("limit", Math.min(24, Math.max(4, parseInt(e.target.value, 10) || 8)))} className="h-9 w-24" />
        </Field>
        <div className="flex items-center justify-between py-1">
          <span className="text-sm text-brand-deep dark:text-brand-cream">Show filters</span>
          <Switch checked={data.showFilters !== false} onCheckedChange={(v) => set("showFilters", v)} />
        </div>
      </EditorSection>
    </div>
  )
}

function FeaturedProductsEditor({ data, set }: { data: Record<string, unknown>; set: (k: string, v: unknown) => void }) {
  const limit = Math.min(12, Math.max(4, Number(data.limit) || 8))
  return (
    <div className="space-y-4 p-4">
      <EditorSection title="Content">
        <Field label="Title">
          <Input value={(data.title as string) ?? ""} onChange={(e) => set("title", e.target.value)} placeholder="Featured" className="h-9" />
        </Field>
        <Field label="Subtitle">
          <Input value={(data.subtitle as string) ?? ""} onChange={(e) => set("subtitle", e.target.value)} placeholder="Optional" className="h-9" />
        </Field>
        <Field label="Limit">
          <Input type="number" min={4} max={12} value={String(limit)} onChange={(e) => set("limit", Math.min(12, Math.max(4, parseInt(e.target.value, 10) || 8)))} className="h-9 w-24" />
        </Field>
      </EditorSection>
    </div>
  )
}

function OnSaleEditor({ data, set }: { data: Record<string, unknown>; set: (k: string, v: unknown) => void }) {
  const { data: promotions, isLoading } = usePromotions()
  const promotionId = (data.promotionId as string) ?? ""
  const limit = Math.min(16, Math.max(4, Number(data.limit) || 8))
  return (
    <div className="space-y-4 p-4">
      <EditorSection title="Content">
        <Field label="Title">
          <Input value={(data.title as string) ?? ""} onChange={(e) => set("title", e.target.value)} placeholder="On Sale" className="h-9" />
        </Field>
        <Field label="Subtitle">
          <Input value={(data.subtitle as string) ?? ""} onChange={(e) => set("subtitle", e.target.value)} placeholder="Optional" className="h-9" />
        </Field>
        <Field label="Promotion">
          <Select value={promotionId || "__any__"} onValueChange={(v) => set("promotionId", v === "__any__" ? undefined : v)} disabled={isLoading}>
            <SelectTrigger className="h-9">
              <SelectValue placeholder="Any promotion" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__any__">Any promotion</SelectItem>
              {(promotions ?? []).map((p: { id: string; name: string }) => (
                <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field label="Limit">
          <Input type="number" min={4} max={16} value={String(limit)} onChange={(e) => set("limit", Math.min(16, Math.max(4, parseInt(e.target.value, 10) || 8)))} className="h-9 w-24" />
        </Field>
      </EditorSection>
    </div>
  )
}

function PromotionBannerEditor({
  data,
  set,
  setNested,
}: { data: Record<string, unknown>; set: (k: string, v: unknown) => void; setNested: (p: string, k: string, v: unknown) => void }) {
  const { data: promotions } = usePromotions()
  const promotionId = (data.promotionId as string) ?? ""
  const cta = (data.cta as { label: string; href: string }) ?? { label: "", href: "" }

  return (
    <div className="space-y-4 p-4">
      <EditorSection title="Promotion (optional)">
        <Select value={promotionId || "__none__"} onValueChange={(v) => set("promotionId", v === "__none__" ? undefined : v)}>
          <SelectTrigger className="h-9">
            <SelectValue placeholder="Manual / no promotion" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__none__">Manual (no promotion link)</SelectItem>
            {(promotions ?? []).map((p: { id: string; name: string }) => (
              <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </EditorSection>
      <EditorSection title="Banner">
        <Field label="Title">
          <Input value={(data.title as string) ?? ""} onChange={(e) => set("title", e.target.value)} placeholder="Promotion title" className="h-9" />
        </Field>
        <Field label="Subtitle">
          <Input value={(data.subtitle as string) ?? ""} onChange={(e) => set("subtitle", e.target.value)} placeholder="Optional" className="h-9" />
        </Field>
        <Field label="Image URL">
          <ImageUrlField value={(data.imageUrl as string) ?? ""} onChange={(url) => set("imageUrl", url)} placeholder="Optional banner image" />
        </Field>
        <Field label="Badge label">
          <Input value={(data.badgeLabel as string) ?? ""} onChange={(e) => set("badgeLabel", e.target.value)} placeholder="e.g. Sale" className="h-9" />
        </Field>
        <EditorSection title="CTA">
          <div className="grid grid-cols-2 gap-2">
            <Field label="Label">
              <Input value={cta?.label ?? ""} onChange={(e) => setNested("cta", "label", e.target.value)} placeholder="Shop now" className="h-9" />
            </Field>
            <Field label="Link">
              <Input value={cta?.href ?? ""} onChange={(e) => setNested("cta", "href", e.target.value)} placeholder="/shop" className="h-9 font-mono text-xs" />
            </Field>
          </div>
        </EditorSection>
        <Field label="Ends at">
          <Input type="datetime-local" value={(data.endsAt as string)?.slice(0, 16) ?? ""} onChange={(e) => set("endsAt", e.target.value ? new Date(e.target.value).toISOString() : "")} className="h-9 font-mono text-xs" />
        </Field>
        <div className="flex items-center justify-between py-1">
          <span className="text-sm text-brand-deep dark:text-brand-cream">Show countdown</span>
          <Switch checked={!!data.showCountdown} onCheckedChange={(v) => set("showCountdown", v)} />
        </div>
      </EditorSection>
    </div>
  )
}

function ImageEditor({ data, set }: { data: Record<string, unknown>; set: (k: string, v: unknown) => void }) {
  return (
    <div className="space-y-4 p-4">
      <EditorSection title="Image Details">
        <Field label="Image">
          <ImageUrlField
            value={(data.imageUrl as string) ?? ""}
            onChange={(url) => set("imageUrl", url)}
            placeholder="Upload or paste image URL"
          />
        </Field>
        <Field label="Alt Text">
          <Input value={(data.alt as string) ?? ""} onChange={(e) => set("alt", e.target.value)} placeholder="Describe image for accessibility" className="h-9" />
        </Field>
        <Field label="Caption">
          <Input value={(data.caption as string) ?? ""} onChange={(e) => set("caption", e.target.value)} placeholder="Add a caption" className="h-9" />
        </Field>
      </EditorSection>
      <div className="grid grid-cols-2 gap-4">
        <EditorSection title="Aspect Ratio">
          <Select value={(data.aspectRatio as string) || "auto"} onValueChange={(v) => set("aspectRatio", v)}>
            <SelectTrigger className="h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {["auto", "1:1", "4:3", "16:9", "21:9"].map((r) => (
                <SelectItem key={r} value={r}>{r}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </EditorSection>
        <EditorSection title="Rounding">
          <Select value={(data.rounded as string) || "xl"} onValueChange={(v) => set("rounded", v)}>
            <SelectTrigger className="h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {["none", "lg", "xl", "2xl", "3xl", "full"].map((r) => (
                <SelectItem key={r} value={r}>{r}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </EditorSection>
      </div>
    </div>
  )
}

function GridLayoutEditor({ data, onUpdate }: { data: Record<string, unknown>; onUpdate: (d: Record<string, unknown>) => void }) {
  const columns = (data.columns as GridLayoutColumn[]) || []
  const style = (data.style as GridLayoutStyle) || {}
  const [activeCol, setActiveCol] = useState<number | null>(null)

  const updateColumns = (nextCols: GridLayoutColumn[]) => onUpdate({ ...data, columns: nextCols })

  const addColumn = () => {
    if (columns.length >= 8) return
    updateColumns([...columns, { blocks: [] }])
  }

  const removeColumn = (idx: number) => {
    updateColumns(columns.filter((_, i) => i !== idx))
  }

  const addBlockToColumn = (colIdx: number, type: any) => {
    const next = [...columns]
    next[colIdx].blocks = [...next[colIdx].blocks, createBlock(type)]
    updateColumns(next)
  }

  const updateNestedBlock = (colIdx: number, blockId: string, updates: any) => {
    const next = [...columns]
    next[colIdx].blocks = next[colIdx].blocks.map(b => {
      if (b.id !== blockId) return b
      return {
        ...b,
        ...(updates.data && { data: updates.data }),
        ...(updates.config && { config: { ...b.config, ...updates.config } })
      }
    })
    updateColumns(next)
  }

  const removeNestedBlock = (colIdx: number, blockId: string) => {
    const next = [...columns]
    next[colIdx].blocks = next[colIdx].blocks.filter(b => b.id !== blockId)
    updateColumns(next)
  }

  return (
    <div className="space-y-4 p-4">
      <EditorSection title="Layout Configuration">
        <Field label="Columns (up to 8)">
          <div className="flex flex-wrap gap-2">
            {Array.from({ length: Math.min(8, columns.length + 1) }).map((_, i) => (
              <Button
                key={i}
                variant={columns.length === i + 1 ? "base" : "ghost"}
                size="sm"
                onClick={() => {
                  if (i + 1 > columns.length) {
                    updateColumns([...columns, ...Array(i + 1 - columns.length).fill(null).map(() => ({ blocks: [] }))])
                  } else {
                    updateColumns(columns.slice(0, i + 1))
                  }
                }}
                className="w-8 h-8 p-0 rounded-lg text-xs"
              >
                {i + 1}
              </Button>
            ))}
          </div>
        </Field>
        <Field label="Column proportions (e.g. 1fr 2fr)">
          <Input
            value={style.proportions || ""}
            onChange={(e) => onUpdate({ ...data, style: { ...style, proportions: e.target.value } })}
            placeholder="Leave empty for equal columns"
            className="h-9 font-mono text-xs"
          />
        </Field>
        <Field label="Gap size">
          <div className="flex gap-2">
            {(["none", "sm", "md", "lg"] as const).map(g => (
              <Button
                key={g}
                variant={style.gap === g ? "base" : "ghost"}
                size="sm"
                onClick={() => onUpdate({ ...data, style: { ...style, gap: g } })}
                className="rounded-lg text-xs capitalize"
              >
                {g}
              </Button>
            ))}
          </div>
        </Field>
      </EditorSection>

      <div className="space-y-2">
        <span className={labelCn}>Content per Column</span>
        {columns.map((col, cIdx) => (
          <div key={cIdx} className="rounded-2xl border border-brand-deep/5 dark:border-white/5 overflow-hidden">
            <button
              onClick={() => setActiveCol(activeCol === cIdx ? null : cIdx)}
              className="w-full flex items-center justify-between px-4 py-3 hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
            >
              <span className="text-xs font-semibold">Column {cIdx + 1}</span>
              <span className="text-[10px] opacity-40 uppercase tracking-widest">{col.blocks.length} blocks</span>
            </button>
            <AnimatePresence>
              {activeCol === cIdx && (
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: "auto" }}
                  exit={{ height: 0 }}
                  className="overflow-hidden border-t border-brand-deep/5 dark:border-white/5"
                >
                  <div className="p-4 space-y-4">
                    {col.blocks.map((block) => (
                      <div key={block.id} className="relative bg-white/40 dark:bg-white/5 rounded-2xl border p-4 group">
                        <div className="flex items-center justify-between mb-4">
                          <span className="text-[9px] font-bold uppercase tracking-widest opacity-40">
                            {BLOCK_META[block.type]?.label || block.type}
                          </span>
                          <Button variant="ghost" size="icon" onClick={() => removeNestedBlock(cIdx, block.id)} className="h-6 w-6 text-red-400 hover:text-red-500">
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                        <BlockEditor
                          block={block}
                          onUpdate={(d) => updateNestedBlock(cIdx, block.id, { data: d })}
                          onUpdateConfig={(c) => updateNestedBlock(cIdx, block.id, { config: c })}
                        />
                      </div>
                    ))}
                    <div className="flex flex-wrap gap-2 pt-2 border-t border-dashed border-brand-deep/10 dark:border-white/10">
                      {Object.entries(BLOCK_META).filter(([t]) => t !== "grid_layout").map(([type, meta]) => (
                        <Button
                          key={type}
                          variant="outline"
                          size="sm"
                          onClick={() => addBlockToColumn(cIdx, type as any)}
                          className="h-7 text-[10px] px-2 rounded-md gap-1"
                        >
                          <Plus className="w-2.5 h-2.5" /> {meta.label}
                        </Button>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>
    </div>
  )
}

function SectionTextAlignEditor({
  config,
  onUpdateConfig,
}: {
  config: BlockSection["config"]
  onUpdateConfig: (c: Partial<BlockSection["config"]>) => void
}) {
  const textAlign = config.textAlign || "left"

  return (
    <div className="p-4 border-t border-brand-deep/5 dark:border-white/5 bg-black/[0.02] dark:bg-white/[0.02]">
      <EditorSection title="Text alignment">
        <div className="flex gap-2">
          <Button
            variant={textAlign === "left" ? "base" : "ghost"}
            size="sm"
            onClick={() => onUpdateConfig({ textAlign: "left" })}
            className="rounded-lg text-xs"
            title="Left align"
          >
            <AlignLeft className="w-4 h-4 mr-1.5 opacity-60" /> Left
          </Button>
          <Button
            variant={textAlign === "center" ? "base" : "ghost"}
            size="sm"
            onClick={() => onUpdateConfig({ textAlign: "center" })}
            className="rounded-lg text-xs"
            title="Center align"
          >
            <AlignCenter className="w-4 h-4 mr-1.5 opacity-60" /> Center
          </Button>
          <Button
            variant={textAlign === "right" ? "base" : "ghost"}
            size="sm"
            onClick={() => onUpdateConfig({ textAlign: "right" })}
            className="rounded-lg text-xs"
            title="Right align"
          >
            <AlignRight className="w-4 h-4 mr-1.5 opacity-60" /> Right
          </Button>
        </div>
      </EditorSection>
    </div>
  )
}

function GenericEditor({ data, set }: { data: Record<string, unknown>; set: (k: string, v: unknown) => void }) {
  return (
    <div className="space-y-3 p-4">
      {Object.entries(data).map(([key, value]) => {
        if (typeof value === "string") {
          return (
            <Field key={key} label={key}>
              <Input value={value ?? ""} onChange={(e) => set(key, e.target.value)} className="h-9" />
            </Field>
          )
        }
        return null
      })}
    </div>
  )
}

function EditorSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <h4 className="text-xs font-bold uppercase tracking-widest text-brand-accent/50 dark:text-white/40">
        {title}
      </h4>
      {children}
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <span className={cn(labelCn)}>{label}</span>
      {children}
    </div>
  )
}
