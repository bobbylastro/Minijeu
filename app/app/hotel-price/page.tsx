import type { Metadata } from "next";
import Link from "next/link";
import { readFileSync } from "fs";
import path from "path";
import JsonLd from "@/components/JsonLd";
import HotelPriceGame, { type Hotel } from "@/components/HotelPriceGame";
import RelatedGames from "@/components/RelatedGames";
import FAQ from "@/components/FAQ";

const BASE = "https://ultimate-playground.com";

export const metadata: Metadata = {
  title: "Hotel Price — Guess the Nightly Rate from Hotel Photos",
  description:
    "Can you guess what a hotel costs per night? Browse real photos from NYC, Paris, Bali, Dubai and more. Slider rounds and battle rounds. Play solo or multiplayer.",
  keywords: [
    "hotel price game", "guess hotel price", "hotel quiz game",
    "travel trivia game", "hotel photo quiz", "booking price guessing game",
  ],
  openGraph: {
    title: "Hotel Price — Can you guess the nightly rate?",
    description: "Real hotel photos from 40+ cities worldwide. Slide to guess the price, battle for the most expensive — solo or multiplayer.",
    url: `${BASE}/hotel-price`,
    type: "website",
  },
};

function loadHotelData(): Hotel[] {
  try {
    const filePath = path.join(process.cwd(), "app/hotel_price_data.json");
    const raw = readFileSync(filePath, "utf-8");
    const data = JSON.parse(raw);
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

export default function HotelPricePage() {
  const initialData = loadHotelData();

  return (
    <>
      <JsonLd data={[
        {
          "@context": "https://schema.org",
          "@type": "VideoGame",
          "name": "Hotel Price",
          "description": "Guess the nightly hotel price from real photos. Slider and battle rounds across luxury, mid-range and budget hotels from cities worldwide.",
          "url": `${BASE}/hotel-price`,
          "genre": ["Trivia", "Quiz", "Puzzle"],
          "gamePlatform": "Browser",
          "applicationCategory": "Game",
          "numberOfPlayers": { "@type": "QuantitativeValue", "minValue": 1, "maxValue": 2 },
          "publisher": { "@type": "Organization", "name": "Ultimate Playground", "url": BASE },
          "inLanguage": "en",
          "isAccessibleForFree": true,
          "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" },
        },
        {
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          "itemListElement": [
            { "@type": "ListItem", "position": 1, "name": "Home",  "item": BASE },
            { "@type": "ListItem", "position": 2, "name": "World", "item": `${BASE}/world` },
            { "@type": "ListItem", "position": 3, "name": "Hotel Price", "item": `${BASE}/hotel-price` },
          ],
        },
      ]} />

      <HotelPriceGame initialData={initialData} />

      <section className="game-seo-section">
        <div className="game-seo-section__inner">
          <h1 className="game-seo-section__h1">
            Hotel Price — guess the nightly rate from real hotel photos
          </h1>

          <h2>From budget hostels to five-star suites</h2>
          <p>
            Hotel Price shows you real hotel photos pulled from Booking.com — room galleries,
            lobby shots, pool terraces and ocean-view suites. Your job is to guess what the hotel
            charges per night in USD. The game spans budget guesthouses in Bali, mid-range boutique
            hotels in Lisbon, and luxury five-star properties in New York, Dubai and Tokyo.
            Understanding how location, star rating and amenities translate into price is the key to
            a high score.
          </p>

          <h2>Two formats: slider rounds and price battles</h2>
          <p>
            Most rounds use a logarithmic slider that covers the full price range from $15 to $2,500
            per night. Drag to your estimate and confirm — the closer you are, the more points you
            earn. A perfect answer within 5% earns 100 points. Battle rounds put two hotels side by
            side and ask a simple question: which one costs more per night? The trick is that both
            hotels are in the same price tier, so it&apos;s never as obvious as it looks.
          </p>

          <h2>Real prices, scraped regularly</h2>
          <p>
            Hotel Price uses real nightly rates scraped directly from Booking.com for a fixed
            check-in date. Prices are refreshed every two to three months to stay current with
            market rates. You&apos;re not guessing against made-up numbers — every answer reflects
            what a real guest would pay on that night.
          </p>

          <h2>Challenge a friend in multiplayer</h2>
          <p>
            Hotel Price supports real-time multiplayer. Both players face the same 10 rounds in the
            same order, powered by a shared seed for a fair comparison. If no opponent is found
            within 30 seconds, a bot steps in so you can play immediately. Private rooms let you
            challenge a specific friend with a shareable code.
          </p>

          <div className="game-seo-section__rules-link">
            <Link href="/hotel-price-rules">📖 Full rules and how to play Hotel Price →</Link>
          </div>

          <FAQ items={[
            {
              q: "How does Hotel Price work?",
              a: "Hotel Price has 10 rounds: 7 slider rounds where you estimate a hotel's nightly price in USD, and 3 battle rounds where you pick the more expensive of two hotels. Points are based on how close your estimate is.",
            },
            {
              q: "Where do the hotel prices come from?",
              a: "Prices are scraped from Booking.com for a fixed check-in date using a standard room search. They reflect real market rates and are updated every 2–3 months to stay accurate.",
            },
            {
              q: "Can I play Hotel Price multiplayer?",
              a: "Yes — Hotel Price supports real-time multiplayer. Both players face the same questions from a shared seed. Quick Match finds a random opponent; private rooms let you challenge a friend directly.",
            },
            {
              q: "How is the scoring calculated in slider rounds?",
              a: "Slider scoring is ratio-based. Within 5% of the actual price earns 100 pts. Within 12% earns 90 pts, 22% earns 75, 40% earns 50, 70% earns 25, and beyond that earns 0.",
            },
          ]} />
        </div>
      </section>

      <RelatedGames currentSlug="/hotel-price" />
    </>
  );
}
