export const STOREFRONT_LAYOUT_IDS = ['classic', 'minimal', 'compact', 'creative'] as const
export const THEME_MODES = ['light', 'dark', 'auto'] as const
export const GOOGLE_FONTS_ALLOWED = [
  'Inter', 'Roboto', 'Open Sans', 'Lato', 'Poppins', 'Playfair Display', 'Montserrat',
  'Source Sans 3', 'Nunito', 'Work Sans', 'Oswald', 'Raleway', 'Merriweather', 'PT Sans',
  'Ubuntu', 'DM Sans', 'Manrope', 'Figtree', 'Outfit', 'Plus Jakarta Sans',
  'Instrument Serif', 'Syne',
] as const
export const HEADER_STYLES = ['centered', 'left', 'minimal'] as const
export const PRODUCT_CARD_RADIUS = ['sm', 'md', 'lg', 'xl', 'none'] as const
export const SHADOW_OPTIONS = ['sm', 'md', 'lg', 'none'] as const
export const CTA_SHAPES = ['rounded', 'pill', 'square'] as const
export const CTA_STYLES = ['solid', 'outline'] as const

export const DEFAULT_COLORS = {
  primary: '#062c21',
  secondary: '#d4af37',
  background: '#ffffff',
  text: '#062c21',
}
export const DEFAULT_COLORS_DARK = {
  primary: '#062c21',
  secondary: '#d4af37',
  background: '#0f1412',
  text: '#f5f0e6',
}

export function getDefaultTheme() {
  return {
    schemaVersion: 1,
    layout: 'classic' as const,
    themeMode: 'auto' as const,
    colors: { ...DEFAULT_COLORS },
    colorsDark: { ...DEFAULT_COLORS_DARK },
    fonts: { heading: 'Instrument Serif', body: 'Syne' },
    components: {
      header: { style: 'centered' as const, showSearch: true },
      productCard: { borderRadius: 'lg' as const, shadow: 'md' as const },
      ctaButton: { shape: 'rounded' as const, style: 'solid' as const },
    },
    welcomeMessage: '',
  }
}
