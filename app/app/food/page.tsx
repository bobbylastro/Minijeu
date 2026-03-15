import type { Metadata } from "next";
import FoodOriginGame from "@/components/FoodOriginGame";
import RelatedGames from "@/components/RelatedGames";
import JsonLd from "@/components/JsonLd";

export const metadata: Metadata = {
  title: "Food Origins Game – Guess the country behind the dish | Ultimate Playground",
  description:
    "Test your food geography knowledge! A dish appears on screen — click the right country on the world map to score. 10 rounds, 180+ dishes from every continent.",
};

const BASE = "https://ultimate-playground.com";

export default function FoodPage() {
  return (
    <>
      <JsonLd data={[
        {
          "@context": "https://schema.org",
          "@type": "WebApplication",
          "name": "Food Origins",
          "url": `${BASE}/food`,
          "description": "A dish photo appears — click the country on the world map where it comes from. A free online geography and food culture game.",
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
            { "@type": "ListItem", "position": 1, "name": "Home",         "item": BASE },
            { "@type": "ListItem", "position": 2, "name": "Food",         "item": `${BASE}/food-games` },
            { "@type": "ListItem", "position": 3, "name": "Food Origins", "item": `${BASE}/food` },
          ],
        },
      ]} />
      <FoodOriginGame />
      <section className="game-seo-section">
        <div className="game-seo-section__inner">
          <h1 className="game-seo-section__h1">
            Food Origins – Guess which country each dish comes from
          </h1>

          <h2>What is the Food Origins game?</h2>
          <p>
            Food Origins is a world geography quiz with a culinary twist. Each round reveals a
            famous dish along with a short hint — your job is to click on the country it comes
            from on an interactive world map.
          </p>
          <p>
            With over 180 dishes spanning every continent, you&apos;ll travel from Japan to Peru,
            from Ethiopia to Norway, guided only by a photo and a clue.
          </p>

          <h2>How to play</h2>
          <p>
            Each game consists of 10 rounds. At the start of every round, a dish is revealed with
            its name and a short description. You then have 30 seconds to locate its country of
            origin on the map and click it.
          </p>
          <ul>
            <li>Correct answer: +100 points</li>
            <li>Wrong answer or timeout: +0 points</li>
            <li>Maximum score: 1000 points</li>
          </ul>
          <p>
            You can zoom in and pan the map to find smaller countries. Hover over any territory
            to see its name and flag before committing your answer.
          </p>

          <h2>A culinary tour of the world</h2>
          <p>
            From well-known classics like Japanese Sushi, Italian Pizza or French Croissants to
            lesser-known gems like Bhutanese Ema Datshi, Kazakhstani Beshbarmak or Trinidadian
            Roti — Food Origins challenges even the most seasoned food lovers.
          </p>
          <p>
            Each dish is chosen because it has a clear, strong cultural identity tied to one
            specific country, making the game both educational and surprising.
          </p>

          <h2>Test your food geography knowledge</h2>
          <p>
            Food geography is a fascinating topic. Many dishes we eat every day have deep roots
            in a specific region, shaped by local ingredients, history and traditions. Food Origins
            is designed to make you think about those connections in a fun, fast-paced format.
          </p>
          <p>
            Whether you&apos;re a foodie, a geography buff, or just looking for a quick brain
            workout, this game will teach you something new every time you play.
          </p>

          <h2>Play Food Origins online for free</h2>
          <p>
            No download or account required. Jump straight into a game from your browser, whether
            on desktop or mobile. Each session is different thanks to the randomised dish
            selection, so there&apos;s always a new challenge waiting.
          </p>
          <p>How many dishes can you place correctly? Start playing and find out.</p>
        </div>
      </section>
      <RelatedGames currentSlug="/food" />
    </>
  );
}
