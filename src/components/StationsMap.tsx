"use client";

import { useAir } from "@/hooks/useAirData";
import { LEVELS } from "@/lib/air";

// Recorte de Lima Metropolitana para proyectar lat/lng en el SVG.
const BOUNDS = { minLat: -12.16, maxLat: -11.95, minLng: -77.09, maxLng: -76.89 };
const W = 520;
const H = 520;
const project = (lat: number, lng: number) => [
  ((lng - BOUNDS.minLng) / (BOUNDS.maxLng - BOUNDS.minLng)) * W,
  ((BOUNDS.maxLat - lat) / (BOUNDS.maxLat - BOUNDS.minLat)) * H,
];

export function StationsMap() {
  const { stations, latest, selectedId, select } = useAir();

  return (
    <section id="estaciones" className="mx-auto w-full max-w-7xl scroll-mt-20 px-4 py-20 sm:px-6">
      <p className="text-sm font-medium uppercase tracking-widest text-accent">Red de estaciones</p>
      <h2 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">Lima, punto por punto</h2>
      <p className="mt-3 max-w-2xl text-muted">
        Cada Aeróforo se instala en una zona con tránsito o actividad distinta. Toca una estación para verla en el monitor.
      </p>

      <div className="mt-10 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="card relative overflow-hidden p-4">
          <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label="Mapa de estaciones en Lima">
            <defs>
              <pattern id="dots" width="16" height="16" patternUnits="userSpaceOnUse">
                <circle cx="2" cy="2" r="1" fill="rgba(148,163,184,0.18)" />
              </pattern>
            </defs>
            {/* Tierra y litoral estilizado */}
            <path d={`M 150 0 L ${W} 0 L ${W} ${H} L 120 ${H} C 140 440 70 400 95 330 C 120 270 40 230 70 170 C 95 120 130 60 150 0 Z`} fill="url(#dots)" />
            <path d="M 150 0 C 130 60 95 120 70 170 C 40 230 120 270 95 330 C 70 400 140 440 120 520" stroke="rgba(34,211,238,0.35)" strokeWidth="2" fill="none" />
            <text x="24" y="300" fill="rgba(139,154,179,0.6)" fontSize="12" letterSpacing="3">OCÉANO PACÍFICO</text>
            {/* Río Rímac */}
            <path d="M 160 225 C 260 220 330 205 400 180 C 450 165 490 160 520 150" stroke="rgba(34,211,238,0.25)" strokeWidth="3" fill="none" strokeDasharray="6 6" />
            <text x="250" y="238" fill="rgba(139,154,179,0.6)" fontSize="10">Río Rímac</text>
            {stations.map((s) => {
              const [x, y] = project(s.lat, s.lng);
              const l = latest(s.id)?.level;
              const c = l ? LEVELS[l].color : "#475569";
              const on = s.id === selectedId;
              return (
                <g key={s.id} onClick={() => select(s.id)} className="cursor-pointer" role="button" aria-label={`${s.name}, ${s.district}`}>
                  <circle cx={x} cy={y} r={on ? 34 : 24} fill={c} opacity="0.12" style={{ transition: "all .5s" }} />
                  <circle cx={x} cy={y} r="9" fill={c} stroke="#060a13" strokeWidth="3" style={{ transition: "fill .5s" }} />
                  <text x={x + 16} y={y + 4} fill={on ? "#e6edf7" : "#8b9ab3"} fontSize="13" fontWeight={on ? 600 : 400}>
                    {s.district}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        <ul className="space-y-2">
          {stations.map((s) => {
            const r = latest(s.id);
            const on = s.id === selectedId;
            return (
              <li key={s.id}>
                <a
                  href="#monitor"
                  onClick={() => select(s.id)}
                  className={`card flex items-center gap-4 p-4 transition hover:border-accent/40 ${on ? "ring-1 ring-accent/60" : ""}`}
                >
                  <span className="h-3 w-3 shrink-0 rounded-full" style={{ background: r ? LEVELS[r.level].color : "#475569" }} />
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">{s.district}</p>
                    <p className="truncate text-xs text-muted">
                      {s.code} · {s.name}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-mono text-xl font-semibold tabular-nums">{r?.aqi ?? "—"}</p>
                    <p className="text-[11px] text-muted">ICA</p>
                  </div>
                </a>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
