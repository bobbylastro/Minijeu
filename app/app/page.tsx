import type { Metadata } from "next";
import Link from "next/link";
import SeoExpand from "@/components/SeoExpand";
import JsonLd from "@/components/JsonLd";
import GameSlider from "@/components/GameSlider";

export const metadata: Metadata = {
  title: "Ultimate Playground – Free Online Quiz & Multiplayer Mini Games",
  description: "Play free online quiz and mini games — solo or with friends in private rooms. Geography, sports, animals, food, culture, gaming and more. No download, no sign-up.",
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
    slug: "/hotel-price",
    emoji: "🏨",
    title: "Hotel Price",
    desc: "Real hotel photos from NYC to Bali — slide to guess the nightly rate, or pick the more expensive of two hotels.",
    tags: ["Solo", "Multiplayer"],
  },
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
    desc: "A sport, tradition or invention appears — click the world map to find where it was born.",
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
    desc: "5 progressive clues, 3 attempts. Guess the famous person — athletes, musicians, actors, historical figures.",
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

const ANIMALS_GAMES: GameDef[] = [
  {
    slug: "/wild-battle",
    emoji: "🦁",
    title: "Wild Battle",
    desc: "Two animals face off — pick the winner, then compare speed, weight, bite force and more.",
    tags: ["Solo", "Multiplayer"],
  },
  {
    slug: "/animal-locator",
    emoji: "🗺️",
    title: "Animal Locator",
    desc: "An animal appears — click its home country on the world map. 30 species from pandas to axolotls.",
    tags: ["Solo", "Multiplayer"],
  },
];

const GAMING_GAMES: GameDef[] = [
  {
    slug: "/gaming-mix",
    emoji: "🎮",
    title: "Gaming Mix",
    desc: "4 types of gaming questions: guess the release year, pick the best-seller, identify the studio or pick the older game.",
    tags: ["Solo", "Multiplayer"],
  },
  {
    slug: "/game-tournament",
    emoji: "🏆",
    title: "Gaming Tournament",
    desc: "32 legendary video games battle it out in a 5-round bracket. Pick your favorites and crown your all-time #1.",
    tags: ["Solo"],
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
  Animals: "/animals",
  Gaming:  "/gaming",
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
  const cat  = name.toLowerCase();
  const cards = games.map(g => <GameCard key={g.slug} game={g} />);
  return (
    <section className={`category category--${cat}`}>
      <div className="category__header">
        <span className="category__icon">{icon}</span>
        {slug
          ? <Link href={slug} className="category__name-link">{name}</Link>
          : <span className="category__name">{name}</span>
        }
        {soon && <span className="site-header__soon-badge category__soon-pill">Soon</span>}
        <div className="category__line" />
      </div>
      <GameSlider>{cards}</GameSlider>
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
        "description": "Play free online quiz games and mini games — geography, sports, food, animals, culture, gaming and more.",
        "inLanguage": "en",
      },
      {
        "@context": "https://schema.org",
        "@type": "ItemList",
        "name": "Games on Ultimate Playground",
        "itemListElement": [
          { "@type": "ListItem", "position": 1,  "name": "Hotel Price",          "url": `${BASE}/hotel-price` },
          { "@type": "ListItem", "position": 2,  "name": "CityMix",              "url": `${BASE}/citymix` },
          { "@type": "ListItem", "position": 3,  "name": "Higher or Lower",      "url": `${BASE}/higher-or-lower` },
          { "@type": "ListItem", "position": 4,  "name": "City Mapper",          "url": `${BASE}/city-origins` },
          { "@type": "ListItem", "position": 5,  "name": "FootballQuiz",         "url": `${BASE}/football` },
          { "@type": "ListItem", "position": 6,  "name": "NBAQuiz",              "url": `${BASE}/nba` },
          { "@type": "ListItem", "position": 7,  "name": "CareerOrder",          "url": `${BASE}/career` },
          { "@type": "ListItem", "position": 8,  "name": "WhatCameFirst?",       "url": `${BASE}/wcf` },
          { "@type": "ListItem", "position": 9,  "name": "Origins Quiz",         "url": `${BASE}/origins` },
          { "@type": "ListItem", "position": 10, "name": "Who's Richer?",        "url": `${BASE}/wealth` },
          { "@type": "ListItem", "position": 11, "name": "5 Clues",              "url": `${BASE}/five-clues` },
          { "@type": "ListItem", "position": 12, "name": "Food Origins",         "url": `${BASE}/food` },
          { "@type": "ListItem", "position": 13, "name": "Wild Battle",          "url": `${BASE}/wild-battle` },
          { "@type": "ListItem", "position": 14, "name": "Animal Locator",       "url": `${BASE}/animal-locator` },
          { "@type": "ListItem", "position": 15, "name": "Gaming Mix",           "url": `${BASE}/gaming-mix` },
          { "@type": "ListItem", "position": 16, "name": "Gaming Tournament",    "url": `${BASE}/game-tournament` },
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
          16 free games across geography, sports, food, animals, culture and gaming — play solo or challenge friends in real-time multiplayer. No download, no account required.
        </p>

        <main className="categories">
          <CategorySection icon="🌍" name="World"   games={WORLD_GAMES} />
          <CategorySection icon="🏆" name="Sports"  games={SPORTS_GAMES} />
          <CategorySection icon="🧠" name="Culture" games={CULTURE_GAMES} />
          <CategorySection icon="🍽️" name="Food"    games={FOOD_GAMES} />
          <CategorySection icon="🦁" name="Animals" games={ANIMALS_GAMES} />
          <CategorySection icon="🎮" name="Gaming"  games={GAMING_GAMES} />
        </main>

        <section className="seo-section">
          <p>From guessing city populations in CityMix to tracking a footballer&apos;s career in CareerOrder, each game is designed to be simple, competitive and highly addictive. Whether you&apos;re into sports, geography, food culture, animals or gaming trivia, there&apos;s always a new challenge waiting for you.</p>

          <p>Play solo, jump into a Quick Match against a random opponent, or <strong>create a private room</strong> and invite up to 8 friends with a 4-letter code — no account needed. Every multiplayer game uses a shared random seed so everyone gets the same questions in the same order.</p>

          <SeoExpand>
            <h2>All 16 games on Ultimate Playground</h2>

            <h3>🌍 World &amp; Geography</h3>
            <ul>
              <li><strong>Hotel Price</strong> – Real hotel photos from 40+ cities worldwide. Slide to guess the nightly rate in USD, or pick the most expensive hotel in a battle round.</li>
              <li><strong>CityMix</strong> – Guess which city is bigger, then slide to estimate its exact population. Two challenges per round.</li>
              <li><strong>Higher or Lower</strong> – Compare two countries on population, GDP, area, coastline and more. 10 rounds of head-to-head country data.</li>
              <li><strong>City Mapper</strong> – A city photo appears — click the country it belongs to on the world map. 100 cities across 68 countries.</li>
            </ul>

            <h3>⚽ Sports</h3>
            <ul>
              <li><strong>FootballQuiz</strong> – Guess transfer fees, compare player salaries, identify stadium photos and test your football trivia. 10 rounds mixing 5 question types.</li>
              <li><strong>NBAQuiz</strong> – Test yourself on player contracts, arena photos, salary comparisons and basketball trivia. 10 rounds of NBA knowledge.</li>
              <li><strong>CareerOrder</strong> – Drag and drop club badges to reconstruct a footballer&apos;s career in the correct chronological order. 5 rounds, 25 players.</li>
            </ul>

            <h3>🧠 Culture &amp; History</h3>
            <ul>
              <li><strong>WhatCameFirst?</strong> – Pick which event happened first across sports, tech, history and pop culture. 10 rounds of timeline challenges.</li>
              <li><strong>Origins Quiz</strong> – Click the country where each sport, tradition or invention was born. 60+ items from around the world.</li>
              <li><strong>Who&apos;s Richer?</strong> – Compare the net worth of two celebrities and tap the wealthier one. Tech billionaires, athletes, musicians and more.</li>
              <li><strong>5 Clues</strong> – Five progressive hints, one mystery person. The fewer clues you need, the more points you score. Athletes, musicians, actors and historical figures.</li>
            </ul>

            <h3>🍽️ Food</h3>
            <ul>
              <li><strong>Food Origins</strong> – A dish appears — click the world map to find the country it comes from. 150+ dishes from every continent.</li>
            </ul>

            <h3>🦁 Animals</h3>
            <ul>
              <li><strong>Wild Battle</strong> – Animal face-offs every round: pick the winner, then compare speed, weight, bite force and more. 10 rounds mixing 3 question types.</li>
              <li><strong>Animal Locator</strong> – An animal appears — click its home country on the world map. 30 species from mammals and birds to reptiles and amphibians.</li>
            </ul>

            <h3>🎮 Gaming</h3>
            <ul>
              <li><strong>Gaming Mix</strong> – 4 question types mixed across 10 rounds: guess the release year, pick the best-seller, identify the developer, or pick the older game. Solo &amp; multiplayer.</li>
              <li><strong>Gaming Tournament</strong> – 32 legendary video games battle in a 5-round bracket. Vote for your favorites and crown your all-time #1. Solo.</li>
            </ul>

            <h2>Play online quiz games with friends — private rooms</h2>
            <p>Ultimate Playground supports <strong>private rooms</strong>: create a lobby with a unique 4-letter code, share it with your friends, and compete together in real time with up to 8 players. The host decides when to start; everyone gets the same questions simultaneously. A ranked leaderboard with medals is revealed at the end of every group game.</p>

            <h2>Free online mini games for every player</h2>
            <p>Ultimate Playground brings together geography, sports, food, animals, culture and gaming challenges in a single browser-based platform. Every game is designed for quick sessions — most rounds take under two minutes — with enough depth to keep you coming back. No download, no account and no payment required.</p>
            <p>New games and features are released regularly. Bookmark the site and check back — there is always something new waiting.</p>
          </SeoExpand>
        </section>
      </div>
    </div>
    </>
  );
}
