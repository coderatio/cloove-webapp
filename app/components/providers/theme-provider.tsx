"use client"

import * as React from "react"
import { ThemeProvider as NextThemesProvider, useTheme } from "next-themes"
import { usePathname } from "next/navigation"

const LIGHT_THEME_COLOR = "#fdfcf8"
const DARK_THEME_COLOR = "#062c21"

/**
 * Routes that should use an opaque (non-immersive) status bar.
 * On these pages content must NOT extend under the status bar because
 * the layout is designed for a standard viewport, not edge-to-edge.
 * Keep in sync with the forcedTheme check below.
 */
const PUBLIC_ROUTE_PATTERN = /^\/(login|register|staff-invite|verify)(\/.*)?$/

function ThemeColorSync() {
    const { resolvedTheme } = useTheme()
    const pathname = usePathname()

    React.useEffect(() => {
        const isPublicRoute = PUBLIC_ROUTE_PATTERN.test(pathname ?? "")

        const themeColor =
            resolvedTheme === "dark"
                ? DARK_THEME_COLOR
                : resolvedTheme === "light"
                    ? LIGHT_THEME_COLOR
                    : window.matchMedia("(prefers-color-scheme: dark)").matches
                        ? DARK_THEME_COLOR
                        : LIGHT_THEME_COLOR

        // ── theme-color (Chrome toolbar / Android status bar) ─────────────────
        let meta = document.querySelector('meta[name="theme-color"][data-theme-color="dynamic"]') as HTMLMetaElement | null
        if (!meta) {
            meta = document.createElement("meta")
            meta.name = "theme-color"
            meta.setAttribute("data-theme-color", "dynamic")
            document.head.appendChild(meta)
        }
        meta.content = themeColor

        const allThemeMetas = document.querySelectorAll('meta[name="theme-color"]')
        allThemeMetas.forEach((tag) => {
            if (tag !== meta) {
                tag.setAttribute("content", themeColor)
            }
        })

        document.documentElement.style.colorScheme = resolvedTheme === "dark" ? "dark" : "light"

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
        statusBarMeta.content = isPublicRoute ? "black" : "black-translucent"
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
