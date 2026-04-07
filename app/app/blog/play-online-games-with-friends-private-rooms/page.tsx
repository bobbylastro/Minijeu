import type { Metadata } from "next";
import Link from "next/link";
import JsonLd from "@/components/JsonLd";
import FAQ from "@/components/FAQ";

const BASE  = "https://ultimate-playground.com";
const SLUG  = "/blog/play-online-games-with-friends-private-rooms";
const TITLE = "Play Online Games with Friends — Private Rooms on Ultimate Playground";
const DESCRIPTION =
  "Create a private room, share a 4-letter code and play free online quiz games with your friends in real time. Up to 8 players. No account needed — just pick a game and go.";
const DATE_PUB = "2026-04-07T00:00:00Z";

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
    "browser quiz game group",
  ],
  alternates: { canonical: `${BASE}${SLUG}` },
  openGraph: {
    title: `${TITLE} | Ultimate Playground`,
    description: DESCRIPTION,
    url: `${BASE}${SLUG}`,
    type: "article",
    publishedTime: DATE_PUB,
    modifiedTime: DATE_PUB,
    authors: ["Ultimate Playground"],
    tags: ["multiplayer", "private rooms", "quiz games", "free games", "play with friends"],
  },
  twitter: { card: "summary_large_image", title: TITLE, description: DESCRIPTION },
};

const GAMES = [
  { href: "/football",       emoji: "⚽", title: "FootballQuiz",    desc: "Transfer fees, stadiums, salaries & trivia — 10 fast rounds. Perfect for football group nights." },
  { href: "/nba",            emoji: "🏀", title: "NBAQuiz",         desc: "Contracts, arenas, salary battles, basketball trivia. Great for NBA friend groups across timezones." },
  { href: "/wild-battle",    emoji: "🦁", title: "Wild Battle",     desc: "Who wins — 3 crocodiles or 1 hippo? Animal battles that spark instant debates." },
  { href: "/career",         emoji: "🔀", title: "CareerOrder",     desc: "Rebuild a footballer's club history in order. Tap to place, tap to swap — chaos guaranteed." },
  { href: "/citymix",        emoji: "🌍", title: "CityMix",         desc: "Which city is bigger? Then slide to guess the exact population. Fast, visual, competitive." },
  { href: "/wcf",            emoji: "⏳", title: "WhatCameFirst?",  desc: "Sports records, tech launches, historic events — which happened first?" },
  { href: "/five-clues",     emoji: "🔍", title: "Five Clues",      desc: "Five cryptic hints, one mystery player. Fewer clues = more points." },
  { href: "/higher-or-lower",emoji: "📊", title: "Higher or Lower", desc: "Compare two countries on population, GDP, area or coastline. Deceptively simple." },
];

const RELATED_ARTICLES = [
  { href: "/blog/online-trivia-games-to-play-with-friends", emoji: "🧠", title: "Best Online Trivia Games to Play with Friends (2026)" },
  { href: "/blog/best-online-football-quiz-games",          emoji: "⚽", title: "Best Free Online Football Quiz Games (2026)" },
  { href: "/blog/best-animal-quiz-games-online",            emoji: "🦁", title: "Best Free Online Animal Quiz Games (2026)" },
  { href: "/blog/best-browser-games-to-stream-on-twitch",  emoji: "🎮", title: "Best Free Browser Games to Stream on Twitch" },
];

const FAQS = [
  {
    q: "Do I need an account to create a private room?",
    a: "No. Private rooms are completely anonymous — just pick a game, tap Multiplayer, then Play with Friends. A 4-letter code is generated instantly. Share it and you're ready.",
  },
  {
    q: "How many players can join one private room?",
    a: "Up to 8 players can join a single private room. The game starts as soon as the host taps Start, with a minimum of 2 players. Anyone with the code can join before the host starts.",
  },
  {
    q: "What happens if someone disconnects during the game?",
    a: "Disconnected players have an 8-second window to reconnect and pick up exactly where they left off. If they don't reconnect in time, the remaining players carry on automatically.",
  },
  {
    q: "Is there a leaderboard at the end of the game?",
    a: "Yes — private room games always end with a ranked leaderboard showing every player's score, with gold, silver and bronze medals for the top three. Screenshot-worthy.",
  },
  {
    q: "Can I use Quick Match and private rooms on the same game?",
    a: "Absolutely. Every multiplayer game supports both modes. Quick Match pairs you with a random stranger in seconds; private rooms let you choose exactly who joins.",
  },
  {
    q: "Do all players see the same questions?",
    a: "Yes. The server generates a single random seed before the game starts and distributes it to every player. Everyone sees the same questions in the same order — no advantage on any side.",
  },
  {
    q: "Which games support private rooms?",
    a: "FootballQuiz, NBAQuiz, Wild Battle, CareerOrder, CityMix, WhatCameFirst?, Five Clues, Higher or Lower, Food Origins, Origins Quiz, City Mapper and Wealth — every multiplayer game on the platform.",
  },
  {
    q: "Is it free?",
    a: "Yes, entirely. No subscription, no in-app purchases, no sign-up required. Open the browser, share the code, play.",
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
          "datePublished": DATE_PUB,
          "dateModified": DATE_PUB,
          "author": { "@type": "Organization", "name": "Ultimate Playground", "url": BASE },
          "publisher": {
            "@type": "Organization",
            "name": "Ultimate Playground",
            "url": BASE,
            "logo": { "@type": "ImageObject", "url": `${BASE}/icon.png` },
          },
          "inLanguage": "en",
          "keywords": "play online games with friends, private room, multiplayer quiz, free online quiz game",
          "mainEntityOfPage": { "@type": "WebPage", "@id": `${BASE}${SLUG}` },
        },
        {
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          "itemListElement": [
            { "@type": "ListItem", "position": 1, "name": "Home", "item": BASE },
            { "@type": "ListItem", "position": 2, "name": "Blog", "item": `${BASE}/blog` },
            { "@type": "ListItem", "position": 3, "name": TITLE,  "item": `${BASE}${SLUG}` },
          ],
        },
        {
          "@context": "https://schema.org",
          "@type": "ItemList",
          "name": "Best Online Games to Play with Friends in a Private Room",
          "description": "Top free browser-based quiz games with private room multiplayer support — up to 8 players, no account required.",
          "url": `${BASE}${SLUG}`,
          "numberOfItems": GAMES.length,
          "itemListElement": GAMES.map((g, i) => ({
            "@type": "ListItem",
            "position": i + 1,
            "name": g.title,
            "url": `${BASE}${g.href}`,
            "description": g.desc,
          })),
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
        {
          "@context": "https://schema.org",
          "@type": "HowTo",
          "name": "How to create a private room on Ultimate Playground",
          "description": "Step-by-step guide to setting up a private multiplayer game room for friends.",
          "step": [
            { "@type": "HowToStep", "position": 1, "name": "Open a multiplayer game", "text": "Go to any multiplayer game — FootballQuiz, Wild Battle, CityMix, and more." },
            { "@type": "HowToStep", "position": 2, "name": "Tap Multiplayer then Play with Friends", "text": "Enter your name, then choose 'Play with Friends' instead of Quick Match." },
            { "@type": "HowToStep", "position": 3, "name": "Create a Room", "text": "Tap Create a Room to instantly generate a unique 4-letter code." },
            { "@type": "HowToStep", "position": 4, "name": "Share the code", "text": "Copy the code and send it via WhatsApp, Discord, iMessage or any messaging app." },
            { "@type": "HowToStep", "position": 5, "name": "Friends join", "text": "Friends open the same game, tap Multiplayer → Play with Friends → Join a Room, enter the code." },
            { "@type": "HowToStep", "position": 6, "name": "Host starts the game", "text": "Once at least 2 players are in the lobby, the host taps Start and the game begins for everyone." },
          ],
        },
      ]} />

      <div className="home-page">
        <div className="home-page__content">
          <article className="blog-article">

            {/* Breadcrumb */}
            <nav className="blog-article__breadcrumb" aria-label="Breadcrumb">
              <Link href="/">Home</Link>
              <span>/</span>
              <Link href="/blog">Blog</Link>
              <span>/</span>
              <span>Play with Friends</span>
            </nav>

            {/* Header */}
            <header className="blog-article__header">
              <div className="blog-article__tags">
                <span className="blog-article__tag">Multiplayer</span>
                <span className="blog-article__tag">Feature</span>
                <span className="blog-article__tag">Free Games</span>
              </div>
              <h1 className="blog-article__h1">👥 {TITLE}</h1>
              <p className="blog-article__lead">
                Forget coordinating accounts, installs or subscriptions. Create a private room in two taps,
                share a 4-letter code and compete with up to 8 friends from anywhere in the world —
                on any game, instantly. No sign-up, no download, no cost.
              </p>
              <div className="blog-article__meta">
                <span>April 7, 2026</span>
                <span>·</span>
                <span>4 min read</span>
                <span>·</span>
                <span>By Ultimate Playground</span>
              </div>
            </header>

            {/* Body */}
            <div className="blog-article__body">

              <h2>Why a private room beats Quick Match for friend groups</h2>
              <p>
                Quick Match is perfect for a fast competitive fix against a stranger.
                But when you want to settle a bet with your flatmates, test your group chat&apos;s
                football knowledge, or just have a laugh with people you actually know —
                you need a room of your own.
              </p>
              <p>
                Private rooms on Ultimate Playground give you exactly that: a closed game lobby,
                accessible by code only, with a live ranked leaderboard at the end.
                No app store. No profile. No friction.
              </p>

              <div className="blog-stats">
                <div className="blog-stat">
                  <div className="blog-stat__value">8</div>
                  <div className="blog-stat__label">players max per room</div>
                </div>
                <div className="blog-stat">
                  <div className="blog-stat__value">4</div>
                  <div className="blog-stat__label">letter room code</div>
                </div>
                <div className="blog-stat">
                  <div className="blog-stat__value">10</div>
                  <div className="blog-stat__label">rounds per game</div>
                </div>
                <div className="blog-stat">
                  <div className="blog-stat__value">0</div>
                  <div className="blog-stat__label">accounts needed</div>
                </div>
              </div>

              <h2>How to set up a private room — 6 steps</h2>
              <ol className="blog-steps">
                <li>
                  <span><strong>Open any multiplayer game</strong> — FootballQuiz, Wild Battle, CityMix, NBAQuiz… pick your game.</span>
                </li>
                <li>
                  <span><strong>Tap Multiplayer</strong>, enter your name, then choose <em>Play with Friends</em>.</span>
                </li>
                <li>
                  <span><strong>Tap Create a Room.</strong> A unique 4-letter code appears instantly — e.g. <code className="blog-code">WOLF</code> or <code className="blog-code">K7PQ</code>.</span>
                </li>
                <li>
                  <span><strong>Copy and share the code</strong> — paste it into WhatsApp, Discord, iMessage or any group chat.</span>
                </li>
                <li>
                  <span>Friends open the same game, tap <em>Multiplayer → Play with Friends → Join a Room</em>, type the code and they&apos;re in.</span>
                </li>
                <li>
                  <span><strong>The host taps Start</strong> (minimum 2 players). Everyone gets the same questions, same order, same time.</span>
                </li>
              </ol>

              <div className="blog-callout">
                <div className="blog-callout__icon">💡</div>
                <div>
                  <strong>Tip:</strong> The room stays open until the host starts. Friends can join at any point
                  while you&apos;re in the lobby — just keep sharing the code until everyone is in.
                </div>
              </div>

              <h2>What happens during and after the game</h2>
              <p>
                Once the game starts, everyone answers the same 10 rounds simultaneously.
                A compact live score bar at the top of the screen shows everyone&apos;s rank in real time —
                you can see who has answered each round without revealing the actual answers until
                everyone submits. No peeking.
              </p>
              <p>
                After the final round, a <strong>ranked leaderboard</strong> appears with 🥇 🥈 🥉 medals
                for the top three. Scores are sorted by total points, with ties sharing a rank.
                Screenshot it, share it, argue about it.
              </p>

              <div className="blog-callout blog-callout--green">
                <div className="blog-callout__icon">🔁</div>
                <div>
                  If someone disconnects mid-game, they have <strong>8 seconds to reconnect</strong> and
                  pick up exactly where they left off. If they don&apos;t make it back in time,
                  the remaining players continue without them.
                </div>
              </div>

              <h2>Best games to play with friends</h2>
              <p>
                Every multiplayer game on Ultimate Playground supports private rooms.
                These are the ones that consistently generate the most noise in a group:
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

              <h2>Quick Match vs Private Room</h2>
              <div className="blog-compare">
                <div className="blog-compare__col">
                  <span className="blog-compare__label blog-compare__label--qm">Quick Match</span>
                  <ul>
                    <li>Instant pairing — no code</li>
                    <li>Random opponent online</li>
                    <li>Always 1 vs 1</li>
                    <li>Bot fills in if no match in 30 s</li>
                    <li>Best for solo competitive play</li>
                  </ul>
                </div>
                <div className="blog-compare__col">
                  <span className="blog-compare__label blog-compare__label--pr">Private Room</span>
                  <ul>
                    <li>4-letter code, share with friends</li>
                    <li>2 to 8 players of your choice</li>
                    <li>Full ranked leaderboard at end</li>
                    <li>Host controls the start time</li>
                    <li>Best for groups, game nights, bets</li>
                  </ul>
                </div>
              </div>

              <h2>No download, no account — ever</h2>
              <p>
                Ultimate Playground runs entirely in the browser. There is nothing to install,
                no profile to create and no payment to make. Private rooms exist only for the
                duration of the game — your name and score are never stored beyond the session.
              </p>
              <p>
                Works on any device with a browser: phone, tablet, laptop. The layout adapts
                automatically. You can be on your phone while a friend is on a laptop —
                it makes no difference.
              </p>

              <h2>Try it now</h2>
              <p>Pick a game, create a room, share the code.</p>

              <div className="blog-btn-row">
                <Link href="/football"    className="blog-btn blog-btn--primary">⚽ FootballQuiz</Link>
                <Link href="/nba"         className="blog-btn blog-btn--outline">🏀 NBAQuiz</Link>
                <Link href="/wild-battle" className="blog-btn blog-btn--outline">🦁 Wild Battle</Link>
                <Link href="/citymix"     className="blog-btn blog-btn--outline">🌍 CityMix</Link>
              </div>
              <div className="blog-btn-row">
                <Link href="/" className="blog-btn blog-btn--outline">Browse all games →</Link>
              </div>

              {/* FAQ */}
              <h2>Frequently asked questions</h2>
              <FAQ items={FAQS} />

            </div>

            {/* Related articles */}
            <nav className="blog-related" aria-label="Related articles">
              <div className="blog-related__title">Related articles</div>
              <div className="blog-related__links">
                {RELATED_ARTICLES.map(a => (
                  <Link key={a.href} href={a.href} className="blog-related__link">
                    <span className="blog-related__link-emoji">{a.emoji}</span>
                    <span className="blog-related__link-title">{a.title}</span>
                    <span className="blog-related__link-arrow">→</span>
                  </Link>
                ))}
              </div>
            </nav>

          </article>
        </div>
      </div>
    </>
  );
}
