"use client"

import * as React from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { ChevronLeftIcon as ChevronLeft, ChevronRightIcon as ChevronRight } from "@hugeicons/core-free-icons"
import { cn } from "@/app/lib/utils"

interface HorizontalScrollerProps {
    children: React.ReactNode
    /** Extra classes for the scroll track (e.g. padding). Gap defaults to gap-4. */
    className?: string
    /** Accessible label for the scrollable region. */
    ariaLabel?: string
    /**
     * Tailwind `from-*` color for the edge fade — should match the surface the
     * scroller sits on. Defaults to the page background. Inside a card, pass
     * e.g. "from-card".
     */
    fadeFromClassName?: string
}

/**
 * Horizontally scrolling row with affordances that there's more off-screen:
 * a soft edge fade plus a floating chevron button on each side, both of which
 * appear only when the track can actually scroll that way. Native swipe/scroll
 * still works; the buttons are a desktop convenience. Items should be
 * `shrink-0` with a fixed/clamped width.
 */
export function HorizontalScroller({
    children,
    className,
    ariaLabel,
    fadeFromClassName = "from-background",
}: HorizontalScrollerProps) {
    const trackRef = React.useRef<HTMLDivElement>(null)
    const [canLeft, setCanLeft] = React.useState(false)
    const [canRight, setCanRight] = React.useState(false)

    const updateEdges = React.useCallback(() => {
        const el = trackRef.current
        if (!el) return
        const { scrollLeft, scrollWidth, clientWidth } = el
        // 4px tolerance for sub-pixel rounding at the extremes.
        setCanLeft(scrollLeft > 4)
        setCanRight(scrollLeft + clientWidth < scrollWidth - 4)
    }, [])

    React.useEffect(() => {
        const el = trackRef.current
        if (!el) return
        updateEdges()
        el.addEventListener("scroll", updateEdges, { passive: true })
        const observer = new ResizeObserver(updateEdges)
        observer.observe(el)
        return () => {
            el.removeEventListener("scroll", updateEdges)
            observer.disconnect()
        }
    }, [updateEdges])

    const scrollByStep = (direction: 1 | -1) => {
        const el = trackRef.current
        if (!el) return
        el.scrollBy({ left: direction * Math.max(260, el.clientWidth * 0.8), behavior: "smooth" })
    }

    return (
        <div className="relative">
            {/* Left edge fade */}
            <div
                aria-hidden
                className={cn(
                    "pointer-events-none absolute inset-y-0 left-0 z-10 w-14 bg-gradient-to-r to-transparent transition-opacity duration-300",
                    fadeFromClassName,
                    canLeft ? "opacity-100" : "opacity-0"
                )}
            />
            <button
                type="button"
                aria-label="Scroll left"
                tabIndex={canLeft ? 0 : -1}
                onClick={() => scrollByStep(-1)}
                className={cn(
                    "absolute left-1.5 top-1/2 z-20 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-background text-brand-deep shadow-md transition-all duration-300 hover:bg-muted dark:text-brand-cream",
                    canLeft ? "opacity-100" : "pointer-events-none opacity-0"
                )}
            >
                <HugeiconsIcon icon={ChevronLeft} className="h-4 w-4" />
            </button>

            <div
                ref={trackRef}
                role="group"
                aria-label={ariaLabel}
                className={cn(
                    "flex gap-4 overflow-x-auto scroll-smooth pb-1 snap-x snap-mandatory",
                    "[scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden",
                    className
                )}
            >
                {children}
            </div>

            {/* Right edge fade */}
            <div
                aria-hidden
                className={cn(
                    "pointer-events-none absolute inset-y-0 right-0 z-10 w-14 bg-gradient-to-l to-transparent transition-opacity duration-300",
                    fadeFromClassName,
                    canRight ? "opacity-100" : "opacity-0"
                )}
            />
            <button
                type="button"
                aria-label="Scroll right"
                tabIndex={canRight ? 0 : -1}
                onClick={() => scrollByStep(1)}
                className={cn(
                    "absolute right-1.5 top-1/2 z-20 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-background text-brand-deep shadow-md transition-all duration-300 hover:bg-muted dark:text-brand-cream",
                    canRight ? "opacity-100" : "pointer-events-none opacity-0"
                )}
            >
                <HugeiconsIcon icon={ChevronRight} className="h-4 w-4" />
            </button>
        </div>
    )
}
