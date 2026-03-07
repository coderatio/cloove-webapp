"use client"

import { useRef, useState } from "react"
import { motion, AnimatePresence, useReducedMotion } from "framer-motion"
import { Upload, Loader2 } from "lucide-react"
import { Input } from "@/app/components/ui/input"
import { Button } from "@/app/components/ui/button"
import { uploadService } from "@/app/lib/upload/upload-service"
import { toast } from "sonner"
import { cn } from "@/app/lib/utils"

interface ImageUrlFieldProps {
  value: string
  onChange: (url: string) => void
  placeholder?: string
  className?: string
  disabled?: boolean
}

const ACCEPT = "image/png,image/jpeg,image/webp,image/gif"
const MAX_SIZE_MB = 5

export function ImageUrlField({ value, onChange, placeholder = "https://… or upload", className, disabled }: ImageUrlFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const reduceMotion = useReducedMotion()
  const duration = reduceMotion ? 0 : 0.2

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith("image/")) {
      toast.error("Please choose an image (PNG, JPG, WEBP, GIF)")
      e.target.value = ""
      return
    }
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      toast.error(`Image must be under ${MAX_SIZE_MB}MB`)
      e.target.value = ""
      return
    }
    setUploading(true)
    try {
      const url = await uploadService.uploadFile(file)
      onChange(url)
      toast.success("Image uploaded")
    } catch {
      toast.error("Upload failed. Try a URL instead.")
    } finally {
      setUploading(false)
      e.target.value = ""
    }
  }

  return (
    <motion.div
      className={cn("relative flex gap-2 rounded-md", className)}
      animate={{
        opacity: uploading ? 0.92 : 1,
      }}
      transition={{ duration, ease: [0.16, 1, 0.3, 1] }}
    >
      <AnimatePresence mode="wait">
        {uploading && (
          <motion.div
            className="absolute inset-0 rounded-md bg-muted/40 dark:bg-muted/20 pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration }}
            aria-hidden
          />
        )}
      </AnimatePresence>
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="relative h-9 font-mono text-xs flex-1 min-w-0 bg-background"
        disabled={disabled || uploading}
      />
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        className="hidden"
        aria-hidden
        onChange={handleFile}
      />
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="relative h-9 shrink-0 gap-1.5 px-3 min-w-18"
        disabled={disabled || uploading}
        onClick={() => inputRef.current?.click()}
      >
        <AnimatePresence mode="wait">
          {uploading ? (
            <motion.span
              key="loader"
              initial={{ opacity: 0, scale: reduceMotion ? 1 : 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: reduceMotion ? 1 : 0.8 }}
              transition={{ duration: reduceMotion ? 0 : 0.15 }}
              className="flex items-center gap-1.5"
            >
              <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />
              <span>Uploading</span>
            </motion.span>
          ) : (
            <motion.span
              key="idle"
              initial={{ opacity: 0, scale: reduceMotion ? 1 : 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: reduceMotion ? 1 : 0.8 }}
              transition={{ duration: reduceMotion ? 0 : 0.15 }}
              className="flex items-center gap-1.5"
            >
              <Upload className="w-3.5 h-3.5 shrink-0" />
              <span>Upload</span>
            </motion.span>
          )}
        </AnimatePresence>
      </Button>
    </motion.div>
  )
}
