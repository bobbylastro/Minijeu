import type { Metadata } from "next";
import Link from "next/link";
import JsonLd from "@/components/JsonLd";

const BASE = "https://ultimate-playground.com";

export const metadata: Metadata = {
  title: "How to Play NBAQuiz — Rules, Modes & Scoring",
  description:
    "Complete NBAQuiz rules: trivia, arena photos, contract sliders, salary duels and peak season rounds. Learn every game mode and how scoring works before you play.",
  openGraph: {
    title: "How to Play NBAQuiz — Rules & Game Modes",
    description: "Master every NBAQuiz game mode: trivia, arenas, contracts, salaries and peak seasons. Full rules guide.",
    url: `${BASE}/nba-rules`,
    type: "article",
  },
};

const STEPS = [
  {
    name: "Choose solo or multiplayer",
    text: "Tap Solo to play alone or Multiplayer to face a real opponent in real time. If no one is found within 30 seconds, a bot opponent joins automatically.",
  },
  {
    name: "Trivia round — 4 choices",
    text: "A multiple-choice question about NBA history, records or culture appears. Select one of the four options before the timer runs out. Questions span current rosters, legendary careers, championships and statistical milestones.",
  },
  {
    name: "Arena round — identify the venue",
    text: "A photo of an NBA arena is shown. Identify which franchise plays there from the available options. Seat colours, court designs and distinctive architectural features are your clues.",
  },
  {
    name: "Contract round — slide to guess the value",
    text: "A player and their team are shown. Drag the slider to estimate the total contract value in millions of dollars. The closer your guess, the more points you earn.",
  },
  {
    name: "Salary round — pick the higher earner",
    text: "Two players appear side by side with their annual salaries hidden. Tap the one you believe earns more this season. Both figures are revealed after your pick.",
  },
  {
    name: "Peak season round — guess the year",
    text: "A player&apos;s record season stats are shown (points per game, assists, MVP…). Drag the slider to estimate which year that peak took place. The correct year and full context are revealed after you answer.",
  },
];

export default function NBARulesPage() {
  return (
    <>
      <JsonLd data={[
        {
          "@context": "https://schema.org",
          "@type": "WebPage",
          "name": "How to Play NBAQuiz — Rules & Game Modes",
          "url": `${BASE}/nba-rules`,
          "description": "Complete rules and guide for NBAQuiz: trivia, arenas, contracts, salaries and peak season rounds.",
          "inLanguage": "en",
          "isPartOf": { "@type": "WebSite", "name": "Ultimate Playground", "url": BASE },
        },
        {
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          "itemListElement": [
            { "@type": "ListItem", "position": 1, "name": "Home",    "item": BASE },
            { "@type": "ListItem", "position": 2, "name": "Sports",  "item": `${BASE}/sports` },
            { "@type": "ListItem", "position": 3, "name": "NBAQuiz", "item": `${BASE}/nba` },
            { "@type": "ListItem", "position": 4, "name": "How to Play", "item": `${BASE}/nba-rules` },
          ],
        },
        {
          "@context": "https://schema.org",
          "@type": "HowTo",
          "name": "How to play NBAQuiz",
          "description": "NBAQuiz is a 10-round online basketball quiz mixing trivia, arena identification, contract estimation, salary comparison and peak season guessing.",
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
          <Link href="/sports">Sports</Link>
          <span>/</span>
          <Link href="/nba">NBAQuiz</Link>
          <span>/</span>
          <span>How to Play</span>
        </nav>

        <div className="rules-page__hero">
          <p className="rules-page__hero-game">🏀 NBAQuiz</p>
          <h1 className="rules-page__hero-title">How to Play NBAQuiz</h1>
          <p className="rules-page__hero-desc">
            10 rounds. 5 game modes. Trivia, arenas, contracts, salaries and peak seasons —
            everything a basketball fan needs to know.
          </p>
          <Link href="/nba" className="rules-page__play-btn">▶ Play NBAQuiz</Link>
        </div>

        <div className="rules-page__inner">

          <div className="rules-page__section">
            <h2 className="rules-page__section-title">Overview</h2>
            <p className="rules-page__p">
              NBAQuiz is a free online basketball quiz with 10 rounds per game. Each round uses
              one of five formats — trivia, arena recognition, contract estimation, salary
              comparison or peak season guessing. Questions cover current stars, all-time greats
              and every NBA franchise.
            </p>
            <p className="rules-page__p">
              Play solo to beat your personal best or face a real opponent in real-time
              multiplayer. Both players see the same questions, generated from a shared seed
              for fair competition.
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
                <span className="rules-page__score-label">Correct trivia / arena / salary answer</span>
                <span className="rules-page__score-value">+100 pts</span>
              </div>
              <div className="rules-page__score-row">
                <span className="rules-page__score-label">Contract or peak slider — perfect guess</span>
                <span className="rules-page__score-value">+100 pts</span>
              </div>
              <div className="rules-page__score-row">
                <span className="rules-page__score-label">Slider — partial credit (proximity-based)</span>
                <span className="rules-page__score-value">1 – 99 pts</span>
              </div>
              <div className="rules-page__score-row">
                <span className="rules-page__score-label">Wrong answer or timeout</span>
                <span className="rules-page__score-value">0 pts</span>
              </div>
              <div className="rules-page__score-row">
                <span className="rules-page__score-label">Maximum per game (10 rounds)</span>
                <span className="rules-page__score-value">1,000 pts</span>
              </div>
            </div>
          </div>

          <div className="rules-page__section">
            <h2 className="rules-page__section-title">Tips to score higher</h2>
            <ul className="rules-page__tips">
              <li className="rules-page__tip">For contract sliders, max deals cluster around $200–250M — supermax contracts are the ceiling.</li>
              <li className="rules-page__tip">Arena photos: look at court colour and logo design — each franchise has distinctive branding.</li>
              <li className="rules-page__tip">Peak season: most NBA primes fall between ages 25 and 32 — use the player&apos;s career timeline as a guide.</li>
              <li className="rules-page__tip">In salary rounds, role players on recent extensions can earn more than you expect — don&apos;t assume stars always win.</li>
            </ul>
          </div>

          <div className="rules-page__cta-wrap">
            <p className="rules-page__cta-text">Ready to test your basketball knowledge?</p>
            <Link href="/nba" className="rules-page__play-btn">▶ Play NBAQuiz — it&apos;s free</Link>
            <br />
            <Link href="/sports" className="rules-page__game-link">← All Sports games</Link>
          </div>

        </div>
      </div>
    </>
  );
}
