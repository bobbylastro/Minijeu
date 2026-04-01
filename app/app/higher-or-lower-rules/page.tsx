import type { Metadata } from "next";
import Link from "next/link";
import JsonLd from "@/components/JsonLd";

const BASE = "https://ultimate-playground.com";

export const metadata: Metadata = {
  title: "How to Play Higher or Lower — Rules & Scoring",
  description:
    "Complete Higher or Lower rules: two countries appear, pick the one that ranks higher on a given stat — population, GDP, area, life expectancy and more. 10 rounds explained.",
  openGraph: {
    title: "How to Play Higher or Lower Countries Game",
    description: "Learn how to play Higher or Lower: compare two countries on population, GDP, area and more. Full rules and scoring guide.",
    url: `${BASE}/higher-or-lower-rules`,
    type: "article",
  },
};

const STEPS = [
  {
    name: "Choose solo or multiplayer",
    text: "Tap Solo to play alone and beat your personal best, or Multiplayer to face a real opponent. Both players see the same 10 pairs drawn from a shared seed.",
  },
  {
    name: "Read the stat being compared",
    text: "At the top of the screen, the current metric is displayed — for example 'Population', 'GDP (USD)', 'Land Area (km²)', 'Coastline (km)' or 'Life Expectancy (years)'. The metric changes every round.",
  },
  {
    name: "Study the two countries",
    text: "Two country cards appear side by side with their flags and names. The metric value is hidden. Use your knowledge of geography, economics and demographics to judge which country ranks higher.",
  },
  {
    name: "Click the higher-ranking country",
    text: "Tap or click the country you believe has the higher value for the current metric. Your choice is locked in immediately.",
  },
  {
    name: "See the result",
    text: "Both values are revealed. The higher country is highlighted green. You score 100 points for a correct answer and 0 for a wrong one. A brief fact about the comparison is shown.",
  },
  {
    name: "Repeat for 10 rounds",
    text: "The metric and country pair change each round. After 10 rounds, your final score is shown alongside your opponent&apos;s score in multiplayer mode.",
  },
];

export default function HigherOrLowerRulesPage() {
  return (
    <>
      <JsonLd data={[
        {
          "@context": "https://schema.org",
          "@type": "WebPage",
          "name": "How to Play Higher or Lower — Rules & Scoring",
          "url": `${BASE}/higher-or-lower-rules`,
          "description": "Complete guide to Higher or Lower: compare two countries on population, GDP, area, coastline and more. Pick the higher one in 10 rounds.",
          "inLanguage": "en",
          "isPartOf": { "@type": "WebSite", "name": "Ultimate Playground", "url": BASE },
        },
        {
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          "itemListElement": [
            { "@type": "ListItem", "position": 1, "name": "Home",           "item": BASE },
            { "@type": "ListItem", "position": 2, "name": "World",          "item": `${BASE}/world` },
            { "@type": "ListItem", "position": 3, "name": "Higher or Lower","item": `${BASE}/higher-or-lower` },
            { "@type": "ListItem", "position": 4, "name": "How to Play",    "item": `${BASE}/higher-or-lower-rules` },
          ],
        },
        {
          "@context": "https://schema.org",
          "@type": "HowTo",
          "name": "How to play Higher or Lower",
          "description": "Higher or Lower shows two countries — pick which one ranks higher on the given stat. 10 rounds covering population, GDP, area, coastline, life expectancy and more.",
          "totalTime": "PT4M",
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
          <Link href="/higher-or-lower">Higher or Lower</Link>
          <span>/</span>
          <span>How to Play</span>
        </nav>

        <div className="rules-page__hero">
          <p className="rules-page__hero-game">📊 Higher or Lower</p>
          <h1 className="rules-page__hero-title">How to Play Higher or Lower</h1>
          <p className="rules-page__hero-desc">
            Two countries, one stat. Pick the one that ranks higher.
            10 rounds covering population, GDP, area and more.
          </p>
          <Link href="/higher-or-lower" className="rules-page__play-btn">▶ Play Higher or Lower</Link>
        </div>

        <div className="rules-page__inner">

          <div className="rules-page__section">
            <h2 className="rules-page__section-title">Overview</h2>
            <p className="rules-page__p">
              Higher or Lower is a free online geography and general knowledge game. Each round
              presents two countries and a specific statistic. Your job is to decide which country
              ranks higher on that metric. Some comparisons are intuitive; others are genuinely
              surprising — and that&apos;s what makes the game addictive.
            </p>
          </div>

          <div className="rules-page__section">
            <h2 className="rules-page__section-title">Stats used in the game</h2>
            <div className="rules-page__scoring">
              <div className="rules-page__score-row">
                <span className="rules-page__score-label">Population</span>
                <span className="rules-page__score-value">Total inhabitants</span>
              </div>
              <div className="rules-page__score-row">
                <span className="rules-page__score-label">GDP</span>
                <span className="rules-page__score-value">Gross Domestic Product (USD)</span>
              </div>
              <div className="rules-page__score-row">
                <span className="rules-page__score-label">Land Area</span>
                <span className="rules-page__score-value">Total area in km²</span>
              </div>
              <div className="rules-page__score-row">
                <span className="rules-page__score-label">Coastline</span>
                <span className="rules-page__score-value">Total coastline in km</span>
              </div>
              <div className="rules-page__score-row">
                <span className="rules-page__score-label">Life Expectancy</span>
                <span className="rules-page__score-value">Average years at birth</span>
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
                <span className="rules-page__score-label">Correct answer</span>
                <span className="rules-page__score-value">+100 pts</span>
              </div>
              <div className="rules-page__score-row">
                <span className="rules-page__score-label">Wrong answer</span>
                <span className="rules-page__score-value">0 pts</span>
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
              <li className="rules-page__tip">Coastline is often counterintuitive — Canada has the world&apos;s longest coastline despite not being the largest country.</li>
              <li className="rules-page__tip">GDP and population don&apos;t always move together — small wealthy nations like Norway can outpace much larger emerging economies.</li>
              <li className="rules-page__tip">Life expectancy tends to be higher in Western Europe, Japan and Australia — use that as a baseline when comparing unfamiliar pairings.</li>
              <li className="rules-page__tip">Land area is the most straightforward stat — but watch out for landlocked countries with large deserts that are easy to underestimate.</li>
            </ul>
          </div>

          <div className="rules-page__cta-wrap">
            <p className="rules-page__cta-text">Think you know your countries? Put it to the test.</p>
            <Link href="/higher-or-lower" className="rules-page__play-btn">▶ Play Higher or Lower — it&apos;s free</Link>
            <br />
            <Link href="/world" className="rules-page__game-link">← All World games</Link>
          </div>

        </div>
      </div>
    </>
  );
}
