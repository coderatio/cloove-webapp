"use client"

import * as React from "react"
import { ThemeProvider as NextThemesProvider, useTheme } from "next-themes"
import { usePathname } from "next/navigation"

const LIGHT_THEME_COLOR = "#fdfcf8"
const DARK_THEME_COLOR = "#062c21"

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
    }, [resolvedTheme, pathname])

    return null
}

export function ThemeProvider({
    children,
    ...props
}: React.ComponentProps<typeof NextThemesProvider>) {
    return (
        <NextThemesProvider {...props}>
            <ThemeColorSync />
            {children}
        </NextThemesProvider>
    )
}
