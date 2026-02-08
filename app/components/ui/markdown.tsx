"use client"

import ReactMarkdown from "react-markdown"
import { cn } from "@/app/lib/utils"

interface MarkdownProps {
    content: string
    className?: string
}

export function Markdown({ content, className }: MarkdownProps) {
    return (
        <div className={cn("prose prose-sm dark:prose-invert max-w-none transition-all", className)}>
            <ReactMarkdown
                components={{
                    p: ({ children }) => <span className="inline m-0">{children}</span>,
                    strong: ({ children }) => (
                        <span className="text-brand-green dark:text-brand-gold font-bold">
                            {children}
                        </span>
                    ),
                }}
            >
                {content}
            </ReactMarkdown>
        </div>
    )
}
