"use client"

import { useState, useRef, useEffect } from "react"
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
}

interface CountrySelectorProps {
    countries: CountryDetail[]
    selectedCountry: CountryDetail | null
    onSelect: (country: CountryDetail) => void
    disabled?: boolean
    className?: string
}

export function CountrySelector({
    countries,
    selectedCountry,
    onSelect,
    disabled = false,
    className
}: CountrySelectorProps) {
    const [isOpen, setIsOpen] = useState(false)
    const containerRef = useRef<HTMLDivElement>(null)

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
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
                type="button"
                disabled={disabled}
                onClick={() => setIsOpen(!isOpen)}
                className={cn(
                    "h-14 px-4 bg-white/10 border cursor-pointer border-white/20 rounded-2xl flex items-center gap-1.5 text-brand-cream hover:bg-white/20 transition-all",
                    disabled && "opacity-50 cursor-not-allowed",
                    isOpen && "border-brand-gold/40"
                )}
            >
                <span className="text-lg">
                    {selectedCountry ? getFlag(selectedCountry.code) : '🌍'}
                </span>
                <ChevronDown className={cn(
                    "w-4 h-4 text-brand-gold transition-transform",
                    isOpen && "rotate-180"
                )} />
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="absolute top-full left-0 mt-2 w-48 bg-brand-deep-500 border border-white/10 rounded-2xl overflow-hidden z-50 backdrop-blur-xl shadow-2xl"
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
                                    "w-full px-4 cursor-pointer py-3 flex items-center justify-between hover:bg-white/10 transition-colors text-left",
                                    selectedCountry?.id === c.id && "bg-white/10"
                                )}
                            >
                                <div className="flex items-center gap-3">
                                    <span className="text-lg leading-none">
                                        {getFlag(c.code)}
                                    </span>
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm text-brand-cream font-medium">{c.name}</span>
                                        <span className="text-[10px] text-brand-cream/40 font-medium">+{c.phoneCode}</span>
                                    </div>
                                </div>
                                {selectedCountry?.id === c.id && (
                                    <CheckCircle2 className="w-4 h-4 text-brand-gold shrink-0 ml-4" />
                                )}
                            </button>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
