import { useState } from "react"
import { Plus, X } from "lucide-react"
import { Button } from "@/app/components/ui/button"
import { CREATABLE_BLOCK_TYPES, BLOCK_META, type BlockType } from "./block-types"
import { Popover, PopoverContent, PopoverTrigger } from "@/app/components/ui/popover"

interface AddBlockMenuProps {
  onAdd: (type: BlockType) => void
}

export function AddBlockMenu({ onAdd }: AddBlockMenuProps) {
  const [open, setOpen] = useState(false)

  return (
    <div className="relative flex justify-center pb-8 pt-12">
      <div className="flex items-center gap-4 w-full max-w-lg">
        <div className="flex-1 h-px bg-brand-deep/10 dark:bg-white/10" />
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="group rounded-full h-10 w-10 p-0 border-brand-deep/10 dark:border-white/10 transition-all duration-300 hover:scale-105 data-[state=open]:bg-brand-green data-[state=open]:text-white data-[state=open]:border-brand-green data-[state=open]:shadow-lg"
            >
              <Plus className="w-5 h-5 transition-transform duration-300 data-[state=open]:hidden" />
              <X className="w-5 h-5 transition-transform duration-300 hidden data-[state=open]:block" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-3 rounded-3xl" side="top" sideOffset={12}>
            <div className="space-y-3">
              <p className="text-[10px] font-bold uppercase tracking-widest text-brand-accent/40 dark:text-white/40 px-2">
                Add a block
              </p>
              <div className="grid grid-cols-1 gap-1 max-h-[400px] overflow-y-auto pr-1 custom-scrollbar">
                {CREATABLE_BLOCK_TYPES.map((type) => {
                  const meta = BLOCK_META[type]
                  const Icon = meta.icon
                  return (
                    <Button
                      key={type}
                      variant="ghost"
                      onClick={() => {
                        onAdd(type)
                        setOpen(false)
                      }}
                      className="flex items-center gap-3 p-2.5 h-auto whitespace-normal rounded-xl text-left hover:bg-brand-green/5 dark:hover:bg-brand-gold/5 transition-all duration-200 group"
                    >
                      <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 bg-brand-deep/5 dark:bg-white/5 group-hover:bg-brand-green/10 dark:group-hover:bg-brand-gold/10 transition-colors duration-200">
                        <Icon className="w-4 h-4 text-brand-deep/60 dark:text-white/60 group-hover:text-brand-green dark:group-hover:text-brand-gold transition-colors duration-200" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <span className="text-[11px] font-bold text-brand-deep dark:text-brand-cream block mb-0.5">
                          {meta.label}
                        </span>
                        <span className="text-[9px] text-brand-accent/50 dark:text-white/40 leading-tight block">
                          {meta.description}
                        </span>
                      </div>
                    </Button>
                  )
                })}
              </div>
            </div>
          </PopoverContent>
        </Popover>
        <div className="flex-1 h-px bg-brand-deep/10 dark:bg-white/10" />
      </div>
    </div>
  )
}

export function InlineAddBlockButton({ onAdd }: AddBlockMenuProps) {
  const [open, setOpen] = useState(false)

  return (
    <div className="relative flex items-center justify-center h-12 my-6 group">
      <div className="absolute inset-x-0 h-px bg-brand-deep/5 dark:bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            className="group relative z-10 w-9 h-9 rounded-full bg-white dark:bg-zinc-900 shadow-md border-brand-deep/10 dark:border-white/10 opacity-0 group-hover/block:opacity-100 hover:opacity-100 transition-all duration-300 hover:scale-105 data-[state=open]:opacity-100 data-[state=open]:bg-brand-green data-[state=open]:text-white data-[state=open]:border-brand-green data-[state=open]:scale-110"
          >
            <Plus className="w-5 h-5 transition-transform duration-300 group-data-[state=open]:hidden" />
            <X className="w-5 h-5 transition-transform duration-300 hidden group-data-[state=open]:block" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-3" side="top" sideOffset={12}>
          <div className="space-y-3">
            <p className="text-[10px] font-bold uppercase tracking-widest text-brand-accent/40 dark:text-white/40 px-2">
              Insert a block
            </p>
            <div className="grid grid-cols-1 gap-1 max-h-[400px] overflow-y-auto pr-1 custom-scrollbar">
              {CREATABLE_BLOCK_TYPES.map((type) => {
                const meta = BLOCK_META[type]
                const Icon = meta.icon
                return (
                  <Button
                    key={type}
                    variant="ghost"
                    onClick={() => {
                      onAdd(type)
                      setOpen(false)
                    }}
                    className="flex items-center gap-3 p-2.5 h-auto whitespace-normal rounded-xl text-left hover:bg-brand-green/5 dark:hover:bg-brand-gold/5 transition-all duration-200 group"
                  >
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 bg-brand-deep/5 dark:bg-white/5 group-hover:bg-brand-green/10 dark:group-hover:bg-brand-gold/10 transition-colors duration-200">
                      <Icon className="w-4 h-4 text-brand-deep/60 dark:text-white/60 group-hover:text-brand-green dark:group-hover:text-brand-gold transition-colors duration-200" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="text-[11px] font-bold text-brand-deep dark:text-brand-cream block mb-0.5">
                        {meta.label}
                      </span>
                      <span className="text-[9px] text-brand-accent/50 dark:text-white/40 leading-tight block">
                        {meta.description}
                      </span>
                    </div>
                  </Button>
                )
              })}
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}
