import type { Metadata } from "next";
import Link from "next/link";
import JsonLd from "@/components/JsonLd";

const BASE = "https://ultimate-playground.com";

export const metadata: Metadata = {
  title: "How to Play City Mapper — Rules & Scoring",
  description:
    "Complete City Mapper rules: a city photo appears — click the right country on the world map within 30 seconds. 100 cities, 68 countries, 10 rounds fully explained.",
  openGraph: {
    title: "How to Play City Mapper — Geography Quiz Rules",
    description: "Learn how to play City Mapper: city photo appears, find the country on the map. Full rules, map controls and scoring.",
    url: `${BASE}/city-origins-rules`,
    type: "article",
    images: [{ url: "/city-origins/opengraph-image", width: 1200, height: 630, alt: "City Mapper" }],
  },
};

const STEPS = [
  {
    name: "Choose solo or multiplayer",
    text: "Tap Solo to play alone, or Multiplayer to challenge a real opponent. Both players see the same 10 cities drawn from a shared seed for a fair result.",
  },
  {
    name: "Study the city photo and details",
    text: "A photograph of a city is shown alongside the city name and its population. The photo may show a skyline, a landmark, a street scene or an aerial view — all are real locations.",
  },
  {
    name: "Find the country on the world map",
    text: "You have 30 seconds to locate the country that city belongs to on the interactive world map. Zoom in and pan to find smaller or less familiar nations. The timer counts down in real time.",
  },
  {
    name: "Preview before confirming",
    text: "Hover over any territory (desktop) to see the country name and flag before clicking. On mobile, tap once to preview, then tap Confirm to lock in your answer.",
  },
  {
    name: "See the result",
    text: "The correct country is highlighted. If you were wrong, the distance between your choice and the correct answer is shown so you can learn from the error.",
  },
  {
    name: "Repeat for 10 rounds",
    text: "Cities are drawn at random from a pool of 100 spanning 68 countries and every continent — from Tokyo and New York to Nairobi, Santiago and Ulaanbaatar.",
  },
];

export default function CityOriginsRulesPage() {
  return (
    <>
      <JsonLd data={[
        {
          "@context": "https://schema.org",
          "@type": "WebPage",
          "name": "How to Play City Mapper — Rules & Scoring",
          "url": `${BASE}/city-origins-rules`,
          "description": "Complete guide to City Mapper: a city photo appears — click the country it belongs to on the world map. 100 cities, 30-second timer.",
          "inLanguage": "en",
          "isPartOf": { "@type": "WebSite", "name": "Ultimate Playground", "url": BASE },
        },
        {
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          "itemListElement": [
            { "@type": "ListItem", "position": 1, "name": "Home",        "item": BASE },
            { "@type": "ListItem", "position": 2, "name": "World",       "item": `${BASE}/world` },
            { "@type": "ListItem", "position": 3, "name": "City Mapper", "item": `${BASE}/city-origins` },
            { "@type": "ListItem", "position": 4, "name": "How to Play", "item": `${BASE}/city-origins-rules` },
          ],
        },
        {
          "@context": "https://schema.org",
          "@type": "HowTo",
          "name": "How to play City Mapper",
          "description": "City Mapper shows a city photo — click the country it belongs to on the world map within 30 seconds. 10 rounds, 100 cities from every continent.",
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
          <Link href="/world">World</Link>
          <span>/</span>
          <Link href="/city-origins">City Mapper</Link>
          <span>/</span>
          <span>How to Play</span>
        </nav>

        <div className="rules-page__hero">
          <p className="rules-page__hero-game">🏙️ City Mapper</p>
          <h1 className="rules-page__hero-title">How to Play City Mapper</h1>
          <p className="rules-page__hero-desc">
            A city photo appears — find the country it belongs to on the world map.
            100 cities, 68 countries, 30 seconds per round.
          </p>
          <Link href="/city-origins" className="rules-page__play-btn">▶ Play City Mapper</Link>
        </div>

        <div className="rules-page__inner">

          <div className="rules-page__section">
            <h2 className="rules-page__section-title">Overview</h2>
            <p className="rules-page__p">
              City Mapper is a visual geography quiz. Each round reveals a real city photograph
              alongside the city name and its population. Your task is to click the correct
              country on an interactive world map before the 30-second timer expires.
            </p>
            <p className="rules-page__p">
              The game covers 100 cities spanning every continent — from megacities like
              Shanghai, Mumbai and São Paulo to regional hubs like Almaty, Accra and Medellín.
              The population hint gives you a sense of scale without giving away the location.
            </p>
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
                <span className="rules-page__score-value">30 seconds</span>
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
              <li className="rules-page__tip">Use the population as a clue — a city of 25M is almost certainly in Asia; a city of 500k could be anywhere.</li>
              <li className="rules-page__tip">Architecture and vegetation are helpful: tropical greenery + modern high-rises = Southeast Asia or Sub-Saharan Africa.</li>
              <li className="rules-page__tip">Zoom into Central America, the Caribbean and Southeast Asia early — those countries are small and easy to click on the wrong one.</li>
              <li className="rules-page__tip">If you recognise a famous landmark in the photo, confirm the country immediately — don&apos;t waste the 30 seconds.</li>
            </ul>
          </div>

          <div className="rules-page__cta-wrap">
            <p className="rules-page__cta-text">How many cities can you place on the map?</p>
            <Link href="/city-origins" className="rules-page__play-btn">▶ Play City Mapper — it&apos;s free</Link>
            <br />
            <Link href="/world" className="rules-page__game-link">← All World games</Link>
          </div>

        </div>
      </div>
    </>
  );
}
