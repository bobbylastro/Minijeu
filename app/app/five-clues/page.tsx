import type { Metadata } from "next";
import Link from "next/link";
import FiveCluesGame from "@/components/FiveCluesGame";
import fiveCluesData from "@/app/five-clues-data.json";
import RelatedGames from "@/components/RelatedGames";
import JsonLd from "@/components/JsonLd";
import FAQ from "@/components/FAQ";

export const metadata: Metadata = {
  title: "5 Clues — Who Am I? Quiz Game",
  description:
    "5 progressive clues, 3 attempts. Guess the famous person — athletes, musicians, actors, historical figures and more. Play solo or challenge a friend in real-time multiplayer.",
};

const BASE = "https://ultimate-playground.com";

export default function FiveCluesPage() {
  return (
    <>
      <JsonLd data={[
        {
          "@context": "https://schema.org",
          "@type": "WebApplication",
          "name": "5 Clues — Who Am I?",
          "url": `${BASE}/five-clues`,
          "description":
            "5 progressive clues, 3 attempts. Guess the famous person across sport, music, cinema, history and business. Play solo or in real-time multiplayer.",
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
            { "@type": "ListItem", "position": 3, "name": "5 Clues", "item": `${BASE}/five-clues` },
          ],
        },
      ]} />

      <FiveCluesGame initialData={fiveCluesData} />

      <section className="game-seo-section">
        <div className="game-seo-section__inner">
          <h1 className="game-seo-section__h1">
            5 Clues — Who Am I? The Famous Person Quiz
          </h1>

          <h2>What is 5 Clues?</h2>
          <p>
            5 Clues is a progressive trivia game where you must identify a famous person
            from up to five clues, each one more specific than the last. You have 3 attempts
            per round — the fewer clues you need, the more points you earn.
          </p>
          <p>
            From sporting legends like Cristiano Ronaldo and Muhammad Ali to music icons
            like Freddie Mercury and Bob Marley, from film stars like Leonardo DiCaprio
            to historical figures like Marie Curie and Nikola Tesla — every category of
            fame is represented.
          </p>

          <h2>How to play</h2>
          <p>
            Each round begins with the first clue — deliberately vague. Type your guess
            and hit Submit. Wrong? A second clue appears. You have 3 attempts spread
            across all 5 clues to find the answer.
          </p>
          <ul>
            <li><strong>Correct on clue 1:</strong> 500 points — the maximum</li>
            <li><strong>Correct on clue 2:</strong> 400 points</li>
            <li><strong>Correct on clue 3:</strong> 300 points</li>
            <li><strong>Correct on clue 4:</strong> 200 points</li>
            <li><strong>Correct on clue 5:</strong> 100 points</li>
            <li>3 wrong attempts or all 5 clues exhausted: 0 points</li>
          </ul>
          <p>
            You can also click <em>Next Clue</em> at any time without using an attempt
            — useful when you want more information before committing to a guess.
          </p>

          <h2>Typos? No problem</h2>
          <p>
            The answer checker uses fuzzy matching to tolerate spelling mistakes and
            missing accents. Type &quot;Ronaldo&quot;, &quot;ronaldu&quot; or &quot;CR7&quot; — all
            accepted. The same goes for accented names: &quot;Pele&quot; works as well as
            &quot;Pelé&quot;, &quot;Beyonce&quot; as well as &quot;Beyoncé&quot;. Common nicknames and
            shortened names are also accepted where obvious.
          </p>

          <h2>Who&apos;s in the game?</h2>
          <p>
            The game features 50 well-known personalities from six categories:
          </p>
          <ul>
            <li><strong>Sport</strong> — Ronaldo, Messi, Michael Jordan, LeBron James, Usain Bolt, Roger Federer, Muhammad Ali, Serena Williams, Pelé, Kobe Bryant, Ayrton Senna, Zinedine Zidane and more</li>
            <li><strong>Music</strong> — Michael Jackson, Elvis Presley, Freddie Mercury, Bob Marley, David Bowie, Eminem, Beyoncé, Taylor Swift, Rihanna, Adele, Kurt Cobain and more</li>
            <li><strong>Film</strong> — Leonardo DiCaprio, Marilyn Monroe, Charlie Chaplin, Tom Hanks, Morgan Freeman, Arnold Schwarzenegger, Will Smith</li>
            <li><strong>History &amp; Science</strong> — Albert Einstein, Nelson Mandela, Martin Luther King Jr., Gandhi, Marie Curie, Nikola Tesla, Charles Darwin, Leonardo da Vinci, Napoleon, Stephen Hawking</li>
            <li><strong>Business</strong> — Steve Jobs, Bill Gates, Elon Musk, Mark Zuckerberg, Oprah Winfrey</li>
            <li><strong>Politics</strong> — Barack Obama, Winston Churchill, Vladimir Putin</li>
          </ul>

          <h2>Multiplayer — challenge a friend</h2>
          <p>
            In multiplayer mode, both players see the same 10 people, generated from
            the same seed. Each player advances through clues at their own pace. When
            both have submitted their answers, the round result is revealed — who guessed
            it on fewer clues?
          </p>
          <p>
            Can&apos;t find an opponent? After 30 seconds the game automatically connects
            you to a bot so you can play immediately.
          </p>

          <h2>Play 5 Clues online for free</h2>
          <p>
            No download, no account, no payment required. Play instantly in your browser
            on desktop or mobile. A new set of 10 people every game — never the same
            combination twice.
          </p>

          <div className="game-seo-section__rules-link">
            <Link href="/five-clues-rules">📖 Full rules and how to play 5 Clues →</Link>
          </div>

          <FAQ items={[
            {
              q: "Is 5 Clues free to play?",
              a: "Yes, completely free. No account or download needed — play instantly in your browser on desktop or mobile.",
            },
            {
              q: "How does the scoring work in 5 Clues?",
              a: "You earn more points for guessing early: 500 points if you identify the person on the first clue, down to 100 for the fifth. Three wrong guesses or exhausting all 5 clues without the right answer gives 0 for that round.",
            },
            {
              q: "Does 5 Clues accept spelling mistakes?",
              a: "Yes — 5 Clues uses fuzzy matching to tolerate typos, missing accents and common nickname variations. 'Ronaldo', 'ronaldu' and 'CR7' are all accepted.",
            },
          ]} />
        </div>
      </section>

      <RelatedGames currentSlug="/five-clues" />
    </>
  );
}
