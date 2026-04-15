import type { Metadata } from "next";
import Link from "next/link";
import JsonLd from "@/components/JsonLd";

const BASE = "https://ultimate-playground.com";

export const metadata: Metadata = {
  title: "How to Play Gaming Mix — Rules & Scoring",
  description:
    "Complete Gaming Mix rules: 4 round types — release year slider, best-seller battle, guess the studio and which game came first. 10 rounds, full scoring breakdown.",
  openGraph: {
    title: "How to Play Gaming Mix — Rules & Scoring",
    description: "Learn how to play Gaming Mix: release year slider + best-seller battle. Full rules and scoring guide.",
    url: `${BASE}/gaming-mix-rules`,
    type: "article",
  },
};

const STEPS = [
  {
    name: "Choose Solo or Multiplayer",
    text: "Tap Solo to play alone, or Multiplayer to face a real opponent. Both players draw the same 10 rounds from the same random seed — so the result is decided purely by gaming knowledge.",
  },
  {
    name: "Read the round type badge",
    text: "Each round is one of four types — Release Year, Best Seller Battle, Guess the Studio or Which Came First. The coloured badge in the top-right corner shows which type is active before you see the question.",
  },
  {
    name: "Release Year — drag the slider",
    text: "A game cover, title and studio appear on screen. Drag the slider between 1990 and 2024 to guess the release year. You have 30 seconds. When you're confident, tap Lock In. Being close still scores points.",
  },
  {
    name: "Best Seller Battle — click the bigger seller",
    text: "Two game covers appear side by side. Pick the one that sold more copies worldwide. After you click, both sales figures are revealed. Longevity and platform breadth often matter more than critical acclaim.",
  },
  {
    name: "Guess the Studio — pick the right developer",
    text: "A game cover is shown with four studio options. Select the studio that developed it. Questions cover well-known publishers and cult indie studios alike.",
  },
  {
    name: "Which Came First — pick the earlier release",
    text: "Two game covers appear side by side. Pick the one that was released first. The correct years are revealed after your answer — the gap is often more surprising than you expect.",
  },
  {
    name: "See your score and continue",
    text: "Your points appear immediately after each round. Tap Next Round to continue. After 10 rounds the final scoreboard shows your total — and your opponent's in multiplayer.",
  },
];

export default function GamingMixRulesPage() {
  return (
    <>
      <JsonLd data={[
        {
          "@context": "https://schema.org",
          "@type": "WebPage",
          "name": "How to Play Gaming Mix — Rules & Scoring",
          "url": `${BASE}/gaming-mix-rules`,
          "description": "Complete guide to Gaming Mix: release year slider and best-seller battle. 10 rounds, full scoring.",
          "inLanguage": "en",
          "isPartOf": { "@type": "WebSite", "name": "Ultimate Playground", "url": BASE },
        },
        {
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          "itemListElement": [
            { "@type": "ListItem", "position": 1, "name": "Home",       "item": BASE },
            { "@type": "ListItem", "position": 2, "name": "Gaming",     "item": `${BASE}/gaming` },
            { "@type": "ListItem", "position": 3, "name": "Gaming Mix", "item": `${BASE}/gaming-mix` },
            { "@type": "ListItem", "position": 4, "name": "How to Play","item": `${BASE}/gaming-mix-rules` },
          ],
        },
        {
          "@context": "https://schema.org",
          "@type": "HowTo",
          "name": "How to play Gaming Mix",
          "description": "Gaming Mix mixes four round types across 10 rounds: Release Year (slider), Best Seller Battle, Guess the Studio and Which Came First.",
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
          <Link href="/gaming">Gaming</Link>
          <span>/</span>
          <Link href="/gaming-mix">Gaming Mix</Link>
          <span>/</span>
          <span>How to Play</span>
        </nav>

        <div className="rules-page__hero">
          <p className="rules-page__hero-game">🎮 Gaming Mix</p>
          <h1 className="rules-page__hero-title">How to Play Gaming Mix</h1>
          <p className="rules-page__hero-desc">
            Release year slider, best-seller battle, studio guessing and which came first.
            10 rounds mixing four question types, solo or multiplayer.
          </p>
          <Link href="/gaming-mix" className="rules-page__play-btn">▶ Play Gaming Mix</Link>
        </div>

        <div className="rules-page__inner">

          <div className="rules-page__section">
            <h2 className="rules-page__section-title">Overview</h2>
            <p className="rules-page__p">
              Gaming Mix tests four kinds of video game knowledge across 10 rounds. Release Year
              rounds ask you to drag a slider to the year a game launched — being close still
              earns points. Best Seller Battle rounds put two games head-to-head on global sales.
              Guess the Studio rounds challenge you to identify the developer from four options.
              Which Came First rounds show two games and ask which was released earlier.
            </p>
            <p className="rules-page__p">
              Each session draws 10 rounds from a pool of 85+ iconic games. The four types are
              mixed and shuffled every time, so no two sessions play out the same way.
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

            <p className="rules-page__p" style={{ marginBottom: "0.75rem", fontWeight: 700 }}>Release Year (3 rounds)</p>
            <div className="rules-page__scoring">
              <div className="rules-page__score-row"><span className="rules-page__score-label">Exact year</span><span className="rules-page__score-value" style={{ color: "#22c55e" }}>100 pts 🎯</span></div>
              <div className="rules-page__score-row"><span className="rules-page__score-label">Off by 1 year</span><span className="rules-page__score-value">80 pts</span></div>
              <div className="rules-page__score-row"><span className="rules-page__score-label">Off by 2 years</span><span className="rules-page__score-value">60 pts</span></div>
              <div className="rules-page__score-row"><span className="rules-page__score-label">Off by 3 years</span><span className="rules-page__score-value">40 pts</span></div>
              <div className="rules-page__score-row"><span className="rules-page__score-label">Off by 4 years</span><span className="rules-page__score-value">20 pts</span></div>
              <div className="rules-page__score-row"><span className="rules-page__score-label">Off by 5+ years</span><span className="rules-page__score-value" style={{ color: "#fb7185" }}>0 pts</span></div>
            </div>

            <p className="rules-page__p" style={{ marginTop: "1.25rem", marginBottom: "0.75rem", fontWeight: 700 }}>Best Seller Battle (3 rounds)</p>
            <div className="rules-page__scoring">
              <div className="rules-page__score-row"><span className="rules-page__score-label">Correct pick</span><span className="rules-page__score-value" style={{ color: "#22c55e" }}>100 pts</span></div>
              <div className="rules-page__score-row"><span className="rules-page__score-label">Wrong pick or timeout</span><span className="rules-page__score-value">0 pts</span></div>
            </div>

            <p className="rules-page__p" style={{ marginTop: "1.25rem", marginBottom: "0.75rem", fontWeight: 700 }}>Guess the Studio (2 rounds)</p>
            <div className="rules-page__scoring">
              <div className="rules-page__score-row"><span className="rules-page__score-label">Correct studio</span><span className="rules-page__score-value" style={{ color: "#22c55e" }}>100 pts</span></div>
              <div className="rules-page__score-row"><span className="rules-page__score-label">Wrong answer or timeout</span><span className="rules-page__score-value">0 pts</span></div>
            </div>

            <p className="rules-page__p" style={{ marginTop: "1.25rem", marginBottom: "0.75rem", fontWeight: 700 }}>Which Came First (2 rounds)</p>
            <div className="rules-page__scoring">
              <div className="rules-page__score-row"><span className="rules-page__score-label">Correct pick</span><span className="rules-page__score-value" style={{ color: "#22c55e" }}>100 pts</span></div>
              <div className="rules-page__score-row"><span className="rules-page__score-label">Wrong pick or timeout</span><span className="rules-page__score-value">0 pts</span></div>
            </div>

            <div className="rules-page__scoring" style={{ marginTop: "1rem" }}>
              <div className="rules-page__score-row"><span className="rules-page__score-label">Total rounds</span><span className="rules-page__score-value">10</span></div>
              <div className="rules-page__score-row"><span className="rules-page__score-label">Maximum total score</span><span className="rules-page__score-value">1,000 pts</span></div>
            </div>
          </div>

          <div className="rules-page__section">
            <h2 className="rules-page__section-title">Tips</h2>
            <ul className="rules-page__tips">
              <li className="rules-page__tip">Release Year: if you know the console generation a game belongs to, you can narrow the decade immediately. Most modern indie hits cluster around 2015–2020.</li>
              <li className="rules-page__tip">Getting within 1 year still scores 80 points — commit to a range rather than guessing randomly across the full slider.</li>
              <li className="rules-page__tip">Best Seller: free-to-play games (Rocket League, Among Us) and long-running franchises (GTA V, Minecraft) dramatically outsell recent critical darlings. Longevity and platform breadth matter more than reviews.</li>
              <li className="rules-page__tip">Guess the Studio: Indie games from one studio are often the giveaway — Supergiant (Hades), ConcernedApe (Stardew Valley) and Team Cherry (Hollow Knight) each have a distinctive style.</li>
              <li className="rules-page__tip">Which Came First: if you know one game well, use it as an anchor — even an approximate year narrows down which of the two is older.</li>
              <li className="rules-page__tip">In multiplayer, binary rounds (Battle, Studio, Older) reward speed — both players score the same 100 pts for a correct answer, so answering confidently and quickly creates momentum.</li>
            </ul>
          </div>

          <div className="rules-page__cta-wrap">
            <p className="rules-page__cta-text">How well do you know your gaming history?</p>
            <Link href="/gaming-mix" className="rules-page__play-btn">▶ Play Gaming Mix — it&apos;s free</Link>
            <br />
            <Link href="/gaming" className="rules-page__game-link">← All Gaming games</Link>
          </div>

        </div>
      </div>
    </>
  );
}
