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
            className="absolute left-5 top-5 z-20 inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[10px] font-semibold uppercase tracking-widest text-white/55 hover:bg-white/[0.07] hover:text-white"
        >
            <ArrowLeft className="w-3 h-3" />
            {label}
        </button>
    )
}
