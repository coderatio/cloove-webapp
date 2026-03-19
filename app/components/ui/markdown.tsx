"use client"

import { cn } from "@/app/lib/utils"
import { Streamdown } from "streamdown"

interface MarkdownProps {
    content: string
    className?: string
    streaming?: boolean
}

export function Markdown({ content, className, streaming = false }: MarkdownProps) {
    return (
        <div className={cn("prose prose-sm dark:prose-invert max-w-none transition-colors", className)}>
            <Streamdown
                mode={streaming ? "streaming" : "static"}
                isAnimating={streaming}
                caret={streaming ? "circle" : undefined}
            >
                {content}
            </Streamdown>
        </div>
    )
}
