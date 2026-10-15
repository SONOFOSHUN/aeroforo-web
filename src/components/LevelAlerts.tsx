"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Bell, BellRing, Check, Maximize2, Minimize2, Star, X } from "lucide-react";
import { useAir } from "@/hooks/useAirData";
import { LEVELS, LEVEL_ORDER, RECOMMENDATIONS, formatValue, overallLevel, valueOf } from "@/lib/air";
import { useFavorites } from "@/lib/favorites";
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

interface ToastData {
  from: Level;
  to: Level;
  station: Station;
  reading: Reading;
  metrics: Metric[];
  favorite: boolean;
}

/** Muestra (o actualiza) un aviso. Ampliado, no se cierra solo: el usuario lo está leyendo. */
function showLevelToast(id: string, data: ToastData, expanded = false) {
  toast.custom((t) => <LevelToast id={t} data={data} expanded={expanded} />, {
    id,
    duration: expanded ? Infinity : data.to === "rojo" ? 20000 : 10000,
  });
}

function LevelToast({ id, data, expanded }: { id: string | number; data: ToastData; expanded: boolean }) {
  const { from, to, station, reading, metrics, favorite } = data;
  const info = LEVELS[to];
  const { driver } = overallLevel(reading, metrics);
  const m = metrics.find((x) => x.code === driver);
  const toggle = () => showLevelToast(String(id), data, !expanded);

  return (
    <div
      role="alert"
      onClick={(e) => {
        // En pantallas grandes, un clic en el aviso lo amplía para leerlo mejor
        if (window.matchMedia("(min-width: 640px)").matches && !(e.target as Element).closest("button")) toggle();
      }}
      className={`level-toast overflow-hidden rounded-2xl border border-line bg-surface text-text shadow-[var(--shadow-float)] sm:cursor-zoom-in ${
        expanded ? "is-expanded sm:cursor-zoom-out" : ""
      }`}
    >
      <div className="toast-head flex items-start gap-3" style={{ background: info.soft }}>
        <Semaforo level={to} size={expanded ? "md" : "sm"} />
        <div className="min-w-0 flex-1">
          <p className="toast-title flex items-center gap-1.5 font-semibold leading-snug" style={{ color: info.ink }}>
            {favorite && <Star size={14} className="shrink-0 fill-amber text-amber" aria-label="Distrito favorito" />}
            {titleFor(from, to, station)}
          </p>
          <p className="toast-sub mt-0.5 text-muted">
            Semáforo en <span className="font-medium" style={{ color: info.ink }}>{info.label.toLowerCase()}</span> · ICA{" "}
            <span className="tabular font-medium text-text">{reading.aqi}</span>
            {m && to !== "verde" && (
              <>
                {" "}· {m.name} {formatValue(driver, valueOf(reading, driver))} {m.unit}
              </>
            )}
          </p>
        </div>
        <div className="-mr-1.5 -mt-1 flex shrink-0 items-center">
          <button
            onClick={toggle}
            aria-label={expanded ? "Reducir aviso" : "Ampliar aviso"}
            title={expanded ? "Reducir" : "Ampliar para leer mejor"}
            className="pressable hidden h-8 w-8 place-items-center rounded-full text-muted hover:bg-hover hover:text-text sm:grid"
          >
            {expanded ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
          </button>
          <button
            onClick={() => toast.dismiss(id)}
            aria-label="Cerrar aviso"
            className="pressable grid h-8 w-8 place-items-center rounded-full text-muted hover:bg-hover hover:text-text"
          >
            <X size={16} />
          </button>
        </div>
      </div>
      <div className="toast-body">
        <p className="eyebrow">Qué hacer ahora</p>
        <ul className="toast-list mt-2">
          {RECOMMENDATIONS[to].map((r) => (
            <li key={r} className="flex leading-snug">
              <Check className="toast-check shrink-0" style={{ color: info.color }} />
              <span>{r}</span>
            </li>
          ))}
        </ul>
        {expanded && (
          <p className="mt-4 border-t border-line pt-3 text-[13px] text-muted">
            {station.name} · {station.zone} · {info.detail}
          </p>
        )}
      </div>
    </div>
  );
}

interface Watch {
  level: Level;
  candidate: Level | null;
  count: number;
  at: string;
  lastToast: number;
}

/**
 * Vigila el semáforo de la estación seleccionada y de los distritos favoritos. Cuando uno
 * cambia de color (y se mantiene), muestra un aviso con recomendaciones y, si el usuario lo
 * permitió, una notificación del sistema mientras la pestaña no está visible.
 */
export function LevelAlerts() {
  const { selectedId, stations, metrics, latest, ready, live } = useAir();
  const favorites = useFavorites();
  const [systemOn, setSystemOn] = useState(false);
  const watch = useRef(new Map<number, Watch>());

  useEffect(() => {
    try {
      if (localStorage.getItem(PREF_KEY) === "1" && "Notification" in window && Notification.permission === "granted") {
        // eslint-disable-next-line react-hooks/set-state-in-effect -- se lee una preferencia guardada al montar
        setSystemOn(true);
      }
    } catch {}
  }, []);

  useEffect(() => {
    if (!ready) return;
    const ids = new Set([selectedId, ...favorites]);
    const now = Date.now();
    // Dejar de vigilar lo que ya no está seleccionado ni es favorito
    for (const id of watch.current.keys()) if (!ids.has(id)) watch.current.delete(id);

    for (const id of ids) {
      const station = stations.find((s) => s.id === id);
      const reading = latest(id);
      if (!station || !reading) continue;
      const w = watch.current.get(id);
      // Primera vez que se vigila: solo se toma como referencia
      if (!w) {
        watch.current.set(id, { level: reading.level, candidate: null, count: 0, at: reading.recorded_at, lastToast: 0 });
        continue;
      }
      if (w.at === reading.recorded_at) continue;
      w.at = reading.recorded_at;
      if (reading.level === w.level) {
        w.candidate = null;
        w.count = 0;
        continue;
      }
      // Pasar a rojo avisa de inmediato; los demás cambios esperan a confirmarse.
      w.count = w.candidate === reading.level ? w.count + 1 : 1;
      w.candidate = reading.level;
      if (reading.level !== "rojo" && w.count < CONFIRM_TICKS) continue;
      if (reading.level !== "rojo" && w.level !== "rojo" && now - w.lastToast < COOLDOWN_MS) continue;

      const from = w.level;
      const to = reading.level;
      Object.assign(w, { level: to, candidate: null, count: 0, lastToast: now });

      showLevelToast(`nivel-${id}-${reading.recorded_at}`, {
        from,
        to,
        station,
        reading,
        metrics,
        favorite: favorites.includes(id),
      });

      if (systemOn && document.hidden && "Notification" in window && Notification.permission === "granted") {
        new Notification(titleFor(from, to, station), {
          body: `${LEVELS[to].label} · ICA ${reading.aqi}. ${RECOMMENDATIONS[to][0]}`,
          tag: `aeroforo-${id}`,
        });
      }
    }
  }, [ready, live, selectedId, favorites, stations, metrics, latest, systemOn]);

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
        systemOn ? "border-ink bg-ink text-on-ink" : "border-line-strong bg-surface text-text hover:bg-surface-2"
      }`}
    >
      {systemOn ? <BellRing size={15} /> : <Bell size={15} />}
      {systemOn ? "Avisos activados" : "Activar avisos"}
    </button>
  );
}
