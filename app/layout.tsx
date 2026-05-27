import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";
import AppErrorBoundary from "@/components/AppErrorBoundary";
import { AuthProvider } from "@/lib/auth/AuthContext";

const fraunces = localFont({
  src: "./fonts/fraunces.woff2",
  weight: "400 700",
  variable: "--font-fraunces",
  display: "swap",
});

const interTight = localFont({
  src: "./fonts/inter-tight.woff2",
  weight: "400 700",
  variable: "--font-inter-tight",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://amigodopredio.vercel.app"),
  title: "Amigo do Prédio — Assistente condominial",
  description:
    "Orientações práticas para a rotina do síndico. Acompanhe vencimentos, obrigações e decisões importantes do condomínio.",
  applicationName: "Amigo do Prédio",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Amigo do Prédio",
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  other: {
    "apple-mobile-web-app-title": "Amigo do Prédio",
    "mobile-web-app-capable": "yes",
    "msapplication-TileColor": "#234B63",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#234B63",
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" className={`${fraunces.variable} ${interTight.variable}`}>
      <body className="bg-cream-50 font-sans text-navy-700 antialiased">
        <AppErrorBoundary>
          <AuthProvider>{children}</AuthProvider>
        </AppErrorBoundary>
      </body>
    </html>
  );
}
