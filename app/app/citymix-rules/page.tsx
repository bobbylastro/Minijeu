import type { Metadata } from "next";
import Link from "next/link";
import JsonLd from "@/components/JsonLd";

const BASE = "https://ultimate-playground.com";

export const metadata: Metadata = {
  title: "How to Play CityMix — Rules & Scoring",
  description:
    "Complete CityMix rules: compare two cities and guess their populations. Comparison rounds and estimation sliders explained. Max 10,000 pts across 10 rounds.",
  openGraph: {
    title: "How to Play CityMix — City Population Game Rules",
    description: "Learn how CityMix works: pick the larger city, then slide to guess the exact population. Full rules and scoring guide.",
    url: `${BASE}/citymix-rules`,
    type: "article",
  },
};

const STEPS = [
  {
    name: "Choose solo or multiplayer",
    text: "Tap Solo to play alone and chase the maximum score, or Multiplayer to face a real opponent with the same questions from a shared seed.",
  },
  {
    name: "Comparison round — pick the larger city",
    text: "Two cities appear side by side with their names and countries shown. Click the one you believe has the larger population. The correct answer and both populations are revealed immediately.",
  },
  {
    name: "Estimation round — slide to guess the population",
    text: "A single city is shown. Drag the slider to your best estimate of its population. The slider range adjusts to give you a realistic window. Points are awarded based on how close your guess is to the real figure.",
  },
  {
    name: "See your score for the round",
    text: "After each round, your score is shown alongside the correct population and how far off your estimate was. The closer you are, the higher your score for estimation rounds.",
  },
  {
    name: "Repeat for 10 rounds",
    text: "The game alternates between comparison and estimation rounds across 10 total turns. Cities are drawn at random from a large global pool, so the mix is different every session.",
  },
];

export default function CityMixRulesPage() {
  return (
    <>
      <JsonLd data={[
        {
          "@context": "https://schema.org",
          "@type": "WebPage",
          "name": "How to Play CityMix — Rules & Scoring",
          "url": `${BASE}/citymix-rules`,
          "description": "Complete guide to CityMix: pick the larger city or slide to guess its exact population. 10 rounds, max 10,000 pts.",
          "inLanguage": "en",
          "isPartOf": { "@type": "WebSite", "name": "Ultimate Playground", "url": BASE },
        },
        {
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          "itemListElement": [
            { "@type": "ListItem", "position": 1, "name": "Home",    "item": BASE },
            { "@type": "ListItem", "position": 2, "name": "World",   "item": `${BASE}/world` },
            { "@type": "ListItem", "position": 3, "name": "CityMix", "item": `${BASE}/citymix` },
            { "@type": "ListItem", "position": 4, "name": "How to Play", "item": `${BASE}/citymix-rules` },
          ],
        },
        {
          "@context": "https://schema.org",
          "@type": "HowTo",
          "name": "How to play CityMix",
          "description": "CityMix alternates between comparison rounds (pick the larger city) and estimation rounds (slide to guess the exact population). 10 rounds, max 10,000 pts.",
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
          <Link href="/citymix">CityMix</Link>
          <span>/</span>
          <span>How to Play</span>
        </nav>

        <div className="rules-page__hero">
          <p className="rules-page__hero-game">🌍 CityMix</p>
          <h1 className="rules-page__hero-title">How to Play CityMix</h1>
          <p className="rules-page__hero-desc">
            Pick the larger city, then guess its exact population.
            Two formats, 10 rounds, maximum 10,000 points.
          </p>
          <Link href="/citymix" className="rules-page__play-btn">▶ Play CityMix</Link>
        </div>

        <div className="rules-page__inner">

          <div className="rules-page__section">
            <h2 className="rules-page__section-title">Overview</h2>
            <p className="rules-page__p">
              CityMix combines two distinct challenges in one game. Comparison rounds test
              whether you know which of two cities is bigger. Estimation rounds push you
              further — not just picking the right city but guessing how many people actually
              live there.
            </p>
            <p className="rules-page__p">
              The game covers cities from every continent, from megacities with 30 million
              inhabitants to regional capitals with under a million. The variety is what makes
              it genuinely hard to master.
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
                <span className="rules-page__score-label">Comparison round — correct pick</span>
                <span className="rules-page__score-value">+100 pts</span>
              </div>
              <div className="rules-page__score-row">
                <span className="rules-page__score-label">Comparison round — wrong pick</span>
                <span className="rules-page__score-value">0 pts</span>
              </div>
              <div className="rules-page__score-row">
                <span className="rules-page__score-label">Estimation round — perfect guess</span>
                <span className="rules-page__score-value">+1,000 pts</span>
              </div>
              <div className="rules-page__score-row">
                <span className="rules-page__score-label">Estimation round — proximity-based</span>
                <span className="rules-page__score-value">1 – 999 pts</span>
              </div>
              <div className="rules-page__score-row">
                <span className="rules-page__score-label">Maximum total score (10 rounds)</span>
                <span className="rules-page__score-value">10,000 pts</span>
              </div>
            </div>
          </div>

          <div className="rules-page__section">
            <h2 className="rules-page__section-title">Tips to score higher</h2>
            <ul className="rules-page__tips">
              <li className="rules-page__tip">Asian megacities (Tokyo, Delhi, Shanghai, Dhaka) are consistently among the world&apos;s largest — don&apos;t underestimate them.</li>
              <li className="rules-page__tip">African cities are growing fast — Lagos, Kinshasa and Cairo often rank higher than European capitals in comparison rounds.</li>
              <li className="rules-page__tip">For estimation sliders, anchor to a known reference: Paris metro area is ~12M, London ~9M, Berlin ~3.5M — use these to calibrate.</li>
              <li className="rules-page__tip">Don&apos;t confuse city proper population with urban agglomeration — the game uses metro/urban figures, which are much larger.</li>
            </ul>
          </div>

          <div className="rules-page__cta-wrap">
            <p className="rules-page__cta-text">How well do you know the world&apos;s cities?</p>
            <Link href="/citymix" className="rules-page__play-btn">▶ Play CityMix — it&apos;s free</Link>
            <br />
            <Link href="/world" className="rules-page__game-link">← All World games</Link>
          </div>

        </div>
      </div>
    </>
  );
}
