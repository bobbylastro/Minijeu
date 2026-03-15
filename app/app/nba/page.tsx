import type { Metadata } from "next";
import NBAQuizGame from "@/components/NBAQuizGame";
import RelatedGames from "@/components/RelatedGames";

export const metadata: Metadata = {
  title: "NBA Quiz – Salaries, contracts and trivia online | Ultimate Playground",
  description:
    "Test your NBA knowledge with NBAQuiz: trivia, arenas, salaries and contracts. A fast and addictive online game for basketball fans.",
};

export default function NBAPage() {
  return (
    <>
      <NBAQuizGame />
      <section className="game-seo-section">
        <div className="game-seo-section__inner">
          <h1 className="game-seo-section__h1">
            NBA quiz – test your basketball knowledge
          </h1>

          <h2>A complete NBA quiz for true fans</h2>
          <p>
            NBAQuiz is an online game designed to put your basketball knowledge to the test. It
            goes beyond classic trivia — it combines general knowledge questions, arena
            recognition, contract understanding and player performance analysis. Every match
            pushes you to think fast and draw on everything you know about the NBA.
          </p>

          <h2>Varied and strategic game modes</h2>
          <p>
            The game offers multiple formats to keep the experience dynamic. You can answer
            multiple-choice questions on NBA history and culture, identify iconic arenas, estimate
            the value of a contract, or compare player salaries. Each mode brings a different
            mechanic, so the experience never gets repetitive.
          </p>

          <h2>Fast-paced and addictive gameplay</h2>
          <p>
            NBAQuiz is designed for short, engaging sessions. Rounds move quickly, with decisions
            to make in just a few seconds. It&apos;s exactly the kind of game you can come back to
            regularly without ever getting bored — whether you&apos;re on mobile or desktop.
          </p>

          <h2>Learn while you play</h2>
          <p>
            On top of being entertaining, NBAQuiz is a great way to deepen your basketball
            knowledge. You&apos;ll discover data on contracts, salaries, performances and
            franchises. Even the most dedicated fans can learn something new with every session.
          </p>
        </div>
      </section>
      <RelatedGames currentSlug="/nba" />
    </>
  );
}
