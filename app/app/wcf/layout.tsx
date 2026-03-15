import type { Metadata } from "next";
import "./wcf.css";

export const metadata: Metadata = {
  title: "WhatCameFirst? — History & Pop Culture Timeline Quiz",
  description:
    "Free timeline quiz: two events appear — pick which one happened first. Sports records, tech milestones, history and pop culture. Solo & multiplayer.",
};

export default function WcfLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
