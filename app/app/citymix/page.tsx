import type { Metadata } from "next";
import CityMixGame from "@/components/CityMixGame";
import RelatedGames from "@/components/RelatedGames";
import JsonLd from "@/components/JsonLd";

export const metadata: Metadata = {
  title: "CityMix – Guess city population game",
  description:
    "Play CityMix, the ultimate city population guessing game. Compare cities, estimate their population and test your geography skills online for free.",
};

const BASE = "https://ultimate-playground.com";

export default function CityMixPage() {
  return (
    <>
      <JsonLd data={[
        {
          "@context": "https://schema.org",
          "@type": "WebApplication",
          "name": "CityMix",
          "url": `${BASE}/citymix`,
          "description": "Pick the larger city then slide to guess its exact population. A free online geography quiz game.",
          "applicationCategory": "Game",
          "genre": "Educational Game",
          "operatingSystem": "Any",
          "inLanguage": "en",
          "isAccessibleForFree": true,
          "offers": { "@type": "Offer", "price": "0", "priceCurrency": "EUR" },
          "publisher": { "@type": "Organization", "name": "Ultimate Playground", "url": BASE },
        },
        {
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          "itemListElement": [
            { "@type": "ListItem", "position": 1, "name": "Home",    "item": BASE },
            { "@type": "ListItem", "position": 2, "name": "World",   "item": `${BASE}/world` },
            { "@type": "ListItem", "position": 3, "name": "CityMix", "item": `${BASE}/citymix` },
          ],
        },
      ]} />
      <CityMixGame />
      <section className="game-seo-section">
        <div className="game-seo-section__inner">
          <h1 className="game-seo-section__h1">
            CityMix – Guess the population of cities around the world
          </h1>

          <h2>What is CityMix?</h2>
          <p>
            CityMix is a fast-paced and addictive online game where you test your knowledge of world
            cities and their populations. Each round challenges you to compare two cities or estimate
            the population of a specific location with precision.
          </p>
          <p>
            Designed for geography lovers and casual players alike, CityMix combines intuition,
            knowledge and quick decision-making into a simple but highly engaging experience.
          </p>

          <h2>How to play CityMix</h2>
          <p>CityMix alternates between two types of challenges:</p>
          <ul>
            <li>In comparison rounds, you choose which city has the larger population</li>
            <li>In estimation rounds, you use a slider to guess the exact population of a city</li>
          </ul>
          <p>
            The closer your guess is to the real number, the more points you earn. Each round can
            score up to 1,000 points, with a maximum total of 10,000 points across 10 rounds.
          </p>

          <h2>Why CityMix is so addictive</h2>
          <p>
            CityMix is easy to understand but difficult to master. You might know that Tokyo is
            larger than Paris, but can you estimate the population of a mid-sized city in South
            America or Asia?
          </p>
          <p>
            This mix of comparison and precision creates a unique gameplay loop that keeps players
            coming back for more.
          </p>

          <h2>Improve your geography skills</h2>
          <p>
            Playing CityMix regularly helps you develop a better understanding of global population
            distribution. You&apos;ll start recognizing patterns between continents, countries and
            city sizes.
          </p>
          <p>
            It&apos;s a fun and interactive way to learn geography without even realizing it.
          </p>

          <h2>Play CityMix online for free</h2>
          <p>
            CityMix is available instantly in your browser with no download required. You can play
            solo to beat your high score or challenge friends in multiplayer mode.
          </p>
          <p>
            Jump into the game now and see how close you can get to the perfect score.
          </p>
        </div>
      </section>
      <RelatedGames currentSlug="/citymix" />
    </>
  );
}
