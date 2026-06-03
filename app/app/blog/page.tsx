import type { Metadata } from "next";
import Link from "next/link";
import { BLOG_ARTICLES } from "@/lib/blog";
import { GAMES } from "@/lib/clips-shared";

export const metadata: Metadata = {
  title: "Gaming Blog — Clips, Highlights & Game Guides",
  description:
    "Explore our gaming guides and clip culture articles for Valorant, Apex Legends, CS2, Rocket League, Minecraft and more. Updated regularly.",
  openGraph: {
    title: "Gaming Blog — Ultimate Playground",
    description:
      "Clip culture, game guides and highlight breakdowns for the biggest games right now.",
  },
};

export default function BlogPage() {
  return (
    <main className="gc-main">
      <div className="blog-index">
        <header className="blog-index__header">
          <h1 className="blog-index__title">Gaming Blog</h1>
          <p className="blog-index__subtitle">
            Clip culture, game guides, and what makes each game's highlights special.
          </p>
        </header>

        <div className="blog-index__grid">
          {BLOG_ARTICLES.map((article) => {
            const game = GAMES[article.game];
            return (
              <Link
                key={article.slug}
                href={`/blog/${article.slug}`}
                className="blog-card"
                style={{ "--game-color": game.color } as React.CSSProperties}
              >
                <div className="blog-card__accent" />
                <div className="blog-card__body">
                  <span className="blog-card__game">{game.name}</span>
                  <h2 className="blog-card__title">{article.title}</h2>
                  <p className="blog-card__desc">{article.description}</p>
                  <span className="blog-card__meta">{article.readMinutes} min read</span>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </main>
  );
}
