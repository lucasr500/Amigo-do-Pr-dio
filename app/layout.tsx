import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";

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
  title: "Amigo do Prédio — Orientações para gestão condominial",
  description:
    "Orientações práticas e claras para a rotina do seu condomínio. Sem linguagem complicada, sem espera, sem dor de cabeça.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Amigo do Prédio",
  },
  icons: {
    apple: "/icons/apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#1f3147",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" className={`${fraunces.variable} ${interTight.variable}`}>
      <body className="font-sans bg-cream-50 text-navy-800 antialiased">
        {children}
      </body>
    </html>
  );
}
