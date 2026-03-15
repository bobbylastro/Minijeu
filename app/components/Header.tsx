"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import { useAuth } from "@/hooks/useAuth";

const AuthModal     = dynamic(() => import("@/components/AuthModal"),     { ssr: false });
const UsernameModal = dynamic(() => import("@/components/UsernameModal"), { ssr: false });
const UserBadge     = dynamic(() => import("@/components/UserBadge"),     { ssr: false });

export default function Header() {
  const pathname = usePathname();
  const { user, profile, loading, profileLoading } = useAuth();
  const [sportsOpen, setSportsOpen]   = useState(false);
  const [geoOpen, setGeoOpen]         = useState(false);
  const [cultureOpen, setCultureOpen] = useState(false);
  const [foodOpen, setFoodOpen]       = useState(false);
  const [menuOpen, setMenuOpen]       = useState(false);
  const [authOpen, setAuthOpen]       = useState(false);

  const geoRef     = useRef<HTMLDivElement>(null);
  const sportsRef  = useRef<HTMLDivElement>(null);
  const cultureRef = useRef<HTMLDivElement>(null);
  const foodRef    = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click (desktop)
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (geoRef.current     && !geoRef.current.contains(e.target as Node))     setGeoOpen(false);
      if (sportsRef.current  && !sportsRef.current.contains(e.target as Node))  setSportsOpen(false);
      if (cultureRef.current && !cultureRef.current.contains(e.target as Node)) setCultureOpen(false);
      if (foodRef.current    && !foodRef.current.contains(e.target as Node))    setFoodOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Close mobile menu on route change
  useEffect(() => { setMenuOpen(false); }, [pathname]);

  const closeMenu = () => setMenuOpen(false);

  const geoRoutes     = ["/citymix", "/higher-or-lower", "/city-origins"];
  const sportsRoutes  = ["/football", "/nba", "/career"];
  const cultureRoutes = ["/wcf"];
  const foodRoutes    = ["/food"];
  const isGeoActive     = geoRoutes.includes(pathname);
  const isSportsActive  = sportsRoutes.includes(pathname);
  const isCultureActive = cultureRoutes.includes(pathname);
  const isFoodActive    = foodRoutes.includes(pathname);

  return (
    <>
      <header className="site-header">
        <div className="site-header__inner">
          <Link href="/" className="site-header__logo" onClick={closeMenu}>
            Ultimate<span className="site-header__logo-accent"> Playground</span>
          </Link>

          {/* ── Desktop nav ──────────────────────────────────────────────── */}
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
                    <Link href="/football" className={`site-header__dropdown-item${pathname === "/football" ? " is-active" : ""}`} onClick={() => setSportsOpen(false)}>
                      <div className="site-header__dropdown-icon">⚽</div>
                      <div>
                        <div className="site-header__dropdown-name">FootballQuiz</div>
                        <div className="site-header__dropdown-desc">Transfers, salaries & trivia</div>
                      </div>
                    </Link>
                    <Link href="/nba" className={`site-header__dropdown-item${pathname === "/nba" ? " is-active" : ""}`} onClick={() => setSportsOpen(false)}>
                      <div className="site-header__dropdown-icon">🏀</div>
                      <div>
                        <div className="site-header__dropdown-name">NBAQuiz</div>
                        <div className="site-header__dropdown-desc">Arenas, contracts & trivia</div>
                      </div>
                    </Link>
                    <Link href="/career" className={`site-header__dropdown-item${pathname === "/career" ? " is-active" : ""}`} onClick={() => setSportsOpen(false)}>
                      <div className="site-header__dropdown-icon">🔀</div>
                      <div>
                        <div className="site-header__dropdown-name">CareerOrder</div>
                        <div className="site-header__dropdown-desc">Sort a player's clubs in order</div>
                      </div>
                    </Link>
                  </div>
                  <div className="site-header__dropdown-viewall">
                    <Link href="/sports" onClick={() => setSportsOpen(false)}>View all Sports games →</Link>
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
                    <Link href="/wcf" className={`site-header__dropdown-item${pathname === "/wcf" ? " is-active" : ""}`} onClick={() => setCultureOpen(false)}>
                      <div className="site-header__dropdown-icon">⏳</div>
                      <div>
                        <div className="site-header__dropdown-name">WhatCameFirst</div>
                        <div className="site-header__dropdown-desc">Pick the earlier event</div>
                      </div>
                    </Link>
                  </div>
                  <div className="site-header__dropdown-viewall">
                    <Link href="/culture" onClick={() => setCultureOpen(false)}>View all Culture games →</Link>
                  </div>
                </div>
              )}
            </div>

            {/* Food dropdown */}
            <div
              ref={foodRef}
              className={`site-header__nav-item${foodOpen ? " is-open" : ""}${isFoodActive ? " is-active" : ""}`}
              onClick={() => setFoodOpen(o => !o)}
            >
              🍽️ Food
              <svg className="site-header__chevron" width="10" height="6" viewBox="0 0 10 6" fill="none">
                <path d="M1 1l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              {foodOpen && (
                <div className="site-header__dropdown">
                  <div className="site-header__dropdown-section">
                    <div className="site-header__dropdown-label">Food</div>
                    <Link href="/food" className={`site-header__dropdown-item${pathname === "/food" ? " is-active" : ""}`} onClick={() => setFoodOpen(false)}>
                      <div className="site-header__dropdown-icon">🗺️</div>
                      <div>
                        <div className="site-header__dropdown-name">Food Origins</div>
                        <div className="site-header__dropdown-desc">Click the country where this dish is from</div>
                      </div>
                    </Link>
                  </div>
                  <div className="site-header__dropdown-viewall">
                    <Link href="/food-games" onClick={() => setFoodOpen(false)}>View all Food games →</Link>
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
              🌍 World
              <svg className="site-header__chevron" width="10" height="6" viewBox="0 0 10 6" fill="none">
                <path d="M1 1l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              {geoOpen && (
                <div className="site-header__dropdown">
                  <div className="site-header__dropdown-section">
                    <div className="site-header__dropdown-label">World</div>
                    <Link href="/citymix" className={`site-header__dropdown-item${pathname === "/citymix" ? " is-active" : ""}`} onClick={() => setGeoOpen(false)}>
                      <div className="site-header__dropdown-icon">🌍</div>
                      <div>
                        <div className="site-header__dropdown-name">CityMix</div>
                        <div className="site-header__dropdown-desc">City population challenge</div>
                      </div>
                    </Link>
                    <Link href="/higher-or-lower" className={`site-header__dropdown-item${pathname === "/higher-or-lower" ? " is-active" : ""}`} onClick={() => setGeoOpen(false)}>
                      <div className="site-header__dropdown-icon">📊</div>
                      <div>
                        <div className="site-header__dropdown-name">Higher or Lower</div>
                        <div className="site-header__dropdown-desc">Compare countries</div>
                      </div>
                    </Link>
                    <Link href="/city-origins" className={`site-header__dropdown-item${pathname === "/city-origins" ? " is-active" : ""}`} onClick={() => setGeoOpen(false)}>
                      <div className="site-header__dropdown-icon">🏙️</div>
                      <div>
                        <div className="site-header__dropdown-name">City Mapper</div>
                        <div className="site-header__dropdown-desc">Find the country behind the city</div>
                      </div>
                    </Link>
                  </div>
                  <div className="site-header__dropdown-viewall">
                    <Link href="/world" onClick={() => setGeoOpen(false)}>View all World games →</Link>
                  </div>
                </div>
              )}
            </div>
          </nav>

          {/* ── Auth / User badge ─────────────────────────────────────────── */}
          <div className="site-header__auth">
            <UserBadge onLoginClick={() => setAuthOpen(true)} />
          </div>

          {/* ── Burger button (mobile only) ──────────────────────────────── */}
          <button
            className={`site-header__burger${menuOpen ? " is-open" : ""}`}
            onClick={() => setMenuOpen(o => !o)}
            aria-label="Toggle menu"
          >
            <span /><span /><span />
          </button>
        </div>
      </header>

      {authOpen     && <AuthModal     onClose={() => setAuthOpen(false)} />}
      {!loading && !profileLoading && user && !profile && <UsernameModal onClose={() => {}} />}

      {/* ── Mobile menu ──────────────────────────────────────────────────── */}
      {menuOpen && (
        <div className="mobile-menu" onClick={closeMenu}>
          <div className="mobile-menu__inner" onClick={e => e.stopPropagation()}>

            <div className="mobile-menu__section">
              <div className="mobile-menu__label">⚽ Sports</div>
              <Link href="/football" className={`mobile-menu__item${pathname === "/football" ? " is-active" : ""}`} onClick={closeMenu}>
                <span className="mobile-menu__item-icon">⚽</span>
                <div>
                  <div className="mobile-menu__item-name">FootballQuiz</div>
                  <div className="mobile-menu__item-desc">Transfers, salaries & trivia</div>
                </div>
              </Link>
              <Link href="/nba" className={`mobile-menu__item${pathname === "/nba" ? " is-active" : ""}`} onClick={closeMenu}>
                <span className="mobile-menu__item-icon">🏀</span>
                <div>
                  <div className="mobile-menu__item-name">NBAQuiz</div>
                  <div className="mobile-menu__item-desc">Arenas, contracts & trivia</div>
                </div>
              </Link>
              <Link href="/career" className={`mobile-menu__item${pathname === "/career" ? " is-active" : ""}`} onClick={closeMenu}>
                <span className="mobile-menu__item-icon">🔀</span>
                <div>
                  <div className="mobile-menu__item-name">CareerOrder</div>
                  <div className="mobile-menu__item-desc">Sort a player's clubs in order</div>
                </div>
              </Link>
            </div>

            <div className="mobile-menu__divider" />

            <div className="mobile-menu__section">
              <div className="mobile-menu__label">🧠 Culture</div>
              <Link href="/wcf" className={`mobile-menu__item${pathname === "/wcf" ? " is-active" : ""}`} onClick={closeMenu}>
                <span className="mobile-menu__item-icon">⏳</span>
                <div>
                  <div className="mobile-menu__item-name">WhatCameFirst</div>
                  <div className="mobile-menu__item-desc">Pick the earlier event</div>
                </div>
              </Link>
            </div>

            <div className="mobile-menu__divider" />

            <div className="mobile-menu__section">
              <div className="mobile-menu__label">🍽️ Food</div>
              <Link href="/food" className={`mobile-menu__item${pathname === "/food" ? " is-active" : ""}`} onClick={closeMenu}>
                <span className="mobile-menu__item-icon">🗺️</span>
                <div>
                  <div className="mobile-menu__item-name">Food Origins</div>
                  <div className="mobile-menu__item-desc">Click the country where this dish is from</div>
                </div>
              </Link>
            </div>

            <div className="mobile-menu__divider" />

            <div className="mobile-menu__section">
              <div className="mobile-menu__label">🌍 World</div>
              <Link href="/citymix" className={`mobile-menu__item${pathname === "/citymix" ? " is-active" : ""}`} onClick={closeMenu}>
                <span className="mobile-menu__item-icon">🌍</span>
                <div>
                  <div className="mobile-menu__item-name">CityMix</div>
                  <div className="mobile-menu__item-desc">City population challenge</div>
                </div>
              </Link>
              <Link href="/higher-or-lower" className={`mobile-menu__item${pathname === "/higher-or-lower" ? " is-active" : ""}`} onClick={closeMenu}>
                <span className="mobile-menu__item-icon">📊</span>
                <div>
                  <div className="mobile-menu__item-name">Higher or Lower</div>
                  <div className="mobile-menu__item-desc">Compare countries</div>
                </div>
              </Link>
              <Link href="/city-origins" className={`mobile-menu__item${pathname === "/city-origins" ? " is-active" : ""}`} onClick={closeMenu}>
                <span className="mobile-menu__item-icon">🏙️</span>
                <div>
                  <div className="mobile-menu__item-name">City Mapper</div>
                  <div className="mobile-menu__item-desc">Find the country behind the city</div>
                </div>
              </Link>
            </div>

          </div>
        </div>
      )}
    </>
  );
}
