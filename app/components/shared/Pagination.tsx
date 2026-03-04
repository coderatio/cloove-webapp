"use client"

import * as React from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/app/components/ui/button'
import { cn } from '@/app/lib/utils'

interface PaginationProps {
    currentPage: number
    totalPages: number
    onPageChange: (page: number) => void
    isLoading?: boolean
    className?: string
}

export function Pagination({
    currentPage,
    totalPages,
    onPageChange,
    isLoading,
    className
}: PaginationProps) {
    if (totalPages <= 1) return null

    return (
        <div className={cn("flex items-center justify-between px-2 py-4", className)}>
            <p className="text-[10px] font-bold uppercase tracking-widest text-brand-deep/40 dark:text-brand-cream/40 px-1">
                Page {currentPage} of {totalPages}
            </p>
            <div className="flex items-center gap-2">
                <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage === 1 || isLoading}
                    onClick={() => onPageChange(currentPage - 1)}
                    className="h-10 w-10 p-0 rounded-xl bg-white/50 dark:bg-white/5 border-brand-deep/5 dark:border-white/10 hover:bg-brand-green/5 dark:hover:bg-brand-gold/5 transition-colors"
                >
                    <ChevronLeft className={cn("h-4 w-4", isLoading && "opacity-50")} />
                </Button>
                <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage === totalPages || isLoading}
                    onClick={() => onPageChange(currentPage + 1)}
                    className="h-10 w-10 p-0 rounded-xl bg-white/50 dark:bg-white/5 border-brand-deep/5 dark:border-white/10 hover:bg-brand-green/5 dark:hover:bg-brand-gold/5 transition-colors"
                >
                    <ChevronRight className={cn("h-4 w-4", isLoading && "opacity-50")} />
                </Button>
            </div>
        </div>
    )
}
