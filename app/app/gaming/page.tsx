import type { Metadata } from "next";
import Link from "next/link";
import JsonLd from "@/components/JsonLd";
import FAQ from "@/components/FAQ";

export const metadata: Metadata = {
  title: "Gaming Games — Video Game Quizzes & Tournaments",
  description:
    "Free online gaming games. Run a bracket tournament of 32 legendary video games and discover your personal Top 5. Covers classics from every genre — RPG, FPS, Strategy and more.",
};

const GAMES = [
  {
    slug: "/game-tournament",
    emoji: "🏆",
    title: "Gaming Tournament",
    desc: "32 legendary video games face off head-to-head. Pick your favorites across 5 rounds to crown your ultimate game and reveal your Top 5.",
    tags: ["Solo"],
  },
  {
    slug: "/gaming-mix",
    emoji: "🎮",
    title: "Gaming Mix",
    desc: "Guess the release year of iconic games with a slider, then pick which sold more copies. 10 rounds mixing both question types.",
    tags: ["Solo", "Multiplayer"],
  },
];

const OTHER_CATEGORIES = [
  { href: "/world",      emoji: "🌍", label: "World"   },
  { href: "/sports",     emoji: "🏆", label: "Sports"  },
  { href: "/culture",    emoji: "🧠", label: "Culture" },
  { href: "/food-games", emoji: "🍽️", label: "Food"    },
  { href: "/animals",    emoji: "🦁", label: "Animals" },
];

const BASE = "https://ultimate-playground.com";

export default function GamingPage() {
  return (
    <>
      <JsonLd data={[
        {
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          "name": "Gaming Games — Video Game Quizzes & Tournaments",
          "url": `${BASE}/gaming`,
          "description": "Free online gaming games. Run a bracket tournament of 32 legendary video games to find your personal favorite.",
          "inLanguage": "en",
          "publisher": { "@type": "Organization", "name": "Ultimate Playground", "url": BASE },
        },
        {
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          "itemListElement": [
            { "@type": "ListItem", "position": 1, "name": "Home",   "item": BASE },
            { "@type": "ListItem", "position": 2, "name": "Gaming", "item": `${BASE}/gaming` },
          ],
        },
        {
          "@context": "https://schema.org",
          "@type": "ItemList",
          "name": "Gaming Games on Ultimate Playground",
          "url": `${BASE}/gaming`,
          "numberOfItems": 2,
          "itemListElement": [
            {
              "@type": "ListItem",
              "position": 1,
              "name": "Gaming Tournament",
              "url": `${BASE}/game-tournament`,
              "description": "32 legendary video games face off in a bracket tournament. Crown your ultimate favorite.",
            },
            {
              "@type": "ListItem",
              "position": 2,
              "name": "Gaming Mix",
              "url": `${BASE}/gaming-mix`,
              "description": "Guess the release year with a slider, then pick which game sold more copies. 10 rounds, solo or multiplayer.",
            },
          ],
        },
      ]} />

      <div className="home-page">
        <div className="home-page__content">

          {/* Hero */}
          <div className="cat-page__hero">
            <h1 className="cat-page__h1">🎮 Free Online Gaming Games — Video Game Tournaments & Quizzes</h1>
            <p className="cat-page__lead">
              Settle the debate once and for all — run a 32-game bracket tournament and find out
              which video game is truly your all-time favorite.
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

          {/* Silo */}
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
            <h2>Which video game is your all-time favorite?</h2>
            <p>
              Ranking games is hard — especially when your library spans decades, genres and
              platforms. Gaming Tournament solves that problem with a simple but surprisingly
              revealing format: 32 iconic games are drawn at random and paired up. You pick
              one from each pair. Winners advance. Five rounds later, one game stands alone
              as your undisputed champion.
            </p>

            <h2>Gaming Tournament — 32 classics, 5 rounds, 1 winner</h2>
            <p>
              The bracket is seeded from a pool of 66 legendary games covering every major
              genre — open-world, FPS, RPG, strategy, roguelite, survival, platformer, fighting
              and more. Each session draws a different random 32, so no two tournaments play
              out the same way. Your final Top 5 is calculated from total wins across all rounds.
            </p>
            <p>
              Games in the pool include titles from Rockstar, Valve, FromSoftware, CD Projekt Red,
              Capcom, Bethesda, Larian Studios, Supergiant Games and many more. From Half-Life 2
              to Elden Ring, from Stardew Valley to Cyberpunk 2077 — there is something from
              every era of gaming.
            </p>

            <h2>Why a bracket is the fairest way to rank games</h2>
            <p>
              Asking someone to list their top 10 games from scratch produces inconsistent results
              — it depends on what you were thinking about that day. A bracket forces direct
              comparisons: not &ldquo;which game do I like?&rdquo; but &ldquo;between these two
              specific games, right now, which would I rather play?&rdquo; That constraint produces
              more honest answers.
            </p>
            <p>
              The randomised seeding also surfaces unexpected results. When Terraria goes up against
              Elden Ring in Round 1, you might surprise yourself with your pick.
            </p>

            <h2>More gaming games coming soon</h2>
            <p>
              The Gaming category is growing. Upcoming additions include genre-specific tournaments
              (RPG-only, FPS-only brackets), release year guessing games and studio-based trivia.
              Check back regularly or explore the other categories on{" "}
              <Link href="/">Ultimate Playground</Link> in the meantime.
            </p>

            <FAQ items={[
              {
                q: "Is Gaming Tournament free to play?",
                a: "Yes, Gaming Tournament is completely free. No account, download or payment required — play directly in your browser on desktop or mobile.",
              },
              {
                q: "How are the 32 games chosen each session?",
                a: "The 32 games are drawn randomly from a pool of 66 legendary titles before each session starts. The pool is reshuffled each time, so the matchups change with every playthrough.",
              },
              {
                q: "How is my Top 5 calculated?",
                a: "Your Top 5 is ranked by total wins: the champion won all 5 rounds, the finalist won 4, and so on. When two games have the same number of wins, their position reflects the order they were eliminated.",
              },
              {
                q: "What games are in the pool?",
                a: "The pool includes 66 legendary games from every major genre: GTA V, Red Dead Redemption 2, Elden Ring, The Witcher 3, Cyberpunk 2077, Skyrim, Half-Life 2, Portal 2, Hades, Stardew Valley, Baldur's Gate 3, Hollow Knight and many more.",
              },
              {
                q: "Can I replay the tournament?",
                a: "Yes — each session draws a new random selection of 32 games, so replaying gives a different bracket. Your taste may stay consistent, but the matchups will not.",
              },
            ]} />
          </div>

        </div>
      </div>
    </>
  );
}
