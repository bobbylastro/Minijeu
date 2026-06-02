import type { Metadata, Viewport } from "next";
import { Bebas_Neue, DM_Mono, Sora } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Providers from "./providers";
import CookieBanner from "@/components/CookieBanner";
import ConsentScripts from "@/components/ConsentScripts";
import JsonLd from "@/components/JsonLd";

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

export const viewport: Viewport = {
  themeColor: "#0a0a0f",
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    template: "%s | Ultimate Playground",
    default: "Ultimate Playground — The best gaming clips right now",
  },
  description:
    "Watch the best Valorant, Apex Legends, Marvel Rivals, The Finals, Rocket League and Rainbow Six Siege clips. Curated automatically, fresh clips every week.",
  openGraph: {
    type: "website",
    siteName: "Ultimate Playground",
    title: "Ultimate Playground — The best gaming clips right now",
    description:
      "The best Valorant, Apex, Marvel Rivals, The Finals, Rocket League and R6 Siege clips — curated automatically.",
    url: BASE_URL,
    images: [{ url: "/og-gamingclips.png", width: 1200, height: 630, alt: "Ultimate Playground" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Ultimate Playground — The best gaming clips right now",
    description:
      "Valorant, Apex, Marvel Rivals, The Finals, Rocket League, R6 Siege. The best clips, every week.",
    images: ["/og-gamingclips.png"],
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
      <head>
        {process.env.NEXT_PUBLIC_SUPABASE_URL && (
          <link rel="preconnect" href={new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).origin} />
        )}
        <JsonLd data={{
          "@context": "https://schema.org",
          "@type": "WebSite",
          "name": "Ultimate Playground",
          "url": BASE_URL,
          "description": "The best gaming clips — Valorant, Apex, CS2, LoL, Minecraft, GTA V, Rust, Overwatch and more.",
          "inLanguage": "en",
          "publisher": {
            "@type": "Organization",
            "name": "Ultimate Playground",
            "url": BASE_URL,
          },
        }} />
      </head>
      <body suppressHydrationWarning>
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
