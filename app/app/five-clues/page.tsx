import type { Metadata } from "next";
import FiveCluesGame from "@/components/FiveCluesGame";

export const metadata: Metadata = {
  title: "5 Clues — Who Am I?",
  description: "5 progressive clues, 3 attempts. Guess the famous person — athletes, musicians, actors, historical figures and more. Play solo or vs an opponent.",
};

export default function FiveCluesPage() {
  return <FiveCluesGame />;
}
