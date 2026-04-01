import type { Metadata } from "next";
import Link from "next/link";
import JsonLd from "@/components/JsonLd";

const BASE = "https://ultimate-playground.com";

export const metadata: Metadata = {
  title: "How to Play Who's Richer? — Rules & Scoring",
  description:
    "Complete Who's Richer? rules: tap the richer celebrity, estimate net worths, and build streaks for multipliers. 80+ celebrities across 6 categories explained.",
  openGraph: {
    title: "How to Play Who's Richer? — Celebrity Wealth Quiz Rules",
    description: "Learn how Who's Richer? works: duel rounds, estimation rounds, solo survival and multiplayer. Full rules and scoring guide.",
    url: `${BASE}/wealth-rules`,
    type: "article",
  },
};

const STEPS = [
  {
    name: "Choose solo survival or multiplayer",
    text: "In Solo mode, wrong answers end your run — survive as long as possible and build a streak for multipliers. In Multiplayer, both players answer 10 fixed rounds with the same pairs. No bot replacement — if no opponent joins, the game starts anyway.",
  },
  {
    name: "Duel round — tap the richer celebrity",
    text: "Two celebrities appear side by side with their names, photo and category. Their net worths are hidden. Tap the one you believe has the higher net worth. After your answer, both fortunes are revealed in full.",
  },
  {
    name: "Estimation round — pick the correct net worth",
    text: "A single celebrity is shown. Three net worth options are displayed — choose the one closest to their real fortune. The correct figure and a brief wealth summary are revealed after your pick.",
  },
  {
    name: "Build a streak for multipliers (solo only)",
    text: "In Solo mode, consecutive correct answers build a streak counter. Reach 5 in a row to activate a ×1.5 multiplier. Sustain it to 10 in a row and every correct answer earns ×2 points. One wrong answer resets both the streak and the multiplier.",
  },
  {
    name: "Avoid wrong answers in solo mode",
    text: "In Solo mode, a single wrong answer ends the game immediately. Your final score and streak length are shown on the results screen. The goal is to survive as long as possible while the stakes increase.",
  },
  {
    name: "Compare scores in multiplayer",
    text: "In Multiplayer, both players answer the same 10 rounds. Scores accumulate in real time and the final comparison is revealed after the last round.",
  },
];

export default function WealthRulesPage() {
  return (
    <>
      <JsonLd data={[
        {
          "@context": "https://schema.org",
          "@type": "WebPage",
          "name": "How to Play Who's Richer? — Rules & Scoring",
          "url": `${BASE}/wealth-rules`,
          "description": "Complete guide to Who's Richer?: duel rounds, estimation rounds, solo streak multipliers and multiplayer mode. 80+ celebrities from 6 categories.",
          "inLanguage": "en",
          "isPartOf": { "@type": "WebSite", "name": "Ultimate Playground", "url": BASE },
        },
        {
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          "itemListElement": [
            { "@type": "ListItem", "position": 1, "name": "Home",          "item": BASE },
            { "@type": "ListItem", "position": 2, "name": "Culture",       "item": `${BASE}/culture` },
            { "@type": "ListItem", "position": 3, "name": "Who's Richer?", "item": `${BASE}/wealth` },
            { "@type": "ListItem", "position": 4, "name": "How to Play",   "item": `${BASE}/wealth-rules` },
          ],
        },
        {
          "@context": "https://schema.org",
          "@type": "HowTo",
          "name": "How to play Who's Richer?",
          "description": "Who's Richer? shows two celebrities — tap the one with the higher net worth. Solo mode ends on a wrong answer; multiplayer is 10 fixed rounds. Streak multipliers in solo.",
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
          <Link href="/wealth">Who&apos;s Richer?</Link>
          <span>/</span>
          <span>How to Play</span>
        </nav>

        <div className="rules-page__hero">
          <p className="rules-page__hero-game">💰 Who&apos;s Richer?</p>
          <h1 className="rules-page__hero-title">How to Play Who&apos;s Richer?</h1>
          <p className="rules-page__hero-desc">
            Tap the richer celebrity. Survive wrong answers in solo mode.
            80+ billionaires, athletes and entertainment icons.
          </p>
          <Link href="/wealth" className="rules-page__play-btn">▶ Play Who&apos;s Richer?</Link>
        </div>

        <div className="rules-page__inner">

          <div className="rules-page__section">
            <h2 className="rules-page__section-title">Overview</h2>
            <p className="rules-page__p">
              Who&apos;s Richer? is a celebrity net worth quiz. Each round puts two famous people
              side by side — your job is to identify which one is worth more. The game features
              80+ personalities from tech, business, entertainment, music, sports and royalty.
            </p>
            <p className="rules-page__p">
              Solo mode is a survival game — one wrong answer ends your run. Multiplayer is a
              10-round fixed contest where both players face the same pairs simultaneously.
            </p>
          </div>

          <div className="rules-page__section">
            <h2 className="rules-page__section-title">Who&apos;s in the game?</h2>
            <div className="rules-page__scoring">
              {[
                ["Tech", "Elon Musk, Jeff Bezos, Mark Zuckerberg, Bill Gates, Jensen Huang"],
                ["Business", "Warren Buffett, Bernard Arnault, Bloomberg, Ken Griffin"],
                ["Entertainment", "Oprah, George Lucas, Dwayne Johnson, Kim Kardashian"],
                ["Music", "Jay-Z, Taylor Swift, Rihanna, Paul McCartney, Beyoncé"],
                ["Sports", "Michael Jordan, Tiger Woods, LeBron James, Cristiano Ronaldo"],
                ["Royals", "King Charles III, Sheikh Mansour, King Mohammed VI"],
              ].map(([cat, names]) => (
                <div key={cat} className="rules-page__score-row">
                  <span className="rules-page__score-label">{cat}</span>
                  <span className="rules-page__score-value" style={{ fontSize: "11px", textAlign: "right", maxWidth: "55%" }}>{names}</span>
                </div>
              ))}
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
                <span className="rules-page__score-label">Correct duel or estimation answer</span>
                <span className="rules-page__score-value">+100 pts</span>
              </div>
              <div className="rules-page__score-row">
                <span className="rules-page__score-label">Streak 5+ (solo only)</span>
                <span className="rules-page__score-value">×1.5 per correct answer</span>
              </div>
              <div className="rules-page__score-row">
                <span className="rules-page__score-label">Streak 10+ (solo only)</span>
                <span className="rules-page__score-value">×2 per correct answer</span>
              </div>
              <div className="rules-page__score-row">
                <span className="rules-page__score-label">Wrong answer in solo</span>
                <span className="rules-page__score-value">Game over</span>
              </div>
              <div className="rules-page__score-row">
                <span className="rules-page__score-label">Multiplayer — maximum (10 rounds)</span>
                <span className="rules-page__score-value">1,000 pts</span>
              </div>
            </div>
          </div>

          <div className="rules-page__section">
            <h2 className="rules-page__section-title">Tips to score higher</h2>
            <ul className="rules-page__tips">
              <li className="rules-page__tip">Tech billionaires are almost always richer than entertainment celebrities — Elon Musk&apos;s wealth dwarfs most music and sports fortunes.</li>
              <li className="rules-page__tip">Athletes earn big but their net worths are often lower than you think — they spend fast and retire early compared to entrepreneurs.</li>
              <li className="rules-page__tip">In solo mode, prioritise certainty over speed — a slow correct answer is worth infinitely more than a fast wrong one that ends your run.</li>
              <li className="rules-page__tip">Pay attention to the category label — it helps you place celebrities in the right wealth bracket before you even see their names.</li>
            </ul>
          </div>

          <div className="rules-page__cta-wrap">
            <p className="rules-page__cta-text">Think you know who has the biggest fortune?</p>
            <Link href="/wealth" className="rules-page__play-btn">▶ Play Who&apos;s Richer? — it&apos;s free</Link>
            <br />
            <Link href="/culture" className="rules-page__game-link">← All Culture games</Link>
          </div>

        </div>
      </div>
    </>
  );
}
