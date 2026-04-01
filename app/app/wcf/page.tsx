import type { Metadata } from "next";
import Link from "next/link";
import WhatCameFirstGame from "@/components/WhatCameFirstGame";
import RelatedGames from "@/components/RelatedGames";
import JsonLd from "@/components/JsonLd";
import FAQ from "@/components/FAQ";

export const metadata: Metadata = {
  title: "What came first quiz: history, tech & culture game",
  description:
    "Test your knowledge of history, science and culture. Guess which event came first, place events in order and estimate exact years.",
};

const BASE = "https://ultimate-playground.com";

export default function WCFPage() {
  return (
    <>
      <JsonLd data={[
        {
          "@context": "https://schema.org",
          "@type": "WebApplication",
          "name": "WhatCameFirst",
          "url": `${BASE}/wcf`,
          "description": "Pick which historical event, invention or cultural milestone happened first. A free online trivia game covering history, science and pop culture.",
          "applicationCategory": "Game",
          "genre": "Trivia Game",
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
            { "@type": "ListItem", "position": 1, "name": "Home",           "item": BASE },
            { "@type": "ListItem", "position": 2, "name": "Culture",        "item": `${BASE}/culture` },
            { "@type": "ListItem", "position": 3, "name": "WhatCameFirst",  "item": `${BASE}/wcf` },
          ],
        },
      ]} />
      <WhatCameFirstGame />
      <section className="game-seo-section">
        <div className="game-seo-section__inner">
          <h1 className="game-seo-section__h1">
            What Came First? test your knowledge across time
          </h1>

          <h2>A fast-paced timeline challenge</h2>
          <p>
            What Came First? is all about understanding how events are connected through time.
            From major historical moments to breakthroughs in science and pop culture, each round
            challenges your sense of chronology in a fun and dynamic way.
          </p>

          <h2>Multiple game modes, one objective</h2>
          <p>
            Every game mixes different types of challenges. You might have to choose which of two
            events happened first, guess the exact year using a slider, or drag and drop several
            events into the correct order. This variety keeps each session fresh and engaging.
          </p>

          <h2>Train your memory and intuition</h2>
          <p>
            Some answers rely on pure knowledge, others on logic and estimation. Even if you are
            unsure, you can often get close by thinking about context and timelines. The more you
            play, the better you become at placing events accurately.
          </p>

          <h2>Perfect for curious minds</h2>
          <p>
            Whether you are into history, science, technology or culture, this game offers a broad
            mix of topics. What Came First? is designed to be both educational and entertaining,
            making it easy to learn something new while having fun.
          </p>

          <div className="game-seo-section__rules-link">
            <Link href="/wcf-rules">📖 Full rules and how to play WhatCameFirst? →</Link>
          </div>

          <FAQ items={[
            {
              q: "Is WhatCameFirst? free to play?",
              a: "Yes, completely free. No account or download needed — play instantly in your browser on desktop or mobile.",
            },
            {
              q: "What topics does WhatCameFirst? cover?",
              a: "Events span four domains: Sports (records, tournaments, historic moments), Technology (inventions, product launches, milestones), History (treaties, discoveries, political events) and Pop culture (album releases, films, iconic moments).",
            },
            {
              q: "Can I play WhatCameFirst? against someone?",
              a: "Yes — WhatCameFirst? supports real-time multiplayer. Both players see the same event pairs powered by a shared seed. If no opponent is found within 30 seconds, a bot steps in automatically.",
            },
          ]} />
        </div>
      </section>
      <RelatedGames currentSlug="/wcf" />
    </>
  );
}
