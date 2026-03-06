import type { StorefrontSection, SectionContent, SectionSettings } from '../types'

/** API section shape: id, type, config, data (from storefront_page_schema) */
export type ApiSection = {
  id: string
  type: string
  config: {
    padding?: 'none' | 'sm' | 'md' | 'lg'
    background?: string
    textAlign?: 'left' | 'center' | 'right'
    showBorder?: boolean
  }
  data: Record<string, unknown>
}

const PADDING_API_TO_BUILDER: Record<string, SectionSettings['padding']> = {
  none: 'none',
  sm: 'small',
  md: 'medium',
  lg: 'large',
}

const PADDING_BUILDER_TO_API: Record<string, 'none' | 'sm' | 'md' | 'lg'> = {
  none: 'none',
  small: 'sm',
  medium: 'md',
  large: 'lg',
}

/** API type -> webapp SectionType (builder) */
const API_TYPE_TO_BUILDER: Record<string, StorefrontSection['type']> = {
  hero: 'hero',
  alternating_features: 'features',
  grid_features: 'features',
  testimonials: 'testimonial',
  faq: 'faq',
  cta: 'cta-banner',
  product_listing: 'product-showcase',
  contact_block: 'contact',
  rich_text: 'rich-text',
  featured_products: 'features',
  on_sale: 'features',
  promotion_banner: 'cta-banner',
}

/** Webapp SectionType -> API type */
const BUILDER_TYPE_TO_API: Record<string, string> = {
  hero: 'hero',
  features: 'grid_features',
  'rich-text': 'rich_text',
  gallery: 'grid_features',
  contact: 'contact_block',
  'product-showcase': 'product_listing',
  'cta-banner': 'cta',
  faq: 'faq',
  testimonial: 'testimonials',
}

function apiConfigToSettings(config: ApiSection['config']): SectionSettings {
  return {
    padding: config.padding ? PADDING_API_TO_BUILDER[config.padding] ?? 'medium' : 'medium',
    isVisible: true,
    ...(config.background && { backgroundColor: config.background }),
    ...(config.textAlign && { textColor: undefined }),
    ...(config.showBorder !== undefined && {}),
  }
}

function builderSettingsToConfig(settings: SectionSettings): ApiSection['config'] {
  return {
    padding: PADDING_BUILDER_TO_API[settings.padding ?? 'medium'] ?? 'md',
    background: 'default',
    textAlign: 'left',
    showBorder: false,
  }
}

function apiDataToContent(type: string, data: Record<string, unknown>): SectionContent {
  switch (type) {
    case 'hero': {
      const d = data as {
        title?: string
        subtitle?: string
        imageUrl?: string
        primaryCta?: { label: string; href: string }
        secondaryCta?: { label: string; href: string }
        layout?: string
      }
      return {
        heading: d.title,
        subheading: d.subtitle,
        text: d.subtitle,
        primaryAction: d.primaryCta,
        secondaryAction: d.secondaryCta,
        images: d.imageUrl ? [{ url: d.imageUrl }] : undefined,
        layoutVariation: d.layout,
      }
    }
    case 'alternating_features':
    case 'grid_features':
    case 'featured_products':
    case 'on_sale': {
      const d = data as { title?: string; items?: unknown[]; columns?: number }
      return {
        heading: d.title,
        items: d.items ?? [],
        layoutVariation: d.columns !== undefined ? String(d.columns) : undefined,
      }
    }
    case 'rich_text': {
      const d = data as { html?: string }
      return { text: d.html ?? '', html: d.html }
    }
    case 'cta':
    case 'promotion_banner': {
      const d = data as {
        title?: string
        subtitle?: string
        primaryCta?: { label: string; href: string }
        secondaryCta?: { label: string; href: string }
      }
      return {
        heading: d.title,
        text: d.subtitle,
        primaryAction: d.primaryCta,
        secondaryAction: d.secondaryCta,
      }
    }
    case 'testimonials': {
      const d = data as { title?: string; items?: unknown[] }
      return { heading: d.title, items: d.items ?? [] }
    }
    case 'faq': {
      const d = data as { title?: string; items?: { q: string; a: string }[] }
      return { heading: d.title, items: d.items ?? [] }
    }
    case 'product_listing': {
      const d = data as { title?: string; categoryId?: string; limit?: number; showFilters?: boolean }
      return {
        heading: d.title,
        items: [],
        categoryId: d.categoryId,
        limit: d.limit,
        showFilters: d.showFilters,
      }
    }
    case 'contact_block': {
      const d = data as { title?: string; description?: string; showForm?: boolean; showMap?: boolean }
      return {
        heading: d.title,
        text: d.description,
        showForm: d.showForm,
        showMap: d.showMap,
      }
    }
    default:
      return { heading: 'Section', text: '', ...data }
  }
}

function builderContentToData(
  builderType: StorefrontSection['type'],
  content: SectionContent
): Record<string, unknown> {
  switch (builderType) {
    case 'hero':
      return {
        title: content.heading ?? 'Title',
        subtitle: content.subheading ?? content.text,
        imageUrl: content.images?.[0]?.url,
        primaryCta: content.primaryAction,
        secondaryCta: content.secondaryAction,
        layout: content.layoutVariation ?? 'center',
      }
    case 'features':
      return {
        title: content.heading,
        items: content.items ?? [],
        columns: content.layoutVariation ? Number(content.layoutVariation) || 3 : 3,
      }
    case 'product-showcase':
      return {
        title: content.heading,
        categoryId: content.categoryId,
        limit: content.limit ?? 8,
        showFilters: content.showFilters !== false,
      }
    case 'rich-text':
      return { html: content.html ?? content.text ?? '' }
    case 'cta-banner':
      return {
        title: content.heading ?? 'CTA',
        subtitle: content.text,
        primaryCta: content.primaryAction ?? { label: 'Click', href: '#' },
        secondaryCta: content.secondaryAction,
        theme: 'brand',
      }
    case 'testimonial':
      return { title: content.heading, items: content.items ?? [] }
    case 'faq':
      return { title: content.heading, items: content.items ?? [] }
    case 'contact':
      return {
        title: content.heading,
        description: content.text,
        showForm: content.showForm !== false,
        showMap: content.showMap === true,
      }
    case 'gallery':
      return {
        title: content.heading,
        items: content.items ?? content.images ?? [],
        columns: 3,
      }
    default:
      return {
        title: content.heading,
        text: content.text,
        items: content.items,
      }
  }
}

/**
 * Convert API sections (id, type, config, data) to builder sections (id, type, content, settings).
 */
export function apiSectionsToBuilder(apiSections: ApiSection[]): StorefrontSection[] {
  return apiSections.map((s) => {
    const builderType = API_TYPE_TO_BUILDER[s.type] ?? 'features'
    return {
      id: s.id,
      type: builderType,
      content: apiDataToContent(s.type, s.data),
      settings: apiConfigToSettings(s.config),
    }
  })
}

/**
 * Convert builder sections to API shape (id, type, config, data) for POST/PATCH.
 */
export function builderSectionsToApi(sections: StorefrontSection[]): ApiSection[] {
  return sections.map((s) => ({
    id: s.id,
    type: BUILDER_TYPE_TO_API[s.type] ?? 'grid_features',
    config: builderSettingsToConfig(s.settings),
    data: builderContentToData(s.type, s.content),
  }))
}
