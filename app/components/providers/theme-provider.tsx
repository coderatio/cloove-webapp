"use client"

import * as React from "react"
import { ThemeProvider as NextThemesProvider, useTheme } from "next-themes"
import { usePathname } from "next/navigation"

const LIGHT_THEME_COLOR = "#fdfcf8"
const DARK_THEME_COLOR = "#061b15"

/**
 * Routes that should use an opaque (non-immersive) status bar.
 * On these pages content must NOT extend under the status bar because
 * the layout is designed for a standard viewport, not edge-to-edge.
 * Keep in sync with the forcedTheme check below.
 */
const PUBLIC_ROUTE_PATTERN = /^\/(login|register|staff-invite|verify|onboarding|reset-password)(\/.*)?$/

function ThemeColorSync() {
    const { resolvedTheme } = useTheme()
    const pathname = usePathname()

    React.useEffect(() => {

        const themeColor =
            resolvedTheme === "dark"
                ? DARK_THEME_COLOR
                : resolvedTheme === "light"
                    ? LIGHT_THEME_COLOR
                    : window.matchMedia("(prefers-color-scheme: dark)").matches
                        ? DARK_THEME_COLOR
                        : LIGHT_THEME_COLOR

        // ── theme-color (Chrome toolbar / Android status bar) ─────────────────
        // First, remove any existing theme-color tags (including those from Next.js)
        const existingMetas = document.querySelectorAll('meta[name="theme-color"]')
        existingMetas.forEach(el => el.remove())

        // Create a single, authoritative theme-color tag
        const meta = document.createElement("meta")
        meta.name = "theme-color"
        meta.setAttribute("data-theme-color", "dynamic")
        meta.content = themeColor
        document.head.appendChild(meta)

        document.documentElement.style.colorScheme = resolvedTheme === "dark" ? "dark" : "light"
        document.documentElement.classList.toggle("dark", resolvedTheme === "dark")

        // ── iOS PWA status bar style ──────────────────────────────────────────
        // black-translucent → immersive: content extends under the status bar
        //                     (correct for authenticated app screens)
        // black             → opaque: status bar sits above content
        //                     (correct for public/auth screens whose layouts
        //                      are not designed for edge-to-edge rendering)
        let statusBarMeta = document.querySelector(
            'meta[name="apple-mobile-web-app-status-bar-style"]'
        ) as HTMLMetaElement | null
        if (!statusBarMeta) {
            statusBarMeta = document.createElement("meta")
            statusBarMeta.name = "apple-mobile-web-app-status-bar-style"
            document.head.appendChild(statusBarMeta)
        }
        statusBarMeta.content = "black-translucent"
    }, [resolvedTheme, pathname])

    return null
}

export function ThemeProvider({
    children,
    ...props
}: React.ComponentProps<typeof NextThemesProvider>) {
    const pathname = usePathname()
    const isPublicRoute = pathname ? PUBLIC_ROUTE_PATTERN.test(pathname) : false

    return (
        <NextThemesProvider
            {...props}
            forcedTheme={isPublicRoute ? "dark" : props.forcedTheme}
        >
            <ThemeColorSync />
            {children}
        </NextThemesProvider>
    )
}
