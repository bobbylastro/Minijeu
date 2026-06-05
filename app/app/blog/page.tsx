import type { Metadata } from "next";
import Link from "next/link";
import { BLOG_ARTICLES } from "@/lib/blog";
import { GAMES } from "@/lib/clips-shared";
import JsonLd from "@/components/JsonLd";

const BASE = "https://ultimate-playground.com";

export const metadata: Metadata = {
  title: "Gaming Clips Blog — Highlights & Guides for Every Major Game",
  description:
    "The gaming clips blog covering Valorant, Apex Legends, CS2, Rocket League, Minecraft and more. Clip culture, highlight breakdowns, and what makes great gaming moments.",
  alternates: { canonical: `${BASE}/blog` },
  openGraph: {
    title: "Gaming Clips Blog — Ultimate Playground",
    description:
      "Clip culture, highlight breakdowns and game guides for the biggest titles right now.",
    url: `${BASE}/blog`,
  },
};

export default function BlogPage() {
  const today = new Date().toISOString().slice(0, 10);
  const published = BLOG_ARTICLES.filter((a) => a.publishDate <= today);

  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: BASE },
      { "@type": "ListItem", position: 2, name: "Blog", item: `${BASE}/blog` },
    ],
  };

  return (
    <main className="gc-main">
      <JsonLd data={breadcrumb} />
      <div className="blog-index">
        <header className="blog-index__header">
          <h1 className="blog-index__title">
            Gaming Clips Blog —{" "}
            <span className="blog-index__title-accent">Highlights & Guides</span>
          </h1>
          <p className="blog-index__subtitle">
            Clip culture, highlight breakdowns, and what makes great gaming moments —
            one game at a time.
          </p>
        </header>

        <div className="blog-index__grid">
          {published.map((article) => {
            const game = article.game ? GAMES[article.game] : null;
            return (
              <Link
                key={article.slug}
                href={`/blog/${article.slug}`}
                className="blog-card"
                style={{ "--game-color": game ? game.color : "#6b7280" } as React.CSSProperties}
              >
                <div className="blog-card__accent" />
                <div className="blog-card__body">
                  {game && <span className="blog-card__game">{game.name}</span>}
                  <h2 className="blog-card__title">{article.title}</h2>
                  <p className="blog-card__desc">{article.description}</p>
                  <span className="blog-card__meta">{article.readMinutes} min read</span>
                </div>
              </Link>
            );
          })}
        </div>

        <div className="blog-index__editorial">

          <section className="blog-index__section">
            <h2 className="blog-index__section-title">
              Why Gaming Clips Have Become the New Highlight Reel
            </h2>
            <p className="blog-index__section-body">
              A great gaming clip does in thirty seconds what a match recap does in ten minutes.
              The Valorant 1v4 with the spike down. The Rocket League ceiling shot on match point.
              The Apex squad wipe through three buildings. Short-form gaming content has overtaken
              traditional esports broadcasts precisely because it captures peak moments in isolation —
              no context needed, no knowledge of the score required. The clip is the new highlight reel,
              and every competitive game now has its own clip language.
            </p>
          </section>

          <section className="blog-index__section">
            <h2 className="blog-index__section-title">
              Clip Culture, Game by Game
            </h2>
            <p className="blog-index__section-body">
              What makes a great <strong>CS2 clip</strong> is different from what makes a great
              <strong> Minecraft clip</strong>. In Counter-Strike, it&apos;s the clutch round — the
              economy, the read, the one-tap through smoke. In Minecraft, it might be a parkour
              survival or a crystal PvP sequence that took months of practice to execute. In
              <strong> League of Legends</strong>, it&apos;s the outplay that happens in 0.3 seconds
              and takes three minutes to explain. Understanding each game&apos;s clip vocabulary is
              what separates a good highlight from one that actually spreads — and that&apos;s exactly
              what these guides are about.
            </p>
          </section>

          <section className="blog-index__section">
            <h2 className="blog-index__section-title">
              Curated Gaming Highlights, Not an Algorithm
            </h2>
            <p className="blog-index__section-body">
              Ultimate Playground exists because most gaming clip platforms optimize for engagement,
              not quality. Every clip that appears in the feed has been reviewed by a human — no
              bot submissions, no recycled content, no engagement-farmed reposts. The result is a
              feed that reflects what the community is actually playing and what moments are genuinely
              worth watching right now. These articles exist for the same reason: to give context to
              the clips, and to help you understand what you&apos;re watching when something
              exceptional happens on screen.
            </p>
          </section>

          <section className="blog-index__section">
            <h2 className="blog-index__section-title">
              Share Your Best Gaming Moments
            </h2>
            <p className="blog-index__section-body">
              Had a game-winning play? A 1v5 that your teammates still can&apos;t believe?
              Ultimate Playground accepts clip submissions from the community. Every submission
              is reviewed personally before going live — no auto-approval, no bots.{" "}
              <a href="/submit" className="blog-index__link">Submit your clip here</a> and
              join the feed.
            </p>
          </section>

        </div>
      </div>
    </main>
  );
}
