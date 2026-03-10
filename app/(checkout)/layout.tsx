"use client"

export default function CheckoutLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="min-h-dvh w-full bg-brand-cream dark:bg-background text-brand-deep dark:text-brand-cream overflow-x-hidden selection:bg-brand-gold/20 flex flex-col items-center justify-center p-4">
            {children}
        </div>
    );
}
