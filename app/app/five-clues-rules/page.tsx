import type { Metadata } from "next";
import Link from "next/link";
import JsonLd from "@/components/JsonLd";

const BASE = "https://ultimate-playground.com";

export const metadata: Metadata = {
  title: "How to Play 5 Clues — Rules & Scoring",
  description:
    "Complete 5 Clues rules: 5 progressive clues, 3 attempts, guess the famous person. Scoring from 500 down to 100 pts, fuzzy matching, multiplayer — all explained.",
  openGraph: {
    title: "How to Play 5 Clues — Who Am I? Quiz Rules",
    description: "Learn how 5 Clues works: progressive clues, 3 attempts, guess the person. Full rules, scoring table and tips.",
    url: `${BASE}/five-clues-rules`,
    type: "article",
    images: [{ url: "/five-clues/opengraph-image", width: 1200, height: 630, alt: "5 Clues" }],
  },
};

const STEPS = [
  {
    name: "Choose solo or multiplayer",
    text: "In Solo mode, play through 10 people at your own pace. In Multiplayer, both players see the same 10 people from a shared seed. Each player progresses through clues independently — you don't wait for your opponent between clues.",
  },
  {
    name: "Read the first clue",
    text: "The first clue is deliberately vague — a broad fact that could apply to many people. For example: 'This person was born in the United States in the 1950s and is considered one of the greatest of all time in their field.'",
  },
  {
    name: "Type your guess and press Submit",
    text: "Enter your answer in the text field and press Submit. Spelling doesn't need to be perfect — the game uses fuzzy matching that tolerates typos, missing accents and common nickname variations.",
  },
  {
    name: "Wrong guess — get the next clue",
    text: "If wrong, a second clue appears, giving more specific information. You can continue guessing (up to 3 total attempts) or click Next Clue at any time without using an attempt — useful when you want more information before committing.",
  },
  {
    name: "Score more points by guessing early",
    text: "Correct answers on earlier clues earn more points. The maximum is 500 points for a correct guess on clue 1 — this decreases by 100 with each clue. Exhausting all 3 attempts or all 5 clues without a correct answer gives 0 points for that round.",
  },
  {
    name: "See the reveal and move on",
    text: "After each round — whether you guessed correctly or not — the person is fully revealed with their photo, name and a short biography. Then the next person begins.",
  },
];

export default function FiveCluesRulesPage() {
  return (
    <>
      <JsonLd data={[
        {
          "@context": "https://schema.org",
          "@type": "WebPage",
          "name": "How to Play 5 Clues — Rules & Scoring",
          "url": `${BASE}/five-clues-rules`,
          "description": "Complete guide to 5 Clues: 5 progressive clues, 3 attempts, guess the famous person. Scoring drops from 500 to 100 depending on how many clues you need.",
          "inLanguage": "en",
          "isPartOf": { "@type": "WebSite", "name": "Ultimate Playground", "url": BASE },
        },
        {
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          "itemListElement": [
            { "@type": "ListItem", "position": 1, "name": "Home",    "item": BASE },
            { "@type": "ListItem", "position": 2, "name": "Culture", "item": `${BASE}/culture` },
            { "@type": "ListItem", "position": 3, "name": "5 Clues", "item": `${BASE}/five-clues` },
            { "@type": "ListItem", "position": 4, "name": "How to Play", "item": `${BASE}/five-clues-rules` },
          ],
        },
        {
          "@context": "https://schema.org",
          "@type": "HowTo",
          "name": "How to play 5 Clues",
          "description": "5 Clues gives you 5 progressive clues and 3 attempts to identify a famous person. Guess early to earn more points — 500 for clue 1 down to 100 for clue 5.",
          "totalTime": "PT7M",
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
          <Link href="/five-clues">5 Clues</Link>
          <span>/</span>
          <span>How to Play</span>
        </nav>

        <div className="rules-page__hero">
          <p className="rules-page__hero-game">🕵️ 5 Clues</p>
          <h1 className="rules-page__hero-title">How to Play 5 Clues</h1>
          <p className="rules-page__hero-desc">
            5 progressive clues, 3 attempts. Guess the famous person as early as possible
            to earn the maximum 500 points.
          </p>
          <Link href="/five-clues" className="rules-page__play-btn">▶ Play 5 Clues</Link>
        </div>

        <div className="rules-page__inner">

          <div className="rules-page__section">
            <h2 className="rules-page__section-title">Overview</h2>
            <p className="rules-page__p">
              5 Clues is a progressive trivia game where you identify a famous person from up
              to five increasingly specific clues. The earlier you guess correctly, the more
              points you earn. The challenge is deciding when you have enough information to
              commit — guess too early and you might be wrong; wait too long and you lose points.
            </p>
            <p className="rules-page__p">
              The game features 50 well-known personalities from sport, music, film, history,
              science and business. Every session draws 10 at random — no two games are the same.
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
                <span className="rules-page__score-label">Correct on clue 1</span>
                <span className="rules-page__score-value">500 pts</span>
              </div>
              <div className="rules-page__score-row">
                <span className="rules-page__score-label">Correct on clue 2</span>
                <span className="rules-page__score-value">400 pts</span>
              </div>
              <div className="rules-page__score-row">
                <span className="rules-page__score-label">Correct on clue 3</span>
                <span className="rules-page__score-value">300 pts</span>
              </div>
              <div className="rules-page__score-row">
                <span className="rules-page__score-label">Correct on clue 4</span>
                <span className="rules-page__score-value">200 pts</span>
              </div>
              <div className="rules-page__score-row">
                <span className="rules-page__score-label">Correct on clue 5</span>
                <span className="rules-page__score-value">100 pts</span>
              </div>
              <div className="rules-page__score-row">
                <span className="rules-page__score-label">3 wrong guesses or all 5 clues used</span>
                <span className="rules-page__score-value">0 pts</span>
              </div>
              <div className="rules-page__score-row">
                <span className="rules-page__score-label">Maximum total (10 rounds at 500)</span>
                <span className="rules-page__score-value">5,000 pts</span>
              </div>
            </div>
          </div>

          <div className="rules-page__section">
            <h2 className="rules-page__section-title">Accepted answers</h2>
            <p className="rules-page__p">
              The answer checker uses fuzzy matching. You don&apos;t need perfect spelling:
            </p>
            <ul className="rules-page__tips">
              <li className="rules-page__tip">&quot;Ronaldo&quot;, &quot;ronaldu&quot; and &quot;CR7&quot; are all accepted for Cristiano Ronaldo.</li>
              <li className="rules-page__tip">Missing accents are ignored — &quot;Beyonce&quot; works as well as &quot;Beyoncé&quot;.</li>
              <li className="rules-page__tip">Common nicknames are recognised — &quot;Pelé&quot;, &quot;Pele&quot; and &quot;Pele&quot; all work.</li>
              <li className="rules-page__tip">Last name alone is accepted for most celebrities — &quot;Einstein&quot;, &quot;Musk&quot;, &quot;Federer&quot;.</li>
            </ul>
          </div>

          <div className="rules-page__section">
            <h2 className="rules-page__section-title">Tips to score higher</h2>
            <ul className="rules-page__tips">
              <li className="rules-page__tip">Use Next Clue strategically — you can skip a clue without wasting an attempt when the first clue is too vague.</li>
              <li className="rules-page__tip">Think about the combination of facts. Two or three clues together usually narrow it down significantly.</li>
              <li className="rules-page__tip">If you recognise the description pattern — nationality + decade + field — commit your guess before clue 3 to protect your points.</li>
              <li className="rules-page__tip">In multiplayer, speed matters too — your opponent may be further ahead on the same person.</li>
            </ul>
          </div>

          <div className="rules-page__cta-wrap">
            <p className="rules-page__cta-text">Who can you identify in just one clue?</p>
            <Link href="/five-clues" className="rules-page__play-btn">▶ Play 5 Clues — it&apos;s free</Link>
            <br />
            <Link href="/culture" className="rules-page__game-link">← All Culture games</Link>
          </div>

        </div>
      </div>
    </>
  );
}
