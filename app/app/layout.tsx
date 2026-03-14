import type { Metadata } from "next";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Providers from "./providers";
import CookieBanner from "@/components/CookieBanner";
import ConsentScripts from "@/components/ConsentScripts";

export const metadata: Metadata = {
  title: { template: "%s | Ultimate Playground", default: "Ultimate Playground — Quiz & Games" },
  description: "Play fun quiz games — sports, geography, culture and more.",
  icons: { icon: "/images/favicon.png" },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
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
