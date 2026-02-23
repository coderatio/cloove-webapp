"use client"

import { useEffect, useRef } from "react"
import { Mail, Phone, ArrowRight } from "lucide-react"
import { motion } from "framer-motion"
import { Button } from "@/app/components/ui/button"
import { GlassCard } from "@/app/components/ui/glass-card"
import { CountrySelector } from "@/app/components/ui/country-selector"
import type { useLoginFlow } from "../hooks/useLoginFlow"

interface IdentifierStepProps {
    flow: ReturnType<typeof useLoginFlow>
}

export function IdentifierStep({ flow }: IdentifierStepProps) {
    const { state, actions } = flow
    const inputRef = useRef<HTMLInputElement>(null)

    // Load countries (uses module-level cache — no duplicate fetch on re-renders)
    useEffect(() => {
        actions.loadCountries()
    }, [actions.loadCountries]) // eslint-disable-line react-hooks/exhaustive-deps

    // Focus the identifier input when a country is selected
    const handleCountrySelect = (country: Parameters<typeof actions.setSelectedCountry>[0]) => {
        actions.setSelectedCountry(country)
        // Short timeout lets the dropdown close before focus shifts
        setTimeout(() => inputRef.current?.focus(), 50)
    }

    return (
        <motion.div
            key="identifier"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
        >
            <GlassCard allowOverflow className="p-8 border-white/10 shadow-2xl bg-white/5">
                <form onSubmit={actions.handleIdentifierSubmit} className="space-y-6">
                    <div className="space-y-3">
                        <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-gold ml-1">
                            Phone or Email
                        </label>
                        <div className="flex gap-2">
                            <CountrySelector
                                countries={state.countries}
                                selectedCountry={state.selectedCountry}
                                onSelect={handleCountrySelect}
                                disabled={state.isLoading}
                            />

                            <div className="relative group flex-1">
                                <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-brand-cream/60 group-focus-within:text-brand-gold transition-colors">
                                    {state.isEmail ? <Mail className="w-4 h-4" /> : <Phone className="w-4 h-4" />}
                                </div>
                                <input
                                    ref={inputRef}
                                    type="text"
                                    autoFocus
                                    required
                                    autoComplete="username"
                                    placeholder={state.isPhone && state.selectedCountry ? `+${state.selectedCountry.phoneCode} ...` : (state.isEmail ? "email@example.com" : "Phone or Email")}
                                    value={state.identifier}
                                    onChange={(e) => actions.setIdentifier(e.target.value)}
                                    className="w-full bg-white/10 border border-white/20 rounded-2xl py-4 pl-12 pr-4 text-brand-cream placeholder:text-white/40 outline-none focus:border-brand-gold/40 focus:bg-white/10 transition-all text-base"
                                />
                            </div>
                        </div>
                        <p className="text-[10px] text-brand-cream/60 ml-1">
                            Register via WhatsApp? Use your phone number to start.
                        </p>
                    </div>

                    <Button
                        type="submit"
                        disabled={state.isLoading || !state.identifier || (!state.isEmail && !state.isPhone)}
                        className="w-full h-14 rounded-2xl bg-brand-gold text-brand-deep font-bold text-base hover:bg-brand-gold/90 transition-all shadow-xl shadow-brand-gold/10 group"
                    >
                        {state.isLoading ? "Checking..." : "Continue"}
                        <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                    </Button>
                </form>
            </GlassCard>
        </motion.div>
    )
}
