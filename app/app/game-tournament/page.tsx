import type { Metadata } from "next";
import Link from "next/link";
import JsonLd from "@/components/JsonLd";
import GamingTournamentGame from "@/components/GamingTournamentGame";
import gamingData from "@/app/game-tournament/games_data.json";
import RelatedGames from "@/components/RelatedGames";
import FAQ from "@/components/FAQ";

const BASE = "https://ultimate-playground.com";

export const metadata: Metadata = {
  title: "Gaming Tournament — Find Your Favorite Video Game",
  description:
    "32 legendary video games face off head-to-head across 5 rounds. Pick your favorites, crown your ultimate game and discover your personal Top 5. Free, no account needed.",
  keywords: [
    "video game tournament",
    "favorite video game quiz",
    "game bracket online",
    "rank video games",
    "best video game quiz",
    "gaming bracket game",
    "video game ranking game",
    "pick your favorite game",
  ],
  openGraph: {
    title: "Gaming Tournament — Crown Your Favorite Video Game",
    description:
      "32 iconic games, 5 rounds, 1 champion. Pick head-to-head and discover your all-time favorite video game.",
    url: `${BASE}/game-tournament`,
    type: "website",
  },
};

export default function GameTournamentPage() {
  return (
    <>
      <JsonLd data={[
        {
          "@context": "https://schema.org",
          "@type": "VideoGame",
          "name": "Gaming Tournament",
          "description":
            "A 32-game bracket tournament. Pick your favourite in each head-to-head matchup across 5 rounds to crown your all-time favourite video game and reveal your personal Top 5.",
          "url": `${BASE}/game-tournament`,
          "genre": ["Quiz", "Trivia", "Entertainment"],
          "gamePlatform": "Browser",
          "applicationCategory": "Game",
          "numberOfPlayers": { "@type": "QuantitativeValue", "minValue": 1, "maxValue": 1 },
          "publisher": { "@type": "Organization", "name": "Ultimate Playground", "url": BASE },
          "inLanguage": "en",
          "isAccessibleForFree": true,
          "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" },
        },
        {
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          "itemListElement": [
            { "@type": "ListItem", "position": 1, "name": "Home",   "item": BASE },
            { "@type": "ListItem", "position": 2, "name": "Gaming", "item": `${BASE}/gaming` },
            { "@type": "ListItem", "position": 3, "name": "Gaming Tournament", "item": `${BASE}/game-tournament` },
          ],
        },
      ]} />

      <GamingTournamentGame initialData={gamingData} />

      <section className="game-seo-section">
        <div className="game-seo-section__inner">
          <h1 className="game-seo-section__h1">
            Gaming Tournament — 32 iconic games, 5 rounds, 1 winner
          </h1>

          <h2>The bracket format that finally answers the question</h2>
          <p>
            Everyone has a favourite video game — but most people have never had to defend it
            in a direct comparison. Gaming Tournament forces you to choose between two specific
            games, right now, with no hedging. That constraint produces more honest answers
            than any top-ten list ever could.
          </p>
          <p>
            Each session draws 32 games at random from a pool of 66 classics, pairs them up
            and asks you to pick the one you&apos;d rather play. The winner advances. Five
            rounds later, one game stands alone as your undisputed champion.
          </p>

          <h2>A pool built from 66 all-time classics</h2>
          <p>
            The 66-game pool spans every major genre and era of modern gaming. Open-world
            giants like GTA V, Red Dead Redemption 2 and The Witcher 3 share the bracket
            with precision shooters like Counter-Strike 2 and DOOM Eternal. FromSoftware
            titles — Elden Ring, Dark Souls, Sekiro — sit alongside cosy favourites like
            Stardew Valley and Terraria.
          </p>
          <p>
            RPG landmarks including Baldur&apos;s Gate 3, Cyberpunk 2077, Skyrim and
            Mass Effect 2 compete with indie legends like Hades, Hollow Knight and Celeste.
            Strategy classics such as Civilization VI and Total War: Warhammer II round out
            a pool designed to surface genuine preferences, not just recency bias.
          </p>

          <h2>How your Top 5 is calculated</h2>
          <p>
            After all 31 matchups, every game is ranked by the number of rounds it won.
            Your champion won all five. Your runner-up won four. Games that fell earlier
            accumulate fewer wins but still earn their place in the final leaderboard.
            The result is a ranked snapshot of your actual preferences — determined
            game-by-game, choice-by-choice.
          </p>

          <h2>No two sessions play out the same</h2>
          <p>
            Because the 32 games are drawn randomly each time, replaying the tournament
            produces a completely different bracket. A rematch between Elden Ring and
            Stardew Valley that went one way today might never appear again. Over multiple
            sessions you can track which titles consistently rise to the top — and which
            ones you always drop when faced with something harder to beat.
          </p>

          <div className="game-seo-section__rules-link">
            <Link href="/game-tournament-rules">📖 Full rules and how Gaming Tournament works →</Link>
          </div>

          <FAQ items={[
            {
              q: "How does Gaming Tournament work?",
              a: "32 games are drawn randomly from a pool of 66 classics and paired up. You pick the game you prefer in each head-to-head matchup. Winners advance through 5 rounds — Round of 32, Round of 16, Quarterfinals, Semifinals and Grand Final — until one game is crowned your champion.",
            },
            {
              q: "Which video games are in the pool?",
              a: "The pool includes 66 legendary games across all genres: GTA V, Red Dead Redemption 2, Elden Ring, The Witcher 3, Cyberpunk 2077, Skyrim, Half-Life 2, Portal 2, Hades, Stardew Valley, Baldur's Gate 3, Hollow Knight, Celeste, Dark Souls, Sekiro, Counter-Strike 2, Minecraft, Terraria, Mass Effect 2, Civilization VI and many more.",
            },
            {
              q: "How is my Top 5 calculated?",
              a: "Your Top 5 is ranked by total wins across all rounds. Your champion won 5 rounds, the finalist won 4, semifinalists won 3 and so on. Games with equal wins are ordered by when they were eliminated.",
            },
            {
              q: "Can I replay the tournament?",
              a: "Yes — clicking Play Again draws a completely new random selection of 32 games from the pool. The matchups will be different every time, so replaying often gives you new results and new head-to-head dilemmas.",
            },
            {
              q: "Is Gaming Tournament free to play?",
              a: "Yes, Gaming Tournament is completely free. No account, no download and no payment required. Play directly in your browser on desktop or mobile.",
            },
          ]} />
        </div>
      </section>

      <RelatedGames currentSlug="/game-tournament" />
    </>
  );
}
