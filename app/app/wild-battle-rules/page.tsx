import type { Metadata } from "next";
import Link from "next/link";
import JsonLd from "@/components/JsonLd";

const BASE = "https://ultimate-playground.com";

export const metadata: Metadata = {
  title: "How to Play Wild Battle — Rules, Modes & Scoring",
  description:
    "Complete Wild Battle rules: animal face-offs, wildlife trivia and wild record sliders. Learn how streak multipliers work and how to maximise your score.",
  openGraph: {
    title: "How to Play Wild Battle — Animal Quiz Rules",
    description: "Learn every Wild Battle game mode: battle rounds, trivia and estimation sliders. Full rules and scoring guide.",
    url: `${BASE}/wild-battle-rules`,
    type: "article",
  },
};

const STEPS = [
  {
    name: "Choose solo or multiplayer",
    text: "Tap Solo to play alone with streak multipliers, or Multiplayer to face a real opponent. Both players see the same 10 rounds from an identical seed. A bot joins if no opponent is found in 30 seconds.",
  },
  {
    name: "Battle round — pick the winner",
    text: "Two animals are shown side by side. Pick the one that would win a real encounter based on biology, size, strength and hunting behaviour. Each answer is grounded in documented animal data.",
  },
  {
    name: "Trivia round — multiple choice",
    text: "A wildlife question appears with four options. Topics include speed records, diving depths, lifespan, diet, venom potency, bite force and animal behaviour. Select your answer before the timer expires.",
  },
  {
    name: "Slider round — estimate the wild record",
    text: "An animal stat question appears — for example, the top speed of a cheetah in km/h, the weight of a blue whale in tonnes, or the lifespan of a giant tortoise in years. Drag the slider to your estimate. Points are awarded based on how close you are.",
  },
  {
    name: "Build a streak for multipliers",
    text: "In solo mode, consecutive correct answers build a streak. Reach 5 in a row to activate a ×1.5 multiplier — every subsequent correct answer earns 1.5× points. Push to 10 in a row and the multiplier rises to ×2.",
  },
  {
    name: "Read the explanation after each round",
    text: "After every answer, a short explanation reveals the science behind the result — why a honey badger outlasts a king cobra, or how a mantis shrimp punch compares to a bullet. Learning is built into every round.",
  },
];

export default function WildBattleRulesPage() {
  return (
    <>
      <JsonLd data={[
        {
          "@context": "https://schema.org",
          "@type": "WebPage",
          "name": "How to Play Wild Battle — Rules & Game Modes",
          "url": `${BASE}/wild-battle-rules`,
          "description": "Complete guide to Wild Battle: animal face-offs, wildlife trivia and estimation sliders with streak multipliers.",
          "inLanguage": "en",
          "isPartOf": { "@type": "WebSite", "name": "Ultimate Playground", "url": BASE },
        },
        {
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          "itemListElement": [
            { "@type": "ListItem", "position": 1, "name": "Home",        "item": BASE },
            { "@type": "ListItem", "position": 2, "name": "Animals",     "item": `${BASE}/animals` },
            { "@type": "ListItem", "position": 3, "name": "Wild Battle", "item": `${BASE}/wild-battle` },
            { "@type": "ListItem", "position": 4, "name": "How to Play", "item": `${BASE}/wild-battle-rules` },
          ],
        },
        {
          "@context": "https://schema.org",
          "@type": "HowTo",
          "name": "How to play Wild Battle",
          "description": "Wild Battle is a 10-round animal quiz mixing battle face-offs, wildlife trivia and estimation sliders, with streak multipliers in solo mode.",
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
          <Link href="/animals">Animals</Link>
          <span>/</span>
          <Link href="/wild-battle">Wild Battle</Link>
          <span>/</span>
          <span>How to Play</span>
        </nav>

        <div className="rules-page__hero">
          <p className="rules-page__hero-game">🦁 Wild Battle</p>
          <h1 className="rules-page__hero-title">How to Play Wild Battle</h1>
          <p className="rules-page__hero-desc">
            10 rounds of animal face-offs, wildlife trivia and wild record sliders.
            Build streaks to multiply your score.
          </p>
          <Link href="/wild-battle" className="rules-page__play-btn">▶ Play Wild Battle</Link>
        </div>

        <div className="rules-page__inner">

          <div className="rules-page__section">
            <h2 className="rules-page__section-title">Overview</h2>
            <p className="rules-page__p">
              Wild Battle is a free online animal quiz with 10 rounds per game mixing three
              formats: battle face-offs, wildlife trivia and estimation sliders. All battle
              outcomes are based on real animal biology and documented behaviour — not guesswork.
            </p>
            <p className="rules-page__p">
              Solo mode rewards consistency with streak multipliers. Multiplayer mode pits you
              against another player with identical questions for a fair fight.
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
                <span className="rules-page__score-label">Correct battle or trivia answer</span>
                <span className="rules-page__score-value">+100 pts</span>
              </div>
              <div className="rules-page__score-row">
                <span className="rules-page__score-label">Slider — perfect estimate</span>
                <span className="rules-page__score-value">+100 pts</span>
              </div>
              <div className="rules-page__score-row">
                <span className="rules-page__score-label">Slider — partial credit (proximity)</span>
                <span className="rules-page__score-value">1 – 99 pts</span>
              </div>
              <div className="rules-page__score-row">
                <span className="rules-page__score-label">Streak 5+ (solo only)</span>
                <span className="rules-page__score-value">×1.5 multiplier</span>
              </div>
              <div className="rules-page__score-row">
                <span className="rules-page__score-label">Streak 10+ (solo only)</span>
                <span className="rules-page__score-value">×2 multiplier</span>
              </div>
              <div className="rules-page__score-row">
                <span className="rules-page__score-label">Wrong answer or timeout</span>
                <span className="rules-page__score-value">0 pts + streak reset</span>
              </div>
            </div>
          </div>

          <div className="rules-page__section">
            <h2 className="rules-page__section-title">Tips to score higher</h2>
            <ul className="rules-page__tips">
              <li className="rules-page__tip">Size is important but not everything — venom, speed and aggression can flip outcomes in surprising matchups.</li>
              <li className="rules-page__tip">For estimation sliders, start with a plausible order of magnitude. A cheetah&apos;s top speed is roughly 110 km/h — few animals exceed that on land.</li>
              <li className="rules-page__tip">Protecting your streak in solo mode is worth more than a single great slider guess — don&apos;t gamble on uncertain answers.</li>
              <li className="rules-page__tip">Read the post-round explanation — patterns in the data will help you on future similar questions.</li>
            </ul>
          </div>

          <div className="rules-page__cta-wrap">
            <p className="rules-page__cta-text">Who wins the animal kingdom? Find out now.</p>
            <Link href="/wild-battle" className="rules-page__play-btn">▶ Play Wild Battle — it&apos;s free</Link>
            <br />
            <Link href="/animals" className="rules-page__game-link">← All Animal games</Link>
          </div>

        </div>
      </div>
    </>
  );
}
