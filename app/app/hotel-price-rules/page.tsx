import type { Metadata } from "next";
import Link from "next/link";
import JsonLd from "@/components/JsonLd";

const BASE = "https://ultimate-playground.com";

export const metadata: Metadata = {
  title: "How to Play Hotel Price — Rules, Scoring & Strategy",
  description:
    "Complete Hotel Price rules: slider rounds, battle rounds and scoring. Learn how to read hotel photos to estimate nightly rates and beat your opponents.",
  openGraph: {
    title: "How to Play Hotel Price — Rules & Scoring Guide",
    description: "Full rules for Hotel Price: how slider scoring works, what makes a hard battle round, and tips to estimate hotel prices accurately.",
    url: `${BASE}/hotel-price-rules`,
    type: "article",
  },
};

const STEPS = [
  {
    name: "Choose solo or multiplayer",
    text: "Tap Solo to play alone and build streak multipliers, or Multiplayer to face a real opponent in real time. Both players see the same 10 rounds from an identical seed. If no opponent is found within 30 seconds, a bot joins automatically.",
  },
  {
    name: "Slider round — estimate the nightly price",
    text: "A hotel appears with its name, city, star rating and amenities. Browse the photos using the image carousel, then drag the logarithmic slider to your price estimate in USD. Confirm when you're ready. The slider covers $15 to $2,500 per night.",
  },
  {
    name: "Battle round — pick the more expensive hotel",
    text: "Two hotels appear side by side. Each shows a photo, the city, star rating and a couple of amenities. Tap the hotel you think charges more per night. Battle hotels are always from the same or adjacent price tier, so the difference is never obvious.",
  },
  {
    name: "See the reveal and collect points",
    text: "After each answer the actual price is revealed. Slider rounds award points based on how close your estimate is. Battle rounds award 100 points for a correct pick and 0 for a wrong one.",
  },
  {
    name: "Build a streak for bonus multipliers (solo only)",
    text: "In solo mode, consecutive correct answers build a streak counter. Hit 5 in a row to earn a ×1.5 multiplier on every subsequent correct answer. Push to 10 consecutive answers and it rises to ×2.",
  },
  {
    name: "Use the category clues",
    text: "After the reveal, the hotel tier (Luxury / Mid-range / Budget) is shown. Over 10 rounds you'll develop a feel for what the same star rating costs in different cities — a useful pattern for future rounds.",
  },
];

export default function HotelPriceRulesPage() {
  return (
    <>
      <JsonLd data={[
        {
          "@context": "https://schema.org",
          "@type": "WebPage",
          "name": "How to Play Hotel Price — Rules & Scoring Guide",
          "url": `${BASE}/hotel-price-rules`,
          "description": "Complete guide to Hotel Price: slider rounds, battle rounds, scoring thresholds and strategy tips.",
          "inLanguage": "en",
          "isPartOf": { "@type": "WebSite", "name": "Ultimate Playground", "url": BASE },
        },
        {
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          "itemListElement": [
            { "@type": "ListItem", "position": 1, "name": "Home",        "item": BASE },
            { "@type": "ListItem", "position": 2, "name": "World",       "item": `${BASE}/world` },
            { "@type": "ListItem", "position": 3, "name": "Hotel Price", "item": `${BASE}/hotel-price` },
            { "@type": "ListItem", "position": 4, "name": "How to Play", "item": `${BASE}/hotel-price-rules` },
          ],
        },
        {
          "@context": "https://schema.org",
          "@type": "HowTo",
          "name": "How to play Hotel Price",
          "description": "Hotel Price is a 10-round quiz where you guess nightly hotel rates from photos and information. 7 slider rounds and 3 battle rounds.",
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
          <Link href="/hotel-price">Hotel Price</Link>
          <span>/</span>
          <span>How to Play</span>
        </nav>

        <div className="rules-page__hero">
          <p className="rules-page__hero-game">🏨 Hotel Price</p>
          <h1 className="rules-page__hero-title">How to Play Hotel Price</h1>
          <p className="rules-page__hero-desc">
            10 rounds of price estimation and hotel battles. Guess nightly rates from real photos — slider rounds test your estimation, battle rounds test your comparison skills.
          </p>
          <Link href="/hotel-price" className="rules-page__play-btn">▶ Play Hotel Price</Link>
        </div>

        <div className="rules-page__inner">

          <div className="rules-page__section">
            <h2 className="rules-page__section-title">Overview</h2>
            <p className="rules-page__p">
              Hotel Price is a free browser game using real hotel prices scraped from Booking.com.
              Each game has 10 rounds: 7 slider rounds where you estimate a hotel&apos;s nightly
              rate, and 3 battle rounds where you pick the more expensive of two hotels. Hotels
              span budget guesthouses in Southeast Asia through to five-star luxury properties in
              New York, Dubai and Tokyo.
            </p>
            <p className="rules-page__p">
              Solo mode adds streak multipliers to reward consistent performance. Multiplayer mode
              puts you head-to-head against another player on identical questions for a fair contest.
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
                <span className="rules-page__score-label">Slider — within 5% of actual price</span>
                <span className="rules-page__score-value">+100 pts 🎯</span>
              </div>
              <div className="rules-page__score-row">
                <span className="rules-page__score-label">Slider — within 12%</span>
                <span className="rules-page__score-value">+90 pts</span>
              </div>
              <div className="rules-page__score-row">
                <span className="rules-page__score-label">Slider — within 22%</span>
                <span className="rules-page__score-value">+75 pts</span>
              </div>
              <div className="rules-page__score-row">
                <span className="rules-page__score-label">Slider — within 40%</span>
                <span className="rules-page__score-value">+50 pts</span>
              </div>
              <div className="rules-page__score-row">
                <span className="rules-page__score-label">Slider — within 70%</span>
                <span className="rules-page__score-value">+25 pts</span>
              </div>
              <div className="rules-page__score-row">
                <span className="rules-page__score-label">Battle — correct hotel picked</span>
                <span className="rules-page__score-value">+100 pts</span>
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
                <span className="rules-page__score-label">Slider off by more than 70% / wrong battle</span>
                <span className="rules-page__score-value">0 pts + streak reset</span>
              </div>
            </div>
          </div>

          <div className="rules-page__section">
            <h2 className="rules-page__section-title">Tips to score higher</h2>
            <ul className="rules-page__tips">
              <li className="rules-page__tip">Star rating is the strongest single signal — a 5-star in Manhattan will always be expensive. Use it as your baseline anchor.</li>
              <li className="rules-page__tip">City location multiplies the base rate significantly. Tokyo, Zurich and New York have much higher baselines than Chiang Mai or Tbilisi, even at equivalent star ratings.</li>
              <li className="rules-page__tip">Amenities like private pool, butler service or ocean view add premium. A 4-star with a private pool in Santorini will beat a 5-star standard hotel in a mid-tier city.</li>
              <li className="rules-page__tip">For battle rounds, read the amenities and city carefully — a hotel with fewer stars in a premium location often beats a higher-star hotel in a cheaper city.</li>
              <li className="rules-page__tip">Slider scoring is ratio-based, not absolute — being 10% off on a $1,500 hotel ($150) scores the same as being 10% off on a $50 hotel ($5). Use the log scale to your advantage.</li>
            </ul>
          </div>

          <div className="rules-page__cta-wrap">
            <p className="rules-page__cta-text">Ready to guess what luxury costs?</p>
            <Link href="/hotel-price" className="rules-page__play-btn">▶ Play Hotel Price — it&apos;s free</Link>
            <br />
            <Link href="/world" className="rules-page__game-link">← All World games</Link>
          </div>

        </div>
      </div>
    </>
  );
}
