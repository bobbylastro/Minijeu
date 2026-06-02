import type { Metadata } from "next";
import { Suspense } from "react";
import { getClips } from "@/lib/clips";
import { createClient } from "@/lib/supabase/server";
import ClipFeed from "@/components/ClipFeed";

export const metadata: Metadata = {
  title: "Ultimate Playground — The best gaming clips right now",
  description:
    "Watch the best Valorant, Apex Legends, Marvel Rivals, The Finals, Rocket League and Rainbow Six Siege clips. Curated automatically, fresh clips every week.",
  openGraph: {
    title: "Ultimate Playground — The best gaming clips right now",
    description:
      "The best Valorant, Apex, Marvel Rivals, The Finals, Rocket League and R6 Siege moments — curated automatically from Medal.tv and Twitch.",
    images: [{ url: "/og-gamingclips.png", width: 1200, height: 630, alt: "Ultimate Playground" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Ultimate Playground — The best gaming clips right now",
    description:
      "Valorant, Apex, Marvel Rivals, The Finals, Rocket League, R6 Siege. The best clips, every week.",
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
      <h2 className="gc-editorial__title">
        The best gaming clips,{" "}
        <span className="gc-editorial__accent">all in one place</span>
      </h2>
      <p className="gc-editorial__desc">
        Ultimate Playground automatically curates the best moments from the biggest games —
        from <strong>Valorant</strong> to <strong>Minecraft</strong>, <strong>CS2</strong> to <strong>GTA V</strong>.
        Fresh clips added every week.
      </p>
      <p className="gc-editorial__cta-text">
        Create an account to like your favourite clips and join the conversation.
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
          { name: "TFT",                color: "#0ac8b9" },
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
    </div>
  );
}
