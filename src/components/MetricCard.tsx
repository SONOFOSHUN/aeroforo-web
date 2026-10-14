import { LEVELS, formatValue, levelFor } from "@/lib/air";
import type { Metric } from "@/lib/types";
import { Sparkline } from "./Sparkline";

export function MetricCard({
  metric,
  value,
  series,
  active,
  onSelect,
}: {
  metric: Metric;
  value: number | undefined;
  series: number[];
  active: boolean;
  onSelect: () => void;
}) {
  const level = value != null ? levelFor(metric, value) : null;
  const color = level ? LEVELS[level].color : "#22d3ee";
  const prev = series.length > 1 ? series[series.length - 2] : undefined;
  const trend = value != null && prev != null ? value - prev : 0;
  return (
    <button
      onClick={onSelect}
      aria-pressed={active}
      className={`card group flex flex-col p-4 text-left transition hover:border-accent/40 ${active ? "ring-1 ring-accent/60" : ""}`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-medium">{metric.name}</span>
        {level ? (
          <span className="rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider" style={{ color, background: LEVELS[level].soft }}>
            {LEVELS[level].label}
          </span>
        ) : (
          <span className="text-[10px] uppercase tracking-wider text-muted">Ambiente</span>
        )}
      </div>
      <div className="mt-2 flex items-baseline gap-1.5">
        <span key={value} className="flash rounded font-mono text-3xl font-semibold tabular-nums">
          {value != null ? formatValue(metric.code, value) : "—"}
        </span>
        <span className="text-sm text-muted">{metric.unit}</span>
        {trend !== 0 && (
          <span className={`ml-auto font-mono text-xs ${trend > 0 ? "text-amber" : "text-green"}`}>
            {trend > 0 ? "▲" : "▼"} {formatValue(metric.code, Math.abs(trend))}
          </span>
        )}
      </div>
      <div className="mt-3">
        <Sparkline values={series} color={color} />
      </div>
      <p className="mt-2 text-[11px] text-muted">Sensor {metric.sensor_model}</p>
    </button>
  );
}
