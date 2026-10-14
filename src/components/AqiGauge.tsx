import { LEVELS } from "@/lib/air";
import type { Level } from "@/lib/types";

const MAX = 200;
const R = 80;
const CX = 100;
const CY = 100;

function point(v: number, r = R) {
  const a = Math.PI * (1 - Math.min(v, MAX) / MAX);
  return [CX + r * Math.cos(a), CY - r * Math.sin(a)];
}

function arc(from: number, to: number) {
  const [x1, y1] = point(from);
  const [x2, y2] = point(to);
  return `M ${x1} ${y1} A ${R} ${R} 0 0 1 ${x2} ${y2}`;
}

/** Medidor semicircular del Índice de Calidad del Aire (ICA). */
export function AqiGauge({ aqi, level }: { aqi: number; level: Level }) {
  const [nx, ny] = point(aqi, R - 18);
  return (
    <svg viewBox="0 0 200 120" className="w-full max-w-[260px]" role="img" aria-label={`ICA ${aqi}`}>
      <path d={arc(0, 50)} stroke={LEVELS.verde.color} strokeWidth="12" fill="none" strokeLinecap="round" opacity="0.9" />
      <path d={arc(52, 100)} stroke={LEVELS.amarillo.color} strokeWidth="12" fill="none" opacity="0.9" />
      <path d={arc(102, MAX)} stroke={LEVELS.rojo.color} strokeWidth="12" fill="none" strokeLinecap="round" opacity="0.9" />
      <line
        x1={CX}
        y1={CY}
        x2={nx}
        y2={ny}
        stroke="#e6edf7"
        strokeWidth="3"
        strokeLinecap="round"
        style={{ transition: "all 0.8s cubic-bezier(.2,.8,.2,1)" }}
      />
      <circle cx={CX} cy={CY} r="6" fill="#e6edf7" />
      <text x={CX} y={CY - 26} textAnchor="middle" className="fill-[var(--text)] font-mono" fontSize="28" fontWeight="600">
        {aqi}
      </text>
      <text x={CX} y={CY + 16} textAnchor="middle" fill={LEVELS[level].color} fontSize="11" fontWeight="600" letterSpacing="1.5">
        {LEVELS[level].label.toUpperCase()}
      </text>
      <text x="14" y="116" fontSize="8" className="fill-[var(--muted)]">0</text>
      <text x="180" y="116" fontSize="8" className="fill-[var(--muted)]">200+</text>
    </svg>
  );
}
