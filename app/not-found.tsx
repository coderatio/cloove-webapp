"use client"

import Link from "next/link"
import Image from "next/image"
import { motion } from "framer-motion"
import { Compass, MapPin } from "lucide-react"
import { MagneticButton } from "@/app/components/ui/magnetic-button"
import { NoiseOverlay } from "@/app/components/ui/noise-overlay"

export default function NotFound() {
    return (
        <div className="relative min-h-screen w-full bg-brand-deep text-brand-cream overflow-hidden selection:bg-brand-gold selection:text-brand-deep">

            {/* 1. Texture Layer */}
            <NoiseOverlay />

            {/* 2. Ambient Light - Increased Opacity for less "dead" feel */}
            <div className="absolute inset-0 z-0 pointer-events-none">
                <motion.div
                    animate={{
                        opacity: [0.4, 0.6, 0.4],
                        scale: [1, 1.1, 1],
                    }}
                    transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute -top-[20%] -left-[10%] w-[70vw] h-[70vw] bg-brand-green/30 rounded-full blur-[120px] mix-blend-screen will-change-transform"
                />
                <motion.div
                    animate={{
                        opacity: [0.3, 0.5, 0.3],
                        scale: [1, 1.2, 1],
                    }}
                    transition={{ duration: 15, repeat: Infinity, ease: "easeInOut", delay: 2 }}
                    className="absolute -bottom-[20%] -right-[10%] w-[60vw] h-[60vw] bg-brand-gold/10 rounded-full blur-[100px] mix-blend-screen will-change-transform"
                />
            </div>

            {/* 3. Main Content Container */}
            <div className="relative z-10 container mx-auto px-6 h-screen flex flex-col">

                {/* Header */}
                <header className="py-8 flex justify-between items-center">
                    <Link href="/" className="flex items-center gap-3 text-sm font-bold tracking-[0.2em] uppercase opacity-70 hover:opacity-100 transition-opacity">
                        <div className="relative w-6 h-6">
                            <Image
                                src="/images/logo-white.png"
                                alt="Cloove"
                                fill
                                className="object-contain"
                            />
                        </div>
                        Cloove
                    </Link>
                    <span className="text-xs font-mono opacity-50">Error 404</span>
                </header>

                {/* Center Stage */}
                <main className="flex-1 flex flex-col justify-center items-center text-center -mt-20">

                    {/* Central Visual Anchor */}
                    <div className="relative mb-12">
                        {/* Rotating Rings */}
                        <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                            className="absolute inset-0 -m-8 border border-dashed border-brand-cream/10 rounded-full w-64 h-64 [mask-image:linear-gradient(to_bottom,transparent,black)]"
                        />

                        <div className="relative w-48 h-48 bg-brand-green/20 backdrop-blur-md rounded-full border border-brand-cream/10 flex items-center justify-center shadow-2xl ring-1 ring-brand-cream/5">
                            <Compass className="w-16 h-16 text-brand-gold opacity-80" strokeWidth={1} />

                            {/* Floating pips */}
                            <motion.div
                                animate={{ y: [-5, 5, -5] }}
                                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                                className="absolute top-8 right-8"
                            >
                                <MapPin className="w-4 h-4 text-brand-cream/40" />
                            </motion.div>
                        </div>
                    </div>

                    {/* The "404" - Outlined Style for Visibility */}
                    <div className="relative mb-8">
                        <motion.h1
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ duration: 0.8 }}
                            className="text-[8rem] md:text-[10rem] leading-[0.8] font-serif font-medium tracking-tighter text-transparent select-none relative z-10"
                            style={{
                                WebkitTextStroke: "1px rgba(253, 252, 248, 0.3)",
                            }}
                        >
                            404
                        </motion.h1>
                        {/* Glow behind */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-brand-gold/5 blur-3xl rounded-full -z-10" />
                    </div>

                    {/* Editorial Copy */}
                    <div className="max-w-lg mx-auto space-y-8">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.2, duration: 0.8 }}
                        >
                            <h2 className="text-2xl font-serif mb-4 text-brand-cream">
                                Lost in the digital void?
                            </h2>
                            <p className="text-brand-cream/70 leading-relaxed font-light text-lg">
                                The page you are looking for has drifted away.<br />
                                Let&apos;s get you back on course.
                            </p>
                        </motion.div>

                        {/* Actions */}
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4, duration: 0.8 }}
                            className="flex flex-col sm:flex-row items-center justify-center gap-6"
                        >
                            <MagneticButton className="group">
                                <Link
                                    href="/"
                                    className="inline-flex items-center justify-center px-8 py-4 bg-brand-cream text-brand-deep rounded-full font-medium transition-transform active:scale-95 shadow-[0_0_20px_rgba(253,252,248,0.1)] hover:shadow-[0_0_30px_rgba(253,252,248,0.2)]"
                                >
                                    Return Home
                                </Link>
                            </MagneticButton>
                        </motion.div>
                    </div>
                </main>

                {/* Footer - Constrained */}
                <footer className="py-8 flex flex-col md:flex-row justify-center items-center gap-6 md:gap-4 text-xs font-medium text-brand-cream/30 max-w-4xl mx-auto w-full mt-auto">
                    <div className="flex items-center gap-8">
                        <span>© {new Date().getFullYear()} Cloove AI. All rights reserved.</span>
                    </div>
                </footer>

            </div>
        </div>
    )
}
