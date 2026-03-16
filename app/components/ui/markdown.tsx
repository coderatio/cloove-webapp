"use client"

import { useState, useEffect, useRef, useMemo } from "react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { cn } from "@/app/lib/utils"

interface MarkdownProps {
    content: string
    className?: string
    /** When true, throttle re-parses to ~12 fps to avoid blocking the main thread. */
    streaming?: boolean
}

const THROTTLE_MS = 80

const mdComponents = {
    p: ({ children }: any) => <p className="mb-2 last:mb-0">{children}</p>,
    strong: ({ children }: any) => (
        <span className="text-inherit font-bold">
            {children}
        </span>
    ),
    h1: ({ children }: any) => (
        <h1 className="text-lg font-serif font-bold mb-3 mt-4 first:mt-0">{children}</h1>
    ),
    h2: ({ children }: any) => (
        <h2 className="text-base font-serif font-bold mb-2 mt-3 first:mt-0">{children}</h2>
    ),
    h3: ({ children }: any) => (
        <h3 className="text-sm font-serif font-bold mb-2 mt-3 first:mt-0">{children}</h3>
    ),
    ul: ({ children }: any) => <ul className="list-disc pl-5 mb-2 space-y-1">{children}</ul>,
    ol: ({ children }: any) => <ol className="list-decimal pl-5 mb-2 space-y-1">{children}</ol>,
    li: ({ children }: any) => <li className="text-sm leading-relaxed">{children}</li>,
    table: ({ children }: any) => (
        <div className="mt-2 mb-3 overflow-x-auto rounded-xl border border-current/6">
            <table className="w-full text-left text-xs">{children}</table>
        </div>
    ),
    thead: ({ children }: any) => (
        <thead className="bg-current/5">{children}</thead>
    ),
    th: ({ children }: any) => (
        <th className="p-2.5 opacity-60 font-bold uppercase tracking-wider text-[11px]">{children}</th>
    ),
    td: ({ children }: any) => (
        <td className="p-2.5 border-t border-current/6">{children}</td>
    ),
    code: ({ children, className: codeClassName }: any) => {
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
    pre: ({ children }: any) => <pre className="mb-2 last:mb-0">{children}</pre>,
    blockquote: ({ children }: any) => (
        <blockquote className="border-l-2 border-brand-gold/40 pl-3 italic text-brand-deep/70 dark:text-brand-cream/70 mb-2">
            {children}
        </blockquote>
    ),
    hr: () => <hr className="border-brand-accent/10 dark:border-white/10 my-3" />,
    a: ({ children, href }: any) => (
        <a href={href} target="_blank" rel="noreferrer" className="text-inherit underline underline-offset-2 opacity-80 hover:opacity-100 transition-opacity">
            {children}
        </a>
    ),
}

const remarkPlugins = [remarkGfm]

export function Markdown({ content, className, streaming = false }: MarkdownProps) {
    // During streaming, throttle content updates so react-markdown re-parses at
    // ~12 fps instead of on every text-delta chunk (~200+ times).
    const [throttled, setThrottled] = useState(content)
    const latest = useRef(content)
    latest.current = content

    useEffect(() => {
        if (!streaming) return
        const id = setInterval(() => setThrottled(latest.current), THROTTLE_MS)
        return () => clearInterval(id)
    }, [streaming])

    // When not streaming, always show the real content immediately
    const displayContent = streaming ? throttled : content

    const rendered = useMemo(
        () => (
            <ReactMarkdown remarkPlugins={remarkPlugins} components={mdComponents}>
                {displayContent}
            </ReactMarkdown>
        ),
        [displayContent]
    )

    return (
        <div className={cn("prose prose-sm dark:prose-invert max-w-none transition-colors", className)}>
            {rendered}
        </div>
    )
}
