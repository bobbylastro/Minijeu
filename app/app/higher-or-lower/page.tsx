import type { Metadata } from "next";
import HigherOrLowerGame from "@/components/HigherOrLowerGame";
import RelatedGames from "@/components/RelatedGames";

export const metadata: Metadata = {
  title: "Higher or Lower Countries Game – Compare stats online | Ultimate Playground",
  description:
    "Play the higher or lower countries game. Compare population, GDP, area and more. Test your knowledge and guess which country ranks higher.",
};

export default function HigherOrLowerPage() {
  return (
    <>
      <HigherOrLowerGame />
      <section className="game-seo-section">
        <div className="game-seo-section__inner">
          <h1 className="game-seo-section__h1">
            Higher or Lower – Compare countries and guess which ranks higher
          </h1>

          <h2>What is the Higher or Lower countries game?</h2>
          <p>
            Higher or Lower is an addictive online quiz game where you compare two countries based
            on different statistics. Your goal is simple: guess which country ranks higher on a
            given metric.
          </p>
          <p>
            Each round presents a new challenge, testing your global knowledge and intuition across
            a variety of topics.
          </p>

          <h2>How to play Higher or Lower</h2>
          <p>
            In every round, two countries are shown along with a specific metric. This could
            include:
          </p>
          <ul>
            <li>Population</li>
            <li>GDP</li>
            <li>Land area</li>
            <li>Life expectancy</li>
            <li>Coastline length</li>
            <li>And more</li>
          </ul>
          <p>
            You simply click on the country you believe has the higher value. Each correct answer
            earns you one point, with a total of 10 rounds per game.
          </p>

          <h2>A mix of knowledge and intuition</h2>
          <p>
            Some comparisons are obvious, while others are surprisingly tricky. You might know that
            China has a larger population than Canada, but what about coastline length or life
            expectancy between less familiar countries?
          </p>
          <p>This balance makes the game both educational and highly engaging.</p>

          <h2>Learn about the world while playing</h2>
          <p>
            Higher or Lower is not just a game — it&apos;s also a fun way to improve your
            understanding of global statistics. Over time, you&apos;ll develop a better sense of
            how countries compare across different metrics.
          </p>
          <p>
            It&apos;s perfect for players interested in geography, economics and general knowledge.
          </p>

          <h2>Play the Higher or Lower game online for free</h2>
          <p>
            You can play instantly in your browser with no download required. Whether you want a
            quick challenge or to beat your high score, Higher or Lower offers fast and rewarding
            gameplay.
          </p>
          <p>Try it now and see how many correct answers you can get.</p>
        </div>
      </section>
      <RelatedGames currentSlug="/higher-or-lower" />
    </>
  );
}
