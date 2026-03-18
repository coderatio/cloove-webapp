"use client"

import { useEffect } from "react"
import { useEditor, EditorContent } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import Placeholder from "@tiptap/extension-placeholder"
import { cn } from "@/app/lib/utils"

interface DocumentEditorProps {
    content: string
    onChange: (html: string) => void
    readOnly?: boolean
    placeholder?: string
    className?: string
}

export function DocumentEditor({
    content,
    onChange,
    readOnly = false,
    placeholder = "Start writing...",
    className,
}: DocumentEditorProps) {
    const editor = useEditor({
        extensions: [
            StarterKit,
            Placeholder.configure({ placeholder }),
        ],
        content,
        editable: !readOnly,
        onUpdate: ({ editor }) => {
            onChange(editor.getHTML())
        },
        editorProps: {
            attributes: {
                class: "outline-none min-h-[200px] prose prose-sm max-w-none dark:prose-invert prose-headings:font-serif prose-headings:text-brand-deep dark:prose-headings:text-brand-cream prose-p:text-brand-deep/80 dark:prose-p:text-brand-cream/80 prose-strong:text-brand-deep dark:prose-strong:text-brand-cream prose-ul:text-brand-deep/80 dark:prose-ul:text-brand-cream/80 prose-ol:text-brand-deep/80 dark:prose-ol:text-brand-cream/80",
            },
        },
    })

    // Update editability when readOnly changes
    useEffect(() => {
        if (editor) {
            editor.setEditable(!readOnly)
        }
    }, [editor, readOnly])

    // Update content when it changes from outside (e.g., initial load after streaming ends)
    useEffect(() => {
        if (editor && content && editor.getHTML() !== content) {
            editor.commands.setContent(content)
        }
    // Only run when content changes from outside, not on every keystroke
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [editor, content])

    return (
        <div
            className={cn(
                "rounded-xl border border-brand-deep/10 dark:border-white/10 bg-white/50 dark:bg-black/20 px-4 py-3 text-sm",
                !readOnly && "focus-within:border-brand-green/30 focus-within:ring-1 focus-within:ring-brand-green/20 transition-all duration-200",
                readOnly && "opacity-80",
                className
            )}
        >
            <EditorContent editor={editor} />
        </div>
    )
}
