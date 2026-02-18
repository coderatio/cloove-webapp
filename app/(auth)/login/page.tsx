"use client"

import Image from "next/image"
import { Loader2 } from "lucide-react"
import dynamic from "next/dynamic"

// 1. Background elements as stable divs to avoid framer-motion SSR mismatches
function BackgroundDecor() {
    return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
            <div className="absolute -top-1/4 -right-1/4 w-[80%] h-[80%] rounded-full bg-brand-gold/10 blur-[100px] animate-float-slow" />
            <div className="absolute -bottom-1/4 -left-1/4 w-[70%] h-[70%] rounded-full bg-brand-green/15 blur-[100px] animate-float-slower" />
        </div>
    )
}

const LoginFlowWrapper = dynamic(
    () => import("@/app/domains/auth/components/LoginFlowContainer").then(mod => mod.LoginFlowWrapper),
    {
        ssr: false,
        loading: () => (
            <div className="h-[400px] flex items-center justify-center text-brand-cream/20 bg-white/5 rounded-3xl border border-white/10">
                <Loader2 className="w-8 h-8 animate-spin" />
            </div>
        )
    }
)

export default function LoginPage() {
    return (
        <div className="min-h-dvh w-full flex flex-col items-center justify-center p-4 relative overflow-hidden bg-brand-deep">
            <BackgroundDecor />

            {/* Noise Overlay */}
            <div
                className="absolute inset-0 opacity-[0.05] pointer-events-none mix-blend-overlay z-1"
                style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}
            />

            <div className="w-full max-w-md relative z-10">
                {/* Logo Section */}
                <div className="flex flex-col items-center mb-12">
                    <div className="relative h-16 w-16 mb-4">
                        <Image
                            src="/images/logo-white.png"
                            alt="Cloove"
                            fill
                            className="object-contain"
                            priority
                        />
                    </div>
                    <h1 className="font-serif text-3xl md:text-4xl text-brand-cream font-medium tracking-tight text-center">
                        Welcome Back
                    </h1>
                    <p className="text-brand-cream/60 text-sm mt-3 tracking-wide uppercase font-bold text-center">
                        Your calm AI-powered business partner
                    </p>
                </div>

                {/* Hydration-safe content area */}
                <div className="min-h-[400px]">
                    <LoginFlowWrapper />
                </div>

                <p className="mt-12 text-center text-[10px] text-brand-cream/30 uppercase tracking-[0.3em] font-medium">
                    Cloove AI &copy; <span suppressHydrationWarning>{new Date().getFullYear()}</span>
                </p>
            </div>
        </div>
    )
}
