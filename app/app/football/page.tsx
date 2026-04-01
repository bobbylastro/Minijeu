import type { Metadata } from "next";
import Link from "next/link";
import FootballQuizGame from "@/components/FootballQuizGame";
import RelatedGames from "@/components/RelatedGames";
import JsonLd from "@/components/JsonLd";
import FAQ from "@/components/FAQ";

export const metadata: Metadata = {
  title: "Football Quiz – Trivia, transfers and stadiums online",
  description:
    "Test your football knowledge with FootballQuiz: trivia, stadiums, transfers and peak seasons. A fast, fun and addictive online game.",
};

const BASE = "https://ultimate-playground.com";

export default function FootballPage() {
  return (
    <>
      <JsonLd data={[
        {
          "@context": "https://schema.org",
          "@type": "WebApplication",
          "name": "FootballQuiz",
          "url": `${BASE}/football`,
          "description": "Test your football knowledge with FootballQuiz: trivia, stadiums, transfers and peak seasons. A fast, fun and addictive online game.",
          "applicationCategory": "Game",
          "genre": "Quiz Game",
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
            { "@type": "ListItem", "position": 2, "name": "Sports",  "item": `${BASE}/sports` },
            { "@type": "ListItem", "position": 3, "name": "FootballQuiz", "item": `${BASE}/football` },
          ],
        },
      ]} />
      <FootballQuizGame />
      <section className="game-seo-section">
        <div className="game-seo-section__inner">
          <h1 className="game-seo-section__h1">
            Football quiz – test your football knowledge
          </h1>

          <h2>A complete football quiz for true fans</h2>
          <p>
            FootballQuiz is an online game designed to test every aspect of your football
            knowledge. Whether you love trivia, have a feel for transfer fees, or know your
            stadiums inside out, every match challenges you with varied and dynamic questions.
            It&apos;s the perfect blend of thinking, memory and instinct.
          </p>

          <h2>Multiple game modes to keep things fresh</h2>
          <p>
            The game offers several types of challenges to keep the experience exciting. You can
            answer multiple-choice trivia questions about football culture, identify iconic
            stadiums, estimate a transfer fee, or guess a player&apos;s peak season. Each mode
            requires a different approach, which is what makes it genuinely addictive.
          </p>

          <h2>Fast-paced and accessible gameplay</h2>
          <p>
            FootballQuiz is built for short but intense sessions. Rounds flow quickly, letting
            you play any time without commitment. The interface is simple and intuitive — you
            know exactly what to do from the very first question, with no time wasted getting
            started.
          </p>

          <h2>Learn while you play</h2>
          <p>
            Beyond the fun, FootballQuiz teaches you a huge amount about football. You&apos;ll
            discover statistics, records, landmark transfers and details that even regular fans
            don&apos;t always know. It&apos;s genuinely a game where you improve with every
            session.
          </p>

          <div className="game-seo-section__rules-link">
            <Link href="/football-rules">📖 Full rules and how to play FootballQuiz →</Link>
          </div>

          <FAQ items={[
            {
              q: "Is FootballQuiz free to play?",
              a: "Yes, FootballQuiz is completely free. No account, download or payment required — play instantly in your browser on desktop or mobile.",
            },
            {
              q: "How many rounds are in a FootballQuiz game?",
              a: "Each game has 10 rounds mixing five types: trivia questions, stadium photo identification, transfer fee sliders, salary comparisons and peak season estimation. Each correct answer is worth up to 100 points for a maximum of 1,000 points.",
            },
            {
              q: "Can I play FootballQuiz against a friend?",
              a: "Yes — FootballQuiz supports real-time multiplayer. Both players see the same 10 questions generated from a shared seed. If no opponent is found within 30 seconds, a bot steps in automatically so you never wait too long.",
            },
          ]} />
        </div>
      </section>
      <RelatedGames currentSlug="/football" />
    </>
  );
}
