"use client"

export default function EditorV01Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh flex flex-col bg-brand-cream/30 dark:bg-zinc-950">
      {children}
    </div>
  )
}
