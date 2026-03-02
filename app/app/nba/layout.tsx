import type { Metadata } from "next";
import "../football/football.css";

export const metadata: Metadata = {
  title: "NBA Quiz",
};

export default function NbaLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
