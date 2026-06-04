import type { Metadata } from "next";
import { Suspense } from "react";
import { getClips } from "@/lib/clips";
import { createClient } from "@/lib/supabase/server";
import ClipFeed from "@/components/ClipFeed";
import BodyScrollLock from "@/components/BodyScrollLock";

export const metadata: Metadata = {
  title: "Ultimate Playground — The best gaming clips right now",
  alternates: { canonical: "https://ultimate-playground.com" },
  description:
    "Watch the best gaming clips from Valorant, Apex Legends, CS2, League of Legends, Marvel Rivals, Rocket League, Minecraft, Rust, GTA V, Overwatch and more. Curated highlights, updated every week.",
  openGraph: {
    title: "Ultimate Playground — The best gaming clips right now",
    description:
      "The best gaming clips from Valorant, Apex, CS2, LoL, Marvel Rivals, Rocket League, Minecraft, Rust, GTA V, Overwatch and more — curated and reviewed every week.",
    images: [{ url: "/og-gamingclips.png", width: 1200, height: 630, alt: "Ultimate Playground" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Ultimate Playground — The best gaming clips right now",
    description:
      "Valorant, Apex, CS2, LoL, Marvel Rivals, Rocket League, Minecraft, Rust, GTA V, Overwatch and more. The best clips, every week.",
  },
};

async function ClipFeedLoader() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const clips = await getClips({ userId: user?.id });
  return <ClipFeed clips={clips} />;
}

function ClipFeedSkeleton() {
  return (
    <div className="cf-layout">
      <aside className="cf-games-panel">
        <div className="cf-skeleton cf-skeleton--sidebar" />
      </aside>
      <div className="cf-video-area">
        <div className="cf-skeleton cf-skeleton--player" />
      </div>
      <aside className="cf-comments-panel">
        <div className="cf-skeleton cf-skeleton--comments" />
      </aside>
    </div>
  );
}

export default function HomePage() {
  return (
    <main className="gc-main">
      <BodyScrollLock />
      <section className="gc-player-zone">
        <Suspense fallback={<ClipFeedSkeleton />}>
          <ClipFeedLoader />
        </Suspense>
      </section>

      <section className="gc-editorial">
        <div className="gc-editorial__inner">
          <EditorialContent />
        </div>
      </section>
    </main>
  );
}

function EditorialContent() {
  return (
    <div className="gc-editorial__block">

      <h1 className="gc-editorial__h1">
        The Best Gaming Clips,{" "}
        <span className="gc-editorial__accent">Right Now</span>
      </h1>
      <p className="gc-editorial__desc">
        Ultimate Playground curates the most impressive, funniest, and most-talked-about gaming
        clips from the biggest titles. No algorithm tricks, no recycled content — just the
        moments worth watching, reviewed and updated every week.
      </p>

      <div className="gc-editorial__divider" />

      <h2 className="gc-editorial__h2">Highlights From Every Game That Matters</h2>
      <p className="gc-editorial__desc">
        From <strong>Valorant</strong> clutch rounds and <strong>Apex Legends</strong> movement
        clips to <strong>Rocket League</strong> ceiling shots and <strong>CS2</strong> 1v5s —
        we cover the full spectrum of competitive and casual gaming highlights. If the community
        is playing it, we&apos;re pulling the best moments from it.
      </p>

      <div className="gc-editorial__games">
        {[
          { name: "Valorant",           color: "#ff4655" },
          { name: "Apex Legends",       color: "#cd4a14" },
          { name: "Marvel Rivals",      color: "#e62429" },
          { name: "The Finals",         color: "#f5a623" },
          { name: "Rocket League",      color: "#1e90ff" },
          { name: "Rainbow Six Siege",  color: "#1c6eb5" },
          { name: "League of Legends",  color: "#c89b3c" },
          { name: "CS2",                color: "#e8a020" },
          { name: "Rust",               color: "#b7431e" },
          { name: "GTA V",              color: "#229954" },
          { name: "Minecraft",          color: "#5b8c2a" },
          { name: "Overwatch",          color: "#f99e1a" },
          { name: "ARC Raiders",        color: "#00b4d8" },
        ].map((g) => (
          <span
            key={g.name}
            className="gc-editorial__game-tag"
            style={{ borderColor: g.color, color: g.color }}
          >
            {g.name}
          </span>
        ))}
      </div>

      <div className="gc-editorial__divider" />

      <h2 className="gc-editorial__h2">What Makes a Clip Worth Watching?</h2>
      <p className="gc-editorial__desc">
        The best gaming highlights share one quality: they capture something that couldn&apos;t
        have been scripted. A <strong>1v5 clutch</strong> with ten seconds on the clock. An
        aerial that had no right to connect. A Rust raid that turned in under a minute. A
        building that collapses on the wrong team at exactly the right moment. That&apos;s what
        we filter for — the clips you send immediately, the ones you rewatch three times.
      </p>

      <div className="gc-editorial__divider" />

      <h2 className="gc-editorial__h2">Curated, Not Algorithmic</h2>
      <p className="gc-editorial__desc">
        Every clip on Ultimate Playground passes a human review before going live. Our pipeline
        pulls new gaming highlights weekly from trusted sources across the community, and
        nothing goes up without a check. No bots, no engagement farming, no clips from 2019
        dressed up as new. Just relevant, recent moments from the games people are actually
        playing right now.
      </p>

      <div className="gc-editorial__divider" />

      <h2 className="gc-editorial__h2">Share Your Best Gaming Moments</h2>
      <p className="gc-editorial__desc">
        Had a game-winning play? Pulled off something your teammates still can&apos;t believe?{" "}
        <a href="/submit" className="gc-editorial__link">Submit your clip</a> and join the
        feed. We review every submission personally.
      </p>

    </div>
  );
}
