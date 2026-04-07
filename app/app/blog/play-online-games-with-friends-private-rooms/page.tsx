import type { Metadata } from "next";
import Link from "next/link";
import JsonLd from "@/components/JsonLd";
import FAQ from "@/components/FAQ";

const BASE  = "https://ultimate-playground.com";
const SLUG  = "/blog/play-online-games-with-friends-private-rooms";
const TITLE = "Play Online Games with Friends — Private Rooms on Ultimate Playground";
const DESCRIPTION =
  "Create a private room, share a 4-letter code and play free online quiz games with your friends in real time. No account needed — just pick a game and go.";

export const metadata: Metadata = {
  title: `${TITLE} | Ultimate Playground`,
  description: DESCRIPTION,
  keywords: [
    "play online games with friends",
    "private room online game",
    "multiplayer quiz game with friends",
    "free online game with friends",
    "online quiz game no download",
    "create game room online",
    "play quiz with friends browser",
    "online multiplayer quiz 2026",
  ],
  alternates: { canonical: `${BASE}${SLUG}` },
  openGraph: {
    title: `${TITLE} | Ultimate Playground`,
    description: DESCRIPTION,
    url: `${BASE}${SLUG}`,
    type: "article",
    publishedTime: "2026-04-07T00:00:00Z",
    modifiedTime: "2026-04-07T00:00:00Z",
    authors: ["Ultimate Playground"],
    tags: ["multiplayer", "private rooms", "quiz games", "free games", "play with friends"],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
  },
};

const GAMES = [
  {
    href: "/football",
    emoji: "⚽",
    title: "FootballQuiz",
    desc: "10 rounds of transfer fees, stadium photos, salary battles and trivia. Great for football nights with friends.",
  },
  {
    href: "/nba",
    emoji: "🏀",
    title: "NBAQuiz",
    desc: "Guess contracts, identify arenas, compare salaries and nail the trivia. Perfect for NBA fans in any timezone.",
  },
  {
    href: "/wild-battle",
    emoji: "🦁",
    title: "Wild Battle",
    desc: "Pick the animal that wins — 1 lion vs 10 hyenas? 3 crocodiles vs 1 hippo? Fun for all ages.",
  },
  {
    href: "/career",
    emoji: "🔀",
    title: "CareerOrder",
    desc: "Rebuild a footballer's club career in chronological order. Tap to place, tap again to remove — chaos guaranteed.",
  },
  {
    href: "/citymix",
    emoji: "🌍",
    title: "CityMix",
    desc: "Which city is bigger? Then slide to guess its exact population. Fast rounds, instant debates.",
  },
  {
    href: "/wcf",
    emoji: "⏳",
    title: "WhatCameFirst?",
    desc: "Sports records, tech launches, historic events — which happened first? A simple question that sparks surprisingly long arguments.",
  },
  {
    href: "/five-clues",
    emoji: "🔍",
    title: "Five Clues",
    desc: "Five cryptic clues, one mystery player. The fewer clues you need, the more points you score.",
  },
  {
    href: "/higher-or-lower",
    emoji: "📊",
    title: "Higher or Lower",
    desc: "Compare two countries on population, GDP, area or coastline. Deceptively simple, wildly competitive.",
  },
];

const FAQS = [
  {
    q: "Do I need an account to create a private room?",
    a: "No. Private rooms are completely anonymous — just pick a game, tap Multiplayer, then Play with Friends. A 4-letter code is generated instantly. Share it and you're ready.",
  },
  {
    q: "How many players can join one room?",
    a: "Up to 8 players can join a single private room. The game starts as soon as the host taps Start, with a minimum of 2 players.",
  },
  {
    q: "What happens if someone disconnects during the game?",
    a: "They have an 8-second window to reconnect and pick up exactly where they left off. If they don't reconnect in time, the remaining players carry on and they're removed from the leaderboard.",
  },
  {
    q: "Is there a leaderboard at the end?",
    a: "Yes — private room games finish with a ranked leaderboard showing every player's score, with gold, silver and bronze medals for the top three.",
  },
  {
    q: "Can I play Quick Match and private rooms on the same game?",
    a: "Absolutely. Every multiplayer game supports both modes. Quick Match pairs you with a random stranger in seconds; private rooms let you choose who joins.",
  },
  {
    q: "Do all players get the same questions?",
    a: "Yes. The server generates a single random seed before the game starts and sends it to all players. Everyone sees the same questions in the same order — no advantage on either side.",
  },
  {
    q: "Which games support private rooms?",
    a: "FootballQuiz, NBAQuiz, Wild Battle, CareerOrder, CityMix, WhatCameFirst?, Five Clues, Higher or Lower, Food Origins, Origins Quiz, City Mapper and Wealth — basically every multiplayer game on the platform.",
  },
  {
    q: "Is it free?",
    a: "Yes, entirely. No subscription, no in-app purchases, no sign-up. Open the browser, share the code, play.",
  },
];

export default function Page() {
  return (
    <>
      <JsonLd data={[
        {
          "@context": "https://schema.org",
          "@type": "BlogPosting",
          "headline": TITLE,
          "description": DESCRIPTION,
          "url": `${BASE}${SLUG}`,
          "datePublished": "2026-04-07T00:00:00Z",
          "dateModified": "2026-04-07T00:00:00Z",
          "author": { "@type": "Organization", "name": "Ultimate Playground", "url": BASE },
          "publisher": { "@type": "Organization", "name": "Ultimate Playground", "url": BASE },
          "inLanguage": "en",
          "keywords": "play online games with friends, private room, multiplayer quiz, free online quiz",
          "mainEntityOfPage": { "@type": "WebPage", "@id": `${BASE}${SLUG}` },
        },
        {
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          "itemListElement": [
            { "@type": "ListItem", "position": 1, "name": "Home",  "item": BASE },
            { "@type": "ListItem", "position": 2, "name": "Blog",  "item": `${BASE}/blog` },
            { "@type": "ListItem", "position": 3, "name": TITLE,   "item": `${BASE}${SLUG}` },
          ],
        },
        {
          "@context": "https://schema.org",
          "@type": "FAQPage",
          "mainEntity": FAQS.map(({ q, a }) => ({
            "@type": "Question",
            "name": q,
            "acceptedAnswer": { "@type": "Answer", "text": a },
          })),
        },
      ]} />

      <div className="blog-layout">

        {/* ── Breadcrumb ── */}
        <nav className="blog-breadcrumb">
          <Link href="/">Home</Link>
          <span>›</span>
          <Link href="/blog">Blog</Link>
          <span>›</span>
          <span>Play with Friends</span>
        </nav>

        {/* ── Hero ── */}
        <header className="blog-hero">
          <div className="blog-hero__tags">
            <span className="blog-tag">Multiplayer</span>
            <span className="blog-tag">New Feature</span>
          </div>
          <h1 className="blog-hero__title">
            Play Online Games with Friends — Private Rooms on Ultimate Playground
          </h1>
          <p className="blog-hero__lead">
            Forget coordinating accounts, installs or subscriptions. Create a private room in two taps,
            share a 4-letter code and compete with up to 8 friends from anywhere in the world —
            on any game, instantly.
          </p>
          <div className="blog-hero__meta">
            <span>April 7, 2026</span>
            <span>·</span>
            <span>4 min read</span>
          </div>
        </header>

        {/* ── Article body ── */}
        <article className="blog-article">

          <h2>Why a private room beats Quick Match</h2>
          <p>
            Quick Match is great when you want a fast competitive fix against a stranger.
            But when you want to settle a bet with your flatmates, test your group chat&apos;s
            football knowledge, or just have a laugh with people you actually know — you need
            a room of your own.
          </p>
          <p>
            Private rooms on Ultimate Playground give you exactly that: a closed game lobby,
            accessible by code, with a live leaderboard at the end. No app, no account, no
            subscription. Just a browser tab and a code.
          </p>

          <h2>How private rooms work — step by step</h2>
          <ol className="blog-steps">
            <li>
              <strong>Open any multiplayer game</strong> — FootballQuiz, Wild Battle, CityMix… pick your poison.
            </li>
            <li>
              <strong>Tap Multiplayer</strong>, enter your name, then choose <em>Play with Friends</em>.
            </li>
            <li>
              <strong>Tap Create a Room.</strong> A unique 4-letter code appears instantly — something like <code className="blog-code">WOLF</code> or <code className="blog-code">K7PQ</code>.
            </li>
            <li>
              <strong>Share the code</strong> — copy it with one tap and send it via WhatsApp, Discord, iMessage, whatever you use.
            </li>
            <li>
              Friends open the same game, tap <em>Multiplayer → Play with Friends → Join a Room</em>, type the code and they&apos;re in.
            </li>
            <li>
              <strong>The host taps Start</strong> (minimum 2 players, maximum 8). Everyone gets the same questions, in the same order, at the same time.
            </li>
            <li>
              After 10 rounds, a <strong>ranked leaderboard</strong> appears with gold 🥇, silver 🥈 and bronze 🥉 medals.
            </li>
          </ol>

          <div className="blog-callout">
            <div className="blog-callout__icon">💡</div>
            <div>
              <strong>Tip:</strong> The host can start even if not everyone has joined yet —
              latecomers can still join with the code while the game is in the lobby.
              Once <em>Start</em> is tapped, the room closes and the game begins.
            </div>
          </div>

          <h2>Up to 8 players, one leaderboard</h2>
          <p>
            Private rooms support up to 8 players simultaneously. Everyone answers the same rounds
            (generated from a shared seed, so there&apos;s zero chance of one player getting easier questions).
            As answers come in, you can see who has answered on the live score bar at the top of the screen.
            Round results are revealed only once everyone has submitted — no peeking.
          </p>
          <p>
            The final leaderboard is sorted by total score, with tied players sharing a rank.
            Screenshot it, share it, argue about it — that&apos;s the point.
          </p>

          <h2>Best games to play with friends</h2>
          <p>
            Not all games are equally fun in a group. Here are the ones that tend to generate
            the most noise in a room — and why:
          </p>

          <div className="blog-game-grid">
            {GAMES.map(g => (
              <Link key={g.href} href={g.href} className="blog-game-card">
                <div className="blog-game-card__emoji">{g.emoji}</div>
                <div className="blog-game-card__body">
                  <div className="blog-game-card__title">{g.title}</div>
                  <div className="blog-game-card__desc">{g.desc}</div>
                </div>
              </Link>
            ))}
          </div>

          <h2>Quick Match vs Private Room — which should you use?</h2>
          <div className="blog-compare">
            <div className="blog-compare__col">
              <div className="blog-compare__label blog-compare__label--qm">Quick Match</div>
              <ul>
                <li>Instant — no code needed</li>
                <li>Paired with a random opponent</li>
                <li>Always 1 vs 1</li>
                <li>Best for solo competitive play</li>
                <li>Bot fallback if no one found in 30 s</li>
              </ul>
            </div>
            <div className="blog-compare__col">
              <div className="blog-compare__label blog-compare__label--pr">Private Room</div>
              <ul>
                <li>4-letter code, share with friends</li>
                <li>2 to 8 players you choose</li>
                <li>Full leaderboard at the end</li>
                <li>Best for groups, game nights, bets</li>
                <li>Host controls when the game starts</li>
              </ul>
            </div>
          </div>

          <h2>No download, no account — ever</h2>
          <p>
            Ultimate Playground runs entirely in the browser. There is nothing to install, no profile
            to create and no payment to make. Private rooms are generated server-side and exist only
            for the duration of the game — your name and score are never stored beyond the session.
          </p>
          <p>
            All you need is a device with a browser and an internet connection. That means you can
            play on your phone during a commute, on a laptop at home, or on a tablet at a friend&apos;s place.
            The layout adapts to every screen size.
          </p>

          <h2>Try it now</h2>
          <p>
            Pick any game below, tap <strong>Multiplayer → Play with Friends → Create a Room</strong>,
            send the code to your group chat, and see who really knows their stuff.
          </p>
          <div className="blog-cta-row">
            <Link href="/football" className="blog-cta-btn blog-cta-btn--primary">⚽ FootballQuiz</Link>
            <Link href="/nba"      className="blog-cta-btn">🏀 NBAQuiz</Link>
            <Link href="/wild-battle" className="blog-cta-btn">🦁 Wild Battle</Link>
            <Link href="/citymix"  className="blog-cta-btn">🌍 CityMix</Link>
          </div>
          <div className="blog-cta-row" style={{ marginTop: 10 }}>
            <Link href="/" className="blog-cta-btn blog-cta-btn--ghost">Browse all games →</Link>
          </div>

        </article>

        {/* ── FAQ ── */}
        <FAQ items={FAQS} />

        {/* ── Back link ── */}
        <div className="blog-back">
          <Link href="/blog">← Back to Blog</Link>
        </div>

      </div>
    </>
  );
}
