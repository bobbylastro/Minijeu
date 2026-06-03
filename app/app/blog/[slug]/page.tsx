import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { BLOG_ARTICLES, getArticle } from "@/lib/blog";
import { GAMES } from "@/lib/clips-shared";

export function generateStaticParams() {
  return BLOG_ARTICLES.map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const article = getArticle(slug);
  if (!article) return {};
  return {
    title: article.metaTitle,
    description: article.description,
    openGraph: {
      title: article.metaTitle,
      description: article.description,
      type: "article",
      publishedTime: article.publishDate,
    },
  };
}

export default async function BlogArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const article = getArticle(slug);
  if (!article) notFound();

  const game = GAMES[article.game];

  return (
    <main className="gc-main">
      <article className="blog-article">
        <header className="blog-article__header">
          <Link href="/blog" className="blog-article__back">
            ← All articles
          </Link>
          <span
            className="blog-article__game-badge"
            style={{ background: game.color, color: game.textColor }}
          >
            {game.name}
          </span>
          <h1 className="blog-article__title">{article.title}</h1>
          <p className="blog-article__meta">{article.readMinutes} min read</p>
        </header>

        <div
          className="blog-article__content"
          dangerouslySetInnerHTML={{ __html: article.content }}
        />

        <footer className="blog-article__footer">
          <Link href="/" className="blog-article__cta">
            Watch the best {game.name} clips →
          </Link>
          <Link href="/blog" className="blog-article__back-bottom">
            ← Back to blog
          </Link>
        </footer>
      </article>
    </main>
  );
}
