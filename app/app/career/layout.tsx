import type { Metadata } from "next";
import "./career.css";

export const metadata: Metadata = {
  title: "CareerOrder — Rebuild a Footballer's Career Timeline",
  description:
    "Free football career game: drag and drop club badges to reconstruct a footballer's career in the correct chronological order. Solo & multiplayer.",
};

export default function CareerLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
