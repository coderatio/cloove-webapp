"use client"

import { ArrowLeft } from "lucide-react"

interface LoginBackButtonProps {
    onClick: () => void
    label?: string
}

export function LoginBackButton({ onClick, label = "Back" }: LoginBackButtonProps) {
    return (
        <button
            type="button"
            onClick={onClick}
            className="absolute cursor-pointer top-6 left-6 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-brand-cream/50 hover:text-brand-gold hover:border-brand-gold/30 hover:bg-brand-gold/5 transition-all text-[10px] font-bold uppercase tracking-widest z-20"
        >
            <ArrowLeft className="w-3 h-3" />
            {label}
        </button>
    )
}
