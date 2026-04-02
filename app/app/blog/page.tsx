import type { Metadata } from "next";
import Link from "next/link";
import JsonLd from "@/components/JsonLd";

export const metadata: Metadata = {
  title: "Blog — Online Game Guides & Recommendations | Ultimate Playground",
  description:
    "Discover the best free online quiz games for geography, sports and trivia. Game guides, tips and recommendations from Ultimate Playground.",
  alternates: { canonical: "https://ultimate-playground.com/blog" },
  openGraph: {
    title: "Blog — Online Game Guides & Recommendations | Ultimate Playground",
    description:
      "The best free online quiz games for geography, sports and trivia — curated guides and recommendations from Ultimate Playground.",
    url: "https://ultimate-playground.com/blog",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Blog — Online Game Guides | Ultimate Playground",
    description:
      "Curated guides to the best free online quiz games for geography, sports and trivia.",
  },
};

const BASE = "https://ultimate-playground.com";

const ARTICLES = [
  {
    slug: "/blog/best-online-geography-quiz-games",
    emoji: "🌍",
    tags: ["World", "Guide"],
    title: "Best Free Online Geography Quiz Games (2026)",
    excerpt:
      "From city population sliders to map click challenges — a curated list of the best geography quiz games you can play free in your browser, no download needed.",
    readTime: "5 min read",
    date: "Apr 2, 2026",
  },
  {
    slug: "/blog/best-online-football-quiz-games",
    emoji: "⚽",
    tags: ["Sports", "Guide"],
    title: "Best Free Online Football Quiz Games (2026)",
    excerpt:
      "Transfer fees, stadium photos, salary comparisons and career timelines — the best football quiz games online, ranked by depth and replayability.",
    readTime: "5 min read",
    date: "Apr 2, 2026",
  },
  {
    slug: "/blog/online-trivia-games-to-play-with-friends",
    emoji: "🧠",
    tags: ["Multiplayer", "Guide"],
    title: "Best Online Trivia Games to Play with Friends (2026)",
    excerpt:
      "Looking for a multiplayer trivia game that actually tests your knowledge? Here are the best free online trivia games you can play with friends right now.",
    readTime: "5 min read",
    date: "Apr 2, 2026",
  },
];

export default function BlogIndex() {
  return (
    <>
      <JsonLd data={[
        {
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          "name": "Blog — Online Game Guides & Recommendations",
          "url": `${BASE}/blog`,
          "description": "Guides and recommendations for the best free online quiz games covering geography, sports and trivia.",
          "inLanguage": "en",
          "publisher": { "@type": "Organization", "name": "Ultimate Playground", "url": BASE },
        },
        {
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          "itemListElement": [
            { "@type": "ListItem", "position": 1, "name": "Home", "item": BASE },
            { "@type": "ListItem", "position": 2, "name": "Blog", "item": `${BASE}/blog` },
          ],
        },
        {
          "@context": "https://schema.org",
          "@type": "Blog",
          "name": "Ultimate Playground Blog",
          "url": `${BASE}/blog`,
          "description": "Guides and recommendations for the best free online quiz games.",
          "publisher": { "@type": "Organization", "name": "Ultimate Playground", "url": BASE },
          "blogPost": ARTICLES.map(a => ({
            "@type": "BlogPosting",
            "headline": a.title,
            "url": `${BASE}${a.slug}`,
            "datePublished": "2026-04-02",
            "author": { "@type": "Organization", "name": "Ultimate Playground" },
          })),
        },
      ]} />

      <div className="home-page">
        <div className="home-page__content">

          {/* Hero */}
          <div className="cat-page__hero">
            <h1 className="cat-page__h1">📖 Ultimate Playground Blog</h1>
            <p className="cat-page__lead">
              Guides, rankings and tips to help you find the best free online quiz games —
              geography, sports, trivia and more.
            </p>
          </div>

          {/* Article cards */}
          <div className="blog-index__grid">
            {ARTICLES.map(a => (
              <Link key={a.slug} href={a.slug} className="blog-card">
                <div className="blog-card__tags">
                  {a.tags.map(t => (
                    <span key={t} className="blog-card__tag">{t}</span>
                  ))}
                </div>
                <p className="blog-card__title">{a.emoji} {a.title}</p>
                <p className="blog-card__excerpt">{a.excerpt}</p>
                <div className="blog-card__footer">
                  <span className="blog-card__meta">{a.date} · {a.readTime}</span>
                  <span className="blog-card__cta">Read →</span>
                </div>
              </Link>
            ))}
          </div>

          {/* Silo — explore games */}
          <div className="cat-page__silo">
            <p className="cat-page__silo-title">Explore games by category</p>
            <div className="cat-page__silo-links">
              {[
                { href: "/world",      emoji: "🌍", label: "World"   },
                { href: "/sports",     emoji: "🏆", label: "Sports"  },
                { href: "/culture",    emoji: "🧠", label: "Culture" },
                { href: "/food-games", emoji: "🍽️", label: "Food"    },
                { href: "/animals",    emoji: "🦁", label: "Animals" },
              ].map(c => (
                <Link key={c.href} href={c.href} className="cat-page__silo-link">
                  {c.emoji} {c.label}
                </Link>
              ))}
            </div>
          </div>

        </div>
      </div>
    </>
  );
}
