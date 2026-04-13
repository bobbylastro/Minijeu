import type { Metadata } from "next";
import Link from "next/link";
import AnimalLocatorGame from "@/components/AnimalLocatorGame";
import animalData from "@/app/animal_locator_data.json";
import RelatedGames from "@/components/RelatedGames";
import JsonLd from "@/components/JsonLd";
import FAQ from "@/components/FAQ";

export const metadata: Metadata = {
  title: "Animal Locator — Find Where Animals Live on the Map",
  description: "An animal appears — click its home country on the world map. 55 species from pandas to axolotls. Free wildlife geography game, solo or multiplayer.",
};

const BASE = "https://ultimate-playground.com";

export default function AnimalLocatorPage() {
  return (
    <>
      <JsonLd data={[
        {
          "@context": "https://schema.org",
          "@type": "WebApplication",
          "name": "Animal Locator",
          "url": `${BASE}/animal-locator`,
          "description": "Click the right country on the world map to show where each animal lives. 55 species, solo or multiplayer.",
          "applicationCategory": "Game",
          "operatingSystem": "Any",
          "inLanguage": "en",
          "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" },
        },
        {
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          "itemListElement": [
            { "@type": "ListItem", "position": 1, "name": "Home",    "item": BASE },
            { "@type": "ListItem", "position": 2, "name": "Animals", "item": `${BASE}/animals` },
            { "@type": "ListItem", "position": 3, "name": "Animal Locator", "item": `${BASE}/animal-locator` },
          ],
        },
      ]} />
      <AnimalLocatorGame initialData={animalData} />
      <section className="game-seo-section">
        <div className="game-seo-section__inner">
          <h1 className="game-seo-section__h1">Animal Locator — Wildlife Geography Game</h1>
          <p className="game-seo-section__p">
            An animal appears on screen — your job is to click the right country on the world map.
            From the Giant Panda in China to the Axolotl in Mexico, Animal Locator tests your knowledge
            of where the world&apos;s most iconic species actually live.
          </p>

          <FAQ items={[
            {
              q: "How does Animal Locator work?",
              a: "Each round, an animal photo and a clue appear. You have 25 seconds to click the country on the world map where that animal is primarily found. One correct click = 100 points, max 1000 over 10 rounds.",
            },
            {
              q: "Which animals are in the game?",
              a: "55 species across mammals, birds, reptiles and amphibians — including the Giant Panda, Komodo Dragon, Kakapo, Axolotl, Saiga Antelope and more. Animals are shuffled each game so you get a different set every time.",
            },
            {
              q: "Is Animal Locator multiplayer?",
              a: "Yes — challenge a friend or get matched with a random opponent. Both players see the same animals in the same order, powered by a shared random seed for fairness.",
            },
          ]} />

          <div className="game-seo-section__rules-link">
            <Link href="/animal-locator-rules">📖 Full rules and how to play Animal Locator →</Link>
          </div>

          <RelatedGames currentSlug="/animal-locator" />
        </div>
      </section>
    </>
  );
}
