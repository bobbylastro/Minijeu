"use client";
/**
 * WorldMap — react-simple-maps based, colorful political style.
 * Named LeafletMap.tsx to avoid changing the import in FoodOriginGame.
 */
import { useState, useCallback, memo, useEffect, useRef } from "react";
import {
  ComposableMap, Geographies, Geography, ZoomableGroup,
} from "react-simple-maps";

interface Props {
  correctCode: string | string[];
  clickedCode: string | null;
  pendingCode?: string | null;
  revealed: boolean;
  disabled: boolean;
  onCountryClick: (alpha2: string, name: string) => void;
  onCountryHover: (info: { name: string; alpha2: string } | null) => void;
  zoomOnReveal?: boolean;
  onRevealAnimationEnd?: () => void;
}

// Geographic centers [lon, lat] + zoom level for zoom-to-country on reveal
const COUNTRY_CENTERS: Record<string, { ll: [number, number]; z: number }> = {
  AR: { ll: [-64, -34],  z: 3   },
  AU: { ll: [134, -25],  z: 2.5 },
  BO: { ll: [-65, -17],  z: 4.5 },
  BR: { ll: [-52, -10],  z: 2.5 },
  BW: { ll: [24,  -22],  z: 5   },
  CA: { ll: [-96,  57],  z: 2.5 },
  CD: { ll: [24,   -3],  z: 4   },
  CL: { ll: [-71, -35],  z: 3.5 },
  CN: { ll: [103,  36],  z: 2.5 },
  CO: { ll: [-74,   4],  z: 4.5 },
  CR: { ll: [-84,  10],  z: 7   },
  DZ: { ll: [3,    28],  z: 4   },
  EC: { ll: [-78,  -2],  z: 5.5 },
  ES: { ll: [-4,   40],  z: 5   },
  ET: { ll: [40,    9],  z: 4.5 },
  GA: { ll: [12,   -1],  z: 5.5 },
  GT: { ll: [-90,  15],  z: 6.5 },
  GY: { ll: [-59,   5],  z: 5.5 },
  ID: { ll: [118,  -2],  z: 3.5 },
  IN: { ll: [79,   22],  z: 3.5 },
  IS: { ll: [-19,  65],  z: 5.5 },
  JP: { ll: [138,  37],  z: 5   },
  KE: { ll: [38,    1],  z: 5   },
  KH: { ll: [105,  12],  z: 6   },
  KR: { ll: [128,  37],  z: 6   },
  KZ: { ll: [68,   48],  z: 3.5 },
  LR: { ll: [-9,    6],  z: 6.5 },
  MG: { ll: [47,  -20],  z: 5   },
  MM: { ll: [96,   19],  z: 5   },
  MN: { ll: [103,  47],  z: 4   },
  MX: { ll: [-102, 23],  z: 4   },
  MY: { ll: [110,   3],  z: 5   },
  NP: { ll: [84,   28],  z: 6   },
  NZ: { ll: [172, -42],  z: 5   },
  PA: { ll: [-80,   9],  z: 7   },
  PE: { ll: [-76, -10],  z: 4.5 },
  PG: { ll: [145,  -6],  z: 5   },
  PH: { ll: [122,  12],  z: 5   },
  PL: { ll: [20,   52],  z: 5.5 },
  RU: { ll: [100,  62],  z: 1.8 },
  TH: { ll: [101,  15],  z: 5   },
  TZ: { ll: [35,   -6],  z: 5   },
  UG: { ll: [32,    1],  z: 6   },
  US: { ll: [-100, 40],  z: 2.5 },
  VE: { ll: [-66,   8],  z: 4.5 },
  VN: { ll: [106,  16],  z: 5   },
  ZA: { ll: [25,  -29],  z: 5   },
  ZM: { ll: [28,  -14],  z: 5   },
};

const GEO_URL      = "/world-110m.json";
const ISRAEL_ID    = "376";
const PALESTINE_ID = "275";

// Numeric ISO → alpha-2
const N2A: Record<string, string> = {
  "004":"AF","008":"AL","012":"DZ","024":"AO","032":"AR","051":"AM","036":"AU",
  "040":"AT","031":"AZ","048":"BH","050":"BD","112":"BY","056":"BE","068":"BO",
  "070":"BA","072":"BW","076":"BR","096":"BN","100":"BG","854":"BF","108":"BI",
  "116":"KH","120":"CM","124":"CA","140":"CF","148":"TD","152":"CL","156":"CN",
  "170":"CO","178":"CG","188":"CR","191":"HR","192":"CU","196":"CY","203":"CZ",
  "180":"CD","208":"DK","214":"DO","218":"EC","818":"EG","222":"SV","232":"ER",
  "233":"EE","231":"ET","242":"FJ","246":"FI","250":"FR","266":"GA","268":"GE",
  "276":"DE","288":"GH","300":"GR","320":"GT","324":"GN","328":"GY","332":"HT",
  "340":"HN","348":"HU","352":"IS","356":"IN","360":"ID","364":"IR","368":"IQ",
  "372":"IE","380":"IT","388":"JM","392":"JP","400":"JO","398":"KZ","404":"KE",
  "414":"KW","417":"KG","418":"LA","428":"LV","422":"LB","434":"LY","440":"LT",
  "442":"LU","450":"MG","454":"MW","458":"MY","466":"ML","470":"MT","478":"MR",
  "484":"MX","498":"MD","496":"MN","499":"ME","504":"MA","508":"MZ","104":"MM",
  "516":"NA","524":"NP","528":"NL","554":"NZ","558":"NI","562":"NE","566":"NG",
  "408":"KP","807":"MK","578":"NO","512":"OM","586":"PK","275":"PS","591":"PA",
  "598":"PG","600":"PY","604":"PE","608":"PH","616":"PL","620":"PT","634":"QA",
  "642":"RO","643":"RU","646":"RW","682":"SA","686":"SN","688":"RS","694":"SL",
  "703":"SK","705":"SI","706":"SO","710":"ZA","410":"KR","728":"SS","724":"ES",
  "144":"LK","729":"SD","740":"SR","752":"SE","756":"CH","760":"SY","158":"TW",
  "762":"TJ","834":"TZ","764":"TH","768":"TG","780":"TT","788":"TN","792":"TR",
  "795":"TM","800":"UG","804":"UA","784":"AE","826":"GB","840":"US","858":"UY",
  "860":"UZ","862":"VE","704":"VN","887":"YE","894":"ZM","716":"ZW","384":"CI",
  "304":"GL",
  "204":"BJ","064":"BT","226":"GQ","262":"DJ","270":"GM","426":"LS","430":"LR",
  "480":"MU","624":"GW","678":"ST","690":"SC","748":"SZ","084":"BZ","626":"TL",
  "020":"AD","174":"KM","132":"CV","090":"SB","548":"VU","882":"WS","296":"KI",
  "584":"MH","583":"FM","520":"NR","798":"TV","776":"TO",
  "732":"MA",
  "383":"XK",
};

// One color per continent
const CONTINENT_COLOR: Record<string, string> = (() => {
  const map: Record<string, string> = {};
  const set = (color: string, codes: string[]) => codes.forEach(c => { map[c] = color; });
  set("#7eb8d4", ["AL","AD","AT","BY","BE","BA","BG","HR","CY","CZ","DK","EE","FI","FR","DE",
    "GR","HU","IS","IE","IT","LV","LT","LU","MT","MD","ME","NL","MK","NO","PL","PT",
    "RO","RU","RS","SK","SI","ES","SE","CH","UA","GB","XK"]);
  set("#f4a261", ["AF","AM","AZ","BH","BD","BN","BT","KH","CN","GE","IN","ID","IR","IQ","JP",
    "JO","KZ","KW","KG","LA","LB","MY","MN","MM","NP","KP","OM","PK","PS","PH","QA",
    "SA","KR","LK","SY","TW","TJ","TH","TL","TM","TR","AE","UZ","VN","YE"]);
  set("#f9c74f", ["DZ","AO","BJ","BW","BF","BI","CM","CF","TD","CD","CG","CI","CV","KM",
    "DJ","EG","GQ","ER","ET","GA","GM","GH","GN","GW","KE","LS","LR","LY","MG","MW",
    "ML","MR","MA","MU","MZ","NA","NE","NG","RW","ST","SN","SC","SL","SO","ZA","SS",
    "SD","SZ","TZ","TG","TN","UG","ZM","ZW"]);
  set("#c77dff", ["CA","US","MX","GL","BZ","CR","CU","DO","SV","GT","HT","HN","JM","NI","PA","TT"]);
  set("#6bcb77", ["AR","BO","BR","CL","CO","EC","GF","GY","PY","PE","SR","UY","VE"]);
  set("#ff9b85", ["AU","FJ","FM","KI","MH","NR","NZ","PG","SB","TO","TV","VU","WS"]);
  return map;
})();

const C_DEFAULT = "#c8d8c8";

const FRENCH_GUIANA_GEOJSON = {
  type: "FeatureCollection" as const,
  features: [{
    type: "Feature" as const,
    properties: { name: "French Guiana" },
    geometry: {
      type: "Polygon" as const,
      coordinates: [[
        [-54.6, 5.9], [-53.8, 5.9], [-53.1, 5.7], [-52.3, 5.4],
        [-50.5, 4.5], [-50.5, 1.0], [-52.5, 1.0],
        [-54.0, 2.0], [-54.6, 3.2], [-54.6, 5.9],
      ]],
    },
  }],
};

type Position = { coordinates: [number, number]; zoom: number };

export default memo(function WorldMap({
  correctCode, clickedCode, pendingCode, revealed, disabled, onCountryClick, onCountryHover,
  zoomOnReveal = false, onRevealAnimationEnd,
}: Props) {
  const [position, setPosition] = useState<Position>({ coordinates: [10, 10], zoom: 1 });
  const wrapRef = useRef<HTMLDivElement>(null);
  // Keep a stable ref to the callback so the native listener closure always calls the latest version
  const onClickRef = useRef(onCountryClick);
  useEffect(() => { onClickRef.current = onCountryClick; }, [onCountryClick]);

  // Prevent page scroll when wheel is used over the map
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const handler = (e: WheelEvent) => e.preventDefault();
    el.addEventListener("wheel", handler, { passive: false });
    return () => el.removeEventListener("wheel", handler);
  }, []);

  // Native CAPTURE touch listeners on the wrapper div.
  // The wrapper is an ancestor of the SVG where d3-zoom attaches its listeners,
  // so capture phase on the wrapper fires BEFORE d3-zoom — giving us first-tap detection.
  useEffect(() => {
    const wrapper = wrapRef.current;
    if (!wrapper) return;
    let ts: { x: number; y: number } | null = null;

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        ts = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      } else {
        ts = null; // pinch zoom — don't track
      }
    };

    const onTouchEnd = (e: TouchEvent) => {
      if (!ts) return;
      const t = e.changedTouches[0];
      const dx = Math.abs(t.clientX - ts.x);
      const dy = Math.abs(t.clientY - ts.y);
      ts = null;
      if (dx >= 10 || dy >= 10) return; // was a pan gesture, not a tap

      // Walk up from the touched element to find our data-alpha2 attribute
      let el: Element | null = document.elementFromPoint(t.clientX, t.clientY);
      while (el && !el.getAttribute("data-alpha2")) el = el.parentElement;
      const alpha2 = el?.getAttribute("data-alpha2");
      const name   = el?.getAttribute("data-name") ?? "";
      if (alpha2) onClickRef.current(alpha2, name);
    };

    wrapper.addEventListener("touchstart", onTouchStart, { capture: true });
    wrapper.addEventListener("touchend",   onTouchEnd,   { capture: true });
    return () => {
      wrapper.removeEventListener("touchstart", onTouchStart, { capture: true });
      wrapper.removeEventListener("touchend",   onTouchEnd,   { capture: true });
    };
  }, []); // empty deps — callback accessed via ref

  // Track position in a ref so the RAF closure always reads the latest value
  const posRef = useRef<Position>({ coordinates: [10, 10], zoom: 1 });
  const animRef = useRef<number | null>(null);

  const setPos = useCallback((p: Position) => {
    posRef.current = p;
    setPosition(p);
  }, []);

  const handleMoveEnd = useCallback((pos: object) => {
    setPos(pos as Position);
  }, [setPos]);

  const correctCodes = Array.isArray(correctCode) ? correctCode : [correctCode];
  const primaryCode = correctCodes[0];

  const onRevealAnimationEndRef = useRef(onRevealAnimationEnd);
  useEffect(() => { onRevealAnimationEndRef.current = onRevealAnimationEnd; }, [onRevealAnimationEnd]);

  // Smooth fly-to animation on reveal
  useEffect(() => {
    if (!revealed || !zoomOnReveal) return;
    const c = COUNTRY_CENTERS[primaryCode];
    if (!c) return;

    if (animRef.current) cancelAnimationFrame(animRef.current);

    const from = { ...posRef.current };
    const to: Position = { coordinates: c.ll, zoom: Math.min(c.z, 5.5) };

    const easeOut   = (t: number) => 1 - Math.pow(1 - t, 3);
    const easeInOut = (t: number) => t < 0.5 ? 4*t*t*t : 1 - Math.pow(-2*t+2, 3)/2;

    // Check if target is within the current viewport (no arc needed)
    const dLon = Math.abs(to.coordinates[0] - from.coordinates[0]);
    const dLat = Math.abs(to.coordinates[1] - from.coordinates[1]);
    const isNearby = dLon < 250 / from.zoom && dLat < 140 / from.zoom;
    const useArc   = from.zoom > 1.3 && !isNearby;

    const duration = useArc ? 1500 : 1100;
    const start = performance.now();

    function tick(now: number) {
      const raw = Math.min((now - start) / duration, 1);
      const posE = useArc ? easeInOut(raw) : easeOut(raw);

      let zoom: number;
      if (useArc) {
        // Parabolic zoom arc: dips to minZoom at t=0.5, single continuous curve
        const minZoom = Math.max(1, Math.min(from.zoom, to.zoom) * 0.5);
        const baseZoom = from.zoom + (to.zoom - from.zoom) * posE;
        const midBase  = (from.zoom + to.zoom) / 2;
        zoom = baseZoom + 4 * raw * (1 - raw) * (minZoom - midBase);
      } else {
        zoom = from.zoom + (to.zoom - from.zoom) * posE;
      }

      setPos({
        coordinates: [
          from.coordinates[0] + (to.coordinates[0] - from.coordinates[0]) * posE,
          from.coordinates[1] + (to.coordinates[1] - from.coordinates[1]) * posE,
        ],
        zoom,
      });

      if (raw < 1) {
        animRef.current = requestAnimationFrame(tick);
      } else {
        onRevealAnimationEndRef.current?.();
      }
    }
    animRef.current = requestAnimationFrame(tick);

    return () => { if (animRef.current) cancelAnimationFrame(animRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [revealed]);

  function getFill(alpha2: string | undefined): string {
    if (revealed && alpha2 === primaryCode) return "#f97316";
    if (!revealed && pendingCode && alpha2 === pendingCode) return "#f59e0b";
    return (alpha2 && CONTINENT_COLOR[alpha2]) ?? C_DEFAULT;
  }

  const W = 800, H = 500;

  return (
    <div ref={wrapRef} style={{ width: "100%", height: "100%", position: "relative" }}>
      <ComposableMap
        width={W}
        height={H}
        projection="geoNaturalEarth1"
        projectionConfig={{ scale: 153, center: [10, 0] }}
        style={{ width: "100%", height: "100%", background: "#cde6f5" }}
      >
        <ZoomableGroup
          zoom={position.zoom}
          center={position.coordinates}
          onMoveEnd={handleMoveEnd}
          minZoom={1}
          maxZoom={8}
          translateExtent={[[-10, -10], [W + 10, H + 10]]}
        >
          <Geographies geography={GEO_URL}>
            {({ geographies }) =>
              geographies
                .filter(geo => String(geo.id) !== "010" && String(geo.id) !== "275")
                .map(geo => {
                  const id     = String(geo.id ?? "");
                  const geoName = geo.properties?.name ?? "";
                  const isSomaliland = geoName === "Somaliland";
                  const alpha2 = (id === PALESTINE_ID || id === ISRAEL_ID) ? "PS"
                               : isSomaliland ? "SO"
                               : N2A[id];
                  const name   = (id === PALESTINE_ID || id === ISRAEL_ID) ? "Palestine"
                               : id === "732" ? "Morocco"
                               : geoName;
                  const clickable   = !disabled && !revealed && !!alpha2;
                  const isHighlight = revealed && zoomOnReveal && alpha2 === primaryCode;
                  const fill        = getFill(alpha2);

                  return (
                    <Geography
                      key={geo.rsmKey}
                      geography={geo}
                      // data-* attributes are spread to the underlying <path> for touch hit-testing
                      data-alpha2={clickable ? alpha2 : undefined}
                      data-name={clickable ? name : undefined}
                      onMouseEnter={() => { if (alpha2) onCountryHover({ name, alpha2 }); }}
                      onMouseLeave={() => onCountryHover(null)}
                      onClick={() => { if (clickable) onCountryClick(alpha2!, name); }}
                      style={{
                        default:  { fill, stroke: "#fff", strokeWidth: isHighlight ? 1.2 : 0.4, outline: "none" },
                        hover:    { fill: clickable ? "#f59e0b" : fill, stroke: "#fff", strokeWidth: clickable ? 0.8 : isHighlight ? 1.2 : 0.4, outline: "none", cursor: clickable ? "pointer" : "default" },
                        pressed:  { fill: clickable ? "#d97706" : fill, stroke: "#fff", strokeWidth: 0.8, outline: "none" },
                      }}
                    />
                  );
                })
            }
          </Geographies>

          <Geographies geography={FRENCH_GUIANA_GEOJSON}>
            {({ geographies }) => geographies.map(geo => {
              const alpha2    = "GF";
              const name      = "French Guiana";
              const clickable = !disabled && !revealed;
              const fill      = getFill(alpha2);
              return (
                <Geography
                  key="french-guiana-overlay"
                  geography={geo}
                  data-alpha2={clickable ? alpha2 : undefined}
                  data-name={clickable ? name : undefined}
                  onMouseEnter={() => onCountryHover({ name, alpha2 })}
                  onMouseLeave={() => onCountryHover(null)}
                  onClick={() => { if (clickable) onCountryClick(alpha2, name); }}
                  style={{
                    default:  { fill, stroke: "#fff", strokeWidth: 0.4, outline: "none" },
                    hover:    { fill: clickable ? "#f59e0b" : fill, stroke: "#fff", strokeWidth: clickable ? 0.8 : 0.4, outline: "none", cursor: clickable ? "pointer" : "default" },
                    pressed:  { fill: clickable ? "#d97706" : fill, stroke: "#fff", strokeWidth: 0.8, outline: "none" },
                  }}
                />
              );
            })}
          </Geographies>
        </ZoomableGroup>
      </ComposableMap>

      <div className="fd-zoom-controls">
        <button className="fd-zoom-btn" onClick={() => setPosition(p => ({ ...p, zoom: Math.min(p.zoom * 1.6, 10) }))}>+</button>
        <button className="fd-zoom-btn" onClick={() => setPosition(p => ({ ...p, zoom: Math.max(p.zoom / 1.6, 1) }))}>−</button>
      </div>
    </div>
  );
});
