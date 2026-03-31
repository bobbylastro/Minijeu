import type { Metadata } from "next";
import Link from "next/link";
import JsonLd from "@/components/JsonLd";

export const metadata: Metadata = {
  title: "Animal Games — Wildlife Quizzes & Nature Trivia Online",
  description:
    "Free online animal quiz games. Guess who wins animal fights, test your wildlife knowledge and estimate wild facts. Solo & multiplayer. Updated with new animals regularly.",
};

const GAMES = [
  {
    slug: "/wild-battle",
    emoji: "🦁",
    title: "Wild Battle",
    desc: "Two animals face off — pick the winner, answer wildlife trivia and estimate wild records.",
    tags: ["Solo", "Multiplayer"],
  },
];

const OTHER_CATEGORIES = [
  { href: "/sports",     emoji: "🏆", label: "Sports"  },
  { href: "/world",      emoji: "🌍", label: "World"   },
  { href: "/culture",    emoji: "🧠", label: "Culture" },
  { href: "/food-games", emoji: "🍽️", label: "Food"   },
];

const BASE = "https://ultimate-playground.com";

export default function AnimalsPage() {
  return (
    <>
      <JsonLd data={[
        {
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          "name": "Animal Games — Wildlife Quizzes & Nature Trivia",
          "url": `${BASE}/animals`,
          "description": "Free online animal quiz games. Animal battles, wildlife trivia, and wild record estimation games.",
          "inLanguage": "en",
          "publisher": { "@type": "Organization", "name": "Ultimate Playground", "url": BASE },
        },
        {
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          "itemListElement": [
            { "@type": "ListItem", "position": 1, "name": "Home",    "item": BASE },
            { "@type": "ListItem", "position": 2, "name": "Animals", "item": `${BASE}/animals` },
          ],
        },
      ]} />
      <div className="home-page">
        <div className="home-page__content">

          {/* Hero */}
          <div className="cat-page__hero">
            <h1 className="cat-page__h1">🦁 Free Animal Quiz Games — Wildlife Battles & Nature Trivia Online</h1>
            <p className="cat-page__lead">
              From lion vs bear to orca vs great white shark — test your animal knowledge with
              epic face-offs, wildlife trivia and wild record challenges.
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
            <h2>Animal games for nature lovers and wildlife fans</h2>
            <p>
              The Animals category on Ultimate Playground brings the natural world to your screen.
              Whether you grew up watching wildlife documentaries or you just want to settle the
              age-old debate of who would win in a fight, these games test real knowledge about
              animal behaviour, physiology and survival.
            </p>

            <h2>Wild Battle — animal face-offs, trivia and estimation</h2>
            <p>
              Wild Battle packs three game modes into ten rounds. In battle rounds, two animals
              appear side by side — pick the one that wins the fight based on real-world biology.
              Surprising matchups like wolverine vs wolf or honey badger vs king cobra will challenge
              even the most seasoned nature fan. Trivia rounds test everything from diving records to
              dietary habits. Slider rounds ask you to estimate wild facts — how many times faster is
              a cheetah than the fastest human? How deep can a sperm whale dive?
            </p>

            <h2>Real animal facts behind every question</h2>
            <p>
              Every battle outcome in Wild Battle is grounded in documented animal behaviour and
              comparative biology. The game covers over 30 species from six continents, including
              apex predators, record-holders and some of nature&apos;s most surprising fighters.
              After each answer you see the explanation so you learn something new every round.
            </p>

            <h2>Compete in real-time multiplayer</h2>
            <p>
              Wild Battle supports live multiplayer — both players see the same questions powered
              by a shared seed for fairness. Submit your answers, wait for your opponent, and see
              who knows their wildlife better after ten rounds. If no opponent is found within
              30 seconds, a bot opponent steps in so you never wait too long.
            </p>
          </div>

        </div>
      </div>
    </>
  );
}
