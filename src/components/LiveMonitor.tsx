"use client";

import { useMemo, useState } from "react";
import { Database, Pause, Play, Zap } from "lucide-react";
import { useAir } from "@/hooks/useAirData";
import { LEVELS, RECOMMENDATIONS, valueOf } from "@/lib/air";
import type { MetricCode } from "@/lib/types";
import { AlertFeed } from "./AlertFeed";
import { AqiGauge } from "./AqiGauge";
import { LevelAlerts } from "./LevelAlerts";
import { MetricCard } from "./MetricCard";
import { Semaforo } from "./Semaforo";
import { StationSelect } from "./StationSelect";
import { TrendChart } from "./TrendChart";

export function LiveMonitor() {
  const { stations, metrics, history, live, selectedId, latest, paused, togglePause, triggerSpike, source, ready } = useAir();
  const [metricCode, setMetricCode] = useState<MetricCode>("pm25");
  const [range, setRange] = useState<"live" | "24h">("live");

  const station = stations.find((s) => s.id === selectedId) ?? stations[0];
  const r = latest(station.id);
  const liveSeries = useMemo(() => live[station.id] ?? [], [live, station.id]);
  const chartData = useMemo(
    () => (range === "live" ? liveSeries : [...(history[station.id] ?? []), ...liveSeries]),
    [range, liveSeries, history, station.id],
  );
  const metric = metrics.find((m) => m.code === metricCode) ?? metrics[0];
  const info = r ? LEVELS[r.level] : null;

  return (
    <section id="monitor" className="mx-auto w-full max-w-6xl scroll-mt-20 px-4 py-20 sm:px-6">
      <div className="flex flex-col gap-6">
        <div>
          <p className="eyebrow">Monitor en vivo</p>
          <h2 className="heading mt-3 text-3xl font-semibold sm:text-[40px]">Lecturas de los sensores</h2>
          <p className="mt-3 max-w-xl text-muted">
            Se actualiza cada 3 segundos. Cuando el semáforo cambia de color, aparece un aviso con lo que conviene hacer.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <StationSelect />
          <LevelAlerts />
          <button
            onClick={togglePause}
            className="pressable inline-flex h-9 items-center gap-1.5 rounded-full border border-line-strong bg-surface px-3.5 text-sm font-medium hover:bg-surface-2"
          >
            {paused ? <Play size={14} /> : <Pause size={14} />}
            {paused ? "Reanudar" : "Pausar"}
          </button>
          <button
            onClick={() => triggerSpike(station.id)}
            className="pressable inline-flex h-9 items-center gap-1.5 rounded-full bg-red px-3.5 text-sm font-medium text-white hover:bg-red/90"
          >
            <Zap size={14} /> Simular pico
          </button>
        </div>
      </div>

      <div className="mt-8 grid gap-4 lg:grid-cols-[340px_1fr]">
        <div className="card level-transition flex flex-col p-6" style={info ? { background: `linear-gradient(180deg, ${info.soft}, #fff 65%)` } : undefined}>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold">{station.district}</p>
              <p className="text-sm text-muted">
                {station.code} · {station.name}
              </p>
            </div>
            <span
              className="inline-flex items-center gap-1.5 rounded-full border border-line bg-white/70 px-2.5 py-1 text-[11px] text-muted"
              title={source === "supabase" ? "Historial y estaciones desde Supabase" : "Sin conexión a Supabase: datos generados en el navegador"}
            >
              <Database size={12} className={source === "supabase" ? "text-green" : "text-amber"} />
              {source === "supabase" ? "Supabase" : "Local"}
            </span>
          </div>
          <div className="mt-6 flex items-center gap-5">
            <Semaforo level={r?.level ?? null} size="md" />
            <div className="flex-1">{r && <AqiGauge aqi={r.aqi} level={r.level} />}</div>
          </div>
          {r && info ? (
            <>
              <p className="level-transition mt-4 text-lg font-semibold" style={{ color: info.ink }}>
                {info.label} · {info.short}
              </p>
              <p className="mt-1 text-sm leading-relaxed text-muted">{info.detail}</p>
              <ul className="mt-4 space-y-2 border-t border-line pt-4 text-sm">
                {RECOMMENDATIONS[r.level].slice(0, 3).map((t) => (
                  <li key={t} className="flex gap-2.5 leading-snug">
                    <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: info.color }} />
                    {t}
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <p className="mt-6 text-sm text-muted">{ready ? "Estación sin datos" : "Cargando lecturas…"}</p>
          )}
        </div>
        <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-3">
          {metrics.map((m) => (
            <MetricCard
              key={m.code}
              metric={m}
              value={r ? valueOf(r, m.code) : undefined}
              series={liveSeries.slice(-40).map((x) => valueOf(x, m.code))}
              active={m.code === metricCode}
              onSelect={() => setMetricCode(m.code)}
            />
          ))}
        </div>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_360px]">
        <div className="card p-5 sm:p-6">
          <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
            <div>
              <h3 className="font-semibold">
                {metric.name} <span className="font-normal text-muted">· {metric.unit}</span>
              </h3>
              <p className="mt-0.5 text-sm text-muted">{metric.description}</p>
            </div>
            <div className="flex rounded-full bg-black/[0.05] p-0.5 text-[13px]" role="group" aria-label="Rango">
              {(["live", "24h"] as const).map((k) => (
                <button
                  key={k}
                  onClick={() => setRange(k)}
                  aria-pressed={range === k}
                  className={`pressable rounded-full px-3.5 py-1.5 font-medium ${range === k ? "bg-white text-text shadow-sm" : "text-muted hover:text-text"}`}
                >
                  {k === "live" ? "En vivo" : "24 horas"}
                </button>
              ))}
            </div>
          </div>
          <TrendChart metric={metric} readings={chartData} live={range === "live"} />
        </div>
        <AlertFeed />
      </div>
    </section>
  );
}
