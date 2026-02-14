"use client"

import * as React from 'react'
import { UploadCloud, FileText } from 'lucide-react'
import { cn } from '@/app/lib/utils'
import { toast } from 'sonner'

interface FileDropZoneProps {
    onFileSelect: (file: File) => void
    accept?: string[]
    maxSizeMB?: number
    disabled?: boolean
    title?: string
    description?: string
}

export function FileDropZone({
    onFileSelect,
    accept = ['.pdf', '.csv', '.xlsx', '.xls'],
    maxSizeMB = 10,
    disabled = false,
    title = "Upload Document",
    description = "Drag and drop your file here, or click to browse"
}: FileDropZoneProps) {
    const [isDragging, setIsDragging] = React.useState(false)
    const fileInputRef = React.useRef<HTMLInputElement>(null)

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault()
        if (!disabled) setIsDragging(true)
    }

    const handleDragLeave = () => {
        setIsDragging(false)
    }

    const validateAndProcess = (file: File) => {
        const ext = `.${file.name.split('.').pop()?.toLowerCase()}`
        if (!accept.includes(ext)) {
            toast.error(`Unsupported file type. Please upload ${accept.join(', ')}`)
            return
        }

        if (file.size > maxSizeMB * 1024 * 1024) {
            toast.error(`File is too large. Maximum size is ${maxSizeMB}MB`)
            return
        }

        onFileSelect(file)
    }

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault()
        setIsDragging(false)
        if (disabled) return

        const file = e.dataTransfer.files[0]
        if (file) validateAndProcess(file)
    }

    const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) validateAndProcess(file)
        if (fileInputRef.current) fileInputRef.current.value = ''
    }

    return (
        <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => !disabled && fileInputRef.current?.click()}
            className={cn(
                "relative group cursor-pointer rounded-[32px] border-2 border-dashed transition-all duration-500 overflow-hidden",
                "flex flex-col items-center justify-center p-12 text-center",
                isDragging
                    ? "border-brand-gold bg-brand-gold/5 scale-[0.99] ring-8 ring-brand-gold/5"
                    : "border-brand-deep/10 dark:border-white/10 hover:border-brand-deep-400/40 hover:bg-brand-deep-400/5",
                disabled && "opacity-50 cursor-not-allowed grayscale"
            )}
        >
            {/* Ambient Background Glow */}
            <div className={cn(
                "absolute inset-0 pointer-events-none transition-opacity duration-1000",
                isDragging ? "opacity-100" : "opacity-0"
            )}>
                <div className="absolute top-0 right-0 w-32 h-32 bg-brand-gold/10 blur-2xl rounded-full" />
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-brand-green/10 blur-2xl rounded-full" />
            </div>

            <div className="relative z-10 space-y-4">
                <div className={cn(
                    "mx-auto w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-500",
                    isDragging
                        ? "bg-brand-gold text-brand-deep scale-110 rotate-3"
                        : "bg-brand-deep/5 dark:bg-white/5 text-brand-deep/60 dark:text-brand-cream/60 group-hover:scale-110 group-hover:-rotate-3"
                )}>
                    {isDragging ? <UploadCloud className="w-8 h-8" /> : <FileText className="w-8 h-8" />}
                </div>

                <div className="space-y-1">
                    <p className="font-serif text-xl font-medium text-brand-deep dark:text-brand-cream leading-tight">
                        {title}
                    </p>
                    <p className="text-sm text-brand-accent/40 dark:text-brand-cream/40 max-w-[240px] mx-auto">
                        {description}
                    </p>
                </div>

                <div className="pt-2 flex items-center justify-center gap-2">
                    {['.pdf', '.csv', '.xlsx'].map(ext => (
                        <span key={ext} className="px-2 py-1 rounded-md bg-brand-deep/5 dark:bg-white/5 text-[10px] font-bold uppercase tracking-widest text-brand-accent/40 dark:text-brand-cream/40 border border-brand-deep/5 dark:border-white/5">
                            {ext.replace('.', '')}
                        </span>
                    ))}
                </div>
            </div>

            <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept={accept.join(',')}
                onChange={handleFileInput}
                disabled={disabled}
            />
        </div>
    )
}
