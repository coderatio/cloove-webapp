"use client"

import { createContext, useContext, useMemo, type ReactNode } from "react"
import { useStorefrontTheme, type StorefrontThemeData } from "@/app/domains/storefront/hooks/useStorefrontTheme"
import { getDefaultTheme, GOOGLE_FONTS_ALLOWED, DEFAULT_COLORS, DEFAULT_COLORS_DARK } from "@/app/domains/storefront/lib/theme-defaults"

interface EditorCanvasProps {
  children: ReactNode
  previewDark: boolean
  pageBackground?: string
  className?: string
}

type PreviewThemeValue = {
  style: React.CSSProperties
  dataTheme: "light" | "dark"
}

const StorefrontPreviewThemeContext = createContext<PreviewThemeValue | null>(null)

function buildFontUrl(fonts: { heading: string; body: string }): string | null {
  const families = new Set<string>()
  if (fonts.heading && GOOGLE_FONTS_ALLOWED.includes(fonts.heading as (typeof GOOGLE_FONTS_ALLOWED)[number])) {
    families.add(fonts.heading)
  }
  if (fonts.body && GOOGLE_FONTS_ALLOWED.includes(fonts.body as (typeof GOOGLE_FONTS_ALLOWED)[number])) {
    families.add(fonts.body)
  }
  if (families.size === 0) return null
  const params = Array.from(families)
    .map((f) => `family=${f.replace(/ /g, "+")}:wght@400;500;600;700`)
    .join("&")
  return `https://fonts.googleapis.com/css2?${params}&display=swap`
}

export function EditorCanvas({ children, previewDark, pageBackground, className }: EditorCanvasProps) {
  const { data: theme } = useStorefrontTheme()
  const defaults = getDefaultTheme()
  const merged: StorefrontThemeData = useMemo(() => ({ ...defaults, ...theme }), [theme, defaults])

  const colors = useMemo(() => {
    const base = merged.colors ?? DEFAULT_COLORS
    if (previewDark) {
      const dark = merged.colorsDark ?? DEFAULT_COLORS_DARK
      return {
        primary: dark.primary ?? base.primary,
        secondary: dark.secondary ?? base.secondary,
        background: dark.background ?? DEFAULT_COLORS_DARK.background,
        text: dark.text ?? DEFAULT_COLORS_DARK.text,
      }
    }
    return {
      primary: base.primary ?? DEFAULT_COLORS.primary,
      secondary: base.secondary ?? DEFAULT_COLORS.secondary,
      background: base.background ?? DEFAULT_COLORS.background,
      text: base.text ?? DEFAULT_COLORS.text,
    }
  }, [previewDark, merged])

  const fonts = useMemo(() => merged.fonts ?? defaults.fonts, [merged, defaults])
  const fontUrl = useMemo(() => buildFontUrl(fonts), [fonts])

  const previewTheme = useMemo<PreviewThemeValue>(
    () => ({
      style: {
        "--sf-primary": colors.primary,
        "--sf-secondary": colors.secondary,
        "--sf-background": pageBackground || colors.background,
        "--sf-text": colors.text,
        "--sf-font-heading": `'${fonts.heading}', serif`,
        "--sf-font-body": `'${fonts.body}', sans-serif`,
        backgroundColor: pageBackground || colors.background,
        color: colors.text,
        fontFamily: `'${fonts.heading}', serif`,
      } as React.CSSProperties,
      dataTheme: previewDark ? "dark" : "light",
    }),
    [colors, fonts, previewDark, pageBackground]
  )

  return (
    <>
      {fontUrl && (
        // eslint-disable-next-line @next/next/no-page-custom-font
        <link rel="stylesheet" href={fontUrl} />
      )}
      <StorefrontPreviewThemeContext.Provider value={previewTheme}>
        <div className={className} style={previewTheme.style} data-theme={previewTheme.dataTheme}>
          {children}
        </div>
      </StorefrontPreviewThemeContext.Provider>
    </>
  )
}

export function PreviewThemeScope({
  children,
  className,
  style,
  ...rest
}: { children: ReactNode; className?: string; style?: React.CSSProperties } & React.HTMLAttributes<HTMLDivElement>) {
  const theme = useContext(StorefrontPreviewThemeContext)
  if (!theme) return <div className={className} style={style} {...rest}>{children}</div>
  return (
    <div
      className={className}
      style={{ ...theme.style, ...style }}
      data-theme={theme.dataTheme}
      {...rest}
    >
      {children}
    </div>
  )
}
