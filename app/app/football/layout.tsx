import type { Metadata } from "next";
import "./football.css";

export const metadata: Metadata = {
  title: "Football Quiz",
};

export default function FootballLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
