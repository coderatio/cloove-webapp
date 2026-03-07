"use client"

import { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Plus, X } from "lucide-react"
import { Button } from "@/app/components/ui/button"
import { CREATABLE_BLOCK_TYPES, BLOCK_META, type BlockType } from "./block-types"
import { cn } from "@/app/lib/utils"

interface AddBlockMenuProps {
  onAdd: (type: BlockType) => void
}

export function AddBlockMenu({ onAdd }: AddBlockMenuProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [open])

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
          onClick={() => setOpen(!open)}
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
            initial={{ opacity: 0, y: -8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.95 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="absolute top-10 z-30 w-80 rounded-2xl border border-brand-deep/10 dark:border-white/10 bg-white dark:bg-zinc-900 shadow-2xl p-3"
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

export function InlineAddBlockButton({ onAdd }: AddBlockMenuProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [open])

  return (
    <div ref={ref} className="relative flex items-center justify-center py-2">
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          "w-6 h-6 rounded-full border flex items-center justify-center transition-all duration-200 opacity-0 group-hover/adder:opacity-100 hover:opacity-100 focus:opacity-100",
          open
            ? "bg-brand-green/10 border-brand-green/30 dark:bg-brand-gold/10 dark:border-brand-gold/30 opacity-100"
            : "border-brand-deep/20 dark:border-white/20 hover:border-brand-green/30 dark:hover:border-brand-gold/30"
        )}
      >
        {open ? <X className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute top-8 z-30 w-72 rounded-xl border border-brand-deep/10 dark:border-white/10 bg-white dark:bg-zinc-900 shadow-xl p-2"
          >
            {CREATABLE_BLOCK_TYPES.map((type) => {
              const meta = BLOCK_META[type]
              const Icon = meta.icon
              return (
                <button
                  key={type}
                  onClick={() => { onAdd(type); setOpen(false) }}
                  className="flex items-center gap-2.5 w-full p-2 rounded-lg text-left hover:bg-brand-green/5 dark:hover:bg-brand-gold/5 transition-colors duration-200"
                >
                  <Icon className="w-4 h-4 text-brand-deep/50 dark:text-white/50 shrink-0" />
                  <span className="text-xs font-medium text-brand-deep dark:text-brand-cream">{meta.label}</span>
                </button>
              )
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
