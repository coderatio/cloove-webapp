"use client"

import * as React from 'react'
import { UploadCloud, X, Loader2, Image as ImageIcon } from 'lucide-react'
import { cn } from '@/app/lib/utils'
import { toast } from 'sonner'
import { uploadService } from '@/app/lib/upload/upload-service'

interface ImageUploadProps {
    value: string[]
    onChange: (urls: string[]) => void
    disabled?: boolean
    maxFiles?: number
}

export function ImageUpload({ value = [], onChange, disabled, maxFiles = 5 }: ImageUploadProps) {
    const [isUploading, setIsUploading] = React.useState(false)
    const [progress, setProgress] = React.useState(0)
    const fileInputRef = React.useRef<HTMLInputElement>(null)

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || [])
        if (files.length === 0) return

        if (value.length + files.length > maxFiles) {
            toast.error(`You can only upload up to ${maxFiles} images`)
            return
        }

        setIsUploading(true)
        setProgress(0)

        try {
            const uploadedUrls: string[] = []

            // Simulate progress for UX
            const interval = setInterval(() => {
                setProgress(prev => Math.min(prev + 10, 90))
            }, 100)

            for (const file of files) {
                // Validate file type
                if (!file.type.startsWith('image/')) {
                    toast.error(`File "${file.name}" is not an image`)
                    continue
                }

                // Validate file size (max 5MB)
                if (file.size > 5 * 1024 * 1024) {
                    toast.error(`File "${file.name}" is too large (max 5MB)`)
                    continue
                }

                try {
                    const url = await uploadService.uploadFile(file)
                    uploadedUrls.push(url)
                } catch (error) {
                    console.error('Upload failed:', error)
                    toast.error(`Failed to upload "${file.name}"`)
                }
            }

            clearInterval(interval)
            setProgress(100)

            if (uploadedUrls.length > 0) {
                onChange([...value, ...uploadedUrls])
                toast.success(`Uploaded ${uploadedUrls.length} image${uploadedUrls.length > 1 ? 's' : ''}`)
            }
        } catch (error) {
            console.error('Upload error:', error)
            toast.error('Something went wrong during upload')
        } finally {
            setIsUploading(false)
            if (fileInputRef.current) {
                fileInputRef.current.value = ''
            }
            setTimeout(() => setProgress(0), 500)
        }
    }

    const removeImage = (indexToRemove: number) => {
        onChange(value.filter((_, index) => index !== indexToRemove))
    }

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {value.map((url, index) => (
                    <div key={index} className="relative aspect-square group rounded-xl overflow-hidden border border-brand-deep/5 dark:border-white/5 bg-brand-deep/2">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            src={url}
                            alt={`Product image ${index + 1}`}
                            className="w-full h-full object-cover"
                        />
                        <button
                            type="button"
                            onClick={() => removeImage(index)}
                            disabled={disabled}
                            className="absolute cursor-pointer top-2 right-2 p-1.5 rounded-full bg-rose-500/90 text-white sm:opacity-0 group-hover:opacity-100 transition-opacity hover:bg-rose-600 focus:opacity-100"
                        >
                            <X className="w-3.5 h-3.5" />
                        </button>
                    </div>
                ))}

                {value.length < maxFiles && (
                    <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={disabled || isUploading}
                        className={cn(
                            "relative cursor-pointer aspect-square rounded-xl border-2 border-dashed border-brand-deep/10 dark:border-white/10 flex flex-col items-center justify-center gap-2 transition-all hover:bg-brand-deep/2 hover:border-brand-deep/20 dark:hover:border-white/20",
                            isUploading && "opacity-50 cursor-not-allowed"
                        )}
                    >
                        {isUploading ? (
                            <>
                                <Loader2 className="w-6 h-6 animate-spin text-brand-accent/60" />
                                <span className="text-xs text-brand-accent/60 dark:text-brand-cream/60 font-medium">{progress}%</span>
                            </>
                        ) : (
                            <>
                                <div className="p-2.5 rounded-full bg-brand-deep/5 dark:bg-white/5 text-brand-deep/60 dark:text-brand-cream/60">
                                    <UploadCloud className="w-5 h-5" />
                                </div>
                                <div className="text-center px-2">
                                    <span className="text-xs font-medium text-brand-deep/70 dark:text-brand-cream/70">
                                        Upload
                                    </span>
                                </div>
                            </>
                        )}
                    </button>
                )}
            </div>

            <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/png, image/jpeg, image/webp, image/gif"
                onChange={handleFileSelect}
                className="hidden"
                disabled={disabled || isUploading}
            />

            {value.length === 0 && (
                <p className="text-[10px] text-brand-accent/40 dark:text-brand-cream/40 text-center sm:text-left">
                    Supports: JPG, PNG, WEBP (Max 5MB)
                </p>
            )}
        </div>
    )
}
