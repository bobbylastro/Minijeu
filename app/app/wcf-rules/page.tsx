import type { Metadata } from "next";
import Link from "next/link";
import JsonLd from "@/components/JsonLd";

const BASE = "https://ultimate-playground.com";

export const metadata: Metadata = {
  title: "How to Play WhatCameFirst? — Rules & Scoring",
  description:
    "Complete WhatCameFirst? rules: two events appear — pick which one happened first. History, sports, technology and pop culture. 10 rounds with timer and multiplayer explained.",
  openGraph: {
    title: "How to Play WhatCameFirst? — Timeline Quiz Rules",
    description: "Learn how WhatCameFirst? works: pick the earlier event across history, tech, sports and pop culture. Full rules and scoring guide.",
    url: `${BASE}/wcf-rules`,
    type: "article",
    images: [{ url: "/wcf/opengraph-image", width: 1200, height: 630, alt: "What Came First?" }],
  },
};

const STEPS = [
  {
    name: "Choose solo or multiplayer",
    text: "Tap Solo to play alone, or Multiplayer to face a real opponent in real time. Both players see the same 10 event pairs generated from a shared seed. If no opponent is found within 30 seconds, a bot steps in.",
  },
  {
    name: "Read both events carefully",
    text: "Two events appear on screen — each with its name, category (Sports, Technology, History or Pop Culture) and a brief description. Both are real historical events. Your task is to determine which one happened first.",
  },
  {
    name: "Click the earlier event",
    text: "Tap or click the event you believe occurred first in real history. Your selection is locked in immediately.",
  },
  {
    name: "See the result and the dates",
    text: "Both events are revealed with their exact year or date. The earlier event is highlighted and a brief context note explains the significance. Even if you were correct, the actual gap between the two events is often surprising.",
  },
  {
    name: "Repeat for 10 rounds",
    text: "Each round brings a new pair from one of four domains: Sports records and milestones, Technology inventions and product launches, History treaties and discoveries, and Pop Culture albums, films and moments.",
  },
];

export default function WCFRulesPage() {
  return (
    <>
      <JsonLd data={[
        {
          "@context": "https://schema.org",
          "@type": "WebPage",
          "name": "How to Play WhatCameFirst? — Rules & Scoring",
          "url": `${BASE}/wcf-rules`,
          "description": "Complete guide to WhatCameFirst?: two events appear, pick the one that happened first. 10 rounds across history, sports, technology and pop culture.",
          "inLanguage": "en",
          "isPartOf": { "@type": "WebSite", "name": "Ultimate Playground", "url": BASE },
        },
        {
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          "itemListElement": [
            { "@type": "ListItem", "position": 1, "name": "Home",           "item": BASE },
            { "@type": "ListItem", "position": 2, "name": "Culture",        "item": `${BASE}/culture` },
            { "@type": "ListItem", "position": 3, "name": "WhatCameFirst?", "item": `${BASE}/wcf` },
            { "@type": "ListItem", "position": 4, "name": "How to Play",    "item": `${BASE}/wcf-rules` },
          ],
        },
        {
          "@context": "https://schema.org",
          "@type": "HowTo",
          "name": "How to play WhatCameFirst?",
          "description": "WhatCameFirst? shows two real historical events — pick the one that happened first. 10 rounds covering sports, technology, history and pop culture.",
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
          <Link href="/culture">Culture</Link>
          <span>/</span>
          <Link href="/wcf">WhatCameFirst?</Link>
          <span>/</span>
          <span>How to Play</span>
        </nav>

        <div className="rules-page__hero">
          <p className="rules-page__hero-game">⏳ WhatCameFirst?</p>
          <h1 className="rules-page__hero-title">How to Play WhatCameFirst?</h1>
          <p className="rules-page__hero-desc">
            Two real events. Which one happened first? History, sports, technology
            and pop culture — 10 rounds to test your timeline knowledge.
          </p>
          <Link href="/wcf" className="rules-page__play-btn">▶ Play WhatCameFirst?</Link>
        </div>

        <div className="rules-page__inner">

          <div className="rules-page__section">
            <h2 className="rules-page__section-title">Overview</h2>
            <p className="rules-page__p">
              WhatCameFirst? is a chronological quiz that tests your sense of history.
              Each round presents two real events from different domains. The gap between
              them might be decades — or just a few months. Both are genuine, and both are
              memorable, which is what makes the game deceptively hard.
            </p>
            <p className="rules-page__p">
              Some rounds are straightforward; others will genuinely surprise you. Did
              Facebook launch before or after YouTube? Was Ronaldo&apos;s first Ballon d&apos;Or
              before or after Messi&apos;s? The answer is rarely as obvious as it seems.
            </p>
          </div>

          <div className="rules-page__section">
            <h2 className="rules-page__section-title">What topics are covered?</h2>
            <div className="rules-page__scoring">
              <div className="rules-page__score-row">
                <span className="rules-page__score-label">Sports</span>
                <span className="rules-page__score-value">Records, tournaments, milestones, iconic moments</span>
              </div>
              <div className="rules-page__score-row">
                <span className="rules-page__score-label">Technology</span>
                <span className="rules-page__score-value">Inventions, product launches, digital milestones</span>
              </div>
              <div className="rules-page__score-row">
                <span className="rules-page__score-label">History</span>
                <span className="rules-page__score-value">Treaties, discoveries, political events, scientific breakthroughs</span>
              </div>
              <div className="rules-page__score-row">
                <span className="rules-page__score-label">Pop Culture</span>
                <span className="rules-page__score-value">Album releases, films, iconic cultural moments</span>
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
                <span className="rules-page__score-label">Wrong answer or timeout</span>
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
              <li className="rules-page__tip">When both events feel like they happened &quot;around the same time&quot;, think in decades first — one usually belongs to a clearly different era.</li>
              <li className="rules-page__tip">Technology events accelerate toward the present — things that feel recent (social media, smartphones) happened in a surprisingly narrow window.</li>
              <li className="rules-page__tip">Sports records often cluster around the 1990s–2010s golden generation — use your knowledge of player careers as a reference.</li>
              <li className="rules-page__tip">When genuinely uncertain, the category label is your best friend — Historical events tend to predate Technology launches by decades.</li>
            </ul>
          </div>

          <div className="rules-page__cta-wrap">
            <p className="rules-page__cta-text">How sharp is your sense of history?</p>
            <Link href="/wcf" className="rules-page__play-btn">▶ Play WhatCameFirst? — it&apos;s free</Link>
            <br />
            <Link href="/culture" className="rules-page__game-link">← All Culture games</Link>
          </div>

        </div>
      </div>
    </>
  );
}
