import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact Us",
  description:
    "Have a question, a bug to report or a suggestion? Reach out to the Ultimate Playground team — we read every message.",
  robots: { index: false, follow: false },
};

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
