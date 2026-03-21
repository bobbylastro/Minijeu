import type { Metadata } from "next";
import Link from "next/link";
import SeoExpand from "@/components/SeoExpand";
import JsonLd from "@/components/JsonLd";

export const metadata: Metadata = {
  title: "Ultimate Playground – Play free online quiz & mini games",
  description: "Play addictive online quiz games and mini games for free. Guess populations, compare stats, test your knowledge in sports, culture and more on Ultimate Playground.",
};

// ─── Game definitions ──────────────────────────────────────────────────────────
interface GameDef {
  slug: string;
  emoji: string;
  title: string;
  desc: string;
  tags: string[];
  soon?: boolean;
}

const WORLD_GAMES: GameDef[] = [
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

const SPORTS_GAMES: GameDef[] = [
  {
    slug: "/football",
    emoji: "⚽",
    title: "FootballQuiz",
    desc: "Guess transfer fees, compare salaries, identify stadiums and test your trivia.",
    tags: ["Solo", "Multiplayer"],
  },
  {
    slug: "/nba",
    emoji: "🏀",
    title: "NBAQuiz",
    desc: "Guess contracts, compare salaries, identify arenas and test your basketball trivia.",
    tags: ["Solo", "Multiplayer"],
  },
  {
    slug: "/career",
    emoji: "🔀",
    title: "CareerOrder",
    desc: "Drag and drop club badges to reconstruct a footballer's career in chronological order.",
    tags: ["Solo", "Multiplayer"],
  },
];

const CULTURE_GAMES: GameDef[] = [
  {
    slug: "/wcf",
    emoji: "⏳",
    title: "WhatCameFirst?",
    desc: "Two events from sports, tech, history or pop culture — pick the one that happened first.",
    tags: ["Solo", "Multiplayer"],
  },
  {
    slug: "/origins",
    emoji: "🌐",
    title: "Origins Quiz",
    desc: "A sport, tradition or invention appears — click the world map to find where it was born. Sports, music, festivals and more.",
    tags: ["Solo", "Multiplayer"],
  },
  {
    slug: "/wealth",
    emoji: "💰",
    title: "Who's Richer?",
    desc: "Two celebrities appear — tap the one with the higher net worth. Tech billionaires, athletes, musicians and more.",
    tags: ["Solo", "Multiplayer"],
  },
  {
    slug: "/five-clues",
    emoji: "🕵️",
    title: "5 Clues",
    desc: "5 progressive clues, 3 attempts. Guess the famous person — athletes, musicians, actors, historical figures and more.",
    tags: ["Solo", "Multiplayer"],
  },
];

const FOOD_GAMES: GameDef[] = [
  {
    slug: "/food",
    emoji: "🍽️",
    title: "Food Origins",
    desc: "A dish appears — click on the world map to find the country it comes from. 150+ dishes from every continent.",
    tags: ["Solo", "Multiplayer"],
  },
];

// ─── GameCard ──────────────────────────────────────────────────────────────────
function GameCard({ game }: { game: GameDef }) {
  if (game.soon) {
    return (
      <div className="game-card game-card--soon">
        <div className="game-card__header">
          <span className="game-card__emoji">{game.emoji}</span>
          <span className="game-card__title">{game.title}</span>
        </div>
        <p className="game-card__desc">{game.desc}</p>
      </div>
    );
  }

  return (
    <Link href={game.slug} className="game-card game-card--available">
      <div className="game-card__header">
        <span className="game-card__emoji">{game.emoji}</span>
        <span className="game-card__title">{game.title}</span>
      </div>
      <p className="game-card__desc">{game.desc}</p>
      <div className="game-card__footer">
        <div className="game-card__tags">
          {game.tags.map(tag => (
            <span key={tag} className="game-card__tag">{tag}</span>
          ))}
        </div>
        <span className="game-card__cta">Play →</span>
      </div>
    </Link>
  );
}

const CATEGORY_SLUGS: Record<string, string> = {
  World:   "/world",
  Sports:  "/sports",
  Culture: "/culture",
  Food:    "/food-games",
};

// ─── CategorySection ───────────────────────────────────────────────────────────
function CategorySection({
  icon, name, games, soon,
}: {
  icon: string;
  name: string;
  games: GameDef[];
  soon?: boolean;
}) {
  const slug = CATEGORY_SLUGS[name];
  const isSlider = games.length > 3;
  return (
    <section className="category">
      <div className="category__header">
        <span className="category__icon">{icon}</span>
        {slug
          ? <Link href={slug} className="category__name-link">{name}</Link>
          : <span className="category__name">{name}</span>
        }
        {soon && <span className="site-header__soon-badge category__soon-pill">Soon</span>}
        <div className="category__line" />
      </div>
      <div className={`category__games${isSlider ? " category__games--slider" : ""}`}>
        {games.map(g => <GameCard key={g.slug} game={g} />)}
      </div>
    </section>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────
const BASE = "https://ultimate-playground.com";

export default function HomePage() {
  return (
    <>
    <JsonLd data={[
      {
        "@context": "https://schema.org",
        "@type": "CollectionPage",
        "name": "Ultimate Playground – Free Online Quiz & Mini Games",
        "url": BASE,
        "description": "Play free online quiz games and mini games — geography, sports, food, culture and more.",
        "inLanguage": "en",
      },
      {
        "@context": "https://schema.org",
        "@type": "ItemList",
        "name": "Games on Ultimate Playground",
        "itemListElement": [
          { "@type": "ListItem", "position": 1, "name": "CityMix",         "url": `${BASE}/citymix` },
          { "@type": "ListItem", "position": 2, "name": "Higher or Lower", "url": `${BASE}/higher-or-lower` },
          { "@type": "ListItem", "position": 3, "name": "City Mapper",     "url": `${BASE}/city-origins` },
          { "@type": "ListItem", "position": 4, "name": "FootballQuiz",    "url": `${BASE}/football` },
          { "@type": "ListItem", "position": 5, "name": "NBAQuiz",         "url": `${BASE}/nba` },
          { "@type": "ListItem", "position": 6, "name": "CareerOrder",     "url": `${BASE}/career` },
          { "@type": "ListItem", "position": 7, "name": "WhatCameFirst",   "url": `${BASE}/wcf` },
          { "@type": "ListItem", "position": 8, "name": "Food Origins",    "url": `${BASE}/food` },
          { "@type": "ListItem", "position": 9,  "name": "Origins Quiz",    "url": `${BASE}/origins` },
          { "@type": "ListItem", "position": 10, "name": "Who's Richer?",  "url": `${BASE}/wealth` },
          { "@type": "ListItem", "position": 11, "name": "5 Clues",        "url": `${BASE}/five-clues` },
        ],
      },
    ]} />
    <div className="home-page">
      <div className="home-page__content">
        <div className="home-page__hero">
          <h1 className="home-page__title">Ultimate Playground – Play fun and addictive online quiz games</h1>
          <p className="home-page__tagline">Compete &middot; Explore &middot; Learn</p>
        </div>

        <p className="home-page__intro">
          Geography, sports, food culture and history — all in one place. Play solo or challenge friends in real-time multiplayer. No download, no account required.
        </p>

        <main className="categories">
          <CategorySection icon="🌍" name="World"   games={WORLD_GAMES} />
          <CategorySection icon="🏆" name="Sports"  games={SPORTS_GAMES} />
          <CategorySection icon="🧠" name="Culture" games={CULTURE_GAMES} />
          <CategorySection icon="🍽️" name="Food"    games={FOOD_GAMES} />
        </main>

        <section className="seo-section">
          <p>From guessing city populations in CityMix to tracking a footballer&apos;s career in CareerOrder, each game is designed to be simple, competitive and highly addictive. Whether you&apos;re into sports, geography, food culture or general knowledge, there&apos;s always a new challenge waiting for you.</p>

          <p>Play solo or compete with friends in real-time multiplayer modes across all our games.</p>

          <SeoExpand>
            <h2>All games on Ultimate Playground</h2>
            <ul>
              <li><strong>City Mapper</strong> – A city photo appears — click the country it belongs to on the world map. 100 cities, 68 countries</li>
              <li><strong>CityMix</strong> – Guess which city is bigger and estimate its exact population</li>
              <li><strong>Higher or Lower</strong> – Compare countries on population, GDP, area, coastline and more</li>
              <li><strong>Food Origins</strong> – Click on the world map to find the country behind 180+ dishes from every continent</li>
              <li><strong>FootballQuiz</strong> – Guess transfer fees, compare salaries and identify stadiums</li>
              <li><strong>NBAQuiz</strong> – Test yourself on contracts, arenas and basketball trivia</li>
              <li><strong>CareerOrder</strong> – Rebuild a footballer&apos;s career in the correct chronological order</li>
              <li><strong>WhatCameFirst?</strong> – Pick which event happened first across sports, tech, history and pop culture</li>
              <li><strong>Origins Quiz</strong> – Click the country where each sport, tradition or invention was born — 60+ items from around the world</li>
            </ul>

            <h2>Free online mini games for every player</h2>
            <p>Ultimate Playground brings together geography, sports, food and culture challenges in a single browser-based platform. Every game is designed for quick sessions — most rounds take under two minutes — with enough depth to keep you coming back. No download, no account and no payment required.</p>
            <p>All games support real-time multiplayer so you can challenge a friend from anywhere in the world. Both players see the same questions, powered by a shared random seed that guarantees a fair fight every time.</p>
            <p>New games are released regularly. Bookmark the site and check back — there is always a new challenge waiting.</p>
          </SeoExpand>
        </section>
      </div>
    </div>
    </>
  );
}
