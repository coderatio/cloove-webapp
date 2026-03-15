"use client"

import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { cn } from "@/app/lib/utils"

interface MarkdownProps {
    content: string
    className?: string
}

export function Markdown({ content, className }: MarkdownProps) {
    return (
        <div className={cn("prose prose-sm dark:prose-invert max-w-none transition-colors", className)}>
            <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                    p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                    strong: ({ children }) => (
                        <span className="text-brand-green dark:text-brand-gold font-bold">
                            {children}
                        </span>
                    ),
                    h1: ({ children }) => (
                        <h1 className="text-lg font-serif font-bold mb-3 mt-4 first:mt-0 text-brand-deep dark:text-brand-cream">{children}</h1>
                    ),
                    h2: ({ children }) => (
                        <h2 className="text-base font-serif font-bold mb-2 mt-3 first:mt-0 text-brand-deep dark:text-brand-cream">{children}</h2>
                    ),
                    h3: ({ children }) => (
                        <h3 className="text-sm font-serif font-bold mb-2 mt-3 first:mt-0 text-brand-deep dark:text-brand-cream">{children}</h3>
                    ),
                    ul: ({ children }) => <ul className="list-disc pl-5 mb-2 space-y-1">{children}</ul>,
                    ol: ({ children }) => <ol className="list-decimal pl-5 mb-2 space-y-1">{children}</ol>,
                    li: ({ children }) => <li className="text-sm leading-relaxed">{children}</li>,
                    table: ({ children }) => (
                        <div className="mt-2 mb-3 overflow-x-auto rounded-xl border border-brand-accent/10 dark:border-white/10">
                            <table className="w-full text-left text-xs">{children}</table>
                        </div>
                    ),
                    thead: ({ children }) => (
                        <thead className="bg-brand-accent/5 dark:bg-white/5">{children}</thead>
                    ),
                    th: ({ children }) => (
                        <th className="p-2.5 text-brand-deep/50 dark:text-brand-cream/50 font-bold uppercase tracking-wider text-[11px]">{children}</th>
                    ),
                    td: ({ children }) => (
                        <td className="p-2.5 text-brand-deep dark:text-brand-cream border-t border-brand-accent/5 dark:border-white/5">{children}</td>
                    ),
                    code: ({ children, className: codeClassName }) => {
                        const isBlock = codeClassName?.startsWith("language-")
                        if (isBlock) {
                            return (
                                <code className={cn("block bg-brand-deep/5 dark:bg-white/5 rounded-lg p-3 text-xs overflow-x-auto", codeClassName)}>
                                    {children}
                                </code>
                            )
                        }
                        return (
                            <code className="bg-brand-deep/10 dark:bg-white/10 rounded px-1.5 py-0.5 text-xs font-mono">
                                {children}
                            </code>
                        )
                    },
                    pre: ({ children }) => <pre className="mb-2 last:mb-0">{children}</pre>,
                    blockquote: ({ children }) => (
                        <blockquote className="border-l-2 border-brand-gold/40 pl-3 italic text-brand-deep/70 dark:text-brand-cream/70 mb-2">
                            {children}
                        </blockquote>
                    ),
                    hr: () => <hr className="border-brand-accent/10 dark:border-white/10 my-3" />,
                    a: ({ children, href }) => (
                        <a href={href} target="_blank" rel="noreferrer" className="text-brand-green dark:text-brand-gold underline underline-offset-2">
                            {children}
                        </a>
                    ),
                }}
            >
                {content}
            </ReactMarkdown>
        </div>
    )
}
