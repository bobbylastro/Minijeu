import Link from "next/link";

interface GameLink {
  slug: string;
  emoji: string;
  title: string;
  desc: string;
}

const WORLD: GameLink[] = [
  { slug: "/citymix",        emoji: "🌍", title: "CityMix",         desc: "Pick the larger city, then guess its exact population." },
  { slug: "/higher-or-lower",emoji: "📊", title: "Higher or Lower", desc: "Compare two countries on population, GDP, area and more." },
  { slug: "/city-origins",   emoji: "🏙️", title: "City Mapper",     desc: "A city photo appears — find the country it belongs to." },
];

const SPORTS: GameLink[] = [
  { slug: "/football", emoji: "⚽", title: "FootballQuiz", desc: "Guess transfer fees, compare salaries and identify stadiums." },
  { slug: "/nba",      emoji: "🏀", title: "NBAQuiz",      desc: "Arenas, contracts, salaries and NBA trivia." },
  { slug: "/career",   emoji: "🔀", title: "CareerOrder",  desc: "Sort a player's clubs in the right order." },
];

const CULTURE: GameLink[] = [
  { slug: "/wcf",        emoji: "⏳", title: "WhatCameFirst", desc: "Pick which historical event happened first." },
  { slug: "/origins",    emoji: "🌐", title: "Origins Quiz",  desc: "Click the country where this sport, tradition or invention was born." },
  { slug: "/wealth",     emoji: "💰", title: "Who's Richer?", desc: "Compare celebrity fortunes." },
  { slug: "/five-clues", emoji: "🕵️", title: "5 Clues",       desc: "5 progressive clues, 3 attempts. Who am I?" },
];

const FOOD: GameLink[] = [
  { slug: "/food", emoji: "🗺️", title: "Food Origins", desc: "Click the country where this dish is from." },
];

const ANIMALS: GameLink[] = [
  { slug: "/wild-battle",     emoji: "🦁", title: "Wild Battle",      desc: "Animal face-offs, trivia & wild record estimation." },
  { slug: "/animal-locator",  emoji: "🗺️", title: "Animal Locator",   desc: "An animal appears — click its home country on the map." },
];

const GAMING: GameLink[] = [
  { slug: "/game-tournament", emoji: "🏆", title: "Gaming Tournament", desc: "32 iconic games, 5 rounds. Crown your all-time favourite." },
];

const ALL_CATEGORIES = [WORLD, SPORTS, CULTURE, FOOD, ANIMALS, GAMING];

function findRelated(currentSlug: string): { label: string; games: GameLink[] } {
  for (const cat of ALL_CATEGORIES) {
    if (cat.some(g => g.slug === currentSlug)) {
      const others = cat.filter(g => g.slug !== currentSlug);
      if (others.length > 0) {
        const label =
          cat === WORLD   ? "More World games" :
          cat === SPORTS  ? "More Sports games" :
          cat === CULTURE ? "More Culture games" :
          cat === ANIMALS ? "More Animals games" :
          cat === GAMING  ? "More Gaming games" :
          "More Food games";
        return { label, games: others };
      }
      // Single-game category — suggest popular games from other categories
      const suggestions: GameLink[] = [
        SPORTS[0], SPORTS[1], WORLD[0], WORLD[1],
      ].filter(g => g.slug !== currentSlug).slice(0, 3);
      return { label: "You might also like", games: suggestions };
    }
  }
  // Fallback
  return { label: "More games", games: [SPORTS[0], WORLD[0], CULTURE[0]] };
}

export default function RelatedGames({ currentSlug }: { currentSlug: string }) {
  const { label, games } = findRelated(currentSlug);
  if (games.length === 0) return null;

  return (
    <section className="related-games">
      <div className="related-games__inner">
        <h2 className="related-games__title">{label}</h2>
        <div className="related-games__grid">
          {games.map(game => (
            <Link key={game.slug} href={game.slug} className="related-games__card">
              <span className="related-games__card-emoji">{game.emoji}</span>
              <div className="related-games__card-body">
                <div className="related-games__card-name">{game.title}</div>
                <div className="related-games__card-desc">{game.desc}</div>
              </div>
              <span className="related-games__card-arrow">→</span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
