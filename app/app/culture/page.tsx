import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Culture Games — History & Pop Culture Quizzes | Ultimate Playground",
  description:
    "Free online culture and history quiz games. Pick which event came first — sports records, tech milestones, historic moments and pop culture. Solo & multiplayer.",
};

const GAMES = [
  {
    slug: "/wcf",
    emoji: "⏳",
    title: "WhatCameFirst?",
    desc: "Two events from sports, tech, history or pop culture — pick the one that happened first.",
    tags: ["Solo", "Multiplayer"],
  },
];

const OTHER_CATEGORIES = [
  { href: "/world",      emoji: "🌍", label: "World"  },
  { href: "/sports",     emoji: "🏆", label: "Sports" },
  { href: "/food-games", emoji: "🍽️", label: "Food"   },
];

export default function CulturePage() {
  return (
    <div className="home-page">
      <div className="home-page__content">

        {/* Hero */}
        <div className="cat-page__hero">
          <h1 className="cat-page__h1">🧠 Free Culture & History Quiz Games — Timeline & Trivia Challenges</h1>
          <p className="cat-page__lead">
            History, technology, pop culture and sports milestones — challenge your timeline
            knowledge and see if you can sort events in the right order.
          </p>
        </div>

        {/* Game cards */}
        <div className="category__games">
          {GAMES.map(g => (
            <Link key={g.slug} href={g.slug} className="game-card game-card--available">
              <div className="game-card__header">
                <span className="game-card__emoji">{g.emoji}</span>
                <span className="game-card__title">{g.title}</span>
              </div>
              <p className="game-card__desc">{g.desc}</p>
              <div className="game-card__footer">
                <div className="game-card__tags">
                  {g.tags.map(t => <span key={t} className="game-card__tag">{t}</span>)}
                </div>
                <span className="game-card__cta">Play →</span>
              </div>
            </Link>
          ))}
        </div>

        {/* Silo — other categories */}
        <div className="cat-page__silo">
          <p className="cat-page__silo-title">Explore other categories</p>
          <div className="cat-page__silo-links">
            {OTHER_CATEGORIES.map(c => (
              <Link key={c.href} href={c.href} className="cat-page__silo-link">
                {c.emoji} {c.label}
              </Link>
            ))}
          </div>
        </div>

        {/* SEO content */}
        <div className="cat-page__seo">
          <h2>Test your cultural knowledge across every domain</h2>
          <p>
            Culture is everything that happened, was invented, released or achieved — from
            moon landings to World Cup finals, from the first iPhone to the birth of the
            internet. Ultimate Playground&apos;s Culture category turns that sprawling timeline
            into a game anyone can play.
          </p>

          <h2>WhatCameFirst? — the ultimate timeline challenge</h2>
          <p>
            Two events flash on screen. One came first in real history — your job is to pick
            the right one before the timer runs out. The events span four domains:
          </p>
          <ul>
            <li><strong>Sports</strong> — records, tournaments, historic moments</li>
            <li><strong>Technology</strong> — inventions, product launches, milestones</li>
            <li><strong>History</strong> — treaties, discoveries, political events</li>
            <li><strong>Pop culture</strong> — album releases, films, iconic moments</li>
          </ul>
          <p>
            Some rounds are straightforward — everyone knows the moon landing came before the
            first smartphone. Others are genuinely tricky: did Facebook launch before or after
            YouTube? Was Ronaldo&apos;s Ballon d&apos;Or before or after Messi&apos;s first?
          </p>

          <h2>Why timeline games are so compelling</h2>
          <p>
            Chronological reasoning is a surprisingly difficult cognitive skill. We remember
            facts but struggle with sequences. WhatCameFirst? exposes those gaps in a way that
            feels fair and fun — because both events are real, both are memorable, and the
            margin between them is often much smaller than you expect.
          </p>

          <h2>Multiplayer mode — who has the sharper memory?</h2>
          <p>
            WhatCameFirst? supports live multiplayer with synchronised rounds. Both players
            see the same event pairs, race the same timer and accumulate points in real time.
            A great way to settle once and for all who really knows their history.
          </p>
        </div>

      </div>
    </div>
  );
}
