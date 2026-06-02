"use client";
import { useState, useMemo, useEffect } from "react";
import { GAMES, GAME_SLUGS, type GameSlug } from "@/lib/clips-shared";

interface Props {
  selected: Set<GameSlug>;
  onToggle: (game: GameSlug) => void;
  onClearAll: () => void;
}

export default function ClipSidebar({ selected, onToggle, onClearAll }: Props) {
  const [query, setQuery] = useState("");
  const [logoErrors, setLogoErrors] = useState<Set<string>>(new Set());
  const [popularity, setPopularity] = useState<GameSlug[]>([]);

  useEffect(() => {
    fetch("/api/games/popularity")
      .then((r) => r.json())
      .then(({ popularity: data }: { popularity: { game: GameSlug }[] }) => {
        if (Array.isArray(data) && data.length > 0) {
          setPopularity(data.map((d) => d.game));
        }
      })
      .catch(() => {});
  }, []);

  // Sorted + filtered game list
  const sortedSlugs = useMemo(() => {
    const q = query.trim().toLowerCase();
    const base = popularity.length > 0 ? popularity : GAME_SLUGS;
    return base.filter((slug) =>
      !q || GAMES[slug].name.toLowerCase().includes(q)
    );
  }, [query, popularity]);

  const allSelected = selected.size === 0;

  return (
    <aside className="cs-sidebar">
      {/* Search */}
      <div className="cs-search-wrap">
        <svg className="cs-search-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input
          className="cs-search"
          type="text"
          placeholder="Search games…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          spellCheck={false}
        />
        {query && (
          <button className="cs-search-clear" onClick={() => setQuery("")} aria-label="Clear search">×</button>
        )}
      </div>

      <ul className="cs-sidebar__list">
        {/* All games */}
        <li>
          <button className={`cs-item${allSelected ? " is-active" : ""}`} onClick={onClearAll}>
            <span className="cs-item__checkbox" data-checked={allSelected}>
              {allSelected && <svg width="9" height="9" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="1.5 5 4 7.5 8.5 2.5"/></svg>}
            </span>
            <span className="cs-item__logo-wrap">
              <span className="cs-item__dot" style={{ background: "rgba(255,255,255,0.3)" }} />
            </span>
            <span className="cs-item__name">All games</span>
          </button>
        </li>

        <li className="cs-divider" />

        {sortedSlugs.length === 0 && (
          <li className="cs-no-results">No games found</li>
        )}

        {sortedSlugs.map((slug) => {
          const meta    = GAMES[slug];
          const checked = selected.has(slug);
          const hasLogo = !logoErrors.has(slug);
          return (
            <li key={slug}>
              <button
                className={`cs-item${checked ? " is-active" : ""}`}
                onClick={() => onToggle(slug)}
              >
                <span
                  className="cs-item__checkbox"
                  data-checked={checked}
                  style={checked ? { borderColor: meta.color, background: meta.color + "33" } : {}}
                >
                  {checked && (
                    <svg width="9" height="9" viewBox="0 0 10 10" fill="none" stroke={meta.color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="1.5 5 4 7.5 8.5 2.5" />
                    </svg>
                  )}
                </span>

                <span className="cs-item__logo-wrap">
                  {hasLogo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={`/images/games/${slug}.jpg`}
                      alt=""
                      className="cs-item__logo"
                      onError={() => setLogoErrors((prev) => new Set([...prev, slug]))}
                    />
                  ) : (
                    <span className="cs-item__dot" style={{ background: meta.color }} />
                  )}
                </span>

                <span className="cs-item__name">{meta.name}</span>
              </button>
            </li>
          );
        })}
      </ul>

      {selected.size > 0 && (
        <div className="cs-active-summary">
          <span>{selected.size} game{selected.size > 1 ? "s" : ""} selected</span>
          <button className="cs-clear-btn" onClick={onClearAll}>Clear</button>
        </div>
      )}
    </aside>
  );
}
