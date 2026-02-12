"use client"

import { CheckCircle2 } from "lucide-react"
import { motion } from "framer-motion"

export function SuccessStep() {
    return (
        <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center"
        >
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-brand-green/20 text-brand-green mb-6 border border-brand-green/20 relative">
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", damping: 12, stiffness: 200, delay: 0.2 }}
                >
                    <CheckCircle2 className="w-10 h-10" />
                </motion.div>
                <motion.div
                    animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="absolute inset-0 rounded-full border border-brand-green"
                />
            </div>
            <h2 className="font-serif text-3xl text-brand-cream mb-2">Welcome Home</h2>
            <p className="text-brand-cream/60 text-sm mb-8">Accessing your business dashboard...</p>
            <motion.div
                initial={{ width: 0 }}
                animate={{ width: "100%" }}
                transition={{ duration: 1.5 }}
                className="h-1 bg-brand-gold rounded-full max-w-[200px] mx-auto opacity-50"
                onAnimationComplete={() => window.location.href = '/'}
            />
        </motion.div>
    )
}
