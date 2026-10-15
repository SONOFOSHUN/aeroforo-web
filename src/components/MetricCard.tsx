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
  const color = level ? LEVELS[level].color : "#0f766e";
  const prev = series.length > 1 ? series[series.length - 2] : undefined;
  const trend = value != null && prev != null ? value - prev : 0;
  return (
    <button
      onClick={onSelect}
      aria-pressed={active}
      className={`card pressable hover-lift flex flex-col p-4 text-left ${active ? "!border-ink/70 ring-1 ring-ink/70" : ""}`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-medium">{metric.name}</span>
        {level ? (
          <span className="level-transition rounded-full px-2 py-0.5 text-[11px] font-medium" style={{ color: LEVELS[level].ink, background: LEVELS[level].soft }}>
            {LEVELS[level].label}
          </span>
        ) : (
          <span className="text-[11px] text-faint">Ambiente</span>
        )}
      </div>
      <div className="mt-3 flex items-baseline gap-1">
        <span key={value} className="tick text-[28px] font-semibold tracking-tight tabular sm:text-[32px]">
          {value != null ? formatValue(metric.code, value) : "—"}
        </span>
        <span className="text-[13px] text-muted">{metric.unit}</span>
      </div>
      <p className={`h-4 text-[12px] tabular ${trend > 0 ? "text-amber" : "text-green"}`}>
        {trend !== 0 && `${trend > 0 ? "↑" : "↓"} ${formatValue(metric.code, Math.abs(trend))}`}
      </p>
      <div className="mt-2">
        <Sparkline values={series} color={color} />
      </div>
      <p className="mt-2 hidden text-[11px] text-faint sm:block">{metric.sensor_model}</p>
    </button>
  );
}
