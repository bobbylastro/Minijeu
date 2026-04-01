import type { Metadata } from "next";
import Link from "next/link";
import JsonLd from "@/components/JsonLd";

const BASE = "https://ultimate-playground.com";

export const metadata: Metadata = {
  title: "How to Play FootballQuiz — Rules, Modes & Scoring",
  description:
    "Complete FootballQuiz rules: trivia, stadium photos, transfer sliders, salary duels and peak season rounds. Learn every game mode and scoring system before you play.",
  openGraph: {
    title: "How to Play FootballQuiz — Rules & Game Modes",
    description: "Master every FootballQuiz game mode: trivia, stadiums, transfers, salaries and peak seasons. Full rules guide.",
    url: `${BASE}/football-rules`,
    type: "article",
  },
};

const STEPS = [
  {
    name: "Choose solo or multiplayer",
    text: "On the FootballQuiz home screen tap Solo to play alone or Multiplayer to be matched with a random opponent in real time. If no opponent is found within 30 seconds a bot steps in so you never wait.",
  },
  {
    name: "Trivia round — 4 choices",
    text: "A multiple-choice question about football history, culture or records appears. Select one of the four options before the timer expires. Questions cover the Premier League, La Liga, Serie A, Bundesliga, Champions League and international football.",
  },
  {
    name: "Stadium round — name the ground",
    text: "A photograph of a football stadium appears. Identify which club plays there by selecting from the available options. Distinctive architecture, pitch markings and stands are your clues.",
  },
  {
    name: "Transfer round — slide to guess the fee",
    text: "A player and their clubs are shown. Drag the slider to estimate the transfer fee in millions of euros or pounds. Points are awarded based on proximity — the closer you are, the more you earn.",
  },
  {
    name: "Salary round — pick the higher earner",
    text: "Two players appear side by side with their weekly or annual wages hidden. Tap the one you believe earns more. Both salaries are revealed after your answer.",
  },
  {
    name: "Peak season round — guess the year",
    text: "A player and their record-breaking season statistics are shown. Drag the slider to estimate the year of that peak season. After answering, the stat (goals, assists, Ballon d'Or…) and correct year are revealed.",
  },
];

export default function FootballRulesPage() {
  return (
    <>
      <JsonLd data={[
        {
          "@context": "https://schema.org",
          "@type": "WebPage",
          "name": "How to Play FootballQuiz — Rules & Game Modes",
          "url": `${BASE}/football-rules`,
          "description": "Complete rules and guide for FootballQuiz: trivia, stadiums, transfer fees, salary duels and peak season rounds.",
          "inLanguage": "en",
          "isPartOf": { "@type": "WebSite", "name": "Ultimate Playground", "url": BASE },
        },
        {
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          "itemListElement": [
            { "@type": "ListItem", "position": 1, "name": "Home",         "item": BASE },
            { "@type": "ListItem", "position": 2, "name": "Sports",       "item": `${BASE}/sports` },
            { "@type": "ListItem", "position": 3, "name": "FootballQuiz", "item": `${BASE}/football` },
            { "@type": "ListItem", "position": 4, "name": "How to Play",  "item": `${BASE}/football-rules` },
          ],
        },
        {
          "@context": "https://schema.org",
          "@type": "HowTo",
          "name": "How to play FootballQuiz",
          "description": "FootballQuiz is a 10-round online football quiz mixing trivia, stadium identification, transfer fee estimation, salary comparison and peak season guessing.",
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
          <Link href="/football">FootballQuiz</Link>
          <span>/</span>
          <span>How to Play</span>
        </nav>

        <div className="rules-page__hero">
          <p className="rules-page__hero-game">⚽ FootballQuiz</p>
          <h1 className="rules-page__hero-title">How to Play FootballQuiz</h1>
          <p className="rules-page__hero-desc">
            10 rounds. 5 game modes. Trivia, stadiums, transfers, salaries and peak seasons —
            everything you need to know before you play.
          </p>
          <Link href="/football" className="rules-page__play-btn">▶ Play FootballQuiz</Link>
        </div>

        <div className="rules-page__inner">

          <div className="rules-page__section">
            <h2 className="rules-page__section-title">Overview</h2>
            <p className="rules-page__p">
              FootballQuiz is a free online football quiz with 10 rounds per game. Each round
              uses one of five formats — trivia, stadium recognition, transfer fee estimation,
              salary comparison or peak season guessing. The mix keeps every session different
              and rewards a wide range of football knowledge.
            </p>
            <p className="rules-page__p">
              You can play solo against your own score or challenge a real opponent in
              real-time multiplayer. Both players see identical questions drawn from the same
              seed, so the better football knowledge always wins.
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
                <span className="rules-page__score-label">Correct trivia / stadium / salary answer</span>
                <span className="rules-page__score-value">+100 pts</span>
              </div>
              <div className="rules-page__score-row">
                <span className="rules-page__score-label">Transfer or peak slider — perfect guess</span>
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
              <li className="rules-page__tip">For transfer sliders, think in bands of €10M — most fees cluster around round numbers.</li>
              <li className="rules-page__tip">Stadium photos often reveal the era of construction — older grounds have smaller stands and more distinctive quirks.</li>
              <li className="rules-page__tip">Peak season rounds: focus on the player&apos;s prime years — most peaks fall between ages 24 and 30.</li>
              <li className="rules-page__tip">In multiplayer, speed and accuracy both matter — wrong answers cost you more than a slow correct one.</li>
            </ul>
          </div>

          <div className="rules-page__cta-wrap">
            <p className="rules-page__cta-text">Ready to put your football knowledge to the test?</p>
            <Link href="/football" className="rules-page__play-btn">▶ Play FootballQuiz — it&apos;s free</Link>
            <br />
            <Link href="/sports" className="rules-page__game-link">← All Sports games</Link>
          </div>

        </div>
      </div>
    </>
  );
}
