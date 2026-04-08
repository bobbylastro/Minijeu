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
  correctCode: string;
  clickedCode: string | null;
  pendingCode?: string | null;
  revealed: boolean;
  disabled: boolean;
  onCountryClick: (alpha2: string, name: string) => void;
  onCountryHover: (info: { name: string; alpha2: string } | null) => void;
}

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

  const handleMoveEnd = useCallback((pos: object) => {
    setPosition(pos as Position);
  }, []);

  function getFill(alpha2: string | undefined): string {
    if (revealed) {
      if (alpha2 === correctCode)                return "#22c55e";
      if (clickedCode && alpha2 === clickedCode) return "#ef4444";
    }
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
                  const clickable = !disabled && !revealed && !!alpha2;
                  const fill   = getFill(alpha2);

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
                        default:  { fill, stroke: "#fff", strokeWidth: 0.4, outline: "none" },
                        hover:    { fill: clickable ? "#f59e0b" : fill, stroke: "#fff", strokeWidth: clickable ? 0.8 : 0.4, outline: "none", cursor: clickable ? "pointer" : "default" },
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
