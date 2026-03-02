"use client";
import { useEffect, useState, useCallback, useRef } from "react";
import wcfData       from "../wcf_data.json";
import careerData    from "../career_data.json";
import footballData  from "../football_data.json";
import nbaData       from "../nba_data.json";

// ─── Types ───────────────────────────────────────────────────────────────────
type GameKey =
  | "wcf"
  | "career_clubs" | "career_players"
  | "football_players" | "football_stadiums"
  | "nba_players"  | "nba_arenas";

type CustomImages = Record<GameKey, Record<string, string>>;
type SaveStatus   = "idle" | "saving" | "saved" | "error";
type TopTab       = "wcf" | "career" | "football" | "nba";
// undefined = still loading, null = checked & not found, string = found
type WikiStatus   = string | null | undefined;

// ─── WCF ─────────────────────────────────────────────────────────────────────
const WCF_CATEGORIES = ["science", "sports", "culture", "history", "tech"] as const;
type WcfCategory = typeof WCF_CATEGORIES[number];

const WCF_BY_CATEGORY = Object.fromEntries(
  WCF_CATEGORIES.map(cat => [cat, wcfData.events.filter(e => e.category === cat)])
) as Record<WcfCategory, typeof wcfData.events>;

const WCF_LABELS: Record<WcfCategory, string> = {
  science: "🔬 Science", sports: "🏅 Sports", culture: "🎬 Culture",
  history: "📜 History", tech: "💻 Tech",
};

// ─── Career ───────────────────────────────────────────────────────────────────
const CAREER_PLAYERS = [...careerData.players]
  .map(p => ({ wiki: p.wiki, name: p.name }))
  .sort((a, b) => a.name.localeCompare(b.name));

const ALL_CLUBS = Array.from(new Set(careerData.players.flatMap(p => p.clubs))).sort();

// ─── Football ─────────────────────────────────────────────────────────────────
const FOOTBALL_PLAYERS = Array.from(new Map([
  ...footballData.transfers.map(t => [t.wiki, { wiki: t.wiki, name: t.player }] as [string, { wiki: string; name: string }]),
  ...footballData.salaries .map(s => [s.wiki, { wiki: s.wiki, name: s.player }] as [string, { wiki: string; name: string }]),
  ...footballData.peaks    .map(p => [p.wiki, { wiki: p.wiki, name: p.player }] as [string, { wiki: string; name: string }]),
])).map(([, v]) => v).sort((a, b) => a.name.localeCompare(b.name));

const FOOTBALL_STADIUMS = [...footballData.stadiums]
  .map(s => ({ wiki: s.wiki, name: s.name }))
  .sort((a, b) => a.name.localeCompare(b.name));

// ─── NBA ──────────────────────────────────────────────────────────────────────
const NBA_PLAYERS = Array.from(new Map([
  ...nbaData.contracts.map(c => [c.wiki, { wiki: c.wiki, name: c.player }] as [string, { wiki: string; name: string }]),
  ...nbaData.salaries .map(s => [s.wiki, { wiki: s.wiki, name: s.player }] as [string, { wiki: string; name: string }]),
  ...nbaData.peaks    .map(p => [p.wiki, { wiki: p.wiki, name: p.player }] as [string, { wiki: string; name: string }]),
])).map(([, v]) => v).sort((a, b) => a.name.localeCompare(b.name));

const NBA_ARENAS = [...nbaData.arenas]
  .map(a => ({ wiki: a.wiki, name: a.name }))
  .sort((a, b) => a.name.localeCompare(b.name));

// ─── Wikipedia batch fetch ────────────────────────────────────────────────────
async function fetchWikiBatch(titles: string[]): Promise<Record<string, string | null>> {
  if (!titles.length) return {};
  try {
    const joined = titles.map(encodeURIComponent).join("|");
    const url = `https://en.wikipedia.org/w/api.php?action=query&titles=${joined}&prop=pageimages&format=json&pithumbsize=300&origin=*`;
    const json = await (await fetch(url)).json();

    // Build normalisation / redirect map  original → final page title
    const norm: Record<string, string> = {};
    for (const n of json.query?.normalized ?? []) norm[n.from] = n.to;
    for (const r of json.query?.redirects  ?? []) norm[r.from] = r.to;

    // page title → thumbnail url | null
    const pages: Record<string, string | null> = {};
    for (const p of Object.values(json.query?.pages ?? {}) as Record<string, unknown>[]) {
      const page = p as { title: string; thumbnail?: { source: string } };
      pages[page.title] = page.thumbnail?.source ?? null;
    }

    // Map every original title to its result
    const result: Record<string, string | null> = {};
    for (const t of titles) result[t] = pages[norm[t] ?? t] ?? null;
    return result;
  } catch {
    return Object.fromEntries(titles.map(t => [t, null]));
  }
}

// ─── useWikiCheck hook ────────────────────────────────────────────────────────
function useWikiCheck(wikiKeys: string[]) {
  const [map,     setMap]     = useState<Record<string, string | null>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    setMap({});
    const chunks: string[][] = [];
    for (let i = 0; i < wikiKeys.length; i += 50) chunks.push(wikiKeys.slice(i, i + 50));
    Promise.all(chunks.map(fetchWikiBatch))
      .then(results => {
        const merged: Record<string, string | null> = {};
        for (const r of results) Object.assign(merged, r);
        setMap(merged);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // static keys — only run once

  return { wikiMap: map, wikiLoading: loading };
}

// ─── ImageRow ─────────────────────────────────────────────────────────────────
function ImageRow({
  label, sublabel, itemKey, game, savedUrl, onSaved, wikiImgUrl,
}: {
  label: string;
  sublabel?: string;
  itemKey: string;
  game: GameKey;
  savedUrl: string;
  onSaved: (key: string, url: string) => void;
  wikiImgUrl?: WikiStatus; // undefined=loading, null=missing, string=found
}) {
  const [url,       setUrl]      = useState(savedUrl);
  const [status,    setStatus]   = useState<SaveStatus>("idle");
  const [dragging,  setDragging] = useState(false);
  const [uploading, setUploading]= useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => { setUrl(savedUrl); }, [savedUrl]);

  async function save(urlToSave: string) {
    setStatus("saving");
    try {
      const res = await fetch("/api/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ game, key: itemKey, url: urlToSave }),
      });
      if (res.ok) {
        setStatus("saved");
        onSaved(itemKey, urlToSave);
        setTimeout(() => setStatus("idle"), 1500);
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    }
  }

  async function uploadFile(file: File) {
    setUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("game", game);
      form.append("key",  itemKey);
      const json = await (await fetch("/api/admin/upload", { method: "POST", body: form })).json();
      if (json.ok && json.url) {
        setUrl(json.url);
        await save(json.url);
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    }
    setUploading(false);
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file?.type.startsWith("image/")) uploadFile(file);
  }

  // ── Thumbnail style based on status ──────────────────────────────────────
  const thumbBorder = dragging
    ? "2px solid #2563eb"
    : url
    ? "2px solid #3b82f6"             // custom image set (blue)
    : typeof wikiImgUrl === "string"
    ? "2px solid #22c55e"             // wiki image ok   (green)
    : wikiImgUrl === null
    ? "1.5px dashed #ef4444"          // wiki missing    (red)
    : "1.5px dashed #555";            // still loading   (grey)

  const thumbTitle = url
    ? "Custom image — drop or click to replace"
    : typeof wikiImgUrl === "string"
    ? "Wikipedia image available — drop or click to override"
    : wikiImgUrl === null
    ? "No image found — drop or click to add one"
    : "Checking Wikipedia…";

  const dirty = url !== savedUrl;

  return (
    <div style={rowStyle}>
      {/* Drop zone / preview */}
      <div
        onDragOver={e => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => fileRef.current?.click()}
        title={thumbTitle}
        style={{
          width: 44, height: 44, flexShrink: 0, borderRadius: 6,
          overflow: "hidden", cursor: "pointer",
          border: thumbBorder,
          background: "#1a1a2e",
          display: "flex", alignItems: "center", justifyContent: "center",
          transition: "border-color 0.15s", position: "relative",
        }}
      >
        {url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={url} alt=""
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
            onError={e => { (e.target as HTMLImageElement).style.display = "none"; }}
          />
        ) : typeof wikiImgUrl === "string" ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={wikiImgUrl} alt=""
              style={{ width: "100%", height: "100%", objectFit: "cover", opacity: 0.45 }}
            />
            {/* "W" badge — indicates this is the Wikipedia fallback */}
            <span style={{
              position: "absolute", bottom: 2, right: 3,
              fontSize: 9, fontWeight: 800, color: "#22c55e", lineHeight: 1,
            }}>W</span>
          </>
        ) : wikiImgUrl === null ? (
          <span style={{ color: "#ef4444", fontSize: 18, fontWeight: 700 }}>!</span>
        ) : (
          <span style={{ color: uploading ? "#2563eb" : "#555", fontSize: uploading ? 13 : 20 }}>
            {uploading ? "…" : "+"}
          </span>
        )}
      </div>

      <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }}
        onChange={e => {
          const file = e.target.files?.[0];
          if (file) uploadFile(file);
          e.target.value = "";
        }}
      />

      {/* Label */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 600, fontSize: 13, color: "#e0e0e0", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {label}
        </div>
        {sublabel && <div style={{ fontSize: 11, color: "#888", marginTop: 1 }}>{sublabel}</div>}
      </div>

      {/* URL input */}
      <input type="text" value={url}
        onChange={e => { setUrl(e.target.value); setStatus("idle"); }}
        placeholder="Image URL…"
        style={inputStyle}
      />

      {/* Save */}
      <button onClick={() => save(url)} disabled={status === "saving" || !dirty}
        style={{
          ...btnStyle,
          opacity: (!dirty && status === "idle") ? 0.4 : 1,
          background: status === "saved" ? "#1a7a4a" : status === "error" ? "#7a2020" : "#2563eb",
        }}
      >
        {status === "saving" ? "…" : status === "saved" ? "✓" : status === "error" ? "!" : "Save"}
      </button>

      {/* Clear */}
      {url && (
        <button onClick={() => { setUrl(""); setStatus("idle"); }}
          style={{ ...btnStyle, background: "#444", padding: "6px 8px" }} title="Clear image">
          ✕
        </button>
      )}
    </div>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const rowStyle: React.CSSProperties = {
  display: "flex", alignItems: "center", gap: 10,
  padding: "8px 12px", borderBottom: "1px solid #1e1e2e",
};
const inputStyle: React.CSSProperties = {
  flex: 2, minWidth: 0,
  background: "#1a1a2e", border: "1px solid #333", borderRadius: 5,
  color: "#e0e0e0", padding: "5px 8px", fontSize: 12, fontFamily: "monospace",
};
const btnStyle: React.CSSProperties = {
  background: "#2563eb", color: "#fff", border: "none", borderRadius: 5,
  padding: "6px 12px", fontSize: 12, cursor: "pointer",
  flexShrink: 0, transition: "background 0.2s",
};
const tabStyle = (active: boolean): React.CSSProperties => ({
  padding: "8px 20px", border: "none",
  borderBottom: active ? "2px solid #2563eb" : "2px solid transparent",
  background: "transparent", color: active ? "#fff" : "#888",
  fontWeight: active ? 700 : 400, fontSize: 14, cursor: "pointer",
});
const chipStyle = (active: boolean): React.CSSProperties => ({
  padding: "5px 14px", border: "1px solid",
  borderColor: active ? "#2563eb" : "#333", borderRadius: 20,
  background: active ? "#1a3a8a" : "#111",
  color: active ? "#fff" : "#aaa", fontSize: 12, cursor: "pointer",
});

// ─── FilterBar ────────────────────────────────────────────────────────────────
function FilterBar({ total, missingCount, wikiLoading, filter, onFilter }: {
  total: number;
  missingCount: number;
  wikiLoading: boolean;
  filter: "all" | "missing";
  onFilter: (f: "all" | "missing") => void;
}) {
  return (
    <div style={{ display: "flex", gap: 8, marginBottom: 12, alignItems: "center" }}>
      <button onClick={() => onFilter("all")} style={chipStyle(filter === "all")}>
        All ({total})
      </button>
      {wikiLoading ? (
        <span style={{ fontSize: 12, color: "#666" }}>Checking Wikipedia images…</span>
      ) : (
        <button onClick={() => onFilter("missing")} style={{
          ...chipStyle(filter === "missing"),
          borderColor: filter === "missing" ? "#ef4444" : missingCount > 0 ? "#7f3030" : "#333",
          color:  filter === "missing" ? "#fff" : missingCount > 0 ? "#ef4444" : "#666",
          background: filter === "missing" ? "#5a1a1a" : "#111",
        }}>
          ❗ No image ({missingCount})
        </button>
      )}
      {!wikiLoading && (
        <span style={{ fontSize: 11, color: "#555", marginLeft: 4 }}>
          <span style={{ color: "#22c55e" }}>●</span> wiki ok &nbsp;
          <span style={{ color: "#ef4444" }}>●</span> missing &nbsp;
          <span style={{ color: "#3b82f6" }}>●</span> custom
        </span>
      )}
    </div>
  );
}

// ─── Section with wiki status ─────────────────────────────────────────────────
function Section<T extends { wiki: string; name: string }>({
  items, game, data, onSaved, sublabelFn,
}: {
  items: T[];
  game: GameKey;
  data: Record<string, string>;
  onSaved: (key: string, url: string) => void;
  sublabelFn?: (item: T) => string;
}) {
  const { wikiMap, wikiLoading } = useWikiCheck(items.map(i => i.wiki));
  const [filter, setFilter] = useState<"all" | "missing">("all");

  const missingCount = wikiLoading ? 0
    : items.filter(item => !data[item.wiki] && wikiMap[item.wiki] === null).length;

  const visibleItems = filter === "missing"
    ? items.filter(item => !data[item.wiki] && wikiMap[item.wiki] === null)
    : items;

  return (
    <div>
      <FilterBar
        total={items.length} missingCount={missingCount}
        wikiLoading={wikiLoading} filter={filter} onFilter={setFilter}
      />
      <div style={{ background: "#111", borderRadius: 8, border: "1px solid #222" }}>
        {visibleItems.map(item => (
          <ImageRow
            key={item.wiki}
            label={item.name}
            sublabel={sublabelFn ? sublabelFn(item) : `key: ${item.wiki}`}
            itemKey={item.wiki}
            game={game}
            savedUrl={data[item.wiki] ?? ""}
            wikiImgUrl={wikiLoading ? undefined : (wikiMap[item.wiki] ?? null)}
            onSaved={onSaved}
          />
        ))}
        {!wikiLoading && visibleItems.length === 0 && (
          <div style={{ padding: 20, color: "#4ade80", textAlign: "center", fontSize: 13 }}>
            ✓ All images covered
          </div>
        )}
      </div>
    </div>
  );
}

// ─── WCF section (inline, with wiki check) ───────────────────────────────────
function WcfSection({ cat, data, onSaved }: {
  cat: WcfCategory;
  data: Record<string, string>;
  onSaved: (k: string, u: string) => void;
}) {
  const events = WCF_BY_CATEGORY[cat];
  const { wikiMap, wikiLoading } = useWikiCheck(events.map(e => e.wiki));
  const [filter, setFilter] = useState<"all" | "missing">("all");

  const missingCount = wikiLoading ? 0
    : events.filter(e => !data[e.wiki] && wikiMap[e.wiki] === null).length;

  const visible = filter === "missing"
    ? events.filter(e => !data[e.wiki] && wikiMap[e.wiki] === null)
    : events;

  return (
    <div>
      <FilterBar
        total={events.length} missingCount={missingCount}
        wikiLoading={wikiLoading} filter={filter} onFilter={setFilter}
      />
      <div style={{ background: "#111", borderRadius: 8, border: "1px solid #222" }}>
        {visible.map(ev => (
          <ImageRow
            key={ev.wiki}
            label={ev.text}
            sublabel={`${ev.year} · key: ${ev.wiki}`}
            itemKey={ev.wiki}
            game="wcf"
            savedUrl={data[ev.wiki] ?? ""}
            wikiImgUrl={wikiLoading ? undefined : (wikiMap[ev.wiki] ?? null)}
            onSaved={onSaved}
          />
        ))}
        {!wikiLoading && visible.length === 0 && (
          <div style={{ padding: 20, color: "#4ade80", textAlign: "center", fontSize: 13 }}>
            ✓ All images covered
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function AdminPage() {
  const [tab,     setTab]    = useState<TopTab>("wcf");
  const [wcfCat,  setWcfCat] = useState<WcfCategory>("science");
  const [subTab,  setSubTab] = useState<string>("players");
  const [data,    setData]   = useState<CustomImages>({
    wcf: {}, career_clubs: {}, career_players: {},
    football_players: {}, football_stadiums: {},
    nba_players: {}, nba_arenas: {},
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin")
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => { setSubTab("players"); }, [tab]);

  const saved = useCallback((game: GameKey, key: string, url: string) => {
    setData(prev => ({ ...prev, [game]: { ...prev[game], [key]: url } }));
  }, []);

  if (loading) {
    return <div style={{ color: "#aaa", padding: 40, textAlign: "center" }}>Loading…</div>;
  }

  return (
    <div style={{ maxWidth: 960, margin: "0 auto", padding: "24px 16px", color: "#e0e0e0" }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>Image Back Office</h1>
      <p style={{ color: "#888", fontSize: 13, marginBottom: 20 }}>
        Drop a file on the thumbnail or paste a URL.
        Dimmed thumbnails with a <span style={{ color: "#22c55e", fontWeight: 700 }}>W</span> badge
        show the current Wikipedia image — add a custom one to override it.
      </p>

      {/* ── Top tabs ── */}
      <div style={{ display: "flex", borderBottom: "1px solid #333", marginBottom: 20 }}>
        <button style={tabStyle(tab === "wcf")}      onClick={() => setTab("wcf")}>
          ⏳ WhatCameFirst <Badge n={wcfData.events.length} />
        </button>
        <button style={tabStyle(tab === "career")}   onClick={() => setTab("career")}>
          🔀 Career <Badge n={CAREER_PLAYERS.length + ALL_CLUBS.length} />
        </button>
        <button style={tabStyle(tab === "football")} onClick={() => setTab("football")}>
          ⚽ Football <Badge n={FOOTBALL_PLAYERS.length + FOOTBALL_STADIUMS.length} />
        </button>
        <button style={tabStyle(tab === "nba")}      onClick={() => setTab("nba")}>
          🏀 NBA <Badge n={NBA_PLAYERS.length + NBA_ARENAS.length} />
        </button>
      </div>

      {/* ── WCF tab ── */}
      {tab === "wcf" && (
        <div>
          <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
            {WCF_CATEGORIES.map(cat => (
              <button key={cat} onClick={() => setWcfCat(cat)} style={chipStyle(wcfCat === cat)}>
                {WCF_LABELS[cat]} ({WCF_BY_CATEGORY[cat].length})
              </button>
            ))}
          </div>
          <WcfSection
            cat={wcfCat}
            data={data.wcf}
            onSaved={(k, u) => saved("wcf", k, u)}
          />
        </div>
      )}

      {/* ── Career tab ── */}
      {tab === "career" && (
        <div>
          <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
            <button onClick={() => setSubTab("players")} style={chipStyle(subTab === "players")}>
              👤 Players ({CAREER_PLAYERS.length})
            </button>
            <button onClick={() => setSubTab("clubs")} style={chipStyle(subTab === "clubs")}>
              🏟 Clubs ({ALL_CLUBS.length})
            </button>
          </div>
          {subTab === "players" && (
            <Section items={CAREER_PLAYERS} game="career_players"
              data={data.career_players} onSaved={(k, u) => saved("career_players", k, u)} />
          )}
          {subTab === "clubs" && (
            <div style={{ background: "#111", borderRadius: 8, border: "1px solid #222" }}>
              {ALL_CLUBS.map(club => (
                <ImageRow key={club} label={club} itemKey={club}
                  game="career_clubs" savedUrl={data.career_clubs[club] ?? ""}
                  onSaved={(k, u) => saved("career_clubs", k, u)} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Football tab ── */}
      {tab === "football" && (
        <div>
          <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
            <button onClick={() => setSubTab("players")} style={chipStyle(subTab === "players")}>
              👤 Players ({FOOTBALL_PLAYERS.length})
            </button>
            <button onClick={() => setSubTab("stadiums")} style={chipStyle(subTab === "stadiums")}>
              🏟 Stadiums ({FOOTBALL_STADIUMS.length})
            </button>
          </div>
          {subTab === "players" && (
            <Section items={FOOTBALL_PLAYERS} game="football_players"
              data={data.football_players} onSaved={(k, u) => saved("football_players", k, u)} />
          )}
          {subTab === "stadiums" && (
            <Section items={FOOTBALL_STADIUMS} game="football_stadiums"
              data={data.football_stadiums} onSaved={(k, u) => saved("football_stadiums", k, u)} />
          )}
        </div>
      )}

      {/* ── NBA tab ── */}
      {tab === "nba" && (
        <div>
          <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
            <button onClick={() => setSubTab("players")} style={chipStyle(subTab === "players")}>
              👤 Players ({NBA_PLAYERS.length})
            </button>
            <button onClick={() => setSubTab("arenas")} style={chipStyle(subTab === "arenas")}>
              🏟 Arenas ({NBA_ARENAS.length})
            </button>
          </div>
          {subTab === "players" && (
            <Section items={NBA_PLAYERS} game="nba_players"
              data={data.nba_players} onSaved={(k, u) => saved("nba_players", k, u)} />
          )}
          {subTab === "arenas" && (
            <Section items={NBA_ARENAS} game="nba_arenas"
              data={data.nba_arenas} onSaved={(k, u) => saved("nba_arenas", k, u)} />
          )}
        </div>
      )}
    </div>
  );
}

// ─── Small count badge ────────────────────────────────────────────────────────
function Badge({ n }: { n: number }) {
  return (
    <span style={{
      display: "inline-block", marginLeft: 6,
      background: "#1e2a3a", color: "#6b9fd4",
      fontSize: 11, fontWeight: 700, padding: "1px 7px",
      borderRadius: 10, verticalAlign: "middle",
    }}>{n}</span>
  );
}
