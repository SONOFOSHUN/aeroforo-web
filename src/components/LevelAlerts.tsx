"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Bell, BellRing, Check, X } from "lucide-react";
import { useAir } from "@/hooks/useAirData";
import { LEVELS, LEVEL_ORDER, RECOMMENDATIONS, formatValue, overallLevel, valueOf } from "@/lib/air";
import type { Level, Metric, Reading, Station } from "@/lib/types";
import { Semaforo } from "./Semaforo";

/** Lecturas seguidas en el nuevo nivel antes de avisar (evita avisos por un valor aislado). */
const CONFIRM_TICKS = 2;
/** Tiempo mínimo entre avisos que no son rojos, para no saturar cuando el aire ronda un límite. */
const COOLDOWN_MS = 45_000;
const PREF_KEY = "aeroforo-avisos-navegador";

function titleFor(from: Level, to: Level, station: Station) {
  const worse = LEVEL_ORDER.indexOf(to) > LEVEL_ORDER.indexOf(from);
  if (to === "rojo") return `Alerta roja en ${station.district}`;
  if (to === "verde") return `El aire mejoró en ${station.district}`;
  return worse ? `El aire empeoró en ${station.district}` : `El aire mejora en ${station.district}`;
}

function LevelToast({
  id,
  from,
  to,
  station,
  reading,
  metrics,
}: {
  id: string | number;
  from: Level;
  to: Level;
  station: Station;
  reading: Reading;
  metrics: Metric[];
}) {
  const info = LEVELS[to];
  const { driver } = overallLevel(reading, metrics);
  const m = metrics.find((x) => x.code === driver);
  return (
    <div
      role="alert"
      className="w-[min(380px,calc(100vw-24px))] overflow-hidden rounded-2xl border border-line bg-surface text-text shadow-[var(--shadow-float)]"
    >
      <div className="flex items-start gap-3 p-4 pb-3" style={{ background: info.soft }}>
        <Semaforo level={to} size="sm" />
        <div className="min-w-0 flex-1">
          <p className="text-[15px] font-semibold leading-snug" style={{ color: info.ink }}>
            {titleFor(from, to, station)}
          </p>
          <p className="mt-0.5 text-[13px] text-muted">
            Semáforo en <span className="font-medium" style={{ color: info.ink }}>{info.label.toLowerCase()}</span> · ICA{" "}
            <span className="tabular font-medium text-text">{reading.aqi}</span>
            {m && to !== "verde" && (
              <>
                {" "}· {m.name} {formatValue(driver, valueOf(reading, driver))} {m.unit}
              </>
            )}
          </p>
        </div>
        <button
          onClick={() => toast.dismiss(id)}
          aria-label="Cerrar aviso"
          className="pressable -mr-1 -mt-1 grid h-7 w-7 shrink-0 place-items-center rounded-full text-muted hover:bg-black/5 hover:text-text"
        >
          <X size={15} />
        </button>
      </div>
      <div className="px-4 pb-4 pt-3">
        <p className="eyebrow">Qué hacer ahora</p>
        <ul className="mt-2 space-y-1.5">
          {RECOMMENDATIONS[to].map((r) => (
            <li key={r} className="flex gap-2 text-[13px] leading-snug">
              <Check size={14} className="mt-0.5 shrink-0" style={{ color: info.color }} />
              <span>{r}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

/**
 * Vigila el semáforo de la estación seleccionada. Cuando cambia de color (y se mantiene
 * al menos CONFIRM_TICKS lecturas) muestra un aviso con recomendaciones y, si el usuario
 * lo permitió, una notificación del sistema cuando la pestaña no está visible.
 */
export function LevelAlerts() {
  const { selectedId, stations, metrics, latest, ready } = useAir();
  const reading = latest(selectedId);
  const station = stations.find((s) => s.id === selectedId);
  const [systemOn, setSystemOn] = useState(false);
  const watch = useRef<{ stationId: number; level: Level; candidate: Level | null; count: number; at: string; lastToast: number } | null>(null);

  useEffect(() => {
    try {
      if (localStorage.getItem(PREF_KEY) === "1" && "Notification" in window && Notification.permission === "granted") {
        // eslint-disable-next-line react-hooks/set-state-in-effect -- se lee una preferencia guardada al montar
        setSystemOn(true);
      }
    } catch {}
  }, []);

  useEffect(() => {
    if (!ready || !reading || !station) return;
    const w = watch.current;
    // Cambio de estación o primera lectura: solo se toma como referencia.
    if (!w || w.stationId !== station.id) {
      watch.current = { stationId: station.id, level: reading.level, candidate: null, count: 0, at: reading.recorded_at, lastToast: 0 };
      return;
    }
    if (w.at === reading.recorded_at) return;
    w.at = reading.recorded_at;

    if (reading.level === w.level) {
      w.candidate = null;
      w.count = 0;
      return;
    }
    // Pasar a rojo avisa de inmediato; los demás cambios esperan a confirmarse.
    w.count = w.candidate === reading.level ? w.count + 1 : 1;
    w.candidate = reading.level;
    if (reading.level !== "rojo" && w.count < CONFIRM_TICKS) return;
    const now = Date.now();
    if (reading.level !== "rojo" && w.level !== "rojo" && now - w.lastToast < COOLDOWN_MS) return;
    w.lastToast = now;

    const from = w.level;
    const to = reading.level;
    w.level = to;
    w.candidate = null;
    w.count = 0;

    const id = `nivel-${station.id}-${reading.recorded_at}`;
    toast.custom((t) => <LevelToast id={t} from={from} to={to} station={station} reading={reading} metrics={metrics} />, {
      id,
      duration: to === "rojo" ? 20000 : 9000,
    });

    if (systemOn && document.hidden && "Notification" in window && Notification.permission === "granted") {
      new Notification(titleFor(from, to, station), {
        body: `${LEVELS[to].label} · ICA ${reading.aqi}. ${RECOMMENDATIONS[to][0]}`,
        tag: `aeroforo-${station.id}`,
      });
    }
  }, [ready, reading, station, metrics, systemOn]);

  async function toggleSystem() {
    if (!("Notification" in window)) {
      toast("Tu navegador no admite notificaciones del sistema.");
      return;
    }
    if (systemOn) {
      setSystemOn(false);
      try { localStorage.setItem(PREF_KEY, "0"); } catch {}
      return;
    }
    const perm = Notification.permission === "granted" ? "granted" : await Notification.requestPermission();
    if (perm === "granted") {
      setSystemOn(true);
      try { localStorage.setItem(PREF_KEY, "1"); } catch {}
      toast.success("Avisos activados", { description: "Te avisaremos aunque estés en otra pestaña." });
    } else {
      toast("No se activaron los avisos", { description: "Puedes permitirlos desde la configuración del navegador." });
    }
  }

  return (
    <button
      onClick={toggleSystem}
      aria-pressed={systemOn}
      className={`pressable inline-flex h-9 items-center gap-1.5 rounded-full border px-3.5 text-sm font-medium ${
        systemOn ? "border-ink bg-ink text-white" : "border-line-strong bg-surface text-text hover:bg-surface-2"
      }`}
    >
      {systemOn ? <BellRing size={15} /> : <Bell size={15} />}
      {systemOn ? "Avisos activados" : "Activar avisos"}
    </button>
  );
}
