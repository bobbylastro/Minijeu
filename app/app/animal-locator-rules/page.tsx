import type { Metadata } from "next";
import Link from "next/link";
import JsonLd from "@/components/JsonLd";

const BASE = "https://ultimate-playground.com";

export const metadata: Metadata = {
  title: "How to Play Animal Locator — Rules & Scoring",
  description:
    "Complete Animal Locator rules: an animal appears, click its home country on the world map. 55 species, 25-second timer, 10 rounds. Learn how to navigate the map and score maximum points.",
  openGraph: {
    title: "How to Play Animal Locator — Rules & Scoring",
    description: "Learn how to play Animal Locator: an animal appears, click where it lives on the world map. Full rules and scoring guide.",
    url: `${BASE}/animal-locator-rules`,
    type: "article",
  },
};

const STEPS = [
  {
    name: "Choose solo or multiplayer",
    text: "Tap Solo to play alone, or Multiplayer to face a real opponent. Both players draw the same 10 animals from the same random seed — so the result is decided purely by wildlife knowledge.",
  },
  {
    name: "Read the animal card and hint",
    text: "An animal photo appears alongside its name, type (Mammal, Bird, Reptile…) and a short geographic hint. The hint describes the habitat or range without naming the country — use it to narrow things down.",
  },
  {
    name: "Find the country on the map",
    text: "An interactive world map is displayed. You have 25 seconds to locate the animal's primary home country. Zoom in with the scroll wheel or pinch gesture to find smaller nations. Pan by dragging.",
  },
  {
    name: "Preview before confirming",
    text: "Hover over any territory (desktop) to see its name and flag before clicking. On mobile, tap a country once to preview it in the bottom bar, then tap Confirm to lock in your answer.",
  },
  {
    name: "Click to submit your answer",
    text: "Click the country you think is correct. The map immediately highlights the right country in green — and your chosen country in red if you were wrong. One correct click scores 100 points.",
  },
  {
    name: "Repeat for all 10 rounds",
    text: "A new animal appears each round. The 10 animals are drawn randomly from a pool of 55 species across mammals, birds, reptiles and amphibians — so every session is different.",
  },
];

export default function AnimalLocatorRulesPage() {
  return (
    <>
      <JsonLd data={[
        {
          "@context": "https://schema.org",
          "@type": "WebPage",
          "name": "How to Play Animal Locator — Rules & Scoring",
          "url": `${BASE}/animal-locator-rules`,
          "description": "Complete guide to Animal Locator: an animal appears, click its home country on the world map. 55 species, 25-second timer, 10 rounds.",
          "inLanguage": "en",
          "isPartOf": { "@type": "WebSite", "name": "Ultimate Playground", "url": BASE },
        },
        {
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          "itemListElement": [
            { "@type": "ListItem", "position": 1, "name": "Home",            "item": BASE },
            { "@type": "ListItem", "position": 2, "name": "Animals",         "item": `${BASE}/animals` },
            { "@type": "ListItem", "position": 3, "name": "Animal Locator",  "item": `${BASE}/animal-locator` },
            { "@type": "ListItem", "position": 4, "name": "How to Play",     "item": `${BASE}/animal-locator-rules` },
          ],
        },
        {
          "@context": "https://schema.org",
          "@type": "HowTo",
          "name": "How to play Animal Locator",
          "description": "Animal Locator shows an animal photo and a habitat hint — click its home country on the world map within 25 seconds. 10 rounds, 55 species.",
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
          <Link href="/animal-locator">Animal Locator</Link>
          <span>/</span>
          <span>How to Play</span>
        </nav>

        <div className="rules-page__hero">
          <p className="rules-page__hero-game">🗺️ Animal Locator</p>
          <h1 className="rules-page__hero-title">How to Play Animal Locator</h1>
          <p className="rules-page__hero-desc">
            An animal appears — click its home country on the world map.
            55 species, 25 seconds per round, 10 rounds total.
          </p>
          <Link href="/animal-locator" className="rules-page__play-btn">▶ Play Animal Locator</Link>
        </div>

        <div className="rules-page__inner">

          <div className="rules-page__section">
            <h2 className="rules-page__section-title">Overview</h2>
            <p className="rules-page__p">
              Animal Locator is a wildlife geography game. Each round, an animal photo and a
              habitat clue appear on screen. Your job is to find the country where that species
              primarily lives on an interactive world map — before the 25-second timer runs out.
            </p>
            <p className="rules-page__p">
              The pool of 55 animals spans five continents and four animal classes — mammals,
              birds, reptiles and amphibians. Species range from the iconic (Giant Panda, Polar
              Bear, Kangaroo) to the surprising (Axolotl, Saiga Antelope, Proboscis Monkey).
              10 are drawn at random each session, so the game stays fresh.
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
              <li className="rules-page__tip">Read the hint carefully before touching the map — it always contains a geographic or ecological clue that narrows the continent, if not the country.</li>
              <li className="rules-page__tip">The animal&apos;s type badge (Mammal, Bird, Reptile…) combined with the hint is often enough to pin down the region. Reptiles are rarely found in Arctic climates, for example.</li>
              <li className="rules-page__tip">Several species are endemic to islands — New Zealand, Madagascar, Indonesia — that are easy to overlook. Zoom in on island chains when the hint suggests isolation.</li>
              <li className="rules-page__tip">Think about endemism: animals described as existing &quot;nowhere else on Earth&quot; or found on a &quot;single island&quot; are pinned to very specific countries.</li>
              <li className="rules-page__tip">In multiplayer, speed matters as much as accuracy — both players score 100 for the correct country, so answering faster gives you a psychological edge heading into the next round.</li>
            </ul>
          </div>

          <div className="rules-page__cta-wrap">
            <p className="rules-page__cta-text">How well do you know where animals live?</p>
            <Link href="/animal-locator" className="rules-page__play-btn">▶ Play Animal Locator — it&apos;s free</Link>
            <br />
            <Link href="/animals" className="rules-page__game-link">← All Animals games</Link>
          </div>

        </div>
      </div>
    </>
  );
}
