"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Database, Pause, Play, Star, Zap } from "lucide-react";
import { useAir } from "@/hooks/useAirData";
import { LEVELS, RECOMMENDATIONS, valueOf } from "@/lib/air";
import { useFavorites } from "@/lib/favorites";
import type { MetricCode } from "@/lib/types";
import { AlertFeed } from "./AlertFeed";
import { AqiGauge } from "./AqiGauge";
import { FavoriteButton } from "./FavoriteButton";
import { LevelAlerts } from "./LevelAlerts";
import { MetricCard } from "./MetricCard";
import { Semaforo } from "./Semaforo";
import { StationSelect } from "./StationSelect";
import { TrendChart } from "./TrendChart";

export function LiveMonitor() {
  const { stations, metrics, history, live, selectedId, select, latest, paused, togglePause, triggerSpike, source, ready } = useAir();
  const favorites = useFavorites();
  const [metricCode, setMetricCode] = useState<MetricCode>("pm25");
  const [range, setRange] = useState<"live" | "24h">("live");

  // Al volver a la web, se abre directamente tu primer distrito favorito
  const booted = useRef(false);
  useEffect(() => {
    if (booted.current || !ready) return;
    booted.current = true;
    if (favorites.length && !favorites.includes(selectedId)) select(favorites[0]);
  }, [ready, favorites, selectedId, select]);
  const favStations = stations.filter((s) => favorites.includes(s.id));

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

      <div className="mt-6 rounded-[20px] border border-line bg-surface/60 p-3">
        <div className="flex items-center gap-2 px-1 pb-2">
          <Star size={14} className="fill-amber text-amber" />
          <p className="text-sm font-medium">Mis distritos</p>
          <p className="ml-auto hidden text-xs text-faint sm:block">Se guardan en este navegador · también te avisamos cuando cambian</p>
        </div>
        {favStations.length === 0 ? (
          <p className="px-1 pb-1 text-sm text-muted">
            Toca la estrella <Star size={13} className="inline -translate-y-px text-faint" /> de un distrito para tenerlo siempre a mano.
          </p>
        ) : (
          <ul className="flex gap-2 overflow-x-auto pb-1">
            {favStations.map((s) => {
              const fr = latest(s.id);
              const on = s.id === station.id;
              return (
                <li key={s.id} className="shrink-0">
                  <button
                    onClick={() => select(s.id)}
                    aria-pressed={on}
                    className={`pressable flex items-center gap-2.5 rounded-xl border px-3 py-2 text-left ${
                      on ? "border-ink/60 bg-surface shadow-sm" : "border-line bg-surface hover:border-line-strong"
                    }`}
                  >
                    <span className="h-2.5 w-2.5 rounded-full" style={{ background: fr ? LEVELS[fr.level].color : "var(--faint)" }} />
                    <span className="text-sm font-medium">{s.district}</span>
                    <span className="text-sm text-muted tabular">{fr?.aqi ?? "—"}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[340px_1fr]">
        <div className="card level-transition flex flex-col p-6" style={info ? { background: `linear-gradient(180deg, ${info.soft}, var(--surface) 65%)` } : undefined}>
          <div className="flex items-center justify-between gap-2">
            <FavoriteButton stationId={station.id} district={station.district} className="-ml-2" />
            <div className="min-w-0 flex-1">
              <p className="font-semibold">{station.district}</p>
              <p className="text-sm text-muted">
                {station.code} · {station.name}
              </p>
            </div>
            <span
              className="inline-flex items-center gap-1.5 rounded-full border border-line bg-glass px-2.5 py-1 text-[11px] text-muted"
              title={source === "supabase" ? "Historial y estaciones desde Supabase" : "Sin conexión a Supabase: datos generados en el navegador"}
            >
              <Database size={12} className={source === "supabase" ? "text-green" : "text-amber"} />
              {source === "supabase" ? "Supabase" : "Local"}
            </span>
          </div>
          <div className="mt-6 flex items-center gap-5">
            <Semaforo level={r?.level ?? null} size="md" interactive />
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
            <div className="flex rounded-full bg-hover-strong p-0.5 text-[13px]" role="group" aria-label="Rango">
              {(["live", "24h"] as const).map((k) => (
                <button
                  key={k}
                  onClick={() => setRange(k)}
                  aria-pressed={range === k}
                  className={`pressable rounded-full px-3.5 py-1.5 font-medium ${range === k ? "bg-surface text-text shadow-sm" : "text-muted hover:text-text"}`}
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
