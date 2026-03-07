"use client"

import { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Plus, X } from "lucide-react"
import { Button } from "@/app/components/ui/button"
import { CREATABLE_BLOCK_TYPES, BLOCK_META, type BlockType } from "./block-types"
import { cn } from "@/app/lib/utils"

const MENU_HEIGHT_ESTIMATE = 340

interface AddBlockMenuProps {
  onAdd: (type: BlockType) => void
}

export function AddBlockMenu({ onAdd }: AddBlockMenuProps) {
  const [open, setOpen] = useState(false)
  const [openAbove, setOpenAbove] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [open])

  const handleToggle = () => {
    if (!open && ref.current) {
      const rect = ref.current.getBoundingClientRect()
      const spaceBelow = typeof window !== "undefined" ? window.innerHeight - rect.bottom : MENU_HEIGHT_ESTIMATE
      setOpenAbove(spaceBelow < MENU_HEIGHT_ESTIMATE)
    }
    setOpen((prev) => !prev)
  }

  const handleAdd = (type: BlockType) => {
    onAdd(type)
    setOpen(false)
  }

  return (
    <div ref={ref} className="relative flex justify-center">
      <div className="flex items-center gap-3 w-full">
        <div className="flex-1 h-px bg-brand-deep/10 dark:bg-white/10" />
        <Button
          variant="outline"
          size="sm"
          onClick={handleToggle}
          className={cn(
            "rounded-full h-8 w-8 p-0 border-brand-deep/10 dark:border-white/10 transition-all duration-300",
            open && "bg-brand-green/10 border-brand-green/20 dark:bg-brand-gold/10 dark:border-brand-gold/20"
          )}
        >
          {open ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
        </Button>
        <div className="flex-1 h-px bg-brand-deep/10 dark:bg-white/10" />
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: openAbove ? 8 : -8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: openAbove ? 8 : -8, scale: 0.95 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className={cn(
              "absolute z-30 w-80 rounded-2xl border border-brand-deep/10 dark:border-white/10 bg-white dark:bg-zinc-900 shadow-2xl p-3",
              openAbove ? "bottom-10" : "top-10"
            )}
          >
            <p className="text-[10px] font-bold uppercase tracking-widest text-brand-accent/40 dark:text-white/40 px-2 mb-2">
              Add a block
            </p>
            <div className="grid grid-cols-2 gap-1.5">
              {CREATABLE_BLOCK_TYPES.map((type) => {
                const meta = BLOCK_META[type]
                const Icon = meta.icon
                return (
                  <button
                    key={type}
                    onClick={() => handleAdd(type)}
                    className="flex items-start gap-2.5 p-2.5 rounded-xl text-left hover:bg-brand-green/5 dark:hover:bg-brand-gold/5 transition-all duration-200 group"
                  >
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 bg-brand-deep/5 dark:bg-white/5 group-hover:bg-brand-green/10 dark:group-hover:bg-brand-gold/10 transition-colors duration-200">
                      <Icon className="w-4 h-4 text-brand-deep/60 dark:text-white/60 group-hover:text-brand-green dark:group-hover:text-brand-gold transition-colors duration-200" />
                    </div>
                    <div className="min-w-0">
                      <span className="text-xs font-semibold text-brand-deep dark:text-brand-cream block">
                        {meta.label}
                      </span>
                      <span className="text-[10px] text-brand-accent/50 dark:text-white/40 leading-tight block">
                        {meta.description}
                      </span>
                    </div>
                  </button>
                )
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

const INLINE_MENU_HEIGHT_ESTIMATE = 280

export function InlineAddBlockButton({ onAdd }: AddBlockMenuProps) {
  const [open, setOpen] = useState(false)
  const [openAbove, setOpenAbove] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [open])

  const handleToggle = () => {
    if (!open && ref.current && typeof window !== "undefined") {
      const rect = ref.current.getBoundingClientRect()
      const spaceBelow = window.innerHeight - rect.bottom
      setOpenAbove(spaceBelow < INLINE_MENU_HEIGHT_ESTIMATE)
    }
    setOpen((prev) => !prev)
  }

  return (
    <div ref={ref} className="relative flex items-center justify-center h-6 my-2">
      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
        <Button
          variant="outline"
          size="icon"
          onClick={handleToggle}
          className={cn(
            "relative z-10 w-9 h-9 rounded-full bg-white hover:bg-white dark:bg-brand-deep-950 hover:dark:bg-brand-deep-950 shadow-md border-brand-deep/20 dark:border-white/20 transition-all duration-300",
            open && "bg-brand-green/10 border-brand-green/40 dark:bg-brand-gold/10 dark:border-brand-gold/40 rotate-45"
          )}
        >
          <Plus className="w-5 h-5 text-brand-deep/80 dark:text-brand-cream" />
        </Button>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: openAbove ? 8 : -8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: openAbove ? 8 : -8, scale: 0.95 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className={cn(
              "absolute z-30 w-80 rounded-2xl border border-brand-deep/10 dark:border-white/10 bg-white dark:bg-zinc-900 shadow-2xl p-3",
              openAbove ? "bottom-10" : "top-10"
            )}
          >
            <p className="text-[10px] font-bold uppercase tracking-widest text-brand-accent/40 dark:text-white/40 px-2 mb-2">
              Insert a block
            </p>
            <div className="grid grid-cols-2 gap-1.5">
              {CREATABLE_BLOCK_TYPES.map((type) => {
                const meta = BLOCK_META[type]
                const Icon = meta.icon
                return (
                  <button
                    key={type}
                    onClick={() => { onAdd(type); setOpen(false) }}
                    className="flex items-start gap-2.5 p-2.5 rounded-xl text-left hover:bg-brand-green/5 dark:hover:bg-brand-gold/5 transition-all duration-200 group/item"
                  >
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 bg-brand-deep/5 dark:bg-white/5 group-hover/item:bg-brand-green/10 dark:group-hover/item:bg-brand-gold/10 transition-colors duration-200">
                      <Icon className="w-4 h-4 text-brand-deep/60 dark:text-white/60 group-hover/item:text-brand-green dark:group-hover/item:text-brand-gold transition-colors duration-200" />
                    </div>
                    <div className="min-w-0">
                      <span className="text-xs font-semibold text-brand-deep dark:text-brand-cream block">
                        {meta.label}
                      </span>
                      <span className="text-[10px] text-brand-accent/50 dark:text-white/40 leading-tight block truncate">
                        {meta.description}
                      </span>
                    </div>
                  </button>
                )
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
