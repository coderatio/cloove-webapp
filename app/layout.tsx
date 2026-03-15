import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ThemeProvider } from "./components/providers/theme-provider";
import QueryProvider from "./components/providers/query-provider";
import { BusinessProvider } from "./components/BusinessProvider";
import AppLayout from "./components/layout/AppLayout";
import { Toaster } from "./components/ui/sonner";
import { TooltipProvider } from "./components/ui/tooltip";
import { AuthProvider } from "./components/providers/auth-provider";
import { AuthGuard } from "./components/shared/AuthGuard";
import { RootSessionManager } from "./components/auth/RootSessionManager";
import { ReceiptPrinterProvider } from "./hooks/useReceiptPrinter";

export const metadata: Metadata = {
  title: "Cloove | Business Dashboard",
  description: "Your calm, intelligent business partner",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: "/favicon.png",
    apple: "/icons/icon-512.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Cloove",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#062c21" },
    { media: "(prefers-color-scheme: dark)", color: "#070e0b" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};


// ... existing imports

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth" suppressHydrationWarning>
      <body className="antialiased" suppressHydrationWarning>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js').catch(function(err) {
                    // Fail silently in production unless critical for debugging
                  });
                });
              }
            `,
          }}
        />
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <QueryProvider>
            <AuthProvider>
              <RootSessionManager />
              <Toaster />
              <AuthGuard>
                <TooltipProvider>
                  <BusinessProvider>
                    <ReceiptPrinterProvider>
                      {children}
                    </ReceiptPrinterProvider>
                  </BusinessProvider>
                </TooltipProvider>
              </AuthGuard>
            </AuthProvider>
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
