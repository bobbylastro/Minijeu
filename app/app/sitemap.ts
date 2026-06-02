import { MetadataRoute } from "next";

const BASE = "https://ultimate-playground.com";
const NOW  = new Date();

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: BASE,                lastModified: NOW, changeFrequency: "daily",   priority: 1.0 },
    { url: `${BASE}/submit`,   lastModified: NOW, changeFrequency: "monthly", priority: 0.6 },
    { url: `${BASE}/privacy`, lastModified: NOW, changeFrequency: "monthly", priority: 0.3 },
    { url: `${BASE}/terms`,   lastModified: NOW, changeFrequency: "monthly", priority: 0.3 },
    { url: `${BASE}/cookies`, lastModified: NOW, changeFrequency: "monthly", priority: 0.3 },
    { url: `${BASE}/legal`,   lastModified: NOW, changeFrequency: "monthly", priority: 0.3 },
  ];
}
