import type { Metadata } from "next";
import Link from "next/link";
import GamingMixGame from "@/components/GamingMixGame";
import gamingMixData from "@/app/gaming_mix_data.json";
import RelatedGames from "@/components/RelatedGames";
import JsonLd from "@/components/JsonLd";
import FAQ from "@/components/FAQ";

export const metadata: Metadata = {
  title: "Gaming Mix — Guess the Release Year & Best-Selling Game Quiz",
  description: "Guess when iconic games came out, then pick which sold more copies. 10 rounds mixing release year sliders and best-seller battles. Free, solo or multiplayer.",
};

const BASE = "https://ultimate-playground.com";

export default function GamingMixPage() {
  return (
    <>
      <JsonLd data={[
        {
          "@context": "https://schema.org",
          "@type": "WebApplication",
          "name": "Gaming Mix",
          "url": `${BASE}/gaming-mix`,
          "description": "Guess the release year of iconic video games with a slider, then pick which game sold more copies. 10 rounds, solo or multiplayer.",
          "applicationCategory": "Game",
          "operatingSystem": "Any",
          "inLanguage": "en",
          "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" },
        },
        {
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          "itemListElement": [
            { "@type": "ListItem", "position": 1, "name": "Home",   "item": BASE },
            { "@type": "ListItem", "position": 2, "name": "Gaming", "item": `${BASE}/gaming` },
            { "@type": "ListItem", "position": 3, "name": "Gaming Mix", "item": `${BASE}/gaming-mix` },
          ],
        },
      ]} />
      <GamingMixGame initialData={gamingMixData} />
      <section className="game-seo-section">
        <div className="game-seo-section__inner">
          <h1 className="game-seo-section__h1">Gaming Mix — Release Year Slider & Best-Seller Battle</h1>
          <p className="game-seo-section__p">
            Two questions every gamer faces: when exactly did that game come out — and which one
            sold more? Gaming Mix puts both to the test across 10 rounds. Slide to the year,
            pick the best-seller, score up to 1000 points solo or against an opponent.
          </p>

          <h2 className="game-seo-section__h2">How Gaming Mix works</h2>
          <p className="game-seo-section__p">
            Each session draws 10 rounds at random from a pool of 85 iconic games spanning 1990 to 2024.
            Five of those rounds are <strong>Release Year</strong> challenges: a game cover appears and you drag
            a slider to guess the exact year it launched. The closer you are, the more points you earn —
            a perfect guess nets 100 points, while being off by a single year still earns 80.
          </p>
          <p className="game-seo-section__p">
            The other five rounds are <strong>Best Seller Battles</strong>: two games appear side by side
            and you pick the one that sold more copies worldwide. Sales figures are revealed after each pick,
            so you always learn something new — even when you answer correctly.
          </p>

          <h2 className="game-seo-section__h2">85 games, from indie hits to blockbusters</h2>
          <p className="game-seo-section__p">
            The pool covers every era and genre of PC gaming: open-world giants like GTA V (200 million copies)
            and Minecraft, indie phenomena like Stardew Valley and Hollow Knight, FromSoftware classics,
            strategy staples like Civilization VI and Crusader Kings III, and modern hits like
            Baldur&apos;s Gate 3, Palworld and Hogwarts Legacy. With 85 games in the pool and 10 drawn per
            session, no two playthroughs are identical.
          </p>

          <h2 className="game-seo-section__h2">Play solo or challenge a friend</h2>
          <p className="game-seo-section__p">
            Gaming Mix supports real-time 1v1 multiplayer: both players receive the same rounds generated
            from a shared seed, ensuring a fair head-to-head. Jump into Quick Match to be paired with a
            random opponent, or create a private room and share a 4-letter code with a friend. A bot fills
            in if no opponent is found within 30 seconds so you never wait long.
          </p>

          <FAQ items={[
            {
              q: "How does Gaming Mix work?",
              a: "Gaming Mix has 10 rounds mixing two question types. In Release Year rounds, you drag a slider to guess when a game was released (1990–2024). In Best Seller rounds, two games appear side by side — pick the one that sold more copies.",
            },
            {
              q: "How is the Release Year score calculated?",
              a: "Exact year = 100 pts. Off by 1 year = 80 pts. Off by 2 = 60 pts. Off by 3 = 40 pts. Off by 4 = 20 pts. Off by 5+ years = 0 pts.",
            },
            {
              q: "Which games are in Gaming Mix?",
              a: "85 iconic video games including GTA V, Elden Ring, The Witcher 3, Stardew Valley, Terraria, Baldur's Gate 3, Hades, Hollow Knight, Rocket League, Cyberpunk 2077, Palworld and more. 10 games are drawn randomly each session.",
            },
            {
              q: "Is Gaming Mix multiplayer?",
              a: "Yes — Gaming Mix supports real-time 1v1 multiplayer. Both players get the same rounds from a shared seed. A bot steps in if no opponent is found within 30 seconds.",
            },
            {
              q: "What is the maximum score in Gaming Mix?",
              a: "The maximum is 1000 points: 5 Release Year rounds × 100 pts each + 5 Best Seller rounds × 100 pts each. In multiplayer, scores are compared at the end and a winner is declared.",
            },
            {
              q: "Is Gaming Mix free to play?",
              a: "Yes, Gaming Mix is completely free. No account, no download and no payment required — play directly in your browser on desktop or mobile.",
            },
          ]} />

          <div className="game-seo-section__rules-link">
            <Link href="/gaming-mix-rules">📖 Full rules and scoring guide →</Link>
          </div>

          <RelatedGames currentSlug="/gaming-mix" />
        </div>
      </section>
    </>
  );
}
