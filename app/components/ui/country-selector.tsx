"use client"

import { useState, useRef, useEffect, useLayoutEffect } from "react"
import { createPortal } from "react-dom"
import { motion, AnimatePresence } from "framer-motion"
import { ChevronDown, CheckCircle2 } from "lucide-react"
import { cn } from "@/app/lib/utils"

export interface CountryDetail {
    id: string
    name: string
    code: string
    phoneCode: string
    currency: {
        code: string
        symbol: string
    }
    isDefault?: boolean
}

interface CountrySelectorProps {
    countries: CountryDetail[]
    selectedCountry: CountryDetail | null
    onSelect: (country: CountryDetail) => void
    disabled?: boolean
    className?: string
    triggerClassName?: string
    dropdownClassName?: string
    /** 'dark' = cream text on dark dropdown (auth pages). 'light' = dark text on light dropdown (onboarding). */
    dropdownVariant?: "dark" | "light"
    /** Show the selected country name next to the flag in the trigger button. */
    showName?: boolean
    triggerRef?: React.RefObject<HTMLButtonElement | null>
}

export function CountrySelector({
    countries,
    selectedCountry,
    onSelect,
    disabled = false,
    className,
    triggerClassName,
    dropdownClassName,
    dropdownVariant = "dark",
    showName = false,
    triggerRef,
}: CountrySelectorProps) {
    const DROPDOWN_WIDTH = 192
    const GAP = 8
    const MIN_SPACE_BELOW = 280

    const [isOpen, setIsOpen] = useState(false)
    const [dropdownRect, setDropdownRect] = useState<{
        top?: number
        bottom?: number
        left: number
        openAbove: boolean
        maxHeight?: number
    } | null>(null)
    const containerRef = useRef<HTMLDivElement>(null)

    const updateDropdownRect = () => {
        if (!containerRef.current || typeof window === "undefined") return
        const rect = containerRef.current.getBoundingClientRect()
        const viewportH = window.innerHeight
        const viewportW = window.innerWidth
        const spaceBelow = viewportH - rect.bottom - GAP
        const spaceAbove = rect.top - GAP
        const openAbove = spaceBelow < MIN_SPACE_BELOW && spaceAbove > spaceBelow
        let left = rect.left
        left = Math.max(0, Math.min(left, viewportW - DROPDOWN_WIDTH))

        if (openAbove) {
            setDropdownRect({
                bottom: viewportH - rect.top + GAP,
                left,
                openAbove: true,
                maxHeight: Math.min(spaceAbove, 400),
            })
        } else {
            setDropdownRect({
                top: rect.bottom + GAP,
                left,
                openAbove: false,
                maxHeight: Math.min(spaceBelow, 400),
            })
        }
    }

    useLayoutEffect(() => {
        if (!isOpen) {
            setDropdownRect(null)
            return
        }
        updateDropdownRect()
        const onScrollOrResize = () => updateDropdownRect()
        window.addEventListener("scroll", onScrollOrResize, true)
        window.addEventListener("resize", onScrollOrResize)
        return () => {
            window.removeEventListener("scroll", onScrollOrResize, true)
            window.removeEventListener("resize", onScrollOrResize)
        }
    }, [isOpen])

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                const target = event.target as HTMLElement
                if (target.closest("[data-country-dropdown]")) return
                setIsOpen(false)
            }
        }
        document.addEventListener("mousedown", handleClickOutside)
        return () => document.removeEventListener("mousedown", handleClickOutside)
    }, [])

    // Allow the selector to render even if data is still loading or limited
    // The button will be disabled or show default state

    const getFlag = (code: string) => {
        switch (code) {
            case 'NG': return '🇳🇬'
            case 'GH': return '🇬🇭'
            case 'KE': return '🇰🇪'
            case 'RW': return '🇷🇼'
            case 'ZA': return '🇿🇦'
            case 'UG': return '🇺🇬'
            case 'ZW': return '🇿🇼'
            default: return '🌍'
        }
    }

    return (
        <div ref={containerRef} className={cn("relative", className)}>
            <button
                ref={triggerRef}
                type="button"
                disabled={disabled}
                onClick={() => setIsOpen(!isOpen)}
                className={cn(
                    "h-14 px-4 bg-white/10 border cursor-pointer border-white/20 rounded-2xl flex items-center gap-1.5 text-brand-cream hover:bg-white/20 transition-all",
                    disabled && "opacity-50 cursor-not-allowed",
                    isOpen && "border-brand-gold/40",
                    triggerClassName
                )}
            >
                <span className="text-lg">
                    {selectedCountry ? getFlag(selectedCountry.code) : '🌍'}
                </span>
                {showName && selectedCountry && (
                    <span className="text-sm font-medium truncate">{selectedCountry.name}</span>
                )}
                <ChevronDown className={cn(
                    "w-4 h-4 text-brand-gold transition-transform",
                    isOpen && "rotate-180"
                )} />
            </button>

            {typeof document !== "undefined" &&
                isOpen &&
                dropdownRect &&
                createPortal(
                    <AnimatePresence>
                        <motion.div
                            data-country-dropdown
                            initial={{ opacity: 0, y: dropdownRect.openAbove ? 8 : -8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: dropdownRect.openAbove ? 8 : -8 }}
                            style={{
                                position: "fixed",
                                ...(dropdownRect.top !== undefined
                                    ? { top: dropdownRect.top }
                                    : { bottom: dropdownRect.bottom }),
                                left: dropdownRect.left,
                                zIndex: 9999,
                                maxHeight: dropdownRect.maxHeight,
                                overflowY: "auto",
                            }}
                            className={cn(
                                "w-48 rounded-2xl overflow-hidden shadow-2xl border border-white/10 bg-brand-deep/95 backdrop-blur-xl text-brand-cream",
                                dropdownVariant === "light" && "border-brand-green/10 bg-brand-cream/95 text-brand-deep",
                                dropdownClassName
                            )}
                        >
                            {countries.map((c) => (
                                <button
                                    key={c.id}
                                    type="button"
                                    onClick={() => {
                                        onSelect(c)
                                        setIsOpen(false)
                                    }}
                                    className={cn(
                                        "w-full px-4 cursor-pointer py-3 flex items-center justify-between transition-colors text-left",
                                        dropdownVariant === "dark" && "hover:bg-white/10 text-brand-cream",
                                        dropdownVariant === "dark" && selectedCountry?.id === c.id && "bg-white/10",
                                        dropdownVariant === "light" && "hover:bg-black/5 dark:hover:bg-white/10 text-brand-deep dark:text-brand-cream",
                                        dropdownVariant === "light" && selectedCountry?.id === c.id && "bg-black/5 dark:bg-white/10"
                                    )}
                                >
                                    <div className="flex items-center gap-3">
                                        <span className="text-lg leading-none">
                                            {getFlag(c.code)}
                                        </span>
                                        <div className="flex items-center gap-2">
                                            <span className={cn(
                                                "text-sm font-medium",
                                                dropdownVariant === "dark" && "text-brand-cream",
                                                dropdownVariant === "light" && "text-brand-deep dark:text-brand-cream"
                                            )}>{c.name}</span>
                                            <span className={cn(
                                                "text-[10px] font-medium",
                                                dropdownVariant === "dark" && "text-brand-cream/60",
                                                dropdownVariant === "light" && "text-brand-deep/70 dark:text-brand-cream/60"
                                            )}>+{c.phoneCode}</span>
                                        </div>
                                    </div>
                                    {selectedCountry?.id === c.id && (
                                        <CheckCircle2 className="w-4 h-4 text-brand-gold shrink-0 ml-4" />
                                    )}
                                </button>
                            ))}
                        </motion.div>
                    </AnimatePresence>,
                    document.body
                )}
        </div>
    )
}
