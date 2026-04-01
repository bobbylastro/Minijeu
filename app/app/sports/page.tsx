import type { Metadata } from "next";
import Link from "next/link";
import JsonLd from "@/components/JsonLd";
import FAQ from "@/components/FAQ";

export const metadata: Metadata = {
  title: "Sports Games — Football & NBA Quizzes",
  description:
    "Free online sports quiz games. Guess transfer fees, NBA contracts, stadium photos and player salaries. Rebuild career timelines in CareerOrder. Solo & multiplayer.",
};

const GAMES = [
  {
    slug: "/football",
    emoji: "⚽",
    title: "FootballQuiz",
    desc: "Guess transfer fees, compare salaries, identify stadiums and test your football trivia.",
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

const OTHER_CATEGORIES = [
  { href: "/world",      emoji: "🌍", label: "World"   },
  { href: "/food-games", emoji: "🍽️", label: "Food"    },
  { href: "/culture",    emoji: "🧠", label: "Culture"  },
  { href: "/animals",    emoji: "🦁", label: "Animals"  },
];

const BASE = "https://ultimate-playground.com";

export default function SportsPage() {
  return (
    <>
      <JsonLd data={[
        {
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          "name": "Sports Games — Football & NBA Quizzes",
          "url": `${BASE}/sports`,
          "description": "Free online football and NBA quiz games. Test your knowledge of transfers, salaries, stadiums and player careers.",
          "inLanguage": "en",
          "publisher": { "@type": "Organization", "name": "Ultimate Playground", "url": BASE },
        },
        {
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          "itemListElement": [
            { "@type": "ListItem", "position": 1, "name": "Home", "item": BASE },
            { "@type": "ListItem", "position": 2, "name": "Sports", "item": `${BASE}/sports` },
          ],
        },
      ]} />
      <div className="home-page">
      <div className="home-page__content">

        {/* Hero */}
        <div className="cat-page__hero">
          <h1 className="cat-page__h1">🏆 Free Sports Quiz Games — Football, NBA & Career Trivia Online</h1>
          <p className="cat-page__lead">
            Football transfers, NBA contracts, stadium photos and career timelines — three games
            that put your sports knowledge to the ultimate test.
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
          <h2>Sports quizzes for football and basketball fans</h2>
          <p>
            Ultimate Playground&apos;s Sports category brings together three games designed for fans
            who want to go beyond just watching. Whether you track transfer windows, follow contract
            negotiations or can name every stadium in Europe, there is a challenge here for you.
          </p>

          <h2>FootballQuiz — transfers, salaries & stadiums</h2>
          <p>
            Ten rounds mixing five game types: trivia questions, transfer fee sliders, stadium
            photo identification, salary comparisons and peak season estimation. FootballQuiz
            covers the full spectrum of football knowledge from the Premier League to La Liga,
            Bundesliga, Serie A and beyond.
          </p>

          <h2>NBAQuiz — contracts, arenas & basketball trivia</h2>
          <p>
            The same fast-paced format applied to the NBA. Guess player contracts in millions,
            identify arenas from a single photo, compare salaries between two stars and recall
            peak seasons. Whether you follow current rosters or NBA history, NBAQuiz will
            challenge what you know.
          </p>

          <h2>CareerOrder — rebuild a player's career timeline</h2>
          <p>
            A footballer&apos;s clubs are shuffled into a random order. Your job is to drag and
            drop the club badges back into chronological sequence. CareerOrder rewards deep
            knowledge of transfer history and career trajectories across clubs and continents.
          </p>

          <h2>Compete in real-time multiplayer</h2>
          <p>
            All Sports games support live multiplayer. Both players see the same questions,
            powered by a shared seed for fairness. Submit your answers, wait for your opponent,
            and see who comes out on top after ten rounds.
          </p>

          <FAQ items={[
            {
              q: "Are the Sports games on Ultimate Playground free?",
              a: "Yes, all three sports games — FootballQuiz, NBAQuiz and CareerOrder — are completely free to play. No account, download or payment is required.",
            },
            {
              q: "Do the Sports games support multiplayer?",
              a: "Yes, all three games support real-time multiplayer. Both players receive the same questions powered by a shared seed, ensuring fair competition. If no opponent is found within 30 seconds, a bot steps in.",
            },
            {
              q: "How often is the sports content updated?",
              a: "New questions, players and data are added regularly to keep the content fresh and relevant to current seasons and transfers.",
            },
          ]} />
        </div>

      </div>
    </div>
    </>
  );
}
