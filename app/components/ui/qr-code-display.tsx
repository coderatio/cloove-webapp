"use client"

import * as React from "react"
import { QRCodeSVG } from "qrcode.react"
import { cn } from "@/app/lib/utils"
import { GlassCard } from "@/app/components/ui/glass-card"

export interface QRCodeDisplayProps {
  value: string
  size?: number
  level?: "L" | "M" | "Q" | "H"
  className?: string
  /** Wraps in GlassCard with padding when true */
  withCard?: boolean
}

export function QRCodeDisplay({
  value,
  size = 256,
  level = "M",
  className,
  withCard = false,
}: QRCodeDisplayProps) {
  const svg = (
    <QRCodeSVG
      value={value}
      size={size}
      level={level}
      className={cn("rounded-xl", className)}
      includeMargin={false}
    />
  )

  if (withCard) {
    return (
      <GlassCard className="inline-flex p-6 items-center justify-center bg-white/60 dark:bg-white/5">
        {svg}
      </GlassCard>
    )
  }

  return svg
}
