import type { Metadata } from "next";
import Link from "next/link";
import JsonLd from "@/components/JsonLd";

const BASE = "https://ultimate-playground.com";

export const metadata: Metadata = {
  title: "How to Play Food Origins — Rules & Scoring",
  description:
    "Complete Food Origins rules: a dish appears, click its country on the world map. 180+ dishes, 30-second timer, 10 rounds. Learn how to navigate the map and score maximum points.",
  openGraph: {
    title: "How to Play Food Origins — Rules & Scoring",
    description: "Learn how to play Food Origins: dish appears, click the map. Full rules, map controls and scoring guide.",
    url: `${BASE}/food-rules`,
    type: "article",
  },
};

const STEPS = [
  {
    name: "Choose solo or multiplayer",
    text: "Tap Solo to play alone, or Multiplayer to face a real opponent. Both players see the same 10 dishes drawn from the same random seed — so the result is always decided by geography knowledge.",
  },
  {
    name: "Study the dish and hint",
    text: "A dish photo appears alongside its name and a short culinary description. Read the hint carefully — it often contains a regional clue, an ingredient or a historical note that narrows down the country.",
  },
  {
    name: "Find the country on the map",
    text: "An interactive world map is displayed. You have 30 seconds to locate the dish's country of origin. Zoom in with the scroll wheel or pinch gesture to find smaller nations. Pan by dragging the map.",
  },
  {
    name: "Preview before confirming",
    text: "Hover over any territory (desktop) to see its name and flag before clicking. On mobile, tap a country once to preview it, then tap the Confirm button to lock in your answer.",
  },
  {
    name: "Click to submit your answer",
    text: "Click or tap the correct country to submit. The map will highlight the correct country and show whether you were right or wrong, along with the distance if you were off.",
  },
  {
    name: "Repeat for all 10 rounds",
    text: "A new dish appears each round. Dishes are drawn at random from a pool of 180+ items covering Africa, Asia, Europe, the Americas and Oceania — every session is different.",
  },
];

export default function FoodRulesPage() {
  return (
    <>
      <JsonLd data={[
        {
          "@context": "https://schema.org",
          "@type": "WebPage",
          "name": "How to Play Food Origins — Rules & Scoring",
          "url": `${BASE}/food-rules`,
          "description": "Complete guide to Food Origins: a dish appears, you click its country of origin on the world map. 180+ dishes, 30-second timer.",
          "inLanguage": "en",
          "isPartOf": { "@type": "WebSite", "name": "Ultimate Playground", "url": BASE },
        },
        {
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          "itemListElement": [
            { "@type": "ListItem", "position": 1, "name": "Home",         "item": BASE },
            { "@type": "ListItem", "position": 2, "name": "Food",         "item": `${BASE}/food-games` },
            { "@type": "ListItem", "position": 3, "name": "Food Origins", "item": `${BASE}/food` },
            { "@type": "ListItem", "position": 4, "name": "How to Play",  "item": `${BASE}/food-rules` },
          ],
        },
        {
          "@context": "https://schema.org",
          "@type": "HowTo",
          "name": "How to play Food Origins",
          "description": "Food Origins shows a dish photo and hint — click its country of origin on the world map within 30 seconds. 10 rounds, 180+ dishes.",
          "totalTime": "PT6M",
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
          <Link href="/food-games">Food</Link>
          <span>/</span>
          <Link href="/food">Food Origins</Link>
          <span>/</span>
          <span>How to Play</span>
        </nav>

        <div className="rules-page__hero">
          <p className="rules-page__hero-game">🍽️ Food Origins</p>
          <h1 className="rules-page__hero-title">How to Play Food Origins</h1>
          <p className="rules-page__hero-desc">
            A dish appears — click its country on the world map. 180+ dishes,
            30 seconds per round, 10 rounds total.
          </p>
          <Link href="/food" className="rules-page__play-btn">▶ Play Food Origins</Link>
        </div>

        <div className="rules-page__inner">

          <div className="rules-page__section">
            <h2 className="rules-page__section-title">Overview</h2>
            <p className="rules-page__p">
              Food Origins is a food geography game where a dish photo and a culinary hint
              appear each round. Your job is to find the country that dish comes from on an
              interactive world map before the 30-second timer expires.
            </p>
            <p className="rules-page__p">
              With over 180 dishes spanning every continent — from Japanese Sushi and Italian
              Pizza to Bhutanese Ema Datshi and Peruvian Ceviche — no two sessions are the same.
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
                <span className="rules-page__score-label">Number of rounds</span>
                <span className="rules-page__score-value">10 rounds</span>
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
              <li className="rules-page__tip">Read the culinary hint first — it often contains a regional ingredient or cooking technique that points directly to the country.</li>
              <li className="rules-page__tip">Zoom in for smaller countries — many dishes come from island nations or landlocked countries that are easy to miss at the default zoom level.</li>
              <li className="rules-page__tip">If the dish name sounds unfamiliar, pay attention to its description: spices like berbere suggest Ethiopia; fermentation techniques suggest Korea or Japan.</li>
              <li className="rules-page__tip">Don&apos;t confuse regional cuisines — many South American dishes look similar, so the hint&apos;s geographic clue is key.</li>
            </ul>
          </div>

          <div className="rules-page__cta-wrap">
            <p className="rules-page__cta-text">How well do you know the world&apos;s cuisines?</p>
            <Link href="/food" className="rules-page__play-btn">▶ Play Food Origins — it&apos;s free</Link>
            <br />
            <Link href="/food-games" className="rules-page__game-link">← All Food games</Link>
          </div>

        </div>
      </div>
    </>
  );
}
