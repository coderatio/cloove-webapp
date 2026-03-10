"use client"

import { useState } from "react"
import { Copy, Share2, Check, Link2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/app/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/app/components/ui/dialog"

interface Props {
  isOpen: boolean
  onClose: () => void
  link: string | null
  isLoading?: boolean
}

export function PaymentLinkDialog({ isOpen, onClose, link, isLoading }: Props) {
  const [copied, setCopied] = useState(false)

  const copyLink = () => {
    if (!link) return
    navigator.clipboard.writeText(link)
    setCopied(true)
    toast.success("Payment link copied")
    setTimeout(() => setCopied(false), 2000)
  }

  const shareLink = async () => {
    if (!link) return
    if (navigator.share) {
      try {
        await navigator.share({ title: 'Payment Link', url: link })
      } catch {
        // User cancelled share
      }
    } else {
      copyLink()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-sm rounded-3xl! p-6 gap-4">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-gold/10 flex items-center justify-center">
              <Link2 className="w-5 h-5 text-brand-gold" />
            </div>
            <div>
              <DialogTitle className="font-serif text-lg text-brand-deep dark:text-brand-cream">
                Payment Link
              </DialogTitle>
              <DialogDescription className="sr-only">
                Copy or share this payment link
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {isLoading ? (
          <div className="h-12 bg-brand-deep/5 dark:bg-white/5 rounded-2xl animate-pulse" />
        ) : link ? (
          <>
            <div className="bg-brand-deep/5 dark:bg-white/5 border border-brand-deep/5 dark:border-white/10 rounded-2xl p-3 break-all text-sm text-brand-deep/70 dark:text-white/70 font-mono">
              {link}
            </div>
            <div className="flex gap-3">
              <Button
                onClick={copyLink}
                className="flex-1 h-12 rounded-2xl bg-brand-deep text-brand-gold dark:bg-brand-gold dark:text-brand-deep hover:bg-brand-deep/90 dark:hover:bg-brand-gold/90 font-semibold gap-2"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copied ? "Copied" : "Copy"}
              </Button>
              <Button
                variant="outline"
                onClick={shareLink}
                className="flex-1 h-12 rounded-2xl font-semibold gap-2"
              >
                <Share2 className="w-4 h-4" />
                Share
              </Button>
            </div>
          </>
        ) : (
          <p className="text-brand-deep/50 dark:text-white/50 text-sm">Failed to generate link.</p>
        )}
      </DialogContent>
    </Dialog>
  )
}
