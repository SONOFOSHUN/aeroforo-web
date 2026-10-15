"use client";

import { ArrowRight } from "lucide-react";
import { useAir } from "@/hooks/useAirData";
import { LEVELS, LEVEL_ORDER, ZONES, formatValue, overallLevel, timeFmt, valueOf, worst } from "@/lib/air";
import type { Level } from "@/lib/types";
import { Semaforo } from "./Semaforo";
import { StationSelect } from "./StationSelect";

export function Hero() {
  const { stations, metrics, selectedId, latest, ready } = useAir();
  const station = stations.find((s) => s.id === selectedId) ?? stations[0];
  const r = latest(station.id);
  const level = r?.level ?? null;
  const info = level ? LEVELS[level] : null;
  const driver = r ? overallLevel(r, metrics).driver : "pm25";
  const driverMetric = metrics.find((m) => m.code === driver);

  // Peor nivel actual por zona de Lima Metropolitana
  const zoneLevels = ZONES.map((z) => {
    const ls = stations
      .filter((s) => s.zone === z)
      .map((s) => latest(s.id)?.level)
      .filter(Boolean) as Level[];
    return { zone: z, level: ls.length ? ls.reduce(worst) : null, count: ls.length };
  });
  const counts = LEVEL_ORDER.map((l) => stations.filter((s) => latest(s.id)?.level === l).length);

  return (
    <section id="inicio" className="relative pt-16">
      <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 pb-16 pt-14 sm:px-6 md:pt-20 lg:grid-cols-[1.05fr_0.95fr] lg:gap-14">
        <div>
          <p className="eyebrow">Proyecto de innovación · Tecsup 2026</p>
          <h1 className="display mt-4 text-[42px] font-semibold sm:text-6xl lg:text-[56px] xl:text-[64px]">
            Respira informado.
            <span className="block text-muted">Lima, en un semáforo.</span>
          </h1>
          <p className="mt-6 max-w-lg text-[17px] leading-relaxed text-muted">
            Aeróforo mide PM2.5, PM10, CO₂ y monóxido de carbono en {stations.length} puntos de Lima Metropolitana.
            Cuando el aire cambia, el semáforo cambia de color y te avisa qué hacer.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a href="#monitor" className="pressable inline-flex h-11 items-center gap-2 rounded-full bg-ink px-5 text-[15px] font-medium text-white hover:bg-ink/90">
              Ver monitor en vivo <ArrowRight size={16} />
            </a>
            <a href="#como-funciona" className="pressable inline-flex h-11 items-center rounded-full border border-line-strong bg-surface px-5 text-[15px] font-medium hover:bg-surface-2">
              Cómo funciona
            </a>
          </div>

          <div className="mt-12">
            <div className="flex items-baseline justify-between gap-4">
              <p className="eyebrow">Lima Metropolitana ahora</p>
              <p className="text-xs text-muted tabular">
                {counts[0]} bueno · {counts[1]} moderado · {counts[2]} dañino
              </p>
            </div>
            <ul className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-5">
              {zoneLevels.map(({ zone, level: l }) => (
                <li key={zone} className="level-transition rounded-xl border border-line bg-surface px-3 py-2.5" style={l ? { background: LEVELS[l].soft, borderColor: "transparent" } : undefined}>
                  <p className="text-[12px] text-muted">{zone.replace("Lima ", "")}</p>
                  <p className="mt-0.5 flex items-center gap-1.5 text-sm font-medium" style={l ? { color: LEVELS[l].ink } : undefined}>
                    <span className="h-2 w-2 rounded-full" style={{ background: l ? LEVELS[l].color : "var(--faint)" }} />
                    {l ? LEVELS[l].label : "—"}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div
          className="level-transition relative overflow-hidden rounded-[28px] border border-line p-5 shadow-[var(--shadow-float)] sm:p-7"
          style={{ background: info ? `linear-gradient(160deg, #fff 0%, ${info.soft} 70%)` : "#fff" }}
        >
          <div className="flex items-center justify-between gap-3">
            <StationSelect />
            <span className="text-xs text-muted tabular">{r ? `Actualizado ${timeFmt.format(new Date(r.recorded_at))}` : "Conectando…"}</span>
          </div>

          <div className="mt-8 flex items-center gap-6 sm:gap-10">
            <Semaforo level={level} size="lg" />
            <div className="min-w-0">
              <p className="text-sm text-muted">
                {station.name} · {station.zone}
              </p>
              <p className="display mt-1 text-[88px] font-semibold tabular sm:text-[112px]" style={{ letterSpacing: "-0.05em" }}>
                {ready && r ? r.aqi : "—"}
              </p>
              <p className="level-transition -mt-1 text-xl font-semibold sm:text-2xl" style={{ color: info?.ink }}>
                {info ? info.label : "Conectando…"}
              </p>
              {r && driverMetric && (
                <p className="mt-2 text-sm text-muted">
                  Índice de calidad del aire · principal {driverMetric.name}{" "}
                  <span className="tabular text-text">
                    {formatValue(driver, valueOf(r, driver))} {driverMetric.unit}
                  </span>
                </p>
              )}
            </div>
          </div>

          {info && (
            <p className="mt-8 rounded-2xl bg-white/80 px-4 py-3 text-[15px] leading-snug backdrop-blur">
              {info.advice}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
