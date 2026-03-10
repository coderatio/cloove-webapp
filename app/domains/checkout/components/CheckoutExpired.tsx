"use client"

import { AlertCircle, ShieldCheck } from "lucide-react"

interface Props {
  message?: string
}

export function CheckoutExpired({ message = "This payment link has expired or is invalid." }: Props) {
  return (
    <div className="w-full max-w-md mx-auto text-center">
      <div className="bg-white dark:bg-white/5 backdrop-blur-xl border border-brand-deep/10 dark:border-white/10 rounded-3xl p-8 space-y-4 shadow-sm dark:shadow-none">
        <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto">
          <AlertCircle className="w-8 h-8 text-red-500 dark:text-red-400" />
        </div>
        <h2 className="font-serif text-xl font-medium text-brand-deep dark:text-brand-cream">
          Link Unavailable
        </h2>
        <p className="text-brand-accent/50 dark:text-white/50 text-sm">
          {message}
        </p>
      </div>
      <div className="flex items-center justify-center gap-1.5 mt-6">
        <ShieldCheck className="w-3.5 h-3.5 text-brand-accent/30 dark:text-white/30" />
        <p className="text-brand-accent/30 dark:text-white/30 text-xs">
          Secured by Cloove
        </p>
      </div>
    </div>
  )
}
