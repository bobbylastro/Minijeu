import type { Metadata } from "next";
import "./wcf.css";

export const metadata: Metadata = {
  title: "What Came First?",
};

export default function WcfLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
