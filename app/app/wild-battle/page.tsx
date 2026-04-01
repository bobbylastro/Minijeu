import type { Metadata } from "next";
import Link from "next/link";
import JsonLd from "@/components/JsonLd";
import WildBattleGame from "@/components/WildBattleGame";
import RelatedGames from "@/components/RelatedGames";
import FAQ from "@/components/FAQ";

const BASE = "https://ultimate-playground.com";

export const metadata: Metadata = {
  title: "Wild Battle — Animal Face-Offs, Trivia & Stats Quiz",
  description:
    "Can you guess who wins? Lion vs bear, orca vs shark, honey badger vs king cobra. Animal battle quiz with trivia rounds and estimation sliders. Play solo or multiplayer.",
  keywords: ["animal battle quiz", "wildlife quiz game", "animal fight game", "nature trivia", "who would win animal quiz", "wild animal game"],
  openGraph: {
    title: "Wild Battle — Who wins the animal fight?",
    description: "Animal face-offs, trivia and wild stats. Pick the winner, answer trivia and estimate animal records.",
    url: `${BASE}/wild-battle`,
    type: "website",
  },
};

export default function WildBattlePage() {
  return (
    <>
      <JsonLd data={[
        {
          "@context": "https://schema.org",
          "@type": "VideoGame",
          "name": "Wild Battle",
          "description": "Animal face-off quiz game. Pick the winner of animal fights, answer wildlife trivia and estimate animal records.",
          "url": `${BASE}/wild-battle`,
          "genre": ["Trivia", "Quiz", "Educational"],
          "gamePlatform": "Browser",
          "applicationCategory": "Game",
          "numberOfPlayers": { "@type": "QuantitativeValue", "minValue": 1, "maxValue": 2 },
          "publisher": { "@type": "Organization", "name": "Ultimate Playground", "url": BASE },
          "inLanguage": "en",
          "isAccessibleForFree": true,
          "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" },
        },
        {
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          "itemListElement": [
            { "@type": "ListItem", "position": 1, "name": "Home",    "item": BASE },
            { "@type": "ListItem", "position": 2, "name": "Animals", "item": `${BASE}/animals` },
            { "@type": "ListItem", "position": 3, "name": "Wild Battle", "item": `${BASE}/wild-battle` },
          ],
        },
      ]} />
      <WildBattleGame />
      <section className="game-seo-section">
        <div className="game-seo-section__inner">
          <h1 className="game-seo-section__h1">
            Wild Battle – animal face-offs, trivia and wild stats
          </h1>

          <h2>Pick the winner in every animal showdown</h2>
          <p>
            Wild Battle puts your wildlife knowledge to the test through three types of challenges.
            In battle rounds, two animals go head-to-head and you pick the winner of a real-world
            fight. In comparison rounds, you decide which animal wins on a specific trait — speed,
            weight, bite force or lifespan. Every round is grounded in real animal data.
          </p>

          <h2>Three formats, ten rounds, zero repetition</h2>
          <p>
            Each session mixes battle face-offs, stat comparisons and slider estimation rounds in
            a randomised order. Slider rounds ask you to estimate a wild animal record — the top
            speed of a cheetah, the weight of a sperm whale, the lifespan of a giant tortoise.
            The variety keeps every game fresh and forces you to think differently each time.
          </p>

          <h2>Build streaks and multiply your score</h2>
          <p>
            Answering correctly in a row triggers a streak multiplier. Hit 5 in a row and you earn
            ×1.5 — push it to 10 and your points double. Wild Battle rewards both knowledge and
            consistency, making every correct answer matter even more when you&apos;re on a roll.
          </p>

          <h2>Learn surprising facts about the animal kingdom</h2>
          <p>
            Wild Battle is built around real animal biology and ecology. After every round, a short
            explanation reveals the science behind the answer — why a honey badger outlasts a king
            cobra, or how a mantis shrimp strikes harder than most predators twice its size.
            You&apos;ll walk away knowing things you never expected to know.
          </p>

          <div className="game-seo-section__rules-link">
            <Link href="/wild-battle-rules">📖 Full rules and how to play Wild Battle →</Link>
          </div>

          <FAQ items={[
            {
              q: "How does Wild Battle work?",
              a: "Wild Battle has 10 rounds mixing three formats: animal face-offs where you pick the winner, multiple-choice wildlife trivia, and slider rounds where you estimate wild animal facts. Build a streak for score multipliers.",
            },
            {
              q: "Can I play Wild Battle multiplayer?",
              a: "Yes — Wild Battle supports real-time multiplayer. Both players see the same questions powered by a shared seed. If no opponent is found within 30 seconds, you play against a bot.",
            },
            {
              q: "How is scoring calculated in Wild Battle?",
              a: "Correct battle and trivia answers earn 100 points. Slider rounds award up to 100 points based on proximity to the correct answer. In solo mode, streaks of 5+ grant a ×1.5 multiplier and 10+ grant ×2.",
            },
          ]} />
        </div>
      </section>
      <RelatedGames currentSlug="/wild-battle" />
    </>
  );
}
