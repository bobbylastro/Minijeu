import { MetadataRoute } from "next";
import { BLOG_ARTICLES } from "@/lib/blog";

const BASE = "https://ultimate-playground.com";
const NOW  = new Date();

export default function sitemap(): MetadataRoute.Sitemap {
  const blogArticles = BLOG_ARTICLES.map((a) => ({
    url: `${BASE}/blog/${a.slug}`,
    lastModified: new Date(a.publishDate),
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));

  return [
    { url: BASE,               lastModified: NOW, changeFrequency: "daily",   priority: 1.0 },
    { url: `${BASE}/blog`,    lastModified: NOW, changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE}/submit`,  lastModified: NOW, changeFrequency: "monthly", priority: 0.6 },
    ...blogArticles,
    { url: `${BASE}/privacy`, lastModified: NOW, changeFrequency: "monthly", priority: 0.3 },
    { url: `${BASE}/terms`,   lastModified: NOW, changeFrequency: "monthly", priority: 0.3 },
    { url: `${BASE}/cookies`, lastModified: NOW, changeFrequency: "monthly", priority: 0.3 },
    { url: `${BASE}/legal`,   lastModified: NOW, changeFrequency: "monthly", priority: 0.3 },
  ];
}
