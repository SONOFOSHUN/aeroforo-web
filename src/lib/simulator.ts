import { aqiFromPm25, overallLevel } from "./air";
import type { Metric, Reading, Station } from "./types";

/** Hora decimal en Lima (UTC-5) para modelar las horas punta. */
function limaHour(date: Date): number {
  const utc = date.getUTCHours() + date.getUTCMinutes() / 60;
  return (utc - 5 + 24) % 24;
}

/** Intensidad de tránsito: picos a las 8 h y 19 h (misma curva que el seed de Supabase). */
function rush(h: number): number {
  return Math.exp(-((h - 8) ** 2) / 2) + 0.9 * Math.exp(-((h - 19) ** 2) / 2.5);
}

function target(station: Station, date: Date) {
  const h = limaHour(date);
  const r = rush(h);
  const p = station.pollution_profile;
  const daily = Math.sin(((h - 9) / 24) * 2 * Math.PI);
  return {
    pm25: (6 + 16 * r) * p,
    co2: 430 + (180 + 420 * r) * p * 0.6,
    co: (0.8 + 3.2 * r) * p * 0.8,
    temperature: 17 + 4 * daily,
    humidity: 78 - 9 * daily,
  };
}

const noise = (amp: number) => (Math.random() - 0.5) * amp;
const round = (v: number, d = 1) => Math.round(v * 10 ** d) / 10 ** d;

function finish(station: Station, date: Date, v: Omit<Reading, "station_id" | "recorded_at" | "aqi" | "level">, metrics: Metric[]): Reading {
  const base = {
    station_id: station.id,
    recorded_at: date.toISOString(),
    pm25: round(Math.max(2, v.pm25)),
    pm10: round(Math.max(4, v.pm10)),
    co2: Math.round(Math.max(410, v.co2)),
    co: round(Math.max(0.2, v.co), 2),
    temperature: round(v.temperature),
    humidity: round(Math.min(99, Math.max(30, v.humidity))),
  };
  const { level } = overallLevel(base, metrics);
  return { ...base, aqi: aqiFromPm25(base.pm25), level };
}

/** Historial de 24 h cada 10 min (solo cuando no hay Supabase). */
export function generateHistory(station: Station, metrics: Metric[], now = new Date()): Reading[] {
  const out: Reading[] = [];
  const start = now.getTime() - 24 * 3600_000;
  for (let t = start; t <= now.getTime(); t += 10 * 60_000) {
    const d = new Date(t);
    const tg = target(station, d);
    const pm25 = tg.pm25 + noise(6);
    out.push(
      finish(station, d, {
        pm25,
        pm10: pm25 * (1.7 + Math.random() * 0.4),
        co2: tg.co2 + noise(60),
        co: tg.co + noise(0.6),
        temperature: tg.temperature + noise(1),
        humidity: tg.humidity + noise(4),
      }, metrics),
    );
  }
  return out;
}

/** Estado de eventos puntuales por estación (p. ej. pasa un bus o una obra levanta polvo). */
const events = new Map<number, { left: number; total: number; boost: number }>();

/** Fuerza un pico de contaminación (botón de demo para la presentación). */
export function forceEvent(station: Station) {
  events.set(station.id, { left: 18, total: 18, boost: 70 + 25 * station.pollution_profile });
}

/**
 * Siguiente lectura "en vivo": camina aleatoriamente desde la anterior,
 * vuelve hacia el valor esperado para la hora y a veces sufre un pico de contaminación.
 */
export function nextReading(station: Station, prev: Reading, metrics: Metric[], now = new Date()): Reading {
  const tg = target(station, now);
  let ev = events.get(station.id);
  if (!ev && Math.random() < 0.03 * station.pollution_profile) {
    const total = 6 + Math.floor(Math.random() * 10);
    ev = { left: total, total, boost: 12 + Math.random() * 30 * station.pollution_profile };
    events.set(station.id, ev);
  }
  let boost = 0;
  if (ev) {
    boost = ev.boost * Math.sin((ev.left / ev.total) * Math.PI);
    ev.left -= 1;
    if (ev.left <= 0) events.delete(station.id);
  }
  const pull = 0.18;
  const pm25 = prev.pm25 + (tg.pm25 + boost - prev.pm25) * pull + noise(2.4);
  return finish(station, now, {
    pm25,
    pm10: prev.pm10 + (pm25 * 1.8 - prev.pm10) * 0.35 + noise(3),
    co2: prev.co2 + (tg.co2 + boost * 6 - prev.co2) * pull + noise(18),
    co: prev.co + (tg.co + boost * 0.08 - prev.co) * pull + noise(0.18),
    temperature: prev.temperature + (tg.temperature - prev.temperature) * 0.05 + noise(0.12),
    humidity: prev.humidity + (tg.humidity - prev.humidity) * 0.05 + noise(0.5),
  }, metrics);
}
