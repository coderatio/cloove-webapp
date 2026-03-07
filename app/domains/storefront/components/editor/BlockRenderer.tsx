"use client"

import type { BlockSection, FaqItem, TestimonialItem, FeatureItem, CtaButton, SectionBackground } from "./block-types"
import { HelpCircle, ChevronDown, Quote, Star, Image as ImageIcon, ShoppingBag, Tag, Megaphone } from "lucide-react"
import { formatCurrency } from "@/app/lib/formatters"
import { useBusiness } from "@/app/components/BusinessProvider"
import { useStorefront } from "@/app/domains/storefront/hooks/useStorefront"
import {
  useStorefrontProducts,
  useStorefrontFeatured,
  useStorefrontOnSale,
  type StorefrontProductItem,
} from "@/app/domains/storefront/hooks/useStorefrontProducts"

interface BlockRendererProps {
  block: BlockSection
  /** When true, use sectionBackgroundDark if set, else sectionBackground. */
  previewDark?: boolean
}

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

function renderSectionBackground(
  bg: SectionBackground,
  paddingClass: string,
  children: React.ReactNode
): React.ReactNode {
  if (bg.type === "solid") {
    return (
      <div className={paddingClass} style={{ backgroundColor: bg.color }}>
        {children}
      </div>
    )
  }
  if (bg.type === "gradient") {
    const dirKey = bg.direction || "to-br"
    const angle = GRADIENT_DIRECTIONS[dirKey] ?? "135deg"
    return (
      <div
        className={paddingClass}
        style={{ background: `linear-gradient(${angle}, ${bg.color1}, ${bg.color2})` }}
      >
        {children}
      </div>
    )
  }
  if (bg.type === "image" && bg.imageUrl) {
    const overlay = bg.overlayColor ?? "#000000"
    const opacity = Math.max(0, Math.min(1, bg.overlayOpacity ?? 0.4))
    return (
      <div className={`relative overflow-hidden ${paddingClass}`}>
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${bg.imageUrl})` }}
        />
        <div className="absolute inset-0" style={{ backgroundColor: overlay, opacity }} />
        <div className="relative z-10">{children}</div>
      </div>
    )
  }
  return <div className={paddingClass}>{children}</div>
}

function SectionWrapper({
  config,
  previewDark,
  children,
}: {
  config: BlockSection["config"]
  previewDark: boolean
  children: React.ReactNode
}) {
  const paddingClass = config.padding === "sm" ? "px-4 py-6" : config.padding === "lg" ? "px-8 py-12" : "px-6 py-8"
  const bg = previewDark && config.sectionBackgroundDark ? config.sectionBackgroundDark : config.sectionBackground

  if (!bg) return <>{children}</>
  return <>{renderSectionBackground(bg, paddingClass, children)}</>
}

function getSectionTextColor(config: BlockSection["config"], previewDark: boolean): string | undefined {
  if (previewDark && config.textColorDark) return config.textColorDark
  if (!previewDark && config.textColorLight) return config.textColorLight
  return undefined
}

export function BlockRenderer({ block, previewDark = false }: BlockRendererProps) {
  const { data: storefront } = useStorefront()
  const storefrontSlug = storefront?.slug
  const sectionColor = getSectionTextColor(block.config, previewDark)
  const content = (() => {
    switch (block.type) {
      case "hero":
        return <HeroPreview data={block.data} config={block.config} previewDark={previewDark} />
      case "rich_text":
        return <RichTextPreview data={block.data} sectionColor={sectionColor} />
      case "cta":
        return <CtaPreview data={block.data} />
      case "faq":
        return <FaqPreview data={block.data} sectionColor={sectionColor} />
      case "testimonials":
        return <TestimonialsPreview data={block.data} sectionColor={sectionColor} />
      case "grid_features":
        return <GridFeaturesPreview data={block.data} sectionColor={sectionColor} />
      case "contact_block":
        return <ContactPreview data={block.data} sectionColor={sectionColor} />
      case "image_gallery":
        return <ImageGalleryPreview data={block.data} sectionColor={sectionColor} />
      case "product_listing":
        return <ProductListingPreview data={block.data} sectionColor={sectionColor} slug={storefrontSlug} />
      case "featured_products":
        return <FeaturedProductsPreview data={block.data} sectionColor={sectionColor} slug={storefrontSlug} />
      case "on_sale":
        return <OnSalePreview data={block.data} sectionColor={sectionColor} slug={storefrontSlug} />
      case "promotion_banner":
        return <PromotionBannerPreview data={block.data} sectionColor={sectionColor} />
      default:
        return <PlaceholderPreview type={block.type} />
    }
  })()

  return (
    <SectionWrapper config={block.config} previewDark={previewDark}>
      {content}
    </SectionWrapper>
  )
}

const HERO_LAYOUT_CLASSES = {
  center: "items-center justify-center text-center",
  left: "items-start justify-start text-left pl-8",
  right: "items-end justify-end text-right pr-8",
} as const

function HeroPreview({
  data,
  config,
  previewDark,
}: {
  data: Record<string, unknown>
  config: BlockSection["config"]
  previewDark: boolean
}) {
  const title = (data.title as string) || "Hero Title"
  const subtitle = (data.subtitle as string) || "Add a subtitle for your hero section"
  const imageUrl = data.imageUrl as string
  const primaryCta = data.primaryCta as CtaButton | undefined
  const layout = (data.layout as keyof typeof HERO_LAYOUT_CLASSES) || "center"
  const layoutClasses = HERO_LAYOUT_CLASSES[layout] ?? HERO_LAYOUT_CLASSES.center
  const sectionColor = getSectionTextColor(config, previewDark)
  const isDarkBg = previewDark || !!imageUrl
  const titleColor = sectionColor || (isDarkBg ? "#ffffff" : "var(--sf-text)")
  const subtitleColor = sectionColor || (isDarkBg ? "rgba(255,255,255,0.85)" : "color-mix(in srgb, var(--sf-text) 70%, transparent)")

  return (
    <div className="relative overflow-hidden rounded-3xl" style={{ minHeight: 240 }}>
      {imageUrl ? (
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${imageUrl})` }}
        >
          <div className="absolute inset-0 bg-black/40" />
        </div>
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-[var(--sf-primary)] to-[var(--sf-secondary)] opacity-90" />
      )}
      <div className={`relative z-10 flex flex-col min-h-[240px] justify-center px-8 py-16 ${layoutClasses}`}>
        <h1
          className="text-3xl font-bold mb-3 leading-tight"
          style={{ fontFamily: "var(--sf-font-heading)", color: titleColor }}
        >
          {title}
        </h1>
        <p className="text-base opacity-80 max-w-lg mb-6" style={{ color: subtitleColor }}>
          {subtitle}
        </p>
        {primaryCta?.label && (
          <span
            className="inline-block px-6 py-2.5 rounded-full text-sm font-semibold"
            style={{ backgroundColor: "var(--sf-secondary)", color: "var(--sf-primary)" }}
          >
            {primaryCta.label}
          </span>
        )}
      </div>
    </div>
  )
}

function RichTextPreview({ data, sectionColor }: { data: Record<string, unknown>; sectionColor?: string }) {
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
          className="prose prose-sm max-w-none"
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

function CtaPreview({ data }: { data: Record<string, unknown> }) {
  const title = (data.title as string) || "Call to Action"
  const subtitle = (data.subtitle as string) || "Add a compelling message"
  const primaryCta = data.primaryCta as CtaButton | undefined
  const theme = (data.theme as keyof typeof CTA_THEME_STYLES) || "brand"
  const style = CTA_THEME_STYLES[theme] ?? CTA_THEME_STYLES.brand

  return (
    <div
      className="rounded-3xl px-8 py-12 text-center border border-transparent"
      style={style.wrapper}
    >
      <h2
        className="text-2xl font-bold mb-2"
        style={{ fontFamily: "var(--sf-font-heading)", ...style.title }}
      >
        {title}
      </h2>
      <p className="text-sm opacity-80 mb-6" style={style.subtitle}>
        {subtitle}
      </p>
      {primaryCta?.label && (
        <span
          className="inline-block px-6 py-2.5 rounded-full text-sm font-semibold"
          style={style.button}
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
  const showFilters = data.showFilters !== false
  const { data: products, isLoading, isError } = useStorefrontProducts(slug, { limit, page: 1 })
  const list = products ?? []
  return (
    <div className="px-6 py-8" style={sectionColor ? { color: sectionColor } : undefined}>
      <h2 className="text-xl font-bold mb-4" style={{ fontFamily: "var(--sf-font-heading)", color: sectionColor ?? "var(--sf-text)" }}>
        {title}
      </h2>
      {!slug ? (
        <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 md:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
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
        <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 md:grid-cols-4">
          {list.map((p) => (
            <ProductTile key={p.id} product={p} sectionColor={sectionColor} />
          ))}
        </div>
      )}
      <p className="text-xs mt-3 opacity-60">
        Up to {limit} products{showFilters ? " · Filters on" : ""}
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
  const limit = Math.min(12, Math.max(4, Number(data.limit) || 8))
  const { data: products, isLoading, isError } = useStorefrontFeatured(slug, limit)
  const list = products ?? []
  return (
    <div className="px-6 py-8" style={sectionColor ? { color: sectionColor } : undefined}>
      <h2 className="text-xl font-bold mb-1" style={{ fontFamily: "var(--sf-font-heading)", color: sectionColor ?? "var(--sf-text)" }}>
        {title}
      </h2>
      {subtitle && <p className="text-sm opacity-80 mb-4">{subtitle}</p>}
      {!slug ? (
        <div className="flex gap-3 overflow-x-auto pb-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="w-40 shrink-0 aspect-[3/4] rounded-xl border border-brand-deep/10 dark:border-white/10 bg-brand-deep/5 dark:bg-white/5 flex items-center justify-center">
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
        <div className="flex gap-3 overflow-x-auto pb-2">
          {list.map((p) => (
            <div key={p.id} className="w-40 shrink-0">
              <div className="aspect-[3/4] rounded-xl border border-brand-deep/10 dark:border-white/10 bg-brand-deep/5 dark:bg-white/5 overflow-hidden">
                {Array.isArray(p.images) && p.images[0] ? (
                  <img src={p.images[0]} alt={p.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Star className="w-6 h-6 opacity-30" />
                  </div>
                )}
              </div>
              <p className="text-sm font-medium mt-2 line-clamp-2" style={{ color: sectionColor ?? "var(--sf-text)" }}>{p.name}</p>
              <p className="text-xs mt-0.5" style={{ color: sectionColor ?? "var(--sf-text)", opacity: 0.9 }}>
                {formatCurrency(typeof (p.salePrice ?? p.price) === "number" ? (p.salePrice ?? p.price) : 0, { currency: featuredCurrency })}
              </p>
            </div>
          ))}
        </div>
      )}
      <p className="text-xs mt-2 opacity-60">Featured products · up to {limit}</p>
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
  const { data: products, isLoading, isError } = useStorefrontOnSale(slug, { limit, promotionId })
  const list = products ?? []
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
        <div className="grid gap-3 grid-cols-2 sm:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
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
        <div className="grid gap-3 grid-cols-2 sm:grid-cols-4">
          {list.map((p) => (
            <ProductTile key={p.id} product={p} sectionColor={sectionColor} />
          ))}
        </div>
      )}
      <p className="text-xs mt-2 opacity-60">On sale · up to {limit}</p>
    </div>
  )
}

function PromotionBannerPreview({ data, sectionColor }: { data: Record<string, unknown>; sectionColor?: string }) {
  const title = (data.title as string) || "Promotion"
  const subtitle = (data.subtitle as string) || ""
  const imageUrl = data.imageUrl as string | undefined
  const badgeLabel = (data.badgeLabel as string) || ""
  const cta = data.cta as { label: string; href: string } | undefined
  const endsAt = data.endsAt as string | undefined
  const showCountdown = !!data.showCountdown
  const textColor = sectionColor ?? "var(--sf-background)"
  return (
    <div className="relative overflow-hidden rounded-lg px-6 py-8 min-h-[140px] flex flex-col justify-center" style={{ backgroundColor: "var(--sf-primary)" }}>
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
