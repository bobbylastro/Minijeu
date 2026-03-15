import type { Metadata } from "next";
import { Bebas_Neue, DM_Mono, Sora } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Providers from "./providers";
import CookieBanner from "@/components/CookieBanner";
import ConsentScripts from "@/components/ConsentScripts";

const bebasNeue = Bebas_Neue({
  weight: "400",
  subsets: ["latin"],
  display: "swap",
  variable: "--font-bebas",
});
const dmMono = DM_Mono({
  weight: ["400", "500"],
  subsets: ["latin"],
  display: "swap",
  variable: "--font-mono",
});
const sora = Sora({
  weight: ["400", "600", "800"],
  subsets: ["latin"],
  display: "swap",
  variable: "--font-sora",
});

const BASE_URL = "https://ultimate-playground.com";

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    template: "%s | Ultimate Playground",
    default: "Ultimate Playground — Free Online Quiz & Mini Games",
  },
  description:
    "Play free online quiz and mini games — geography, sports, food culture, history and more. Challenge friends in real-time multiplayer. No download, no account needed.",
  icons: { icon: "/images/favicon.png" },
  openGraph: {
    type: "website",
    siteName: "Ultimate Playground",
    title: "Ultimate Playground — Free Online Quiz & Mini Games",
    description:
      "Play free online quiz and mini games — geography, sports, food culture, history and more. Challenge friends in real-time multiplayer.",
    url: BASE_URL,
    images: [{ url: "/images/og-default.png", width: 1200, height: 630, alt: "Ultimate Playground" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Ultimate Playground — Free Online Quiz & Mini Games",
    description:
      "Geography, sports, food & culture quiz games. Solo or multiplayer, free, no download.",
    images: ["/images/og-default.png"],
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${bebasNeue.variable} ${dmMono.variable} ${sora.variable}`}>
      <body>
        <Providers>
          <Header />
          {children}
          <Footer />
          <CookieBanner />
          <ConsentScripts />
        </Providers>
      </body>
    </html>
  );
}
