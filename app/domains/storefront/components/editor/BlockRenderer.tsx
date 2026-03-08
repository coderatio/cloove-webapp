"use client"

import type { BlockSection, FaqItem, TestimonialItem, FeatureItem, CtaButton, SectionBackground, GridLayoutColumn, GridLayoutStyle } from "./block-types"
import { HelpCircle, ChevronDown, Quote, Star, Image as ImageIcon, ShoppingBag, Tag, Megaphone, Plus } from "lucide-react"
import { formatCurrency } from "@/app/lib/formatters"
import { useBusiness } from "@/app/components/BusinessProvider"
import { useStorefront } from "@/app/domains/storefront/hooks/useStorefront"
import { cn } from "@/app/lib/utils"
import {
  useStorefrontProducts,
  useStorefrontFeatured,
  useStorefrontOnSale,
  useStorefrontCategories,
  type StorefrontProductItem,
} from "@/app/domains/storefront/hooks/useStorefrontProducts"
import { SearchableSelect } from "@/app/components/ui/searchable-select"

const GRADIENT_DIRECTIONS: Record<string, string> = {
  "to-br": "135deg",
  "to-r": "90deg",
  "to-b": "180deg",
  "to-tr": "45deg",
  "to-t": "0deg",
  "to-tl": "315deg",
  "to-l": "270deg",
  "to-bl": "225deg",
}

interface BlockRendererProps {
  block: BlockSection
  /** When true, use sectionBackgroundDark if set, else sectionBackground. */
  previewDark?: boolean
}

const SECTION_ALIGN_CLASS = {
  left: "text-left",
  center: "text-center",
  right: "text-right",
} as const

function isValidHex(color?: string): boolean {
  if (!color) return false
  return /^#([A-Fa-f0-9]{3}){1,2}$/.test(color.trim())
}

function getBrightness(hex: string): number {
  let c = hex.trim().substring(1)
  if (c.length === 3) {
    c = c[0] + c[0] + c[1] + c[1] + c[2] + c[2]
  }
  const r = parseInt(c.substring(0, 2), 16)
  const g = parseInt(c.substring(2, 4), 16)
  const b = parseInt(c.substring(4, 6), 16)
  return (r * 299 + g * 587 + b * 114) / 1000
}

function isDarkColor(color?: string): boolean {
  if (!isValidHex(color)) return false
  return getBrightness(color!) < 160 // Threshold for "dark" backgrounds
}

function getSectionTextColor(config: BlockSection["config"], previewDark: boolean): string | undefined {
  const dark = typeof config.textColorDark === "string" ? config.textColorDark.trim() : ""
  const light = typeof config.textColorLight === "string" ? config.textColorLight.trim() : ""

  const chosen = previewDark ? dark : light
  return isValidHex(chosen) ? chosen : undefined
}

export function BlockRenderer({ block, previewDark = false }: BlockRendererProps) {
  if (block.config.hidden) return null

  const { data: storefront } = useStorefront()
  const storefrontSlug = storefront?.slug
  const bg = previewDark && block.config.sectionBackgroundDark ? block.config.sectionBackgroundDark : block.config.sectionBackground

  // Detect if background is effectively dark to provide high-contrast default text color
  let isBackgroundDark = previewDark
  if (bg) {
    if (bg.type === "solid") {
      isBackgroundDark = isDarkColor(bg.color)
    } else if (bg.type === "gradient") {
      // average brightness of both colors
      const b1 = isValidHex(bg.color1) ? getBrightness(bg.color1) : 255
      const b2 = isValidHex(bg.color2) ? getBrightness(bg.color2) : 255
      isBackgroundDark = (b1 + b2) / 2 < 160
    } else if (bg.type === "image") {
      isBackgroundDark = true // Assume dark due to overlay
    }
  }

  const userColor = getSectionTextColor(block.config, previewDark)
  const derivedColor = userColor || (isBackgroundDark ? "#ffffff" : "var(--sf-text)")
  const alignClass = SECTION_ALIGN_CLASS[block.config.textAlign === "center" || block.config.textAlign === "right" ? block.config.textAlign : "left"]

  // Padding logic: ensure it's always applied unless explicitly "none" or default to md
  const padding = block.config.padding ?? "md"
  const paddingMap: Record<string, string> = {
    none: "",
    sm: "px-4 py-6",
    md: "px-6 py-8",
    lg: "px-8 py-12",
  }
  const paddingClass = paddingMap[padding] ?? ""
  const paddingStyle = !paddingMap[padding] ? { paddingTop: padding, paddingBottom: padding } : {}

  // Margin logic
  const margin = block.config.margin ?? "none"
  const marginMap: Record<string, string> = {
    none: "",
    sm: "my-4",
    md: "my-8",
    lg: "my-12",
  }
  const marginClass = marginMap[margin] ?? ""
  const marginStyle = !marginMap[margin] ? { marginTop: margin, marginBottom: margin } : {}

  const content = (() => {
    switch (block.type) {
      case "hero":
        return <HeroPreview data={block.data} derivedColor={derivedColor} textAlign={block.config.textAlign} config={block.config} previewDark={previewDark} />
      case "rich_text":
        return <RichTextPreview data={block.data} sectionColor={derivedColor} />
      case "cta":
        return <CtaPreview data={block.data} textAlign={block.config.textAlign} config={block.config} previewDark={previewDark} />
      case "faq":
        return <FaqPreview data={block.data} sectionColor={derivedColor} />
      case "testimonials":
        return <TestimonialsPreview data={block.data} sectionColor={derivedColor} />
      case "grid_features":
        return <GridFeaturesPreview data={block.data} sectionColor={derivedColor} />
      case "contact_block":
        return <ContactPreview data={block.data} sectionColor={derivedColor} />
      case "image_gallery":
        return <ImageGalleryPreview data={block.data} sectionColor={derivedColor} />
      case "product_listing":
        return <ProductListingPreview data={block.data} sectionColor={derivedColor} slug={storefrontSlug} />
      case "featured_products":
        return <FeaturedProductsPreview data={block.data} sectionColor={derivedColor} slug={storefrontSlug} />
      case "on_sale":
        return <OnSalePreview data={block.data} sectionColor={derivedColor} slug={storefrontSlug} />
      case "promotion_banner":
        return <PromotionBannerPreview data={block.data} sectionColor={derivedColor} textAlign={block.config.textAlign} />
      case "image":
        return <ImagePreview data={block.data} />
      case "grid_layout":
        return <GridPreview data={block.data} previewDark={previewDark} />
      default:
        return <PlaceholderPreview type={block.type} />
    }
  })()

  // Build combined section style
  const sectionStyle: React.CSSProperties = {
    color: derivedColor,
    position: "relative",
  }

  if (bg) {
    if (bg.type === "solid") {
      sectionStyle.backgroundColor = bg.color
    } else if (bg.type === "gradient") {
      const dirKey = bg.direction || "to-br"
      const angle = GRADIENT_DIRECTIONS[dirKey] ?? "135deg"
      sectionStyle.background = `linear-gradient(${angle}, ${bg.color1}, ${bg.color2})`
    }
  }

  // If image background, we need the overlay logic which requires a nested structure
  if (bg && bg.type === "image" && bg.imageUrl) {
    const overlay = bg.overlayColor ?? "#000000"
    const opacity = Math.max(0, Math.min(1, bg.overlayOpacity ?? 0.4))
    return (
      <section
        className={cn("relative overflow-hidden w-full transition-colors duration-300", paddingClass, marginClass, alignClass)}
        style={{ ...sectionStyle, ...paddingStyle, ...marginStyle }}
      >
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${bg.imageUrl})` }}
        />
        <div className="absolute inset-0" style={{ backgroundColor: overlay, opacity }} />
        <div className="relative z-10 w-full">{content}</div>
      </section>
    )
  }

  return (
    <section
      className={cn("w-full transition-colors duration-300", paddingClass, marginClass, alignClass)}
      style={{ ...sectionStyle, ...paddingStyle, ...marginStyle }}
    >
      {content}
    </section>
  )
}

const HERO_LAYOUT_CLASSES = {
  center: "items-center justify-center text-center",
  left: "items-start justify-start text-left pl-8",
  right: "items-end justify-end text-right pr-8",
} as const

const TITLE_FONT_SIZE_CLASSES: Record<string, string> = {
  sm: "text-2xl",
  md: "text-3xl",
  lg: "text-4xl",
}

const BODY_FONT_SIZE_CLASSES: Record<string, string> = {
  sm: "text-sm",
  md: "text-base",
  lg: "text-lg",
}

const FONT_STYLE_CLASSES: Record<string, string> = {
  normal: "font-normal",
  italic: "italic",
  bold: "font-bold",
  semibold: "font-semibold",
}

function getTitleSizeStyle(config: BlockSection["config"]): React.CSSProperties | undefined {
  if (config.titleFontSize !== "custom" || !config.titleFontSizeCustom) return undefined
  return { fontSize: config.titleFontSizeCustom }
}

function getBodySizeStyle(config: BlockSection["config"]): React.CSSProperties | undefined {
  if (config.bodyFontSize !== "custom" || !config.bodyFontSizeCustom) return undefined
  return { fontSize: config.bodyFontSizeCustom }
}

function HeroPreview({
  data,
  derivedColor,
  textAlign,
  config,
  previewDark,
}: {
  data: Record<string, unknown>
  derivedColor: string
  textAlign?: "left" | "center" | "right"
  config: BlockSection["config"]
  previewDark: boolean
}) {
  const title = (data.title as string) || "Hero Title"
  const subtitle = (data.subtitle as string) || "Add a subtitle for your hero section"
  const imageUrl = data.imageUrl as string
  const primaryCta = data.primaryCta as CtaButton | undefined
  const layout = (data.layout as keyof typeof HERO_LAYOUT_CLASSES) || "center"

  const effectiveAlign = textAlign || layout
  const layoutClasses = HERO_LAYOUT_CLASSES[effectiveAlign] ?? HERO_LAYOUT_CLASSES.center

  const titleSize = config.titleFontSize ?? "md"
  const titleClass = titleSize === "custom" ? "" : TITLE_FONT_SIZE_CLASSES[titleSize] ?? TITLE_FONT_SIZE_CLASSES.md
  const titleStyle = getTitleSizeStyle(config)
  const titleFontStyleClass = FONT_STYLE_CLASSES[config.titleFontStyle ?? "normal"] ?? "font-normal"

  const bodySize = config.bodyFontSize ?? "md"
  const bodyClass = bodySize === "custom" ? "" : BODY_FONT_SIZE_CLASSES[bodySize] ?? BODY_FONT_SIZE_CLASSES.md
  const bodyStyle = getBodySizeStyle(config)
  const bodyFontStyleClass = FONT_STYLE_CLASSES[config.bodyFontStyle ?? "normal"] ?? "font-normal"

  const buttonTextColor = previewDark ? (config.buttonTextColorDark ?? config.buttonTextColorLight) : (config.buttonTextColorLight ?? config.buttonTextColorDark)
  const buttonBgColor = previewDark ? (config.buttonBgColorDark ?? config.buttonBgColorLight) : (config.buttonBgColorLight ?? config.buttonBgColorDark)
  const buttonStyle: React.CSSProperties = {
    ...(buttonTextColor && { color: buttonTextColor }),
    ...(buttonBgColor && { backgroundColor: buttonBgColor }),
  }
  const hasButtonOverride = buttonTextColor || buttonBgColor

  return (
    <div className="relative overflow-hidden rounded-3xl" style={{ minHeight: 240, color: derivedColor }}>
      {imageUrl && (
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${imageUrl})` }}
        >
          <div className="absolute inset-0 bg-black/40" />
        </div>
      )}
      <div className={cn("relative z-10 flex flex-col min-h-[240px] justify-center px-8 py-16", layoutClasses)}>
        <h1
          className={cn("mb-3 leading-tight", titleClass, titleFontStyleClass)}
          style={{ fontFamily: "var(--sf-font-heading)", color: derivedColor, ...titleStyle }}
        >
          {title}
        </h1>
        <p className={cn("opacity-80 max-w-lg mb-6", bodyClass, bodyFontStyleClass)} style={{ color: derivedColor, ...bodyStyle }}>
          {subtitle}
        </p>
        {primaryCta?.label && (
          <span
            className="inline-block px-6 py-2.5 rounded-full text-sm font-semibold"
            style={hasButtonOverride ? buttonStyle : { backgroundColor: "var(--sf-secondary)", color: "var(--sf-primary)" }}
          >
            {primaryCta.label}
          </span>
        )}
      </div>
    </div>
  )
}

function RichTextPreview({
  data,
  sectionColor,
}: {
  data: Record<string, unknown>
  sectionColor?: string
}) {
  const html = (data.html as string) || "<p>Start writing your content…</p>"
  const isEmpty = !html || html === "<p></p>" || html === "<p><br></p>"

  return (
    <div className="px-6 pb-8 pt-4">
      {isEmpty ? (
        <p
          className="opacity-40 italic text-sm"
          style={{ fontFamily: "var(--sf-font-body)", color: sectionColor ?? "var(--sf-text)" }}
        >
          Click to add rich text content…
        </p>
      ) : (
        <div
          className="prose prose-sm max-w-none text-inherit"
          style={{ fontFamily: "var(--sf-font-body)", color: sectionColor ?? "var(--sf-text)" }}
          dangerouslySetInnerHTML={{ __html: html }}
        />
      )}
    </div>
  )
}

const CTA_THEME_STYLES = {
  brand: {
    wrapper: { backgroundColor: "var(--sf-primary)" },
    title: { color: "var(--sf-background)" },
    subtitle: { color: "var(--sf-background)" },
    button: { backgroundColor: "var(--sf-secondary)", color: "var(--sf-primary)" },
  },
  light: {
    wrapper: { backgroundColor: "var(--sf-background)", borderWidth: 1, borderColor: "color-mix(in srgb, var(--sf-text) 15%, transparent)" },
    title: { color: "var(--sf-text)" },
    subtitle: { color: "var(--sf-text)" },
    button: { backgroundColor: "var(--sf-primary)", color: "var(--sf-background)" },
  },
  dark: {
    wrapper: { backgroundColor: "var(--sf-primary)" },
    title: { color: "var(--sf-background)" },
    subtitle: { color: "var(--sf-background)" },
    button: { backgroundColor: "var(--sf-secondary)", color: "var(--sf-primary)" },
  },
} as const

function CtaPreview({
  data,
  textAlign,
  config,
  previewDark,
}: {
  data: Record<string, unknown>
  textAlign?: "left" | "center" | "right"
  config: BlockSection["config"]
  previewDark: boolean
}) {
  const title = (data.title as string) || "Call to Action"
  const subtitle = (data.subtitle as string) || "Add a compelling message"
  const primaryCta = data.primaryCta as CtaButton | undefined
  const theme = (data.theme as keyof typeof CTA_THEME_STYLES) || "brand"
  const style = CTA_THEME_STYLES[theme] ?? CTA_THEME_STYLES.brand

  const alignClass = textAlign === "right" ? "text-right" : textAlign === "left" ? "text-left" : "text-center"

  const titleSize = config.titleFontSize ?? "md"
  const titleClass = titleSize === "custom" ? "" : TITLE_FONT_SIZE_CLASSES[titleSize] ?? TITLE_FONT_SIZE_CLASSES.md
  const titleStyle = getTitleSizeStyle(config)
  const titleFontStyleClass = FONT_STYLE_CLASSES[config.titleFontStyle ?? "normal"] ?? "font-normal"

  const bodySize = config.bodyFontSize ?? "md"
  const bodyClass = bodySize === "custom" ? "" : BODY_FONT_SIZE_CLASSES[bodySize] ?? BODY_FONT_SIZE_CLASSES.md
  const bodyStyle = getBodySizeStyle(config)
  const bodyFontStyleClass = FONT_STYLE_CLASSES[config.bodyFontStyle ?? "normal"] ?? "font-normal"

  const buttonTextColor = previewDark ? (config.buttonTextColorDark ?? config.buttonTextColorLight) : (config.buttonTextColorLight ?? config.buttonTextColorDark)
  const buttonBgColor = previewDark ? (config.buttonBgColorDark ?? config.buttonBgColorLight) : (config.buttonBgColorLight ?? config.buttonBgColorDark)
  const buttonStyle: React.CSSProperties = {
    ...(buttonTextColor && { color: buttonTextColor }),
    ...(buttonBgColor && { backgroundColor: buttonBgColor }),
  }
  const hasButtonOverride = buttonTextColor || buttonBgColor

  return (
    <div
      className={cn("rounded-3xl px-8 py-12 border border-transparent", alignClass)}
      style={style.wrapper}
    >
      <h2
        className={cn("mb-2", titleClass, titleFontStyleClass)}
        style={{ fontFamily: "var(--sf-font-heading)", ...style.title, ...titleStyle }}
      >
        {title}
      </h2>
      <p className={cn("opacity-80 mb-6", bodyClass, bodyFontStyleClass)} style={{ ...style.subtitle, ...bodyStyle }}>
        {subtitle}
      </p>
      {primaryCta?.label && (
        <span
          className="inline-block px-6 py-2.5 rounded-full text-sm font-semibold"
          style={hasButtonOverride ? buttonStyle : style.button}
        >
          {primaryCta.label}
        </span>
      )}
    </div>
  )
}

function FaqPreview({ data, sectionColor }: { data: Record<string, unknown>; sectionColor?: string }) {
  const title = (data.title as string) || "FAQ"
  const items = (data.items as FaqItem[]) || []

  return (
    <div className="px-6 py-8" style={sectionColor ? { color: sectionColor } : undefined}>
      <h2
        className="text-xl font-bold mb-6"
        style={{ fontFamily: "var(--sf-font-heading)", color: sectionColor ?? "var(--sf-text)" }}
      >
        {title}
      </h2>
      <div className="space-y-3">
        {items.length === 0 && (
          <p className="text-sm opacity-40 italic">No questions yet. Click to add.</p>
        )}
        {items.map((item, i) => (
          <div
            key={i}
            className="rounded-2xl border px-4 py-3"
            style={{ borderColor: "color-mix(in srgb, var(--sf-text) 10%, transparent)" }}
          >
            <div className="flex items-center gap-2">
              <HelpCircle className="w-4 h-4 shrink-0 opacity-40" />
              <span className="font-medium text-sm" style={{ fontFamily: "var(--sf-font-body)" }}>
                {item.question || "Question…"}
              </span>
              <ChevronDown className="w-4 h-4 ml-auto opacity-30" />
            </div>
            {item.answer && (
              <p className="text-xs mt-2 pl-6 opacity-60">{item.answer}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

function TestimonialsPreview({ data, sectionColor }: { data: Record<string, unknown>; sectionColor?: string }) {
  const title = (data.title as string) || "Testimonials"
  const items = (data.items as TestimonialItem[]) || []

  return (
    <div className="px-6 py-8" style={sectionColor ? { color: sectionColor } : undefined}>
      <h2
        className="text-xl font-bold mb-6 text-center"
        style={{ fontFamily: "var(--sf-font-heading)", color: sectionColor ?? "var(--sf-text)" }}
      >
        {title}
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {items.length === 0 && (
          <p className="text-sm opacity-40 italic col-span-full text-center">
            No testimonials yet.
          </p>
        )}
        {items.map((item, i) => (
          <div
            key={i}
            className="rounded-2xl p-5 border"
            style={{
              borderColor: "color-mix(in srgb, var(--sf-text) 10%, transparent)",
              backgroundColor: "color-mix(in srgb, var(--sf-background) 95%, var(--sf-text))",
            }}
          >
            <Quote className="w-5 h-5 mb-2 opacity-20" />
            <p className="text-sm italic mb-3" style={{ fontFamily: "var(--sf-font-body)" }}>
              {item.quote || "Customer quote…"}
            </p>
            <div className="text-xs font-semibold">{item.name || "Name"}</div>
            <div className="text-xs opacity-50">{item.role || "Role"}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

function GridFeaturesPreview({ data, sectionColor }: { data: Record<string, unknown>; sectionColor?: string }) {
  const title = (data.title as string) || "Features"
  const items = (data.items as FeatureItem[]) || []
  const columns = (data.columns as number) || 3

  return (
    <div className="px-6 py-8" style={sectionColor ? { color: sectionColor } : undefined}>
      <h2
        className="text-xl font-bold mb-6 text-center"
        style={{ fontFamily: "var(--sf-font-heading)", color: sectionColor ?? "var(--sf-text)" }}
      >
        {title}
      </h2>
      <div className="grid gap-6" style={{ gridTemplateColumns: `repeat(${Math.min(columns, 4)}, 1fr)` }}>
        {items.length === 0 && (
          <p className="text-sm opacity-40 italic col-span-full text-center">
            No features yet.
          </p>
        )}
        {items.map((item, i) => (
          <div key={i} className="text-center">
            <div className="w-10 h-10 rounded-full mx-auto mb-3 flex items-center justify-center" style={{ backgroundColor: "var(--sf-secondary)", color: "var(--sf-primary)" }}>
              <Star className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-semibold mb-1" style={{ fontFamily: "var(--sf-font-heading)" }}>
              {item.title || "Feature"}
            </h3>
            <p className="text-xs opacity-60" style={{ fontFamily: "var(--sf-font-body)" }}>
              {item.description || "Description…"}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}

function ContactPreview({ data, sectionColor }: { data: Record<string, unknown>; sectionColor?: string }) {
  const title = (data.title as string) || "Contact"
  const description = (data.description as string) || ""

  return (
    <div className="px-6 py-8" style={sectionColor ? { color: sectionColor } : undefined}>
      <h2
        className="text-xl font-bold mb-2"
        style={{ fontFamily: "var(--sf-font-heading)", color: sectionColor ?? "var(--sf-text)" }}
      >
        {title}
      </h2>
      {description && (
        <p className="text-sm opacity-60 mb-6" style={{ fontFamily: "var(--sf-font-body)" }}>
          {description}
        </p>
      )}
      <div className="rounded-2xl border p-6 space-y-3" style={{ borderColor: "color-mix(in srgb, var(--sf-text) 10%, transparent)" }}>
        <div className="h-9 rounded-xl border opacity-30" style={{ borderColor: "color-mix(in srgb, var(--sf-text) 20%, transparent)" }} />
        <div className="h-9 rounded-xl border opacity-30" style={{ borderColor: "color-mix(in srgb, var(--sf-text) 20%, transparent)" }} />
        <div className="h-20 rounded-xl border opacity-30" style={{ borderColor: "color-mix(in srgb, var(--sf-text) 20%, transparent)" }} />
        <div
          className="h-9 rounded-full w-32"
          style={{ backgroundColor: "var(--sf-primary)", opacity: 0.5 }}
        />
      </div>
    </div>
  )
}

function ImageGalleryPreview({ data, sectionColor }: { data: Record<string, unknown>; sectionColor?: string }) {
  const title = (data.title as string) || ""
  const images = (data.images as string[]) || []
  const columns = (data.columns as number) || 3

  return (
    <div className="px-6 py-8" style={sectionColor ? { color: sectionColor } : undefined}>
      {title && (
        <h2 className="text-xl font-bold mb-6" style={{ fontFamily: "var(--sf-font-heading)", color: sectionColor ?? "var(--sf-text)" }}>
          {title}
        </h2>
      )}
      {images.length === 0 ? (
        <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
          {[1, 2, 3].map((i) => (
            <div key={i} className="aspect-square rounded-2xl border-2 border-dashed flex items-center justify-center" style={{ borderColor: "color-mix(in srgb, var(--sf-text) 15%, transparent)" }}>
              <ImageIcon className="w-8 h-8 opacity-20" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
          {images.map((url, i) => (
            <div key={i} className="aspect-square rounded-2xl overflow-hidden bg-black/5">
              <img src={url} alt="" className="w-full h-full object-cover" />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function ProductTile({
  product,
  sectionColor,
  className,
}: {
  product: StorefrontProductItem
  sectionColor?: string
  className?: string
}) {
  const { activeBusiness } = useBusiness()
  const currency = activeBusiness?.currency ?? "NGN"
  const firstImage = Array.isArray(product.images) && product.images.length > 0 ? product.images[0] : null
  const imgUrl = typeof firstImage === "string" ? firstImage : firstImage?.url ?? null
  const price = product.salePrice != null ? product.salePrice : product.price
  const hasSale = product.salePrice != null && product.salePrice < product.price
  const priceNum = typeof price === "number" ? price : 0
  const originalNum = typeof product.price === "number" ? product.price : 0
  return (
    <div className={className}>
      <div className="aspect-square rounded-xl border border-brand-deep/10 dark:border-white/10 bg-brand-deep/5 dark:bg-white/5 overflow-hidden">
        {imgUrl ? (
          <img src={imgUrl} alt={product.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ShoppingBag className="w-8 h-8 opacity-30" />
          </div>
        )}
      </div>
      <p className="text-sm font-medium mt-2 line-clamp-2" style={{ color: sectionColor ?? "var(--sf-text)" }}>
        {product.name}
      </p>
      <p className="text-xs mt-0.5" style={{ color: sectionColor ?? "var(--sf-text)", opacity: 0.9 }}>
        {hasSale && <span className="line-through opacity-70 mr-1">{formatCurrency(originalNum, { currency })}</span>}
        {formatCurrency(priceNum, { currency })}
      </p>
    </div>
  )
}

function ProductListingPreview({
  data,
  sectionColor,
  slug,
}: { data: Record<string, unknown>; sectionColor?: string; slug?: string }) {
  const title = (data.title as string) || "Our Products"
  const limit = Math.min(24, Math.max(4, Number(data.limit) || 8))
  const maxItems = Number(data.maxItems) || 24
  const columns = Number(data.columns) || 4
  const showFilters = data.showFilters !== false
  const { data: products, isLoading, isError } = useStorefrontProducts(slug, { limit, page: 1 })

  // For preview, we only show one row based on columns
  const list = (products ?? []).slice(0, columns)

  const gridColsClass = {
    2: "grid-cols-2",
    3: "grid-cols-2 sm:grid-cols-3",
    4: "grid-cols-2 sm:grid-cols-3 md:grid-cols-4",
    6: "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6",
  }[columns as 2 | 3 | 4 | 6] || "grid-cols-2 md:grid-cols-4"

  return (
    <div className="px-6 py-8" style={sectionColor ? { color: sectionColor } : undefined}>
      <h2 className="text-xl font-bold mb-4" style={{ fontFamily: "var(--sf-font-heading)", color: sectionColor ?? "var(--sf-text)" }}>
        {title}
      </h2>
      {!slug ? (
        <div className={cn("grid gap-3", gridColsClass)}>
          {Array.from({ length: columns }).map((_, i) => (
            <div key={i} className="aspect-square rounded-xl border border-brand-deep/10 dark:border-white/10 bg-brand-deep/5 dark:bg-white/5 flex items-center justify-center">
              <ShoppingBag className="w-8 h-8 opacity-30" />
            </div>
          ))}
        </div>
      ) : isLoading ? (
        <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 md:grid-cols-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="aspect-square rounded-xl border border-brand-deep/10 dark:border-white/10 bg-brand-deep/5 dark:bg-white/5 animate-pulse" />
          ))}
        </div>
      ) : isError ? (
        <p className="text-sm opacity-70">Could not load products.</p>
      ) : list.length === 0 ? (
        <p className="text-sm opacity-70">No products yet.</p>
      ) : (
        <div className={cn("grid gap-3", gridColsClass)}>
          {list.map((p) => (
            <ProductTile key={p.id} product={p} sectionColor={sectionColor} />
          ))}
        </div>
      )}
      <p className="text-xs mt-3 opacity-60">
        Up to {maxItems} products (loads {limit} per page){showFilters ? " · Filters on" : ""}
      </p>
    </div>
  )
}

function FeaturedProductsPreview({
  data,
  sectionColor,
  slug,
}: { data: Record<string, unknown>; sectionColor?: string; slug?: string }) {
  const { activeBusiness } = useBusiness()
  const featuredCurrency = activeBusiness?.currency ?? "NGN"
  const title = (data.title as string) || "Featured"
  const subtitle = (data.subtitle as string) || ""
  const limit = Math.min(24, Math.max(4, Number(data.limit) || 8))
  const maxItems = Number(data.maxItems) || 24
  const columns = Number(data.columns) || 4
  const { data: products, isLoading, isError } = useStorefrontFeatured(slug, { limit, page: 1 })

  const list = (products ?? []).slice(0, columns)

  const gridColsClass = {
    2: "grid-cols-2",
    3: "grid-cols-2 sm:grid-cols-3",
    4: "grid-cols-2 sm:grid-cols-3 md:grid-cols-4",
    6: "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6",
  }[columns as 2 | 3 | 4 | 6] || "grid-cols-2 md:grid-cols-4"

  return (
    <div className="px-6 py-8" style={sectionColor ? { color: sectionColor } : undefined}>
      <h2 className="text-xl font-bold mb-1" style={{ fontFamily: "var(--sf-font-heading)", color: sectionColor ?? "var(--sf-text)" }}>
        {title}
      </h2>
      {subtitle && <p className="text-sm opacity-80 mb-4">{subtitle}</p>}
      {!slug ? (
        <div className={cn("grid gap-3", gridColsClass)}>
          {Array.from({ length: columns }).map((_, i) => (
            <div key={i} className="aspect-square rounded-xl border border-brand-deep/10 dark:border-white/10 bg-brand-deep/5 dark:bg-white/5 flex items-center justify-center">
              <Star className="w-6 h-6 opacity-30" />
            </div>
          ))}
        </div>
      ) : isLoading ? (
        <div className="flex gap-3 overflow-x-auto pb-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="w-40 shrink-0 aspect-[3/4] rounded-xl border border-brand-deep/10 dark:border-white/10 bg-brand-deep/5 dark:bg-white/5 animate-pulse" />
          ))}
        </div>
      ) : isError ? (
        <p className="text-sm opacity-70">Could not load featured products.</p>
      ) : list.length === 0 ? (
        <p className="text-sm opacity-70">No featured products yet.</p>
      ) : (
        <div className={cn("grid gap-3", gridColsClass)}>
          {list.map((p) => (
            <ProductTile key={p.id} product={p} sectionColor={sectionColor} />
          ))}
        </div>
      )}
      <p className="text-xs mt-2 opacity-60">Featured products · up to {maxItems} (loads {limit} per page)</p>
    </div>
  )
}

function OnSalePreview({
  data,
  sectionColor,
  slug,
}: { data: Record<string, unknown>; sectionColor?: string; slug?: string }) {
  const title = (data.title as string) || "On Sale"
  const subtitle = (data.subtitle as string) || ""
  const promotionId = data.promotionId as string | undefined
  const limit = Number(data.limit) || 8
  const maxItems = Number(data.maxItems) || 24
  const columns = Number(data.columns) || 4
  const { data: products, isLoading, isError } = useStorefrontOnSale(slug, { limit, promotionId })

  const list = (products ?? []).slice(0, columns)

  const gridColsClass = {
    2: "grid-cols-2",
    3: "grid-cols-2 sm:grid-cols-3",
    4: "grid-cols-2 sm:grid-cols-3 md:grid-cols-4",
    6: "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6",
  }[columns as 2 | 3 | 4 | 6] || "grid-cols-2 md:grid-cols-4"

  return (
    <div className="px-6 py-8" style={sectionColor ? { color: sectionColor } : undefined}>
      <h2 className="text-xl font-bold mb-1" style={{ fontFamily: "var(--sf-font-heading)", color: sectionColor ?? "var(--sf-text)" }}>
        {title}
      </h2>
      {subtitle && <p className="text-sm opacity-80 mb-4">{subtitle}</p>}
      {promotionId && (
        <span className="inline-block px-2 py-0.5 rounded text-xs font-medium mb-3" style={{ backgroundColor: "var(--sf-secondary)", color: "var(--sf-primary)" }}>
          One promotion
        </span>
      )}
      {!slug ? (
        <div className={cn("grid gap-3", gridColsClass)}>
          {Array.from({ length: columns }).map((_, i) => (
            <div key={i} className="rounded-xl border border-brand-deep/10 dark:border-white/10 bg-brand-deep/5 dark:bg-white/5 aspect-square flex items-center justify-center">
              <Tag className="w-6 h-6 opacity-30" />
            </div>
          ))}
        </div>
      ) : isLoading ? (
        <div className="grid gap-3 grid-cols-2 sm:grid-cols-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="rounded-xl border border-brand-deep/10 dark:border-white/10 bg-brand-deep/5 dark:bg-white/5 aspect-square animate-pulse" />
          ))}
        </div>
      ) : isError ? (
        <p className="text-sm opacity-70">Could not load on-sale products.</p>
      ) : list.length === 0 ? (
        <p className="text-sm opacity-70">No products on sale.</p>
      ) : (
        <div className={cn("grid gap-3", gridColsClass)}>
          {list.map((p) => (
            <ProductTile key={p.id} product={p} sectionColor={sectionColor} />
          ))}
        </div>
      )}
      <p className="text-xs mt-2 opacity-60">On sale · up to {maxItems} (loads {limit} per page)</p>
    </div>
  )
}

function PromotionBannerPreview({
  data,
  sectionColor,
  textAlign,
}: {
  data: Record<string, unknown>
  sectionColor?: string
  textAlign?: "left" | "center" | "right"
}) {
  const title = (data.title as string) || "Promotion"
  const subtitle = (data.subtitle as string) || ""
  const imageUrl = data.imageUrl as string | undefined
  const badgeLabel = (data.badgeLabel as string) || ""
  const cta = data.cta as { label: string; href: string } | undefined
  const endsAt = data.endsAt as string | undefined
  const showCountdown = !!data.showCountdown
  const textColor = sectionColor ?? "var(--sf-background)"

  const alignClass = textAlign === "right" ? "items-end text-right" : textAlign === "left" ? "items-start text-left" : "items-center text-center"

  return (
    <div className={cn("relative overflow-hidden rounded-lg px-6 py-8 min-h-[140px] flex flex-col justify-center", alignClass)} style={{ backgroundColor: "var(--sf-primary)" }}>
      {imageUrl && (
        <div className="absolute inset-0 bg-cover bg-center opacity-30" style={{ backgroundImage: `url(${imageUrl})` }} />
      )}
      <div className="relative z-10" style={{ color: textColor }}>
        {badgeLabel && (
          <span className="inline-block px-2 py-0.5 rounded text-xs font-medium mb-2" style={{ backgroundColor: "var(--sf-secondary)", color: "var(--sf-primary)" }}>
            {badgeLabel}
          </span>
        )}
        <h2 className="text-xl font-bold" style={{ fontFamily: "var(--sf-font-heading)" }}>{title}</h2>
        {subtitle && <p className="text-sm opacity-90 mt-1">{subtitle}</p>}
        {cta?.label && (
          <span className="inline-block mt-4 px-4 py-2 rounded-full text-sm font-semibold" style={{ backgroundColor: "var(--sf-secondary)", color: "var(--sf-primary)" }}>
            {cta.label}
          </span>
        )}
        {(endsAt || showCountdown) && <p className="text-xs mt-3 opacity-80">Ends {endsAt ? new Date(endsAt).toLocaleDateString() : "—"}</p>}
      </div>
    </div>
  )
}

function PlaceholderPreview({ type }: { type: string }) {
  const icons: Record<string, React.ReactNode> = {}

  return (
    <div className="px-6 py-12 flex flex-col items-center justify-center opacity-30">
      {icons[type] || <ShoppingBag className="w-8 h-8" />}
      <span className="text-xs mt-2 font-medium capitalize">{type.replace(/_/g, " ")}</span>
      <span className="text-[10px] mt-1">Data-driven block — configured automatically</span>
    </div>
  )
}

function ImagePreview({ data }: { data: Record<string, unknown> }) {
  const imageUrl = data.imageUrl as string
  const alt = (data.alt as string) || ""
  const caption = data.caption as string
  const aspectRatio = (data.aspectRatio as string) || "auto"
  const rounded = (data.rounded as string) || "xl"

  const ratioClasses: Record<string, string> = {
    auto: "",
    "1:1": "aspect-square",
    "4:3": "aspect-[4/3]",
    "16:9": "aspect-video",
    "21:9": "aspect-[21/9]",
  }

  const roundedClasses: Record<string, string> = {
    none: "rounded-none",
    lg: "rounded-lg",
    xl: "rounded-xl",
    "2xl": "rounded-2xl",
    "3xl": "rounded-3xl",
    full: "rounded-full",
  }

  if (!imageUrl) {
    return (
      <div className="px-6 py-12 flex flex-col items-center justify-center bg-black/5 dark:bg-white/5 rounded-3xl opacity-30">
        <ImageIcon className="w-8 h-8 mb-2" />
        <span className="text-xs">No image selected</span>
      </div>
    )
  }

  return (
    <div className="px-6 py-4">
      <div className={cn("overflow-hidden mx-auto", ratioClasses[aspectRatio] || "", roundedClasses[rounded] || "rounded-xl")}>
        <img src={imageUrl} alt={alt} className="w-full h-full object-cover" />
      </div>
      {caption && <p className="text-center text-xs mt-3 opacity-60 italic">{caption}</p>}
    </div>
  )
}

function GridPreview({ data, previewDark }: { data: Record<string, unknown>; previewDark: boolean }) {
  const columns = (data.columns as GridLayoutColumn[]) || []
  const style = (data.style as GridLayoutStyle) || {}
  const proportions = style.proportions || columns.map(() => "1fr").join(" ")
  const gapRaw = style.gap || "md"
  const gapClasses: Record<string, string> = {
    none: "gap-0",
    sm: "gap-4",
    md: "gap-8",
    lg: "gap-12",
  }
  const gapClass = gapClasses[gapRaw] ?? ""
  const gapStyle = !gapClasses[gapRaw] ? { gap: gapRaw } : {}

  return (
    <div
      className={cn("grid w-full px-6 py-4", gapClass)}
      style={{ gridTemplateColumns: proportions, ...gapStyle }}
    >
      {columns.map((col, idx) => (
        <div key={idx} className="flex flex-col gap-6 min-w-0">
          {col.blocks.length === 0 ? (
            <div className="h-full min-h-[100px] rounded-2xl border-2 border-dashed border-brand-deep/5 dark:border-white/5 flex items-center justify-center opacity-30">
              <Plus className="w-5 h-5 mr-2" />
              <span className="text-[10px] font-medium uppercase tracking-wider">Empty Column</span>
            </div>
          ) : (
            col.blocks.map((block) => (
              <BlockRenderer key={block.id} block={block} previewDark={previewDark} />
            ))
          )}
        </div>
      ))}
    </div>
  )
}
