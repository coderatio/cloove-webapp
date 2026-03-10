export default function AuthLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-dvh w-full bg-brand-deep-950 text-brand-cream overflow-x-hidden selection:bg-brand-gold/20 flex flex-col">
            {children}
        </div>
    );
}
