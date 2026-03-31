import type { Metadata } from "next";
import Link from "next/link";
import JsonLd from "@/components/JsonLd";

export const metadata: Metadata = {
  title: "Food Games — Cuisine & Origin Quizzes",
  description:
    "Free online food geography games. A dish appears — click the world map to find the country it comes from. 180+ dishes from every continent. Solo & multiplayer.",
};

const GAMES = [
  {
    slug: "/food",
    emoji: "🍽️",
    title: "Food Origins",
    desc: "A dish appears — click on the world map to find the country it comes from. 180+ dishes from every continent.",
    tags: ["Solo", "Multiplayer"],
  },
];

const OTHER_CATEGORIES = [
  { href: "/world",   emoji: "🌍", label: "World"   },
  { href: "/sports",  emoji: "🏆", label: "Sports"  },
  { href: "/culture", emoji: "🧠", label: "Culture"  },
  { href: "/animals", emoji: "🦁", label: "Animals"  },
];

const BASE = "https://ultimate-playground.com";

export default function FoodGamesPage() {
  return (
    <>
      <JsonLd data={[
        {
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          "name": "Food Games — Cuisine & Origin Quizzes",
          "url": `${BASE}/food-games`,
          "description": "Free online food and cuisine quiz games. Identify dishes and find their country of origin on the world map.",
          "inLanguage": "en",
          "publisher": { "@type": "Organization", "name": "Ultimate Playground", "url": BASE },
        },
        {
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          "itemListElement": [
            { "@type": "ListItem", "position": 1, "name": "Home", "item": BASE },
            { "@type": "ListItem", "position": 2, "name": "Food", "item": `${BASE}/food-games` },
          ],
        },
      ]} />
      <div className="home-page">
      <div className="home-page__content">

        {/* Hero */}
        <div className="cat-page__hero">
          <h1 className="cat-page__h1">🍽️ Free Food Geography Quiz — Guess the Country Behind 180+ Dishes</h1>
          <p className="cat-page__lead">
            Explore the world through its cuisine. Match dishes to their country of origin
            on an interactive map — 180+ recipes from every corner of the globe.
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
          <h2>Food geography — where does your favourite dish come from?</h2>
          <p>
            Every dish tells a story. Sushi evolved over centuries of Japanese tradition. Rendang
            carries the flavours of West Sumatra. Ceviche was born along the Pacific coast of Peru.
            Food Origins puts those stories on the map — literally — and challenges you to connect
            each dish to its country of origin.
          </p>

          <h2>Food Origins — 180+ dishes, one interactive map</h2>
          <p>
            Each round presents a dish photo and a short culinary hint. You have 30 seconds to
            click the correct country on the world map. With over 180 dishes spanning Africa,
            Asia, Europe, the Americas and Oceania, no two sessions are the same.
          </p>
          <p>
            Dishes range from the universally known — Sushi, Pizza, Tacos, Ramen — to the
            genuinely surprising: Bhutanese Ema Datshi, Kazakhstani Beshbarmak, Togolese Amiwo
            and dozens more. Every correct answer teaches you something new about food culture
            around the world.
          </p>

          <h2>The connection between food and geography</h2>
          <p>
            Cuisines are shaped by climate, trade routes, colonisation and migration. The spices
            of the Silk Road gave birth to Persian rice dishes. Portuguese sailors brought
            techniques that transformed Japanese tempura. African peanut stews crossed the
            Atlantic with enslaved people and resurfaced in Brazilian and Caribbean cooking.
            Food Origins helps you see those connections through play.
          </p>

          <h2>Challenge a friend in multiplayer</h2>
          <p>
            Food Origins supports real-time multiplayer. Both players receive the same dishes
            in the same order — seeded for fairness — so the better geography knowledge wins.
            Who has the broader culinary world map? Find out.
          </p>
        </div>

      </div>
    </div>
    </>
  );
}
