"use client";

import { useState, useRef } from "react";
import "@/app/game-tournament/gaming-tournament.css";
import { trackEvent } from "@/lib/analytics";

interface Game {
  id: number;
  title: string;
  year: number;
  genre: string;
  studio: string;
}

type Matchup = [Game, Game];

interface ResultGame {
  game: Game;
  wins: number;
}

interface GamingData { games: Game[]; }

const ROUND_NAMES = [
  "Round of 32",
  "Round of 16",
  "Quarterfinals",
  "Semifinals",
  "Grand Final",
];

const CUMULATIVE = [0, 16, 24, 28, 30];
const TOTAL_MATCHUPS = 31;
const RANK_EMOJIS = ["🥇", "🥈", "🥉", "4️⃣", "5️⃣"];

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function pair(games: Game[]): Matchup[] {
  const out: Matchup[] = [];
  for (let i = 0; i < games.length; i += 2) {
    out.push([games[i], games[i + 1]]);
  }
  return out;
}

function imgUrl(id: number) {
  return `https://cdn.cloudflare.steamstatic.com/steam/apps/${id}/header.jpg`;
}

type Screen = "home" | "game" | "results";

interface State {
  screen: Screen;
  matchups: Matchup[];
  matchupIdx: number;
  round: number;
  roundWinners: Game[];
  allWins: Record<number, number>;
  tournamentGames: Game[];
  picked: number | null;
  roundTransition: boolean;
  results: ResultGame[];
}

const INITIAL: State = {
  screen: "home",
  matchups: [],
  matchupIdx: 0,
  round: 0,
  roundWinners: [],
  allWins: {},
  tournamentGames: [],
  picked: null,
  roundTransition: false,
  results: [],
};

export default function GamingTournamentGame({ initialData }: { initialData: GamingData }) {
  const ALL_GAMES = initialData.games;
  const [state, setState] = useState<State>(INITIAL);

  // Always up-to-date ref to avoid stale closures in setTimeout
  const ref = useRef(state);
  ref.current = state;

  function startGame() {
    trackEvent("game_start", { game_type: "game-tournament", mode: "solo" });
    const chosen = shuffle(ALL_GAMES).slice(0, 32);
    const matchups = pair(shuffle(chosen));
    setState({
      ...INITIAL,
      screen: "game",
      matchups,
      tournamentGames: chosen,
    });
  }

  function pick(winner: Game) {
    if (ref.current.picked !== null) return;

    setState(prev => ({ ...prev, picked: winner.id }));

    setTimeout(() => {
      const s = ref.current;
      const newWins = { ...s.allWins, [winner.id]: (s.allWins[winner.id] || 0) + 1 };
      const newRoundWinners = [...s.roundWinners, winner];
      const isLastMatchup = s.matchupIdx === s.matchups.length - 1;

      if (!isLastMatchup) {
        setState(prev => ({
          ...prev,
          picked: null,
          allWins: newWins,
          matchupIdx: prev.matchupIdx + 1,
          roundWinners: newRoundWinners,
        }));
        return;
      }

      // Last matchup of the round
      if (newRoundWinners.length === 1) {
        // Tournament over — champion!
        const ranked = s.tournamentGames
          .map(g => ({ game: g, wins: newWins[g.id] || 0 }))
          .sort((a, b) => b.wins - a.wins)
          .slice(0, 5);
        trackEvent("game_complete", { game_type: "game-tournament", mode: "solo", final_score: 0, max_score: 0, score_pct: 0 });
        setState(prev => ({ ...prev, picked: null, allWins: newWins, results: ranked, screen: "results" }));
      } else {
        // Advance to next round
        const nextMatchups = pair(shuffle(newRoundWinners));
        setState(prev => ({
          ...prev,
          picked: null,
          allWins: newWins,
          round: prev.round + 1,
          matchups: nextMatchups,
          matchupIdx: 0,
          roundWinners: [],
          roundTransition: true,
        }));
        setTimeout(() => setState(prev => ({ ...prev, roundTransition: false })), 1400);
      }
    }, 680);
  }

  const { screen, matchups, matchupIdx, round, picked, roundTransition, results } = state;

  /* ── Home ──────────────────────────────────────────────────────────────── */
  if (screen === "home") {
    return (
      <div className="gt-home">
        <div className="gt-home__glow" />
        <div className="gt-home__content">
          <span className="gt-home__trophy">🏆</span>
          <h1 className="gt-home__title">Gaming Tournament</h1>
          <p className="gt-home__subtitle">
            32 legendary games face off head-to-head across 5 rounds.
            Pick your favorites — and crown your ultimate game.
          </p>
          <div className="gt-home__stats">
            <div className="gt-home__stat">
              <span className="gt-home__stat-value">32</span>
              <span className="gt-home__stat-label">Games</span>
            </div>
            <div className="gt-home__stat-div" />
            <div className="gt-home__stat">
              <span className="gt-home__stat-value">5</span>
              <span className="gt-home__stat-label">Rounds</span>
            </div>
            <div className="gt-home__stat-div" />
            <div className="gt-home__stat">
              <span className="gt-home__stat-value">31</span>
              <span className="gt-home__stat-label">Picks</span>
            </div>
          </div>
          <button type="button" className="gt-home__btn" onClick={startGame}>
            Start Tournament →
          </button>
          <p className="gt-home__note">
            Drawn from {ALL_GAMES.length} classics · Randomised each session
          </p>
        </div>
      </div>
    );
  }

  /* ── Results ───────────────────────────────────────────────────────────── */
  if (screen === "results") {
    const champion = results[0];
    return (
      <div className="gt-results">
        <div className="gt-results__glow" />
        <div className="gt-results__inner">
          <p className="gt-results__eyebrow">Your #1 Game</p>

          {champion && (
            <div className="gt-results__champion">
              <img
                src={imgUrl(champion.game.id)}
                alt={champion.game.title}
                className="gt-results__champion-img"
                onError={e => { (e.target as HTMLImageElement).style.display = "none"; }}
              />
              <div className="gt-results__champion-body">
                <span className="gt-results__champion-crown">🏆</span>
                <h2 className="gt-results__champion-title">{champion.game.title}</h2>
                <p className="gt-results__champion-meta">
                  {champion.game.year} · {champion.game.genre} · {champion.game.studio}
                </p>
              </div>
            </div>
          )}

          <p className="gt-results__section-title">Your Top 5 Gaming Picks</p>
          <div className="gt-results__list">
            {results.map((r, i) => (
              <div key={r.game.id} className="gt-results__item">
                <span className="gt-results__rank">{RANK_EMOJIS[i]}</span>
                <img
                  src={imgUrl(r.game.id)}
                  alt={r.game.title}
                  className="gt-results__item-img"
                  onError={e => { (e.target as HTMLImageElement).style.display = "none"; }}
                />
                <div className="gt-results__item-body">
                  <p className="gt-results__item-title">{r.game.title}</p>
                  <p className="gt-results__item-meta">{r.game.year} · {r.game.genre}</p>
                </div>
                <span className="gt-results__wins">{r.wins} win{r.wins !== 1 ? "s" : ""}</span>
              </div>
            ))}
          </div>

          <button type="button" className="gt-home__btn" onClick={() => setState(INITIAL)}>
            Play Again →
          </button>
        </div>
      </div>
    );
  }

  /* ── Game screen ───────────────────────────────────────────────────────── */
  const currentMatchup = matchups[matchupIdx] as Matchup | undefined;
  if (!currentMatchup) return null;

  const [gameA, gameB] = currentMatchup;
  const globalMatchup = CUMULATIVE[Math.min(round, 4)] + matchupIdx + 1;
  const progressPct = Math.round((globalMatchup / TOTAL_MATCHUPS) * 100);

  return (
    <div className="gt-game">
      {roundTransition && (
        <div className="gt-transition">
          <div className="gt-transition__inner">
            <p className="gt-transition__label">Next up</p>
            <p className="gt-transition__name">{ROUND_NAMES[round]}</p>
            <p className="gt-transition__sub">{matchups.length * 2} games remain</p>
          </div>
        </div>
      )}

      <div className="gt-header">
        <div className="gt-header__round">
          <span className="gt-header__round-badge">{ROUND_NAMES[round]}</span>
          <span className="gt-header__match">Match {matchupIdx + 1} / {matchups.length}</span>
        </div>
        <div className="gt-header__progress">
          <div className="gt-header__progress-bar" style={{ width: `${progressPct}%` }} />
        </div>
        <p className="gt-header__progress-label">{globalMatchup} / {TOTAL_MATCHUPS} picks made</p>
      </div>

      <p className="gt-question">Which game do you prefer?</p>

      <div className="gt-matchup" key={`${round}-${matchupIdx}`}>
        {([gameA, gameB] as Game[]).map(game => {
          let cls = "gt-card";
          if (picked !== null) cls += picked === game.id ? " gt-card--winner" : " gt-card--loser";
          return (
            <button
              key={game.id}
              type="button"
              className={cls}
              onClick={() => pick(game)}
              disabled={picked !== null}
            >
              <div className="gt-card__cover-wrap">
                <div className="gt-card__cover-fallback">🎮</div>
                <img
                  src={imgUrl(game.id)}
                  alt={game.title}
                  className="gt-card__cover"
                  onError={e => { (e.target as HTMLImageElement).style.display = "none"; }}
                />
                {picked === game.id && <div className="gt-card__winner-overlay">✓</div>}
              </div>
              <div className="gt-card__body">
                <h2 className="gt-card__title">{game.title}</h2>
                <p className="gt-card__meta">{game.year} · {game.genre}</p>
                <p className="gt-card__studio">{game.studio}</p>
              </div>
            </button>
          );
        })}
        <div className="gt-vs">VS</div>
      </div>
    </div>
  );
}
