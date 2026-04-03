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
const PUBLIC_ROUTE_PATTERN = /^\/(login|register|staff-invite|verify|onboarding|reset-password|forgot-password|password-reset)(\/.*)?$/

function ThemeColorSync() {
    const { resolvedTheme } = useTheme()
    const pathname = usePathname()

    React.useEffect(() => {
        const isPublicRoute = pathname ? PUBLIC_ROUTE_PATTERN.test(pathname) : false

        // Forced dark for public routes, otherwise follow resolved theme
        const isDark = isPublicRoute || resolvedTheme === "dark" || (resolvedTheme !== "light" && window.matchMedia("(prefers-color-scheme: dark)").matches)
        const themeColor = isDark ? DARK_THEME_COLOR : LIGHT_THEME_COLOR

        // ── theme-color (Chrome toolbar / Android status bar) ─────────────────
        // Update or create the theme-color tag
        let meta = document.querySelector('meta[name="theme-color"]') as HTMLMetaElement
        if (!meta) {
            meta = document.createElement("meta")
            meta.name = "theme-color"
            document.head.appendChild(meta)
        }
        meta.setAttribute("data-theme-color", resolvedTheme || "system")
        meta.content = themeColor

        // Sync html classes and color-scheme for absolute consistency
        document.documentElement.style.colorScheme = isDark ? "dark" : "light"
        document.documentElement.classList.toggle("dark", isDark)

        // ── iOS PWA status bar style ──────────────────────────────────────────
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
