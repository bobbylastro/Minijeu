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
  const [animalsOpen, setAnimalsOpen] = useState(false);
  const [menuOpen, setMenuOpen]       = useState(false);
  const [authOpen, setAuthOpen]       = useState(false);
  const [mobileOpen, setMobileOpen]   = useState<string | null>(null);

  const geoRef     = useRef<HTMLDivElement>(null);
  const sportsRef  = useRef<HTMLDivElement>(null);
  const cultureRef = useRef<HTMLDivElement>(null);
  const foodRef    = useRef<HTMLDivElement>(null);
  const animalsRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click (desktop)
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (geoRef.current     && !geoRef.current.contains(e.target as Node))     setGeoOpen(false);
      if (sportsRef.current  && !sportsRef.current.contains(e.target as Node))  setSportsOpen(false);
      if (cultureRef.current && !cultureRef.current.contains(e.target as Node)) setCultureOpen(false);
      if (foodRef.current    && !foodRef.current.contains(e.target as Node))    setFoodOpen(false);
      if (animalsRef.current && !animalsRef.current.contains(e.target as Node)) setAnimalsOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Close mobile menu on route change
  useEffect(() => { setMenuOpen(false); }, [pathname]);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [menuOpen]);

  const closeMenu = () => { setMenuOpen(false); setMobileOpen(null); };
  const toggleMobile = (key: string) => setMobileOpen(o => o === key ? null : key);

  const geoRoutes     = ["/citymix", "/higher-or-lower", "/city-origins"];
  const sportsRoutes  = ["/football", "/nba", "/career"];
  const cultureRoutes = ["/wcf", "/origins", "/wealth", "/five-clues"];
  const foodRoutes    = ["/food"];
  const animalsRoutes = ["/wild-battle"];
  const isGeoActive     = geoRoutes.includes(pathname);
  const isSportsActive  = sportsRoutes.includes(pathname);
  const isCultureActive = cultureRoutes.includes(pathname);
  const isFoodActive    = foodRoutes.includes(pathname);
  const isAnimalsActive = animalsRoutes.includes(pathname);

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
              role="button" aria-haspopup="true" aria-expanded={sportsOpen}
            >
              ⚽ Sports
              <svg className="site-header__chevron" width="10" height="6" viewBox="0 0 10 6" fill="none" aria-hidden="true">
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
              role="button" aria-haspopup="true" aria-expanded={cultureOpen}
            >
              🧠 Culture
              <svg className="site-header__chevron" width="10" height="6" viewBox="0 0 10 6" fill="none" aria-hidden="true">
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
                    <Link href="/origins" className={`site-header__dropdown-item${pathname === "/origins" ? " is-active" : ""}`} onClick={() => setCultureOpen(false)}>
                      <div className="site-header__dropdown-icon">🌐</div>
                      <div>
                        <div className="site-header__dropdown-name">Origins Quiz</div>
                        <div className="site-header__dropdown-desc">Where was it invented?</div>
                      </div>
                    </Link>
                    <Link href="/wealth" className={`site-header__dropdown-item${pathname === "/wealth" ? " is-active" : ""}`} onClick={() => setCultureOpen(false)}>
                      <div className="site-header__dropdown-icon">💰</div>
                      <div>
                        <div className="site-header__dropdown-name">Who&apos;s Richer?</div>
                        <div className="site-header__dropdown-desc">Celebrity wealth quiz</div>
                      </div>
                    </Link>
                    <Link href="/five-clues" className={`site-header__dropdown-item${pathname === "/five-clues" ? " is-active" : ""}`} onClick={() => setCultureOpen(false)}>
                      <div className="site-header__dropdown-icon">🕵️</div>
                      <div>
                        <div className="site-header__dropdown-name">5 Clues</div>
                        <div className="site-header__dropdown-desc">Who am I? Guess the person</div>
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
              role="button" aria-haspopup="true" aria-expanded={foodOpen}
            >
              🍽️ Food
              <svg className="site-header__chevron" width="10" height="6" viewBox="0 0 10 6" fill="none" aria-hidden="true">
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

            {/* Animals dropdown */}
            <div
              ref={animalsRef}
              className={`site-header__nav-item${animalsOpen ? " is-open" : ""}${isAnimalsActive ? " is-active" : ""}`}
              onClick={() => setAnimalsOpen(o => !o)}
              role="button" aria-haspopup="true" aria-expanded={animalsOpen}
            >
              🦁 Animals
              <svg className="site-header__chevron" width="10" height="6" viewBox="0 0 10 6" fill="none" aria-hidden="true">
                <path d="M1 1l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              {animalsOpen && (
                <div className="site-header__dropdown">
                  <div className="site-header__dropdown-section">
                    <div className="site-header__dropdown-label">Animals</div>
                    <Link href="/wild-battle" className={`site-header__dropdown-item${pathname === "/wild-battle" ? " is-active" : ""}`} onClick={() => setAnimalsOpen(false)}>
                      <div className="site-header__dropdown-icon">🦁</div>
                      <div>
                        <div className="site-header__dropdown-name">Wild Battle</div>
                        <div className="site-header__dropdown-desc">Animal face-offs & wildlife trivia</div>
                      </div>
                    </Link>
                  </div>
                  <div className="site-header__dropdown-viewall">
                    <Link href="/animals" onClick={() => setAnimalsOpen(false)}>View all Animals games →</Link>
                  </div>
                </div>
              )}
            </div>

            {/* Geography dropdown */}
            <div
              ref={geoRef}
              className={`site-header__nav-item${geoOpen ? " is-open" : ""}${isGeoActive ? " is-active" : ""}`}
              onClick={() => setGeoOpen(o => !o)}
              role="button" aria-haspopup="true" aria-expanded={geoOpen}
            >
              🌍 World
              <svg className="site-header__chevron" width="10" height="6" viewBox="0 0 10 6" fill="none" aria-hidden="true">
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

            {/* Sports */}
            <div
              className={`mobile-menu__cat${isSportsActive ? " is-active" : ""}${mobileOpen === "sports" ? " is-open" : ""}`}
              onClick={() => toggleMobile("sports")}
            >
              <span className="mobile-menu__cat-icon">⚽</span>
              <div className="mobile-menu__cat-body">
                <div className="mobile-menu__cat-name">Sports</div>
                <div className="mobile-menu__cat-desc">Football, NBA, Career</div>
              </div>
              <span className="mobile-menu__cat-arrow">{mobileOpen === "sports" ? "⌄" : "›"}</span>
            </div>
            {mobileOpen === "sports" && (
              <div className="mobile-menu__sub">
                <Link href="/sports" className="mobile-menu__sub-cat" onClick={closeMenu}>⚽ All Sports games →</Link>
                <Link href="/football" className={`mobile-menu__sub-item${pathname === "/football" ? " is-active" : ""}`} onClick={closeMenu}><span>⚽</span> FootballQuiz</Link>
                <Link href="/nba"      className={`mobile-menu__sub-item${pathname === "/nba"      ? " is-active" : ""}`} onClick={closeMenu}><span>🏀</span> NBAQuiz</Link>
                <Link href="/career"   className={`mobile-menu__sub-item${pathname === "/career"   ? " is-active" : ""}`} onClick={closeMenu}><span>🔀</span> CareerOrder</Link>
              </div>
            )}

            {/* Culture */}
            <div
              className={`mobile-menu__cat${isCultureActive ? " is-active" : ""}${mobileOpen === "culture" ? " is-open" : ""}`}
              onClick={() => toggleMobile("culture")}
            >
              <span className="mobile-menu__cat-icon">🧠</span>
              <div className="mobile-menu__cat-body">
                <div className="mobile-menu__cat-name">Culture</div>
                <div className="mobile-menu__cat-desc">History & pop culture</div>
              </div>
              <span className="mobile-menu__cat-arrow">{mobileOpen === "culture" ? "⌄" : "›"}</span>
            </div>
            {mobileOpen === "culture" && (
              <div className="mobile-menu__sub">
                <Link href="/culture" className="mobile-menu__sub-cat" onClick={closeMenu}>🧠 All Culture games →</Link>
                <Link href="/wcf"     className={`mobile-menu__sub-item${pathname === "/wcf"     ? " is-active" : ""}`} onClick={closeMenu}><span>⏳</span> WhatCameFirst</Link>
                <Link href="/origins" className={`mobile-menu__sub-item${pathname === "/origins" ? " is-active" : ""}`} onClick={closeMenu}><span>🌐</span> Origins Quiz</Link>
                <Link href="/wealth"     className={`mobile-menu__sub-item${pathname === "/wealth"     ? " is-active" : ""}`} onClick={closeMenu}><span>💰</span> Who&apos;s Richer?</Link>
                <Link href="/five-clues" className={`mobile-menu__sub-item${pathname === "/five-clues" ? " is-active" : ""}`} onClick={closeMenu}><span>🕵️</span> 5 Clues</Link>
              </div>
            )}

            {/* Food */}
            <div
              className={`mobile-menu__cat${isFoodActive ? " is-active" : ""}${mobileOpen === "food" ? " is-open" : ""}`}
              onClick={() => toggleMobile("food")}
            >
              <span className="mobile-menu__cat-icon">🍽️</span>
              <div className="mobile-menu__cat-body">
                <div className="mobile-menu__cat-name">Food</div>
                <div className="mobile-menu__cat-desc">Cuisine & origins</div>
              </div>
              <span className="mobile-menu__cat-arrow">{mobileOpen === "food" ? "⌄" : "›"}</span>
            </div>
            {mobileOpen === "food" && (
              <div className="mobile-menu__sub">
                <Link href="/food-games" className="mobile-menu__sub-cat" onClick={closeMenu}>🍽️ All Food games →</Link>
                <Link href="/food" className={`mobile-menu__sub-item${pathname === "/food" ? " is-active" : ""}`} onClick={closeMenu}><span>🗺️</span> Food Origins</Link>
              </div>
            )}

            {/* Animals */}
            <div
              className={`mobile-menu__cat${isAnimalsActive ? " is-active" : ""}${mobileOpen === "animals" ? " is-open" : ""}`}
              onClick={() => toggleMobile("animals")}
            >
              <span className="mobile-menu__cat-icon">🦁</span>
              <div className="mobile-menu__cat-body">
                <div className="mobile-menu__cat-name">Animals</div>
                <div className="mobile-menu__cat-desc">Wildlife battles & trivia</div>
              </div>
              <span className="mobile-menu__cat-arrow">{mobileOpen === "animals" ? "⌄" : "›"}</span>
            </div>
            {mobileOpen === "animals" && (
              <div className="mobile-menu__sub">
                <Link href="/animals" className="mobile-menu__sub-cat" onClick={closeMenu}>🦁 All Animals games →</Link>
                <Link href="/wild-battle" className={`mobile-menu__sub-item${pathname === "/wild-battle" ? " is-active" : ""}`} onClick={closeMenu}><span>🦁</span> Wild Battle</Link>
              </div>
            )}

            {/* World */}
            <div
              className={`mobile-menu__cat${isGeoActive ? " is-active" : ""}${mobileOpen === "world" ? " is-open" : ""}`}
              onClick={() => toggleMobile("world")}
            >
              <span className="mobile-menu__cat-icon">🌍</span>
              <div className="mobile-menu__cat-body">
                <div className="mobile-menu__cat-name">World</div>
                <div className="mobile-menu__cat-desc">Cities, countries & geography</div>
              </div>
              <span className="mobile-menu__cat-arrow">{mobileOpen === "world" ? "⌄" : "›"}</span>
            </div>
            {mobileOpen === "world" && (
              <div className="mobile-menu__sub">
                <Link href="/world" className="mobile-menu__sub-cat" onClick={closeMenu}>🌍 All World games →</Link>
                <Link href="/citymix"        className={`mobile-menu__sub-item${pathname === "/citymix"        ? " is-active" : ""}`} onClick={closeMenu}><span>🌍</span> CityMix</Link>
                <Link href="/higher-or-lower" className={`mobile-menu__sub-item${pathname === "/higher-or-lower" ? " is-active" : ""}`} onClick={closeMenu}><span>📊</span> Higher or Lower</Link>
                <Link href="/city-origins"   className={`mobile-menu__sub-item${pathname === "/city-origins"   ? " is-active" : ""}`} onClick={closeMenu}><span>🏙️</span> City Mapper</Link>
              </div>
            )}

          </div>
        </div>
      )}
    </>
  );
}
