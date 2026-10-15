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
  const [x, y] = point(aqi);
  return (
    <svg viewBox="0 0 200 116" className="w-full" role="img" aria-label={`ICA ${aqi}, ${LEVELS[level].label}`}>
      <path d={arc(0, 49)} stroke={LEVELS.verde.color} strokeWidth="10" fill="none" strokeLinecap="round" />
      <path d={arc(53, 98)} stroke={LEVELS.amarillo.color} strokeWidth="10" fill="none" />
      <path d={arc(102, MAX)} stroke={LEVELS.rojo.color} strokeWidth="10" fill="none" strokeLinecap="round" />
      <circle
        cx={x}
        cy={y}
        r="9"
        strokeWidth="3"
        style={{ fill: "var(--surface)", stroke: "var(--text)", transition: "cx 700ms var(--ease-in-out), cy 700ms var(--ease-in-out)" }}
      />
      <text x={CX} y={CY - 8} textAnchor="middle" fontSize="40" fontWeight="600" letterSpacing="-1.5" className="tabular" style={{ fill: "var(--text)" }}>
        {aqi}
      </text>
      <text x={CX} y={CY + 12} textAnchor="middle" fontSize="10" fontWeight="500" letterSpacing="1" style={{ fill: "var(--muted)" }}>
        ICA
      </text>
    </svg>
  );
}
