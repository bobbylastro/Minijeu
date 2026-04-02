import type { Metadata } from "next";
import Link from "next/link";
import JsonLd from "@/components/JsonLd";

const BASE = "https://ultimate-playground.com";

export const metadata: Metadata = {
  title: "How to Play Gaming Tournament — Rules & Guide",
  description:
    "Complete Gaming Tournament rules: how the bracket works, which games are in the pool, how your Top 5 is calculated and tips for getting the most out of each session.",
  openGraph: {
    title: "How to Play Gaming Tournament — Bracket Rules",
    description:
      "Learn how Gaming Tournament works: 32 games drawn at random, 5 rounds of head-to-head picks, 1 champion. Full rules and guide.",
    url: `${BASE}/game-tournament-rules`,
    type: "article",
  },
};

const STEPS = [
  {
    name: "Start the tournament",
    text: "Click Start Tournament. 32 games are drawn at random from a pool of 66 classics and shuffled into 16 first-round matchups. Each session uses a different random draw, so no two tournaments are the same.",
  },
  {
    name: "Pick your favourite in each head-to-head",
    text: "Two games appear side by side with their cover art, year, genre and studio. Click the one you would rather play. There is no right or wrong answer — this is about personal preference, not trivia knowledge.",
  },
  {
    name: "Winners advance through 5 rounds",
    text: "The game you pick moves on to the next round. The bracket progresses through Round of 32 (16 picks), Round of 16 (8 picks), Quarterfinals (4 picks), Semifinals (2 picks) and finally the Grand Final (1 pick). 31 choices in total.",
  },
  {
    name: "Crown your champion",
    text: "After the Grand Final, the last game standing is your champion — your all-time favourite video game based on pure head-to-head preference. A brief transition screen announces each new round as it begins.",
  },
  {
    name: "Discover your Top 5",
    text: "The results screen shows your personal Top 5, ranked by total wins across all rounds. Your champion won 5 rounds. The runner-up won 4. Games that fell earlier rank by how many rounds they survived before losing.",
  },
];

export default function GameTournamentRulesPage() {
  return (
    <>
      <JsonLd data={[
        {
          "@context": "https://schema.org",
          "@type": "WebPage",
          "name": "How to Play Gaming Tournament — Rules & Guide",
          "url": `${BASE}/game-tournament-rules`,
          "description":
            "Complete guide to Gaming Tournament: bracket structure, game pool, round progression and how your personal Top 5 is calculated.",
          "inLanguage": "en",
          "isPartOf": { "@type": "WebSite", "name": "Ultimate Playground", "url": BASE },
        },
        {
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          "itemListElement": [
            { "@type": "ListItem", "position": 1, "name": "Home",               "item": BASE },
            { "@type": "ListItem", "position": 2, "name": "Gaming",             "item": `${BASE}/gaming` },
            { "@type": "ListItem", "position": 3, "name": "Gaming Tournament",  "item": `${BASE}/game-tournament` },
            { "@type": "ListItem", "position": 4, "name": "How to Play",        "item": `${BASE}/game-tournament-rules` },
          ],
        },
        {
          "@context": "https://schema.org",
          "@type": "HowTo",
          "name": "How to play Gaming Tournament",
          "description":
            "Gaming Tournament is a 32-game bracket in which you pick your favourite in 31 head-to-head matchups across 5 rounds to crown your all-time favourite video game.",
          "totalTime": "PT6M",
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
          <Link href="/game-tournament">Gaming Tournament</Link>
          <span>/</span>
          <span>How to Play</span>
        </nav>

        <div className="rules-page__hero">
          <p className="rules-page__hero-game">🏆 Gaming Tournament</p>
          <h1 className="rules-page__hero-title">How to Play Gaming Tournament</h1>
          <p className="rules-page__hero-desc">
            32 legendary games drawn at random. 5 rounds of head-to-head picks.
            One champion, and your personal Top 5.
          </p>
          <Link href="/game-tournament" className="rules-page__play-btn">▶ Play Gaming Tournament</Link>
        </div>

        <div className="rules-page__inner">

          <div className="rules-page__section">
            <h2 className="rules-page__section-title">Overview</h2>
            <p className="rules-page__p">
              Gaming Tournament is a free online bracket game that settles the debate once and for
              all: which video game is your all-time favourite? Every session draws 32 games at
              random from a pool of 66 classics and runs them through a single-elimination
              tournament. You pick the winner of each matchup based on personal preference —
              no trivia knowledge required.
            </p>
            <p className="rules-page__p">
              The tournament runs across 5 rounds and 31 total picks. At the end, your champion
              is revealed alongside a ranked Top 5 based on total wins.
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
            <h2 className="rules-page__section-title">Bracket structure</h2>
            <div className="rules-page__scoring">
              <div className="rules-page__score-row">
                <span className="rules-page__score-label">Round of 32</span>
                <span className="rules-page__score-value">16 picks</span>
              </div>
              <div className="rules-page__score-row">
                <span className="rules-page__score-label">Round of 16</span>
                <span className="rules-page__score-value">8 picks</span>
              </div>
              <div className="rules-page__score-row">
                <span className="rules-page__score-label">Quarterfinals</span>
                <span className="rules-page__score-value">4 picks</span>
              </div>
              <div className="rules-page__score-row">
                <span className="rules-page__score-label">Semifinals</span>
                <span className="rules-page__score-value">2 picks</span>
              </div>
              <div className="rules-page__score-row">
                <span className="rules-page__score-label">Grand Final</span>
                <span className="rules-page__score-value">1 pick</span>
              </div>
              <div className="rules-page__score-row rules-page__score-row--total">
                <span className="rules-page__score-label">Total picks per session</span>
                <span className="rules-page__score-value">31</span>
              </div>
            </div>
          </div>

          <div className="rules-page__section">
            <h2 className="rules-page__section-title">Top 5 ranking</h2>
            <p className="rules-page__p">
              After the Grand Final your results show the 5 games that accumulated the most wins
              across all rounds. The ranking works as follows:
            </p>
            <div className="rules-page__scoring">
              <div className="rules-page__score-row">
                <span className="rules-page__score-label">🥇 Champion</span>
                <span className="rules-page__score-value">5 wins</span>
              </div>
              <div className="rules-page__score-row">
                <span className="rules-page__score-label">🥈 Runner-up</span>
                <span className="rules-page__score-value">4 wins</span>
              </div>
              <div className="rules-page__score-row">
                <span className="rules-page__score-label">🥉 Semifinalists</span>
                <span className="rules-page__score-value">3 wins</span>
              </div>
              <div className="rules-page__score-row">
                <span className="rules-page__score-label">4th–5th place</span>
                <span className="rules-page__score-value">2 wins</span>
              </div>
            </div>
            <p className="rules-page__p">
              When multiple games share the same win total, they are ranked in the order they
              were eliminated during the tournament.
            </p>
          </div>

          <div className="rules-page__section">
            <h2 className="rules-page__section-title">The game pool</h2>
            <p className="rules-page__p">
              The 66-game pool covers every major genre from the last three decades:
              open-world (GTA V, Red Dead Redemption 2, The Witcher 3), action-RPG
              (Elden Ring, Dark Souls, Sekiro, Cyberpunk 2077), FPS (Half-Life 2,
              Counter-Strike 2, DOOM Eternal), puzzle (Portal 2, Portal), indie
              (Hades, Hollow Knight, Celeste, Stardew Valley, Terraria), strategy
              (Civilization VI, Total War: Warhammer II), survival (The Forest,
              Subnautica), and more.
            </p>
          </div>

          <div className="rules-page__section">
            <h2 className="rules-page__section-title">Tips for a better result</h2>
            <ul className="rules-page__tips">
              <li className="rules-page__tip">
                Pick the game you would genuinely rather play today — nostalgia and reputation
                can skew your answers if you let them.
              </li>
              <li className="rules-page__tip">
                If a head-to-head feels impossible, imagine you can only keep one of the two
                games forever and the other disappears. That constraint forces a real answer.
              </li>
              <li className="rules-page__tip">
                Try replaying the tournament on different days. Your Top 5 may shift depending
                on what you have been playing recently — both outcomes are valid.
              </li>
              <li className="rules-page__tip">
                The random draw means some difficult matchups appear in Round 1 while easier
                ones reach the final. This is intentional — it mirrors real tournament seeding
                and keeps results unpredictable.
              </li>
            </ul>
          </div>

          <div className="rules-page__cta-wrap">
            <p className="rules-page__cta-text">Ready to find your all-time favourite game?</p>
            <Link href="/game-tournament" className="rules-page__play-btn">▶ Play Gaming Tournament — it&apos;s free</Link>
            <Link href="/gaming" className="rules-page__game-link">← All Gaming games</Link>
          </div>

        </div>
      </div>
    </>
  );
}
