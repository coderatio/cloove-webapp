import type { Metadata, Viewport } from "next";
import { DM_Serif_Display, DM_Sans, DM_Mono } from "next/font/google";
import "./globals.css";

const dmSerifDisplay = DM_Serif_Display({
  weight: "400",
  style: ["normal", "italic"],
  variable: "--font-dm-serif-display",
  preload: false, // load all unicode ranges (currency symbols, etc.)
});

const dmSans = DM_Sans({
  weight: ["400", "500", "600", "700", "800", "900"],
  variable: "--font-dm-sans",
  preload: false,
});

const dmMono = DM_Mono({
  weight: ["300", "400", "500"],
  variable: "--font-dm-mono",
  preload: false,
});
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
  }
};

export const viewport: Viewport = {
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
    <html lang="en" className={`scroll-smooth ${dmSerifDisplay.variable} ${dmSans.variable} ${dmMono.variable}`} data-scroll-behavior="smooth" suppressHydrationWarning>
      <body className="antialiased" suppressHydrationWarning>
        {/* ── Early Theme Sync (Prevents white flash/bar on forced-dark public routes) ── */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  const DARK_COLOR = "#061b15";
                  const LIGHT_COLOR = "#fdfcf8";
                  const PUBLIC_PATTERN = /^\/(login|register|staff-invite|verify|onboarding|forgot-password|password-reset)(\/.*)?$/;
                  const isPublic = PUBLIC_PATTERN.test(window.location.pathname);
                  const html = document.documentElement;
                  
                  const isSystemDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
                  const isDark = isPublic || isSystemDark;
                  
                  if (isDark) {
                    html.classList.add('dark');
                    html.style.colorScheme = 'dark';
                  } else {
                    html.classList.remove('dark');
                    html.style.colorScheme = 'light';
                  }

                  // ── Defensive Theme Color Creation ──
                  let meta = document.head.querySelector('meta[name="theme-color"]');
                  if (!meta) {
                    meta = document.createElement('meta');
                    meta.name = 'theme-color';
                    document.head.appendChild(meta);
                  }
                  meta.setAttribute('data-theme-color', 'early');
                  meta.content = isDark ? DARK_COLOR : LIGHT_COLOR;
                } catch (e) {}
              })();
            `,
          }}
        />
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
