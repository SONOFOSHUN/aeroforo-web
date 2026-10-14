"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { DEFAULT_METRICS, DEFAULT_STATIONS, LEVELS, overallLevel, formatValue, valueOf } from "@/lib/air";
import { forceEvent, generateHistory, nextReading } from "@/lib/simulator";
import { supabase } from "@/lib/supabase";
import type { Alert, DataSource, Metric, Reading, Station } from "@/lib/types";

const TICK_MS = 3000;
const LIVE_POINTS = 60;
const MAX_ALERTS = 40;

interface AirState {
  ready: boolean;
  source: DataSource;
  stations: Station[];
  metrics: Metric[];
  history: Record<number, Reading[]>;
  live: Record<number, Reading[]>;
  alerts: Alert[];
  lastUpdate: Date | null;
}

interface AirContextValue extends AirState {
  selectedId: number;
  select: (id: number) => void;
  latest: (stationId: number) => Reading | undefined;
  paused: boolean;
  togglePause: () => void;
  triggerSpike: (stationId: number) => void;
}

const AirContext = createContext<AirContextValue | null>(null);

async function loadFromSupabase(): Promise<Omit<AirState, "ready" | "live" | "lastUpdate"> | null> {
  if (!supabase) return null;
  const since = new Date(Date.now() - 24 * 3600_000).toISOString();
  const [st, me, rd, al] = await Promise.all([
    supabase.from("stations").select("*").order("id"),
    supabase.from("metrics").select("*").order("sort_order"),
    supabase.from("readings").select("*").gte("recorded_at", since).order("recorded_at").limit(5000),
    supabase.from("alerts").select("*").order("created_at", { ascending: false }).limit(MAX_ALERTS),
  ]);
  if (st.error || me.error || rd.error || al.error || !st.data?.length) return null;

  const history: Record<number, Reading[]> = {};
  for (const r of rd.data as Reading[]) (history[r.station_id] ??= []).push(r);
  return {
    source: "supabase",
    stations: st.data as Station[],
    metrics: me.data as Metric[],
    history,
    alerts: al.data as Alert[],
  };
}

function loadLocal(): Omit<AirState, "ready" | "live" | "lastUpdate"> {
  const history: Record<number, Reading[]> = {};
  for (const s of DEFAULT_STATIONS) history[s.id] = generateHistory(s, DEFAULT_METRICS);
  return { source: "local", stations: DEFAULT_STATIONS, metrics: DEFAULT_METRICS, history, alerts: [] };
}

function alertFor(station: Station, reading: Reading, metrics: Metric[]): Alert {
  const { driver } = overallLevel(reading, metrics);
  const metric = metrics.find((m) => m.code === driver)!;
  const value = valueOf(reading, driver);
  const messages = {
    rojo: `${metric.name} en ${formatValue(driver, value)} ${metric.unit}. ${LEVELS.rojo.advice}`,
    amarillo: `${metric.name} subió a ${formatValue(driver, value)} ${metric.unit}. Grupos sensibles deben tomar precauciones.`,
    verde: "La calidad del aire volvió a niveles buenos.",
  };
  return {
    id: `live-${station.id}-${reading.recorded_at}`,
    station_id: station.id,
    created_at: reading.recorded_at,
    level: reading.level,
    metric: driver,
    value,
    message: messages[reading.level],
  };
}

export function AirProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AirState>({
    ready: false,
    source: "local",
    stations: DEFAULT_STATIONS,
    metrics: DEFAULT_METRICS,
    history: {},
    live: {},
    alerts: [],
    lastUpdate: null,
  });
  const [selectedId, setSelectedId] = useState(1);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      let data = null;
      try {
        data = await loadFromSupabase();
      } catch {
        data = null;
      }
      if (cancelled) return;
      const base = data ?? loadLocal();
      // Rellena el tramo "en vivo" desde la última lectura guardada hasta ahora,
      // para que la gráfica arranque con datos y sin huecos.
      const live: Record<number, Reading[]> = {};
      const now = Date.now();
      for (const s of base.stations) {
        const h = base.history[s.id];
        if (!h?.length) continue;
        let prev = h[h.length - 1];
        const series: Reading[] = [];
        for (let t = now - (LIVE_POINTS / 2) * TICK_MS; t <= now; t += TICK_MS) {
          prev = nextReading(s, prev, base.metrics, new Date(t));
          series.push(prev);
        }
        live[s.id] = series;
      }
      setState({ ...base, ready: true, live, lastUpdate: new Date() });
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!state.ready || paused) return;
    const id = setInterval(() => {
      setState((prev) => {
        const now = new Date();
        const live = { ...prev.live };
        const newAlerts: Alert[] = [];
        for (const s of prev.stations) {
          const series = live[s.id];
          if (!s.is_online || !series?.length) continue;
          const last = series[series.length - 1];
          const next = nextReading(s, last, prev.metrics, now);
          live[s.id] = [...series, next].slice(-LIVE_POINTS);
          if (next.level !== last.level) newAlerts.push(alertFor(s, next, prev.metrics));
        }
        return {
          ...prev,
          live,
          alerts: newAlerts.length ? [...newAlerts, ...prev.alerts].slice(0, MAX_ALERTS) : prev.alerts,
          lastUpdate: now,
        };
      });
    }, TICK_MS);
    return () => clearInterval(id);
  }, [state.ready, paused]);

  const latest = useCallback(
    (stationId: number) => {
      const l = state.live[stationId];
      if (l?.length) return l[l.length - 1];
      const h = state.history[stationId];
      return h?.[h.length - 1];
    },
    [state.live, state.history],
  );

  const triggerSpike = useCallback(
    (stationId: number) => {
      const s = state.stations.find((x) => x.id === stationId);
      if (s) forceEvent(s);
      setPaused(false);
    },
    [state.stations],
  );

  const value = useMemo<AirContextValue>(
    () => ({
      ...state,
      selectedId,
      select: setSelectedId,
      latest,
      paused,
      togglePause: () => setPaused((p) => !p),
      triggerSpike,
    }),
    [state, selectedId, latest, paused, triggerSpike],
  );

  return <AirContext.Provider value={value}>{children}</AirContext.Provider>;
}

export function useAir() {
  const ctx = useContext(AirContext);
  if (!ctx) throw new Error("useAir debe usarse dentro de <AirProvider>");
  return ctx;
}
