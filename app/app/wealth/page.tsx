import type { Metadata } from "next";
import WealthGame from "@/components/WealthGame";
import JsonLd from "@/components/JsonLd";

export const metadata: Metadata = {
  title: "Who's Richer? — Celebrity Wealth Quiz | Ultimate Playground",
  description:
    "Compare celebrity net worths and guess who's richer. Elon Musk vs Jeff Bezos? MrBeast vs Rihanna? Test your knowledge of billionaire fortunes in this addictive wealth quiz!",
};

const BASE = "https://ultimate-playground.com";

export default function WealthPage() {
  return (
    <>
      <JsonLd data={[
        {
          "@context": "https://schema.org",
          "@type": "WebApplication",
          "name": "Who's Richer?",
          "url": `${BASE}/wealth`,
          "description":
            "Compare celebrity net worths and guess who's richer. Elon Musk vs Jeff Bezos? MrBeast vs Rihanna? Test your billionaire knowledge!",
          "applicationCategory": "Game",
          "genre": "Trivia Game",
          "operatingSystem": "Any",
          "inLanguage": "en",
          "isAccessibleForFree": true,
          "offers": { "@type": "Offer", "price": "0", "priceCurrency": "EUR" },
          "publisher": { "@type": "Organization", "name": "Ultimate Playground", "url": BASE },
        },
        {
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          "itemListElement": [
            { "@type": "ListItem", "position": 1, "name": "Home",    "item": BASE },
            { "@type": "ListItem", "position": 2, "name": "Culture", "item": `${BASE}/culture` },
            { "@type": "ListItem", "position": 3, "name": "Who's Richer?", "item": `${BASE}/wealth` },
          ],
        },
      ]} />

      <WealthGame />

      <section className="game-seo-section">
        <div className="game-seo-section__inner">
          <h1 className="game-seo-section__h1">
            Who&apos;s Richer? — The Celebrity Net Worth Quiz
          </h1>

          <h2>What is Who&apos;s Richer?</h2>
          <p>
            Who&apos;s Richer? is an addictive celebrity wealth quiz where you compare
            the net worths of famous billionaires, athletes, musicians, royals and
            entertainers. Two celebrities appear on screen — your job is to tap the one
            who is worth more money.
          </p>
          <p>
            From tech giants like Elon Musk and Jeff Bezos to music moguls like Jay-Z
            and Rihanna, from sports legends like Michael Jordan and Tiger Woods to royals
            like Sheikh Mansour — the range spans every category of celebrity wealth.
          </p>

          <h2>How to play</h2>
          <p>
            The rules are simple: two celebrities appear side by side. Tap the one with
            the higher net worth. After your answer, both fortunes are revealed so you
            can see exactly how the two compare.
          </p>
          <ul>
            <li>Duel rounds: tap the richer celebrity — +100 points for a correct answer</li>
            <li>Estimation rounds: choose the correct net worth from three options</li>
            <li>Solo mode: one wrong answer ends your run — survive as long as you can</li>
            <li>Multiplayer: 10 rounds, both players answer the same pairs</li>
          </ul>

          <h2>Streak multipliers</h2>
          <p>
            In solo mode, building a streak multiplies your score. Answer 5 or more in
            a row and you earn a ×1.5 multiplier. Reach 10 consecutive correct answers
            and every question is worth ×2. The fire emoji appears when your streak kicks
            in — keep going!
          </p>

          <h2>Who&apos;s in the game?</h2>
          <p>
            The game features 80+ well-known celebrities from six categories:
          </p>
          <ul>
            <li><strong>Tech</strong> — Elon Musk, Jeff Bezos, Mark Zuckerberg, Bill Gates, Jensen Huang</li>
            <li><strong>Business</strong> — Warren Buffett, Bernard Arnault, Michael Bloomberg, Ken Griffin</li>
            <li><strong>Entertainment</strong> — Oprah Winfrey, George Lucas, Dwayne Johnson, Kim Kardashian</li>
            <li><strong>Music</strong> — Jay-Z, Taylor Swift, Rihanna, Paul McCartney, Beyoncé, Madonna</li>
            <li><strong>Sports</strong> — Michael Jordan, Tiger Woods, LeBron James, Roger Federer, Cristiano Ronaldo</li>
            <li><strong>Royals</strong> — King Charles III, Sheikh Mansour, King Mohammed VI</li>
          </ul>

          <h2>Play Who&apos;s Richer? online for free</h2>
          <p>
            No download or account required. Play instantly in your browser on desktop or
            mobile. Challenge a friend in real-time multiplayer and see who has the better
            knowledge of celebrity fortunes.
          </p>
          <p>How many billionaires can you rank correctly? Start playing now.</p>
        </div>
      </section>
    </>
  );
}
