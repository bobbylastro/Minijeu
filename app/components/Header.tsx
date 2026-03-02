"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect, useRef } from "react";

export default function Header() {
  const pathname = usePathname();
  const [sportsOpen, setSportsOpen] = useState(false);
  const [geoOpen, setGeoOpen] = useState(false);
  const geoRef = useRef<HTMLDivElement>(null);
  const sportsRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (geoRef.current && !geoRef.current.contains(e.target as Node)) setGeoOpen(false);
      if (sportsRef.current && !sportsRef.current.contains(e.target as Node)) setSportsOpen(false);
      if (cultureRef.current && !cultureRef.current.contains(e.target as Node)) setCultureOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const [cultureOpen, setCultureOpen] = useState(false);
  const cultureRef = useRef<HTMLDivElement>(null);

  const geoRoutes     = ["/citymix", "/higher-or-lower"];
  const sportsRoutes  = ["/football", "/nba", "/career"];
  const cultureRoutes = ["/wcf"];
  const isGeoActive     = geoRoutes.includes(pathname);
  const isSportsActive  = sportsRoutes.includes(pathname);
  const isCultureActive = cultureRoutes.includes(pathname);

  return (
    <header className="site-header">
      <div className="site-header__inner">
        <Link href="/" className="site-header__logo">
          Ultimate<span className="site-header__logo-accent"> Playground</span>
        </Link>

        <nav className="site-header__nav">
          {/* Sports dropdown */}
          <div
            ref={sportsRef}
            className={`site-header__nav-item${sportsOpen ? " is-open" : ""}${isSportsActive ? " is-active" : ""}`}
            onClick={() => setSportsOpen(o => !o)}
          >
            ⚽ Sports
            <svg className="site-header__chevron" width="10" height="6" viewBox="0 0 10 6" fill="none">
              <path d="M1 1l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>

            {sportsOpen && (
              <div className="site-header__dropdown">
                <div className="site-header__dropdown-section">
                  <div className="site-header__dropdown-label">Sports</div>

                  <Link
                    href="/football"
                    className={`site-header__dropdown-item${pathname === "/football" ? " is-active" : ""}`}
                    onClick={() => setSportsOpen(false)}
                  >
                    <div className="site-header__dropdown-icon">⚽</div>
                    <div>
                      <div className="site-header__dropdown-name">FootballQuiz</div>
                      <div className="site-header__dropdown-desc">Transfers, salaries & trivia</div>
                    </div>
                  </Link>

                  <Link
                    href="/nba"
                    className={`site-header__dropdown-item${pathname === "/nba" ? " is-active" : ""}`}
                    onClick={() => setSportsOpen(false)}
                  >
                    <div className="site-header__dropdown-icon">🏀</div>
                    <div>
                      <div className="site-header__dropdown-name">NBAQuiz</div>
                      <div className="site-header__dropdown-desc">Arenas, contracts & trivia</div>
                    </div>
                  </Link>

                  <Link
                    href="/career"
                    className={`site-header__dropdown-item${pathname === "/career" ? " is-active" : ""}`}
                    onClick={() => setSportsOpen(false)}
                  >
                    <div className="site-header__dropdown-icon">🔀</div>
                    <div>
                      <div className="site-header__dropdown-name">CareerOrder</div>
                      <div className="site-header__dropdown-desc">Sort a player's clubs in order</div>
                    </div>
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* Culture dropdown */}
          <div
            ref={cultureRef}
            className={`site-header__nav-item${cultureOpen ? " is-open" : ""}${isCultureActive ? " is-active" : ""}`}
            onClick={() => setCultureOpen(o => !o)}
          >
            🧠 Culture
            <svg className="site-header__chevron" width="10" height="6" viewBox="0 0 10 6" fill="none">
              <path d="M1 1l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>

            {cultureOpen && (
              <div className="site-header__dropdown">
                <div className="site-header__dropdown-section">
                  <div className="site-header__dropdown-label">Culture</div>

                  <Link
                    href="/wcf"
                    className={`site-header__dropdown-item${pathname === "/wcf" ? " is-active" : ""}`}
                    onClick={() => setCultureOpen(false)}
                  >
                    <div className="site-header__dropdown-icon">⏳</div>
                    <div>
                      <div className="site-header__dropdown-name">WhatCameFirst</div>
                      <div className="site-header__dropdown-desc">Pick the earlier event</div>
                    </div>
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* Geography dropdown */}
          <div
            ref={geoRef}
            className={`site-header__nav-item${geoOpen ? " is-open" : ""}${isGeoActive ? " is-active" : ""}`}
            onClick={() => setGeoOpen(o => !o)}
          >
            🌍 Geography
            <svg className="site-header__chevron" width="10" height="6" viewBox="0 0 10 6" fill="none">
              <path d="M1 1l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>

            {geoOpen && (
              <div className="site-header__dropdown">
                <div className="site-header__dropdown-section">
                  <div className="site-header__dropdown-label">Geography</div>

                  <Link
                    href="/citymix"
                    className={`site-header__dropdown-item${pathname === "/citymix" ? " is-active" : ""}`}
                    onClick={() => setGeoOpen(false)}
                  >
                    <div className="site-header__dropdown-icon">🌍</div>
                    <div>
                      <div className="site-header__dropdown-name">CityMix</div>
                      <div className="site-header__dropdown-desc">City population challenge</div>
                    </div>
                  </Link>

                  <Link
                    href="/higher-or-lower"
                    className={`site-header__dropdown-item${pathname === "/higher-or-lower" ? " is-active" : ""}`}
                    onClick={() => setGeoOpen(false)}
                  >
                    <div className="site-header__dropdown-icon">📊</div>
                    <div>
                      <div className="site-header__dropdown-name">Higher or Lower</div>
                      <div className="site-header__dropdown-desc">Compare countries</div>
                    </div>
                  </Link>
                </div>
              </div>
            )}
          </div>
        </nav>
      </div>
    </header>
  );
}
