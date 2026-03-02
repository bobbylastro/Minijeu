import type { Metadata } from "next";
import "./career.css";

export const metadata: Metadata = {
  title: "Career Order",
};

export default function CareerLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
