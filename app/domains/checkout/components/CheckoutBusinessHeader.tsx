"use client"

import type { ReactNode } from "react"
import { cn } from "@/app/lib/utils"

interface Props {
  businessName: string
  businessLogo?: string | null
  title?: string
  subtitle?: string
  className?: string
  logoSize?: "sm" | "md"
  children?: ReactNode
}

export function CheckoutBusinessHeader({ businessName, businessLogo, title, subtitle, className, logoSize = "md", children }: Props) {
  const sizeClasses = logoSize === "sm" ? "w-6 h-6 rounded-lg" : "w-10 h-10 rounded-xl"

  return (
    <div className={cn("text-center space-y-1", className)}>
      <div className="flex items-center justify-center gap-3">
        {businessLogo && (
          <img
            src={businessLogo}
            alt={businessName}
            className={cn(sizeClasses, "object-cover")}
          />
        )}
        <h2 className="font-serif text-xl font-medium text-brand-deep dark:text-brand-cream">
          {title || businessName}
        </h2>
      </div>
      {subtitle && (
        <p className="text-brand-accent/50 dark:text-white/50 text-sm">{subtitle}</p>
      )}
      {children}
    </div>
  )
}
