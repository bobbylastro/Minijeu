import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Leaderboard — Top Players",
  description:
    "See the top-ranked players across all Ultimate Playground games — football, NBA, geography, food and culture quizzes.",
};

export default function LeaderboardLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
