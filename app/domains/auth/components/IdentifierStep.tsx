"use client"

import { useRef } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { Mail01Icon as Mail, CallIcon as Phone, ArrowRight01Icon as ArrowRight } from "@hugeicons/core-free-icons"
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

    // Focus the identifier input when a country is selected
    const handleCountrySelect = (country: Parameters<typeof actions.setSelectedCountry>[0]) => {
        actions.setSelectedCountry(country)
        // Short timeout lets the dropdown close before focus shifts
        setTimeout(() => inputRef.current?.focus(), 50)
    }

    // Determine if the country selector should be visible based on the identifier input
    // We show it if the input is empty or looks like it could be a phone number
    const showCountry = !state.identifier || /^[+\d\s\-()]*$/.test(state.identifier)

    return (
            <GlassCard allowOverflow className="rounded-[28px] border-white/10 bg-white/[0.045] p-5 shadow-sm">
                <form onSubmit={actions.handleIdentifierSubmit} className="space-y-5">
                    <div className="space-y-2.5">
                        <label className="ml-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/55">
                            Phone or Email
                        </label>
                        <div className="flex gap-2">
                                {showCountry && (
                                        <CountrySelector
                                            countries={state.countries}
                                            selectedCountry={state.selectedCountry}
                                            onSelect={handleCountrySelect}
                                            disabled={state.isLoading || state.isLoadingCountries}
                                        />
                                )}

                            <div className="relative group flex-1">
                                <div className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-white/45 group-focus-within:text-white/70">
                                    {state.isEmail ? <HugeiconsIcon icon={Mail} className="w-4 h-4" /> : <HugeiconsIcon icon={Phone} className="w-4 h-4" />}
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
                                    className="h-14 w-full rounded-2xl border border-white/12 bg-white/[0.04] py-0 pl-12 pr-4 text-base text-white outline-none placeholder:text-white/35 focus:border-white/25 focus:bg-white/[0.06]"
                                />
                            </div>
                        </div>
                        <p className="ml-1 text-xs text-white/45">
                            Register via WhatsApp? Use your phone number to start.
                        </p>
                    </div>

                    <Button
                        type="submit"
                        disabled={state.isLoading || state.isLoadingCountries || state.countries.length === 0 || !state.identifier || (!state.isEmail && !state.isPhone)}
                        className="h-12 w-full rounded-2xl bg-primary text-white font-semibold hover:bg-primary/92 hover:text-white disabled:opacity-45 [&_svg]:text-white"
                    >
                        {state.isLoading ? "Checking..." : state.isLoadingCountries || state.countries.length === 0 ? "Loading..." : "Continue"}
                        <HugeiconsIcon icon={ArrowRight} className="ml-2 h-4 w-4" />
                    </Button>
                </form>
            </GlassCard>
    )
}
