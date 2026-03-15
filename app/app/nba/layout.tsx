import type { Metadata } from "next";
import "../football/football.css";

export const metadata: Metadata = {
  title: "NBAQuiz — Contracts, Arenas & Basketball Trivia",
  description:
    "Free NBA quiz game: guess player contracts, compare salaries, identify arenas and test your basketball trivia. 10 rounds, solo & multiplayer.",
};

export default function NbaLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
