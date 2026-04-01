import type { Metadata } from "next";
import Link from "next/link";
import JsonLd from "@/components/JsonLd";

const BASE = "https://ultimate-playground.com";

export const metadata: Metadata = {
  title: "How to Play CareerOrder — Rules & Scoring",
  description:
    "Complete CareerOrder rules: how to drag and drop club badges into the correct chronological order of a footballer's career. Scoring, tips and multiplayer explained.",
  openGraph: {
    title: "How to Play CareerOrder — Football Career Quiz Rules",
    description: "Learn to reconstruct a footballer's career in order. Full rules, scoring and tips for CareerOrder.",
    url: `${BASE}/career-rules`,
    type: "article",
  },
};

const STEPS = [
  {
    name: "Choose solo or multiplayer",
    text: "Tap Solo to play alone across 5 rounds, or Multiplayer to compete against a real opponent with the same sequence of players. A bot joins automatically if no opponent is found within 30 seconds.",
  },
  {
    name: "Read the player card",
    text: "A footballer is revealed at the top of the screen with their name and photo. Below, a pool of club badges shows all the clubs they played for during their career, in random order.",
  },
  {
    name: "Place clubs in chronological order",
    text: "Tap a club badge from the pool to place it in the next available numbered slot. Work from slot 1 (first club) through to the last, reconstructing the exact sequence of the player's career.",
  },
  {
    name: "Adjust if needed",
    text: "Tap any occupied slot to return its badge to the pool. You can rearrange as many times as you like before submitting. There is no timer — take your time.",
  },
  {
    name: "Submit your answer",
    text: "Once all slots are filled, tap Submit to confirm. Your placements are locked and scored immediately.",
  },
  {
    name: "See the results",
    text: "Correct slots turn green with a tick. Incorrect slots turn red and reveal the correct club for that position. Points are awarded based on how many clubs you placed correctly.",
  },
];

export default function CareerRulesPage() {
  return (
    <>
      <JsonLd data={[
        {
          "@context": "https://schema.org",
          "@type": "WebPage",
          "name": "How to Play CareerOrder — Rules & Scoring",
          "url": `${BASE}/career-rules`,
          "description": "Complete guide to CareerOrder: place club badges in the correct chronological order of a footballer's career.",
          "inLanguage": "en",
          "isPartOf": { "@type": "WebSite", "name": "Ultimate Playground", "url": BASE },
        },
        {
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          "itemListElement": [
            { "@type": "ListItem", "position": 1, "name": "Home",        "item": BASE },
            { "@type": "ListItem", "position": 2, "name": "Sports",      "item": `${BASE}/sports` },
            { "@type": "ListItem", "position": 3, "name": "CareerOrder", "item": `${BASE}/career` },
            { "@type": "ListItem", "position": 4, "name": "How to Play", "item": `${BASE}/career-rules` },
          ],
        },
        {
          "@context": "https://schema.org",
          "@type": "HowTo",
          "name": "How to play CareerOrder",
          "description": "CareerOrder challenges you to reconstruct a footballer's club history in the correct chronological order by tapping and placing badges.",
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
          <Link href="/sports">Sports</Link>
          <span>/</span>
          <Link href="/career">CareerOrder</Link>
          <span>/</span>
          <span>How to Play</span>
        </nav>

        <div className="rules-page__hero">
          <p className="rules-page__hero-game">🔀 CareerOrder</p>
          <h1 className="rules-page__hero-title">How to Play CareerOrder</h1>
          <p className="rules-page__hero-desc">
            Reconstruct a footballer&apos;s career club by club, in chronological order.
            5 rounds, drag-and-drop mechanics and real career data.
          </p>
          <Link href="/career" className="rules-page__play-btn">▶ Play CareerOrder</Link>
        </div>

        <div className="rules-page__inner">

          <div className="rules-page__section">
            <h2 className="rules-page__section-title">Overview</h2>
            <p className="rules-page__p">
              CareerOrder is a football career memory game. Each round presents a footballer
              alongside a shuffled pool of club badges from their career. Your task: place
              every badge in the correct slot, from the player&apos;s very first club to their
              last.
            </p>
            <p className="rules-page__p">
              The game covers 25 players ranging from legendary icons to modern stars.
              Some careers are well-known; others will surprise even dedicated fans.
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
                <span className="rules-page__score-label">Each correctly placed club</span>
                <span className="rules-page__score-value">Proportional to total clubs</span>
              </div>
              <div className="rules-page__score-row">
                <span className="rules-page__score-label">Maximum score per round</span>
                <span className="rules-page__score-value">100 pts</span>
              </div>
              <div className="rules-page__score-row">
                <span className="rules-page__score-label">Number of rounds</span>
                <span className="rules-page__score-value">5 rounds</span>
              </div>
              <div className="rules-page__score-row">
                <span className="rules-page__score-label">Maximum total score</span>
                <span className="rules-page__score-value">500 pts</span>
              </div>
            </div>
          </div>

          <div className="rules-page__section">
            <h2 className="rules-page__section-title">Tips to score higher</h2>
            <ul className="rules-page__tips">
              <li className="rules-page__tip">Start with the clubs you are most certain about — anchoring known positions helps you narrow down the rest.</li>
              <li className="rules-page__tip">Loan spells count as separate clubs — a player may have visited the same city twice at different points in their career.</li>
              <li className="rules-page__tip">Youth academies are usually the first slot — most players start at the club where they were trained.</li>
              <li className="rules-page__tip">Think about the player&apos;s age progression: early clubs are typically domestic leagues, peaks in top European leagues, late moves to MLS or Saudi Arabia.</li>
            </ul>
          </div>

          <div className="rules-page__cta-wrap">
            <p className="rules-page__cta-text">Think you know these careers? Find out now.</p>
            <Link href="/career" className="rules-page__play-btn">▶ Play CareerOrder — it&apos;s free</Link>
            <br />
            <Link href="/sports" className="rules-page__game-link">← All Sports games</Link>
          </div>

        </div>
      </div>
    </>
  );
}
