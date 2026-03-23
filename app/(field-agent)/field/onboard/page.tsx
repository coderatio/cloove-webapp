import { BusinessOnboardingForm } from "@/app/components/field-agent/BusinessOnboardingForm"
import { Sparkles } from "lucide-react"

export const metadata = {
    title: "Onboard Merchant | Cloove Agents",
    description: "Onboard new businesses and earn commissions.",
}

export default function OnboardPage() {
    return (
        <div className="space-y-12 pb-24 max-w-4xl mx-auto px-4">
            <header className="text-center space-y-4 pt-4 md:pt-10">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-gold/10 border border-brand-gold/20 text-brand-gold">
                    <Sparkles className="w-3 h-3" />
                    <span className="text-[10px] font-black uppercase tracking-[0.2em]">Growth Protocol</span>
                </div>
                <h1 className="text-4xl md:text-6xl font-serif font-medium tracking-tight text-brand-deep leading-[1.1]">Expand the Ecosystem</h1>
                <p className="max-w-xl mx-auto text-sm md:text-base text-brand-deep/50 dark:text-brand-cream/60 font-medium italic">
                    Onboarding a merchant is the catalyst for building a sustainable revenue stream. 
                    Ensure precision to accelerate the verification cycle.
                </p>
            </header>
            
            <main className="relative">
                {/* Subtle depth elements */}
                <div className="absolute -top-20 -left-20 w-64 h-64 bg-brand-gold/5 blur-[100px] rounded-full" />
                <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-brand-deep/5 blur-[100px] rounded-full" />
                
                <BusinessOnboardingForm />
            </main>
        </div>
    )
}
