"use client"

import { useState, useRef } from "react"
import { Upload, FileText, X, CheckCircle2, Loader2 } from "lucide-react"
import { Button } from "@/app/components/ui/button"
import { cn } from "@/app/lib/utils"

interface DocumentUploadProps {
    onFileSelect: (file: File | null) => void
    label: string
    description?: string
    accept?: string
    isPending?: boolean
}

export function DocumentUpload({
    onFileSelect,
    label,
    description,
    accept = "image/*,application/pdf",
    isPending = false
}: DocumentUploadProps) {
    const [file, setFile] = useState<File | null>(null)
    const [preview, setPreview] = useState<string | null>(null)
    const [isDragging, setIsDragging] = useState(false)
    const inputRef = useRef<HTMLInputElement>(null)

    const handleFile = (selectedFile: File) => {
        setFile(selectedFile)
        onFileSelect(selectedFile)

        if (selectedFile.type.startsWith("image/")) {
            const reader = new FileReader()
            reader.onload = (e) => setPreview(e.target?.result as string)
            reader.readAsDataURL(selectedFile)
        } else {
            setPreview(null)
        }
    }

    const onDrop = (e: React.DragEvent) => {
        e.preventDefault()
        setIsDragging(false)
        if (e.dataTransfer.files?.[0]) {
            handleFile(e.dataTransfer.files[0])
        }
    }

    const removeFile = (e: React.MouseEvent) => {
        e.stopPropagation()
        setFile(null)
        setPreview(null)
        onFileSelect(null)
        if (inputRef.current) inputRef.current.value = ""
    }

    return (
        <div className="space-y-4">
            <div
                onClick={() => !isPending && inputRef.current?.click()}
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={onDrop}
                className={cn(
                    "relative group cursor-pointer overflow-hidden rounded-[24px] border-2 border-dashed transition-all duration-500",
                    isDragging
                        ? "border-brand-gold bg-brand-gold/5 scale-[0.99]"
                        : "border-brand-gold/20 hover:border-brand-gold/40 bg-white/50 dark:bg-white/5",
                    file && "border-solid border-emerald-500/30 bg-emerald-500/5",
                    isPending && "pointer-events-none opacity-60"
                )}
            >
                <input
                    ref={inputRef}
                    type="file"
                    className="hidden"
                    accept={accept}
                    onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
                />

                <div className="p-8 md:p-12 flex flex-col items-center text-center space-y-4">
                    {file ? (
                        <div className="space-y-4 w-full">
                            <div className="relative mx-auto w-24 h-24 md:w-32 md:h-32">
                                {preview ? (
                                    <img
                                        src={preview}
                                        alt="Preview"
                                        className="w-full h-full object-cover rounded-2xl shadow-2xl"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-brand-deep/5 dark:bg-white/10 rounded-2xl">
                                        <FileText className="w-10 h-10 text-brand-gold" />
                                    </div>
                                )}
                                <button
                                    onClick={removeFile}
                                    className="absolute -top-2 -right-2 p-1.5 bg-rose-500 text-white rounded-full shadow-lg hover:bg-rose-600 transition-colors"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                            <div className="space-y-1">
                                <p className="text-sm font-medium text-brand-deep dark:text-brand-cream truncate max-w-xs mx-auto">
                                    {file.name}
                                </p>
                                <p className="text-xs text-brand-deep/40 dark:text-brand-cream/40 capitalize">
                                    {(file.size / (1024 * 1024)).toFixed(2)} MB • {file.type.split('/')[1]}
                                </p>
                            </div>
                            <div className="flex items-center justify-center gap-2 text-emerald-600 dark:text-emerald-400 font-medium text-xs">
                                <CheckCircle2 className="w-4 h-4" />
                                Document Ready
                            </div>
                        </div>
                    ) : (
                        <>
                            <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-brand-gold/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
                                <Upload className="w-8 h-8 text-brand-gold" />
                            </div>
                            <div className="space-y-1">
                                <h4 className="text-lg font-serif text-brand-deep dark:text-brand-cream">{label}</h4>
                                <p className="text-sm text-brand-deep/60 dark:text-brand-cream/60 max-w-[240px]">
                                    {description || "Drag and drop or click to upload your document"}
                                </p>
                            </div>
                            <div className="pt-2">
                                <span className="px-4 py-1.5 rounded-full bg-brand-deep/5 dark:bg-white/10 text-[10px] font-bold uppercase tracking-widest text-brand-gold/60">
                                    JPG, PNG or PDF • Max 5MB
                                </span>
                            </div>
                        </>
                    )}
                </div>

                {isPending && (
                    <div className="absolute inset-0 bg-brand-cream/80 dark:bg-brand-deep/80 backdrop-blur-[2px] flex items-center justify-center z-10 transition-all duration-500">
                        <div className="flex flex-col items-center gap-3">
                            <Loader2 className="w-10 h-10 animate-spin text-brand-gold" />
                            <span className="text-xs font-bold uppercase tracking-widest text-brand-gold animate-pulse">Encrypting & Uploading...</span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
