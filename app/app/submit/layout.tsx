import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Submit a Clip",
  description:
    "Share your best gaming moment with the Ultimate Playground community. Submit clips from Valorant, Apex Legends, CS2, Rocket League and more — reviewed before going live.",
  openGraph: {
    title: "Submit a Clip — Ultimate Playground",
    description: "Share your best gaming moment. Every clip is reviewed before going live.",
  },
};

export default function SubmitLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
