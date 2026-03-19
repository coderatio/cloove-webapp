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
import { InstallBanner } from "./components/shared/pwa/InstallBanner";

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
    statusBarStyle: "black-translucent",
    title: "Cloove",
    startupImage: [
      {
        url: "/icons/icon-512.png",
        media: "(device-width: 320px) and (device-height: 568px) and (-webkit-device-pixel-ratio: 2)",
      },
      {
        url: "/icons/icon-512.png",
        media: "(device-width: 375px) and (device-height: 667px) and (-webkit-device-pixel-ratio: 2)",
      },
      {
        url: "/icons/icon-512.png",
        media: "(device-width: 414px) and (device-height: 736px) and (-webkit-device-pixel-ratio: 3)",
      },
      {
        url: "/icons/icon-512.png",
        media: "(device-width: 375px) and (device-height: 812px) and (-webkit-device-pixel-ratio: 3)",
      },
      {
        url: "/icons/icon-512.png",
        media: "(device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 2)",
      },
      {
        url: "/icons/icon-512.png",
        media: "(device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 3)",
      },
    ],
  },
  formatDetection: {
    telephone: false,
  },
  other: {
    "mobile-web-app-capable": "yes",
    "apple-mobile-web-app-capable": "yes",
    "apple-mobile-web-app-status-bar-style": "black-translucent",
  }
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fdfcf8" },
    { media: "(prefers-color-scheme: dark)", color: "#062c21" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth" data-scroll-behavior="smooth" suppressHydrationWarning>
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
                      <InstallBanner />
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
