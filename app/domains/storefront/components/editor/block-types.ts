import {
  Layout,
  Type,
  MousePointerClick,
  HelpCircle,
  Quote,
  Grid3X3,
  Mail,
  Image,
  ShoppingBag,
  Star,
  Tag,
  Megaphone,
  type LucideIcon,
} from "lucide-react"

export type BlockType =
  | "hero"
  | "rich_text"
  | "cta"
  | "faq"
  | "testimonials"
  | "grid_features"
  | "contact_block"
  | "image_gallery"
  | "product_listing"
  | "featured_products"
  | "on_sale"
  | "promotion_banner"
  | "grid_layout"
  | "image"

export interface BlockSection {
  id: string
  type: BlockType
  config: BlockConfig
  data: Record<string, unknown>
}

export type SectionBackground =
  | { type: "solid"; color: string }
  | { type: "gradient"; direction: string; color1: string; color2: string }
  | { type: "image"; imageUrl: string; overlayOpacity: number; overlayColor?: string }

export interface BlockConfig {
  padding: string
  margin: string
  background: "default" | "muted" | "accent"
  textAlign: "left" | "center" | "right"
  showBorder: boolean
  sectionBackground?: SectionBackground
  /** Dark mode override for section background. */
  sectionBackgroundDark?: SectionBackground
  /** Section text color (light mode). Applied to headings and body in hero, rich text, etc. */
  textColorLight?: string
  /** Section text color (dark mode). */
  textColorDark?: string
}

export interface FaqItem {
  question: string
  answer: string
}

export interface TestimonialItem {
  quote: string
  name: string
  role: string
}

export interface FeatureItem {
  icon: string
  title: string
  description: string
}

export interface CtaButton {
  label: string
  href: string
}

export interface GridLayoutColumn {
  blocks: BlockSection[]
}

export interface GridLayoutStyle {
  proportions?: string // e.g. "1fr 1fr", "1fr 2fr"
  gap: string
}

const DEFAULT_CONFIG: BlockConfig = {
  padding: "md",
  margin: "none",
  background: "default",
  textAlign: "left",
  showBorder: false,
}

export const BLOCK_META: Record<
  BlockType,
  { label: string; icon: LucideIcon; description: string; creatable: boolean }
> = {
  hero: { label: "Hero", icon: Layout, description: "Full-width banner with title and CTA", creatable: true },
  rich_text: { label: "Rich Text", icon: Type, description: "Formatted text with headings, lists, links", creatable: true },
  cta: { label: "Call to Action", icon: MousePointerClick, description: "Styled banner with button", creatable: true },
  faq: { label: "FAQ", icon: HelpCircle, description: "Accordion-style Q&A list", creatable: true },
  testimonials: { label: "Testimonials", icon: Quote, description: "Customer quote cards", creatable: true },
  grid_features: { label: "Feature Grid", icon: Grid3X3, description: "Icon + title + description grid", creatable: true },
  contact_block: { label: "Contact", icon: Mail, description: "Contact section with optional form", creatable: true },
  image_gallery: { label: "Image Gallery", icon: Image, description: "Grid of images", creatable: true },
  product_listing: { label: "Product Listing", icon: ShoppingBag, description: "Display products from catalog", creatable: true },
  featured_products: { label: "Featured Products", icon: Star, description: "Highlighted product selection", creatable: true },
  on_sale: { label: "On Sale", icon: Tag, description: "Products currently on sale", creatable: true },
  promotion_banner: { label: "Promotion", icon: Megaphone, description: "Promotional banner", creatable: true },
  grid_layout: { label: "Grid Layout", icon: Layout, description: "Multi-column container for other blocks", creatable: true },
  image: { label: "Image", icon: Image, description: "Single high-quality image", creatable: true },
}

export const CREATABLE_BLOCK_TYPES = (Object.keys(BLOCK_META) as BlockType[]).filter(
  (t) => BLOCK_META[t].creatable
)

function uid(): string {
  return `block-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

const DEFAULT_DATA: Record<BlockType, () => Record<string, unknown>> = {
  hero: () => ({
    title: "",
    subtitle: "",
    imageUrl: "",
    layout: "center",
    primaryCta: { label: "Get Started", href: "#" },
    secondaryCta: { label: "", href: "" },
  }),
  rich_text: () => ({
    html: "<p></p>",
  }),
  cta: () => ({
    title: "",
    subtitle: "",
    primaryCta: { label: "Learn More", href: "#" },
    theme: "brand",
  }),
  faq: () => ({
    title: "Frequently Asked Questions",
    items: [{ question: "", answer: "" }] as FaqItem[],
  }),
  testimonials: () => ({
    title: "What Our Customers Say",
    items: [{ quote: "", name: "", role: "" }] as TestimonialItem[],
  }),
  grid_features: () => ({
    title: "Features",
    columns: 3,
    items: [{ icon: "star", title: "", description: "" }] as FeatureItem[],
  }),
  contact_block: () => ({
    title: "Get in Touch",
    description: "",
    showForm: true,
    showMap: false,
  }),
  image_gallery: () => ({
    title: "",
    images: [] as string[],
    columns: 3,
  }),
  product_listing: () => ({
    title: "Our Products",
    categoryIds: [] as string[],
    limit: 8,
    columns: 4,
    showFilters: true,
    paginationType: "load_more", // "load_more" | "pagination" | "none"
    enableSearch: true,
    enabledFilters: ["price", "category"] as string[],
    sortBy: "newest",
  }),
  featured_products: () => ({
    title: "Featured",
    subtitle: "",
    limit: 8,
    columns: 4,
    paginationType: "none",
  }),
  on_sale: () => ({
    title: "On Sale",
    subtitle: "",
    promotionId: undefined as string | undefined,
    limit: 8,
    columns: 4,
    paginationType: "none",
  }),
  promotion_banner: () => ({
    promotionId: undefined as string | undefined,
    title: "Promotion",
    subtitle: "",
    imageUrl: "",
    badgeLabel: "",
    cta: undefined as { label: string; href: string } | undefined,
    endsAt: "",
    showCountdown: false,
  }),
  grid_layout: () => ({
    columns: [{ blocks: [] }, { blocks: [] }] as GridLayoutColumn[],
    style: { gap: "md" } as GridLayoutStyle,
  }),
  image: () => ({
    imageUrl: "",
    alt: "",
    caption: "",
    aspectRatio: "auto",
    rounded: "xl",
  }),
}

export function createBlock(type: BlockType): BlockSection {
  return {
    id: uid(),
    type,
    config: { ...DEFAULT_CONFIG },
    data: DEFAULT_DATA[type](),
  }
}
