"use client"

import * as React from "react"
import { HexColorPicker } from "react-colorful"
import { cn } from "@/app/lib/utils"
import { Input } from "@/app/components/ui/input"

export interface ColorPickerProps {
  color: string
  onChange: (color: string) => void
  showHexInput?: boolean
  className?: string
}

const HEX_REGEX = /^#[0-9A-Fa-f]{6}$/

export const ColorPicker = React.forwardRef<HTMLDivElement, ColorPickerProps>(
  ({ color, onChange, showHexInput = true, className }, ref) => {
    const [hexInput, setHexInput] = React.useState(color)
    const prevColorRef = React.useRef(color)

    React.useEffect(() => {
      if (color !== prevColorRef.current) {
        prevColorRef.current = color
        setHexInput(color)
      }
    }, [color])

    const handleHexChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value
      setHexInput(value)
      if (value.startsWith("#") && value.length === 7 && HEX_REGEX.test(value)) {
        onChange(value)
      }
    }

    const handleHexBlur = () => {
      const trimmed = hexInput.trim()
      const normalized = trimmed.startsWith("#") ? trimmed : `#${trimmed}`
      if (HEX_REGEX.test(normalized)) {
        onChange(normalized)
        setHexInput(normalized)
        return
      }
      setHexInput(color)
    }

    return (
      <div ref={ref} className={cn("flex flex-col gap-3", className)}>
        <div
          className={cn(
            "rounded-xl border border-brand-deep/10 dark:border-white/10 bg-white/50 dark:bg-white/5 p-3",
            "[&_.react-colorful__saturation]:rounded-xl [&_.react-colorful__saturation]:border-0",
            "[&_.react-colorful__hue]:rounded-full [&_.react-colorful__hue]:mt-3 [&_.react-colorful__hue]:h-3",
            "[&_.react-colorful__pointer]:w-4 [&_.react-colorful__pointer]:h-4 [&_.react-colorful__pointer]:border-2 [&_.react-colorful__pointer]:border-white [&_.react-colorful__pointer]:shadow-lg"
          )}
        >
          <HexColorPicker color={color} onChange={onChange} style={{ width: "100%", height: "160px" }} />
        </div>
        {showHexInput && (
          <Input
            type="text"
            value={hexInput}
            onChange={handleHexChange}
            onBlur={handleHexBlur}
            placeholder="#000000"
            className="font-mono text-sm h-9"
            maxLength={7}
          />
        )}
      </div>
    )
  }
)
ColorPicker.displayName = "ColorPicker"
