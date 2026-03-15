import type { Metadata } from "next";
import "./football.css";

export const metadata: Metadata = {
  title: "FootballQuiz — Transfers, Salaries & Stadium Trivia",
  description:
    "Free football quiz game: guess transfer fees, compare player salaries, identify stadiums and test your football trivia. 10 rounds, solo & multiplayer.",
};

export default function FootballLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
