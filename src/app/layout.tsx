import type { Metadata } from "next";
import { Inter, Roboto_Mono } from "next/font/google"; // ✅ Fonts supported
import "./globals.css";

import { SpeedInsights } from "@vercel/speed-insights/next";
import { Analytics } from "@vercel/analytics/react";
import PWARegister from "./components/PWARegister";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const robotoMono = Roboto_Mono({
  variable: "--font-roboto-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Lumina",
  description: "Abel Memorial Programmers",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#FFD700" />
        <meta name="background-color" content="#000000" />
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
      </head>
      <body className={`${inter.variable} ${robotoMono.variable} antialiased`}>
        {children}
        <PWARegister />
        <SpeedInsights />
        <Analytics />
      </body>
    </html>
  );
}
