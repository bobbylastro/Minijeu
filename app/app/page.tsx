import type { Metadata } from "next";
import Link from "next/link";
import SeoExpand from "@/components/SeoExpand";

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
          <h1 className="home-page__title">Ultimate Playground – Play fun and addictive online quiz games</h1>
          <p className="home-page__tagline">Compete &middot; Explore &middot; Learn</p>
        </div>

        <p className="home-page__intro">
          Ultimate Playground is your go-to platform for quick, fun and challenging online games. Test your knowledge on sports, geography and food culture, compare stats, and challenge friends in real-time multiplayer — all playable instantly in your browser.
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
            <h2>Featured Games</h2>
            <ul>
              <li><strong>Food Origins</strong> – Click on the world map to find the country behind 150+ dishes from every continent</li>
              <li><strong>CityMix</strong> – Guess which city is bigger and estimate its population</li>
              <li><strong>Higher or Lower</strong> – Compare countries based on population, GDP and more</li>
              <li><strong>FootballQuiz</strong> – Test your football knowledge with transfers, salaries and stadiums</li>
              <li><strong>NBAQuiz</strong> – Challenge yourself on contracts, arenas and basketball trivia</li>
              <li><strong>CareerOrder</strong> – Rebuild a player&apos;s career in the correct chronological order</li>
              <li><strong>WhatCameFirst</strong> – Choose which event happened first across sports, tech and history</li>
            </ul>

            <h2>Free Online Mini Games for Every Player</h2>
            <p>Ultimate Playground offers a wide range of free online mini games designed for quick sessions and endless replayability. Our games combine trivia, geography, estimation and logic challenges to create engaging experiences for all players.</p>
            <p>Whether you enjoy food geography quizzes, sports trivia, higher or lower challenges or population guessing games, you&apos;ll find something to play anytime.</p>
            <p>New games are added regularly, making Ultimate Playground a growing hub for browser-based games you can enjoy without downloading anything.</p>
          </SeoExpand>
        </section>
      </div>
    </div>
  );
}
