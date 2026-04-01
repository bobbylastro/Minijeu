import type { Metadata } from "next";
import Link from "next/link";
import JsonLd from "@/components/JsonLd";
import FAQ from "@/components/FAQ";

export const metadata: Metadata = {
  title: "World Games — Geography & City Challenges",
  description:
    "Play free world geography games online. Guess city populations, compare countries on GDP and area, or find the country behind a city photo. 3 games, solo & multiplayer.",
};

const GAMES = [
  {
    slug: "/citymix",
    emoji: "🌍",
    title: "CityMix",
    desc: "Pick the larger city, then slide to guess its exact population.",
    tags: ["Solo", "Multiplayer"],
  },
  {
    slug: "/higher-or-lower",
    emoji: "📊",
    title: "Higher or Lower",
    desc: "Compare two countries on population, GDP, area, coastline and more.",
    tags: ["Solo", "Multiplayer"],
  },
  {
    slug: "/city-origins",
    emoji: "🏙️",
    title: "City Mapper",
    desc: "A city photo appears — click the world map to find the country it belongs to. 100 cities from every continent.",
    tags: ["Solo", "Multiplayer"],
  },
];

const OTHER_CATEGORIES = [
  { href: "/sports",     emoji: "🏆", label: "Sports"  },
  { href: "/food-games", emoji: "🍽️", label: "Food"    },
  { href: "/culture",    emoji: "🧠", label: "Culture"  },
  { href: "/animals",    emoji: "🦁", label: "Animals"  },
];

const BASE = "https://ultimate-playground.com";

export default function WorldPage() {
  return (
    <>
      <JsonLd data={[
        {
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          "name": "World Games — Geography & City Challenges",
          "url": `${BASE}/world`,
          "description": "Free online geography and city quiz games. Guess populations, compare countries and find cities on the map.",
          "inLanguage": "en",
          "publisher": { "@type": "Organization", "name": "Ultimate Playground", "url": BASE },
        },
        {
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          "itemListElement": [
            { "@type": "ListItem", "position": 1, "name": "Home", "item": BASE },
            { "@type": "ListItem", "position": 2, "name": "World", "item": `${BASE}/world` },
          ],
        },
      ]} />
      <div className="home-page">
      <div className="home-page__content">

        {/* Hero */}
        <div className="cat-page__hero">
          <h1 className="cat-page__h1">🌍 Free World Geography Quiz Games — Cities, Countries & Map Challenges</h1>
          <p className="cat-page__lead">
            Geography challenges, city quizzes and country comparisons — test everything you know
            about the world, from population stats to city landmarks.
          </p>
        </div>

        {/* Game cards */}
        <div className="category__games">
          {GAMES.map(g => (
            <Link key={g.slug} href={g.slug} className="game-card game-card--available">
              <div className="game-card__header">
                <span className="game-card__emoji">{g.emoji}</span>
                <span className="game-card__title">{g.title}</span>
              </div>
              <p className="game-card__desc">{g.desc}</p>
              <div className="game-card__footer">
                <div className="game-card__tags">
                  {g.tags.map(t => <span key={t} className="game-card__tag">{t}</span>)}
                </div>
                <span className="game-card__cta">Play →</span>
              </div>
            </Link>
          ))}
        </div>

        {/* Silo — other categories */}
        <div className="cat-page__silo">
          <p className="cat-page__silo-title">Explore other categories</p>
          <div className="cat-page__silo-links">
            {OTHER_CATEGORIES.map(c => (
              <Link key={c.href} href={c.href} className="cat-page__silo-link">
                {c.emoji} {c.label}
              </Link>
            ))}
          </div>
        </div>

        {/* SEO content */}
        <div className="cat-page__seo">
          <h2>Geography games for every level</h2>
          <p>
            Whether you are a seasoned geography buff or just curious about the world, Ultimate
            Playground&apos;s World category has something for you. Our three geography games each
            challenge a different skill — population estimation, country statistics, and visual
            city recognition — so you can mix up your sessions and never get bored.
          </p>

          <h2>CityMix — pick the bigger city</h2>
          <p>
            Two cities appear side by side. Which one is larger? Once you pick, a slider lets you
            estimate the exact population. CityMix blends binary decision-making with a numerical
            estimation mechanic, making every round feel unique even when you revisit cities
            you&apos;ve already seen.
          </p>

          <h2>Higher or Lower — compare countries</h2>
          <p>
            Does France have a higher GDP than Argentina? Is Canada&apos;s coastline longer than
            Norway&apos;s? Higher or Lower puts two countries head to head across six different
            statistics — population, GDP, area, coastline, life expectancy and more. A perfect
            game for anyone who loves data and world geography.
          </p>

          <h2>City Mapper — find the country behind the photo</h2>
          <p>
            A city photo and its name appear on screen. Your job: click the correct country on
            the interactive world map before the timer runs out. With 100 cities across 68
            countries and continents, City Mapper tests your spatial geography knowledge in a
            fast-paced, visual format.
          </p>

          <h2>Play solo or challenge a friend</h2>
          <p>
            All three World games support real-time multiplayer. Both players face the same
            questions thanks to a shared seed, so the competition is always fair. Race to out-guess
            your opponent and claim the top score.
          </p>

          <FAQ items={[
            {
              q: "Are the World games free to play?",
              a: "Yes, CityMix, Higher or Lower and City Mapper are all completely free. No account or download required — play instantly in any browser on desktop or mobile.",
            },
            {
              q: "What geography topics do the World games cover?",
              a: "The three games cover different areas: city population sizes and comparisons (CityMix), country statistics like GDP, area and life expectancy (Higher or Lower), and visual city-to-country mapping (City Mapper).",
            },
            {
              q: "Do the World games support multiplayer?",
              a: "Yes — all three World games support real-time multiplayer. Both players face the same questions from a shared seed, so the result is always decided by knowledge, not luck.",
            },
          ]} />
        </div>

      </div>
    </div>
    </>
  );
}
