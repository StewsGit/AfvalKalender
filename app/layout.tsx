import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { themeBootstrapScript } from "../lib/theme";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Afval Kalender — jouw ophaalkalender",
  description: "Bekijk wat IVAREM morgen en de komende zeven dagen ophaalt.",
  other: {
    "codex-preview": "development",
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="nl" data-theme="light" data-accent="green" suppressHydrationWarning>
      <head>
        {/* Applies the stored theme and accent before first paint, so the page
            never flashes the wrong colours while React hydrates. */}
        <script dangerouslySetInnerHTML={{ __html: themeBootstrapScript }} />
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined&icon_names=category,check,compost,construction,contrast,dark_mode,delete,delete_forever,eco,forest,inventory_2,light_mode,newspaper,recycling,refresh,settings,wine_bar&display=block"
          rel="stylesheet"
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
