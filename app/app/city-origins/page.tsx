import type { Metadata } from "next";
import CityOriginGame from "@/components/CityOriginGame";
import RelatedGames from "@/components/RelatedGames";

export const metadata: Metadata = {
  title: "City Mapper – Find the country behind the city | Ultimate Playground",
  description:
    "Test your world geography! A city photo appears — click the right country on the map to score. 10 rounds, 100 cities from every continent.",
};

export default function CityOriginsPage() {
  return (
    <>
      <CityOriginGame />
      <section className="game-seo-section">
        <div className="game-seo-section__inner">
          <h1 className="game-seo-section__h1">
            City Mapper – Find which country each city belongs to
          </h1>

          <h2>What is City Mapper?</h2>
          <p>
            City Mapper is a world geography quiz that puts your knowledge of cities to the test.
            Each round reveals a photo of a famous city along with its name and population — your
            job is to click on the country it belongs to on an interactive world map.
          </p>
          <p>
            With 100 cities spanning every continent, from Tokyo to Lagos, from Buenos Aires to
            Moscow, City Mapper will challenge even the most seasoned geography enthusiasts.
          </p>

          <h2>How to play</h2>
          <p>
            Each game consists of 10 rounds. At the start of every round, a city photo is
            revealed along with the city name and its population. You then have 30 seconds to
            locate its country on the map and click it.
          </p>
          <ul>
            <li>Correct answer: +100 points</li>
            <li>Wrong answer or timeout: +0 points</li>
            <li>Maximum score: 1000 points</li>
          </ul>
          <p>
            You can zoom in and pan the map to find smaller countries. On mobile, tap a country
            once to preview its name, then tap again to confirm your answer.
          </p>

          <h2>A tour of the world's great cities</h2>
          <p>
            From megacities like Shanghai, Delhi, and New York to regional capitals and cultural
            hubs like Nairobi, Santiago, or Bangkok — City Mapper covers the full spectrum of
            urban geography. Each city is selected because it has a strong, distinctive identity
            tied to its country.
          </p>

          <h2>Test your geography knowledge</h2>
          <p>
            Do you know where Karachi is? Can you place Luanda on a map? City Mapper is designed
            to make you think — and to teach you something new each session. The population hint
            gives you a sense of scale without giving away the answer.
          </p>

          <h2>Play City Mapper online for free</h2>
          <p>
            No download or account needed. Jump straight into a game from your browser on desktop
            or mobile. The city selection is randomised every session, so there is always a
            fresh challenge to take on.
          </p>
          <p>How many cities can you correctly place on the map? Start playing and find out.</p>
        </div>
      </section>
      <RelatedGames currentSlug="/city-origins" />
    </>
  );
}
