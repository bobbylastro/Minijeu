import type { Metadata } from "next";
import Link from "next/link";
import OriginsGame from "@/components/OriginsGame";
import RelatedGames from "@/components/RelatedGames";
import JsonLd from "@/components/JsonLd";
import FAQ from "@/components/FAQ";

export const metadata: Metadata = {
  title: "Origins Quiz – Where was it invented?",
  description:
    "Test your cultural knowledge! A sport, tradition or invention appears — click the right country on the world map. Sports, music, festivals and more.",
};

const BASE = "https://ultimate-playground.com";

export default function OriginsPage() {
  return (
    <>
      <JsonLd data={[
        {
          "@context": "https://schema.org",
          "@type": "WebApplication",
          "name": "Origins Quiz",
          "url": `${BASE}/origins`,
          "description": "A sport, tradition or invention appears — click the world map to find the country it comes from. Sports, music, festivals, inventions and more.",
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
            { "@type": "ListItem", "position": 2, "name": "Culture",      "item": `${BASE}/culture` },
            { "@type": "ListItem", "position": 3, "name": "Origins Quiz", "item": `${BASE}/origins` },
          ],
        },
      ]} />
      <OriginsGame />
      <section className="game-seo-section">
        <div className="game-seo-section__inner">
          <h1 className="game-seo-section__h1">
            Origins Quiz – Where was it invented?
          </h1>

          <h2>What is the Origins Quiz?</h2>
          <p>
            Origins Quiz is a world geography and culture game that challenges you to identify
            where iconic sports, traditions, dances, inventions and festivals come from.
            A photo and a hint appear on screen — your job is to click the country of origin
            on an interactive world map.
          </p>
          <p>
            From Tennis born on English lawns to Tango danced in Buenos Aires, from the
            Finnish Sauna to Indian Chess — Origins covers the full spectrum of human creativity
            across 60+ items from every continent.
          </p>

          <h2>How to play</h2>
          <p>
            Each game consists of 10 rounds. At the start of every round, an item is revealed
            with its name, category and a short hint. You then have 25 seconds to find its
            country of origin on the map and click it.
          </p>
          <ul>
            <li>Correct answer: +100 points</li>
            <li>Wrong answer or timeout: +0 points</li>
            <li>Maximum score: 1000 points</li>
          </ul>
          <p>
            You can zoom in and pan the map to find smaller countries. On mobile, tap a country
            once to preview its name, then tap Confirm to lock in your answer.
          </p>

          <h2>What categories are covered?</h2>
          <p>
            Origins Quiz spans four main categories:
          </p>
          <ul>
            <li><strong>Sports</strong> — Tennis, Rugby, Sumo, Taekwondo, Polo and more</li>
            <li><strong>Dance &amp; Music</strong> — Tango, Flamenco, Reggae, Jazz, K-pop and more</li>
            <li><strong>Traditions &amp; Festivals</strong> — Halloween, Oktoberfest, Diwali, Carnival and more</li>
            <li><strong>Inventions &amp; Culture</strong> — Chess, Lego, Origami, Sauna, Yoga and more</li>
          </ul>

          <h2>Test what you really know about the world</h2>
          <p>
            Some origins are obvious — most people know Sushi comes from Japan. But can you
            tell where Ballet was formalised, or which country invented Polo? Origins Quiz
            will surprise you and teach you something new every round.
          </p>

          <h2>Play Origins Quiz online for free</h2>
          <p>
            No download or account needed. Play instantly in your browser on desktop or mobile.
            Each session is randomised so there is always a new challenge waiting.
          </p>
          <p>How many origins can you get right? Start playing and find out.</p>

          <div className="game-seo-section__rules-link">
            <Link href="/origins-rules">📖 Full rules and how to play Origins Quiz →</Link>
          </div>

          <FAQ items={[
            {
              q: "Is Origins Quiz free to play?",
              a: "Yes, completely free. No account or download needed — play instantly in your browser on desktop or mobile.",
            },
            {
              q: "What categories does Origins Quiz cover?",
              a: "Origins Quiz spans four categories: Sports (Tennis, Rugby, Sumo…), Dance & Music (Tango, Flamenco, Reggae…), Traditions & Festivals (Halloween, Diwali, Carnival…) and Inventions & Culture (Chess, Lego, Yoga, Origami…). Over 60 items from every continent.",
            },
            {
              q: "How long does a game of Origins Quiz last?",
              a: "Each game is 10 rounds with a 25-second timer per round, so a full session takes around 5 to 6 minutes.",
            },
          ]} />
        </div>
      </section>
      <RelatedGames currentSlug="/origins" />
    </>
  );
}
