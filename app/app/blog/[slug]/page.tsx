import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { BLOG_ARTICLES, getArticle } from "@/lib/blog";
import { GAMES } from "@/lib/clips-shared";
import JsonLd from "@/components/JsonLd";
import type { BlogArticle } from "@/lib/blog";

const BASE = "https://ultimate-playground.com";

export function generateStaticParams() {
  const today = new Date().toISOString().slice(0, 10);
  return BLOG_ARTICLES.filter((a) => a.publishDate <= today).map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const article = getArticle(slug);
  if (!article) return {};
  const ogImage = article.game ? `/api/og?game=${article.game}` : `/api/og`;
  return {
    title: article.metaTitle,
    description: article.description,
    alternates: { canonical: `${BASE}/blog/${slug}` },
    openGraph: {
      title: article.metaTitle,
      description: article.description,
      type: "article",
      publishedTime: article.publishDate,
      url: `${BASE}/blog/${slug}`,
      images: [{ url: ogImage, width: 1200, height: 630, alt: article.metaTitle }],
    },
    twitter: {
      card: "summary_large_image",
      title: article.metaTitle,
      description: article.description,
      images: [ogImage],
    },
  };
}

export default async function BlogArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const today = new Date().toISOString().slice(0, 10);
  const article = getArticle(slug);
  if (!article || article.publishDate > today) notFound();

  const game = article.game ? GAMES[article.game] : null;
  const related = article.relatedSlugs
    .map((s) => BLOG_ARTICLES.find((a) => a.slug === s))
    .filter((a): a is BlogArticle => !!a);
  const pageUrl = `${BASE}/blog/${slug}`;

  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: article.title,
    description: article.description,
    url: pageUrl,
    datePublished: article.publishDate,
    dateModified: article.publishDate,
    inLanguage: "en",
    author: {
      "@type": "Organization",
      name: "Ultimate Playground",
      url: BASE,
    },
    publisher: {
      "@type": "Organization",
      name: "Ultimate Playground",
      url: BASE,
    },
    mainEntityOfPage: { "@type": "WebPage", "@id": pageUrl },
    image: article.game ? `${BASE}/api/og?game=${article.game}` : `${BASE}/api/og`,
    keywords: game
      ? `${game.name} clips, ${game.name} highlights, best ${game.name} moments, gaming clips`
      : "gaming clips, gaming highlights, best gaming moments",
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home",  item: BASE },
      { "@type": "ListItem", position: 2, name: "Blog",  item: `${BASE}/blog` },
      { "@type": "ListItem", position: 3, name: article.metaTitle, item: pageUrl },
    ],
  };

  return (
    <main className="gc-main">
      <JsonLd data={[articleSchema, breadcrumbSchema]} />

      <article className="blog-article">
        <header className="blog-article__header">
          <Link href="/blog" className="blog-article__back">
            ← All articles
          </Link>
          {game && (
            <span
              className="blog-article__game-badge"
              style={{ background: game.color, color: game.textColor }}
            >
              {game.name}
            </span>
          )}
          <h1 className="blog-article__title">{article.title}</h1>
          <p className="blog-article__meta">{article.readMinutes} min read</p>
        </header>

        <div
          className="blog-article__content"
          dangerouslySetInnerHTML={{ __html: article.content }}
        />

        {related.length > 0 && (
          <aside className="blog-related">
            <h2 className="blog-related__title">Read next</h2>
            <div className="blog-related__grid">
              {related.map((rel) => {
                const relGame = rel.game ? GAMES[rel.game] : null;
                return (
                  <Link
                    key={rel.slug}
                    href={`/blog/${rel.slug}`}
                    className="blog-related__card"
                    style={{ "--game-color": relGame ? relGame.color : "#6b7280" } as React.CSSProperties}
                  >
                    {relGame && <span className="blog-related__game">{relGame.name}</span>}
                    <span className="blog-related__card-title">{rel.metaTitle}</span>
                    <span className="blog-related__meta">{rel.readMinutes} min read →</span>
                  </Link>
                );
              })}
            </div>
          </aside>
        )}

        <footer className="blog-article__footer">
          <Link href="/" className="blog-article__cta">
            {game ? `Watch the best ${game.name} clips →` : "Browse the best gaming clips →"}
          </Link>
          <Link href="/blog" className="blog-article__back-bottom">
            ← Back to blog
          </Link>
        </footer>
      </article>
    </main>
  );
}
