import type { Metadata } from "next";
import Link from "next/link";
import JsonLd from "@/components/JsonLd";
import FAQ from "@/components/FAQ";

const BASE = "https://ultimate-playground.com";
const SLUG = "/blog/best-online-geography-quiz-games";
const TITLE = "Best Free Online Geography Quiz Games (2026)";
const DESCRIPTION =
  "Discover the best free online geography quiz games. Test your knowledge of cities, countries, populations and maps. Play solo or against friends — no download required.";

export const metadata: Metadata = {
  title: `${TITLE} | Ultimate Playground`,
  description: DESCRIPTION,
  keywords: [
    "geography quiz online",
    "best geography quiz games",
    "city quiz game",
    "world geography game",
    "free geography quiz",
    "geography trivia online",
    "map quiz game",
  ],
  alternates: { canonical: `${BASE}${SLUG}` },
  openGraph: {
    title: `${TITLE} | Ultimate Playground`,
    description: DESCRIPTION,
    url: `${BASE}${SLUG}`,
    type: "article",
    publishedTime: "2026-04-02T00:00:00Z",
    modifiedTime: "2026-04-02T00:00:00Z",
    authors: ["Ultimate Playground"],
    tags: ["geography", "quiz", "online games", "free games"],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
  },
};

const FAQ_ITEMS = [
  {
    q: "Are online geography quiz games free to play?",
    a: "Yes — the best ones like CityMix, Higher or Lower and City Mapper on Ultimate Playground are completely free, with no account, download or payment required.",
  },
  {
    q: "Can I play geography quiz games on my phone?",
    a: "Absolutely. All the games listed here run directly in your mobile browser and are fully optimised for touch screens. No app installation needed.",
  },
  {
    q: "What geography topics do online quiz games cover?",
    a: "Topics range from city and country populations, GDP, area and coastline comparisons to visual city recognition and map placement. The breadth varies by game — CityMix focuses on city sizes, Higher or Lower covers country statistics, and City Mapper tests your ability to place a city on the world map.",
  },
  {
    q: "Can I play geography quiz games with friends?",
    a: "Yes. Ultimate Playground's geography games all support real-time multiplayer — both players receive the same questions from a shared seed, so it is always fair. If no opponent is found quickly, a bot steps in so you never wait long.",
  },
  {
    q: "How do I get better at geography quizzes?",
    a: "Play regularly and pay attention to the results screen — wrong answers often reveal surprising facts. Mixing different game types (population sliders, country comparisons, map clicks) builds a much broader mental map than sticking to one format.",
  },
];

export default function BestGeographyQuizPage() {
  return (
    <>
      <JsonLd data={[
        {
          "@context": "https://schema.org",
          "@type": "Article",
          "headline": TITLE,
          "description": DESCRIPTION,
          "url": `${BASE}${SLUG}`,
          "datePublished": "2026-04-02",
          "dateModified": "2026-04-02",
          "inLanguage": "en",
          "author": { "@type": "Organization", "name": "Ultimate Playground", "url": BASE },
          "publisher": {
            "@type": "Organization",
            "name": "Ultimate Playground",
            "url": BASE,
            "logo": { "@type": "ImageObject", "url": `${BASE}/icon.png` },
          },
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
              <span>Geography Quiz Games</span>
            </nav>

            {/* Header */}
            <header className="blog-article__header">
              <div className="blog-article__tags">
                <span className="blog-article__tag">World</span>
                <span className="blog-article__tag">Guide</span>
                <span className="blog-article__tag">Free Games</span>
              </div>
              <h1 className="blog-article__h1">🌍 {TITLE}</h1>
              <p className="blog-article__lead">
                Whether you are trying to sharpen your world knowledge or just want a fun game to
                play during a break, online geography quiz games are one of the best ways to learn
                while competing. This guide covers the top free options available in 2026 — all
                playable instantly in your browser, no sign-up required.
              </p>
              <div className="blog-article__meta">
                <span>Apr 2, 2026</span>
                <span>·</span>
                <span>5 min read</span>
                <span>·</span>
                <span>By Ultimate Playground</span>
              </div>
            </header>

            {/* Body */}
            <div className="blog-article__body">

              <h2>What makes a great geography quiz game?</h2>
              <p>
                Not all geography games are equal. The best ones combine accuracy (real data, not
                guesstimates), variety (multiple question types), and replayability (enough content
                that rounds feel fresh each time). Bonus points if they offer a multiplayer mode so
                you can challenge friends in real time.
              </p>
              <p>
                Here are the formats that tend to make geography quiz games genuinely addictive:
              </p>
              <ul>
                <li><strong>Population sliders</strong> — drag to guess a city or country&apos;s population in millions.</li>
                <li><strong>Bigger vs smaller</strong> — pick which city, country or stat is larger.</li>
                <li><strong>Map click</strong> — a city name or photo appears and you click its country on the map.</li>
                <li><strong>Country stat comparisons</strong> — GDP, area, coastline, life expectancy head-to-head.</li>
              </ul>

              <h2>Best free online geography quiz games in 2026</h2>

              <h3>1. CityMix — pick the bigger city, then guess the population</h3>
              <p>
                <Link href="/citymix">CityMix</Link> presents two cities side by side and asks
                which one has the larger population. After you pick, a slider lets you estimate the
                exact number. It is a two-step mechanic that rewards both directional and numerical
                thinking. With hundreds of cities from every continent, rounds stay fresh for a
                long time.
              </p>

              <Link href="/citymix" className="blog-cta">
                <div className="blog-cta__left">
                  <p className="blog-cta__label">Play free on Ultimate Playground</p>
                  <p className="blog-cta__title">🌍 CityMix</p>
                  <p className="blog-cta__desc">Pick the bigger city, then slide to guess its exact population. Solo & multiplayer.</p>
                </div>
                <span className="blog-cta__btn">Play now →</span>
              </Link>

              <h3>2. Higher or Lower — compare countries on six stats</h3>
              <p>
                <Link href="/higher-or-lower">Higher or Lower</Link> puts two countries head to
                head and asks which one ranks higher across six categories: population, GDP, area,
                coastline, life expectancy, and more. It is quick to learn but surprisingly
                difficult to master — especially once you move beyond the most famous countries.
              </p>

              <Link href="/higher-or-lower" className="blog-cta">
                <div className="blog-cta__left">
                  <p className="blog-cta__label">Play free on Ultimate Playground</p>
                  <p className="blog-cta__title">📊 Higher or Lower</p>
                  <p className="blog-cta__desc">Compare two countries on population, GDP, area, coastline and more. Solo & multiplayer.</p>
                </div>
                <span className="blog-cta__btn">Play now →</span>
              </Link>

              <h3>3. City Mapper — find the country behind the photo</h3>
              <p>
                <Link href="/city-origins">City Mapper</Link> is the most visual of the three. A
                city photo and name appear on screen, and you click the correct country on an
                interactive world map. With 100 cities across 68 countries and a timer adding
                pressure, this is the game that will genuinely expand your geographical awareness
                the fastest.
              </p>

              <Link href="/city-origins" className="blog-cta">
                <div className="blog-cta__left">
                  <p className="blog-cta__label">Play free on Ultimate Playground</p>
                  <p className="blog-cta__title">🏙️ City Mapper</p>
                  <p className="blog-cta__desc">A city photo appears — click the country on the world map. 100 cities from every continent.</p>
                </div>
                <span className="blog-cta__btn">Play now →</span>
              </Link>

              <h2>Why play geography games online?</h2>
              <p>
                Geography is one of those subjects where the traditional approach — memorising
                country capitals from a list — rarely sticks. Game-based learning works
                differently. When you guess wrong, you feel the surprise of the correct answer,
                which makes it far more memorable than reading a statistic on a page.
              </p>
              <p>
                Online geography quiz games are also completely frictionless: no app to install,
                no account to create, no cost. You can play for two minutes between meetings or
                go deep for an hour trying to beat a friend&apos;s score.
              </p>

              <h2>Play solo or challenge a friend in multiplayer</h2>
              <p>
                All three geography games on <Link href="/">Ultimate Playground</Link> support
                real-time multiplayer. Both players receive the same questions from a shared seed,
                so the result is always decided by knowledge, not luck. If no opponent is found
                within 30 seconds, a bot steps in — so you are never left waiting.
              </p>
              <p>
                Want to explore more categories beyond geography? Check out our{" "}
                <Link href="/sports">Sports games</Link> (football transfers, NBA contracts),{" "}
                <Link href="/culture">Culture games</Link> (word origins, wealth rankings) and{" "}
                <Link href="/animals">Animals games</Link> (wild battle challenges).
              </p>

              <h2>Tips to improve your geography quiz scores</h2>
              <ul>
                <li>Pay attention to the results screen — wrong answers reveal surprising facts that stick.</li>
                <li>Mix game types: population sliders build number intuition, map clicks build spatial awareness.</li>
                <li>Focus on regions you know least — Southeast Asia, Central Africa and Central America are common blind spots.</li>
                <li>Play with a friend: explaining why you picked an answer out loud reinforces the learning.</li>
                <li>Return to the same game after a week — spaced repetition dramatically improves retention.</li>
              </ul>

              <div className="cat-page__seo" style={{ marginTop: 40 }}>
                <FAQ items={FAQ_ITEMS} />
              </div>

              {/* Related articles */}
              <div className="blog-related">
                <p className="blog-related__title">More from the blog</p>
                <div className="blog-related__links">
                  <Link href="/blog/best-online-football-quiz-games" className="blog-related__link">
                    <span className="blog-related__link-emoji">⚽</span>
                    <span className="blog-related__link-title">Best Free Online Football Quiz Games (2026)</span>
                    <span className="blog-related__link-arrow">→</span>
                  </Link>
                  <Link href="/blog/online-trivia-games-to-play-with-friends" className="blog-related__link">
                    <span className="blog-related__link-emoji">🧠</span>
                    <span className="blog-related__link-title">Best Online Trivia Games to Play with Friends (2026)</span>
                    <span className="blog-related__link-arrow">→</span>
                  </Link>
                </div>
              </div>

            </div>
          </article>
        </div>
      </div>
    </>
  );
}
