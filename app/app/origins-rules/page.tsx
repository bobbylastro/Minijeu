import type { Metadata } from "next";
import Link from "next/link";
import JsonLd from "@/components/JsonLd";

const BASE = "https://ultimate-playground.com";

export const metadata: Metadata = {
  title: "How to Play Origins Quiz — Rules & Scoring",
  description:
    "Complete Origins Quiz rules: a sport, tradition or invention appears — click its country of origin on the world map within 25 seconds. 60+ items across 4 categories explained.",
  openGraph: {
    title: "How to Play Origins Quiz — Where Was It Invented?",
    description: "Learn how to play Origins Quiz: click the country where each sport, dance or invention was born. Full rules and map guide.",
    url: `${BASE}/origins-rules`,
    type: "article",
    images: [{ url: "/origins/opengraph-image", width: 1200, height: 630, alt: "Origins Quiz" }],
  },
};

const STEPS = [
  {
    name: "Choose solo or multiplayer",
    text: "Tap Solo to play alone, or Multiplayer to challenge a real opponent. Both players see the same 10 items drawn from a shared seed for a fair contest.",
  },
  {
    name: "Read the item, category and hint",
    text: "Each round reveals an item — a sport, dance, tradition, festival, invention or cultural practice. Its category (Sports, Dance & Music, Traditions, Inventions) and a short hint are shown alongside the photo.",
  },
  {
    name: "Find the country on the world map",
    text: "You have 25 seconds to locate the country of origin on the interactive map. Zoom in and pan to find smaller or less familiar nations. The timer counts down in real time.",
  },
  {
    name: "Preview before confirming",
    text: "On desktop, hover over any territory to see its name and flag. On mobile, tap a country once to preview, then tap Confirm to lock in your answer.",
  },
  {
    name: "See the result and learn the origin story",
    text: "After each answer, the correct country is highlighted and a brief explanation reveals the cultural context — why Ballet was formalised in France, or how Chess originated in India before spreading westward.",
  },
  {
    name: "Repeat for all 10 rounds",
    text: "New items are drawn randomly each session from a pool of 60+ covering Sports, Dance & Music, Traditions & Festivals, and Inventions & Culture. Every game is a different mix.",
  },
];

export default function OriginsRulesPage() {
  return (
    <>
      <JsonLd data={[
        {
          "@context": "https://schema.org",
          "@type": "WebPage",
          "name": "How to Play Origins Quiz — Rules & Scoring",
          "url": `${BASE}/origins-rules`,
          "description": "Complete guide to Origins Quiz: a sport, tradition or invention appears — click the country of origin on the world map. 60+ items, 25-second timer.",
          "inLanguage": "en",
          "isPartOf": { "@type": "WebSite", "name": "Ultimate Playground", "url": BASE },
        },
        {
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          "itemListElement": [
            { "@type": "ListItem", "position": 1, "name": "Home",         "item": BASE },
            { "@type": "ListItem", "position": 2, "name": "Culture",      "item": `${BASE}/culture` },
            { "@type": "ListItem", "position": 3, "name": "Origins Quiz", "item": `${BASE}/origins` },
            { "@type": "ListItem", "position": 4, "name": "How to Play",  "item": `${BASE}/origins-rules` },
          ],
        },
        {
          "@context": "https://schema.org",
          "@type": "HowTo",
          "name": "How to play Origins Quiz",
          "description": "Origins Quiz shows a sport, tradition or invention — click the country where it originated on the world map within 25 seconds. 10 rounds, 60+ items.",
          "totalTime": "PT5M",
          "step": STEPS.map((s, i) => ({
            "@type": "HowToStep",
            "position": i + 1,
            "name": s.name,
            "text": s.text,
          })),
        },
      ]} />

      <div className="rules-page">
        <nav className="rules-page__breadcrumb" aria-label="Breadcrumb">
          <Link href="/">Home</Link>
          <span>/</span>
          <Link href="/culture">Culture</Link>
          <span>/</span>
          <Link href="/origins">Origins Quiz</Link>
          <span>/</span>
          <span>How to Play</span>
        </nav>

        <div className="rules-page__hero">
          <p className="rules-page__hero-game">🌐 Origins Quiz</p>
          <h1 className="rules-page__hero-title">How to Play Origins Quiz</h1>
          <p className="rules-page__hero-desc">
            A sport, tradition or invention appears — click the country where it was born.
            60+ items across Sports, Music, Festivals and Inventions.
          </p>
          <Link href="/origins" className="rules-page__play-btn">▶ Play Origins Quiz</Link>
        </div>

        <div className="rules-page__inner">

          <div className="rules-page__section">
            <h2 className="rules-page__section-title">Overview</h2>
            <p className="rules-page__p">
              Origins Quiz is a cultural geography game. Each round presents an item from one
              of four categories — Sports, Dance &amp; Music, Traditions &amp; Festivals, or
              Inventions &amp; Culture — along with a photo and a hint. Your task is to click
              the country where it originated on an interactive world map within 25 seconds.
            </p>
            <p className="rules-page__p">
              Items range from the obvious (Sushi → Japan) to the genuinely surprising
              (where was Chess really invented? where did Ballet originate?). Every session
              teaches you something new about cultural history.
            </p>
          </div>

          <div className="rules-page__section">
            <h2 className="rules-page__section-title">What categories are covered?</h2>
            <div className="rules-page__scoring">
              <div className="rules-page__score-row">
                <span className="rules-page__score-label">Sports</span>
                <span className="rules-page__score-value">Tennis, Rugby, Sumo, Taekwondo, Polo…</span>
              </div>
              <div className="rules-page__score-row">
                <span className="rules-page__score-label">Dance &amp; Music</span>
                <span className="rules-page__score-value">Tango, Flamenco, Reggae, Jazz, K-pop…</span>
              </div>
              <div className="rules-page__score-row">
                <span className="rules-page__score-label">Traditions &amp; Festivals</span>
                <span className="rules-page__score-value">Halloween, Diwali, Oktoberfest, Carnival…</span>
              </div>
              <div className="rules-page__score-row">
                <span className="rules-page__score-label">Inventions &amp; Culture</span>
                <span className="rules-page__score-value">Chess, Lego, Origami, Yoga, Sauna…</span>
              </div>
            </div>
          </div>

          <div className="rules-page__section">
            <h2 className="rules-page__section-title">Step-by-step guide</h2>
            <ol className="rules-page__steps">
              {STEPS.map((s, i) => (
                <li key={i} className="rules-page__step">
                  <span className="rules-page__step-num">{i + 1}</span>
                  <div className="rules-page__step-body">
                    <div className="rules-page__step-name">{s.name}</div>
                    <div className="rules-page__step-desc">{s.text}</div>
                  </div>
                </li>
              ))}
            </ol>
          </div>

          <div className="rules-page__section">
            <h2 className="rules-page__section-title">Scoring</h2>
            <div className="rules-page__scoring">
              <div className="rules-page__score-row">
                <span className="rules-page__score-label">Correct country</span>
                <span className="rules-page__score-value">+100 pts</span>
              </div>
              <div className="rules-page__score-row">
                <span className="rules-page__score-label">Wrong country or timeout</span>
                <span className="rules-page__score-value">0 pts</span>
              </div>
              <div className="rules-page__score-row">
                <span className="rules-page__score-label">Timer per round</span>
                <span className="rules-page__score-value">25 seconds</span>
              </div>
              <div className="rules-page__score-row">
                <span className="rules-page__score-label">Maximum total score</span>
                <span className="rules-page__score-value">1,000 pts</span>
              </div>
            </div>
          </div>

          <div className="rules-page__section">
            <h2 className="rules-page__section-title">Tips to score higher</h2>
            <ul className="rules-page__tips">
              <li className="rules-page__tip">Always check the category — it narrows the region significantly. A Traditions item is likely tied to a single country with a strong national identity.</li>
              <li className="rules-page__tip">The hint is your best friend: it usually names a region, city or historical period that pins down the origin.</li>
              <li className="rules-page__tip">For Sports items, think about which country codified the rules, not just where the activity existed informally.</li>
              <li className="rules-page__tip">Zoom in for Central America and Southeast Asia — many cultural origins cluster in countries that are hard to click at default zoom.</li>
            </ul>
          </div>

          <div className="rules-page__cta-wrap">
            <p className="rules-page__cta-text">How many origins can you get right?</p>
            <Link href="/origins" className="rules-page__play-btn">▶ Play Origins Quiz — it&apos;s free</Link>
            <br />
            <Link href="/culture" className="rules-page__game-link">← All Culture games</Link>
          </div>

        </div>
      </div>
    </>
  );
}
