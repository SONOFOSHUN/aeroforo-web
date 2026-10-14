"use client";

import { useMemo, useState } from "react";
import { Database, Pause, Play, Zap } from "lucide-react";
import { useAir } from "@/hooks/useAirData";
import { LEVELS, valueOf } from "@/lib/air";
import type { MetricCode } from "@/lib/types";
import { AlertFeed } from "./AlertFeed";
import { AqiGauge } from "./AqiGauge";
import { MetricCard } from "./MetricCard";
import { Semaforo } from "./Semaforo";
import { TrendChart } from "./TrendChart";

export function LiveMonitor() {
  const { stations, metrics, history, live, selectedId, select, latest, paused, togglePause, triggerSpike, source, ready } = useAir();
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

  return (
    <section id="monitor" className="mx-auto w-full max-w-7xl scroll-mt-20 px-4 py-20 sm:px-6">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-medium uppercase tracking-widest text-accent">Monitor en vivo</p>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">Lecturas de los sensores</h2>
          <p className="mt-3 max-w-2xl text-muted">
            Elige una estación para ver su semáforo, el índice de calidad del aire y cada contaminante. Los valores se
            actualizan cada 3 segundos.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span
            className="inline-flex items-center gap-1.5 rounded-lg border border-line px-3 py-2 text-xs text-muted"
            title={source === "supabase" ? "Historial y estaciones cargados desde Supabase" : "Sin conexión a Supabase: datos generados en el navegador"}
          >
            <Database size={14} className={source === "supabase" ? "text-green" : "text-amber"} />
            {source === "supabase" ? "Supabase" : "Datos locales"} · simulación
          </span>
          <button onClick={togglePause} className="inline-flex items-center gap-1.5 rounded-lg border border-line px-3 py-2 text-sm hover:border-accent/40">
            {paused ? <Play size={14} /> : <Pause size={14} />}
            {paused ? "Reanudar" : "Pausar"}
          </button>
          <button
            onClick={() => triggerSpike(station.id)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-red/40 bg-red/10 px-3 py-2 text-sm text-red hover:bg-red/20"
          >
            <Zap size={14} /> Simular pico de contaminación
          </button>
        </div>
      </div>

      <div className="mt-8 flex gap-2 overflow-x-auto pb-2" role="tablist" aria-label="Estaciones">
        {stations.map((s) => {
          const l = latest(s.id)?.level;
          const on = s.id === station.id;
          return (
            <button
              key={s.id}
              role="tab"
              aria-selected={on}
              onClick={() => select(s.id)}
              className={`flex shrink-0 items-center gap-2 rounded-xl border px-3.5 py-2 text-sm transition ${
                on ? "border-accent/60 bg-accent/10 text-text" : "border-line bg-surface text-muted hover:text-text"
              }`}
            >
              <span className="h-2 w-2 rounded-full" style={{ background: l ? LEVELS[l].color : "#475569" }} />
              {s.district}
            </button>
          );
        })}
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-[320px_1fr]">
        <div className="card flex flex-col items-center p-6 text-center">
          <p className="text-xs uppercase tracking-widest text-muted">{station.code}</p>
          <p className="mt-1 font-medium">{station.name}</p>
          <div className="mt-6 flex items-center gap-6">
            <Semaforo level={r?.level ?? null} />
            <div className="w-44">{r && <AqiGauge aqi={r.aqi} level={r.level} />}</div>
          </div>
          {r ? (
            <>
              <p className="mt-4 text-lg font-semibold" style={{ color: LEVELS[r.level].color }}>
                {LEVELS[r.level].short}
              </p>
              <p className="mt-2 text-sm leading-relaxed text-muted">{LEVELS[r.level].detail}</p>
            </>
          ) : (
            <p className="mt-6 text-sm text-muted">{ready ? "Estación sin datos" : "Cargando lecturas…"}</p>
          )}
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
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

      <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_380px]">
        <div className="card p-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="font-medium">
                {metric.name} <span className="text-muted">· {metric.unit}</span>
              </h3>
              <p className="text-xs text-muted">{metric.description}</p>
            </div>
            <div className="flex rounded-lg border border-line p-0.5 text-xs" role="group" aria-label="Rango">
              {(["live", "24h"] as const).map((k) => (
                <button
                  key={k}
                  onClick={() => setRange(k)}
                  aria-pressed={range === k}
                  className={`rounded-md px-3 py-1.5 ${range === k ? "bg-accent/15 text-accent" : "text-muted hover:text-text"}`}
                >
                  {k === "live" ? "En vivo" : "Últimas 24 h"}
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
