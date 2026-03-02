"use client";
import Link from "next/link";

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

// ─── CategorySection ───────────────────────────────────────────────────────────
function CategorySection({
  icon, name, games, soon,
}: {
  icon: string;
  name: string;
  games: GameDef[];
  soon?: boolean;
}) {
  return (
    <section className="category">
      <div className="category__header">
        <span className="category__icon">{icon}</span>
        <span className="category__name">{name}</span>
        {soon && <span className="site-header__soon-badge category__soon-pill">Soon</span>}
        <div className="category__line" />
      </div>
      <div className="category__games">
        {games.map(g => <GameCard key={g.slug} game={g} />)}
      </div>
    </section>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────
export default function HomePage() {
  return (
    <div className="home-page">
      <div className="home-page__content">
        <div className="home-page__hero">
          <h1 className="home-page__title">Ultimate Playground</h1>
          <p className="home-page__tagline">Compete &middot; Explore &middot; Learn</p>
        </div>

        <main className="categories">
          <CategorySection icon="🌍" name="World"   games={WORLD_GAMES} />
          <CategorySection icon="🏆" name="Sports"  games={SPORTS_GAMES} />
          <CategorySection icon="🧠" name="Culture" games={CULTURE_GAMES} />
        </main>

        <section className="seo-section">
          {/* SEO content — to be added */}
        </section>
      </div>
    </div>
  );
}
